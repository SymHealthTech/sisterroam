"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Skeleton from "@/components/ui/Skeleton";
import { CheckCircle, Clock, XCircle, ShieldCheck, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function VerificationStatusPage() {
  const [loading, setLoading] = useState(true);
  const [verifData, setVerifData] = useState(null);

  useEffect(() => {
    fetch("/api/verification/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVerifData(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="Verification Status">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} variant="card" className="h-32" />
          ))}
        </div>
      </AppLayout>
    );
  }

  const verif = verifData?.verification;
  const user = verifData?.user;
  const status = verif?.status;
  const isPending = status === "pending";
  const isRejected = status === "rejected";
  const isFullyVerified =
    user?.verificationTier === "verified" ||
    user?.verificationTier === "trusted";

  return (
    <AppLayout title="Verification Status">
      <div className="max-w-lg mx-auto px-4 py-6 pb-10 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Verification status</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your documents are reviewed by our team
          </p>
        </div>

        {/* Status card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          {isFullyVerified && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-lighter rounded-full flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-teal" />
              </div>
              <div>
                <p className="text-sm font-bold text-teal-dark">Verified Sister</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Full access unlocked
                  {verif?.reviewedAt ? ` · Approved ${formatDate(verif.reviewedAt)}` : ""}
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-lighter rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-dark">Under review</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Our team is reviewing your documents — usually 24–48 hours
                  {verif?.createdAt ? `. Submitted ${formatDate(verif.createdAt)}` : ""}
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-danger-lighter rounded-full flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6 text-danger" />
                </div>
                <div>
                  <p className="text-sm font-bold text-danger">Not approved</p>
                  {verif?.reviewerNotes && (
                    <p className="text-xs text-danger/80 mt-0.5">{verif.reviewerNotes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600">
                  We will reach out via your registered email with further
                  instructions.
                </p>
              </div>
            </div>
          )}

          {!verif && !isFullyVerified && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">No verification request found.</p>
            </div>
          )}
        </div>

        {/* Docs submitted */}
        {verif?.idDocumentUrl && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Documents submitted
            </p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                Government ID (front)
              </div>
              {verif?.idDocumentBackUrl && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                  Government ID (back)
                </div>
              )}
              {verif?.selfieVideoUrl && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                  Video selfie
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-400">
            Questions?{" "}
            <a
              href="mailto:admin.sisterroam@gmail.com"
              className="text-brand hover:underline"
            >
              Contact support
            </a>
          </p>
          <p className="text-xs text-gray-400">
            <span className="select-all font-medium text-gray-500">
              admin.sisterroam@gmail.com
            </span>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
