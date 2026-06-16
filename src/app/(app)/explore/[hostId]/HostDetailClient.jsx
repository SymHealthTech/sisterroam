'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  MapPin, Home, Star, Users, CheckCircle, Shield, Globe,
  ChevronDown, ChevronUp, ArrowLeft, ThumbsUp, Lock,
} from 'lucide-react'
import AppLayout, { useAppUser } from '@/components/layout/AppLayout'
import { UnderReviewModal, VerificationRequiredModal } from '@/components/ui/VerificationGate'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { cn, formatDate, formatRelativeTime } from '@/lib/utils'

const ROOM_LABELS = {
  private_room: 'Private room',
  shared_room: 'Shared room',
  couch: 'Couch',
  floor_space: 'Floor space',
  tent_space: 'Tent space',
}

const OFFERING_LABELS = {
  bed: 'Bed provided',
  breakfast: 'Breakfast',
  dinner: 'Dinner',
  city_guide: 'City guide / local tips',
  airport_pickup: 'Airport pickup',
  laundry: 'Laundry access',
  wifi: 'Wi-Fi',
  bicycle: 'Bicycle loan',
}

const CATEGORY_LABELS = {
  solo_traveller: 'Solo traveller',
  backpacker: 'Backpacker',
  cyclist: 'Cyclist',
  trekker: 'Trekker',
  runner: 'Runner',
  ultramarathon: 'Ultra runner',
  road_tripper: 'Road tripper',
  family_tourist: 'Family traveller',
}

const TABS = ['About', 'Hosting', 'Reviews', 'Local tips']

/* ── Helpers ─────────────────────────────────────────────── */

function StarRow({ rating, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(cls, s <= Math.round(rating) ? 'fill-amber text-amber' : 'fill-transparent text-gray-200')}
        />
      ))}
    </div>
  )
}

function RatingBar({ label, value }) {
  const pct = Math.round((value / 5) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value > 0 ? value.toFixed(1) : '–'}</span>
    </div>
  )
}

/* ── Tab: About ──────────────────────────────────────────── */

