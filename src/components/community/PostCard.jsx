'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, MessageCircle, Share2, MoreHorizontal,
  Trash2, Pencil, Check, X, ChevronLeft, ChevronRight, ImagePlus,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { compressImage, directUpload } from '@/lib/uploadClient'
import toast from 'react-hot-toast'

const MAX_IMAGES = 7

const CATEGORY_LABELS = {
  general:       'General',
  safety_tips:   'Safety',
  trip_planning: 'Trip Planning',
  looking_for_host: 'Looking for Host',
  hosting_offer: 'Hosting Offer',
  achievements:  'Achievements',
  questions:     'Questions',
}

/* ── Lightbox ──────────────────────────────────────────────── */
function Lightbox({ images, index, onClose, onChange }) {
  if (index === null) return null
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-1.5 hover:bg-black/80 transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(index - 1) }}
          className="absolute left-3 text-white bg-black/50 rounded-full p-1.5 hover:bg-black/80 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <div className="relative max-h-[88vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        <Image
          src={images[index]}
          alt=""
          width={1200}
          height={900}
          className="max-h-[88vh] max-w-[92vw] w-auto h-auto object-contain rounded-lg shadow-2xl"
        />
      </div>

      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(index + 1) }}
          className="absolute right-3 text-white bg-black/50 rounded-full p-1.5 hover:bg-black/80 transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <p className="absolute bottom-4 text-white/70 text-sm select-none">
        {index + 1} / {images.length}
      </p>
    </div>
  )
}


