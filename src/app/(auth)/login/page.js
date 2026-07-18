"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Logo from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  async function onSubmit(data) {
    setLoading(true);
    setAuthError("");
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      // Auth.js v5 (beta) returns `ok: true` even for a failed credentials
      // sign-in and signals the failure via `result.error` (the callback
      // responds HTTP 200 with an error in the URL). So we must key off
      // `error`, not `ok` — otherwise a wrong email/password silently falls
      // through to the redirect below instead of showing a warning.
      if (result?.error || !result?.ok) {
        setAuthError(
          result?.error
            ? "Invalid email or password. Please try again."
            : "Login failed. Please try again.",
        );
        return;
      }

      // Fetch fresh session to check onboardingCompleted
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      if (sessionData?.user?.onboardingCompleted) {
        router.replace("/feed");
      } else {
        router.replace("/onboarding/profile");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo variant="stacked" theme="light" size="lg" href="/" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-4">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your account
            </p>
          </div>

          {/* Error alert */}
          {authError && (
            <div className="flex items-start gap-2.5 bg-danger-lighter border border-danger/20 text-danger rounded-xl p-3.5 mb-5">
              <AlertCircle
                className="w-4 h-4 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-sm">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">
                  Password{" "}
                  <span className="text-danger" aria-hidden="true">
                    *
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  className={cn(
                    "w-full h-[44px] sm:h-[40px] px-3 pr-10 rounded-lg border bg-white text-sm",
                    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors",
                    errors.password ? "border-danger" : "border-gray-200",
                  )}
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-danger mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" fullWidth loading={loading} className="mt-2">
              Log in
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-brand font-medium hover:underline"
            >
              Join free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
