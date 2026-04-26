'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import AppLayout from '@/components/layout/AppLayout'
import BlogCard from '@/components/community/BlogCard'
import Skeleton from '@/components/ui/Skeleton'
import { ShieldCheck, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const CATEGORIES = [
  { value: '',           label: 'All' },
  { value: 'solo_travel', label: 'Solo Travel' },
  { value: 'cycling',    label: 'Cycling' },
  { value: 'trekking',   label: 'Trekking' },
  { value: 'safety',     label: 'Safety' },
  { value: 'culture',    label: 'Culture' },
  { value: 'food',       label: 'Food' },
  { value: 'tips',       label: 'Tips' },
]

function FeaturedPost({ post }) {
  if (!post) return null
  return (
    <Link
      href={`/community/blog/${post.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {post.coverImageUrl && (
        <div className="relative h-56">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <span className="inline-block px-2.5 py-1 bg-brand text-white text-xs rounded-full font-medium mb-2">
              Featured
            </span>
            <h2 className="text-white font-bold text-lg leading-tight">{post.title}</h2>
            <p className="text-white/80 text-sm mt-1">
              {post.authorId?.fullName} · {formatDate(post.publishedAt)}
              {post.readTimeMinutes && ` · ${post.readTimeMinutes} min read`}
            </p>
          </div>
        </div>
      )}
      {!post.coverImageUrl && (
        <div className="p-5 space-y-2">
          <span className="inline-block px-2.5 py-1 bg-brand text-white text-xs rounded-full font-medium">
            Featured
          </span>
          <h2 className="text-gray-900 font-bold text-lg leading-tight group-hover:text-brand transition-colors">
            {post.title}
          </h2>
          {post.excerpt && <p className="text-gray-500 text-sm">{post.excerpt}</p>}
          <p className="text-xs text-gray-400">
            {post.authorId?.fullName} · {formatDate(post.publishedAt)}
          </p>
        </div>
      )}
    </Link>
  )
}

export default function CommunityBlogPage() {
  const { data: session } = useSession()
  const [posts,    setPosts]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [category, setCategory] = useState('')
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const isVerified = ['verified', 'trusted'].includes(session?.user?.verificationTier)

  async function loadPosts(cat, pg, reset) {
    const params = new URLSearchParams({ page: pg, limit: 9 })
    if (cat) params.set('category', cat)
    const res = await fetch(`/api/blog?${params}`)
    if (res.ok) {
      const d = await res.json()
      const list = d.data?.posts ?? []
      setPosts(prev => reset ? list : [...prev, ...list])
      setHasMore(pg < (d.data?.totalPages ?? 1))
    }
    setLoading(false)
    setLoadingMore(false)
  }

  useEffect(() => {
    setLoading(true)
    setPage(1)
    loadPosts(category, 1, true)
  }, [category])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    setLoadingMore(true)
    loadPosts(category, next, false)
  }

  const featured = posts[0]
  const rest     = posts.slice(1)

  return (
    <AppLayout title="Community Blog">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Community Blog</h1>
            <p className="text-sm text-gray-500 mt-0.5">Stories and guides from verified sisters</p>
          </div>
          {isVerified ? (
            <Link
              href="/community/blog/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-dark transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Write
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified to write
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(c => (
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

        {loading ? (
          <div className="space-y-4">
            <Skeleton variant="card" className="h-56" />
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} variant="card" className="h-48" />)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-base font-medium">No posts yet</p>
            {isVerified && (
              <Link href="/community/blog/new" className="text-sm text-brand mt-2 block hover:underline">
                Be the first to write →
              </Link>
            )}
          </div>
        ) : (
          <>
            <FeaturedPost post={featured} />
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rest.map(p => <BlogCard key={p._id} post={{ ...p, coverImage: p.coverImageUrl, author: p.authorId }} />)}
              </div>
            )}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 text-sm text-brand font-medium border border-brand/20 rounded-2xl hover:bg-brand-lighter/30 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more posts'}
              </button>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