function AboutTab({ user }) {
  return (
    <div className="space-y-6">
      {user.languages?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Speaks</p>
          <div className="flex flex-wrap gap-1.5">
            {user.languages.map((l) => (
              <span key={l} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{l}</span>
            ))}
          </div>
        </div>
      )}

      {user.bio && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About</p>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{user.bio}</p>
        </div>
      )}

      {user.countriesVisited?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Countries visited</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {user.countriesVisited.map((c) => (
              <span key={c} className="shrink-0 text-sm bg-brand-lighter text-brand px-3 py-1 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}

      {user.hobbies?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Hobbies &amp; interests</p>
          <div className="flex flex-wrap gap-1.5">
            {user.hobbies.map((h) => (
              <span key={h} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{h}</span>
            ))}
          </div>
        </div>
      )}

      {(user.instagramUrl || user.linkedinUrl) && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Social</p>
          <div className="flex items-center gap-3">
            {user.instagramUrl && (
              <a
                href={user.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>
                  {user.instagramUrl.replace(/.*instagram\.com\//, '').replace(/\/$/, '') || 'Instagram'}
                </span>
              </a>
            )}
            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>
                  {user.linkedinUrl.replace(/.*linkedin\.com\/(in\/)?/, '').replace(/\/$/, '') || 'LinkedIn'}
                </span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tab: Hosting ────────────────────────────────────────── */

function HostingTab({ host }) {
  const user = host.userId ?? host.user ?? {}
  const rules = host.houseRules ? host.houseRules.split('·').map((r) => r.trim()).filter(Boolean) : []

  return (
    <div className="space-y-6">
      {host.accommodationType && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Accommodation</p>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Home className="w-4 h-4 text-brand" />
            <span className="font-medium">{ROOM_LABELS[host.accommodationType] ?? host.accommodationType}</span>
          </div>
        </div>
      )}

      {host.maxGuests && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Guests</p>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-brand" />
            <span>Up to {host.maxGuests} guest{host.maxGuests !== 1 ? 's' : ''} at a time</span>
          </div>
        </div>
      )}

      {host.freeOfferings?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">What I offer (free)</p>
          <ul className="space-y-2">
            {host.freeOfferings.map((o) => (
              <li key={o} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-teal shrink-0" />
                {OFFERING_LABELS[o] ?? o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rules.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">House rules</p>
          <ul className="space-y-1.5">
            {rules.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Response</p>
        <p className="text-sm text-gray-700">
          Responds within {host.responseTimeHours ?? 24} hours · {host.responseRate ?? 100}% response rate
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Availability</p>
        {host.isAcceptingGuests !== false ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-lighter text-teal text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-teal" />
            Currently accepting guests
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Not currently hosting
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Review card ─────────────────────────────────────────── */

function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false)
  const text = review.content ?? ''
  const long = text.length > 200
  const displayed = long && !expanded ? text.slice(0, 200) + '…' : text

  const recommendBadge = {
    yes:              { label: 'Would stay again',     cls: 'bg-teal-lighter text-teal' },
    with_reservations:{ label: 'With reservations',    cls: 'bg-amber-lighter text-amber-dark' },
    no:               { label: 'Would not recommend',  cls: 'bg-danger-lighter text-danger' },
  }[review.wouldRecommend]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar
            src={review.reviewerId?.profilePhotoUrl}
            name={review.reviewerId?.fullName}
            size="sm"
          />
          <div>
            <Link
              href={`/user/${review.reviewerId?._id}`}
              className="text-sm font-semibold text-gray-900 hover:text-brand"
            >
              {review.reviewerId?.fullName ?? 'Member'}
            </Link>
            <p className="text-xs text-gray-400">{review.publishedAt ? formatDate(review.publishedAt) : ''}</p>
          </div>
        </div>
        <StarRow rating={review.overallRating ?? 0} />
      </div>

      {text && (
        <div>
          <p className="text-sm text-gray-700 leading-relaxed">{displayed}</p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-brand hover:text-brand-dark font-medium mt-1 flex items-center gap-0.5"
            >
              {expanded ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Read more <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
      )}

      {recommendBadge && (
        <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium', recommendBadge.cls)}>
          {recommendBadge.label}
        </span>
      )}
    </div>
  )
}

/* ── Tab: Local tips ─────────────────────────────────────── */

const CAT_LABELS = { stay: 'Stay', food: 'Food', transport: 'Transport', safety: 'Safety', activity: 'Activity', general: 'General' }
const CAT_COLORS = {
  stay: 'text-brand bg-brand-lighter',
  food: 'text-amber bg-amber-lighter',
  transport: 'text-teal bg-teal-lighter',
  safety: 'text-danger bg-danger-lighter',
  activity: 'text-pink-600 bg-pink-50',
  general: 'text-gray-600 bg-gray-100',
}

function LocalTipsTab({ city, country }) {
  const [tips,    setTips]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!city) return
    async function load() {
      try {
        const params = new URLSearchParams({ city, country: country ?? '', limit: '4', sort: 'upvotes' })
        const res = await fetch(`/api/recommendations?${params}`)
        if (res.ok) {
          const d = await res.json()
          setTips(d.data?.recommendations ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [city, country])

  if (loading) {
    return <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-gray-700">Community recommendations for {city}</p>
      {tips.length > 0 ? (
        <>
          <div className="space-y-3">
            {tips.map(tip => (
              <div key={tip._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <span className={cn('text-[10px] px-2 py-1 rounded-full font-medium shrink-0 mt-0.5', CAT_COLORS[tip.category] ?? 'text-gray-600 bg-gray-100')}>
                  {CAT_LABELS[tip.category] ?? tip.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tip.title}</p>
                  <p className="text-xs text-gray-500 truncate">{tip.description?.slice(0, 80)}</p>
                </div>
                <div className="flex items-center gap-0.5 text-xs text-gray-400 shrink-0">
                  <ThumbsUp className="w-3 h-3" />{tip.upvoteCount ?? 0}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/recommendations?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country ?? '')}`}
              className="text-sm text-brand hover:text-brand-dark font-medium"
            >
              View all recommendations for {city} →
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-sm text-gray-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          No recommendations yet for {city}
          <div className="mt-3">
            <Link
              href={`/recommendations`}
              className="text-sm text-brand hover:text-brand-dark font-medium"
            >
              + Add a recommendation
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tab: Reviews ────────────────────────────────────────── */

function ReviewsTab({ host, reviews: initialReviews }) {
  const user = host.userId ?? host.user ?? {}
  const rating = user.averageRating ?? 0
  const total = user.totalReviews ?? 0

  const [reviews, setReviews] = useState(initialReviews ?? [])
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState((initialReviews?.length ?? 0) < total)

  async function loadMore() {
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/reviews?revieweeId=${user._id}&skip=${reviews.length}&limit=5`)
      if (res.ok) {
        const json = await res.json()
        const next = json.data ?? []
        setReviews((prev) => [...prev, ...next])
        setHasMore(reviews.length + next.length < total)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  if (total === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-400">
        No reviews yet — be the first to stay!
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Aggregate */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold text-gray-900">{rating.toFixed(1)}</span>
          <div>
            <StarRow rating={rating} size="md" />
            <p className="text-xs text-gray-500 mt-0.5">({total} review{total !== 1 ? 's' : ''})</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Safety',        key: 'safetyRating' },
            { label: 'Cleanliness',   key: 'cleanlinessRating' },
            { label: 'Communication', key: 'communicationRating' },
            { label: 'Accuracy',      key: 'accuracyRating' },
          ].map(({ label, key }) => {
            const avg = reviews.length > 0
              ? reviews.reduce((s, r) => s + (r[key] ?? 0), 0) / reviews.filter((r) => r[key]).length
              : 0
            return <RatingBar key={key} label={label} value={isNaN(avg) ? 0 : avg} />
          })}
        </div>
      </div>

      {/* Review cards */}
      {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" loading={loadingMore} onClick={loadMore}>
            Load more reviews
          </Button>
        </div>
      )}
    </div>
  )
}

/* ── Sidebar / CTA card ──────────────────────────────────── */

function RequestCard({ host, className }) {
  const { data: session } = useSession()
  const appUser = useAppUser()
  const tier = appUser?.verificationTier ?? session?.user?.verificationTier
  const isUnderReview = tier === 'paid'
  const isBasic = tier === 'basic'
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  function openGate() {
    if (isUnderReview) setShowReviewModal(true)
    else setShowVerifyModal(true)
  }
  const user = host.userId ?? host.user ?? {}
  const accepting = host.isAcceptingGuests !== false && host.isListingActive !== false
  const rating = user.averageRating ?? 0
  const total = user.totalReviews ?? 0
  const isOwnProfile = !!(session && user._id && session.user.id === String(user._id))

  if (isOwnProfile) return null

  return (
    <>
      {showReviewModal && <UnderReviewModal onClose={() => setShowReviewModal(false)} />}
      {showVerifyModal && <VerificationRequiredModal onClose={() => setShowVerifyModal(false)} />}
      <div className={cn('bg-white rounded-2xl border border-gray-100 p-5 space-y-4', className)}>
        {!session ? (
          <>
            <h3 className="font-semibold text-gray-900">Connect with {user.fullName?.split(' ')[0]}</h3>
            <p className="text-sm text-gray-500">Log in or create an account to send a hosting request.</p>
            <Button href="/signup" fullWidth>Join free</Button>
            <p className="text-center text-sm text-gray-500">
              Already a member?{' '}
              <Link href="/login" className="text-brand hover:text-brand-dark font-medium">Log in</Link>
            </p>
          </>
        ) : (isUnderReview || isBasic) ? (
          <>
            <h3 className="font-semibold text-gray-900">Connect with {user.fullName?.split(' ')[0]}</h3>
            <button
              type="button"
              onClick={openGate}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <Lock className="w-4 h-4 text-brand/40" />
              Request a stay
            </button>
          </>
        ) : (
          <>
            {rating > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Star className="w-4 h-4 fill-amber text-amber" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-gray-400">· {total} review{total !== 1 ? 's' : ''}</span>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Responds within {host.responseTimeHours ?? 24} hours · {host.responseRate ?? 100}% response rate
            </p>
            <Button
              href={accepting ? `/request/${host._id}` : undefined}
              disabled={!accepting}
              fullWidth
              size="lg"
            >
              {accepting ? `Request a stay with ${user.fullName?.split(' ')[0]}` : 'Not currently accepting guests'}
            </Button>
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 pt-1">
          <Shield className="w-4 h-4 text-teal" />
          <span className="text-xs text-gray-500">Verified by SisterRoam team</span>
        </div>
      </div>
    </>
  )
}

/* ── Main client component ───────────────────────────────── */

export default function HostDetailClient({ host }) {
  const router = useRouter()
  const { data: session } = useSession()
  const appUser = useAppUser()
  const tier = appUser?.verificationTier ?? session?.user?.verificationTier
  const isUnderReview = tier === 'paid'
  const isBasic = tier === 'basic'
  const [activeTab, setActiveTab] = useState('About')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  function openGate() {
    if (isUnderReview) setShowReviewModal(true)
    else setShowVerifyModal(true)
  }
  const [now] = useState(() => Date.now())

  const user = host.userId ?? host.user ?? {}
  const reviews = host.reviews ?? []
  const rating = user.averageRating ?? 0
  const totalReviews = user.totalReviews ?? 0
  const categories = user.travellerCategories ?? []
  const isActive = user.lastActive && (now - new Date(user.lastActive).getTime()) < 86_400_000

  const canShowHosting = user.role === 'host' || user.role === 'both'

  return (
    <AppLayout title={user.fullName ?? 'Host profile'}>
      <div className="max-w-5xl mx-auto px-4 py-5 lg:px-6">

        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search results
        </button>

        <div className="flex gap-6 items-start">
          {/* ── Left: main content ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Profile header card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Banner */}
              <div className="h-[80px] lg:h-[120px] bg-brand-lighter relative">
                {host.femaleOnly && (
                  <span className="absolute top-3 left-4">
                    <Badge variant="female" size="sm">♀ Women only</Badge>
                  </span>
                )}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <Avatar
                    src={user.profilePhotoUrl}
                    name={user.fullName}
                    size="xl"
                    className="ring-4 ring-white"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="pt-12 pb-5 px-5 text-center space-y-2">
                <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>

                {/* Location */}
                {(user.city || user.country) && (
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{[user.city, user.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {/* Verification badges */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {(user.verificationTier === 'verified' || user.verificationTier === 'trusted') && (
                    <Badge variant="verified">✓ Verified</Badge>
                  )}
                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-lighter text-teal text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                      Active recently
                    </span>
                  )}
                </div>

                {/* Rating + member since */}
                <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                  {rating > 0 && (
                    <div className="flex items-center gap-1">
                      <StarRow rating={rating} />
                      <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
                      <span>({totalReviews})</span>
                    </div>
                  )}
                  {!rating && <span>New host</span>}
                  {user.createdAt && (
                    <span>Member since {new Date(user.createdAt).getFullYear()}</span>
                  )}
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                    {categories.map((cat) => (
                      <span key={cat} className="text-xs bg-brand-lighter text-brand px-2.5 py-0.5 rounded-full">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile request card */}
            <div className="lg:hidden">
              <RequestCard host={host} />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100 sticky top-[36px] lg:top-6 z-10 bg-white">
                {TABS.filter((t) => t !== 'Hosting' || canShowHosting).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 py-2 text-sm font-medium transition-colors border-b-2',
                      activeTab === tab
                        ? 'border-brand text-brand'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="px-5 pb-5 pt-12">
                {activeTab === 'About' && <AboutTab user={user} />}
                {activeTab === 'Hosting' && canShowHosting && <HostingTab host={host} />}
                {activeTab === 'Reviews' && <ReviewsTab host={host} reviews={reviews} />}
                {activeTab === 'Local tips' && <LocalTipsTab city={user.city} country={user.country} />}
              </div>
            </div>
          </div>

          {/* ── Right: sticky sidebar ── */}
          <div className="hidden lg:block w-[360px] shrink-0 sticky top-20 self-start">
            <RequestCard host={host} />
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom CTA */}
      {showReviewModal && <UnderReviewModal onClose={() => setShowReviewModal(false)} />}
      {showVerifyModal && <VerificationRequiredModal onClose={() => setShowVerifyModal(false)} />}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {(isUnderReview || isBasic) ? (
          <button
            type="button"
            onClick={openGate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <Lock className="w-4 h-4 text-brand/40" />
            Request a stay with {user.fullName?.split(' ')[0]}
          </button>
        ) : host.isAcceptingGuests !== false && host.isListingActive !== false ? (
          <Button href={`/request/${host._id}`} fullWidth size="lg">
            Request a stay with {user.fullName?.split(' ')[0]}
          </Button>
        ) : (
          <Button disabled fullWidth size="lg">Not currently accepting guests</Button>
        )}
      </div>
    </AppLayout>
  )
}
