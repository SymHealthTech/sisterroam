'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowUp, MoreVertical, Clock, CheckCircle, XCircle, Shield,
  WifiOff, Star, AlertTriangle, ChevronDown,
} from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import ReviewModal from '@/components/reviews/ReviewModal'
import { useSSEContext } from '@/context/SSEContext'
import { cn, formatDateRange, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

// ─── Helpers ────────────────────────────────────────────────────────────────

function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function dayLabel(date) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, yesterday)) return 'Yesterday'
  return formatDate(d)
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(date)
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
          <Skeleton className={cn('h-10 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-36')} />
        </div>
      ))}
    </div>
  )
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] text-gray-400 font-medium shrink-0">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function SystemMessage({ content }) {
  return (
    <div className="flex justify-center my-2 px-4">
      <span className="text-xs text-gray-400 italic">{content}</span>
    </div>
  )
}

function StatusBanner({ request, otherParty, isGuest }) {
  if (request.requestType === 'direct') return null

  const name = otherParty?.fullName?.split(' ')[0] ?? 'them'

  if (request.status === 'pending') {
    if (!isGuest) {
      return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-lighter border-b border-brand/20 text-brand-dark text-sm shrink-0">
          <Clock className="w-4 h-4 shrink-0" />
          <span><strong>{name}</strong> sent you a hosting request</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100 text-amber-800 text-sm shrink-0">
        <Clock className="w-4 h-4 shrink-0" />
        <span>Waiting for <strong>{name}</strong> to accept your request</span>
      </div>
    )
  }

  if (request.status === 'accepted') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 border-b border-teal-100 text-teal-800 text-sm shrink-0">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span>
          Stay confirmed · {otherParty?.city ?? ''} · {formatDateRange(request.checkInDate, request.checkOutDate)}
        </span>
      </div>
    )
  }

  if (request.status === 'declined') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100 text-red-800 text-sm shrink-0">
        <XCircle className="w-4 h-4 shrink-0" />
        <span>Request was declined</span>
      </div>
    )
  }

  if (request.status === 'completed') {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-gray-600 text-sm shrink-0">
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span>Stay completed · {formatDate(request.checkOutDate)}</span>
        {' · '}
        <Link href="#review" className="underline font-medium">Leave a review?</Link>
      </div>
    )
  }

  return null
}

