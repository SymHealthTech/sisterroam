'use client'

import { useEffect } from 'react'

/**
 * Auto-refresh to the newest deploy.
 *
 * next-pwa registers the service worker with skipWaiting + clientsClaim, so a
 * new deploy's SW activates and takes control immediately. But the page that
 * triggered the update still shows the OLD cached assets until it reloads —
 * which is why fresh changes "don't show up" after a deploy. Reloading once when
 * the new SW takes control fixes that without users having to clear their cache.
 *
 * We only listen when a controller already exists, so the very first install
 * (controller: null → SW) does NOT trigger a reload.
 */
export default function SWUpdater() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    // No existing controller means this is the first install — its initial claim
    // shouldn't reload the page. We only auto-reload on genuine updates.
    if (!navigator.serviceWorker.controller) return

    let refreshing = false
    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }, [])

  return null
}
