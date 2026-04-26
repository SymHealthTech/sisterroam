'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  Trash2, Pencil, Check, X,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORY_LABELS = {
  general:       'General',
  safety_tips:   'Safety',
  trip_planning: 'Trip Planning',
  looking_for_host: 'Looking for Host',
  hosting_offer: 'Hosting Offer',
  achievements:  'Achievements',
  questions:     'Questions',
}

const TIER_COLORS = {
  basic:   'gray',
  verified: 'teal',
  trusted:  'brand',
}

/* ── Image grid ────────────────────────────────────────────── */
function ImageGrid({ images }) {
  if (!images?.length) return null
  if (images.length === 1) {
    return (
      <div className="relative w-full h-64 rounded-xl overflow-hidden">
        <Image src={images[0]} alt="" fill className="object-cover" />
      </div>
    )
  }
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {images.map((src, i) => (
          <div key={i} className="relative h-48 rounded-xl overflow-hidden">
            <Image src={src} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <div className="relative h-48 rounded-xl overflow-hidden">
        <Image src={images[0]} alt="" fill className="object-cover" />
      </div>
      <div className="grid grid-rows-2 gap-1.5">
        {images.slice(1, 3).map((src, i) => (
          <div key={i} className="relative h-[91px] rounded-xl overflow-hidden">
            <Image src={src} alt="" fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Comment row ───────────────────────────────────────────── */
function CommentItem({ comment }) {
  return (
    <div className="flex gap-2">
      <Avatar
        src={comment.authorId?.profilePhotoUrl}
        name={comment.authorId?.fullName}
        size="xs"
        className="shrink-0 mt-0.5"
      />
      <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1 min-w-0">
        <span className="text-xs font-semibold text-gray-800">
          {comment.authorId?.fullName}
        </span>
        <span className="text-xs text-gray-600 ml-2">{comment.content}</span>
      </div>
    </div>
  )
}

/* ── Main card ─────────────────────────────────────────────── */
export default function PostCard({ post: initialPost, currentUserId, onDelete }) {
  const [post,         setPost]         = useState(initialPost)
  const [expanded,     setExpanded]     = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [sending,      setSending]      = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [editing,      setEditing]      = useState(false)
  const [editContent,  setEditContent]  = useState(post.content)
  const [deleting,     setDeleting]     = useState(false)
  const menuRef = useRef(null)

  const isOwn = post.authorId?._id?.toString() === currentUserId || post.authorId?.toString() === currentUserId

  /* ── Like ──────────────────────────────────────────────── */
  async function toggleLike() {
    const optimisticLiked = !post.hasLiked
    setPost(p => ({
      ...p,
      hasLiked:   optimisticLiked,
      likesCount: optimisticLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
    }))
    const res = await fetch(`/api/community/posts/${post._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like' }),
    })
    if (!res.ok) {
      setPost(p => ({
        ...p,
        hasLiked:   !optimisticLiked,
        likesCount: !optimisticLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
      }))
    }
  }

  /* ── Comments ──────────────────────────────────────────── */
  async function loadComments() {
    if (commentsLoaded) return
    const res = await fetch(`/api/community/posts/${post._id}/comments?limit=20`)
    if (res.ok) {
      const d = await res.json()
      setComments(d.data ?? [])
      setCommentsLoaded(true)
    }
  }

  function toggleComments() {
    const next = !showComments
    setShowComments(next)
    if (next && !commentsLoaded) loadComments()
  }

  async function sendComment(e) {
    e.preventDefault()
    if (!commentInput.trim()) return
    setSending(true)
    const res = await fetch(`/api/community/posts/${post._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentInput.trim() }),
    })
    if (res.ok) {
      const d = await res.json()
      setComments(prev => [...prev, d.data])
      setPost(p => ({ ...p, commentsCount: p.commentsCount + 1 }))
      setCommentInput('')
    } else {
      toast.error('Failed to comment')
    }
    setSending(false)
  }

  /* ── Share ─────────────────────────────────────────────── */
  function share() {
    const url = `${window.location.origin}/community?post=${post._id}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'))
  }

  /* ── Edit ──────────────────────────────────────────────── */
  async function saveEdit() {
    if (!editContent.trim()) return
    const res = await fetch(`/api/community/posts/${post._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    })
    if (res.ok) {
      setPost(p => ({ ...p, content: editContent }))
      setEditing(false)
      toast.success('Post updated')
    } else {
      toast.error('Update failed')
    }
  }

  /* ── Delete ────────────────────────────────────────────── */
  async function confirmDelete() {
    if (!deleting) { setDeleting(true); return }
    const res = await fetch(`/api/community/posts/${post._id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Post deleted')
      onDelete?.(post._id)
    } else {
      toast.error('Delete failed')
      setDeleting(false)
    }
  }

  const isLong = post.content?.length > 240

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={post.authorId?.profilePhotoUrl}
            name={post.authorId?.fullName}
            size="sm"
            className="shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${post.authorId?.username ?? post.authorId?._id}`}
                className="text-sm font-semibold text-gray-900 hover:text-brand transition-colors truncate"
              >
                {post.authorId?.fullName}
              </Link>
              {post.authorId?.verificationTier && post.authorId.verificationTier !== 'basic' && (
                <Badge variant={TIER_COLORS[post.authorId.verificationTier]} size="xs">
                  {post.authorId.verificationTier}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {post.authorId?.city && `${post.authorId.city} · `}
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {post.category && post.category !== 'general' && (
            <Badge variant="brand" size="xs">
              {CATEGORY_LABELS[post.category] ?? post.category}
            </Badge>
          )}
          {isOwn && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 z-20 bg-white border border-gray-100 rounded-xl shadow-lg p-1 min-w-[120px]">
                  <button
                    onClick={() => { setEditing(true); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { confirmDelete(); setMenuOpen(false) }}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors',
                      deleting ? 'text-danger bg-danger-lighter/30' : 'text-danger hover:bg-danger-lighter/30',
                    )}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? 'Confirm delete' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30"
            rows={4}
            maxLength={500}
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs rounded-lg hover:bg-brand-dark transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditContent(post.content) }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className={cn(
            'text-sm text-gray-700 leading-relaxed whitespace-pre-wrap',
            !expanded && isLong && 'line-clamp-3',
          )}>
            {post.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-brand font-medium mt-1 hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Images */}
      <ImageGrid images={post.imageUrls} />

      {/* Action row */}
      <div className="flex items-center gap-4 pt-1 border-t border-gray-50">
        <button
          onClick={toggleLike}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            post.hasLiked ? 'text-pink' : 'text-gray-400 hover:text-pink',
          )}
        >
          <Heart className={cn('w-4 h-4', post.hasLiked && 'fill-pink')} />
          <span>{post.likesCount || 0}</span>
        </button>

        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentsCount || 0}</span>
        </button>

        <button
          onClick={share}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-teal transition-colors ml-auto"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Comment section */}
      {showComments && (
        <div className="space-y-2 border-t border-gray-50 pt-3">
          {comments.slice(0, 2).map(c => (
            <CommentItem key={c._id} comment={c} />
          ))}
          {comments.length > 2 && (
            <button
              onClick={() => loadComments()}
              className="text-xs text-brand hover:underline"
            >
              View all {post.commentsCount} comments
            </button>
          )}
          <form onSubmit={sendComment} className="flex gap-2 mt-2">
            <input
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
              className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || sending}
              className="px-3 py-1.5 bg-brand text-white text-xs rounded-full disabled:opacity-50 hover:bg-brand-dark transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
