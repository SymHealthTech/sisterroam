"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Toggle from "@/components/ui/Toggle";
import Skeleton from "@/components/ui/Skeleton";
import {
  ChevronDown,
  AlertTriangle,
  Check,
  User,
  Bell,
  Eye,
  Globe,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Lock,
} from "lucide-react";

/* ── Section wrapper ─────────────────────────────────────── */

function SettingsSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

/* ── Expandable account row ──────────────────────────────── */

function AccountRow({ label, value, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {value && <p className="text-xs text-gray-500 mt-0.5">{value}</p>}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="px-5 pb-5 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Role card ───────────────────────────────────────────── */

function RoleCard({ value, label, description, icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all w-full",
        selected
          ? "border-brand bg-brand-lighter"
          : "border-gray-100 hover:border-gray-200",
      )}
    >
      <span className="text-2xl mt-0.5">{icon}</span>
      <div>
        <p
          className={cn(
            "text-sm font-semibold",
            selected ? "text-brand" : "text-gray-900",
          )}
        >
          {label}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      {selected && (
        <Check className="w-4 h-4 text-brand ml-auto shrink-0 mt-0.5" />
      )}
    </button>
  );
}

/* ── Confirm dialog ──────────────────────────────────────── */

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [verif, setVerif] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'deactivate' | 'delete' }

  // Phone
  const [phoneInput, setPhoneInput] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  // Account form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Role
  const [role, setRole] = useState("guest");
  const [savingRole, setSavingRole] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState({
    newRequest: true,
    requestAccepted: true,
    requestDeclined: true,
    newMessage: true,
    checkinReminder: true,
    reviewReceived: true,
    verificationUpdate: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Language & currency
  const [displayLang, setDisplayLang] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("sr_lang") ?? "English")
      : "English",
  );

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        const u = d.data;
        setUserData(u);
        setRole(u.role ?? "guest");
        if (u.emailNotifications)
          setNotifs((n) => ({ ...n, ...u.emailNotifications }));
        // Derive & persist currency from country
        const curr = u.country === "India" ? "INR" : "USD";
        localStorage.setItem("sr_currency", curr);
      })
      .finally(() => setLoading(false));

    fetch("/api/verification/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVerif(d.data.verification);
      });
  }, []);

  async function patchUser(fields) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    return res.json();
  }

  const PHONE_RE = /^\+[1-9]\d{6,14}$/;

  async function handlePhoneChange() {
    const phone = phoneInput.trim();
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }
    if (!PHONE_RE.test(phone)) {
      toast.error("Include country code (e.g. +919876543210)");
      return;
    }
    setSavingPhone(true);
    try {
      const d = await patchUser({ phone });
      if (d.success) {
        setUserData((prev) => ({ ...prev, phone }));
        setPhoneInput("");
        toast.success("Phone number updated!");
      } else {
        toast.error(d.error ?? "Failed to update phone");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingPhone(false);
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    if (!newPassword || newPassword.length < 8 || !/\d/.test(newPassword)) {
      toast.error("New password must be at least 8 characters with a number");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success("Password updated!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(d.error ?? "Failed to update password");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleRoleSave() {
    setSavingRole(true);
    try {
      const d = await patchUser({ role });
      if (d.success) {
        toast.success("Role updated!");
      } else toast.error(d.error ?? "Failed");
    } catch {
      toast.error("Network error");
    } finally {
      setSavingRole(false);
    }
  }

  async function handleNotifToggle(key, val) {
    const next = { ...notifs, [key]: val };
    setNotifs(next);
    setSavingNotifs(true);
    try {
      await patchUser({ emailNotifications: next });
    } catch {
      toast.error("Could not save preferences");
    } finally {
      setSavingNotifs(false);
    }
  }

  function handleDisplaySave() {
    localStorage.setItem("sr_lang", displayLang);
    toast.success("Display preferences saved");
  }

  async function handleDeactivate() {
    await patchUser({ isActive: false });
    toast("Account deactivated. Signing you out…");
    setTimeout(() => signOut({ callbackUrl: "/" }), 1500);
    setConfirm(null);
  }

  async function handleDelete() {
    const toastId = toast.loading("Deleting your account…");
    try {
      const res = await fetch('/api/users/delete-account', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Deletion failed');
      toast.success("Account deleted.", { id: toastId });
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      toast.error(err.message, { id: toastId });
      setConfirm(null);
    }
  }

  if (loading) {
    return (
      <AppLayout title="Settings">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="card" className="h-40" />
          ))}
        </div>
      </AppLayout>
    );
  }

  const NOTIF_LABELS = [
    { key: "newRequest", label: "New stay requests" },
    { key: "requestAccepted", label: "Request accepted" },
    { key: "requestDeclined", label: "Request declined" },
    { key: "newMessage", label: "New messages" },
    { key: "checkinReminder", label: "Safety check-in reminders" },
    { key: "reviewReceived", label: "Reviews received" },
    { key: "verificationUpdate", label: "Verification updates" },
  ];

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-10 space-y-4">
        {/* Account */}
        <SettingsSection title="Account" icon={User}>
          <AccountRow label="Email address" value={userData?.email}>
            <p className="text-sm text-gray-600">
              To change your email address please contact{" "}
              <span className="text-brand font-medium">
                hello@sisterroam.com
              </span>
            </p>
          </AccountRow>

          <AccountRow
            label="Phone number"
            value={
              userData?.phone
                ? userData.phone.replace(/(\+\d{2})\d+(\d{4})/, "$1••••$2")
                : "Not added"
            }
          >
            <p className="text-xs text-gray-500 mb-3">
              Include country code, e.g. +919876543210
            </p>
            <Input
              label={userData?.phone ? "New phone number" : "Phone number"}
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+919876543210"
            />
            <Button size="sm" loading={savingPhone} onClick={handlePhoneChange}>
              {userData?.phone ? "Change phone" : "Save phone number"}
            </Button>
          </AccountRow>

          <AccountRow label="Password" value="••••••••">
            <div className="space-y-3">
              <Input
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
              />
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters with a number"
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
              <Button
                size="sm"
                loading={savingPassword}
                onClick={handlePasswordChange}
              >
                Update password
              </Button>
            </div>
          </AccountRow>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Email notifications" icon={Bell}>
          <div className="px-5 py-4 space-y-4">
            {savingNotifs && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-teal" /> Saving…
              </p>
            )}
            {NOTIF_LABELS.map(({ key, label }) => (
              <Toggle
                key={key}
                checked={notifs[key] ?? true}
                onChange={(val) => handleNotifToggle(key, val)}
                label={label}
              />
            ))}
          </div>
        </SettingsSection>

        {/* Role */}
        <SettingsSection title="My role" icon={Briefcase}>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-gray-500">
              Your role determines what you can do on SisterRoam.
            </p>
            {[
              {
                value: "guest",
                label: "Traveller",
                icon: "✈️",
                description: "Browse hosts and send stay requests",
              },
              {
                value: "host",
                label: "Host",
                icon: "🏠",
                description: "List your space and receive guests",
              },
              {
                value: "both",
                label: "Host & Traveller",
                icon: "🌍",
                description: "Do both — host and travel",
              },
            ].map((r) => (
              <RoleCard
                key={r.value}
                {...r}
                selected={role === r.value}
                onClick={setRole}
              />
            ))}
            <Button
              size="sm"
              loading={savingRole}
              onClick={handleRoleSave}
              disabled={role === userData?.role}
            >
              Save role
            </Button>
          </div>
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy" icon={Eye}>
          <div className="px-5 py-4 space-y-1">
            <p className="text-xs text-gray-500 mb-4">
              Your profile is visible to verified SisterRoam members only.
              Public pages (browse, host profiles) show limited info to
              everyone.
            </p>
            {[
              { label: "Show countries visited on profile" },
              { label: "Show social media links on profile" },
            ].map(({ label }) => (
              <Toggle
                key={label}
                checked
                label={label}
                onChange={() => toast("Privacy settings coming soon")}
              />
            ))}
          </div>
        </SettingsSection>

        {/* Language & currency */}
        <SettingsSection title="Language & currency" icon={Globe}>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                Display language
              </label>
              <select
                value={displayLang}
                onChange={(e) => setDisplayLang(e.target.value)}
                className="w-full h-[44px] sm:h-[40px] px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                {[
                  "English",
                  "Hindi",
                  "Spanish",
                  "French",
                  "Arabic",
                  "Portuguese",
                  "German",
                ].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                Display currency
              </label>
              <div className="w-full h-[44px] sm:h-[40px] px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 flex items-center">
                {userData?.country === "India" ? "INR (₹)" : "USD ($)"}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Determined by your country ({userData?.country ?? "not set"})
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleDisplaySave}>
              Save preferences
            </Button>
          </div>
        </SettingsSection>

        {/* Payment gateway — visible only after admin approves KYC */}
        {verif?.status === "approved" &&
          userData?.verificationTier === "basic" && (
            <SettingsSection title="Activate verified badge" icon={CreditCard}>
              <div className="px-5 py-5 space-y-4">
                <p className="text-xs text-gray-500">
                  Your identity has been verified by our team. Complete the
                  one-time payment below to activate your verified badge.
                </p>

                {userData?.country === "India" ? (
                  <div className="border-2 border-brand rounded-2xl p-4 space-y-3 bg-brand-lighter/20">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🇮🇳</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          India
                        </p>
                        <p className="text-xs text-gray-500">
                          UPI · Cards · Net Banking
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-brand ml-auto">
                        ₹199
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      One-time payment — never expires — unlocks full platform
                      access
                    </p>
                    <Button
                      fullWidth
                      onClick={() => router.push("/profile/verification")}
                    >
                      Pay ₹199 &amp; activate badge
                    </Button>
                    <div className="flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        Secure payment via Dodo Payments
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-brand rounded-2xl p-4 space-y-3 bg-brand-lighter/20">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🌍</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          International
                        </p>
                        <p className="text-xs text-gray-500">
                          Cards · International
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-brand ml-auto">
                        $5
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      One-time payment — never expires — unlocks full platform
                      access
                    </p>
                    <Button
                      fullWidth
                      onClick={() => router.push("/profile/verification")}
                    >
                      Pay $5 &amp; activate badge
                    </Button>
                    <div className="flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        Secure payment via Dodo Payments
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 bg-teal-lighter/40 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-teal shrink-0" />
                  <p className="text-xs text-gray-700">
                    Your verified badge lets you send and receive hosting
                    requests
                  </p>
                </div>
              </div>
            </SettingsSection>
          )}

        {/* Danger zone */}
        <div className="bg-white border border-danger/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-danger/10">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <h2 className="text-sm font-semibold text-danger">Danger zone</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Deactivate account
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Hide your profile and pause all activity
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirm({ type: "deactivate" })}
              >
                Deactivate
              </Button>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-danger">
                  Delete account
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently remove all your data
                </p>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirm({ type: "delete" })}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="pb-4">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
      </div>

      {/* Confirm dialogs */}
      {confirm?.type === "deactivate" && (
        <ConfirmDialog
          title="Deactivate your account?"
          message="Your profile will be hidden and you won't receive messages. You can reactivate any time by signing in."
          confirmLabel="Yes, deactivate"
          onConfirm={handleDeactivate}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === "delete" && (
        <ConfirmDialog
          title="Delete your account permanently?"
          message="This will permanently remove all your data — messages, stories, trips, reviews, and community posts. This cannot be undone."
          confirmLabel="Yes, delete my account"
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </AppLayout>
  );
}
