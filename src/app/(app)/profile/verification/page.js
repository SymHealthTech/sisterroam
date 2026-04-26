'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import DocumentUpload from '@/components/ui/DocumentUpload'
import VideoCapture from '@/components/ui/VideoCapture'
import {
  CheckCircle, Circle, Clock, AlertCircle, Mail, Phone,
  ShieldCheck, Lock, Star, ChevronRight, RefreshCw,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

/* ── Step card wrapper ────────────────────────────────────── */

function StepCard({ number, title, status, children }) {
  const colors = {
    done:    'border-teal/30 bg-teal-lighter/30',
    pending: 'border-amber/30 bg-amber-lighter/30',
    error:   'border-danger/30 bg-danger-lighter/30',
    idle:    'border-gray-100 bg-white',
  }
  const icons = {
    done:    <CheckCircle className="w-5 h-5 text-teal" />,
    pending: <Clock className="w-5 h-5 text-amber" />,
    error:   <AlertCircle className="w-5 h-5 text-danger" />,
    idle:    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-400">{number}</div>,
  }

  return (
    <div className={cn('rounded-2xl border p-5 transition-colors', colors[status] ?? colors.idle)}>
      <div className="flex items-center gap-3 mb-4">
        {icons[status] ?? icons.idle}
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

/* ── Unlock items ─────────────────────────────────────────── */

function UnlockSection() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">What verification unlocks</h3>
      <ul className="space-y-3">
        {[
          'Send hosting requests to verified sisters',
          'Receive hosting requests from verified sisters',
          'Priority placement in search results',
        ].map(item => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */

export default function VerificationPage() {
  const { data: session } = useSession()

  const [loading,        setLoading]        = useState(true)
  const [submitting,     setSubmitting]      = useState(false)
  const [activating,     setActivating]      = useState(false)
  const [verifData,      setVerifData]       = useState(null) // { user, verification }

  // Upload state accumulated before submit
  const [idFrontUrl,     setIdFrontUrl]      = useState('')
  const [idFrontPubId,   setIdFrontPubId]    = useState('')
  const [idBackUrl,      setIdBackUrl]       = useState('')
  const [idBackPubId,    setIdBackPubId]     = useState('')
  const [videoUrl,       setVideoUrl]        = useState('')
  const [videoPubId,     setVideoPubId]      = useState('')

  // Track which ID slots are uploaded (for submit button)
  const [idFrontDone,    setIdFrontDone]     = useState(false)
  const [idBackDone,     setIdBackDone]      = useState(false)
  const [videoDone,      setVideoDone]       = useState(false)

  useEffect(() => {
    fetch('/api/verification/status')
      .then(r => r.json())
      .then(d => { if (d.success) setVerifData(d.data) })
      .finally(() => setLoading(false))
  }, [])

  function handleDocUpload({ documentType, url, publicId }) {
    if (documentType === 'id_front') {
      setIdFrontUrl(url); setIdFrontPubId(publicId); setIdFrontDone(true)
    } else {
      setIdBackUrl(url); setIdBackPubId(publicId); setIdBackDone(true)
    }
  }

  function handleVideoUpload({ url, publicId }) {
    setVideoUrl(url); setVideoPubId(publicId); setVideoDone(true)
  }

  async function submitVerification() {
    if (!idFrontDone || !idBackDone) {
      toast.error('Please upload both the front and back of your ID')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idDocumentUrl:      idFrontUrl,
          idDocumentPublicId: idFrontPubId,
          idDocumentBackUrl:  idBackUrl,
          selfieVideoUrl:     videoUrl   || undefined,
          selfieVideoPublicId: videoPubId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Submission failed'); return }
      toast.success("Submitted for review! We'll notify you within 24–48 hours.")
      // Refresh status
      const fresh = await fetch('/api/verification/status').then(r => r.json())
      if (fresh.success) setVerifData(fresh.data)
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function activateBadge() {
    setActivating(true)
    toast('Payment coming soon — your badge will be activated shortly.', { icon: '🔒' })
    await new Promise(r => setTimeout(r, 1200))
    // Placeholder: set tier directly (payment gate added later)
    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationTier: 'verified' }),
      })
      const fresh = await fetch('/api/verification/status').then(r => r.json())
      if (fresh.success) setVerifData(fresh.data)
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Verification">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1,2,3,4].map(i => <Skeleton key={i} variant="card" className="h-32" />)}
        </div>
      </AppLayout>
    )
  }

  const user  = verifData?.user
  const verif = verifData?.verification // VerificationRequest doc or null

  const verifStatus  = verif?.status  // 'pending' | 'approved' | 'rejected' | undefined
  const hasId        = !!verif?.idDocumentUrl
  const hasVideo     = !!verif?.selfieVideoUrl
  const isApproved   = verifStatus === 'approved'
  const isPending    = verifStatus === 'pending'
  const isRejected   = verifStatus === 'rejected'
  const alreadyVerified = user?.verificationTier === 'verified' || user?.verificationTier === 'trusted'

  // Can submit if we have fresh uploads and no pending request
  const canSubmit = !isPending && !isApproved && idFrontDone && idBackDone

  return (
    <AppLayout title="Verification">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-10 space-y-4">

        <div className="mb-2">
          <h1 className="text-xl font-bold text-gray-900">Get verified</h1>
          <p className="text-sm text-gray-500 mt-1">Complete these steps to unlock full platform access</p>
        </div>

        {/* STEP 1 — Email */}
        <StepCard number={1} title="Email address" status={user?.emailVerified ? 'done' : 'idle'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{user?.email ?? '—'}</span>
            </div>
            {user?.emailVerified
              ? <span className="text-xs text-teal font-medium">Verified</span>
              : <Button size="sm" variant="secondary" onClick={() => toast('Resend email coming soon')}>Resend</Button>
            }
          </div>
          {user?.emailVerified && (
            <p className="text-xs text-teal mt-1">Your email is confirmed.</p>
          )}
        </StepCard>

        {/* STEP 2 — Phone */}
        <StepCard number={2} title="Phone number" status={user?.phoneVerified ? 'done' : 'idle'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>
                {user?.phone
                  ? user.phone.replace(/(\+\d{2})\d+(\d{4})/, '$1••••$2')
                  : 'No phone added'}
              </span>
            </div>
            {user?.phoneVerified
              ? <span className="text-xs text-teal font-medium">Verified</span>
              : (
                <Button size="sm" variant="secondary" onClick={() => toast('Phone OTP coming soon')}>
                  {user?.phone ? 'Verify now' : 'Add phone'}
                </Button>
              )
            }
          </div>
        </StepCard>

        {/* STEP 3 — Government ID */}
        <StepCard
          number={3}
          title="Government ID"
          status={isApproved ? 'done' : isPending && hasId ? 'pending' : isRejected ? 'error' : 'idle'}
        >
          {/* Under review */}
          {isPending && hasId && (
            <div className="space-y-2">
              <p className="text-sm text-amber-dark font-medium">Under review</p>
              <p className="text-sm text-gray-600">
                Our team is reviewing your documents. This typically takes 24–48 hours.
              </p>
              <p className="text-xs text-gray-400">Submitted {formatDate(verif.createdAt)}</p>
            </div>
          )}

          {/* Approved */}
          {isApproved && (
            <p className="text-sm text-teal font-medium">
              ID approved on {formatDate(verif.reviewedAt ?? verif.updatedAt)}
            </p>
          )}

          {/* Rejected */}
          {isRejected && (
            <div className="space-y-3">
              <div className="p-3 bg-danger-lighter rounded-xl">
                <p className="text-sm font-medium text-danger">Document rejected</p>
                {verif.reviewerNotes && (
                  <p className="text-xs text-danger/80 mt-1">{verif.reviewerNotes}</p>
                )}
              </div>
              <p className="text-sm text-gray-600">Please upload clearer documents and resubmit.</p>
              <DocumentUpload onUploadComplete={handleDocUpload} />
            </div>
          )}

          {/* Not yet submitted */}
          {!isPending && !isApproved && !isRejected && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-700">Accepted documents</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Passport (photo page)</li>
                  <li>National ID card (front and back)</li>
                  <li>Driver's licence (front and back)</li>
                </ul>
              </div>
              <DocumentUpload onUploadComplete={handleDocUpload} />
            </div>
          )}
        </StepCard>

        {/* STEP 4 — Video introduction */}
        <StepCard
          number={4}
          title="Video introduction"
          status={isApproved ? 'done' : isPending && hasVideo ? 'pending' : 'idle'}
        >
          {isPending && hasVideo && (
            <div className="space-y-1">
              <p className="text-sm text-amber-dark font-medium">Under review</p>
              <p className="text-sm text-gray-600">Your video is being reviewed alongside your ID.</p>
            </div>
          )}

          {isApproved && (
            <p className="text-sm text-teal font-medium">Video approved</p>
          )}

          {!isPending && !isApproved && (
            <div className="space-y-4">
              <div className="p-3 bg-brand-lighter/50 rounded-xl text-xs text-gray-700 leading-relaxed">
                <p className="font-medium text-brand mb-1">What to say in your video</p>
                <p>"Hi, my name is [name]. I'm from [city]. I'm joining SisterRoam because [reason]. Here is my ID."</p>
                <p className="mt-1 text-gray-500">Hold your government ID next to your face. Minimum 10 seconds.</p>
              </div>
              <VideoCapture
                userId={session?.user?.id}
                onUploadComplete={handleVideoUpload}
              />
            </div>
          )}
        </StepCard>

        {/* Submit button (only when ready and not yet submitted) */}
        {canSubmit && (
          <Button fullWidth loading={submitting} onClick={submitVerification}>
            Submit for review
          </Button>
        )}

        {/* STEP 5 — Verification badge */}
        {isApproved && (
          <StepCard
            number={5}
            title="Verification badge"
            status={alreadyVerified ? 'done' : 'idle'}
          >
            {alreadyVerified ? (
              <div className="space-y-2">
                <p className="text-sm text-teal font-medium">
                  Verified badge active since {formatDate(verif.reviewedAt ?? verif.updatedAt)}
                </p>
                <div className="flex items-center gap-2 p-3 bg-brand-lighter rounded-xl">
                  <ShieldCheck className="w-8 h-8 text-brand shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-brand">Verified Sister</p>
                    <p className="text-xs text-brand/70">Your badge is visible on your profile</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 font-semibold">Your verification is approved! 🎉</p>
                {/* Badge preview */}
                <div className="flex items-center gap-3 p-4 border-2 border-brand/20 rounded-xl bg-brand-lighter/30">
                  <ShieldCheck className="w-10 h-10 text-brand" />
                  <div>
                    <p className="text-sm font-bold text-brand">Verified Sister</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber text-amber" />)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Activate your badge</p>
                    <p className="text-xs text-gray-500 mt-0.5">India: ₹199 &nbsp;·&nbsp; International: $5</p>
                  </div>
                  <Button loading={activating} onClick={activateBadge}>Activate</Button>
                </div>
                <p className="text-xs text-gray-400 text-center">Payment integration coming soon — badge activates immediately for now</p>
              </div>
            )}
          </StepCard>
        )}

        {/* Unlocks section */}
        <UnlockSection />
      </div>
    </AppLayout>
  )
}
