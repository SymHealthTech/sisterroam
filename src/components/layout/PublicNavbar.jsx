'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Button from '@/components/ui/Button'

const navLinks = [
  { href: '/browse', label: 'Find a Host' },
  { href: '/how-it-works', label: 'How it Works' },
  { href: '/safety', label: 'Safety' },
  { href: '/blog', label: 'Blog' },
]

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand">SisterRoam</span>
          <span className="text-pink text-lg">♀</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="text-sm text-gray-600 hover:text-brand transition-colors font-medium">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Join Free</Link>
          </Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="text-sm font-medium text-gray-700 py-2"
              onClick={() => setMobileOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" size="md" className="flex-1" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button size="md" className="flex-1" asChild>
              <Link href="/signup">Join Free</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
