'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserSearch, Home, RefreshCw, Check } from 'lucide-react'
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

export default function OnboardingRolePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [selected, setSelected] = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  async function handleComplete() {
    if (!selected) { toast.error('Please choose a role to continue'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role: selected, onboardingCompleted: true, onboardingStep: 3 }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to save. Please try again.')
        return
      }
      await update({ onboardingCompleted: true, role: selected })
      router.push('/onboarding/complete')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-brand">SisterRoam</span>
            <span className="text-pink" aria-hidden="true">♀</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Step 3 of 3</span>
            <div className="flex gap-1">
              {[1,2,3].map(s => (
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
  )
}
