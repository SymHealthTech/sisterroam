'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileCheck, Shield, Users, Flag, ArrowLeft, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/ui/Logo'

function AdminNavItem({ href, icon: Icon, label, badge, currentPath, onNavigate }) {
  const active = currentPath === href || (href !== '/admin' && currentPath.startsWith(href))
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-xl py-2.5 px-3 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-lighter text-brand'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
      )}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

/* Shared sidebar body — rendered in both the desktop rail and the mobile drawer */
function SidebarBody({ session, nav, pathname, onClose, showClose }) {
  return (
    <>
      <div className="px-4 py-5 flex items-start justify-between">
        <div>
          <Logo variant="full" theme="light" size="sm" href="/admin" />
          <div className="mt-3 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-brand-lighter text-brand text-[10px] font-semibold uppercase tracking-wide">
              Admin
            </span>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">
              {session.user.fullName ?? session.user.username ?? 'Admin'}
            </p>
          </div>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="-mr-1 p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 flex flex-col gap-1 overflow-y-auto">
        {nav.map(item => (
          <AdminNavItem key={item.href} {...item} currentPath={pathname} onNavigate={onClose} />
        ))}
      </nav>

      <div className="p-2 border-t border-gray-100">
        <Link
          href="/feed"
          className="flex items-center gap-2.5 rounded-xl py-2.5 px-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          Back to site
        </Link>
      </div>
    </>
  )
}

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession()
  const router                    = useRouter()
  const pathname                  = usePathname()
  const [counts, setCounts]       = useState({ kyc: 0, reports: 0 })
  const [drawerOpen, setDrawer]   = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return }
    if (status === 'authenticated' && !session?.user?.isAdmin) router.replace('/feed')
  }, [status, session, router])

  useEffect(() => {
    if (!session?.user?.isAdmin) return
    async function fetchCounts() {
      try {
        const res = await fetch('/api/admin/counts')
        if (res.ok) {
          const data = await res.json()
          setCounts({ kyc: data.data?.pendingKyc ?? 0, reports: data.data?.openReports ?? 0 })
        }
      } catch {}
    }
    fetchCounts()
  }, [session])

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [drawerOpen])

  if (status === 'loading' || !session?.user?.isAdmin) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const NAV = [
    { href: '/admin',           icon: LayoutDashboard, label: 'Dashboard',            badge: 0             },
    { href: '/admin/kyc',       icon: FileCheck,       label: 'KYC Queue',            badge: counts.kyc    },
    { href: '/admin/reports',   icon: Shield,          label: 'Safety Reports',       badge: counts.reports },
    { href: '/admin/users',     icon: Users,           label: 'User Management',      badge: 0             },
    { href: '/admin/community', icon: Flag,            label: 'Community Moderation', badge: 0             },
  ]

  const alerts    = counts.kyc + counts.reports
  const closeDrawer = () => setDrawer(false)

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* ── Mobile top bar (below lg only) ────────────── */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-4">
        <button
          onClick={() => setDrawer(true)}
          className="relative -ml-1 p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Open admin menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
          {alerts > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" aria-hidden="true" />
          )}
        </button>
        <Logo variant="full" theme="light" size="sm" href="/admin" />
        <span className="ml-auto px-2 py-0.5 rounded-full bg-brand-lighter text-brand text-[10px] font-semibold uppercase tracking-wide">
          Admin
        </span>
      </header>

      {/* ── Desktop sidebar (lg+ only) ────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-60 h-screen sticky top-0 bg-white border-r border-gray-100 shrink-0 overflow-y-auto">
        <SidebarBody session={session} nav={NAV} pathname={pathname} onClose={undefined} showClose={false} />
      </aside>

      {/* ── Mobile drawer (below lg only) ─────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} aria-hidden="true" />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-xl flex flex-col overflow-y-auto">
            <SidebarBody session={session} nav={NAV} pathname={pathname} onClose={closeDrawer} showClose />
          </aside>
        </div>
      )}

      {/* ── Main ──────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
