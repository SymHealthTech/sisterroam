'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserSearch, Home, RefreshCw, Check, X, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

const ROLES = [
  {
    value:       'guest',
    icon:        UserSearch,
    title:       "I'm a Guest",
    description: 'I travel and want to stay with verified female hosts worldwide.',
  },
  {
    value:       'host',
    icon:        Home,
    title:       "I'm a Host",
    description: 'I want to open my home to female solo travellers passing through.',
  },
  {
    value:       'both',
    icon:        RefreshCw,
    title:       'I do both',
    description: 'I love hosting and travelling — I want to be part of both sides.',
  },
]

function RoleCard({ role, selected, onClick }) {
  const Icon = role.icon
  return (
    <button
      type="button"
      onClick={() => onClick(role.value)}
      className={cn(
        'w-full text-left p-5 rounded-2xl border-2 transition-all relative',
        selected
          ? 'border-brand bg-brand-lighter/30'
          : 'border-gray-100 hover:border-gray-200 bg-white',
      )}
    >
      {selected && (
        <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={3} aria-hidden="true" />
        </span>
      )}
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
        selected ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500',
      )}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <p className={cn('font-semibold text-base mb-1', selected ? 'text-brand' : 'text-gray-900')}>
        {role.title}
      </p>
      <p className="text-sm text-gray-500 leading-relaxed">{role.description}</p>
    </button>
  )
}

// Shown after Host or Both is selected — two equally accessible paths.
function HostModal({ onFree, onVerifyNow }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-lighter flex items-center justify-center">
              <Home className="w-6 h-6 text-brand" aria-hidden="true" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 leading-snug">
            Hosting requires identity verification
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            To keep the community safe, hosts verify their government ID and record a short selfie video. You can do this now or any time from your profile — joining is always free.
          </p>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-3">
          {/* Path B — verify now (visually prominent) */}
          <button
            type="button"
            onClick={onVerifyNow}
            className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-brand text-white hover:bg-brand-dark transition-colors"
          >
            <div className="text-left">
              <p className="font-semibold text-sm">Verify &amp; start hosting now</p>
              <p className="text-xs text-white/75 mt-0.5">Upload ID + selfie video, pay one-time fee</p>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>

          {/* Path A — join free, verify later */}
          <button
            type="button"
            onClick={onFree}
            className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 bg-white transition-colors"
          >
            <div className="text-left">
              <p className="font-semibold text-sm text-gray-900">Join free, become a host later</p>
              <p className="text-xs text-gray-400 mt-0.5">Browse the community now, verify when ready</p>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingRolePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [selected, setSelected]   = useState('')
  const [saving,   setSaving]     = useState(false)
  const [done,     setDone]       = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  async function saveRole(role) {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role, onboardingCompleted: true, onboardingStep: 3 }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to save. Please try again.')
        setSaving(false)
        return false
      }
      await update({ onboardingCompleted: true, role })
      return true
    } catch {
      toast.error('Network error. Please try again.')
      setSaving(false)
      return false
    }
  }

  async function handleComplete() {
    if (!selected) { toast.error('Please choose a role to continue'); return }

    if (selected === 'guest') {
      const ok = await saveRole('guest')
      if (ok) { setDone(true); router.push('/feed') }
      return
    }

    // Host or both — save role first, then show the informational modal
    const ok = await saveRole(selected)
    if (ok) setShowModal(true)
  }

  function handleFree() {
    setDone(true)
    router.push('/feed')
  }

  function handleVerifyNow() {
    setDone(true)
    router.push('/onboarding/verify')
  }

  if (status === 'loading' || status === 'unauthenticated' || done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <>
      {showModal && (
        <HostModal onFree={handleFree} onVerifyNow={handleVerifyNow} />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-brand">SisterRoam</span>
              <span className="text-pink" aria-hidden="true">♀</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Step 2 of 2</span>
              <div className="flex gap-1">
                {[1,2].map(s => (
                  <div key={s} className="w-5 h-1.5 rounded-full bg-brand" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">How will you use SisterRoam?</h1>
          <p className="text-sm text-gray-500 mb-8">
            You can always change this later in your settings.
          </p>

          <div className="space-y-4 mb-10">
            {ROLES.map(role => (
              <RoleCard
                key={role.value}
                role={role}
                selected={selected === role.value}
                onClick={setSelected}
              />
            ))}
          </div>

          <Button fullWidth loading={saving} disabled={!selected} onClick={handleComplete}>
            Complete setup
          </Button>
        </div>
      </div>
    </>
  )
}
