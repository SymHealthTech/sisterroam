'use client'

import { useEffect } from 'react'
import { RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-5xl mb-6">🌩️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-500 text-center mb-8 max-w-xs">
        We hit an unexpected error. This has been logged — our team will look into it.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl font-medium text-sm hover:bg-brand-dark transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl font-medium text-sm hover:border-gray-300 transition-colors"
        >
          <Home className="w-4 h-4" />
          Go home
        </Link>
      </div>
    </div>
  )
}
