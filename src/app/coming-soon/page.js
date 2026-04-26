'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Globe, Heart } from 'lucide-react'

export default function ComingSoonPage() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [count,     setCount]     = useState(null)

  useEffect(() => {
    fetch('/api/early-signup')
      .then(r => r.json())
      .then(d => { if (d.success) setCount(d.data.count) })
      .catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/early-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await res.json()
      if (res.ok) {
        setSubmitted(true)
        setCount(d.data?.count ?? count)
      }
    } finally {
      setLoading(false)
    }
  }

  const FEATURES = [
    { icon: ShieldCheck, text: 'Verified women only — safety first' },
    { icon: Globe,       text: 'Free accommodation exchange worldwide' },
    { icon: Heart,       text: 'Community of solo sisters who get it' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-lighter via-white to-pink/10 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center mb-6 shadow-lg">
        <svg viewBox="0 0 32 32" className="w-9 h-9 fill-white" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="10" r="5.5" />
          <path d="M7 26c0-5 4-9 9-9s9 4 9 9" strokeWidth="0" />
        </svg>
      </div>

      {/* Brand name */}
      <h1 className="text-4xl font-bold text-brand mb-2 tracking-tight">SisterRoam</h1>
      <p className="text-lg text-gray-600 text-center mb-2 font-medium">
        The home exchange platform built for women who travel solo
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-lighter rounded-full text-amber text-sm font-medium mb-10">
        <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
        Launching soon
      </div>

      {/* Feature pills */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        {FEATURES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2.5 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700">
            <Icon className="w-4 h-4 text-brand shrink-0" />
            {text}
          </div>
        ))}
      </div>

      {/* Signup form */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-5 border border-gray-100">
        {!submitted ? (
          <>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Get early access</p>
              {count !== null && (
                <p className="text-sm text-brand font-medium mt-1">
                  Join {count.toLocaleString()} women already signed up
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand text-white rounded-2xl font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-60"
              >
                {loading ? 'Joining…' : 'Join the waitlist →'}
              </button>
            </form>
            <p className="text-xs text-gray-400 text-center">
              No spam, ever. We&apos;ll only email you when we launch.
            </p>
          </>
        ) : (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl">🎉</div>
            <p className="text-lg font-bold text-gray-900">You&apos;re on the list!</p>
            <p className="text-sm text-gray-500">
              We&apos;ll email you at <strong>{email}</strong> when SisterRoam launches.
            </p>
            {count !== null && (
              <p className="text-sm text-brand font-medium">
                You&apos;re among {count.toLocaleString()} early sisters 🌍
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-gray-400 text-center">
        SisterRoam © {new Date().getFullYear()} · Made with ❤️ for women who roam
      </p>
    </div>
  )
}
