'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageCircle, Users, User, UserPlus, MapPin, X, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnreadCount } from '@/hooks/useUnreadCount'

const TABS = [
  { href: '/feed',      icon: Home,          label: 'Home'      },
  { href: '/explore',   icon: Search,        label: 'Explore'   },
  { href: '/community', icon: Users,         label: 'Community' },
  { href: '/messages',  icon: MessageCircle, label: 'Messages'  },
]

const MORE_ITEMS = [
  { href: '/cotraveller',     icon: UserPlus, label: 'Co-traveller',    description: 'Find travel companions' },
  { href: '/recommendations', icon: MapPin,   label: 'Recommendations', description: 'Community travel guide' },
  { href: '/profile',         icon: User,     label: 'Profile',         description: 'Your profile & settings' },
]

export default function TabBar() {
  const pathname   = usePathname()
  const unread     = useUnreadCount()
  const [showMore, setMore] = useState(false)

  const isMoreActive = MORE_ITEMS.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 hidden-on-desktop"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        aria-label="Main navigation"
      >
        <div className="flex items-stretch h-16 max-w-lg mx-auto">
          {TABS.map(({ href, icon: Icon, label }) => {
            const active     = pathname === href || (href !== '/feed' && pathname.startsWith(href))
            const isMessages = label === 'Messages'

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                  active ? 'text-brand' : 'text-gray-400 hover:text-gray-600',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
                  {isMessages && unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMore(m => !m)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              isMoreActive ? 'text-brand' : 'text-gray-400 hover:text-gray-600',
            )}
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={showMore || isMoreActive ? 2.5 : 1.8} aria-hidden="true" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More drawer */}
      {showMore && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl pb-safe"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">More</p>
              <button type="button" onClick={() => setMore(false)} className="p-1.5 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-1">
              {MORE_ITEMS.map(({ href, icon: Icon, label, description }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMore(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                      active ? 'bg-brand-lighter text-brand' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <div className={cn('p-2 rounded-xl shrink-0', active ? 'bg-brand/10' : 'bg-gray-100')}>
                      <Icon className={cn('w-5 h-5', active ? 'text-brand' : 'text-gray-500')} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
