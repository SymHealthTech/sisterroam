'use client'

import { useState } from 'react'
import { X, ArrowRight, ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { COUNTRIES } from '@/lib/countries'
import toast from 'react-hot-toast'

const TRAVELLER_CATEGORIES = [
  { value: 'backpacker',     label: 'Backpacker' },
  { value: 'cyclist',        label: 'Cyclist' },
  { value: 'trekker',        label: 'Trekker' },
  { value: 'runner',         label: 'Runner' },
  { value: 'solo_traveller', label: 'Solo traveller' },
  { value: 'road_tripper',   label: 'Road tripper' },
  { value: 'family_tourist', label: 'Family traveller' },
  { value: 'ultramarathon',  label: 'Ultra runner' },
]

const TRIP_TYPES = [
  { value: 'one_way',    label: 'One way' },
  { value: 'round_trip', label: 'Round trip' },
  { value: 'open_ended', label: 'Open ended' },
]

const STEPS = ['Route', 'Dates', 'Details', 'Preferences', 'Preview']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
              i < current
                ? 'bg-brand text-white'
                : i === current
                ? 'bg-brand text-white ring-2 ring-brand/30'
                : 'bg-gray-100 text-gray-400'
            )}
          >
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('w-6 h-0.5', i < current ? 'bg-brand' : 'bg-gray-100')} />
          )}
        </div>
      ))}
    </div>
  )
}

function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}{required && <span className="text-danger ml-0.5">*</span>}
    </label>
  )
}

function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand transition',
        className
      )}
    />
  )
}

function Textarea({ className, ...props }) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand transition resize-none',
        className
      )}
    />
  )
}

function CountrySelect({ value, onChange, placeholder }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-brand focus:ring-0/30 focus:border-brand transition bg-white appearance-none"
    >
      <option value="">{placeholder ?? 'Select country'}</option>
      {COUNTRIES.map(c => (
        <option key={c.code} value={c.name}>{c.name}</option>
      ))}
    </select>
  )
}

const EMPTY_FORM = {
  fromCity: '', fromCountry: '', fromCountryCode: '',
  toCity: '', toCountry: '', toCountryCode: '',
  departureDate: '', returnDate: '', tripType: 'one_way',
  isFlexibleDates: false, durationDays: '',
  title: '', travelStyle: [], description: '', tags: '',
  maxCoTravellers: 1, verifiedOnly: true,
  minAge: '', maxAge: '', languages: '',
}

