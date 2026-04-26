'use client'

import { useState, useRef, useCallback } from 'react'

const HOLD_MS       = 3000
const CIRCLE_RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

export default function SosButton({ onActivate }) {
  const [progress, setProgress] = useState(0)
  const [holding,  setHolding]  = useState(false)
  const intervalRef  = useRef(null)
  const startTimeRef = useRef(null)

  const cancelHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setHolding(false)
    setProgress(0)
  }, [])

  const startHold = useCallback(() => {
    setHolding(true)
    startTimeRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const p = Math.min(elapsed / HOLD_MS, 1)
      setProgress(p)
      if (p >= 1) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setHolding(false)
        setProgress(0)
        onActivate?.()
      }
    }, 30)
  }, [onActivate])

  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      {/* Animated ring */}
      <svg
        width="96"
        height="96"
        className="absolute pointer-events-none"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx="48" cy="48" r={CIRCLE_RADIUS}
          fill="none" stroke="rgba(226,75,74,0.2)" strokeWidth="4"
        />
        <circle
          cx="48" cy="48" r={CIRCLE_RADIUS}
          fill="none" stroke="#E24B4A" strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: holding ? 'none' : 'stroke-dashoffset 0.25s ease' }}
        />
      </svg>

      <button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onContextMenu={e => e.preventDefault()}
        style={{
          width:           80,
          height:          80,
          borderRadius:    '50%',
          backgroundColor: '#E24B4A',
          border:          '4px solid rgba(255,255,255,0.3)',
          color:           'white',
          fontSize:        14,
          fontWeight:      500,
          cursor:          'pointer',
          touchAction:     'none',
          WebkitUserSelect: 'none',
          userSelect:      'none',
          letterSpacing:   1,
          boxShadow:       holding
            ? '0 0 0 8px rgba(226,75,74,0.15)'
            : '0 4px 16px rgba(226,75,74,0.35)',
          transition:      'box-shadow 0.2s ease',
        }}
      >
        SOS
      </button>
    </div>
  )
}
