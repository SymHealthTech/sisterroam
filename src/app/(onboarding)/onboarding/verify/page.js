"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import DocumentUpload from "@/components/ui/DocumentUpload";
import Logo from "@/components/ui/Logo";
import {
  CheckCircle,
  Lock,
  Tag,
  XCircle,
  AlertCircle,
  ChevronDown,
  Search,
} from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

const VideoCapture = dynamic(() => import("@/components/ui/VideoCapture"), {
  loading: () => null,
  ssr: false,
});

/* ── PWA helpers ─────────────────────────────────────────── */

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((r) => r.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}
function setCookie(name, value, maxAge) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
function deleteCookie(name) {
  document.cookie = `${name}=; path=/; max-age=0`;
}
function isPwaStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

/* ── Step indicator ──────────────────────────────────────── */

function StepIndicator({ current }) {
  const steps = ["Country", "Documents", "Payment"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  done
                    ? "bg-brand text-white"
                    : active
                      ? "bg-brand text-white ring-4 ring-brand/20"
                      : "bg-gray-100 text-gray-400",
                )}
              >
                {done ? <CheckCircle className="w-4 h-4" /> : num}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-brand" : "text-gray-400",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-12 h-0.5 mb-4 transition-colors",
                  done ? "bg-brand" : "bg-gray-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Country select ──────────────────────────────────────── */

function CountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);
  const filtered = COUNTRY_NAMES.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function close(e) {
      if (!e.target.closest("[data-country-select]")) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div data-country-select className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full h-[48px] flex items-center justify-between px-4 rounded-xl border-2 bg-white text-sm transition-colors",
          open ? "border-brand ring-4 ring-brand/10" : "border-gray-200",
          value ? "text-gray-900" : "text-gray-400",
        )}
      >
        <span>{value || "Select your country"}</span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="flex items-center gap-2 px-2 h-9 border border-gray-200 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="flex-1 text-sm outline-none placeholder:text-gray-400 bg-transparent"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50",
                  value === name && "text-brand font-semibold bg-brand-lighter/30",
                )}
              >
                {name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-4 text-sm text-gray-400 text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Payment step ────────────────────────────────────────── */

function PaymentStep({
  country,
  sessionUser,
  idFrontUrl,
  idFrontPubId,
  idBackUrl,
  idBackPubId,
  videoUrl,
  videoPubId,
  onSuccess,
  onPayAttempt,
  isProcessing,
  onCheckStatus,
}) {
  const [promoInput, setPromoInput] = useState("");
  const [promoState, setPromoState] = useState("idle");
  const [promoType, setPromoType] = useState(null);
  const [promoIsFree, setPromoIsFree] = useState(false);
  const [promoError, setPromoError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isActivatingPromo, setIsActivatingPromo] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [promoActivateError, setPromoActivateError] = useState(null);

  const currency = country === "India" ? "INR" : "USD";
  // Full price: ₹299/INR, $7/USD. Discount price: ₹199/INR, $5/USD.
  const fullPrice = currency === "INR" ? "₹299" : "$7";
  const discountPrice = currency === "INR" ? "₹199" : "$5";
  const methods = currency === "INR" ? "UPI · Cards · Net Banking" : "Cards · International";
  const isPromoValid = promoState === "valid";
  // Effective displayed price: discount when a discount promo is applied, full otherwise
  const price = (isPromoValid && !promoIsFree) ? discountPrice : fullPrice;

  async function submitDocs() {
    const res = await fetch("/api/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country,
        idDocumentUrl: idFrontUrl,
        idDocumentPublicId: idFrontPubId,
        idDocumentBackUrl: idBackUrl,
        idDocumentBackPublicId: idBackPubId,
        selfieVideoUrl: videoUrl || undefined,
        selfieVideoPublicId: videoPubId || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error ?? "Failed to submit documents");
    }
  }

  async function handleValidatePromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setIsValidating(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoState("valid");
        setPromoType(data.type);
        setPromoIsFree(data.isFree);
      } else {
        setPromoState("invalid");
        setPromoError(data.error);
      }
    } catch {
      setPromoState("invalid");
      setPromoError("Could not validate code. Try again.");
    } finally {
      setIsValidating(false);
    }
  }

  async function handlePromoActivate() {
    setIsActivatingPromo(true);
    setPromoActivateError(null);
    try {
      await submitDocs();
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onSuccess();
    } catch (err) {
      setPromoActivateError(err.message || "Something went wrong.");
    } finally {
      setIsActivatingPromo(false);
    }
  }

  async function handlePay() {
    onPayAttempt?.();
    setIsCreatingPayment(true);
    setPaymentError(null);
    try {
      if (idFrontUrl && idBackUrl) await submitDocs();
      const payBody = { currency };
      // Attach discount promo code so the server can select the discounted product
      if (isPromoValid && !promoIsFree) {
        payBody.promoCode = promoInput.trim().toUpperCase();
      }
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payBody),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (!data.paymentUrl) throw new Error("No payment URL received. Please try again.");
      if (isPwaStandalone()) setCookie("sr_pwa_checkout", "1", 600);
      window.location.assign(data.paymentUrl);
    } catch (err) {
      setPaymentError(err.message || "Something went wrong. Please try again.");
      setIsCreatingPayment(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">One-time verification fee</h2>
        <p className="text-sm text-gray-500">Pay once — access the platform under admin review</p>
      </div>

      {/* Pricing card — hidden only when a free promo is applied */}
      {!(isPromoValid && promoIsFree) && (
        <div className="flex flex-col items-center gap-1.5 p-5 rounded-2xl border-2 border-brand bg-brand-lighter/20 text-center">
          {isPromoValid && !promoIsFree && (
            <span className="text-sm line-through text-gray-400">{fullPrice}</span>
          )}
          <span className="text-3xl font-bold text-brand">{price}</span>
          <span className="text-xs text-gray-500">{methods}</span>
          <span className="text-[11px] text-gray-400 mt-1">
            Non-refundable · Unlocks app access while verification is reviewed
          </span>
        </div>
      )}

      {/* Promo code */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5" />
          Have a promo code?
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoInput}
            onChange={(e) => {
              setPromoInput(e.target.value.toUpperCase());
              if (promoState !== "idle") {
                setPromoState("idle");
                setPromoError(null);
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && !isPromoValid && handleValidatePromo()}
            placeholder="Enter code"
            disabled={isPromoValid}
            maxLength={20}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand disabled:bg-gray-50 font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
          />
          {!isPromoValid ? (
            <Button size="sm" variant="secondary" onClick={handleValidatePromo} loading={isValidating} disabled={!promoInput.trim()}>
              Apply
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => { setPromoState("idle"); setPromoInput(""); setPromoType(null); setPromoIsFree(false); setPromoError(null); }}
              className="text-xs text-gray-400 hover:text-danger px-2 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        {isPromoValid && (
          <div className="flex items-center gap-2 p-2.5 bg-teal-lighter/60 rounded-xl">
            <CheckCircle className="w-4 h-4 text-teal shrink-0" />
            <p className="text-xs text-teal font-medium">
              {promoIsFree
                ? "Code applied — verification fee waived!"
                : `Partner code applied — discounted to ${discountPrice}`}
            </p>
          </div>
        )}
        {promoState === "invalid" && promoError && (
          <p className="text-xs text-danger">{promoError}</p>
        )}
      </div>

      {/* CTA */}
      <div className="space-y-2">
        {isProcessing ? (
          <Button fullWidth size="lg" onClick={onCheckStatus}>
            Check payment status
          </Button>
        ) : (isPromoValid && promoIsFree) ? (
          <Button fullWidth size="lg" loading={isActivatingPromo} onClick={handlePromoActivate}>
            {isActivatingPromo ? "Activating…" : "Activate — Free"}
          </Button>
        ) : (
          <Button fullWidth size="lg" loading={isCreatingPayment} onClick={handlePay}>
            {isCreatingPayment ? "Creating secure payment…" : `Pay ${price} & Continue`}
          </Button>
        )}
        {(paymentError || promoActivateError) && (
          <div className="flex items-center gap-2 p-3 bg-danger-lighter rounded-xl">
            <XCircle className="w-4 h-4 text-danger shrink-0" />
            <p className="text-xs text-danger">{paymentError || promoActivateError}</p>
          </div>
        )}
        {!isPromoValid && (
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">Secure payment via Dodo Payments</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function VerifyPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("payment");

  // isPwaReturnInBrowser and shouldActivate depend on cookies (document-only), so they
  // must be false on SSR and computed in an effect — avoids hydration mismatch.
  const [isPwaReturnInBrowser, setIsPwaReturnInBrowser] = useState(false);
  const [shouldActivate, setShouldActivate] = useState(false);

  // paymentResult comes from useSearchParams which is SSR-consistent, so it is safe
  // to use directly in useState — server and client see the same URL value.
  const [step, setStep] = useState(paymentResult === "cancelled" ? 3 : 1);

  useEffect(() => {
    // Restore country from before the Dodo redirect so currency shows correctly.
    // localStorage persists across external navigation (unlike sessionStorage on iOS Safari).
    const savedCountry = localStorage.getItem("sr_verify_country");
    if (savedCountry) setCountry(savedCountry);

    const pwa = isPwaStandalone();
    if ((paymentResult === "return" || paymentResult === "cancelled") && !pwa && getCookie("sr_pwa_checkout")) {
      deleteCookie("sr_pwa_checkout");
      if (paymentResult === "return") setCookie("sr_payment_result", "return", 3600);
      setIsPwaReturnInBrowser(true);
      return;
    }
    if (pwa && getCookie("sr_payment_result") === "return") {
      deleteCookie("sr_payment_result");
      setShouldActivate(true);
      return;
    }
    if (paymentResult === "return") setShouldActivate(true);
    setInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [country, setCountry] = useState("");
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idFrontPubId, setIdFrontPubId] = useState("");
  const [idFrontDone, setIdFrontDone] = useState(false);
  const [idBackUrl, setIdBackUrl] = useState("");
  const [idBackPubId, setIdBackPubId] = useState("");
  const [idBackDone, setIdBackDone] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPubId, setVideoPubId] = useState("");
  const [activating, setActivating] = useState(false);
  const [paymentFailedMessage, setPaymentFailedMessage] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Redirect already-paid/verified users — also handles stale JWT
  useEffect(() => {
    if (status !== "authenticated") return;
    const sessionTier = session.user.verificationTier;

    if (sessionTier === "paid" || sessionTier === "verified" || sessionTier === "trusted") {
      router.replace(session.user.onboardingCompleted ? "/feed" : "/onboarding/profile");
      return;
    }

    // JWT may be stale (left site after payment before session was refreshed)
    fetch("/api/users")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.success) return;
        const dbTier = d.data.verificationTier;
        if (dbTier === "paid" || dbTier === "verified" || dbTier === "trusted") {
          await updateSession({ verificationTier: dbTier });
          router.replace(d.data.onboardingCompleted ? "/feed" : "/onboarding/profile");
        }
      })
      .catch(() => {});
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runActivate() {
    setActivating(true);
    let redirecting = false;
    try {
      const res = await fetch("/api/payments/activate", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        redirecting = true;
        localStorage.removeItem("sr_verify_country");
        if (!data.onboardingCompleted) sessionStorage.setItem("sr_show_welcome", "1");
        await updateSession({ verificationTier: data.verificationTier || "paid" });
        router.replace(data.onboardingCompleted ? "/feed" : "/onboarding/profile");
      } else {
        const msg = data.error ?? "Activation failed. Contact support.";
        setPaymentFailedMessage(msg);
        setPaymentProcessing(!!data.processing);
        setStep(3);
        if (data.processing) {
          toast(msg, { icon: "⏳" });
        } else {
          toast.error(msg);
        }
      }
    } catch {
      setPaymentFailedMessage("Network error. Please try again.");
      setPaymentProcessing(false);
      setStep(3);
      toast.error("Network error. Please try again.");
    } finally {
      // Keep the loading state active if navigation was triggered — clearing it
      // before the route change completes would flash step 1 for one frame.
      if (!redirecting) {
        setActivating(false);
        setShouldActivate(false);
      }
    }
  }

  // Activate after successful payment
  useEffect(() => {
    if (!shouldActivate) return;
    runActivate();
  }, [shouldActivate]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDocUpload({ documentType, url, publicId }) {
    if (documentType === "id_front") {
      setIdFrontUrl(url); setIdFrontPubId(publicId); setIdFrontDone(true);
    } else {
      setIdBackUrl(url); setIdBackPubId(publicId); setIdBackDone(true);
    }
  }

  function handleVideoUpload({ url, publicId }) {
    setVideoUrl(url); setVideoPubId(publicId);
  }

  async function handlePaymentSuccess() {
    sessionStorage.setItem("sr_show_welcome", "1");
    // Update JWT immediately so AppLayout never sees stale 'basic' tier on next page
    await updateSession({ verificationTier: "paid" }).catch(() => {});
    router.replace("/onboarding/profile");
  }

  if (status === "loading" || ((paymentResult === "return" || paymentResult === "cancelled") && !initialized) || shouldActivate || activating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">{shouldActivate || activating ? "Verifying payment…" : "Loading…"}</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.replace("/login");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // PWA bridge screen
  if (isPwaReturnInBrowser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-20 h-20 bg-brand-lighter rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-brand" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-gray-900">Checkout complete</p>
            <p className="text-sm text-gray-500">Return to the SisterRoam app to confirm your payment.</p>
          </div>
          <a
            href="/onboarding/verify"
            className="w-full block bg-brand text-white text-sm font-semibold py-3.5 px-6 rounded-2xl text-center"
          >
            Open SisterRoam app
          </a>
        </div>
      </div>
    );
  }

  // Payment cancelled state
  const showCancelledBanner = paymentResult === "cancelled" && step === 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Logo variant="icon" theme="light" size="sm" href="/" />
          <span className="text-xs text-gray-400 font-medium">Identity Verification</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 pb-16">
        <StepIndicator current={step} />


        {/* ── STEP 1: Country ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Where are you from?</h1>
              <p className="text-sm text-gray-500">
                This determines your payment method and required documents
              </p>
            </div>

            <CountrySelect value={country} onChange={setCountry} />

            <Button
              fullWidth
              disabled={!country}
              onClick={() => {
                localStorage.setItem("sr_verify_country", country);
                setStep(2);
              }}
            >
              Continue
            </Button>
          </div>
        )}

        {/* ── STEP 2: Documents ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">Upload your ID</h1>
              <p className="text-sm text-gray-500">
                Government-issued ID required for safety verification
              </p>
            </div>

            {/* Accepted docs */}
            <div className="p-4 bg-brand-lighter/30 rounded-2xl text-xs text-gray-700 space-y-1.5">
              <p className="font-semibold text-brand">Accepted documents</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                <li>Passport (photo page)</li>
                <li>National ID card (front &amp; back)</li>
                <li>Driver&apos;s licence (front &amp; back)</li>
              </ul>
            </div>

            {/* ID Front + Back */}
            <DocumentUpload onUploadComplete={handleDocUpload} />

            {/* Video selfie — required */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800">Video selfie</p>
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed">
                <p className="font-medium text-gray-700 mb-0.5">What to say:</p>
                <p>
                  &quot;Hi, my name is [name], I&apos;m from [country], and I&apos;m joining SisterRoam.&quot;
                  Hold your ID next to your face. Min 10 seconds.
                </p>
              </div>
              <VideoCapture
                userId={session?.user?.id}
                onUploadComplete={handleVideoUpload}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!idFrontDone || !idBackDone || !videoUrl}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 3 && (
          <div className="space-y-6">
            {showCancelledBanner && (
              <div className="flex items-start gap-3 p-4 bg-amber-lighter border border-amber/30 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-dark">Payment was cancelled</p>
                  <p className="text-xs text-amber-dark/80 mt-0.5">No charge was made. You can try again below.</p>
                </div>
              </div>
            )}
            {paymentFailedMessage && (
              paymentProcessing ? (
                <div className="flex items-start gap-3 p-4 bg-amber-lighter border border-amber/30 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-dark">Payment still processing</p>
                    <p className="text-xs text-amber-dark/80 mt-0.5">{paymentFailedMessage}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-danger-lighter border border-danger/30 rounded-2xl">
                  <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-danger">Payment failed</p>
                    <p className="text-xs text-danger/80 mt-0.5">{paymentFailedMessage}</p>
                  </div>
                </div>
              )
            )}

            <PaymentStep
              country={country}
              sessionUser={session?.user}
              idFrontUrl={idFrontUrl}
              idFrontPubId={idFrontPubId}
              idBackUrl={idBackUrl}
              idBackPubId={idBackPubId}
              videoUrl={videoUrl}
              videoPubId={videoPubId}
              onSuccess={handlePaymentSuccess}
              onPayAttempt={() => { setPaymentFailedMessage(null); setPaymentProcessing(false); }}
              isProcessing={paymentProcessing}
              onCheckStatus={runActivate}
            />

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back to documents
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