/* ── Mobile image modal ────────────────────────────────────── */
function MobileImageModal({ images, startIndex, onClose, hasLiked, likesCount, onLike }) {
  const containerRef  = useRef(null)
  const imgRefs       = useRef([])
  const prevStRef     = useRef(0)
  const hasScrolled   = useRef(false)
  const [zoomed, setZoomed] = useState(null)

  // Lock body scroll + disable pull-to-refresh
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overscrollBehavior = ''
    }
  }, [])

  // Prevent pull-to-refresh only when pulling up at the top (finger moving down)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startY = 0
    const onStart = (e) => { startY = e.touches[0].clientY }
    const onMove  = (e) => {
      const dy = e.touches[0].clientY - startY
      if (el.scrollTop <= 0 && dy > 0 && e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
    }
  }, [])

  // Scroll to tapped image after render
  useEffect(() => {
    const t = setTimeout(() => {
      imgRefs.current[startIndex]?.scrollIntoView({ behavior: 'instant', block: 'start' })
    }, 80)
    return () => clearTimeout(t)
  }, [startIndex])

  // Close only after last image is fully visible and user scrolls further
  const handleScroll = useCallback((e) => {
    const el = e.currentTarget
    const st = el.scrollTop
    const goingDown = st > prevStRef.current
    prevStRef.current = st
    if (st > 30) hasScrolled.current = true
    const atBottom = st + el.clientHeight >= el.scrollHeight - 1
    if (goingDown && atBottom && hasScrolled.current) onClose()
  }, [onClose])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black overflow-y-auto overscroll-y-none"
      onScroll={handleScroll}
    >
      {images.map((src, i) => (
        <div key={i}>
          <div
            ref={el => { imgRefs.current[i] = el }}
            className="w-full cursor-pointer"
            onClick={() => setZoomed(src)}
          >
            <Image
              src={src}
              alt=""
              width={1200}
              height={900}
              sizes="100vw"
              className="w-full h-auto block"
              priority={i === startIndex}
            />
          </div>

          {/* Gap with like button */}
          {i < images.length - 1 && (
            <div className="bg-gray-50 flex items-center gap-3 px-5 py-3 border-y border-gray-100">
              <button
                onClick={onLike}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  hasLiked ? 'text-pink' : 'text-gray-400 hover:text-pink',
                )}
              >
                <Heart className={cn('w-5 h-5', hasLiked && 'fill-pink')} />
                <span className="text-sm font-medium text-gray-600">{likesCount || 0}</span>
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Buffer so the last image is fully visible before the modal closes */}
      <div className="h-[60vh] bg-transparent" />

      {/* Single image zoom – centered with equal top/bottom margin */}
      {zoomed && (
        <div className="fixed inset-0 z-[60] bg-black overflow-y-auto">
          <button
            onClick={() => setZoomed(null)}
            className="absolute top-4 right-4 z-10 text-white bg-black/50 rounded-full p-1.5 hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-h-full flex items-center justify-center py-14">
            <Image
              src={zoomed}
              alt=""
              width={1200}
              height={900}
              sizes="100vw"
              className="w-full h-auto block"
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Image grid ────────────────────────────────────────────── */
function ImageGrid({ images, priority = false, hasLiked, likesCount, onLike }) {
  const [lightbox,  setLightbox]  = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFrom, setModalFrom] = useState(0)
  const [isMobile,  setIsMobile]  = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!images?.length) return null
  const count = images.length

  const open = (i) => {
    if (isMobile) { setModalFrom(i); setModalOpen(true) }
    else setLightbox(i)
  }

  const cell = (src, i, extraClass = '') => (
    <div
      key={i}
      onClick={() => open(i)}
      className={`relative overflow-hidden cursor-pointer rounded-xl ${extraClass}`}
    >
      <Image src={src} alt="" fill sizes="(max-width: 768px) 100vw, 340px" priority={priority && i === 0} className="object-cover hover:brightness-90 transition-[filter]" />
    </div>
  )

  // Last visible slot on mobile with "+N" remaining overlay
  const overflowCell = (src, i, remaining, extraClass = '') => (
    <div
      key={i}
      onClick={() => open(i)}
      className={`relative overflow-hidden cursor-pointer rounded-xl ${extraClass}`}
    >
      <Image src={src} alt="" fill sizes="50vw" className="object-cover brightness-50" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-white text-2xl font-bold drop-shadow">+{remaining}</span>
      </div>
    </div>
  )

  return (
    <>
      <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} onChange={setLightbox} />
      {modalOpen && (
        <MobileImageModal
          images={images}
          startIndex={modalFrom}
          onClose={() => setModalOpen(false)}
          hasLiked={hasLiked}
          likesCount={likesCount}
          onLike={onLike}
        />
      )}

      {/* ── Mobile: max 3 slots, +N on last if more ── */}
      <div className="sm:hidden">
        {count === 1 && (
          <div className="relative w-full h-64 rounded-xl overflow-hidden">
            {cell(images[0], 0, 'h-full w-full')}
          </div>
        )}
        {count === 2 && (
          <div className="grid grid-cols-2 gap-1.5 h-52">
            {images.map((src, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden">
                {cell(src, i, 'h-full w-full')}
              </div>
            ))}
          </div>
        )}
        {count >= 3 && (
          <div className="grid grid-cols-2 gap-1.5 h-52">
            <div className="relative rounded-xl overflow-hidden">
              {cell(images[0], 0, 'h-full w-full')}
            </div>
            <div className="grid grid-rows-2 gap-1.5">
              <div className="relative rounded-xl overflow-hidden">
                {cell(images[1], 1, 'h-full w-full')}
              </div>
              <div className="relative rounded-xl overflow-hidden">
                {count > 3
                  ? overflowCell(images[2], 2, count - 3, 'h-full w-full')
                  : cell(images[2], 2, 'h-full w-full')
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop: full Facebook grid ── */}
      <div className="hidden sm:block">
        {count === 1 && (
          <div className="relative w-full h-64 rounded-xl overflow-hidden">
            {cell(images[0], 0, 'h-full w-full')}
          </div>
        )}

        {count === 2 && (
          <div className="grid grid-cols-2 gap-1.5">
            {images.map((src, i) => (
              <div key={i} className="relative h-52 rounded-xl overflow-hidden">
                {cell(src, i, 'h-full w-full')}
              </div>
            ))}
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-2 gap-1.5 h-52">
            <div className="relative rounded-xl overflow-hidden">
              {cell(images[0], 0, 'h-full w-full')}
            </div>
            <div className="grid grid-rows-2 gap-1.5">
              {[1, 2].map(i => (
                <div key={i} className="relative rounded-xl overflow-hidden">
                  {cell(images[i], i, 'h-full w-full')}
                </div>
              ))}
            </div>
          </div>
        )}

        {count === 4 && (
          <div className="grid grid-cols-2 gap-1.5">
            {images.map((src, i) => (
              <div key={i} className="relative h-40 rounded-xl overflow-hidden">
                {cell(src, i, 'h-full w-full')}
              </div>
            ))}
          </div>
        )}

        {count >= 5 && (
          <div className="space-y-1.5">
            <div className="grid gap-1.5 h-44" style={{ gridTemplateColumns: `repeat(${Math.ceil(count / 2)}, 1fr)` }}>
              {images.slice(0, Math.ceil(count / 2)).map((src, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden">
                  {cell(src, i, 'h-full w-full')}
                </div>
              ))}
            </div>
            <div className="grid gap-1.5 h-36" style={{ gridTemplateColumns: `repeat(${Math.floor(count / 2)}, 1fr)` }}>
              {images.slice(Math.ceil(count / 2)).map((src, i) => {
                const idx = Math.ceil(count / 2) + i
                return (
                  <div key={i} className="relative rounded-xl overflow-hidden">
                    {cell(src, idx, 'h-full w-full')}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Confirm dialog ────────────────────────────────────────── */
function ConfirmDialog({
  open, onCancel, onConfirm, loading,
  title = 'Delete post?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-100 rounded-full p-2 shrink-0">
            <Trash2 className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-xl hover:bg-danger/90 transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
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
export default function PostCard({ post: initialPost, currentUserId, currentUserTier, onDelete, priority = false }) {
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
  const [editImages,   setEditImages]   = useState([])   // staged { url, publicId }
  const [savingEdit,   setSavingEdit]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [confirmOpen,  setConfirmOpen]  = useState(false)
  const [confirmPhotoIdx, setConfirmPhotoIdx] = useState(null)
  const [addingPhoto,  setAddingPhoto]  = useState(false)
  const menuRef = useRef(null)
  const fileRef = useRef(null)

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

  /* ── Edit (staged — nothing persists until Save) ───────── */
  function startEdit() {
    setEditContent(post.content)
    setEditImages(
      (post.imageUrls ?? []).map((url, i) => ({
        url,
        publicId: post.imagePublicIds?.[i] ?? '',
      })),
    )
    setEditing(true)
    setMenuOpen(false)
  }

  function cancelEdit() {
    setEditing(false)
    setEditContent(post.content)
    setEditImages([])
    setConfirmPhotoIdx(null)
  }

  async function saveEdit() {
    if (!editContent.trim() || savingEdit) return
    setSavingEdit(true)
    const res = await fetch(`/api/community/posts/${post._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: editContent,
        imageUrls:      editImages.map(i => i.url),
        imagePublicIds: editImages.map(i => i.publicId),
      }),
    })
    if (res.ok) {
      const d = await res.json()
      setPost(p => ({
        ...p,
        content:        d.data?.content ?? editContent.trim(),
        imageUrls:      d.data?.imageUrls ?? editImages.map(i => i.url),
        imagePublicIds: d.data?.imagePublicIds ?? editImages.map(i => i.publicId),
      }))
      setEditing(false)
      toast.success('Post updated')
    } else {
      toast.error('Update failed')
    }
    setSavingEdit(false)
  }

  /* ── Stage a photo removal (committed on Save) ─────────── */
  function removeStagedImage(index) {
    if (index === null) return
    setEditImages(prev => prev.filter((_, i) => i !== index))
    setConfirmPhotoIdx(null)
  }

  /* ── Add photos (uploaded now, attached on Save) ───────── */
  async function handleAddImages(files) {
    const remaining = MAX_IMAGES - editImages.length
    if (!files.length) return
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (files.length > remaining) {
      toast.error(`You can add ${remaining} more photo${remaining === 1 ? '' : 's'} (max ${MAX_IMAGES})`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setAddingPhoto(true)
    for (const raw of files) {
      try {
        const compressed = await compressImage(raw)
        const { url, publicId } = await directUpload(compressed, {
          folder: 'sisterroam/community',
          type: 'community_image',
        })
        setEditImages(prev => [...prev, { url, publicId }])
      } catch {
        toast.error('Image upload failed')
      }
    }
    setAddingPhoto(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ── Delete ────────────────────────────────────────────── */
  async function doDelete() {
    setDeleting(true)
    const res = await fetch(`/api/community/posts/${post._id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Post deleted')
      onDelete?.(post._id)
    } else {
      toast.error('Delete failed')
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  const isLong = post.content?.length > 240

  return (
    <>
    <ConfirmDialog
      open={confirmOpen}
      onCancel={() => setConfirmOpen(false)}
      onConfirm={doDelete}
      loading={deleting}
    />
    <ConfirmDialog
      open={confirmPhotoIdx !== null}
      onCancel={() => setConfirmPhotoIdx(null)}
      onConfirm={() => removeStagedImage(confirmPhotoIdx)}
      loading={false}
      title="Remove this photo?"
      message="It will be removed from the post when you save your changes."
      confirmLabel="Remove"
    />
    <div className="bg-white border border-gray-100 -mx-4 sm:mx-0 rounded-none sm:rounded-2xl p-4 space-y-3">
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
              {(post.authorId?.verificationTier === 'verified' || post.authorId?.verificationTier === 'trusted') && (
                <Badge variant="teal" size="xs">✓</Badge>
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
                    onClick={startEdit}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => { setConfirmOpen(true); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger-lighter/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
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
            className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-brand focus:ring-0/30"
            rows={4}
            maxLength={500}
          />

          {/* Editable photos — staged; changes apply when you Save */}
          <div>
            {editImages.length > 0 && (
              <p className="text-[11px] font-medium text-gray-400 mb-1.5">
                Tap ✕ to remove a photo · changes apply when you save
              </p>
            )}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {editImages.map((img, i) => (
                <div
                  key={img.publicId || img.url || i}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPhotoIdx(i)}
                    aria-label="Remove photo"
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-danger transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add-photo tile */}
              {editImages.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={addingPhoto}
                  aria-label="Add photo"
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200 text-gray-400 flex flex-col items-center justify-center gap-1 hover:border-brand/40 hover:text-brand transition-colors disabled:opacity-50"
                >
                  {addingPhoto ? (
                    <span className="w-4 h-4 border-2 border-gray-300 border-t-brand rounded-full animate-spin" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                  <span className="text-[10px] font-medium">
                    {addingPhoto ? 'Adding…' : 'Add'}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleAddImages(Array.from(e.target.files ?? []))}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              disabled={!editContent.trim() || savingEdit || addingPhoto}
              className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {savingEdit ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {savingEdit ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              disabled={savingEdit}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
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
      {!editing && (
      <ImageGrid
        images={post.imageUrls}
        priority={priority}
        hasLiked={post.hasLiked}
        likesCount={post.likesCount}
        onLike={toggleLike}
      />
      )}

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
              className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-2 focus:outline-none focus:ring-0/20 focus:border-brand/30"
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
    </>
  )
}
