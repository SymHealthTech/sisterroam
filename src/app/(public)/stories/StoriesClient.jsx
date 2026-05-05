'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import StoryCard from '@/components/stories/StoryCard'
import Skeleton from '@/components/ui/Skeleton'
import { Search } from 'lucide-react'

const CATEGORY_LABELS = {
  solo_travel:             'Solo Travel',
  cycling:                 'Cycling',
  trekking:                'Trekking',
  running:                 'Running',
  safety_experience:       'Safety',
  cultural_immersion:      'Culture',
  food_journey:            'Food & Drink',
  budget_travel:           'Budget Travel',
  tips_and_advice:         'Tips & Advice',
  co_traveller_experience: 'Co-traveller',
  hosting_experience:      'Hosting',
  destination_guide:       'Destination Guide',
}

export default function StoriesClient() {
  const { status } = useSession()
  const [stories,     setStories]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [category,    setCategory]    = useState('')
  const [search,      setSearch]      = useState('')
  const [page,        setPage]        = useState(1)
  const [hasMore,     setHasMore]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  async function loadStories(cat, pg, reset) {
    const params = new URLSearchParams({ sort: 'featured', limit: '12', page: String(pg) })
    if (cat) params.set('category', cat)
    const res = await fetch(`/api/stories?${params}`)
    if (res.ok) {
      const d = await res.json()
      const list = d.data?.stories ?? []
      setStories(prev => reset ? list : [...prev, ...list])
      setHasMore(pg < (d.data?.totalPages ?? 1))
    }
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    setLoading(true)
    setPage(1)
    loadStories(category, 1, true)
  }, [category])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    setLoadingMore(true)
    loadStories(category, next, false)
  }

  const filtered = search.trim()
    ? stories.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.excerpt?.toLowerCase().includes(search.toLowerCase())
      )
    : stories

  const featured = filtered.find(s => s.isFeatured) ?? filtered[0]
  const rest      = filtered.filter(s => s._id !== featured?._id)

  return (
    <>
      {/* Hero */}
      <section className="bg-brand pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-white">Travel Stories</h1>
          <p className="text-white/75 text-lg">Authentic experiences from verified female solo travellers</p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stories..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-sm text-gray-900 focus:outline-none focus:border-brand focus:ring-0/30"
            />
          </div>
        </div>
      </section>

      {/* Category pills */}
      <div className="bg-white border-b border-gray-100 sticky top-[60px] z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
              category === '' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-brand-lighter hover:text-brand'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setCategory(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                category === val ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-brand-lighter hover:text-brand'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stories grid */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {loading ? (
          <div className="space-y-6">
            <Skeleton variant="card" className="h-72 w-full rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} variant="card" className="h-72 rounded-2xl" />)}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No stories yet</p>
            <p className="text-sm mt-2">Be the first — join SisterRoam and share your experience.</p>
            <Link
              href="/signup"
              className="inline-block mt-4 px-6 py-3 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
            >
              Join free
            </Link>
          </div>
        ) : (
          <>
            {featured && <StoryCard story={featured} variant="featured" />}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map(s => <StoryCard key={s._id} story={s} variant="full" />)}
              </div>
            )}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 border border-brand/30 text-brand text-sm font-medium rounded-xl hover:bg-brand-lighter/30 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more stories'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Story CTA */}
      <section className="bg-brand-lighter py-12 px-4">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <h2 className="text-xl font-bold text-brand">Share your travel story</h2>
          <p className="text-brand-dark text-sm">
            {status === 'authenticated'
              ? 'Write and publish your experience with the SisterRoam community.'
              : 'Join SisterRoam to share authentic experiences with verified sisters worldwide.'}
          </p>
          {status === 'authenticated' ? (
            <Link
              href="/community/stories/new"
              className="inline-block px-6 py-3 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
            >
              Write a story
            </Link>
          ) : status !== 'loading' && (
            <Link
              href="/signup"
              className="inline-block px-6 py-3 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
            >
              Join free
            </Link>
          )}
        </div>
      </section>
    </>
  )
}
