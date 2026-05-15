import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import authConfig from '@/auth.config'

const { auth } = NextAuth(authConfig)

const publicPaths = [
  '/', '/about', '/how-it-works', '/safety',
  '/pricing', '/browse', '/stories', '/blog',
  '/login', '/signup', '/forgot-password',
]

export default auth((request) => {
  const { pathname } = request.nextUrl
  const session = request.auth

  const isPublicPath = publicPaths.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  )
  const isApiPath       = pathname.startsWith('/api/')
  const isNextPath      = pathname.startsWith('/_next/')
  const isOnboardingPath = pathname.startsWith('/onboarding/')
  const isStaticFile    = /\.(png|jpg|svg|ico|webp|json)$/.test(pathname)
  const isWebhook       = pathname === '/api/payments/webhook'

  if (isNextPath || isStaticFile || isWebhook) {
    return NextResponse.next()
  }

  const isProtectedPath =
    pathname.startsWith('/feed') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/community') ||
    pathname.startsWith('/cotraveller') ||
    pathname.startsWith('/recommendations') ||
    pathname.startsWith('/request') ||
    pathname.startsWith('/admin')

  if (!session && isProtectedPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && !session.user.onboardingCompleted) {
    if (isOnboardingPath || isApiPath || isPublicPath) {
      return NextResponse.next()
    }

    const tier = session.user.verificationTier
    if (!tier || tier === 'basic') {
      return NextResponse.redirect(new URL('/onboarding/verify', request.url))
    }

    const step = session.user.onboardingStep || 2

    if (step <= 2) {
      return NextResponse.redirect(new URL('/onboarding/profile', request.url))
    }
    if (step === 3) {
      return NextResponse.redirect(new URL('/onboarding/role', request.url))
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!session?.user?.isAdmin) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  if (session && session.user.onboardingCompleted) {
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
