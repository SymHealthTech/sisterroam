import NextAuth from 'next-auth'
import authConfig from '@/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((request) => {
  const { pathname } = request.nextUrl
  const session = request.auth

  const publicPaths = [
    '/', '/about', '/how-it-works', '/safety',
    '/pricing', '/browse', '/stories', '/blog',
    '/login', '/signup', '/forgot-password',
  ]

  const isPublicPath = publicPaths.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  )
  const isApiPath      = pathname.startsWith('/api/')
  const isNextPath     = pathname.startsWith('/_next/')
  const isOnboardingPath = pathname.startsWith('/onboarding/')
  const isStaticFile   = /\.(png|jpg|svg|ico|webp|json)$/.test(pathname)
  const isWebhook      = pathname === '/api/payments/webhook'

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

  // Not logged in trying to access protected path
  if (!session && isProtectedPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logged in user who has not completed onboarding
  if (session && !session.user.onboardingCompleted) {
    if (isOnboardingPath || isApiPath || isPublicPath) {
      return NextResponse.next()
    }

    const step = session.user.onboardingStep || 2

    if (step <= 2) {
      return NextResponse.redirect(
        new URL('/onboarding/profile', request.url)
      )
    }
    if (step === 3) {
      return NextResponse.redirect(
        new URL('/onboarding/role', request.url)
      )
    }
  }

  // Admin path protection
  if (pathname.startsWith('/admin')) {
    if (!session?.user?.isAdmin) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  // Logged-in user who completed onboarding trying to access auth pages
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
