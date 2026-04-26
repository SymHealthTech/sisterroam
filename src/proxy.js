import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import authConfig from '@/auth.config'

// Use Edge-safe auth (no mongoose) for proxy/middleware
const { auth } = NextAuth(authConfig)

const protectedRoutes = ['/feed', '/messages', '/profile', '/community', '/safety', '/admin']
const adminRoutes     = ['/admin']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn  = !!req.auth
  const path        = nextUrl.pathname

  const isProtected  = protectedRoutes.some((r) => path.startsWith(r))
  const isAdminRoute = adminRoutes.some((r) => path.startsWith(r))

  if (isAdminRoute && (!isLoggedIn || !req.auth?.user?.isAdmin)) {
    return NextResponse.redirect(new URL('/', nextUrl))
  }

  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  if (
    isLoggedIn &&
    !req.auth?.user?.onboardingCompleted &&
    !path.startsWith('/onboarding') &&
    !path.startsWith('/login') &&
    !path.startsWith('/signup')
  ) {
    return NextResponse.redirect(new URL('/onboarding/role', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico|icons|manifest).*)'],
}
