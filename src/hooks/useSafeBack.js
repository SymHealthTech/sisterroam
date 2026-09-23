'use client'

import { useCallback, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// How many in-app screens sit behind the current one in this tab. Opening the
// app from a link (installed app, email, notification) or returning from the
// Dodo checkout starts at 1 — there is nothing in-app to go "back" to, and
// history.back() would leave the app or land on the payment page.
let depth = 0
let popping = false
let lastPath = null

/** Mounted once in the root layout: keeps `depth` in step with navigation. */
export function NavTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Same-page pops (e.g. closing a sheet with the back button) don't count.
    const onPop = () => { if (window.location.pathname !== lastPath) popping = true }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    lastPath = pathname
    if (popping) {
      depth = Math.max(1, depth - 1)
      popping = false
    } else {
      depth += 1
    }
  }, [pathname])

  return null
}

/** Back that never leaves the app: goes to `fallback` when there is no in-app history. */
export function useSafeBack(fallback = '/feed') {
  const router = useRouter()
  return useCallback(() => {
    if (depth > 1) router.back()
    else router.replace(fallback)
  }, [router, fallback])
}
