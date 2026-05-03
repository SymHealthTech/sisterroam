'use client'

import Link from 'next/link'
import { ShieldCheck, Lock, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from './Button'
import { useAppUser } from '@/components/layout/AppLayout'

const PERKS = [
  'Message hosts & request stays',
  'Post and join co-traveller trips',
  'Share community posts & comments',
  'Write travel stories',
  'Add place recommendations & answer questions',
  'Become a verified host',
]

/**
 * mode="page"   — full-page centred gate (for write-only pages)
 * mode="banner" — compact inline banner (replaces a write action)
 */
export default function VerificationGate({ mode = 'page', action = null, className }) {
  const appUser = useAppUser()
  const verifPending  = appUser?.verifPending  ?? false
  const verifApproved = appUser?.verifApproved ?? false

  if (mode === 'banner') {
    if (verifPending) {
      return (
        <div className={cn(
          'flex items-center gap-3 bg-brand-lighter border border-brand/20 rounded-2xl px-4 py-3',
          className,
        )}>
          <Clock className="w-4 h-4 text-brand shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand leading-snug">Verification under review</p>
            <p className="text-xs text-brand/70 mt-0.5">We&apos;re reviewing your documents — you&apos;ll be notified once approved</p>
          </div>
        </div>
      )
    }

    if (verifApproved) {
      return (
        <div className={cn(
          'flex items-center gap-3 bg-teal-lighter border border-teal/20 rounded-2xl px-4 py-3',
          className,
        )}>
          <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-teal-dark leading-snug">Identity verified!</p>
            <p className="text-xs text-teal mt-0.5">Activate your badge for ₹199 to unlock this feature</p>
          </div>
          <Link
            href="/profile/verification"
            className="shrink-0 text-xs font-semibold text-teal-dark bg-white border border-teal/30 rounded-lg px-3 py-1.5 hover:bg-teal hover:text-white transition-colors whitespace-nowrap"
          >
            Activate →
          </Link>
        </div>
      )
    }

    return (
      <div className={cn(
        'flex items-center gap-3 bg-brand-lighter border border-brand/20 rounded-2xl px-4 py-3',
        className,
      )}>
        <Lock className="w-4 h-4 text-brand shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand leading-snug">
            {action ? `${action} is for verified members` : 'Verified members only'}
          </p>
          <p className="text-xs text-brand/70 mt-0.5">Verify your identity to unlock full access</p>
        </div>
        <Link
          href="/profile/verification"
          className="shrink-0 text-xs font-semibold text-brand bg-white border border-brand/30 rounded-lg px-3 py-1.5 hover:bg-brand hover:text-white transition-colors whitespace-nowrap"
        >
          Get verified →
        </Link>
      </div>
    )
  }

  if (verifPending) {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center', className)}>
        <div className="w-16 h-16 rounded-full bg-brand-lighter flex items-center justify-center mb-5">
          <Clock className="w-8 h-8 text-brand" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Verification under review</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
          Our team is reviewing your documents. You&apos;ll be notified by email once approved — usually within 24 hours.
        </p>
        <Button href="/explore" variant="ghost" fullWidth className="max-w-xs">
          Browse hosts
        </Button>
      </div>
    )
  }

  if (verifApproved) {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center', className)}>
        <div className="w-16 h-16 rounded-full bg-teal-lighter flex items-center justify-center mb-5">
          <ShieldCheck className="w-8 h-8 text-teal" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Identity verified!</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
          Your identity has been confirmed. Complete the one-time payment of ₹199 to activate
          your badge and unlock all features.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button href="/profile/verification" variant="primary" fullWidth>
            Activate badge — ₹199
          </Button>
          <Button href="/explore" variant="ghost" fullWidth>
            Browse hosts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-brand-lighter flex items-center justify-center mb-5">
        <ShieldCheck className="w-8 h-8 text-brand" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">Verified members only</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
        This feature is available to verified SisterRoam members. Complete your identity
        verification and payment to unlock the full experience.
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

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button href="/profile/verification" variant="primary" fullWidth>
          Start verification
        </Button>
        <Button href="/explore" variant="ghost" fullWidth>
          Browse hosts
        </Button>
      </div>
    </div>
  )
}
