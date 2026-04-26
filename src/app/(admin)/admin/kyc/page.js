'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import Skeleton from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  CheckCircle, XCircle, Eye, Video,
  ChevronLeft, ChevronRight, StickyNote,
} from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = ['pending', 'approved', 'rejected']

/* ── Lightbox modal ───────────────────────────────────────── */
function Lightbox({ url, type, onClose }) {
  if (!url) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
        {type === 'video' ? (
          <video src={url} controls autoPlay className="w-full rounded-xl max-h-[80vh]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="ID document" className="w-full rounded-xl max-h-[80vh] object-contain" />
        )}
        <button onClick={onClose} className="mt-3 text-white/70 text-sm hover:text-white text-center block w-full">
          Close (Esc)
        </button>
      </div>
    </div>
  )
}

/* ── KYC card (full version) ──────────────────────────────── */
function KycCardFull({ verif, onUpdate, isActive, onSelect }) {
  const [notes,    setNotes]    = useState(verif.reviewerNotes ?? '')
  const [deciding, setDeciding] = useState(null)
  const [lightbox, setLightbox] = useState(null) // { url, type }
  const debounceRef = useRef(null)

  async function decide(status) {
    setDeciding(status)
    const res = await fetch(`/api/verification/${verif._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewerNotes: notes }),
    })
    setDeciding(null)
    if (!res.ok) { toast.error('Update failed'); return }
    toast.success(`Verification ${status}`)
    onUpdate(verif._id, status)
  }

  function handleNotesChange(val) {
    setNotes(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetch(`/api/verification/${verif._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerNotes: val }),
      })
    }, 1500)
  }

  // userId is populated as a User object by the API
  const user = typeof verif.userId === 'object' ? verif.userId : null

  return (
    <>
      {lightbox && (
        <Lightbox
          url={lightbox.url}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
        />
      )}
      <div
        className={cn(
          'bg-white rounded-2xl border p-5 space-y-4 cursor-pointer transition-all',
          isActive ? 'border-brand/40 shadow-md' : 'border-gray-100 hover:border-gray-200',
        )}
        onClick={onSelect}
      >
        {/* User */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={user?.profilePhotoUrl} name={user?.fullName} size="sm" />
            <div>
              <p className="font-semibold text-sm text-gray-900">{user?.fullName ?? '—'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={verif.status === 'pending' ? 'amber' : verif.status === 'approved' ? 'teal' : 'danger'}>
              {verif.status}
            </Badge>
            <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(verif.createdAt)}</p>
          </div>
        </div>

        {/* Documents */}
        <div className="flex gap-2 flex-wrap">
          {verif.idDocumentUrl && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox({ url: verif.idDocumentUrl, type: 'image' }) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-brand-lighter hover:text-brand hover:border-brand/20 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> View ID Front
            </button>
          )}
          {verif.idDocumentBackUrl && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox({ url: verif.idDocumentBackUrl, type: 'image' }) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-brand-lighter hover:text-brand hover:border-brand/20 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> View ID Back
            </button>
          )}
          {verif.selfieVideoUrl && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox({ url: verif.selfieVideoUrl, type: 'video' }) }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-amber-lighter hover:text-amber hover:border-amber/20 transition-colors"
            >
              <Video className="w-3.5 h-3.5" /> Watch Video
            </button>
          )}
        </div>

        {/* Notes */}
        {verif.status === 'pending' && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
              <StickyNote className="w-3 h-3" /> Reviewer notes (auto-saved)
            </label>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              onClick={e => e.stopPropagation()}
              rows={2}
              placeholder="Optional — shown to user if rejected"
              className="w-full text-xs border border-gray-200 rounded-xl p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-gray-300"
            />
          </div>
        )}
        {verif.status !== 'pending' && verif.reviewerNotes && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500"><strong>Notes:</strong> {verif.reviewerNotes}</p>
            <p className="text-xs text-gray-400 mt-0.5">Reviewed {formatDate(verif.reviewedAt)}</p>
          </div>
        )}

        {/* Actions — pending only */}
        {verif.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              loading={deciding === 'rejected'}
              disabled={!!deciding}
              onClick={e => { e.stopPropagation(); decide('rejected') }}
            >
              <XCircle className="w-4 h-4" /> Reject
            </Button>
            <Button
              size="sm"
              className="flex-1"
              loading={deciding === 'approved'}
              disabled={!!deciding}
              onClick={e => { e.stopPropagation(); decide('approved') }}
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </Button>
          </div>
        )}

        {/* Keyboard shortcut hint */}
        {isActive && verif.status === 'pending' && (
          <p className="text-[11px] text-gray-400 text-center">
            Press <kbd className="px-1 bg-gray-100 rounded text-gray-600">A</kbd> Approve ·{' '}
            <kbd className="px-1 bg-gray-100 rounded text-gray-600">R</kbd> Reject ·{' '}
            <kbd className="px-1 bg-gray-100 rounded text-gray-600">J/K</kbd> Navigate
          </p>
        )}
      </div>
    </>
  )
}

/* ── Page ─────────────────────────────────────────────────── */
export default function KYCQueuePage() {
  const [tab,       setTab]       = useState('pending')
  const [verifs,    setVerifs]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)

  const fetchVerifs = useCallback(async (status) => {
    setLoading(true)
    const res = await fetch(`/api/verification?status=${status}&limit=50`)
    if (res.ok) {
      const d = await res.json()
      setVerifs(d.data?.verifications ?? d.data ?? [])
    }
    setLoading(false)
    setActiveIdx(0)
  }, [])

  useEffect(() => { fetchVerifs(tab) }, [tab, fetchVerifs])

  function handleUpdate(id, status) {
    setVerifs(prev => {
      if (tab === 'pending') return prev.filter(v => v._id !== id)
      return prev.map(v => v._id === id ? { ...v, status } : v)
    })
    setActiveIdx(prev => Math.max(0, Math.min(prev, verifs.length - 2)))
  }

  // Keyboard navigation
  useEffect(() => {
    function handler(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return
      if (e.key === 'j' || e.key === 'ArrowDown') setActiveIdx(i => Math.min(i + 1, verifs.length - 1))
      if (e.key === 'k' || e.key === 'ArrowUp')   setActiveIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [verifs.length])

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Review identity verification requests</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors',
                tab === t ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} variant="card" className="h-48" />)}
          </div>
        ) : verifs.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto text-teal mb-3" />
            <p className="font-medium">No {tab} verifications</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {verifs.map((v, i) => (
              <KycCardFull
                key={v._id}
                verif={v}
                isActive={i === activeIdx}
                onSelect={() => setActiveIdx(i)}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
