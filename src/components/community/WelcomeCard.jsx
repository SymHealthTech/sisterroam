'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Sparkles, MapPin, Check, Lock, X, PenLine, UserPlus, ShieldCheck, Trash2,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

const TRAVEL_LABELS = {
  solo_traveller: 'Solo traveller',
  backpacker:     'Backpacker',
  cyclist:        'Cyclist',
  trekker:        'Trekker',
  runner:         'Runner',
  ultramarathon:  'Ultramarathon',
  road_tripper:   'Road tripper',
  family_tourist: 'Family tourist',
}

// What a free (basic / under-review) member can already do on SisterRoam.
const FREE_PERKS = [
  'Post in the community & share your journeys',
  'Explore verified women hosts around the world',
  'Read the community feed and travel stories',
  'Discover and follow other sisters',
]

// What unlocks once she completes verification.
const VERIFIED_PERKS = [
  'Message sisters and request stays',
  'Host fellow travellers and offer your place',
  'Express interest in co-travel trips',
]

/**
 * A friendly welcome "post" shown at the top of the /feed community stream to
 * brand-new sisters. Greets her by name, mirrors back the little the community
 * currently knows about her, lays out what she can do now vs. after
 * verification, and nudges her to introduce herself with a first post.
 *
 * Dismissal is remembered per-user in localStorage so it does not nag.
 *
 * Admins also see this card (for moderation) regardless of when they joined,
 * with an inline "delete for everyone" control that removes it platform-wide.
 */
export default function WelcomeCard({ profile, isAdmin = false, onIntroduce, onDismiss, onAdminDelete }) {
  const firstName = (profile?.fullName ?? '').split(' ')[0] || 'sister'
  const isVerified =
    profile?.verificationTier === 'verified' ||
    profile?.verificationTier === 'trusted'

  const location = [profile?.city, profile?.country].filter(Boolean).join(', ')
  const styles = useMemo(
    () =>
      (profile?.travellerCategories ?? [])
        .map((c) => TRAVEL_LABELS[c] ?? c)
        .slice(0, 4),
    [profile?.travellerCategories],
  )
  const hasIntroInfo = Boolean(location) || styles.length > 0 || Boolean(profile?.bio)

  return (
    <div className="bg-white border border-brand/20 -mx-4 sm:mx-0 rounded-none sm:rounded-2xl overflow-hidden shadow-sm">
      {/* Header band */}
      <div className="relative bg-gradient-to-br from-brand to-pink px-4 sm:px-5 py-4 text-white">
        <button
          onClick={onDismiss}
          aria-label="Dismiss welcome"
          className="absolute top-3 right-3 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 pr-6">
          <div className="shrink-0 w-11 h-11 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
              Welcome to SisterRoam
            </p>
            <h3 className="text-base sm:text-lg font-bold leading-tight truncate">
              So glad you're here, {firstName}! 💜
            </h3>
          </div>
        </div>
        <p className="text-sm text-white/90 mt-3 leading-relaxed">
          You've just joined a community of women who explore the world together —
          safely, and never alone. Here's how to get started.
        </p>
        {isAdmin && (
          <p className="mt-3 text-[11px] text-white/80 bg-white/15 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin preview — recently joined sisters see this welcome post.
          </p>
        )}
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-5">
        {/* A little about you */}
        <section className="rounded-xl bg-brand-lighter/30 border border-brand/10 p-3.5">
          <div className="flex items-start gap-3">
            <Avatar
              src={profile?.profilePhotoUrl}
              name={profile?.fullName}
              size="sm"
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                This is how other sisters see you
              </p>
              {hasIntroInfo ? (
                <div className="mt-1.5 space-y-1.5">
                  {location && (
                    <p className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                      {location}
                    </p>
                  )}
                  {styles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {styles.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-full bg-white border border-brand/15 text-[11px] font-medium text-brand"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile?.bio && (
                    <p className="text-xs text-gray-500 line-clamp-2">{profile.bio}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Your profile is looking a little empty. Add your location, travel
                  style and a short bio so sisters can find and connect with you.
                </p>
              )}
              <Link
                href="/profile/edit"
                className="inline-block mt-2 text-xs font-semibold text-brand hover:text-brand-dark"
              >
                {hasIntroInfo ? 'Complete your profile →' : 'Add your details →'}
              </Link>
            </div>
          </div>
        </section>

        {/* What you can do now */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal flex items-center gap-1.5 mb-2">
            <Check className="w-3.5 h-3.5" />
            What you can do right now — free
          </p>
          <ul className="space-y-1.5">
            {FREE_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Unlock after verification */}
        {!isVerified && (
          <section className="rounded-xl border border-amber/20 bg-amber-lighter/20 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber flex items-center gap-1.5 mb-2">
              <Lock className="w-3.5 h-3.5" />
              Unlocks after verification
            </p>
            <ul className="space-y-1.5">
              {VERIFIED_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/verify"
              className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-amber hover:opacity-80"
            >
              Get verified <UserPlus className="w-3.5 h-3.5" />
            </Link>
          </section>
        )}

        {/* Introduce yourself CTA */}
        <section className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-900">
            Say hello to the community 👋
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Share a first post introducing yourself — where you're from, the
            journeys you've taken, and the hobbies that make you <em>you</em>. It's
            the fastest way to make your first sister-connection.
          </p>
          <button
            onClick={onIntroduce}
            className={cn(
              'mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors',
            )}
          >
            <PenLine className="w-4 h-4" />
            Introduce yourself
          </button>
        </section>

        {/* Admin-only: remove the welcome post for everyone */}
        {isAdmin && (
          <section className="border-t border-danger/15 pt-4">
            <button
              onClick={onAdminDelete}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-danger-lighter/40 text-danger text-sm font-medium hover:bg-danger-lighter/70 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete welcome post for everyone
            </button>
            <p className="text-[11px] text-gray-400 mt-1.5">
              This hides the welcome post for all new sisters until you restore it
              from the admin dashboard.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
