'use client'

import { useState } from 'react'
import { X, Star, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

/* ── Star rating row ───────────────────────────────────────── */
function StarRow({ label, value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
          >
            <Star
              className={cn(
                'w-6 h-6 transition-colors',
                (hover || value) >= n ? 'fill-amber text-amber' : 'text-gray-200',
              )}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Recommend card ───────────────────────────────────────── */
function RecommendCard({ value, label, icon: Icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
        selected
          ? 'border-brand bg-brand-lighter/40 text-brand'
          : 'border-gray-100 bg-white text-gray-500 hover:border-brand/30',
      )}
    >
      <Icon className={cn('w-6 h-6', selected ? 'text-brand' : 'text-gray-300')} />
      <span className="text-xs font-medium text-center leading-snug">{label}</span>
    </button>
  )
}

/* ── Progress dots ────────────────────────────────────────── */
function StepDots({ current, total }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all',
            i < current ? 'w-4 bg-brand' : i === current ? 'w-4 bg-brand' : 'w-1.5 bg-gray-200',
          )}
        />
      ))}
    </div>
  )
}

/* ── Main modal ───────────────────────────────────────────── */
export default function ReviewModal({ isOpen, onClose, requestId, revieweeId, revieweeName }) {
  const [step,          setStep]          = useState(0)
  const [overall,       setOverall]       = useState(0)
  const [safety,        setSafety]        = useState(0)
  const [cleanliness,   setCleanliness]   = useState(0)
  const [communication, setCommunication] = useState(0)
  const [accuracy,      setAccuracy]      = useState(0)
  const [recommend,     setRecommend]     = useState('')
  const [content,       setContent]       = useState('')
  const [submitting,    setSubmitting]    = useState(false)

  const allStarsDone = overall && safety && cleanliness && communication && accuracy

  function nextStep() {
    if (step === 0 && !allStarsDone) {
      toast.error('Please rate all categories')
      return
    }
    if (step === 1 && !recommend) {
      toast.error('Please select a recommendation')
      return
    }
    if (step === 2 && content.trim().length < 50) {
      toast.error('Review must be at least 50 characters')
      return
    }
    setStep(s => s + 1)
  }

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          revieweeId,
          overallRating:       overall,
          safetyRating:        safety,
          cleanlinessRating:   cleanliness,
          communicationRating: communication,
          accuracyRating:      accuracy,
          wouldRecommend:      recommend,
          content:             content.trim(),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Submission failed')
        return
      }
      toast.success(`Review submitted! It will be published once ${revieweeName} submits their review, or in 14 days.`)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setStep(0)
    setOverall(0); setSafety(0); setCleanliness(0); setCommunication(0); setAccuracy(0)
    setRecommend(''); setContent('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 space-y-5 max-w-md w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Review {revieweeName}</h2>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <StepDots current={step} total={4} />

        {/* Step 0 — Star ratings */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 font-medium">Rate your experience</p>
            <StarRow label="Overall"       value={overall}       onChange={setOverall} />
            <StarRow label="Safety"        value={safety}        onChange={setSafety} />
            <StarRow label="Cleanliness"   value={cleanliness}   onChange={setCleanliness} />
            <StarRow label="Communication" value={communication} onChange={setCommunication} />
            <StarRow label="Accuracy"      value={accuracy}      onChange={setAccuracy} />
          </div>
        )}

        {/* Step 1 — Recommend */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 font-medium">Would you recommend {revieweeName}?</p>
            <div className="flex gap-3">
              <RecommendCard
                value="yes"
                label="Yes"
                icon={ThumbsUp}
                selected={recommend === 'yes'}
                onClick={() => setRecommend('yes')}
              />
              <RecommendCard
                value="with_reservations"
                label="With reservations"
                icon={Minus}
                selected={recommend === 'with_reservations'}
                onClick={() => setRecommend('with_reservations')}
              />
              <RecommendCard
                value="no"
                label="No"
                icon={ThumbsDown}
                selected={recommend === 'no'}
                onClick={() => setRecommend('no')}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Written review */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-medium">Write your review</p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`Share your honest experience with ${revieweeName}…`}
              rows={5}
              maxLength={1000}
              className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 placeholder:text-gray-400"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Minimum 50 characters</span>
              <span className={content.length < 50 ? 'text-amber' : 'text-teal'}>
                {content.length}/1000
              </span>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 font-medium">Review summary</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={cn('w-4 h-4', overall >= n ? 'fill-amber text-amber' : 'text-gray-200')} />
                ))}
                <span className="text-xs text-gray-500 ml-2">Overall {overall}/5</span>
              </div>
              <p className="text-sm text-gray-700 italic">&quot;{content.slice(0, 120)}{content.length > 120 ? '…' : ''}&quot;</p>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Your review will be published after {revieweeName} submits theirs, or automatically in 14 days.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <Button fullWidth onClick={nextStep}>
              Continue
            </Button>
          ) : (
            <Button fullWidth loading={submitting} onClick={submit}>
              Submit review
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
