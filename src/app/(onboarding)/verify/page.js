'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/onboarding/verify') }, [router])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
