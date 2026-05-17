'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share2 } from 'lucide-react'

export default function PWAInstallButton() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    // Already running as installed PWA — hide button
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // User previously dismissed — skip until next session
    if (sessionStorage.getItem('sr-pwa-dismissed')) return

    // iOS Safari: no programmatic install API, show Share instructions
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window)
    if (ios) {
      setIsIOS(true)
      setShow(true)
      return
    }

    // Android / Chrome: capture the install prompt
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setShow(false))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!show) return null

  const handleInstall = async () => {
    if (isIOS) {
      setShowHint(h => !h)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setShowHint(false)
    sessionStorage.setItem('sr-pwa-dismissed', '1')
  }

  return (
    // Mobile only — lg:hidden. Positioned above the 64px TabBar + safe area.
    <div
      className="lg:hidden fixed right-4 z-50 flex flex-col items-end gap-2"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
    >
      {/* iOS hint tooltip */}
      {showHint && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-52">
          <p className="text-xs font-semibold text-gray-800 mb-1">Add to Home Screen</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Tap{' '}
            <Share2 className="inline w-3 h-3 text-blue-500 -mt-0.5" />{' '}
            <strong>Share</strong>, then{' '}
            <strong>Add to Home Screen</strong>
          </p>
          <p className="mt-2 text-[11px] text-gray-400">Open this page in Safari first</p>
        </div>
      )}

      {/* Button pill */}
      <div className="flex items-center bg-brand shadow-lg shadow-brand/40 rounded-full overflow-hidden">
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 pl-3 pr-2.5 py-2 text-white text-xs font-semibold"
          aria-label="Install SisterRoam app"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Get App</span>
        </button>
        <div className="w-px h-4 bg-white/20 shrink-0" />
        <button
          onClick={handleDismiss}
          className="px-2 py-2 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
