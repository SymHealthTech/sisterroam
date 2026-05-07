'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { useSSEContext } from '@/context/SSEContext'
import { cn, formatRelativeTime, formatDateRange, truncate } from '@/lib/utils'

const STATUS_BADGE = {
  pending:   { variant: 'warning', label: 'Pending' },
  accepted:  { variant: 'success', label: 'Accepted' },
  completed: { variant: 'basic',   label: 'Completed' },
}

function ConversationItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <Skeleton variant="avatar" className="w-11 h-11 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  )
}

export default function ConversationList({ currentUserId, selectedRequestId, onSelect }) {
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const { subscribe } = useSSEContext()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await fetch('/api/requests')
      const json = await res.json()
      if (cancelled) return
      if (json.success) {
        const sorted = (json.data ?? [])
          .filter(r => r.status === 'pending' || r.status === 'accepted' || r.status === 'completed')
          .sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(a.createdAt)
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(b.createdAt)
            return bTime - aTime
          })
        setRequests(sorted)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return subscribe('conversation_update', ({ requestId, lastMessage: preview, lastMessageAt: at }) => {
      setRequests(prev => {
        const updated = prev.map(r =>
          r._id === requestId
            ? { ...r, lastMessagePreview: preview, lastMessageAt: at }
            : r
        )
        const idx = updated.findIndex(r => r._id === requestId)
        if (idx > 0) {
          const [item] = updated.splice(idx, 1)
          updated.unshift(item)
        }
        return [...updated]
      })
    })
  }, [subscribe])

  function getOtherParty(req) {
    return req.guestId?._id?.toString() === currentUserId
      ? req.hostId
      : req.guestId
  }

  function hasUnread(req) {
    if (!req.lastMessageAt) return false
    const lastMsg = new Date(req.lastMessageAt)
    const updated = new Date(req.updatedAt)
    return lastMsg > updated
  }

  function handleSelect(req) {
    if (onSelect) {
      onSelect(req._id)
    } else {
      router.push(`/messages/${req._id}`)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header — desktop only; mobile shows title+subtitle in the AppLayout top bar */}
      <div className="hidden lg:block px-4 pt-4 pb-3 shrink-0 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Messages</h2>
        <p className="text-xs text-gray-400 mt-0.5">Your trips &amp; stay requests</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <ConversationItemSkeleton key={i} />)
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-lighter flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">No active chats yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Chats open once a host or trip request is accepted.
            </p>
          </div>
        ) : (
          <div>
          {requests.map(req => {
            const other = getOtherParty(req)
            const unread = hasUnread(req)
            const badge = STATUS_BADGE[req.status]
            const isSelected = selectedRequestId === req._id

            return (
              <button
                key={req._id}
                onClick={() => handleSelect(req)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors',
                  'hover:bg-gray-50 cursor-pointer border-b border-gray-100',
                  isSelected
                    ? 'bg-brand-lighter border-l-2 border-brand'
                    : 'border-l-2 border-transparent'
                )}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={other?.profilePhotoUrl}
                    name={other?.fullName}
                    size="md"
                  />
                  {unread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      'text-sm truncate',
                      unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'
                    )}>
                      {other?.fullName ?? 'Unknown'}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {req.lastMessageAt
                        ? formatRelativeTime(req.lastMessageAt)
                        : formatRelativeTime(req.createdAt)}
                    </span>
                  </div>

                  {badge && (
                    <div className="mt-0.5">
                      <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                    </div>
                  )}

                  <p className={cn(
                    'text-xs mt-1 truncate',
                    unread ? 'text-gray-700 font-medium' : 'text-gray-400'
                  )}>
                    {req.lastMessagePreview
                      ? truncate(req.lastMessagePreview, 55)
                      : req.message
                        ? truncate(req.message, 55)
                        : 'No messages yet'}
                  </p>

                  {req.checkInDate && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDateRange(req.checkInDate, req.checkOutDate)}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
          </div>
        )}
      </div>
    </div>
  )
}