export default function PostTripModal({ onClose, onCreated }) {
  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleStyle(val) {
    setForm(f => ({
      ...f,
      travelStyle: f.travelStyle.includes(val)
        ? f.travelStyle.filter(s => s !== val)
        : [...f.travelStyle, val],
    }))
  }

  function minDepartureDate() {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const payload = {
        ...form,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        lookingFor: {
          verifiedOnly: form.verifiedOnly,
          minAge: form.minAge ? Number(form.minAge) : undefined,
          maxAge: form.maxAge ? Number(form.maxAge) : undefined,
          languages: form.languages ? form.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
        },
      }
      const res = await fetch('/api/cotraveller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to post trip')
        return
      }
      toast.success('Your trip post is live!')
      onCreated?.(data.data)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const canGoNext = [
    form.fromCity && form.fromCountry && form.toCity && form.toCountry,
    form.departureDate,
    form.title && form.description && form.description.length >= 50,
    true,
    true,
  ][step]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Post your trip</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <StepIndicator current={step} />

          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Where are you travelling?</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>From city</Label>
                  <Input placeholder="Delhi" value={form.fromCity} onChange={e => set('fromCity', e.target.value)} />
                </div>
                <div>
                  <Label required>From country</Label>
                  <CountrySelect
                    value={form.fromCountry}
                    placeholder="Select country"
                    onChange={e => {
                      const country = COUNTRIES.find(c => c.name === e.target.value)
                      setForm(f => ({ ...f, fromCountry: e.target.value, fromCountryCode: country?.code ?? '' }))
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-brand" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>To city</Label>
                  <Input placeholder="Leh" value={form.toCity} onChange={e => set('toCity', e.target.value)} />
                </div>
                <div>
                  <Label required>To country</Label>
                  <CountrySelect
                    value={form.toCountry}
                    placeholder="Select country"
                    onChange={e => {
                      const country = COUNTRIES.find(c => c.name === e.target.value)
                      setForm(f => ({ ...f, toCountry: e.target.value, toCountryCode: country?.code ?? '' }))
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">When are you going?</h3>
              <div>
                <Label required>Departure date</Label>
                <Input type="date" min={minDepartureDate()} value={form.departureDate} onChange={e => set('departureDate', e.target.value)} />
              </div>
              <div>
                <Label>Return date (optional)</Label>
                <Input type="date" min={form.departureDate || minDepartureDate()} value={form.returnDate} onChange={e => set('returnDate', e.target.value)} />
              </div>
              <div>
                <Label>Trip type</Label>
                <div className="flex gap-2">
                  {TRIP_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set('tripType', value)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-sm border transition-colors',
                        form.tripType === value
                          ? 'bg-brand text-white border-brand'
                          : 'border-gray-200 text-gray-600 hover:border-brand'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFlexibleDates} onChange={e => set('isFlexibleDates', e.target.checked)} className="w-4 h-4 rounded accent-brand" />
                <span className="text-sm text-gray-700">My dates are flexible</span>
              </label>
              <div>
                <Label>Approx duration (days, optional)</Label>
                <Input type="number" min="1" max="365" placeholder="e.g. 10" value={form.durationDays} onChange={e => set('durationDays', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Tell us about your trip</h3>
              <div>
                <Label required>Post title</Label>
                <Input
                  placeholder="e.g. Leh to Manali cycling trip — 10 days"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  maxLength={200}
                />
              </div>
              <div>
                <Label>Travel style</Label>
                <div className="flex flex-wrap gap-2">
                  {TRAVELLER_CATEGORIES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleStyle(value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs border transition-colors',
                        form.travelStyle.includes(value)
                          ? 'bg-brand text-white border-brand'
                          : 'border-gray-200 text-gray-600 hover:border-brand'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label required>Description</Label>
                  <span className="text-xs text-gray-400">{form.description.length}/1500</span>
                </div>
                <Textarea
                  rows={5}
                  maxLength={1500}
                  placeholder="Describe your trip plan, what kind of co-traveller you are looking for, accommodation plan, budget range..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
                {form.description.length > 0 && form.description.length < 50 && (
                  <p className="text-xs text-danger mt-1">At least 50 characters required</p>
                )}
              </div>
              <div>
                <Label>Tags (comma-separated, optional)</Label>
                <Input placeholder="budget, adventure, spiritual" value={form.tags} onChange={e => set('tags', e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Who are you looking for?</h3>
              <div>
                <Label>Max co-travellers</Label>
                <div className="flex items-center gap-3 mt-1">
                  <button type="button" onClick={() => set('maxCoTravellers', Math.max(1, form.maxCoTravellers - 1))} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:border-brand hover:text-brand transition-colors">−</button>
                  <span className="text-lg font-semibold text-gray-900 w-8 text-center">{form.maxCoTravellers}</span>
                  <button type="button" onClick={() => set('maxCoTravellers', Math.min(4, form.maxCoTravellers + 1))} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:border-brand hover:text-brand transition-colors">+</button>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl bg-teal-50 border border-teal-100 p-3">
                <div className="w-5 h-5 rounded-full bg-teal flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Verified members only</p>
                  <p className="text-xs text-gray-500">Only sisters who have completed ID verification can apply</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min age (optional)</Label>
                  <Input type="number" min="18" max="99" placeholder="18" value={form.minAge} onChange={e => set('minAge', e.target.value)} />
                </div>
                <div>
                  <Label>Max age (optional)</Label>
                  <Input type="number" min="18" max="99" placeholder="60" value={form.maxAge} onChange={e => set('maxAge', e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Preferred languages (optional)</Label>
                <Input placeholder="English, Hindi" value={form.languages} onChange={e => set('languages', e.target.value)} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800">Review your trip post</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Title</p>
                  <p className="font-medium text-gray-900">{form.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Route</p>
                  <p className="text-gray-700">{form.fromCity}, {form.fromCountry} → {form.toCity}, {form.toCountry}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Departure</p>
                  <p className="text-gray-700">{form.departureDate}{form.isFlexibleDates ? ' (flexible)' : ''}</p>
                </div>
                {form.travelStyle.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Travel style</p>
                    <div className="flex flex-wrap gap-1">
                      {form.travelStyle.map(s => (
                        <span key={s} className="text-xs bg-brand-lighter text-brand px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Spots available</p>
                  <p className="text-gray-700">{form.maxCoTravellers} co-traveller{form.maxCoTravellers !== 1 ? 's' : ''} · {form.verifiedOnly ? 'Verified only' : 'All members'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Your post will be visible to all logged-in members. Sisters will be able to express interest and you'll receive a notification.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            disabled={loading}
          >
            {step === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-1" />Back</>}
          </Button>

          {step < 4 ? (
            <Button
              variant="primary"
              size="sm"
              disabled={!canGoNext}
              onClick={() => setStep(s => s + 1)}
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={handleSubmit}
            >
              Post my trip
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
