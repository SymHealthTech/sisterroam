'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const POLL_INTERVAL = 30 * 60 * 1000 // 30 minutes

export function useSafetyCheckins(userId) {
  const [prompt, setPrompt] = useState(null)
  // prompt = { checkinId, type, requestId, otherPartyName } | null
  const snoozedUntilRef = useRef(null)

  const check = useCallback(async () => {
    if (!userId) return
    if (snoozedUntilRef.current && Date.now() < snoozedUntilRef.current) return

    try {
      const res  = await fetch('/api/requests?activeToday=true')
      const json = await res.json()
      if (!json.success || !json.data?.length) { setPrompt(null); return }

      const activeRequest = json.data[0]
      const isGuest = activeRequest.guestId?._id?.toString() === userId
                   || activeRequest.guestId?.toString()       === userId
      const otherParty     = isGuest ? activeRequest.hostId : activeRequest.guestId
      const otherPartyName = otherParty?.fullName ?? 'your host'

      const cr   = await fetch(`/api/safety/checkins?requestId=${activeRequest._id}`)
      const cj   = await cr.json()
      if (!cj.success) return

      const now = new Date()
      const due = (cj.data ?? []).find(c =>
        !c.confirmedAt && !c.isMissed && new Date(c.scheduledAt) <= now
      )

      setPrompt(due
        ? { checkinId: due._id, type: due.checkinType, requestId: activeRequest._id, otherPartyName }
        : null
      )
    } catch {
      // silently ignore — non-critical background check
    }
  }, [userId])

  useEffect(() => {
    check()
    const interval = setInterval(check, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [check])

  async function confirm() {
    if (!prompt) return
    try {
      await fetch('/api/safety/checkins/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ requestId: prompt.requestId, checkinType: prompt.type }),
      })
      setPrompt(null)
    } catch {
      // ignore
    }
  }

  function snooze() {
    snoozedUntilRef.current = Date.now() + POLL_INTERVAL
    setPrompt(null)
  }

  return { prompt, confirm, snooze }
}
