'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppLayout, { useAppUser } from '@/components/layout/AppLayout'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import HostCard from '@/components/host/HostCard'
import {
  Search, ShieldCheck, MessageSquare, Users, MapPin,
  AlertCircle, BarChart2, Copy, BookOpen, UserPlus,
} from 'lucide-react'
import TripPostCard from '@/components/cotraveller/TripPostCard'
import StoryCard from '@/components/stories/StoryCard'
import { formatDateRange, formatRelativeTime } from '@/lib/utils'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getProfileCompleteness(profile) {
  if (!profile) return { checks: [], pct: 0 }
  const checks = [
    { label: 'Profile photo',    done: !!profile.profilePhotoUrl },
    { label: 'About you (bio)',  done: !!profile.bio },
    { label: 'Location',         done: !!profile.country },
    { label: 'Languages',        done: (profile.languages?.length ?? 0) > 0 },
    { label: 'Travel style',     done: (profile.travellerCategories?.length ?? 0) > 0 },
    { label: 'Emergency contact',done: !!profile.emergencyContactName },
  ]
  const done = checks.filter((c) => c.done).length
  return { checks, pct: Math.round((done / checks.length) * 100) }
}

function PostPreviewCard({ post }) {
  return (
    <Link
      href="/community"
      className="flex gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
    >
      <Avatar name={post.author?.fullName} src={post.author?.profilePhotoUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</p>
        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
          {typeof post.content === 'string' ? post.content : ''}
        </p>
        {post.createdAt && (
          <p className="text-[11px] text-gray-400 mt-1.5">{formatRelativeTime(post.createdAt)}</p>
        )}
      </div>
    </Link>
  )
}

function ProfileCompletenessCard({ profile }) {
  const { checks, pct } = getProfileCompleteness(profile)
  const missing = checks.filter((c) => !c.done)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Profile strength</h3>
        <span className="text-sm font-bold text-brand">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {missing.length > 0 && (
        <ul className="space-y-1.5">
          {missing.slice(0, 3).map(({ label }) => (
            <li key={label} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      )}
      <Button href="/profile/edit" variant="secondary" size="sm" fullWidth>
        Complete profile
      </Button>
    </div>
  )
}

function QuickStatsCard({ profile }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Your stats</h3>
      <div className="space-y-2">
        {[
          { label: 'Total stays',  value: profile?.totalStays   ?? 0 },
          { label: 'Reviews',      value: profile?.totalReviews ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ShortcutsCard() {
  function copyInviteLink() {
    const url = `${window.location.origin}?ref=sisterroam`
    navigator.clipboard.writeText(url).then(() => toast.success('Invite link copied!'))
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Shortcuts</h3>
      <Link
        href="/safety"
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <ShieldCheck className="w-4 h-4 text-teal shrink-0" />
        <div>
          <p className="text-sm font-medium text-gray-900">Safety centre</p>
          <p className="text-[11px] text-gray-400">SOS &amp; check-ins</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={copyInviteLink}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
      >
        <Copy className="w-4 h-4 text-brand shrink-0" />
        <span className="text-sm font-medium text-gray-900">Invite a sister</span>
      </button>
    </div>
  )
}

export default function FeedPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const freshUser = useAppUser()
  const sessionUser = freshUser ?? session?.user

  const [userProfile, setUserProfile] = useState(null)
  const [hosts, setHosts] = useState([])
  const [communityPosts, setCommunityPosts] = useState([])
  const [recentTrips, setRecentTrips] = useState([])
  const [travelStories, setTravelStories] = useState([])
  const [activeStay, setActiveStay] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!sessionUser?.id) return
    loadFeedData()
  }, [sessionUser?.id])

  async function loadFeedData() {
    setLoading(true)
    try {
      const userRes = await fetch('/api/users')
      if (userRes.ok) {
        const userData = await userRes.json()
        const profile = userData.data ?? {}
        setUserProfile(profile)

        const [hostsRes, postsRes, requestsRes, unreadRes, tripsRes, storiesRes] = await Promise.allSettled([
          fetch(`/api/hosts?country=${encodeURIComponent(profile.country ?? '')}&limit=4&sort=stays`),
          fetch('/api/community/posts?limit=2'),
          fetch('/api/requests'),
          fetch('/api/messages/unread-count'),
          fetch('/api/cotraveller?limit=2&status=open'),
          fetch('/api/stories?sort=newest&limit=2'),
        ])

        if (hostsRes.status === 'fulfilled' && hostsRes.value.ok) {
          const d = await hostsRes.value.json()
          setHosts(d.data?.hosts ?? [])
        }
        if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
          const d = await postsRes.value.json()
          const posts = d.data?.posts ?? d.data ?? []
          setCommunityPosts(Array.isArray(posts) ? posts.slice(0, 2) : [])
        }
        if (requestsRes.status === 'fulfilled' && requestsRes.value.ok) {
          const d = await requestsRes.value.json()
          const today = new Date()
          const requests = Array.isArray(d.data) ? d.data : []
          const active = requests.find(
            (r) =>
              r.status === 'accepted' &&
              new Date(r.checkInDate) <= today &&
              new Date(r.checkOutDate) >= today
          )
          setActiveStay(active ?? null)
        }
        if (unreadRes.status === 'fulfilled' && unreadRes.value.ok) {
          const d = await unreadRes.value.json()
          setUnreadCount(d.data?.count ?? 0)
        }
        if (tripsRes.status === 'fulfilled' && tripsRes.value.ok) {
          const d = await tripsRes.value.json()
          setRecentTrips(d.data?.posts ?? [])
        }
        if (storiesRes.status === 'fulfilled' && storiesRes.value.ok) {
          const d = await storiesRes.value.json()
          setTravelStories(d.data?.stories ?? [])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `/explore?city=${encodeURIComponent(q)}` : '/explore')
  }

  const firstName = (userProfile?.fullName ?? sessionUser?.fullName ?? '').split(' ')[0] || 'there'
  const isBasicTier = sessionUser?.verificationTier === 'basic'
  const hostName = activeStay?.hostId?.fullName ?? 'your host'
  const hostCity  = activeStay?.hostId?.city    ?? ''

  return (
    <AppLayout title={`${getGreeting()}, ${firstName}!`}>
      <div className="lg:flex lg:gap-0 max-w-5xl mx-auto">
        {/* ── Main feed ── */}
        <div className="flex-1 min-w-0 px-4 py-5 lg:px-8 space-y-6">

          {/* Greeting (mobile) */}
          <div className="lg:hidden flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="text-sm text-gray-500">Ready for your next adventure?</p>
            </div>
            <div className="relative">
              <Avatar src={sessionUser?.profilePhotoUrl} name={sessionUser?.fullName} size="md" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal rounded-full border-2 border-white" />
            </div>
          </div>

          {/* Verification alert */}
          {isBasicTier && (
            <div className="flex items-start gap-3 p-4 bg-amber-lighter border border-amber-light rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
              <p className="flex-1 text-sm text-amber-dark font-medium">
                Get your verified badge — ₹199 one-time · Unlocks everything
              </p>
              <Button
                href="/profile/verification"
                variant="ghost"
                size="sm"
                className="shrink-0 border-amber-dark/30 text-amber-dark hover:bg-amber/10"
              >
                Get verified
              </Button>
            </div>
          )}

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a host in any city..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand shadow-sm transition"
            />
          </form>

          {/* Quick actions */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap scrollbar-hide">
            {[
              { label: 'Browse all hosts',    href: '/explore' },
              { label: 'Female hosts only',   href: '/explore?femaleOnly=true' },
              { label: 'Find cyclists',       href: '/explore?category=cyclist' },
              { label: 'Find trekkers',       href: '/explore?category=trekker' },
              { label: 'Community feed',      href: '/community' },
              { label: 'Find co-traveller',   href: '/cotraveller' },
              { label: 'Place recommendations', href: '/recommendations' },
            ].map(({ label, href }) => (
              <Button key={label} href={href} variant="ghost" size="sm" className="shrink-0 whitespace-nowrap">
                {label}
              </Button>
            ))}
          </div>

          {/* Active stay card */}
          {activeStay && (
            <div className="border-2 border-teal bg-teal-lighter rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-teal shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-teal-dark">
                  Active stay with {hostName}
                </p>
                <p className="text-xs text-teal mt-0.5">
                  {[hostCity, formatDateRange(activeStay.checkInDate, activeStay.checkOutDate)].filter(Boolean).join(' · ')}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    href="/safety"
                    variant="ghost"
                    size="sm"
                    className="border-teal/40 text-teal-dark hover:bg-teal/10"
                  >
                    Safety centre
                  </Button>
                  <Button href={`/messages/${activeStay._id}`} variant="primary" size="sm">
                    View chat
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Suggested hosts */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Verified hosts in {userProfile?.country ?? 'your area'}
              </h2>
              <Button
                href={`/explore${userProfile?.country ? `?country=${encodeURIComponent(userProfile.country)}` : ''}`}
                variant="ghost"
                size="sm"
              >
                See all
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <HostCard.Skeleton key={i} />)}
              </div>
            ) : hosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hosts.map((host) => <HostCard key={host._id} host={host} />)}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No hosts in your country yet.</p>
                <Button href="/explore" variant="ghost" size="sm" className="mt-2">
                  Browse globally →
                </Button>
              </div>
            )}
          </section>

          {/* Recent messages */}
          {unreadCount > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Recent messages</h2>
                <Button href="/messages" variant="ghost" size="sm">View all</Button>
              </div>
              <Link
                href="/messages"
                className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="w-9 h-9 rounded-full bg-brand-lighter flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500">Tap to view your conversations</p>
                </div>
                <span className="w-5 h-5 rounded-full bg-brand text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </Link>
            </section>
          )}

          {/* Recent trip posts */}
          {recentTrips.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Recent trip posts</h2>
                <Button href="/cotraveller" variant="ghost" size="sm">Browse all trips</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentTrips.map(post => (
                  <TripPostCard key={post._id} post={post} currentUserTier={sessionUser?.verificationTier} compact />
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button href="/cotraveller" variant="ghost" size="sm">Browse all trips →</Button>
              </div>
            </section>
          )}

          {/* Community section */}
          <section className="pb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">From the community</h2>
              <Button href="/community" variant="ghost" size="sm">View community</Button>
            </div>
            {communityPosts.length > 0 ? (
              <div className="space-y-3">
                {communityPosts.map((post) => (
                  <PostPreviewCard key={post._id} post={post} />
                ))}
              </div>
            ) : (
              <Link
                href="/community"
                className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
              >
                <Users className="w-6 h-6 text-gray-300 shrink-0" />
                <p className="text-sm text-gray-500">Join the community conversation</p>
              </Link>
            )}
          </section>

          {/* Travel Stories section */}
          {(loading || travelStories.length > 0) && (
            <section className="pb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Travel stories</h2>
                  {!isBasicTier && (
                    <Button
                      href="/community/stories/new"
                      variant="ghost"
                      size="sm"
                      className="text-xs px-0 hover:bg-transparent text-brand"
                    >
                      + Share your story
                    </Button>
                  )}
                </div>
                <Button href="/stories" variant="ghost" size="sm">View all →</Button>
              </div>
              {isBasicTier && (
                <p className="text-xs text-gray-400 mb-3">Get verified to share your own story</p>
              )}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className={`grid gap-3 ${travelStories.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {travelStories.map(story => (
                    <StoryCard key={story._id} story={story} variant="feed" />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Right sidebar (desktop only) ── */}
        <aside className="hidden lg:block w-72 shrink-0 py-5 pr-6 space-y-4 self-start sticky top-14">
          {loading ? (
            <>
              <Skeleton variant="card" className="h-44 w-full" />
              <Skeleton variant="card" className="h-28 w-full" />
              <Skeleton variant="card" className="h-32 w-full" />
            </>
          ) : (
            <>
              <ProfileCompletenessCard profile={userProfile} />
              <QuickStatsCard profile={userProfile} />
              <ShortcutsCard />
            </>
          )}
        </aside>
      </div>
    </AppLayout>
  )
}
