'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileCheck, Shield, Users, Flag, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/ui/Logo'

function AdminNavItem({ href, icon: Icon, label, badge, currentPath }) {
  const active = currentPath === href || (href !== '/admin' && currentPath.startsWith(href))
  return (
    <Link
      href={href}
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

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession()
  const router                    = useRouter()
  const pathname                  = usePathname()
  const [counts, setCounts]       = useState({ kyc: 0, reports: 0 })

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — white, brand accents, matches the main app sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5">
          <Logo variant="full" theme="light" size="sm" href="/admin" />
          <div className="mt-3 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-brand-lighter text-brand text-[10px] font-semibold uppercase tracking-wide">
              Admin
            </span>
            <p className="text-xs text-gray-400 truncate">
              {session.user.fullName ?? session.user.username ?? 'Admin'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-2 flex flex-col gap-1">
          {NAV.map(item => (
            <AdminNavItem key={item.href} {...item} currentPath={pathname} />
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
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
