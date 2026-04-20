'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SosButton() {
  const [pressed, setPressed] = useState(false)
  const [countdown, setCountdown] = useState(0)

  function handlePress() {
    if (pressed) return
    setPressed(true)
    setCountdown(5)

    let t = 5
    const interval = setInterval(() => {
      t -= 1
      setCountdown(t)
      if (t <= 0) {
        clearInterval(interval)
        triggerSos()
      }
    }, 1000)
  }

  function cancel() {
    setPressed(false)
    setCountdown(0)
  }

  async function triggerSos() {
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      await fetch('/api/safety/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      })
    })
    toast.error('🆘 SOS sent! Your emergency contacts have been notified.', { duration: 6000 })
    setPressed(false)
  }

  if (pressed) {
    return (
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-50 flex flex-col items-center gap-2">
        <div className="bg-danger text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold shadow-lg animate-pulse">
          {countdown}
        </div>
        <button onClick={cancel} className="text-xs text-gray-500 underline">Cancel</button>
      </div>
    )
  }

  return (
    <button
      onClick={handlePress}
      className="fixed bottom-24 lg:bottom-6 right-4 z-50 bg-danger text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-danger-dark transition-colors active:scale-95"
      title="SOS - Hold for emergency"
    >
      <AlertTriangle className="w-6 h-6" />
    </button>
  )
}
