import { useState, useEffect, useCallback } from 'react'
import { useSSEContext } from '@/context/SSEContext'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const { subscribe } = useSSEContext()

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count ?? 0)
      }
    } catch {}
  }, [])

  // Fetch once on mount
  useEffect(() => { fetchUnread() }, [fetchUnread])

  // Refetch when tab becomes visible (syncs count if messages were read elsewhere)
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible') fetchUnread()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [fetchUnread])

  // Fallback poll every 5 minutes (only while tab is visible)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchUnread()
    }, 5 * 60_000)
    return () => clearInterval(id)
  }, [fetchUnread])

  // Real-time increment via the shared SSE connection — no extra DB query
  useEffect(() => {
    return subscribe('new_message', () => setUnreadCount(c => c + 1))
  }, [subscribe])

  return unreadCount
}
