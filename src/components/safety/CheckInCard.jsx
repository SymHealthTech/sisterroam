'use client'

import { useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CheckInCard({ checkin, onCheckedIn }) {
  const [loading, setLoading] = useState(false)
  const isDue = new Date(checkin.scheduledAt) <= new Date()

  async function doCheckin() {
    setLoading(true)
    const res = await fetch('/api/safety/checkins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkinId: checkin._id }),
    })
    setLoading(false)
    if (!res.ok) { toast.error('Check-in failed'); return }
    toast.success('Checked in! Stay safe.')
    onCheckedIn?.(checkin._id)
  }

  return (
    <div className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${
      isDue ? 'border-amber-300 bg-amber-lighter' : 'border-gray-100'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        checkin.status === 'completed' ? 'bg-teal-lighter text-teal' : 'bg-amber-lighter text-amber'
      }`}>
        {checkin.status === 'completed'
          ? <CheckCircle className="w-5 h-5" />
          : <Clock className="w-5 h-5" />
        }
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">Safety Check-in</p>
        <p className="text-xs text-gray-500">
          {checkin.status === 'completed'
            ? `Done ${formatRelativeTime(checkin.completedAt)}`
            : `Due ${formatRelativeTime(checkin.scheduledAt)}`
          }
        </p>
      </div>
      {checkin.status !== 'completed' && isDue && (
        <Button size="sm" onClick={doCheckin} isLoading={loading}>Check In</Button>
      )}
    </div>
  )
}
