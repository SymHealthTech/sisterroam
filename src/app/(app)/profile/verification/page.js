'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import DocumentUpload from '@/components/ui/DocumentUpload'
import VideoCapture from '@/components/ui/VideoCapture'
import {
  CheckCircle, Circle, Clock, AlertCircle, Mail, Phone,
  ShieldCheck, Lock, Star, ChevronRight, RefreshCw, BookOpen,
  XCircle,
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
        <li className="flex items-start gap-2.5 text-sm text-gray-700">
          <BookOpen className="w-4 h-4 text-teal shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Share travel stories with the community</span>
            <p className="text-xs text-gray-500 mt-0.5">Your story appears on the public SisterRoam website</p>
          </div>
        </li>
      </ul>
    </div>
  )
}

/* ── Payment card 5 sub-components ───────────────────────── */

function BadgeSuccessCard({ user, verif }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-teal font-medium">
        Verified badge active since {formatDate(verif?.reviewedAt ?? verif?.updatedAt)}
      </p>
      <div className="flex items-center gap-2 p-3 bg-brand-lighter rounded-xl">
        <ShieldCheck className="w-8 h-8 text-brand shrink-0" />
        <div>
          <p className="text-sm font-bold text-brand">Verified Sister</p>
          <p className="text-xs text-brand/70">Your badge is visible on your profile</p>
        </div>
      </div>
    </div>
  )
}

function PaymentSuccessState({ router }) {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      colors: ['#5D1A8B', '#D4537E', '#1D9E75', '#F4C0D1'],
      origin: { y: 0.6 },
    })
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-teal-lighter rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-teal" />
        </div>
        <p className="text-xl font-medium text-gray-900 text-center mt-4">
          Your verified badge is active!
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 py-2">
        <Badge variant="verified" size="md">
          <ShieldCheck className="w-3 h-3" />
          Verified
        </Badge>
      </div>

      <p className="text-sm text-gray-500 text-center">
        You can now send and receive hosting requests
      </p>

      <Button fullWidth onClick={() => router.push('/explore')}>
        Start exploring hosts →
      </Button>
      <Button fullWidth variant="secondary" onClick={() => router.push('/community/stories/new')}>
        Share your story
      </Button>
    </div>
  )
}

