'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppLayout from '@/components/layout/AppLayout'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Star, Globe } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

const TABS = ['All', 'Pending', 'Accepted', 'Declined']

const CATEGORY_LABELS = {
  solo_traveller: 'Solo traveller', backpacker: 'Backpacker', cyclist: 'Cyclist',
  trekker: 'Trekker', runner: 'Runner', ultramarathon: 'Ultra runner',
  road_tripper: 'Road tripper', family_tourist: 'Family traveller',
}

function InterestCard({ interest, onAccept, onDecline }) {
  const user = interest.interestedUserId ?? {}
  const [loading, setLoading] = useState(false)
  const isPending = interest.status === 'pending'

  async function handle(action) {
    setLoading(true)
    try { await (action === 'accept' ? onAccept : onDecline)(interest._id) }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar src={user.profilePhotoUrl} name={user.fullName} size="md" />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
              {user.verificationTier === 'trusted' && <Badge variant="trusted">Trusted</Badge>}
              {['verified', 'trusted'].includes(user.verificationTier) && <Badge variant="verified">✓</Badge>}
            </div>
            <p className="text-xs text-gray-500">
              {[user.city, user.country].filter(Boolean).join(', ')}
            </p>
            {user.languages?.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                <Globe className="w-3 h-3 inline mr-1" />{user.languages.join(', ')}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {user.totalStays > 0 && <span>{user.totalStays} stay{user.totalStays !== 1 ? 's' : ''}</span>}
              {user.averageRating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber text-amber" />
                  {user.averageRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          {interest.status === 'accepted' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-lighter text-teal font-medium">Accepted</span>
          )}
          {interest.status === 'declined' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Declined</span>
          )}
          {interest.createdAt && (
            <p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(interest.createdAt)}</p>
          )}
        </div>
      </div>

      {/* Categories */}
      {user.travellerCategories?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {user.travellerCategories.map(c => (
            <span key={c} className="text-[10px] bg-brand-lighter text-brand px-2 py-0.5 rounded-full">
              {CATEGORY_LABELS[c] ?? c}
            </span>
          ))}
        </div>
      )}

      {/* Message */}
      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs font-semibold text-gray-500 mb-1.5">Her message</p>
        <p className="text-sm text-gray-700 leading-relaxed">{interest.message}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link href={`/user/${user._id}`} className="text-xs text-brand hover:text-brand-dark font-medium">
          View profile →
        </Link>

        {isPending && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-lighter hover:text-danger border-danger/20"
              loading={loading}
              onClick={() => handle('decline')}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={() => handle('accept')}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />Accept
            </Button>
          </div>
        )}

        {interest.status === 'accepted' && interest.chatRequestId && (
          <Button href={`/messages/${interest.chatRequestId}`} variant="primary" size="sm">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />Chat →
          </Button>
        )}
      </div>
    </div>
  )
}

export default function TripInterestsPage({ params }) {
  const { postId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const userId = session?.user?.id

  const [post,      setPost]      = useState(null)
  const [interests, setInterests] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    async function load() {
      const [postRes, intRes] = await Promise.all([
        fetch(`/api/cotraveller/${postId}`),
        fetch(`/api/cotraveller/${postId}/interest`),
      ])
      if (!postRes.ok) { router.replace('/cotraveller'); return }
      const postData = await postRes.json()
      const p = postData.data?.post
      if (!p) { router.replace('/cotraveller'); return }

      // Redirect if not author
      const authorId = p.authorId?._id ?? p.authorId
      if (authorId?.toString() !== userId) {
        router.replace(`/cotraveller/${postId}`)
        return
      }

      setPost(p)

      if (intRes.ok) {
        const intData = await intRes.json()
        setInterests(intData.data ?? [])
      }
      setLoading(false)
    }
    if (postId && userId) load()
  }, [postId, userId, router])

  async function handleAccept(interestId) {
    const res = await fetch(`/api/cotraveller/${postId}/interest`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interestId, action: 'accept' }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
    toast.success('Co-traveller accepted! Chat opened.')
    setInterests(prev => prev.map(i => i._id === interestId
      ? { ...i, status: 'accepted', chatRequestId: data.data?.chatRequestId }
      : i
    ))
  }

  async function handleDecline(interestId) {
    const res = await fetch(`/api/cotraveller/${postId}/interest`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interestId, action: 'decline' }),
    })
    if (!res.ok) { toast.error('Failed'); return }
    toast.success('Interest declined')
    setInterests(prev => prev.map(i => i._id === interestId ? { ...i, status: 'declined' } : i))
  }

  const filtered = interests.filter(i => {
    if (activeTab === 0) return true
    return i.status === ['pending', 'accepted', 'declined'][activeTab - 1]
  })

  const counts = {
    all:      interests.length,
    pending:  interests.filter(i => i.status === 'pending').length,
    accepted: interests.filter(i => i.status === 'accepted').length,
    declined: interests.filter(i => i.status === 'declined').length,
  }

  if (loading) {
    return (
      <AppLayout title="Trip interests">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} variant="card" className="h-40" />)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Trip interests">
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Back */}
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" />Back to trip
        </button>

        <h1 className="text-lg font-bold text-gray-900">
          {interests.length} sister{interests.length !== 1 ? 's' : ''} want to join your trip to {post?.toCity}
        </h1>

        {/* Filter tabs */}
        <div className="flex border-b border-gray-100">
          {TABS.map((label, i) => {
            const countKey = label.toLowerCase()
            const count = counts[countKey] ?? 0
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveTab(i)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium transition-colors border-b-2',
                  activeTab === i ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {label} {count > 0 && <span className="ml-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{count}</span>}
              </button>
            )
          })}
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(interest => (
              <InterestCard
                key={interest._id}
                interest={interest}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No {activeTab === 0 ? '' : TABS[activeTab].toLowerCase() + ' '}interests yet</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
