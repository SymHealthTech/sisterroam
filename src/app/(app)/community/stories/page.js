'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import AppLayout, { useAppUser } from '@/components/layout/AppLayout'
import StoryCard from '@/components/stories/StoryCard'
import Skeleton from '@/components/ui/Skeleton'
import { BookOpen, Lock, Pencil } from 'lucide-react'
import { UnderReviewModal } from '@/components/ui/VerificationGate'

const CATEGORY_LABELS = {
  solo_travel: 'Solo Travel', cycling: 'Cycling', trekking: 'Trekking',
  running: 'Running', safety_experience: 'Safety', cultural_immersion: 'Culture',
  food_journey: 'Food', budget_travel: 'Budget', tips_and_advice: 'Tips',
  co_traveller_experience: 'Co-traveller', hosting_experience: 'Hosting',
  destination_guide: 'Guides',
}

export default function CommunityStoriesPage() {
  const { data: session } = useSession()
  const [stories,     setStories]     = useState([])
  const [drafts,      setDrafts]      = useState([])
  const [fetchedCat,  setFetchedCat]  = useState(null)  // null = initial load not done yet
  const [category,    setCategory]    = useState('')
  const [page,        setPage]        = useState(1)
  const [hasMore,     setHasMore]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Derived: true while awaiting first fetch or after a category switch
  const loading = fetchedCat !== category

  const appUser = useAppUser()
  const tier = appUser?.verificationTier ?? session?.user?.verificationTier
  const isVerified = tier === 'verified' || tier === 'trusted'
  const isUnderReview = tier === 'paid'
  const [showReviewModal, setShowReviewModal] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const params = new URLSearchParams({ sort: 'newest', limit: '9', page: '1' })
      if (category) params.set('category', category)
      const res = await fetch(`/api/stories?${params}`)
      if (!cancelled) {
        if (res.ok) {
          const d = await res.json()
          setStories(d.data?.stories ?? [])
          setHasMore(1 < (d.data?.totalPages ?? 1))
          setPage(1)
        }
        setFetchedCat(category)
      }
    })()
    return () => { cancelled = true }
  }, [category])

  useEffect(() => {
    if (!session?.user?.id) return
    fetch('/api/stories/my-stories')
      .then(r => r.json())
      .then(d => {
        const all = d.data?.stories ?? []
        setDrafts(all.filter(s => !s.isPublished))
      })
  }, [session?.user?.id])

  async function handleLoadMore() {
    const next = page + 1
    setPage(next)
    setLoadingMore(true)
    const params = new URLSearchParams({ sort: 'newest', limit: '9', page: String(next) })
    if (category) params.set('category', category)
    const res = await fetch(`/api/stories?${params}`)
    if (res.ok) {
      const d = await res.json()
      setStories(prev => [...prev, ...(d.data?.stories ?? [])])
      setHasMore(next < (d.data?.totalPages ?? 1))
    }
    setLoadingMore(false)
  }

  return (
    <AppLayout title="Travel Stories">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-10 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Travel Stories</h1>
            <p className="text-sm text-gray-500 mt-0.5">Shared by verified sisters from around the world</p>
          </div>
          {isVerified && (
            <Link
              href="/community/stories/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Share story
            </Link>
          )}
          {isUnderReview && (
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Share story
            </button>
          )}
        </div>

        {showReviewModal && <UnderReviewModal onClose={() => setShowReviewModal(false)} />}

        {/* Drafts section */}
        {drafts.length > 0 && (
          <details className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50">
              Your drafts ({drafts.length})
            </summary>
            <ul className="divide-y divide-gray-100">
              {drafts.map(d => (
                <li key={d._id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-gray-700 truncate">{d.title}</p>
                  <Link
                    href={`/community/stories/new?draft=${d._id}`}
                    className="text-xs text-brand hover:underline shrink-0 ml-4"
                  >
                    Continue writing →
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[{ value: '', label: 'All' }, ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))].map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                category === c.value
                  ? 'bg-brand text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand/30'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Stories */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} variant="card" className="h-48" />)}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">No stories yet</p>
            {isVerified && (
              <Link href="/community/stories/new" className="text-sm text-brand mt-2 block hover:underline">
                Be the first to share →
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {stories.map(s => (
                <StoryCard
                  key={s._id}
                  story={s}
                  variant="full"
                  currentUserId={session?.user?.id}
                  basePath="/community/stories"
                />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 text-sm text-brand font-medium border border-brand/20 rounded-2xl hover:bg-brand-lighter/30 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more stories'}
              </button>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
