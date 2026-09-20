/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import Skeleton from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ShieldCheck, CheckCircle, XCircle, ImageOff, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const KIND_LABEL = {
  profile_photo:   { label: 'Profile photo',   variant: 'brand'  },
  community_image: { label: 'Community image',  variant: 'teal'   },
  story_cover:     { label: 'Story cover',      variant: 'pink'   },
  unknown:         { label: 'Unlinked asset',   variant: 'gray'   },
}

function ModerationCard({ item, onDecide }) {
  const [busy, setBusy] = useState(null)
  const [imgError, setImgError] = useState(false)
  const kind = KIND_LABEL[item.kind] ?? KIND_LABEL.unknown

  async function decide(action) {
    setBusy(action)
    const res = await fetch('/api/admin/moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId: item.publicId, action }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok || !data.success) {
      toast.error(data.error ?? 'Action failed')
      return
    }
    toast.success(action === 'approve' ? 'Image approved' : 'Image rejected & deleted')
    // A rejected community post takes all its images down together — remove
    // every affected asset from the queue, not just the one that was clicked.
    onDecide(data.data?.removedPublicIds ?? [item.publicId])
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
        {imgError ? (
          <div className="flex flex-col items-center gap-1.5 text-gray-400 px-4 text-center">
            <ImageOff className="w-8 h-8" aria-hidden="true" />
            <p className="text-[11px] leading-snug">
              Preview unavailable while pending. Review in the Cloudinary Media Library.
            </p>
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.context}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute top-2 left-2">
          <Badge variant={kind.variant} size="sm">{kind.label}</Badge>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">{item.owner}</p>
          <p className="text-xs text-gray-500 line-clamp-2">{item.context}</p>
        </div>
        <div className="flex gap-2 mt-auto">
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            loading={busy === 'reject'}
            disabled={!!busy}
            onClick={() => decide('reject')}
          >
            <XCircle className="w-4 h-4 mr-1" aria-hidden="true" />
            Reject
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            loading={busy === 'approve'}
            disabled={!!busy}
            onClick={() => decide('approve')}
          >
            <CheckCircle className="w-4 h-4 mr-1" aria-hidden="true" />
            Approve
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminModerationPage() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchQueue = useCallback((signal) => {
    return fetch('/api/admin/moderation', { signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.data.items ?? [])
        else setError(d.error ?? 'Could not load the moderation queue')
      })
      .catch((e) => { if (e.name !== 'AbortError') setError('Could not load the moderation queue') })
  }, [])

  // Refresh button — safe to set loading synchronously from an event handler.
  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchQueue().finally(() => setLoading(false))
  }, [fetchQueue])

  // Initial load — loading already starts true, so no synchronous setState here.
  useEffect(() => {
    const ctrl = new AbortController()
    fetchQueue(ctrl.signal).finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [fetchQueue])

  function handleDecide(publicIds) {
    const removed = new Set(Array.isArray(publicIds) ? publicIds : [publicIds])
    setItems((prev) => prev.filter((i) => !removed.has(i.publicId)))
    // Keep the sidebar/dashboard moderation counts in sync immediately.
    window.dispatchEvent(new Event('admin:refresh-counts'))
  }

  return (
    <AdminLayout>
      <div className="min-h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-lighter flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-brand" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Image moderation</h1>
                <p className="text-sm text-gray-500">
                  Approve or reject public images (profile photos, community images, story covers).
                  Nothing is shown to members until you approve it.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
              Refresh
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-danger-lighter border border-danger/20 rounded-2xl p-6 text-center">
              <p className="text-sm text-danger font-medium">{error}</p>
              <p className="text-xs text-danger/80 mt-1">
                Check that Cloudinary credentials are configured.
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <CheckCircle className="w-10 h-10 text-teal mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-gray-900">All clear</p>
              <p className="text-xs text-gray-500 mt-1">No images are awaiting review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <ModerationCard key={item.publicId} item={item} onDecide={handleDecide} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
