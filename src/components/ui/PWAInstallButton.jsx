'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Download, X, Share2 } from 'lucide-react'

// Subscribes to appinstalled so isInstalled updates reactively after install
function subscribeInstalled(cb) {
  window.addEventListener('appinstalled', cb)
  return () => window.removeEventListener('appinstalled', cb)
}
// UA never changes — no subscription needed
const noSubscribe = () => () => {}

export default function PWAInstallButton() {
  // useSyncExternalStore reads browser APIs during render (not in an effect).
  // The third arg is the SSR snapshot — always false on the server.
  const isInstalled = useSyncExternalStore(
    subscribeInstalled,
    () => window.matchMedia('(display-mode: standalone)').matches,
    () => false,
  )
  const isIOS = useSyncExternalStore(
    noSubscribe,
    () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window),
    () => false,
  )

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [minimized, setMinimized] = useState(false)

  // Android only: setState is inside the event callback — not directly in the effect body
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  // Derived visibility — no separate show state needed
  const show = !isInstalled && (isIOS || deferredPrompt !== null)

  if (!show) return null

  const handleToggle = () => {
    setMinimized(m => !m)
    if (!minimized) setShowHint(false)
  }

  if (minimized) {
    return (
      <button
        onClick={handleToggle}
        aria-label="Show install button"
        className="lg:hidden fixed right-4 z-50 w-3 h-3 rounded-full bg-brand/50 hover:bg-brand transition-colors"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)' }}
      />
    )
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowHint(h => !h)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(outcome === 'accepted' ? null : deferredPrompt)
  }

  return (
    <div
      className="lg:hidden fixed right-4 z-50 flex flex-col items-center gap-1"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)' }}
    >
      {/* iOS share hint tooltip */}
      {showHint && (
        <div className="absolute bottom-full mb-2 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-52">
          <p className="text-xs font-semibold text-gray-800 mb-1">Add to Home Screen</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Tap <Share2 className="inline w-3 h-3 text-blue-500 -mt-0.5" />{' '}
            <strong>Share</strong>, then <strong>Add to Home Screen</strong>
          </p>
          <p className="mt-2 text-[11px] text-gray-400">Open this page in Safari</p>
        </div>
      )}

      {/* Main round install button */}
      <button
        onClick={handleInstall}
        aria-label="Install SisterRoam app"
        className="w-10 h-10 rounded-full bg-brand text-white shadow-lg shadow-brand/40 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Download className="w-4 h-4" />
      </button>

      {/* Tiny hide toggle */}
      <button
        onClick={handleToggle}
        aria-label="Hide install button"
        className="w-4 h-4 rounded-full bg-gray-300/70 flex items-center justify-center"
      >
        <X className="w-2.5 h-2.5 text-gray-500" />
      </button>
    </div>
  )
}
