"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  async function onSubmit(data) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      setDone(true);
    } catch {
      setError("Network error. Please try again.");
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
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-2xl font-bold text-brand">SisterRoam</span>
              <span className="text-pink text-xl" aria-hidden="true">
                ♀
              </span>
            </Link>
          </div>

          {!token ? (
            /* No token in URL */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-danger-lighter flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-danger" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Invalid link</h1>
              <p className="text-sm text-gray-500">
                This reset link is missing a token. Please request a new one.
              </p>
              <Button variant="ghost" fullWidth href="/forgot-password">
                Request new link
              </Button>
            </div>
          ) : done ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-teal-lighter flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-teal" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Password updated!
              </h1>
              <p className="text-sm text-gray-500">
                Your password has been changed. You can now sign in with your
                new password.
              </p>
              <Button fullWidth href="/login">
                Sign in
              </Button>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Choose a new password
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Must be at least 8 characters.
              </p>

              {error && (
                <div className="bg-danger-lighter border border-danger/20 text-danger rounded-xl p-3 mb-4 text-sm">
                  {error}
                  {error.includes("expired") && (
                    <Link
                      href="/forgot-password"
                      className="block mt-1 font-medium underline"
                    >
                      Request a new link →
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="New password"
                  name="password"
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  error={errors.password?.message}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />

                <Input
                  label="Confirm new password"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat your password"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (v) =>
                      v === password || "Passwords do not match",
                  })}
                />

                <Button type="submit" fullWidth loading={loading}>
                  Set new password
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                <Link
                  href="/login"
                  className="text-brand font-medium hover:underline"
                >
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
