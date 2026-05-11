'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Sidebar from './Sidebar'
import TabBar from './TabBar'
import Avatar from '@/components/ui/Avatar'
import Skeleton from '@/components/ui/Skeleton'
import NotificationPanel from '@/components/ui/NotificationPanel'
import CheckInPrompt from '@/components/safety/CheckInPrompt'
import { useSafetyCheckins } from '@/hooks/useSafetyCheckins'
import { SSEProvider } from '@/context/SSEContext'
import { useSSEContext } from '@/context/SSEContext'

const AppUserContext = createContext(null)
export function useAppUser() { return useContext(AppUserContext) }

function LoadingSkeleton() {
  return (
    <div className="flex h-dvh overflow-hidden bg-gray-50">
      <div className="hidden lg:block w-60 h-screen bg-white border-r border-gray-100 shrink-0" />
      <div className="flex-1 p-6 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton variant="card" className="h-48 w-full" />
        <Skeleton variant="card" className="h-48 w-full" />
      </div>
    </div>
  )
}

function AppLayoutInner({ children, title, subtitle, scrollable = true, noTopBar = false }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [freshData, setFreshData] = useState({ profilePhotoUrl: null, verificationTier: null, verifPending: false, verifApproved: false, tierLoaded: false })
  // Must be called unconditionally — useSafetyCheckins guards against null userId internally
  const { prompt, confirm, snooze } = useSafetyCheckins(session?.user?.id ?? null)
  const { subscribe } = useSSEContext()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    const controller = new AbortController()
    const signal = controller.signal

    async function loadFreshUser() {
      try {
        const r = await fetch('/api/users', { signal })
        const d = await r.json()
        if (signal.aborted) return
        if (!d.success) {
          if (!signal.aborted) setFreshData(prev => ({ ...prev, tierLoaded: true }))
          return
        }
        const tier = d.data.verificationTier ?? null
        const update = {
          profilePhotoUrl:  d.data.profilePhotoUrl ?? null,
          verificationTier: tier,
          verifPending: false,
        }
        if (tier === 'basic') {
          try {
            const vRes = await fetch('/api/verification/status', { signal })
            if (vRes.ok && !signal.aborted) {
              const vd = await vRes.json()
              const vs = vd.data?.verification?.status
              update.verifPending  = vs === 'pending'
              update.verifApproved = vs === 'approved'
            }
          } catch {}
        }
        if (!signal.aborted) setFreshData({ ...update, tierLoaded: true })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('[AppLayout] loadFreshUser:', err.message)
          setFreshData(prev => ({ ...prev, tierLoaded: true }))
        }
      }
    }

    loadFreshUser()
    return () => controller.abort()
  }, [status])  

  useEffect(() => {
    const u1 = subscribe('new_cotraveller_interest', (d) => {
      toast(`${d.interestedUser?.fullName ?? 'Someone'} wants to join your trip to ${d.toCity ?? 'your destination'}!`, { icon: '✈️' })
    })
    const u2 = subscribe('cotraveller_accepted', (d) => {
      toast.success(`You are matched for ${d.toCity ?? 'your trip'}! Open chat to plan.`)
    })
    const u3 = subscribe('new_recommendation_answer', (d) => {
      toast(`${d.answererName ?? 'Someone'} answered your question about ${d.city ?? 'a city'}`, { icon: '💬' })
    })
    return () => { u1(); u2(); u3() }
  }, [subscribe])

  if (status === 'loading') return <LoadingSkeleton />
  if (!session) return null

  const user = session.user
  const avatarSrc = freshData.profilePhotoUrl ?? user.profilePhotoUrl ?? null
  const freshUser = {
    ...user,
    profilePhotoUrl:  avatarSrc,
    ...(freshData.tierLoaded ? { verificationTier: freshData.verificationTier } : {}),
    verifPending:  freshData.verifPending  ?? false,
    verifApproved: freshData.verifApproved ?? false,
    tierLoaded:    freshData.tierLoaded,
  }

  return (
    <AppUserContext.Provider value={freshUser}>
    <div className="flex h-dvh overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar user={{ ...user, profilePhotoUrl: avatarSrc }} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between h-14 px-6 bg-white border-b border-gray-100 sticky top-0 z-20 shrink-0">
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
          <div className="flex items-center gap-3">
            <NotificationPanel userId={user?.id} />
            <Link href="/profile">
              <Avatar src={avatarSrc} name={user.fullName} size="sm" />
            </Link>
          </div>
        </div>

        {/* Mobile mini-header */}
        {!noTopBar && <div className="lg:hidden flex items-center min-h-[52px] py-2 px-4 bg-white border-b border-gray-100 sticky top-0 z-20 shrink-0">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-gray-600 hover:text-gray-900 -ml-1.5 self-start mt-0.5"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {title && (
            <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
              {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          )}
          <div className="ml-auto self-start mt-0.5">
            <NotificationPanel userId={user?.id} />
          </div>
        </div>}

        {/* Scrollable content */}
        <main className={scrollable ? "flex-1 min-h-0 overflow-y-auto pb-20 lg:pb-0" : "flex-1 overflow-hidden flex flex-col"}>
          {children}
        </main>
      </div>

      {/* Mobile TabBar */}
      <div className="lg:hidden">
        <TabBar />
      </div>

      {/* Safety check-in prompt — slides up from bottom above TabBar */}
      {prompt && (
        <CheckInPrompt prompt={prompt} onConfirm={confirm} onSnooze={snooze} />
      )}
    </div>
    </AppUserContext.Provider>
  )
}

export default function AppLayout({ children, title, subtitle, scrollable = true, noTopBar = false }) {
  return (
    <SSEProvider>
      <AppLayoutInner title={title} subtitle={subtitle} scrollable={scrollable} noTopBar={noTopBar}>{children}</AppLayoutInner>
    </SSEProvider>
  )
}
