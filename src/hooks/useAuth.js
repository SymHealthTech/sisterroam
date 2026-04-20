'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth({ required = false } = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (required && status === 'unauthenticated') {
      router.push('/login')
    }
  }, [required, status, router])

  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    session,
  }
}
