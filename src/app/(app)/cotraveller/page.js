'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppLayout, { useAppUser } from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import TripPostCard from '@/components/cotraveller/TripPostCard'
import PostTripModal from '@/components/cotraveller/PostTripModal'
import Badge from '@/components/ui/Badge'
import { Search, SlidersHorizontal, UserPlus, Users, Heart, X } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

const TABS = ['Browse trips', 'My posts', 'My interests']

const TRAVELLER_FILTERS = [
  { value: 'backpacker',     label: 'Backpacker' },
  { value: 'cyclist',        label: 'Cyclist' },
  { value: 'trekker',        label: 'Trekker' },
  { value: 'runner',         label: 'Runner' },
  { value: 'solo_traveller', label: 'Solo traveller' },
  { value: 'road_tripper',   label: 'Road tripper' },
]

const STATUS_COLORS = {
  open:      'bg-teal-lighter text-teal',
  filled:    'bg-brand-lighter text-brand',
  cancelled: 'bg-gray-100 text-gray-500',
  expired:   'bg-gray-100 text-gray-500',
}

function MyPostCard({ post }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {post.fromCity} → {post.toCity} · {post.departureDate ? new Date(post.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[post.status] ?? STATUS_COLORS.expired)}>
            {post.status?.charAt(0).toUpperCase() + post.status?.slice(1)}
          </span>
          <span className="text-xs text-gray-400">
            <Heart className="w-3 h-3 inline mr-0.5" />{post.interestedCount ?? 0} interested
          </span>
        </div>
      </div>
      <Link href={`/cotraveller/${post._id}/interests`} className="text-xs text-brand font-medium hover:text-brand-dark whitespace-nowrap mt-1">
        View interests →
      </Link>
    </div>
  )
}

