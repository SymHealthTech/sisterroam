'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Trash2 } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import { useSSEContext } from '@/context/SSEContext'
import { cn, formatRelativeTime, formatDateRange, truncate } from '@/lib/utils'
import toast from 'react-hot-toast'

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
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

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
            ? {
                ...r,
                lastMessagePreview: preview,
                lastMessageAt: at,
                // Bump unread unless the user is already viewing this thread
                unreadCount: requestId === selectedRequestId ? 0 : (r.unreadCount ?? 0) + 1,
              }
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
  }, [subscribe, selectedRequestId])

  function getOtherParty(req) {
    return req.guestId?._id?.toString() === currentUserId
      ? req.hostId
      : req.guestId
  }

  function handleSelect(req) {
    // Optimistically clear this thread's unread count when opening it
    setRequests(prev => prev.map(r => (r._id === req._id ? { ...r, unreadCount: 0 } : r)))
    if (onSelect) {
      onSelect(req._id)
    } else {
      router.push(`/messages/${req._id}`)
    }
  }

  async function handleDelete() {
    if (!pendingDelete || deleting) return
    const id = pendingDelete._id
    setDeleting(true)
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setRequests(prev => prev.filter(r => r._id !== id))
        setPendingDelete(null)
        toast.success('Conversation deleted')
        // If the deleted chat is the one open on the right, return to the list
        if (selectedRequestId === id) router.push('/messages')
      } else {
        toast.error(json.error ?? 'Could not delete conversation')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setDeleting(false)
    }
  }

  const totalUnread = requests.reduce((sum, r) => sum + (r._id === selectedRequestId ? 0 : r.unreadCount ?? 0), 0)

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header — desktop only; mobile shows title+subtitle in the AppLayout top bar */}
      <div className="hidden lg:flex items-center justify-between px-4 pt-4 pb-3 shrink-0 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Messages</h2>
          <p className="text-xs text-gray-400 mt-0.5">Your chats, trips &amp; stay requests</p>
        </div>
        {totalUnread > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-brand text-white text-[11px] font-semibold">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <ConversationItemSkeleton key={i} />)
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-lighter flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-brand" />
            </div>
            <p className="text-sm font-medium text-gray-700">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
              Message a sister from her profile, or chats open once a host or trip request is accepted.
            </p>
          </div>
        ) : (
          <div>
          {requests.map(req => {
            const other = getOtherParty(req)
            const isSelected = selectedRequestId === req._id
            const unread = isSelected ? 0 : (req.unreadCount ?? 0)
            const isDirect = req.requestType === 'direct'
            // Direct chats have no request lifecycle, so no status badge.
            const badge = isDirect
              ? null
              : req.status === 'accepted' && req.requestType === 'cotraveller'
                ? { variant: 'success', label: 'Trip confirmed' }
                : STATUS_BADGE[req.status]

            return (
              <div key={req._id} className="relative group">
              <button
                onClick={() => handleSelect(req)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3.5 pr-12 text-left transition-colors',
                  'hover:bg-gray-50 cursor-pointer border-b border-gray-100 lg:border-b-0',
                  isSelected
                    ? 'bg-brand-lighter/60 border-l-2 border-l-brand'
                    : 'border-l-2 border-l-transparent'
                )}
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={other?.profilePhotoUrl}
                    name={other?.fullName}
                    size="md"
                  />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-brand rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      'text-sm truncate',
                      unread > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'
                    )}>
                      {other?.fullName ?? 'Unknown'}
                    </span>
                    <span className={cn(
                      'text-[11px] shrink-0',
                      unread > 0 ? 'text-brand font-medium' : 'text-gray-400'
                    )}>
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

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className={cn(
                      'text-xs truncate',
                      unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'
                    )}>
                      {req.lastMessagePreview
                        ? truncate(req.lastMessagePreview, 55)
                        : req.message
                          ? truncate(req.message, 55)
                          : isDirect
                            ? 'Say hello 👋'
                            : 'No messages yet'}
                    </p>
                    {unread > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-semibold">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>

                  {req.checkInDate && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDateRange(req.checkInDate, req.checkOutDate)}
                    </p>
                  )}
                </div>
              </button>

              {/* Per-row delete — always visible on mobile, on hover on desktop */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPendingDelete(req) }}
                aria-label={`Delete chat with ${other?.fullName ?? 'this sister'}`}
                title="Delete chat"
                className="absolute top-1/2 -translate-y-1/2 right-2 p-2 rounded-lg text-gray-400
                           bg-white/90 shadow-sm ring-1 ring-gray-100 transition
                           hover:text-danger hover:bg-red-50
                           opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              </div>
            )
          })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Delete this conversation?"
        size="sm"
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          This removes your chat with{' '}
          <strong className="text-gray-800">
            {getOtherParty(pendingDelete ?? {})?.fullName?.split(' ')[0] ?? 'this sister'}
          </strong>{' '}
          from your messages. If she sends you a new message, it will reappear.
        </p>
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl
                       hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-danger rounded-xl
                       hover:bg-danger-dark disabled:opacity-60 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete chat'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
