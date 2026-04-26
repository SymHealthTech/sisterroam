'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import AppLayout from '@/components/layout/AppLayout'
import {
  AlertTriangle, MessageSquare, User as UserIcon,
  Camera, Clock, Mail, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

/* ─── Reason definitions ─────────────────────────────────────── */

const REASONS = [
  {
    value: 'harassment',
    icon:  MessageSquare,
    title: 'Harassment',
    desc:  'Unwanted messages, pressure, or threatening behaviour',
  },
  {
    value: 'fake_profile',
    icon:  UserIcon,
    title: 'Fake profile',
    desc:  'Suspected impersonation or fraudulent identity',
  },
  {
    value: 'safety_incident',
    icon:  AlertTriangle,
    title: 'Safety incident',
    desc:  'A situation that made you feel physically unsafe',
  },
  {
    value: 'unwanted_contact',
    icon:  Mail,
    title: 'Unwanted contact',
    desc:  'Repeated contact after being asked to stop',
  },
  {
    value: 'discrimination',
    icon:  UserIcon,
    title: 'Discrimination',
    desc:  'Treated unfairly due to identity, background, or beliefs',
  },
  {
    value: 'other',
    icon:  Clock,
    title: 'Other',
    desc:  'Something else that concerns you',
  },
]

/* ─── Page ───────────────────────────────────────────────────── */

export default function SafetyReportPage() {
  const router                                   = useRouter()
  const [submitted, setSubmitted]               = useState(false)
  const [requestPartners, setRequestPartners]   = useState([])
  const [selectedReason,  setSelectedReason]    = useState('')
  const [reasonError,     setReasonError]       = useState(false)
  const [evidenceFile,    setEvidenceFile]       = useState(null)
  const [uploading,       setUploading]          = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  /* ── Load request partners for the "Who" autocomplete ── */
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/requests')
        const json = await res.json()
        if (!json.success) return

        // Build unique list of other-party users
        const seen = new Set()
        const partners = []
        for (const r of json.data ?? []) {
          const gId = r.guestId?._id?.toString() || r.guestId?.toString()
          const hId = r.hostId?._id?.toString()  || r.hostId?.toString()
          // We'll include both parties; the user will know which one they want to report
          for (const u of [r.guestId, r.hostId]) {
            const id = u?._id?.toString() || u?.toString()
            if (id && !seen.has(id)) {
              seen.add(id)
              if (u?.fullName) partners.push({ id, name: u.fullName })
            }
          }
        }
        setRequestPartners(partners)
      } catch {
        // silently ignore
      }
    }
    load()
  }, [])

  async function onSubmit(data) {
    if (!selectedReason) { setReasonError(true); return }
    setReasonError(false)

    let evidenceUrl = undefined

    // Upload evidence file if provided
    if (evidenceFile) {
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', evidenceFile)
        const sigRes  = await fetch('/api/upload/signature', { method: 'POST' })
        const sigJson = await sigRes.json()
        if (sigJson.signature) {
          const fd = new FormData()
          fd.append('file', evidenceFile)
          fd.append('api_key',   sigJson.apiKey)
          fd.append('timestamp', sigJson.timestamp)
          fd.append('signature', sigJson.signature)
          fd.append('folder',    sigJson.folder || 'safety-reports')
          const upRes  = await fetch(`https://api.cloudinary.com/v1_1/${sigJson.cloudName}/auto/upload`, {
            method: 'POST', body: fd,
          })
          const upJson = await upRes.json()
          evidenceUrl  = upJson.secure_url
        }
      } catch {
        // continue without evidence URL
      }
      setUploading(false)
    }

    const res  = await fetch('/api/safety/reports', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        reportedUserId:  data.reportedUserId,
        reason:          selectedReason,
        details:         data.details,
        incidentDate:    data.incidentDate || undefined,
        evidenceUrl,
        contactReporter: data.contactPreference === 'yes',
      }),
    })
    const json = await res.json()
    if (json.success) {
      setSubmitted(true)
    } else {
      toast.error(json.error || 'Could not submit report. Please try again.')
    }
  }

  /* ── Success state ── */
  if (submitted) {
    return (
      <AppLayout title="Report submitted">
        <div className="max-w-[480px] mx-auto px-4 py-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-teal-lighter flex items-center justify-center mb-5">
            <CheckCircle className="w-8 h-8 text-teal" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Report submitted</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-8">
            Thank you for keeping SisterRoam safe. Our safety team will review your report within
            24 hours and follow up if needed.
          </p>
          <button
            onClick={() => router.push('/safety')}
            className="px-6 py-2.5 bg-brand text-white text-sm font-medium rounded-xl
                       hover:opacity-90 transition-opacity"
          >
            Back to safety
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Safety Report">
      <div className="max-w-[640px] mx-auto px-4 py-6">

        {/* Confidentiality notice */}
        <div className="flex items-start gap-3 bg-danger-lighter rounded-xl p-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-danger-dark mb-0.5">Confidential report</p>
            <p className="text-xs text-danger-dark/80 leading-relaxed">
              Your report is reviewed only by the SisterRoam safety team. We never share your
              identity with the person you're reporting without your consent.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* Who */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Who are you reporting? *
            </label>
            {requestPartners.length > 0 ? (
              <select
                {...register('reportedUserId', { required: 'Please select a person' })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                           focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              >
                <option value="">Select a person from your requests…</option>
                {requestPartners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <input
                {...register('reportedUserId', { required: 'Please enter a name or user ID' })}
                placeholder="Person's name or user ID"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
              />
            )}
            {errors.reportedUserId && (
              <p className="mt-1 text-xs text-danger">{errors.reportedUserId.message}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Reason *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {REASONS.map(r => {
                const Icon = r.icon
                const selected = selectedReason === r.value
                return (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => { setSelectedReason(r.value); setReasonError(false) }}
                    className={cn(
                      'text-left p-3.5 rounded-xl border-2 transition-all',
                      selected
                        ? 'border-danger bg-danger-lighter'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn('w-4 h-4 shrink-0', selected ? 'text-danger' : 'text-gray-400')} />
                      <span className={cn('text-sm font-medium', selected ? 'text-danger-dark' : 'text-gray-800')}>
                        {r.title}
                      </span>
                    </div>
                    <p className={cn('text-xs leading-relaxed', selected ? 'text-danger-dark/70' : 'text-gray-400')}>
                      {r.desc}
                    </p>
                  </button>
                )
              })}
            </div>
            {reasonError && <p className="mt-1.5 text-xs text-danger">Please select a reason</p>}
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Details *</label>
            <textarea
              {...register('details', {
                required: 'Please describe what happened',
                minLength: { value: 20, message: 'Please provide at least 20 characters' },
              })}
              rows={5}
              placeholder="Describe what happened in as much detail as you're comfortable sharing…"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none
                         focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
            {errors.details && (
              <p className="mt-1 text-xs text-danger">{errors.details.message}</p>
            )}
          </div>

          {/* When */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              When did this happen? <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              {...register('incidentDate')}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Evidence <span className="text-gray-400 font-normal">(optional but helpful)</span>
            </label>
            <label
              className={cn(
                'flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
                evidenceFile ? 'border-brand bg-brand-lighter' : 'border-gray-200 hover:border-brand/50'
              )}
            >
              <Camera className={cn('w-5 h-5', evidenceFile ? 'text-brand' : 'text-gray-300')} />
              <span className="text-xs text-gray-500 text-center px-4">
                {evidenceFile
                  ? evidenceFile.name
                  : 'Tap to attach a screenshot or document (image or PDF, max 5 MB)'}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f && f.size > 5 * 1024 * 1024) {
                    toast.error('File must be under 5 MB')
                    return
                  }
                  setEvidenceFile(f || null)
                }}
              />
            </label>
          </div>

          {/* Contact preference */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Can we contact you about this report?
            </label>
            <div className="space-y-2">
              {[
                { value: 'yes', label: 'Yes — contact me at my email' },
                { value: 'no',  label: 'No — keep me anonymous' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    value={opt.value}
                    defaultChecked={opt.value === 'yes'}
                    {...register('contactPreference')}
                    className="accent-brand"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="w-full py-3.5 bg-danger text-white text-sm font-semibold rounded-xl
                       hover:opacity-90 disabled:opacity-60 transition-opacity active:scale-[0.98]"
          >
            {isSubmitting || uploading ? 'Submitting…' : 'Submit report'}
          </button>

        </form>
      </div>
    </AppLayout>
  )
}