function HostRequestActions({ request, onStatusChange }) {
  const [loading, setLoading] = useState(null)
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  async function respond(status) {
    setLoading(status)
    try {
      const body = { status }
      if (status === 'declined' && declineReason.trim()) body.declineReason = declineReason.trim()
      const res = await fetch(`/api/requests/${request._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        onStatusChange(status)
        toast.success(status === 'accepted' ? 'Request accepted!' : 'Request declined')
        if (status === 'declined') setShowDecline(false)
      } else {
        toast.error(json.error ?? 'Something went wrong')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mx-4 mt-3 shrink-0">
      {/* Request summary card */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
        {request.checkInDate && (
          <p className="text-xs text-gray-500 mb-1.5">
            <span className="font-medium text-gray-700">Dates:</span>{' '}
            {formatDateRange(request.checkInDate, request.checkOutDate)}
            {request.nights ? ` · ${request.nights} ${request.nights === 1 ? 'night' : 'nights'}` : ''}
          </p>
        )}
        {request.message && (
          <p className="text-sm text-gray-700 italic leading-relaxed">&quot;{request.message}&quot;</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => respond('accepted')}
          disabled={!!loading}
          className="flex-1 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl
                     hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          {loading === 'accepted' ? 'Accepting…' : 'Accept request'}
        </button>
        <button
          onClick={() => setShowDecline(true)}
          disabled={!!loading}
          className="flex-1 py-2.5 bg-white border border-gray-200 text-danger text-sm font-medium rounded-xl
                     hover:bg-red-50 disabled:opacity-60 transition-colors"
        >
          Decline
        </button>
      </div>

      {/* Inline decline reason */}
      {showDecline && (
        <div className="mt-3 p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
          <p className="text-sm text-gray-700 font-medium">Decline this request?</p>
          <textarea
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value)}
            placeholder="Optional: let her know why (e.g. fully booked, away those dates…)"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none
                       focus:outline-none focus:ring-2 focus:ring-danger/30 focus:border-danger bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowDecline(false)}
              className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 bg-white rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => respond('declined')}
              disabled={loading === 'declined'}
              className="flex-1 py-2 bg-danger text-white text-sm font-medium rounded-lg
                         hover:bg-red-600 disabled:opacity-60 transition-colors"
            >
              {loading === 'declined' ? 'Declining…' : 'Confirm decline'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SafetyCheckinPrompt({ requestId }) {
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) return null

  async function confirmArrival() {
    setConfirming(true)
    try {
      await fetch('/api/safety/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_arrival', requestId }),
      })
      setConfirmed(true)
      toast.success('Arrival confirmed — stay safe!')
    } catch {
      toast.error('Could not confirm arrival. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 shrink-0">
      <Shield className="w-5 h-5 text-teal-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-teal-800">Safety check-ins are active</p>
        <p className="text-xs text-teal-600">Let us know you arrived safely</p>
      </div>
      <button
        onClick={confirmArrival}
        disabled={confirming}
        className="shrink-0 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg
                   hover:bg-teal-700 disabled:opacity-60 transition-colors"
      >
        {confirming ? 'Confirming…' : 'Confirm arrival'}
      </button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ChatWindow({ requestId, currentUserId }) {
  const [request, setRequest] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [offline, setOffline] = useState(() =>
    typeof window !== 'undefined' ? !navigator.onLine : false
  )
  const [queuedMessages, setQueuedMessages] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const textareaRef = useRef(null)
  const menuRef = useRef(null)

  // ── Data fetching ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!requestId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [reqRes, msgRes] = await Promise.all([
          fetch(`/api/requests/${requestId}`),
          fetch(`/api/messages/${requestId}`),
        ])
        const [reqJson, msgJson] = await Promise.all([reqRes.json(), msgRes.json()])
        if (cancelled) return
        if (reqJson.success) setRequest(reqJson.data)
        if (msgJson.success) setMessages(msgJson.data ?? [])
      } catch {
        if (!cancelled) toast.error('Could not load conversation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [requestId])

  // ── Offline detection ───────────────────────────────────────────────────

  const queuedRef = useRef([])
  useEffect(() => { queuedRef.current = queuedMessages }, [queuedMessages])

  useEffect(() => {
    const onOnline = () => {
      setOffline(false)
      const pending = queuedRef.current
      if (pending.length > 0) {
        setQueuedMessages([])
        pending.forEach(content => {
          fetch(`/api/messages/${requestId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          }).catch(console.error)
        })
      }
    }
    const onOffline = () => setOffline(true)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [requestId])

  // ── Real-time messages via SSE ──────────────────────────────────────────

  const { subscribe } = useSSEContext()
  // Track when SSE last delivered a new_message so polling can back off
  const lastSseMessageAt = useRef(0)

  useEffect(() => {
    return subscribe('new_message', (data) => {
      if (data?.requestId !== requestId) return
      lastSseMessageAt.current = Date.now()
      const msg = data.message
      setMessages(prev => {
        if (prev.some(m => m._id?.toString() === msg._id?.toString())) return prev
        return [...prev, msg]
      })
    })
  }, [subscribe, requestId])

  // ── Polling fallback (8 s) ─────────────────────────────────────────────
  // SSE requires the connections Map to be shared in-process; on multi-instance
  // deployments (Vercel) each Lambda has its own process so SSE may not reach
  // the client. Polling ensures messages always arrive. Skipped when:
  //   • the tab is hidden
  //   • SSE delivered an event within the last 20 s (SSE is working)
  //   • the window has been idle (no typing/scrolling) for 2 minutes

  const lastActivityAt = useRef(0)

  useEffect(() => {
    const touch = () => { lastActivityAt.current = Date.now() }
    window.addEventListener('mousemove', touch, { passive: true })
    window.addEventListener('keydown', touch, { passive: true })
    window.addEventListener('touchstart', touch, { passive: true })
    return () => {
      window.removeEventListener('mousemove', touch)
      window.removeEventListener('keydown', touch)
      window.removeEventListener('touchstart', touch)
    }
  }, [])

  useEffect(() => {
    if (!requestId) return
    const id = setInterval(async () => {
      if (document.hidden) return
      // Back off if SSE is actively working
      if (Date.now() - lastSseMessageAt.current < 20000) return
      // Stop polling idle windows (no user activity for 2 minutes)
      if (Date.now() - lastActivityAt.current > 120000) return
      try {
        const res = await fetch(`/api/messages/${requestId}`)
        const json = await res.json()
        if (!json.success || !json.data) return
        setMessages(prev => {
          const polledIds = new Set(json.data.map(m => m._id?.toString()))
          // Keep still-pending optimistic messages (they have temp- IDs)
          const pendingOptimistic = prev.filter(m => m.isOptimistic)
          // Skip re-render if nothing new arrived
          const prevReal = prev.filter(m => !m.isOptimistic)
          if (
            prevReal.length === json.data.length &&
            prevReal.every(m => polledIds.has(m._id?.toString()))
          ) return prev
          return [...json.data, ...pendingOptimistic]
        })
      } catch {}
    }, 8000)
    return () => clearInterval(id)
  }, [requestId])

  // ── Auto-scroll ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isAtBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isAtBottom, messages])

  useEffect(() => {
    // Scroll to bottom on initial load
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [loading])

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setIsAtBottom(atBottom)
    setShowScrollButton(!atBottom)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollButton(false)
  }

  // ── Close menu on outside click ─────────────────────────────────────────

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // ── Textarea auto-resize ────────────────────────────────────────────────

  function handleInputChange(e) {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px' // max 4 lines ≈ 96px
  }

  // ── Send ────────────────────────────────────────────────────────────────

  async function sendMessage(content = input) {
    const text = content.trim()
    if (!text || sending) return

    if (offline) {
      setQueuedMessages(prev => [...prev, text])
      setInput('')
      toast('Message queued — will send when online', { icon: '📡' })
      return
    }

    // Optimistic message
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      _id: tempId,
      requestId,
      senderId: { _id: currentUserId, fullName: 'You' },
      content: text,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setSending(true)

    try {
      const res = await fetch(`/api/messages/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      const json = await res.json()
      if (json.success) {
        // Replace optimistic message with server response
        setMessages(prev => prev.map(m => m._id === tempId ? json.data : m))
      } else {
        setMessages(prev => prev.filter(m => m._id !== tempId))
        toast.error(json.error ?? 'Failed to send message')
        setInput(text)
      }
    } catch {
      setMessages(prev => prev.filter(m => m._id !== tempId))
      toast.error('Network error')
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────

  if (!requestId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-brand-lighter flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-base font-medium text-gray-700">Select a conversation</p>
        <p className="text-sm text-gray-400 mt-1">Choose from your messages on the left</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Skeleton variant="avatar" className="w-10 h-10" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <MessageSkeleton />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">Conversation not found.</p>
      </div>
    )
  }

  const isGuest = request.guestId._id?.toString() === currentUserId
  const otherParty = isGuest ? request.hostId : request.guestId
  const otherProfilePath = `/user/${otherParty?._id}`

  const today = new Date()
  const checkIn = request.checkInDate ? new Date(request.checkInDate) : null
  const checkOut = request.checkOutDate ? new Date(request.checkOutDate) : null
  const stayActive =
    request.status === 'accepted' &&
    checkIn && checkOut &&
    today >= checkIn && today <= checkOut

  const showSafety = stayActive
  const showReviewBanner =
    request.requestType !== 'direct' &&
    request.status === 'completed' &&
    ((isGuest && !request.guestReviewId) || (!isGuest && !request.hostReviewId))

  // Group messages for date separators
  const messageGroups = []
  let lastDate = null
  for (const msg of messages) {
    if (!lastDate || !isSameDay(lastDate, msg.createdAt)) {
      messageGroups.push({ type: 'separator', label: dayLabel(msg.createdAt), key: `sep-${msg.createdAt}` })
      lastDate = msg.createdAt
    }
    messageGroups.push({ type: 'message', msg, key: msg._id })
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0 relative">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        <Link href={otherProfilePath}>
          <Avatar src={otherParty?.profilePhotoUrl} name={otherParty?.fullName} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={otherProfilePath}
            className="text-sm font-semibold text-gray-900 hover:text-brand transition-colors truncate block"
          >
            {otherParty?.fullName ?? 'Unknown'}
          </Link>
          <Badge
            variant={
              otherParty?.verificationTier === 'trusted' ? 'trusted' :
              otherParty?.verificationTier === 'verified' ? 'verified' : 'basic'
            }
            size="sm"
          >
            {otherParty?.verificationTier ?? 'basic'}
          </Badge>
        </div>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
              <Link
                href={otherProfilePath}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                View profile
              </Link>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-red-50"
                onClick={() => {
                  setShowMenu(false)
                  toast('Safety report — coming soon', { icon: '🛡️' })
                }}
              >
                <AlertTriangle className="w-4 h-4" />
                Report user
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                onClick={() => {
                  setShowMenu(false)
                  toast('Archive — coming soon')
                }}
              >
                Archive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Status banner ── */}
      <StatusBanner request={request} otherParty={otherParty} isGuest={isGuest} />

      {/* ── Host accept/decline actions ── */}
      {!isGuest && request.status === 'pending' && (
        <HostRequestActions
          request={request}
          onStatusChange={(status) => setRequest(prev => ({ ...prev, status }))}
        />
      )}

      {/* ── Safety checkin prompt ── */}
      {showSafety && <SafetyCheckinPrompt requestId={requestId} />}

      {/* ── Review banner ── */}
      {showReviewBanner && (
        <div id="review" className="mx-4 mt-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shrink-0">
          <Star className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="flex-1 text-sm text-amber-800">
            Your stay is complete! Share your experience with the community.
          </p>
          <button
            onClick={() => setShowReview(true)}
            className="shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg
                       hover:bg-amber-600 transition-colors"
          >
            Leave a review
          </button>
        </div>
      )}

      {/* ── Offline banner ── */}
      {offline && (
        <div className="flex items-center gap-2 mx-4 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-xl shrink-0">
          <WifiOff className="w-4 h-4 shrink-0" />
          You are offline. Messages will be sent when you reconnect.
        </div>
      )}

      {/* ── Messages area ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2"
      >
        {messageGroups.map(item => {
          if (item.type === 'separator') {
            return <DateSeparator key={item.key} label={item.label} />
          }

          const { msg } = item
          if (msg.messageType === 'system') {
            return <SystemMessage key={msg._id} content={msg.content} />
          }

          const isMine = msg.senderId?._id?.toString() === currentUserId ||
                         msg.senderId?.toString() === currentUserId

          return (
            <div key={msg._id} className={cn('flex px-4 mb-1', isMine ? 'justify-end' : 'justify-start')}>
              {!isMine && (
                <Avatar
                  src={otherParty?.profilePhotoUrl}
                  name={otherParty?.fullName}
                  size="sm"
                  className="self-end mr-2 shrink-0"
                />
              )}
              <div className={cn('flex flex-col max-w-[75%]', isMine ? 'items-end' : 'items-start')}>
                <div className={cn(
                  'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
                  isMine
                    ? cn('bg-brand text-white rounded-br-sm', msg.isOptimistic && 'opacity-70')
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                )}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Scroll-to-bottom button ── */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-9 h-9 bg-white border border-gray-200 rounded-full
                     shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
        >
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* ── Message input ── */}
      <div className="shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 resize-none px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-2xl
                       placeholder:text-gray-400 focus:outline-none focus:border-brand focus:ring-0/30
                        transition-colors overflow-hidden leading-relaxed"
            style={{ minHeight: '44px', maxHeight: '96px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            className={cn(
              'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
              input.trim() && !sending
                ? 'bg-brand text-white hover:bg-brand-dark'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
            aria-label="Send"
          >
            {sending ? (
              <Spinner size="sm" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Review modal ── */}
      <ReviewModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        requestId={requestId}
        revieweeId={otherParty?._id}
        revieweeName={otherParty?.fullName}
      />
    </div>
  )
}
