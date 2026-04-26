'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileCheck, Shield, Users, Flag, BookOpen, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

function AdminNavItem({ href, icon: Icon, label, badge, currentPath }) {
  const active = currentPath === href || (href !== '/admin' && currentPath.startsWith(href))
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
        active
          ? 'bg-white/15 text-white font-medium'
          : 'text-gray-400 hover:bg-white/10 hover:text-gray-200',
      )}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
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

  if (status === 'loading' || !session?.user?.isAdmin) return null

  const NAV = [
    { href: '/admin',           icon: LayoutDashboard, label: 'Dashboard',            badge: 0             },
    { href: '/admin/kyc',       icon: FileCheck,       label: 'KYC Queue',            badge: counts.kyc    },
    { href: '/admin/reports',   icon: Shield,          label: 'Safety Reports',       badge: counts.reports },
    { href: '/admin/users',     icon: Users,           label: 'User Management',      badge: 0             },
    { href: '/admin/community', icon: Flag,            label: 'Community Moderation', badge: 0             },
    { href: '/admin/blog',      icon: BookOpen,        label: 'Blog Management',      badge: 0             },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-[200px] bg-gray-950 flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="text-white font-bold text-base">Admin Panel</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Logged in as {session.user.fullName ?? session.user.username ?? 'Admin'}
          </p>
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-0.5 mt-2">
          {NAV.map(item => (
            <AdminNavItem key={item.href} {...item} currentPath={pathname} />
          ))}
        </nav>

        <div className="p-2 border-t border-white/10">
          <Link
            href="/feed"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 bg-white overflow-auto">
        {children}
      </main>
    </div>
  )
}
