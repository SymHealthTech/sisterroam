'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

function isInStandaloneMode() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

function isIOSSafari() {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream && /Safari/.test(ua) && !/Chrome/.test(ua)
}

const DISMISSED_KEY  = 'pwa-dismissed-at'
const COOLDOWN_MS    = 7 * 24 * 60 * 60 * 1000
const SHOW_DELAY_MS  = 30_000

export default function PWAInstallPrompt() {
  const [show,       setShow]    = useState(false)
  const [visible,    setVisible] = useState(false)
  const [isIOS,      setIsIOS]   = useState(false)
  const deferredEvt              = useRef(null)

  useEffect(() => {
    if (isInStandaloneMode()) return

    const dismissedAt = localStorage.getItem(DISMISSED_KEY)
    if (dismissedAt && Date.now() - Number(dismissedAt) < COOLDOWN_MS) return

    const ios = isIOSSafari()
    setIsIOS(ios)

    function onBeforeInstall(e) {
      e.preventDefault()
      deferredEvt.current = e
    }

    if (!ios) {
      window.addEventListener('beforeinstallprompt', onBeforeInstall)
    }

    const timer = setTimeout(() => {
      setShow(true)
      requestAnimationFrame(() => setVisible(true))
    }, SHOW_DELAY_MS)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    setTimeout(() => setShow(false), 300)
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
  }

  async function install() {
    if (!deferredEvt.current) return
    deferredEvt.current.prompt()
    const { outcome } = await deferredEvt.current.userChoice
    deferredEvt.current = null
    if (outcome === 'accepted') dismiss()
  }

  if (!show) return null

  return (
    <div className={cn(
      'fixed bottom-20 md:bottom-4 left-0 right-0 z-50 flex justify-center px-4 transition-transform duration-300',
      visible ? 'translate-y-0' : 'translate-y-full',
    )}>
      <div className="w-full max-w-sm bg-brand-darker text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <span className="text-white text-xl" aria-hidden="true">♀</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Add to home screen</p>
          {isIOS ? (
            <p className="text-xs text-white/70 mt-0.5">
              Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
            </p>
          ) : (
            <p className="text-xs text-white/70 mt-0.5">
              Get the full SisterRoam app experience
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isIOS && (
            <button
              onClick={install}
              className="px-3 py-1.5 bg-white text-brand text-xs font-semibold rounded-lg hover:bg-brand-lighter transition-colors"
            >
              Install
            </button>
          )}
          <button
            onClick={dismiss}
            className="p-1.5 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
