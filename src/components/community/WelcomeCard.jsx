'use client'

import Link from 'next/link'
import {
  Sparkles, Check, Lock, X, PenLine, UserPlus, ShieldCheck, Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// What a free (basic / under-review) member can already do on SisterRoam.
const FREE_PERKS = [
  'Post in the community & share your journeys',
  'Explore verified women hosts around the world',
  'Read the community feed and travel stories',
  'Discover and follow other sisters',
]

// What verification unlocks.
const VERIFIED_PERKS = [
  'Message sisters and request stays',
  'Host fellow travellers and offer your place',
  'Express interest in co-travel trips',
]

/**
 * A short, friendly welcome "post" shown at the top of the /feed community
 * stream to brand-new sisters. Flow: welcome → introduce yourself → what's free
 * → verification benefits.
 *
 * It's private to each new sister (no one else sees hers). Personal dismissal
 * is remembered per-user in localStorage.
 */
export default function WelcomeCard({ profile, onIntroduce, onDismiss }) {
  const firstName = (profile?.fullName ?? '').split(' ')[0] || 'sister'
  const isVerified =
    profile?.verificationTier === 'verified' ||
    profile?.verificationTier === 'trusted'

  return (
    <div className="bg-white border border-brand/20 -mx-4 sm:mx-0 rounded-none sm:rounded-2xl overflow-hidden shadow-sm">
      {/* Header band */}
      <div className="relative bg-gradient-to-br from-brand to-pink px-4 sm:px-5 py-3.5 text-white">
        <button
          onClick={onDismiss}
          aria-label="Dismiss welcome"
          className="absolute top-3 right-3 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 pr-6">
          <div className="shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
              Welcome to SisterRoam
            </p>
            <h3 className="text-base font-bold leading-tight truncate">
              So glad you're here, {firstName}! 💜
            </h3>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-4">
        {/* 1 — Introduce yourself */}
        <section>
          <p className="text-sm font-semibold text-gray-900">
            Say hello & introduce yourself 👋
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Share a first post — where you're from, your travel journeys and the
            hobbies that make you <em>you</em>. It's the fastest way to connect.
          </p>
          <button
            onClick={onIntroduce}
            className={cn(
              'mt-2.5 inline-flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors',
            )}
          >
            <PenLine className="w-4 h-4" />
            Introduce yourself
          </button>
        </section>

        {/* 2 — What you can do now (free) */}
        <section className="border-t border-gray-100 pt-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal flex items-center gap-1.5 mb-2">
            <Check className="w-3.5 h-3.5" />
            Free — what you can do now
          </p>
          <ul className="space-y-1">
            {FREE_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3 — Verification benefits */}
        {!isVerified && (
          <section className="rounded-xl border border-amber/20 bg-amber-lighter/20 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber flex items-center gap-1.5 mb-2">
              <Lock className="w-3.5 h-3.5" />
              Get verified to unlock
            </p>
            <ul className="space-y-1">
              {VERIFIED_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            {/* Verification fee waived — launch offer */}
            <div className="mt-3 rounded-xl border border-dashed border-teal/40 bg-teal-lighter/40 p-3">
              <p className="text-xs font-semibold text-teal flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Verification fee waived —{' '}
                <span className="font-bold">free for the first 500 sisters</span>
              </p>
              <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                Complete all the verification steps and apply promo code at the
                payment page — your{' '}
                <s className="text-gray-400">₹299 / $7</s> fee drops to{' '}
                <span className="font-semibold text-gray-800">₹0</span>.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="text-xs font-bold tracking-widest text-brand">
                  NEWSIS100
                </span>
                <span className="ml-auto text-[10px] font-semibold text-teal">
                  100% off
                </span>
              </div>
            </div>

            <Link
              href="/verify"
              className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-amber hover:opacity-80"
            >
              Get verified <UserPlus className="w-3.5 h-3.5" />
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}
