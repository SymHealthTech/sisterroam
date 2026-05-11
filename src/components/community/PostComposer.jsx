'use client'

import { useState, useRef } from 'react'
import { X, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'general',          label: 'General' },
  { value: 'safety_tips',      label: 'Safety' },
  { value: 'trip_planning',    label: 'Trip Planning' },
  { value: 'looking_for_host', label: 'Looking for Host' },
  { value: 'hosting_offer',    label: 'Hosting Offer' },
  { value: 'achievements',     label: 'Achievements' },
  { value: 'questions',        label: 'Questions' },
]

const MAX_CHARS  = 500
const MAX_IMAGES = 7

async function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })),
        'image/webp',
        quality,
      )
    }
    img.src = url
  })
}

/* ── Facebook-style image grid ─────────────────────────────────────────── */
function ImageGrid({ images, onRemove, onView }) {
  const count = images.length

  const cell = (img, i, extraClass = '') => (
    <div
      key={i}
      onClick={() => onView(i)}
      className={`relative overflow-hidden cursor-pointer group ${extraClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt="" className="w-full h-full object-cover" />
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(i) }}
        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )

  if (count === 1) {
    return (
      <div className="rounded-xl overflow-hidden h-60">
        {cell(images[0], 0, 'h-full')}
      </div>
    )
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-52">
        {images.map((img, i) => cell(img, i, 'h-full'))}
      </div>
    )
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-52">
        {cell(images[0], 0, 'row-span-2 h-full')}
        {cell(images[1], 1, 'h-[calc(50%-1px)]')}
        {cell(images[2], 2, 'h-[calc(50%-1px)]')}
      </div>
    )
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden h-52">
        {images.map((img, i) => cell(img, i, 'h-[calc(50%-1px)]'))}
      </div>
    )
  }

  /* 5-7 images: two rows */
  const topCount = count <= 6 ? Math.ceil(count / 2) : 4
  const top      = images.slice(0, topCount)
  const bottom   = images.slice(topCount)

  return (
    <div className="rounded-xl overflow-hidden space-y-0.5">
      <div className="flex gap-0.5 h-36">
        {top.map((img, i) => cell(img, i, 'flex-1 h-full'))}
      </div>
      <div className="flex gap-0.5 h-28">
        {bottom.map((img, i) => cell(img, topCount + i, 'flex-1 h-full'))}
      </div>
    </div>
  )
}

/* ── Lightbox ──────────────────────────────────────────────────────────── */
function Lightbox({ images, index, onClose, onChange }) {
  if (index === null) return null
  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/40 rounded-full p-1 hover:bg-black/70 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(index - 1) }}
          className="absolute left-4 text-white bg-black/40 rounded-full p-1 hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index].url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-[88vw] object-contain rounded-lg shadow-2xl"
      />

      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(index + 1) }}
          className="absolute right-4 text-white bg-black/40 rounded-full p-1 hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      <p className="absolute bottom-5 text-white/70 text-sm">
        {index + 1} / {images.length}
      </p>
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────────────── */
export default function PostComposer({ onPost }) {
  const [open,       setOpen]       = useState(false)
  const [content,    setContent]    = useState('')
  const [category,   setCategory]   = useState('general')
  const [images,     setImages]     = useState([])
  const [uploading,  setUploading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lightbox,   setLightbox]   = useState(null)
  const fileRef = useRef(null)

  function reset() {
    setContent('')
    setCategory('general')
    setImages([])
    setOpen(false)
    setLightbox(null)
  }

  async function handleImageFiles(files) {
    const remaining = MAX_IMAGES - images.length
    if (!files.length || remaining <= 0) return
    if (files.length > remaining) {
      toast.error(`You can add ${remaining} more image${remaining === 1 ? '' : 's'} (max ${MAX_IMAGES})`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true)
    for (const raw of files) {
      try {
        const compressed = await compressImage(raw)
        const form = new FormData()
        form.append('file', compressed)
        form.append('type', 'community_image')
        const res = await fetch('/api/upload', { method: 'POST', body: form })
        if (res.ok) {
          const d = await res.json()
          setImages(prev => [...prev, { url: d.url, publicId: d.publicId }])
        } else {
          const err = await res.json().catch(() => ({}))
          toast.error(err.error ?? 'Image upload failed')
        }
      } catch {
        toast.error('Image upload failed')
      }
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx))
    setLightbox(null)
  }

  async function submit() {
    if (!content.trim()) return
    setSubmitting(true)
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        category,
        imageUrls:      images.map(i => i.url),
        imagePublicIds: images.map(i => i.publicId),
      }),
    })
    setSubmitting(false)
    if (!res.ok) { toast.error('Failed to post'); return }
    const d = await res.json()
    onPost?.(d.data)
    toast.success('Posted!')
    reset()
  }

  /* Collapsed state */
  if (!open) {
    return (
      <div
        className="bg-white rounded-2xl border border-gray-100 px-4 py-2 flex items-center gap-3 cursor-pointer hover:border-brand/30 transition-colors"
        onClick={() => setOpen(true)}
      >
        <p className="text-sm text-gray-400 flex-1">Share something with the community…</p>
        <button className="p-2 text-gray-300 hover:text-brand transition-colors">
          <ImagePlus className="w-4 h-4" />
        </button>
      </div>
    )
  }

  /* Expanded state */
  return (
    <>
      <Lightbox
        images={images}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onChange={setLightbox}
      />

      <div className="bg-white rounded-2xl border border-brand/30 p-4 space-y-3 shadow-sm">
        <div className="flex items-start">
          <div className="flex-1 min-w-0">
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Share your travel experience, tips, or questions…"
              maxLength={MAX_CHARS}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 resize-none text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand/30 focus:ring-2 focus:ring-brand/10 leading-relaxed transition-colors"
            />
            <p className={`text-right text-[11px] mt-1 ${content.length > MAX_CHARS * 0.9 ? 'text-amber' : 'text-gray-300'}`}>
              {content.length}/{MAX_CHARS}
            </p>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                category === c.value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-brand/40 hover:text-brand'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Image grid preview */}
        {images.length > 0 && (
          <div>
            <ImageGrid
              images={images}
              onRemove={removeImage}
              onView={setLightbox}
            />
            <p className="text-[11px] text-gray-400 mt-1.5 text-right">
              {images.length}/{MAX_IMAGES} photos · tap to view full size
            </p>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleImageFiles(Array.from(e.target.files ?? []))}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={images.length >= MAX_IMAGES || uploading}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand transition-colors disabled:opacity-40"
            >
              <ImagePlus className="w-4 h-4" />
              {uploading ? 'Uploading…' : `Photo${images.length > 0 ? ` (${images.length}/${MAX_IMAGES})` : ''}`}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <Button
              size="sm"
              onClick={submit}
              loading={submitting}
              disabled={!content.trim() || submitting}
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
