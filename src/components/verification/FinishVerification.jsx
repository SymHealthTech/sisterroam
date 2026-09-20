'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { AlertCircle, CheckCircle, Lock } from 'lucide-react'
import Button from '@/components/ui/Button'
import DocumentUpload from '@/components/ui/DocumentUpload'
import { COUNTRIES } from '@/lib/countries'

const VideoCapture = dynamic(() => import('@/components/ui/VideoCapture'), {
  ssr: false,
  loading: () => null,
})

/**
 * Recovery flow for the rare case where a member PAID but their verification
 * documents were never uploaded (e.g. the tab closed between payment and the
 * post-payment upload). Payment is already done, so this uploads the ID + video
 * directly (the Cloudinary signature routes are payment-gated, so this only
 * works for a genuinely paid member) and submits the verification request.
 *
 * The parent decides when to render this — only when the member is tier "paid"
 * with NO existing VerificationRequest.
 */
export default function FinishVerification({ initialCountry = '', onSubmitted }) {
  const [country, setCountry] = useState(initialCountry)
  const [front, setFront] = useState(null) // { url, publicId }
  const [back, setBack] = useState(null)
  const [video, setVideo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const ready = !!country && !!front && !!back && !!video

  function handleDoc({ documentType, url, publicId }) {
    if (documentType === 'id_front') setFront({ url, publicId })
    else setBack({ url, publicId })
  }

  function handleVideo({ url, publicId }) {
    setVideo({ url, publicId })
  }

  async function submit() {
    if (!ready || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          idDocumentUrl: front.url,
          idDocumentPublicId: front.publicId,
          idDocumentBackUrl: back.url,
          idDocumentBackPublicId: back.publicId,
          selfieVideoUrl: video.url,
          selfieVideoPublicId: video.publicId,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.success) throw new Error(d.error ?? 'Could not submit. Please try again.')
      toast.success('Documents submitted — your verification is now under review.')
      onSubmitted?.()
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-amber/30 rounded-2xl overflow-hidden">
      {/* Warning header */}
      <div className="flex items-start gap-3 p-5 bg-amber-lighter/60 border-b border-amber/20">
        <div className="w-10 h-10 rounded-full bg-amber-lighter flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-amber" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-dark">
            Payment received — documents not uploaded
          </p>
          <p className="text-xs text-amber-dark/80 mt-0.5 leading-relaxed">
            Your payment went through, but your verification documents didn&apos;t
            finish uploading. Please upload them below to complete verification —
            you won&apos;t be charged again.
          </p>
        </div>
      </div>

      {/* Upload flow */}
      <div className="p-5 space-y-5">
        {/* Country */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full h-[46px] px-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-brand"
          >
            <option value="">Select your country</option>
            {COUNTRIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-2.5 p-3 bg-teal-lighter/40 border border-teal/20 rounded-xl">
          <Lock className="w-4 h-4 text-teal shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-teal-dark/90 leading-relaxed">
            Your documents are private — visible only to our review team.
          </p>
        </div>

        {/* ID front + back — direct upload (member is already paid) */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-700">Government ID</p>
          <DocumentUpload
            onUploadComplete={handleDoc}
            frontStatus={front ? 'uploaded' : 'not_uploaded'}
            backStatus={back ? 'uploaded' : 'not_uploaded'}
          />
        </div>

        {/* Video selfie */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-700">Video selfie</p>
          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed">
            <p className="font-medium text-gray-700 mb-0.5">What to say:</p>
            <p>
              &quot;Hi, my name is [name], I&apos;m from [country], and I&apos;m
              joining SisterRoam.&quot; Hold your ID next to your face. Min 10
              seconds.
            </p>
          </div>
          {video && (
            <div className="flex items-center gap-2 p-2.5 bg-teal-lighter/60 rounded-xl">
              <CheckCircle className="w-4 h-4 text-teal shrink-0" aria-hidden="true" />
              <p className="text-xs text-teal font-medium">Video uploaded.</p>
            </div>
          )}
          <VideoCapture onUploadComplete={handleVideo} />
        </div>

        <Button fullWidth size="lg" loading={submitting} disabled={!ready} onClick={submit}>
          {submitting ? 'Submitting…' : 'Submit for review'}
        </Button>
        {!ready && (
          <p className="text-[11px] text-gray-400 text-center">
            Upload the front &amp; back of your ID and a video selfie to continue.
          </p>
        )}
      </div>
    </div>
  )
}
