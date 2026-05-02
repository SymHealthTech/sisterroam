'use client'

import Link from 'next/link'
import { ShieldCheck, Lock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from './Button'

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
  if (mode === 'banner') {
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
          <p className="text-xs text-brand/70 mt-0.5">Complete payment to unlock full access</p>
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
