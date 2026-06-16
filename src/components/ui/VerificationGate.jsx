'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Lock, CheckCircle, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from './Button'
import { useAppUser } from '@/components/layout/AppLayout'

const PERKS = [
  'Message hosts & request stays',
  'Post and join co-traveller trips',
  'Write travel stories',
  'Add place recommendations & answer questions',
  'Become a verified host',
]

export function UnderReviewModal({ onClose }) {
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true }, [])

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-14 h-14 rounded-full bg-brand-lighter flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7 text-brand" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-gray-900">Verification under review</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Our team is reviewing your documents. You&apos;ll be notified by email once approved — usually within 24–48 hours.
          </p>
        </div>
        <Button variant="primary" fullWidth onClick={onClose}>Got it</Button>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return content
  return createPortal(content, document.body)
}

export function VerificationRequiredModal({ onClose }) {
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true }, [])

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-14 h-14 rounded-full bg-brand-lighter flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-brand" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-gray-900">Verification required</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Complete your identity verification to unlock this feature.
          </p>
        </div>
        <Button variant="primary" fullWidth href="/onboarding/verify">Get verified</Button>
        <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return content
  return createPortal(content, document.body)
}

/**
 * mode="page" — full-page centred gate (for write-only pages)
 * Shows "under review" state when verifPending, otherwise shows the full locked gate.
 */
export default function VerificationGate({ className }) {
  const appUser = useAppUser()
  const verifPending = appUser?.verifPending ?? false

  if (verifPending) {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center', className)}>
        <div className="w-16 h-16 rounded-full bg-brand-lighter flex items-center justify-center mb-5">
          <Clock className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verification under review</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
          Our team is reviewing your documents. You&apos;ll be notified by email once approved —
          usually within 24–48 hours.
        </p>
        <Button href="/explore" variant="ghost" fullWidth className="max-w-xs">
          Browse hosts
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-brand-lighter flex items-center justify-center mb-5">
        <Lock className="w-8 h-8 text-brand" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">Verification required</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
        This feature is available to verified members only.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-7 text-left w-full max-w-sm shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          What you unlock
        </p>
        <ul className="space-y-2">
          {PERKS.map(perk => (
            <li key={perk} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-teal shrink-0" />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <Button href="/explore" variant="ghost" fullWidth className="max-w-xs">
        Browse hosts
      </Button>
    </div>
  )
}
