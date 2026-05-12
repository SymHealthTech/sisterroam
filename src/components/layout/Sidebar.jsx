'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Home, Search, MessageCircle, Users, User,
  Shield, Settings, ChevronLeft, LogOut,
  UserPlus, MapPin, BookOpen, Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Logo from '@/components/ui/Logo'
import { useUnreadCount } from '@/hooks/useUnreadCount'

const NAV_ITEMS = [
  { href: '/feed',              icon: Home,          label: 'Home'            },
  { href: '/explore',           icon: Search,        label: 'Explore'         },
  { href: '/community',         icon: Users,         label: 'Community'       },
  { href: '/community/stories', icon: BookOpen,      label: 'Travel Stories'  },
  { href: '/cotraveller',       icon: UserPlus,      label: 'Co-traveller'    },
  { href: '/recommendations',   icon: MapPin,        label: 'Recommendations' },
  { href: '/messages',          icon: MessageCircle, label: 'Messages'        },
  { href: '/safety',            icon: Shield,        label: 'Safety'          },
  { href: '/profile',           icon: User,          label: 'My Profile'      },
  { href: '/profile/settings',  icon: Settings,      label: 'Settings'        },
]

function NavItem({ href, icon: Icon, label, active, collapsed, badge }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl py-2.5 px-3 text-sm font-medium transition-colors',
        collapsed && 'justify-center',
        active
          ? 'bg-brand-lighter text-brand'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
      )}
    >
      <span className="relative shrink-0">
        <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

export default function Sidebar({ user }) {
  const pathname     = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const unreadCount  = useUnreadCount()

  useEffect(() => {
    if (localStorage.getItem('sidebar-collapsed') === 'true') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  return (
    <aside className={cn(
      'hidden lg:flex flex-col h-screen sticky top-0 border-r border-gray-100 bg-white overflow-y-auto shrink-0 transition-all duration-200',
      collapsed ? 'w-16' : 'w-60',
    )}>
      {/* Logo */}
      <div className={cn('flex items-center px-4 py-5 mb-2', collapsed && 'justify-center px-3')}>
        {collapsed ? (
          <Logo variant="icon" theme="light" size="sm" href="/feed" />
        ) : (
          <Logo variant="full" theme="light" size="sm" href="/feed" />
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1 px-2">
        {NAV_ITEMS.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/feed' && pathname.startsWith(href))
          return (
            <NavItem
              key={href}
              href={href}
              icon={icon}
              label={label}
              active={active}
              collapsed={collapsed}
              badge={label === 'Messages' ? unreadCount : 0}
            />
          )
        })}
      </nav>

      {/* Go to Website */}
      <div className="px-2 pb-1">
        <Link
          href="/"
          title={collapsed ? 'Go to Website' : undefined}
          className={cn(
            'flex items-center gap-2 w-full rounded-xl py-2.5 px-3 text-sm font-medium text-brand border border-brand-lighter bg-brand-lighter/50 hover:bg-brand-lighter transition-colors',
            collapsed && 'justify-center px-0',
          )}
        >
          <Globe className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Go to Website</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <div className="px-2 pb-2">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center p-2.5 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform duration-200', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* User mini-card */}
      {user && (
        <div className={cn(
          'border-t border-gray-100 p-3 shrink-0',
          collapsed ? 'flex flex-col items-center gap-2' : 'flex flex-col items-center gap-1.5',
        )}>
          <Link href="/profile" className="flex flex-col items-center gap-1 w-full">
            <Avatar
              src={user.profilePhotoUrl}
              name={user.fullName}
              size={collapsed ? 'sm' : 'md'}
            />
            {!collapsed && (
              <>
                <p className="text-xs font-semibold text-gray-900 truncate max-w-full text-center leading-tight mt-0.5">
                  {user.fullName}
                </p>
                {user.verificationTier && user.verificationTier !== 'basic' && (
                  <Badge
                    variant={user.verificationTier === 'trusted' ? 'trusted' : 'verified'}
                    size="sm"
                  >
                    {user.verificationTier === 'trusted' ? 'Trusted' : 'Verified'}
                  </Badge>
                )}
              </>
            )}
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            title={collapsed ? 'Sign out' : undefined}
            className={cn(
              'flex items-center gap-2 text-xs text-gray-400 hover:text-danger hover:bg-danger-lighter rounded-lg px-2 py-1.5 transition-colors mt-1',
              collapsed ? 'justify-center w-full' : 'w-full justify-center',
            )}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      )}
    </aside>
  )
}