function InterestCard({ item }) {
  const post   = item.postId ?? {}
  const author = post.authorId ?? {}

  const statusConfig = {
    pending:  { label: 'Pending', cls: 'bg-amber-lighter text-amber-dark' },
    accepted: { label: 'Matched!', cls: 'bg-teal-lighter text-teal' },
    declined: { label: 'Not matched', cls: 'bg-gray-100 text-gray-500' },
  }[item.status] ?? { label: item.status, cls: 'bg-gray-100 text-gray-500' }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {post.fromCity} → {post.toCity}
          </p>
          <p className="text-xs text-gray-500">
            by {author.fullName} · {post.departureDate ? new Date(post.departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
          </p>
        </div>
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0', statusConfig.cls)}>
          {statusConfig.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 italic line-clamp-2">"{item.message}"</p>
      {item.status === 'accepted' && item.chatRequestId && (
        <Link href={`/messages/${item.chatRequestId}`} className="text-xs text-brand font-medium hover:text-brand-dark">
          Open chat →
        </Link>
      )}
    </div>
  )
}

export default function CoTravellerPage() {
  const { data: session } = useSession()
  const appUser  = useAppUser()
  // Prefer freshUser from AppLayout context (DB data); fall back to JWT session
  const userTier = (appUser ?? session?.user)?.verificationTier

  const [activeTab, setActiveTab] = useState(0)
  const [showModal,   setModal]   = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [posts,   setPosts]   = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [myInterests, setMyInterests] = useState({ pending: [], accepted: [], declined: [] })
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    travelStyle: '',
    verifiedOnly: false,
  })

  const fetchPosts = useCallback(async (p = 1, f = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12', status: 'open' })
      if (f.search)       params.set('toCity', f.search)
      if (f.travelStyle)  params.set('travelStyle', f.travelStyle)
      if (f.verifiedOnly) params.set('verifiedOnly', 'true')

      const res = await fetch(`/api/cotraveller?${params}`)
      if (!res.ok) return
      const data = await res.json()
      if (p === 1) setPosts(data.data?.posts ?? [])
      else         setPosts(prev => [...prev, ...(data.data?.posts ?? [])])
      setTotal(data.data?.total ?? 0)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchMyPosts = useCallback(async () => {
    const res = await fetch('/api/cotraveller/my-posts')
    if (res.ok) {
      const data = await res.json()
      setMyPosts(data.data ?? [])
    }
  }, [])

  const fetchMyInterests = useCallback(async () => {
    const res = await fetch('/api/cotraveller/my-interests')
    if (res.ok) {
      const data = await res.json()
      setMyInterests(data.data ?? { pending: [], accepted: [], declined: [] })
    }
  }, [])

  useEffect(() => {
    if (activeTab === 0) fetchPosts(1, filters)
    if (activeTab === 1) fetchMyPosts()
    if (activeTab === 2) fetchMyInterests()
  }, [activeTab])

  function applyFilters() {
    setShowFilters(false)
    fetchPosts(1, filters)
  }

  function clearFilters() {
    const f = { search: '', travelStyle: '', verifiedOnly: false }
    setFilters(f)
    fetchPosts(1, f)
  }

  const hasFilters = filters.search || filters.travelStyle || filters.verifiedOnly

  return (
    <AppLayout title="Find a co-traveller">
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-lighter to-brand/10 px-5 py-8 text-center">
        <UserPlus className="w-8 h-8 text-brand mx-auto mb-2" />
        <h1 className="text-xl font-bold text-gray-900">Find your travel companion</h1>
        <p className="text-sm text-gray-600 mt-1 max-w-sm mx-auto">
          Connect with verified sisters who share your destination. Travel together, explore fearlessly.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="primary" size="sm" onClick={() => setModal(true)}>
            Post my trip
          </Button>
          <Link href="#my-activity" className="text-sm text-brand font-medium hover:text-brand-dark" onClick={() => setActiveTab(1)}>
            My posts &amp; interests →
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[52px] lg:top-14 z-10 bg-white border-b border-gray-100">
        <div className="flex max-w-3xl mx-auto">
          {TABS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(i)}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === i
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* ── Browse trips tab ── */}
        {activeTab === 0 && (
          <>
            {/* Search + filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by destination city..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && fetchPosts(1, filters)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(f => !f)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  showFilters || hasFilters
                    ? 'bg-brand text-white border-brand'
                    : 'border-gray-200 text-gray-600 hover:border-brand'
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Travel style</p>
                  <div className="flex flex-wrap gap-2">
                    {TRAVELLER_FILTERS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFilters(f => ({ ...f, travelStyle: f.travelStyle === value ? '' : value }))}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs border transition-colors',
                          filters.travelStyle === value
                            ? 'bg-brand text-white border-brand'
                            : 'border-gray-200 text-gray-600 hover:border-brand'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={e => setFilters(f => ({ ...f, verifiedOnly: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand"
                  />
                  <span className="text-sm text-gray-700">Verified members only</span>
                </label>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={applyFilters}>Apply filters</Button>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-3.5 h-3.5 mr-1" />Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Results count */}
            {!loading && (
              <p className="text-xs text-gray-500">
                {total} open trip{total !== 1 ? 's' : ''} found
              </p>
            )}

            {/* Trip cards */}
            {loading && page === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <TripPostCard.Skeleton key={i} />)}
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {posts.map(post => (
                    <TripPostCard
                      key={post._id}
                      post={post}
                      currentUserTier={userTier}
                    />
                  ))}
                </div>
                {posts.length < total && (
                  <div className="flex justify-center pt-2">
                    <Button variant="ghost" size="sm" loading={loading} onClick={() => fetchPosts(page + 1, filters)}>
                      Load more trips
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Users className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-sm font-medium text-gray-500">No trips posted yet for this destination</p>
                <p className="text-xs text-gray-400">Be the first to post your trip plan</p>
                <Button variant="primary" size="sm" onClick={() => setModal(true)}>
                  Post a trip
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── My posts tab ── */}
        {activeTab === 1 && (
          <div className="space-y-4" id="my-activity">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">{myPosts.length} trip{myPosts.length !== 1 ? 's' : ''} posted</p>
              <Button variant="primary" size="sm" onClick={() => setModal(true)}>
                + Post a new trip
              </Button>
            </div>
            {myPosts.length > 0 ? (
              <div className="space-y-3">
                {myPosts.map(post => <MyPostCard key={post._id} post={post} />)}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <UserPlus className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-sm text-gray-500">You haven't posted any trips yet</p>
                <Button variant="primary" size="sm" onClick={() => setModal(true)}>Post your first trip</Button>
              </div>
            )}
          </div>
        )}

        {/* ── My interests tab ── */}
        {activeTab === 2 && (
          <div className="space-y-6">
            {(['pending', 'accepted', 'declined']).map(status => {
              const items = myInterests[status] ?? []
              if (items.length === 0) return null
              const label = { pending: 'Pending', accepted: 'Accepted', declined: 'Not matched' }[status]
              return (
                <section key={status}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{label} ({items.length})</h3>
                  <div className="space-y-3">
                    {items.map(item => <InterestCard key={item._id} item={item} />)}
                  </div>
                </section>
              )
            })}
            {Object.values(myInterests).every(a => a.length === 0) && (
              <div className="text-center py-12 space-y-3">
                <Heart className="w-10 h-10 text-gray-200 mx-auto" />
                <p className="text-sm text-gray-500">You haven't expressed interest in any trips yet</p>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab(0)}>Browse trips →</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <PostTripModal
          onClose={() => setModal(false)}
          onCreated={() => {
            fetchPosts(1, filters)
            fetchMyPosts()
          }}
        />
      )}
    </AppLayout>
  )
}
