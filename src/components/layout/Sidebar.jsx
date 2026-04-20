'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageCircle, Users, User, Shield, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'

const navItems = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/explore', icon: Search, label: 'Explore' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/community', icon: Users, label: 'Community' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/safety', icon: Shield, label: 'Safety' },
  { href: '/profile/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ user }) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-100 bg-white px-4 py-6">
      <Link href="/feed" className="flex items-center gap-2 px-3 mb-8">
        <span className="text-xl font-bold text-brand">SisterRoam</span>
        <span className="text-pink text-lg">♀</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              active
                ? 'bg-brand-lighter text-brand'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}>
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {user && (
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
          <Avatar src={user.image} name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      )}
    </aside>
  )
}
