'use client'

import { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_LABELS = {
  arrival:   'arrived safely',
  morning:   'are doing well this morning',
  departure: 'departed safely',
}

export default function CheckInPrompt({ prompt, onConfirm, onSnooze }) {
  const [visible, setVisible] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  async function handleConfirm() {
    setConfirming(true)
    await onConfirm?.()
    setConfirming(false)
  }

  const label = TYPE_LABELS[prompt.type] ?? 'checked in'

  return (
    <div
      className={cn(
        'fixed bottom-24 lg:bottom-4 left-4 right-4 z-50 max-w-sm mx-auto',
        'transition-transform duration-300 ease-out',
        visible ? 'translate-y-0' : 'translate-y-[120%]'
      )}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-lighter flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              Safety check-in
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Confirm you {label} at{' '}
              <span className="font-medium text-gray-700">{prompt.otherPartyName}</span>&apos;s place
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex-1 py-2 bg-teal text-white text-sm font-medium rounded-lg
                           hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              >
                {confirming ? 'Confirming…' : 'Confirm safe'}
              </button>
              <button
                onClick={onSnooze}
                className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap"
              >
                Snooze 30m
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
