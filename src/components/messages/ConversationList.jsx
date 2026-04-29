'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, PenSquare } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { useSSEContext } from '@/context/SSEContext'
import { cn, formatRelativeTime, formatDateRange, truncate } from '@/lib/utils'

const STATUS_TABS = ['All', 'Pending', 'Accepted', 'Completed']

const STATUS_BADGE = {
  pending:   { variant: 'pending',  label: 'Pending' },
  accepted:  { variant: 'success',  label: 'Accepted' },
  declined:  { variant: 'danger',   label: 'Declined' },
  completed: { variant: 'basic',    label: 'Completed' },
  cancelled: { variant: 'basic',    label: 'Cancelled' },
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
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [memberResults, setMemberResults] = useState([])
  const [searchingMembers, setSearchingMembers] = useState(false)
  const searchRef = useRef(null)

  const fetchRequests = useCallback(async () => {
    const res = await fetch('/api/requests')
    const json = await res.json()
    if (json.success) {
      const sorted = (json.data ?? []).sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(a.createdAt)
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(b.createdAt)
        return bTime - aTime
      })
      setRequests(sorted)
    }
    setLoading(false)
  }, [])

  const { lastEvent } = useSSEContext()

  useEffect(() => { fetchRequests() }, [fetchRequests])

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== 'conversation_update') return
    const { requestId, lastMessage: preview, lastMessageAt: at } = lastEvent.data
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
  }, [lastEvent])

  // Debounced member search — only verified/trusted members
  useEffect(() => {
    if (!search || search.length < 2) {
      setMemberResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingMembers(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`)
        const json = await res.json()
        if (json.success) setMemberResults(json.data ?? [])
      } catch {
        setMemberResults([])
      } finally {
        setSearchingMembers(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

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

  // When searching: filter conversations by name across all statuses
  // When not searching: filter by active tab
  const filtered = requests.filter(req => {
    if (search) {
      const other = getOtherParty(req)
      const name = other?.fullName?.toLowerCase() ?? ''
      return name.includes(search.toLowerCase())
    }
    const tab = activeTab.toLowerCase()
    if (tab !== 'all' && req.status !== tab) return false
    return true
  })

  function handleSelect(req) {
    if (onSelect) {
      onSelect(req._id)
    } else {
      router.push(`/messages/${req._id}`)
    }
  }

  function handleMemberClick(member) {
    // If there is already a conversation with this member, open it
    const existing = requests.find(req => {
      const other = getOtherParty(req)
      return other?._id?.toString() === member._id?.toString()
    })
    if (existing) {
      handleSelect(existing)
    } else {
      router.push(`/profile/${member.username}`)
    }
    setSearch('')
  }

  const isSearching = search.length >= 2

  // Members from search results who don't already have a conversation shown
  const existingMemberIds = new Set(
    filtered.map(req => getOtherParty(req)?._id?.toString()).filter(Boolean)
  )
  const newMembers = memberResults.filter(m => !existingMemberIds.has(m._id?.toString()))

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Messages</h2>
          <button
            onClick={() => { setSearch(''); setTimeout(() => searchRef.current?.focus(), 0) }}
            className="p-1.5 text-gray-400 hover:text-brand hover:bg-brand-lighter rounded-lg transition-colors"
            aria-label="New message"
            title="New message"
          >
            <PenSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search members or conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
                       placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30
                       focus:border-brand transition-colors"
          />
        </div>
      </div>

      {/* Filter tabs — hidden while searching */}
      {!isSearching && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {STATUS_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <ConversationItemSkeleton key={i} />)
        ) : (
          <>
            {/* Existing conversations */}
            {filtered.length > 0 && (
              <>
                {isSearching && (
                  <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    Conversations
                  </p>
                )}
                {filtered.map(req => {
                  const other = getOtherParty(req)
                  const unread = hasUnread(req)
                  const badge = STATUS_BADGE[req.status] ?? STATUS_BADGE.pending
                  const isSelected = selectedRequestId === req._id

                  return (
                    <button
                      key={req._id}
                      onClick={() => handleSelect(req)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors',
                        'hover:bg-gray-50 cursor-pointer',
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

                        <div className="mt-0.5">
                          <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                        </div>

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

                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatDateRange(req.checkInDate, req.checkOutDate)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </>
            )}

            {/* Verified member search results */}
            {isSearching && (
              <>
                {searchingMembers ? (
                  <p className="px-4 py-3 text-xs text-gray-400">Searching members…</p>
                ) : newMembers.length > 0 ? (
                  <>
                    <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                      Verified members
                    </p>
                    {newMembers.map(member => (
                      <button
                        key={member._id}
                        onClick={() => handleMemberClick(member)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <Avatar
                          src={member.profilePhotoUrl}
                          name={member.fullName}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{member.fullName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge
                              variant={member.verificationTier === 'trusted' ? 'trusted' : 'verified'}
                              size="sm"
                            >
                              {member.verificationTier}
                            </Badge>
                            {(member.city || member.country) && (
                              <span className="text-[11px] text-gray-400">
                                {[member.city, member.country].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                ) : null}
              </>
            )}

            {/* Empty states */}
            {!isSearching && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <p className="text-sm text-gray-500">No conversations yet.</p>
              </div>
            )}

            {isSearching && !searchingMembers && filtered.length === 0 && newMembers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <p className="text-sm text-gray-500">No results for "{search}".</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
