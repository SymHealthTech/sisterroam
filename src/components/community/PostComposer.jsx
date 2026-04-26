'use client'

import { useState, useRef } from 'react'
import { X, ImagePlus } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
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

const MAX_CHARS = 500

export default function PostComposer({ user, onPost }) {
  const [open,       setOpen]       = useState(false)
  const [content,    setContent]    = useState('')
  const [category,   setCategory]   = useState('general')
  const [images,     setImages]     = useState([]) // [{ url, publicId }]
  const [uploading,  setUploading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  function reset() {
    setContent('')
    setCategory('general')
    setImages([])
    setOpen(false)
  }

  async function handleImageFiles(files) {
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 images per post')
      return
    }
    setUploading(true)
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'community')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (res.ok) {
        const d = await res.json()
        setImages(prev => [...prev, { url: d.url, publicId: d.publicId }])
      } else {
        toast.error('Image upload failed')
      }
    }
    setUploading(false)
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx))
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
        className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:border-brand/30 transition-colors"
        onClick={() => setOpen(true)}
      >
        <Avatar src={user?.profilePhotoUrl} name={user?.fullName} size="sm" className="shrink-0" />
        <p className="text-sm text-gray-400 flex-1">Share something with the community…</p>
        <button className="p-2 text-gray-300 hover:text-brand transition-colors">
          <ImagePlus className="w-4 h-4" />
        </button>
      </div>
    )
  }

  /* Expanded state */
  return (
    <div className="bg-white rounded-2xl border border-brand/30 p-4 space-y-3 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar src={user?.profilePhotoUrl} name={user?.fullName} size="sm" className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share your travel story, tip, or question…"
            maxLength={MAX_CHARS}
            rows={4}
            className="w-full resize-none text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none leading-relaxed"
          />
          <p className={`text-right text-[11px] mt-1 ${content.length > MAX_CHARS * 0.9 ? 'text-amber' : 'text-gray-300'}`}>
            {content.length}/{MAX_CHARS}
          </p>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 flex-wrap pl-9">
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

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 pl-9">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 pl-9">
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
            disabled={images.length >= 3 || uploading}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand transition-colors disabled:opacity-40"
          >
            <ImagePlus className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Photo'}
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
  )
}