function PaymentCancelledState({ onRetry }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-amber-lighter rounded-xl">
        <AlertCircle className="w-6 h-6 text-amber shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-dark">Payment was cancelled</p>
          <p className="text-xs text-amber-dark/80 mt-0.5">No charge was made to your account.</p>
        </div>
      </div>
      <Button fullWidth variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function PaymentFailedState({ onRetry }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-danger-lighter rounded-xl">
        <XCircle className="w-6 h-6 text-danger shrink-0" />
        <div>
          <p className="text-sm font-semibold text-danger">Payment could not be processed</p>
          <p className="text-xs text-danger/80 mt-0.5">
            Please try again. If the issue continues, contact{' '}
            <a href="mailto:hello@sisterroam.com" className="underline">
              hello@sisterroam.com
            </a>
          </p>
        </div>
      </div>
      <Button fullWidth variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function PaymentOptionsState({ user, selectedCurrency, setSelectedCurrency, isCreatingPayment, paymentError, onPay }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-900">Activate your verified badge</p>
        <p className="text-xs text-gray-500 mt-0.5">
          One-time payment — never expires — unlocks everything
        </p>
      </div>

      {/* What unlocks */}
      <ul className="space-y-2">
        {[
          'Send hosting requests to verified sisters',
          'Receive hosting requests as a host',
          'Priority placement in search results',
          'Share travel stories with the community',
        ].map(item => (
          <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
            <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      {/* Currency selector */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Select your currency</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { code: 'INR', emoji: '🇮🇳', country: 'India', price: '₹199', methods: 'UPI · Cards · Net Banking' },
            { code: 'USD', emoji: '🌍', country: 'International', price: '$5', methods: 'Cards · International' },
          ].map(({ code, emoji, country, price, methods }) => (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedCurrency(code)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-colors',
                selectedCurrency === code
                  ? 'border-2 border-brand bg-brand-lighter/20'
                  : 'border border-gray-100 hover:border-gray-300 bg-white'
              )}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium text-gray-900">{country}</span>
              <span className="text-base font-bold text-brand">{price}</span>
              <span className="text-[10px] text-gray-400">{methods}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Badge preview */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.fullName} src={user?.profilePhotoUrl} size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {user?.fullName?.split(' ')[0] ?? 'You'}
            </span>
            <Badge variant="verified" size="sm">
              <ShieldCheck className="w-2.5 h-2.5" />
              Verified
            </Badge>
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">This is how your profile will look</p>
      </div>

      {/* Pay button */}
      <div className="space-y-2">
        <Button
          fullWidth
          size="lg"
          loading={isCreatingPayment}
          onClick={onPay}
        >
          {isCreatingPayment
            ? 'Creating secure payment…'
            : `Activate badge — ${selectedCurrency === 'INR' ? '₹199' : '$5'}`}
        </Button>

        {paymentError && (
          <div className="flex items-center gap-2 p-3 bg-danger-lighter rounded-xl">
            <XCircle className="w-4 h-4 text-danger shrink-0" />
            <p className="text-xs text-danger">{paymentError}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-400">Secure payment via Dodo Payments</span>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Non-refundable once activated · Contact support for any issues
        </p>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */

export default function VerificationPage() {
  const { data: session, update: updateSession } = useSession()

  const [loading,        setLoading]        = useState(true)
  const [submitting,     setSubmitting]      = useState(false)
  const [verifData,      setVerifData]       = useState(null)

  // Upload state accumulated before submit
  const [idFrontUrl,     setIdFrontUrl]      = useState('')
  const [idFrontPubId,   setIdFrontPubId]    = useState('')
  const [idBackUrl,      setIdBackUrl]       = useState('')
  const [idBackPubId,    setIdBackPubId]     = useState('')
  const [videoUrl,       setVideoUrl]        = useState('')
  const [videoPubId,     setVideoPubId]      = useState('')

  const [idFrontDone,    setIdFrontDone]     = useState(false)
  const [idBackDone,     setIdBackDone]      = useState(false)
  const [videoDone,      setVideoDone]       = useState(false)

  // Payment state
  const [paymentStatus,       setPaymentStatus]       = useState('loading')
  const [selectedCurrency,    setSelectedCurrency]    = useState('INR')
  const [isCreatingPayment,   setIsCreatingPayment]   = useState(false)
  const [paymentError,        setPaymentError]        = useState(null)
  const [showRetryForm,       setShowRetryForm]       = useState(false)

  const searchParams = useSearchParams()
  const router       = useRouter()
  const paymentResult = searchParams.get('payment') // 'success' | 'cancelled' | null

  // Detect locale for default currency
  useEffect(() => {
    const lang = navigator.language || 'en-US'
    setSelectedCurrency(lang === 'en-IN' || lang.includes('-IN') ? 'INR' : 'USD')
  }, [])

  // Load verification status
  useEffect(() => {
    fetch('/api/verification/status')
      .then(r => r.json())
      .then(d => { if (d.success) setVerifData(d.data) })
      .finally(() => setLoading(false))
  }, [])

  // Load payment status
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/payments/status')
        const data = await res.json()
        setPaymentStatus(data.status)
      } catch {
        setPaymentStatus('none')
      }
    }
    checkStatus()
  }, [])

  // When Dodo redirects back with ?payment=success, immediately activate the
  // badge in the DB (don't wait for the webhook) and refresh the session JWT
  // so every page instantly sees verificationTier = 'verified'.
  useEffect(() => {
    if (paymentResult !== 'success') return
    async function activate() {
      try {
        const res = await fetch('/api/payments/activate', { method: 'POST' })
        if (res.ok) {
          await updateSession({ verificationTier: 'verified' })
          setPaymentStatus('completed')
          const fresh = await fetch('/api/verification/status').then(r => r.json())
          if (fresh.success) setVerifData(fresh.data)
        }
      } catch {
        // Success UI is still visible via paymentResult param — ignore silently
      }
    }
    activate()
  }, [paymentResult]) // eslint-disable-line react-hooks/exhaustive-deps

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
      const fresh = await fetch('/api/verification/status').then(r => r.json())
      if (fresh.success) setVerifData(fresh.data)
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePay() {
    setIsCreatingPayment(true)
    setPaymentError(null)
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: selectedCurrency }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      window.location.href = data.paymentUrl
    } catch (error) {
      setPaymentError(error.message || 'Something went wrong. Please try again.')
      setIsCreatingPayment(false)
    }
  }

  function handleRetry() {
    setShowRetryForm(true)
    setPaymentError(null)
    router.replace('/profile/verification')
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
  const verif = verifData?.verification

  const verifStatus  = verif?.status
  const hasId        = !!verif?.idDocumentUrl
  const hasVideo     = !!verif?.selfieVideoUrl
  const isApproved   = verifStatus === 'approved'
  const isPending    = verifStatus === 'pending'
  const isRejected   = verifStatus === 'rejected'
  const alreadyVerified = user?.verificationTier === 'verified' || user?.verificationTier === 'trusted'

  const canSubmit = !isPending && !isApproved && idFrontDone && idBackDone

  const isPaymentSuccess = paymentResult === 'success' || paymentStatus === 'completed'

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
          {isPending && hasId && (
            <div className="space-y-2">
              <p className="text-sm text-amber-dark font-medium">Under review</p>
              <p className="text-sm text-gray-600">
                Our team is reviewing your documents. This typically takes 24–48 hours.
              </p>
              <p className="text-xs text-gray-400">Submitted {formatDate(verif.createdAt)}</p>
            </div>
          )}

          {isApproved && (
            <p className="text-sm text-teal font-medium">
              ID approved on {formatDate(verif.reviewedAt ?? verif.updatedAt)}
            </p>
          )}

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

        {/* Submit button */}
        {canSubmit && (
          <Button fullWidth loading={submitting} onClick={submitVerification}>
            Submit for review
          </Button>
        )}

        {/* STEP 5 — Verification badge (shown only after KYC approval) */}
        {isApproved && (
          <StepCard
            number={5}
            title="Verification badge"
            status={alreadyVerified || isPaymentSuccess ? 'done' : 'idle'}
          >
            {alreadyVerified ? (
              <BadgeSuccessCard user={user} verif={verif} />
            ) : isPaymentSuccess ? (
              <PaymentSuccessState router={router} />
            ) : paymentResult === 'cancelled' && !showRetryForm ? (
              <PaymentCancelledState onRetry={handleRetry} />
            ) : paymentStatus === 'failed' && !showRetryForm ? (
              <PaymentFailedState onRetry={handleRetry} />
            ) : paymentStatus === 'loading' ? (
              <Skeleton variant="card" className="h-48" />
            ) : (
              <PaymentOptionsState
                user={user}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                isCreatingPayment={isCreatingPayment}
                paymentError={paymentError}
                onPay={handlePay}
              />
            )}
          </StepCard>
        )}

        {/* Unlocks section */}
        <UnlockSection />
      </div>
    </AppLayout>
  )
}
