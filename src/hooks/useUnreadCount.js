import { useState, useEffect } from 'react'

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/messages/unread-count')
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.count ?? 0)
        }
      } catch {}
    }
    fetchUnread()
    const id = setInterval(fetchUnread, 30_000)
    return () => clearInterval(id)
  }, [])

  return unreadCount
}
