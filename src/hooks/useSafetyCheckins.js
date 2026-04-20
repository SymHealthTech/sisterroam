'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

export function useSafetyCheckins(requestId) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCheckins = useCallback(async () => {
    if (!requestId) { setLoading(false); return }
    setLoading(true)
    const res = await fetch(`/api/safety/checkins?requestId=${requestId}`)
    const data = await res.json()
    setCheckins(data)
    setLoading(false)
  }, [requestId])

  useEffect(() => { fetchCheckins() }, [fetchCheckins])

  function handleCheckedIn(id) {
    setCheckins(prev => prev.map(c =>
      c._id === id ? { ...c, status: 'completed', completedAt: new Date() } : c
    ))
  }

  const hasMissed = checkins.some(c => c.status === 'missed')
  const nextDue = checkins.find(c => c.status === 'scheduled')

  useEffect(() => {
    if (hasMissed) {
      toast.error('You missed a safety check-in!', { id: 'missed-checkin', duration: 8000 })
    }
  }, [hasMissed])

  return { checkins, loading, handleCheckedIn, hasMissed, nextDue, refresh: fetchCheckins }
}
