'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm, Controller } from 'react-hook-form'
import { Shield, Users, Home, Star, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import VerificationGate from '@/components/ui/VerificationGate'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Skeleton from '@/components/ui/Skeleton'
import { cn, nightsBetween } from '@/lib/utils'

const ROOM_LABELS = {
  private_room: 'Private room',
  shared_room: 'Shared room',
  couch: 'Couch',
  floor_space: 'Floor space',
  tent_space: 'Tent space',
}

const RELATIONSHIP_OPTIONS = ['Mother', 'Father', 'Sister', 'Brother', 'Friend', 'Partner', 'Other']

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function sixMonthsOut() {
  const d = new Date()
  d.setMonth(d.getMonth() + 6)
  return d.toISOString().split('T')[0]
}

function dayAfter(dateStr) {
  if (!dateStr) return tomorrow()
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

/* ── Host summary card ───────────────────────────────────── */

function HostSummaryCard({ host }) {
  const user = host.userId ?? host.user ?? {}
  const rating = user.averageRating ?? 0
  const reviews = user.totalReviews ?? 0

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
      <Avatar src={user.profilePhotoUrl} name={user.fullName} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{user.fullName}</span>
          {(user.verificationTier === 'verified' || user.verificationTier === 'trusted') && (
            <Badge variant="verified" size="sm">✓ Verified</Badge>
          )}
        </div>
        {(user.city || user.country) && (
          <p className="text-xs text-gray-500 mt-0.5">
            {[user.city, user.country].filter(Boolean).join(', ')}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {host.accommodationType && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Home className="w-3 h-3" />
              {ROOM_LABELS[host.accommodationType] ?? host.accommodationType}
            </span>
          )}
          {rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Star className="w-3 h-3 fill-amber text-amber" />
              {rating.toFixed(1)} ({reviews})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Page skeleton ───────────────────────────────────────── */

function PageSkeleton() {
  return (
    <div className="space-y-5 max-w-xl mx-auto px-4 py-6">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-[10px]" />
    </div>
  )
}

/* ── Emergency contact inline form ───────────────────────── */

function EmergencyContactForm({ register, errors, watch }) {
  return (
    <div className="space-y-3 pt-2">
      <Input
        label="Full name"
        required
        {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
        error={errors.emergencyContactName?.message}
        placeholder="Contact's full name"
      />
      <Input
        label="Phone number"
        required
        type="tel"
        {...register('emergencyContactPhone', {
          required: 'Phone number is required',
          pattern: { value: /^\+[1-9]\d{6,14}$/, message: 'Include country code, e.g. +91...' },
        })}
        error={errors.emergencyContactPhone?.message}
        placeholder="+91 98765 43210"
      />
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 mb-1">
          Relationship <span className="text-danger ml-0.5">*</span>
        </label>
        <select
          {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
          className={cn(
            'w-full h-[44px] sm:h-[40px] px-3 rounded-lg border bg-white text-sm text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors',
            errors.emergencyContactRelationship ? 'border-danger' : 'border-gray-200'
          )}
        >
          <option value="">Select relationship</option>
          {RELATIONSHIP_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {errors.emergencyContactRelationship && (
          <p className="text-xs text-danger mt-1">{errors.emergencyContactRelationship.message}</p>
        )}
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */

export default function RequestPage() {
  const router = useRouter()
  const { hostId } = useParams()
  const { data: session } = useSession()
  const isVerified = session?.user?.verificationTier && session.user.verificationTier !== 'basic'

  const [host, setHost] = useState(null)
  const [hostLoading, setHostLoading] = useState(true)
  const [hostNotFound, setHostNotFound] = useState(false)

  const [hasExistingEC, setHasExistingEC] = useState(false)
  const [editingEC, setEditingEC] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      checkInDate: '',
      checkOutDate: '',
      message: '',
      specialNotes: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      safetyAcknowledged: false,
    },
  })

  const checkIn = watch('checkInDate')
  const checkOut = watch('checkOutDate')
  const message = watch('message')
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0

  /* Load host */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/hosts/${hostId}`)
        if (res.status === 404) { setHostNotFound(true); return }
        if (!res.ok) throw new Error()
        const json = await res.json()
        setHost(json.data)
      } catch {
        setHostNotFound(true)
      } finally {
        setHostLoading(false)
      }
    }
    load()
  }, [hostId])

  /* Load current user's emergency contact */
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/users')
        if (!res.ok) return
        const json = await res.json()
        const u = json.data ?? {}
        if (u.emergencyContactName) {
          setHasExistingEC(true)
          setValue('emergencyContactName', u.emergencyContactName)
          setValue('emergencyContactPhone', u.emergencyContactPhone ?? '')
          setValue('emergencyContactRelationship', u.emergencyContactRelationship ?? '')
        }
      } catch { /* silent */ }
    }
    loadProfile()
  }, [setValue])

  async function onSubmit(data) {
    setSubmitError('')
    try {
      const body = {
        hostId,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        message: data.message + (data.specialNotes ? `\n\n[Special notes]\n${data.specialNotes}` : ''),
        safetyAcknowledged: data.safetyAcknowledged,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelationship: data.emergencyContactRelationship,
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        setSubmitError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      router.push(`/messages/${json.data._id}?sent=1`)
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    }
  }

  const hostUser = host ? (host.userId ?? host.user ?? {}) : {}
  const firstName = hostUser.fullName?.split(' ')[0] ?? 'your host'

  if (hostLoading) {
    return (
      <AppLayout title="Request a stay">
        <PageSkeleton />
      </AppLayout>
    )
  }

  if (hostNotFound) {
    return (
      <AppLayout title="Host not found">
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Host not found</h2>
          <p className="text-sm text-gray-500">This host profile doesn&apos;t exist or has been removed.</p>
          <Button href="/explore" variant="secondary">Browse hosts</Button>
        </div>
      </AppLayout>
    )
  }

  if (!isVerified) {
    return (
      <AppLayout title="Request a stay">
        <VerificationGate mode="page" />
      </AppLayout>
    )
  }

  return (
    <AppLayout title={`Request a stay with ${firstName}`}>
      <div className="max-w-xl mx-auto px-4 py-5 pb-24 space-y-6">

        {/* Host summary */}
        <HostSummaryCard host={host} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Travel dates */}
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-gray-900">Travel dates</h2>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Check-in"
                  type="date"
                  required
                  min={tomorrow()}
                  max={sixMonthsOut()}
                  {...register('checkInDate', { required: 'Check-in date is required' })}
                  error={errors.checkInDate?.message}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Check-out"
                  type="date"
                  required
                  min={dayAfter(checkIn)}
                  max={sixMonthsOut()}
                  {...register('checkOutDate', {
                    required: 'Check-out date is required',
                    validate: (v) => !checkIn || v > checkIn || 'Check-out must be after check-in',
                  })}
                  error={errors.checkOutDate?.message}
                />
              </div>
            </div>
            {nights > 0 && (
              <p className="text-xs text-gray-500 pt-1">
                {nights} night{nights !== 1 ? 's' : ''}
              </p>
            )}
            {nights > 7 && (
              <div className="flex items-start gap-2 bg-amber-lighter border border-amber rounded-lg px-3 py-2 mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-dark shrink-0 mt-0.5" />
                <p className="text-xs text-amber-dark">
                  Most hosts prefer stays under 7 nights. Check {firstName}&apos;s house rules before requesting.
                </p>
              </div>
            )}
          </div>

          {/* Introduction */}
          <div className="space-y-1.5">
            <label htmlFor="message" className="text-sm font-semibold text-gray-900 block">
              Introduce yourself to {firstName} <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <textarea
                id="message"
                {...register('message', {
                  required: 'Please write an introduction',
                  minLength: { value: 80, message: 'Please write at least 80 characters' },
                  maxLength: { value: 800, message: 'Maximum 800 characters' },
                })}
                rows={5}
                maxLength={800}
                placeholder={`Tell ${firstName} a bit about yourself, why you chose her profile, and what you're looking forward to...`}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg border bg-white text-sm text-gray-900 placeholder:text-gray-400 resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors',
                  errors.message ? 'border-danger' : 'border-gray-200'
                )}
              />
              <span className="absolute bottom-2 right-3 text-[11px] text-gray-400">
                {message.length}/800
              </span>
            </div>
            {errors.message ? (
              <p className="text-xs text-danger">{errors.message.message}</p>
            ) : (
              <p className={cn('text-xs', message.length < 80 && message.length > 0 ? 'text-danger' : 'text-gray-500')}>
                {message.length < 80
                  ? `${80 - message.length} more characters needed`
                  : 'Personalised messages get 3× more responses. Mention why you chose her profile specifically.'}
              </p>
            )}
          </div>

          {/* Emergency contact */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold text-gray-900">Emergency contact</h2>
            </div>

            {hasExistingEC && !editingEC ? (
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-700 font-medium">{watch('emergencyContactName')}</p>
                  <p className="text-xs text-gray-500">
                    {watch('emergencyContactRelationship')} · {watch('emergencyContactPhone')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingEC(true)}
                  className="text-xs text-brand hover:text-brand-dark font-medium shrink-0"
                >
                  Edit
                </button>
              </div>
            ) : (
              <EmergencyContactForm register={register} errors={errors} watch={watch} />
            )}

            <p className="text-xs text-gray-400">This contact is only reached in a genuine emergency.</p>
          </div>

          {/* Special notes (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Add special notes (optional)
            </button>
            {showNotes && (
              <div className="mt-3">
                <textarea
                  {...register('specialNotes')}
                  rows={3}
                  placeholder="Dietary requirements, accessibility needs, anything else..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors"
                />
              </div>
            )}
          </div>

          {/* Safety acknowledgement */}
          <div className="bg-brand-lighter rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Controller
                name="safetyAcknowledged"
                control={control}
                rules={{ validate: (v) => v === true || 'You must acknowledge the safety check-in policy' }}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-brand shrink-0"
                  />
                )}
              />
              <span className="text-xs text-gray-700 leading-relaxed">
                I understand that SisterRoam will send automatic safety check-in messages during my stay.
                If I miss two check-ins, my emergency contact will be notified.
              </span>
            </label>
            {errors.safetyAcknowledged && (
              <p className="text-xs text-danger mt-2">{errors.safetyAcknowledged.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="space-y-3">
            {submitError && (
              <div className="bg-danger-lighter border border-danger rounded-lg px-4 py-3">
                <p className="text-sm text-danger">{submitError}</p>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              Send request to {firstName}
            </Button>

            <p className="text-xs text-center text-gray-400">
              Your request expires in 72 hours if {firstName} does not respond.
            </p>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
