'use client'

import { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, Check, ShieldCheck, MessageCircle,
  Star, AlertTriangle, Calendar, Clock,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useSSEContext } from '@/context/SSEContext'

const TYPE_ICON = {
  new_request:               Calendar,
  request_accepted:          Check,
  request_declined:          AlertTriangle,
  new_message:               MessageCircle,
  review_received:           Star,
  verification_under_review: Clock,
  verification_approved:     ShieldCheck,
  verification_rejected:     AlertTriangle,
  checkin_reminder:          Bell,
  safety_alert:              AlertTriangle,
  new_cotraveller_interest:  Bell,
  cotraveller_accepted:      Check,
  cotraveller_declined:      AlertTriangle,
  cotraveller_filled:        Bell,
  new_recommendation_answer: MessageCircle,
  answer_accepted:           Star,
}

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true }
    case 'FETCH_SUCCESS': {
      const list = action.list
      return { ...state, loading: false, loaded: true, notifs: list, unread: list.filter(n => !n.isRead).length }
    }
    case 'FETCH_DONE':
      return { ...state, loading: false }
    case 'NEW_NOTIFICATION':
      return { ...state, notifs: [action.notif, ...state.notifs], unread: state.unread + 1 }
    case 'PENDING_NOTIFICATIONS':
      return { ...state, notifs: action.notifications, unread: action.unreadCount ?? 0, loaded: true }
    case 'MARK_READ':
      return {
        ...state,
        notifs: state.notifs.map(n => n._id === action.id ? { ...n, isRead: true } : n),
        unread: Math.max(0, state.unread - 1),
      }
    case 'MARK_ALL_READ':
      return { ...state, notifs: state.notifs.map(n => ({ ...n, isRead: true })), unread: 0 }
    default:
      return state
  }
}

const INIT = { notifs: [], unread: 0, loading: false, loaded: false }

function NotifItem({ notif, onRead }) {
  const Icon = TYPE_ICON[notif.type] ?? Bell

  return (
    <button
      onClick={() => onRead(notif)}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors',
        !notif.isRead && 'bg-white',
        notif.isRead && 'bg-gray-50/50',
      )}
    >
      <div className={cn(
        'p-2 rounded-full shrink-0 mt-0.5',
        notif.isRead ? 'bg-gray-100' : 'bg-brand-lighter',
      )}>
        <Icon className={cn('w-3.5 h-3.5', notif.isRead ? 'text-gray-400' : 'text-brand')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', notif.isRead ? 'text-gray-600' : 'font-semibold text-gray-900')}>
          {notif.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
        <p className="text-[11px] text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
      </div>
      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />
      )}
    </button>
  )
}

export default function NotificationPanel({ userId }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [{ notifs, unread, loading, loaded }, dispatch] = useReducer(reducer, INIT)
  const panelRef = useRef(null)

  /* ── Fetch ───────────────────────────────────────────────── */
  const fetchNotifs = useCallback(async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const res = await fetch('/api/notifications?limit=15')
      if (res.ok) {
        const d = await res.json()
        const list = d.data?.notifications ?? d.data ?? []
        dispatch({ type: 'FETCH_SUCCESS', list })
      }
    } finally {
      dispatch({ type: 'FETCH_DONE' })
    }
  }, [])

  function handleBellClick() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen && !loaded) fetchNotifs()
  }

  /* ── SSE real-time ───────────────────────────────────────── */
  const { subscribe } = useSSEContext()

  useEffect(() => {
    const u1 = subscribe('new_notification', (data) => {
      const n = data?.notification
      if (n) dispatch({ type: 'NEW_NOTIFICATION', notif: n })
    })
    const u2 = subscribe('pending_notifications', ({ notifications, unreadCount } = {}) => {
      if (notifications) dispatch({ type: 'PENDING_NOTIFICATIONS', notifications, unreadCount })
    })
    return () => { u1(); u2() }
  }, [subscribe])

  /* ── Close on outside click ─────────────────────────────── */
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Mark read ───────────────────────────────────────────── */
  async function markRead(notif) {
    if (!notif.isRead) {
      dispatch({ type: 'MARK_READ', id: notif._id })
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notif._id] }),
      })
    }
    if (notif.link) {
      setOpen(false)
      router.push(notif.link)
    }
  }

  async function markAllRead() {
    const ids = notifs.filter(n => !n.isRead).map(n => n._id)
    if (!ids.length) return
    dispatch({ type: 'MARK_ALL_READ' })
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-brand hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading && (
              <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
            )}
            {!loading && notifs.length === 0 && (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            )}
            {notifs.slice(0, 10).map(n => (
              <NotifItem key={n._id} notif={n} onRead={markRead} />
            ))}
          </div>

          <div className="border-t border-gray-100 px-4 py-2.5 text-center">
            <button
              onClick={() => { setOpen(false); router.push('/notifications') }}
              className="text-xs text-brand hover:underline"
            >
              {notifs.length > 10 ? 'View all notifications' : 'View notifications page'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
