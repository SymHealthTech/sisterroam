'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false)
  const esRef       = useRef(null)
  const retryDelay  = useRef(3000)
  const subscribers = useRef({})

  const subscribe = useCallback((eventType, handler) => {
    if (!subscribers.current[eventType]) subscribers.current[eventType] = new Set()
    subscribers.current[eventType].add(handler)
    return () => subscribers.current[eventType]?.delete(handler)
  }, [])

  useEffect(() => {
    let destroyed = false

    function connect() {
      if (destroyed) return

      const es = new EventSource('/api/sse')
      esRef.current = es

      es.onopen = () => {
        if (destroyed) return
        setIsConnected(true)
        retryDelay.current = 3000
      }

      es.onerror = () => {
        if (destroyed) return
        setIsConnected(false)
        es.close()
        // Exponential back-off, max 30 s
        const delay = Math.min(retryDelay.current, 30000)
        retryDelay.current = Math.min(delay * 2, 30000)
        setTimeout(connect, delay)
      }

      function makeHandler(type) {
        return (e) => {
          if (destroyed) return
          try {
            const data = JSON.parse(e.data)
            subscribers.current[type]?.forEach(fn => fn(data))
          } catch {}
        }
      }

      const events = [
        'connected',
        'new_message',
        'conversation_update',
        'new_notification',
        'pending_notifications',
        'request_update',
        'checkin_prompt',
        // Co-traveller events
        'new_cotraveller_interest',
        'cotraveller_accepted',
        'cotraveller_declined',
        // Recommendation events
        'new_recommendation_answer',
      ]
      for (const ev of events) es.addEventListener(ev, makeHandler(ev))
    }

    connect()

    return () => {
      destroyed = true
      esRef.current?.close()
    }
  }, [])

  return { isConnected, subscribe }
}
