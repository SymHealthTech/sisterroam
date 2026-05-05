'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, ChevronDown, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Logo from '@/components/ui/Logo'

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'How it Works' },
  { href: '/browse',        label: 'Browse Hosts' },
  { href: '/safety',        label: 'Safety'        },
  { href: '/stories',       label: 'Stories'       },
  { href: '/about',         label: 'About'         },
]

export default function PublicNavbar() {
  const { data: session, status } = useSession()
  const [scrolled,     setScrolled]     = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [freshPhotoUrl, setFreshPhotoUrl] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/users')
      .then(r => r.json())
      .then(d => { if (d.success) setFreshPhotoUrl(d.data.profilePhotoUrl ?? null) })
      .catch(() => {})
  }, [status])  

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const user      = session?.user
  const isAuth    = status === 'authenticated'
  const avatarSrc = freshPhotoUrl ?? user?.profilePhotoUrl ?? null

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 h-[60px] transition-[background-color,border-color,box-shadow] duration-150',
      scrolled ? 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent',
    )}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

        {/* Logo */}
        <Logo
          variant="full"
          theme={scrolled ? 'light' : 'purple'}
          size="sm"
          href="/"
          className="shrink-0"
        />

        {/* Center nav — desktop */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition-colors',
                scrolled ? 'text-gray-600 hover:text-brand' : 'text-white/90 hover:text-white',
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right auth — desktop */}
        <div className="hidden md:flex items-center gap-3">
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-white/30 animate-pulse" />
          ) : isAuth ? (
            <>
              <Button variant={scrolled ? 'primary' : 'white'} size="sm" href="/feed">Go to app</Button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 ring-white/50 transition-all"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  <Avatar src={avatarSrc} name={user.fullName} size="sm" />
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform mr-1', scrolled ? 'text-gray-500' : 'text-white/80', dropdownOpen && 'rotate-180')} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      Profile
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-danger-lighter transition-colors"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                variant={scrolled ? 'ghost' : 'white'}
                size="sm"
                href="/login"
                className={!scrolled ? 'bg-transparent border-white/50 text-white hover:bg-white/10' : ''}
              >
                Log in
              </Button>
              <Button variant={scrolled ? 'primary' : 'white'} size="sm" href="/signup">Join Free</Button>
            </>
          )}
        </div>

        {/* Mobile trigger — avatar (logged in) or hamburger (guest) */}
        <button
          className="md:hidden p-1.5 rounded-full"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          {isAuth ? (
            <Avatar src={avatarSrc} name={user?.fullName} size="sm" />
          ) : (
            <Menu className={cn('w-6 h-6', scrolled ? 'text-gray-700' : 'text-white')} />
          )}
        </button>
      </nav>

      {/* Mobile fullscreen overlay */}
      <div className={cn(
        'fixed inset-0 z-50 bg-white flex flex-col transition-transform duration-300 md:hidden',
        mobileOpen ? 'translate-x-0' : 'translate-x-full',
      )}>
        {/* Top row */}
        <div className="flex items-center justify-between px-4 h-[60px] border-b border-gray-100 shrink-0">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Logo variant="full" theme="light" size="sm" />
          </Link>
          <button
            className="p-2 text-gray-700"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto px-6 pt-4">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-4 text-xl font-medium text-gray-800 border-b border-gray-100 hover:text-brand transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="px-6 py-8 border-t border-gray-100 space-y-3">
          {isAuth ? (
            <>
              <Button variant="primary" fullWidth href="/feed" onClick={() => setMobileOpen(false)}>
                Go to app
              </Button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full py-3 text-sm font-medium text-danger text-center"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Button variant="primary" fullWidth href="/signup" onClick={() => setMobileOpen(false)}>
                Join Free
              </Button>
              <Button variant="ghost" fullWidth href="/login" onClick={() => setMobileOpen(false)}>
                Log in
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
