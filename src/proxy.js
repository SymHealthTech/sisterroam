import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import authConfig from '@/auth.config'
import { isSessionRevoked } from '@/lib/sessionRevocation'

const { auth } = NextAuth(authConfig)

const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token']

const publicPaths = [
  '/', '/about', '/how-it-works',
  '/pricing', '/browse', '/stories',
  '/login', '/signup', '/forgot-password',
]

const authProxy = auth(async (request) => {
  const { pathname } = request.nextUrl
  const isStatic =
    pathname.startsWith('/_next/') ||
    /\.(png|jpg|svg|ico|webp|json)$/.test(pathname) ||
    pathname === '/api/payments/webhook'
  if (isStatic) return NextResponse.next()

  // A session that signed in before her last password change is signed out:
  // treat the visitor as logged out and clear the stale cookie.
  let session = request.auth
  let revoked = false
  if (session?.user?.id && await isSessionRevoked(session.user.id, session.user.authAt)) {
    session = null
    revoked = true
  }
  const response = route(request, session)
  // Clear the stale cookie only on full page loads. A background request
  // (polling, prefetch) still in flight must not delete the fresh cookie the
  // settings page gets when it signs back in after a password change.
  if (revoked && request.headers.get('sec-fetch-dest') === 'document') {
    for (const base of SESSION_COOKIES) {
      for (const name of [base, `${base}.0`, `${base}.1`, `${base}.2`]) {
        response.cookies.set(name, '', { maxAge: 0, path: '/', secure: name.startsWith('__Secure-') })
      }
    }
  }
  return response
})

function route(request, session) {
  const { pathname } = request.nextUrl

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
    pathname.startsWith('/safety') ||
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
}

// The auth() wrapper re-issues ("rolls") the session cookie on EVERY request it
// sees — page prefetches, polling, SSE. When one of those is in flight while a
// member signs out, its response lands after the deletion and silently signs
// her back in. The proxy only needs to READ the session, so drop the session
// cookie it would set; the session still rolls via /api/auth/session.
export default async function proxy(request, event) {
  const response = await authProxy(request, event)
  if (!response?.headers) return response
  const cookies = response.headers.getSetCookie?.() ?? []
  // Drop the re-issued session cookie, but keep deletions (a revoked session).
  const isRefresh = (c) => /^(__Secure-)?authjs\.session-token[^=]*=[^;]/.test(c)
  if (!cookies.some(isRefresh)) return response
  response.headers.delete('set-cookie')
  for (const c of cookies) {
    if (!isRefresh(c)) response.headers.append('set-cookie', c)
  }
  return response
}

export const config = {
  // /api/auth/* is excluded: the auth() wrapper re-issues the session cookie on
  // every request it sees, and on /api/auth/signout (or a session update) that
  // refreshed cookie competes with the handler's own Set-Cookie — signing out
  // left the member signed in. Auth.js routes need no proxy logic anyway.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
