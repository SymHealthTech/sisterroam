"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { XCircle, Mail, RefreshCw } from "lucide-react";

export default function VerificationRejectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/verification/status")
      .then((r) => r.json())
      .then((d) => {
        const notes = d.data?.verification?.reviewerNotes;
        if (notes) setReason(notes);
        // If verif is no longer rejected (e.g. admin re-opened), send back to feed
        const vs = d.data?.verification?.status;
        if (vs !== "rejected") router.replace("/feed");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userEmail = session?.user?.email ?? "";
  const firstName = (session?.user?.fullName ?? "").split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="icon" theme="light" size="md" href="/" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-danger-lighter rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-danger" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">
              Verification not approved
            </h1>
            <p className="text-sm text-gray-500">
              Hi {firstName}, unfortunately we could not approve your identity
              verification at this time.
            </p>
          </div>

          {/* Reason box */}
          {reason && (
            <div className="bg-danger-lighter/60 border border-danger/20 rounded-xl p-4 text-left space-y-1">
              <p className="text-xs font-semibold text-danger uppercase tracking-wide">
                Reason provided by admin
              </p>
              <p className="text-sm text-danger-dark">{reason}</p>
            </div>
          )}

          {/* Email notice */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl text-left">
            <Mail className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                We&apos;ll contact you by email
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Our team will reach out to{" "}
                <span className="font-medium text-gray-700">{userEmail}</span>{" "}
                with next steps or additional information required.
              </p>
            </div>
          </div>

          {/* Common reasons */}
          <div className="text-left space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Common reasons for rejection
            </p>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {[
                "ID image was blurry or partially cut off",
                "Document does not match the name on the account",
                "Uploaded document is expired",
                "Video selfie was unclear or did not show the ID",
              ].map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mt-1.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact support */}
          <a
            href="mailto:admin.sisterroam@gmail.com"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-brand text-brand text-sm font-semibold hover:bg-brand hover:text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact support
          </a>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center justify-center gap-2 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
