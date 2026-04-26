'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from './useSocket'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const json = await res.json()
      const list = json.data?.notifications ?? []
      setNotifications(list)
      setUnreadCount(list.filter(n => !n.isRead).length)
    } catch {
      // silently ignore — non-critical
    }
  }, [])

  useEffect(() => { if (userId) fetchNotifications() }, [userId, fetchNotifications])

  useSocket(userId ? `user-${userId}` : null, 'notification', (notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(c => c + 1)
  })

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markAllRead, refresh: fetchNotifications }
}
