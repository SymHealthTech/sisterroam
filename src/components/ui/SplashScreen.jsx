'use client'

import { useEffect, useState } from 'react'
import Logo from './Logo'

export default function SplashScreen() {
  const [show,   setShow]   = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(display-mode: standalone)').matches) return
    setShow(true)
    const fadeTimer = setTimeout(() => setFading(true), 1400)
    const hideTimer = setTimeout(() => setShow(false), 1800)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#5D1A8B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 9999,
        transition: 'opacity 0.4s ease',
        opacity: fading ? 0 : 1,
      }}
    >
      <Logo variant="stacked" theme="purple" size="xl" />

      <div style={{ display: 'flex', gap: '6px', marginTop: '24px' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              animation: `sr-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes sr-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
