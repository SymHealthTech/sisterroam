'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, Check, ShieldCheck, MessageCircle,
  Star, AlertTriangle, Calendar, CheckCheck,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import Skeleton from '@/components/ui/Skeleton'
import { cn, formatRelativeTime } from '@/lib/utils'

const TYPE_ICON = {
  new_request:               Calendar,
  request_accepted:          Check,
  request_declined:          AlertTriangle,
  new_message:               MessageCircle,
  review_received:           Star,
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

function groupByDate(notifs) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const groups = { Today: [], Yesterday: [], Earlier: [] }
  for (const n of notifs) {
    const d = new Date(n.createdAt)
    if (d >= todayStart) groups.Today.push(n)
    else if (d >= yesterdayStart) groups.Yesterday.push(n)
    else groups.Earlier.push(n)
  }
  return groups
}

function NotifRow({ notif, onRead }) {
  const Icon = TYPE_ICON[notif.type] ?? Bell
  return (
    <button
      onClick={() => onRead(notif)}
      className={cn(
        'w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50',
        !notif.isRead && 'bg-white',
        notif.isRead && 'bg-gray-50/40',
      )}
    >
      <div className={cn(
        'p-2.5 rounded-full shrink-0 mt-0.5',
        notif.isRead ? 'bg-gray-100' : 'bg-brand-lighter',
      )}>
        <Icon className={cn('w-4 h-4', notif.isRead ? 'text-gray-400' : 'text-brand')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-snug',
          notif.isRead ? 'text-gray-600' : 'font-semibold text-gray-900',
        )}>
          {notif.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.body}</p>
        <p className="text-[11px] text-gray-400 mt-1.5">{formatRelativeTime(notif.createdAt)}</p>
      </div>
      {!notif.isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-brand shrink-0 mt-2" />
      )}
    </button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-start gap-4 px-5 py-4">
          <Skeleton variant="avatar" className="w-9 h-9 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-2.5 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const d = await res.json()
          setNotifs(d.data?.notifications ?? d.data ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function markRead(notif) {
    if (!notif.isRead) {
      setNotifs(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n))
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notif._id] }),
      })
    }
    if (notif.link) router.push(notif.link)
  }

  async function markAllRead() {
    const ids = notifs.filter(n => !n.isRead).map(n => n._id)
    if (!ids.length) return
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
  }

  const unreadCount = notifs.filter(n => !n.isRead).length
  const displayed = filter === 'unread' ? notifs.filter(n => !n.isRead) : notifs
  const groups = groupByDate(displayed)

  return (
    <AppLayout title="Notifications">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            {!loading && unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm text-brand hover:underline"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
          {['all', 'unread'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {tab === 'unread' && unreadCount > 0
                ? `Unread (${unreadCount})`
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading && <LoadingSkeleton />}

          {!loading && displayed.length === 0 && (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {filter === 'unread'
                  ? 'No unread notifications.'
                  : "We'll let you know when something happens."}
              </p>
            </div>
          )}

          {!loading && ['Today', 'Yesterday', 'Earlier'].map(group => {
            const items = groups[group]
            if (!items?.length) return null
            return (
              <div key={group} className="border-b border-gray-50 last:border-b-0">
                <div className="px-5 py-2 bg-gray-50/80 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {group}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(n => (
                    <NotifRow key={n._id} notif={n} onRead={markRead} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
