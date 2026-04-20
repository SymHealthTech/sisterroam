'use client'

import { useEffect, useRef } from 'react'
import { getPusherClient } from '@/lib/pusher-client'

export function useSocket(channelName, eventHandlers = {}) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!channelName) return

    const pusher = getPusherClient()
    const channel = pusher.subscribe(channelName)
    channelRef.current = channel

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      channel.bind(event, handler)
    })

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        channel.unbind(event, handler)
      })
      pusher.unsubscribe(channelName)
    }
  }, [channelName])

  return channelRef.current
}
