'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'

/** Hero section CTA buttons */
export function HeroCta() {
  const { status } = useSession()

  if (status === 'loading') return <div className="h-12 w-64 rounded-[10px] bg-white/20 animate-pulse" />

  if (status === 'authenticated') {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="/feed"
          className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-white text-brand font-medium text-sm hover:bg-white/90 transition-colors"
        >
          Go to your feed
        </Link>
        <Link
          href="/browse"
          className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-transparent border border-white/50 text-white font-medium text-sm hover:bg-white/10 transition-colors"
        >
          Browse hosts
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/signup"
        className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-white text-brand font-medium text-sm hover:bg-white/90 transition-colors"
      >
        Join now — it takes 2 minutes
      </Link>
      <Link
        href="/browse"
        className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-transparent border border-white/50 text-white font-medium text-sm hover:bg-white/10 transition-colors"
      >
        Browse hosts first
      </Link>
    </div>
  )
}

/** "How it works" section single CTA */
export function HowItWorksCta() {
  const { status } = useSession()

  if (status === 'loading') return <div className="h-11 w-48 rounded-[10px] bg-brand/20 animate-pulse mx-auto" />

  if (status === 'authenticated') {
    return (
      <Link
        href="/feed"
        className="inline-flex items-center gap-2 px-7 py-3 bg-brand text-white font-medium text-sm rounded-[10px] hover:opacity-90 transition-opacity"
      >
        Go to your feed
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    )
  }

  return (
    <Link
      href="/signup"
      className="inline-flex items-center gap-2 px-7 py-3 bg-brand text-white font-medium text-sm rounded-[10px] hover:opacity-90 transition-opacity"
    >
      Join now
      <ArrowRight className="w-4 h-4" aria-hidden="true" />
    </Link>
  )
}

/** Final call-to-action section */
export function FinalCta() {
  const { status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <div className="h-11 w-52 rounded-[10px] bg-brand/20 animate-pulse" />
        <div className="h-11 w-40 rounded-[10px] bg-brand/10 animate-pulse" />
      </div>
    )
  }

  if (status === 'authenticated') {
    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/feed"
          className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-brand text-white font-medium text-sm hover:bg-brand-dark transition-colors"
        >
          Go to your feed
        </Link>
        <Link
          href="/browse"
          className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] border-2 border-brand text-brand font-medium text-sm hover:bg-brand hover:text-white transition-colors"
        >
          Browse hosts
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link
        href="/signup"
        className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] bg-brand text-white font-medium text-sm hover:bg-brand-dark transition-colors"
      >
        Join SisterRoam now
      </Link>
      <Link
        href="/signup?role=host"
        className="inline-flex items-center justify-center px-6 py-3 rounded-[10px] border-2 border-brand text-brand font-medium text-sm hover:bg-brand hover:text-white transition-colors"
      >
        Become a host
      </Link>
    </div>
  )
}
