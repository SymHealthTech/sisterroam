'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import Toggle from '@/components/ui/Toggle'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Skeleton from '@/components/ui/Skeleton'
import {
  BedDouble, Users, Sofa, Moon, Tent,
  Coffee, UtensilsCrossed, Map, Car, Shirt,
  Wifi, Bike, Bed,
  Plus, Trash2, Lock, X, ChevronDown, ChevronRight,
} from 'lucide-react'

/* ── Static data ─────────────────────────────────────────── */

const ACCOMMODATION_TYPES = [
  { value: 'private_room', label: 'Private room',  icon: BedDouble },
  { value: 'shared_room',  label: 'Shared room',   icon: Users     },
  { value: 'couch',        label: 'Couch',          icon: Sofa      },
  { value: 'floor_space',  label: 'Floor space',   icon: Moon      },
  { value: 'tent_space',   label: 'Tent space',    icon: Tent      },
]

const FREE_OFFERINGS = [
  { value: 'bed',           label: 'Bed / sleeping', icon: Bed            },
  { value: 'breakfast',     label: 'Breakfast',      icon: Coffee         },
  { value: 'dinner',        label: 'Home dinner',    icon: UtensilsCrossed},
  { value: 'city_guide',    label: 'City tour',      icon: Map            },
  { value: 'airport_pickup',label: 'Airport pickup', icon: Car            },
  { value: 'laundry',       label: 'Laundry',        icon: Shirt          },
  { value: 'wifi',          label: 'Wi-Fi',           icon: Wifi           },
  { value: 'bicycle',       label: 'Bicycle',        icon: Bike           },
]

const COMMON_LANGUAGES = [
  'English','Hindi','Spanish','French','Arabic','Portuguese','Bengali','Russian',
  'Urdu','Indonesian','German','Japanese','Mandarin','Turkish','Korean','Italian',
]

const DURATION_OPTIONS = [
  { value: 'per_hour', label: 'Per hour' },
  { value: 'per_day',  label: 'Per day'  },
  { value: 'fixed',    label: 'Fixed price' },
]

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
]

/* ── Number stepper ──────────────────────────────────────── */

function Stepper({ value, onChange, min = 1, max = 6 }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 font-bold hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="text-xl font-bold text-gray-900 w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 font-bold hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}

/* ── Tag input for languages ─────────────────────────────── */

function TagInput({ tags, onChange, suggestions = [], placeholder }) {
  const [inputVal, setInputVal] = useState('')
  const [showSugg, setShowSugg] = useState(false)
  const filtered = suggestions
    .filter(s => s.toLowerCase().startsWith(inputVal.toLowerCase()) && !tags.includes(s))
    .slice(0, 5)

  function addTag(tag) {
    const t = tag.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInputVal(''); setShowSugg(false)
  }
  function removeTag(tag) { onChange(tags.filter(t => t !== tag)) }
  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (inputVal.trim()) addTag(inputVal) }
    else if (e.key === 'Backspace' && !inputVal && tags.length > 0) removeTag(tags[tags.length - 1])
  }

  return (
    <div>
      <div className="min-h-[44px] flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent transition-colors">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 bg-brand-lighter text-brand text-xs px-2.5 py-1 rounded-full font-medium">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="text-brand/60 hover:text-brand" aria-label={`Remove ${t}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input value={inputVal}
          onChange={e => { setInputVal(e.target.value); setShowSugg(true) }}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSugg(true)}
          onBlur={() => setTimeout(() => setShowSugg(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm outline-none placeholder:text-gray-400 bg-transparent py-0.5"
        />
      </div>
      {showSugg && filtered.length > 0 && (
        <div className="mt-1 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden z-10 relative">
          {filtered.map(s => (
            <button key={s} type="button" onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">{s}</button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-400 mt-1">Press Enter or comma to add</p>
    </div>
  )
}

/* ── Section wrapper ─────────────────────────────────────── */

function Section({ title, description, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      {title && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

/* ── Paid service form ───────────────────────────────────── */

function AddServiceForm({ onAdd, onCancel }) {
  const [name,     setName]     = useState('')
  const [desc,     setDesc]     = useState('')
  const [price,    setPrice]    = useState('')
  const [currency, setCurrency] = useState('INR')
  const [duration, setDuration] = useState('per_hour')

  function handleAdd() {
    if (!name.trim() || !price) { toast.error('Name and price are required'); return }
    onAdd({ name: name.trim(), description: desc.trim(), price: Number(price), currency, duration })
  }

  return (
    <div className="border border-brand/20 bg-brand-lighter/20 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-brand">New paid service</p>
      <Input label="Service name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cooking class" required />
      <Input label="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description…" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min={0} />
        <Select label="Currency" value={currency} onChange={e => setCurrency(e.target.value)} options={CURRENCY_OPTIONS} />
      </div>
      <Select label="Duration" value={duration} onChange={e => setDuration(e.target.value)} options={DURATION_OPTIONS} />
      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="flex-1" onClick={handleAdd}>Add service</Button>
      </div>
    </div>
  )
}

/* ── Main page ────────────────────────────────────────────── */

export default function HostListingPage() {
  const { data: session } = useSession()

  const [loading,          setLoading]          = useState(true)
  const [saving,           setSaving]           = useState(false)
  const [hostId,           setHostId]           = useState(null) // null = create mode

  const [accommodationType, setAccommodationType] = useState('')
  const [maxGuests,          setMaxGuests]         = useState(1)
  const [freeOfferings,      setFreeOfferings]     = useState([])
  const [houseRules,         setHouseRules]        = useState('')
  const [languagesForGuests, setLanguagesForGuests]= useState([])
  const [femaleOnly,         setFemaleOnly]        = useState(false)
  const [isAcceptingGuests,  setIsAcceptingGuests] = useState(true)
  const [isListingActive,    setIsListingActive]   = useState(true)
  const [paidServices,       setPaidServices]      = useState([])
  const [showAddService,     setShowAddService]    = useState(false)

  const tier = session?.user?.verificationTier ?? 'basic'
  const canAddPaidServices = tier === 'verified' || tier === 'trusted'

  useEffect(() => {
    fetch('/api/hosts/mine')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const h = d.data
          setHostId(h._id)
          setAccommodationType(h.accommodationType ?? '')
          setMaxGuests(h.maxGuests ?? 1)
          setFreeOfferings(h.freeOfferings ?? [])
          setHouseRules(h.houseRules ?? '')
          setLanguagesForGuests(h.languagesForGuests ?? [])
          setFemaleOnly(h.femaleOnly ?? false)
          setIsAcceptingGuests(h.isAcceptingGuests ?? true)
          setIsListingActive(h.isListingActive ?? true)
          setPaidServices(h.paidServices ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function toggleOffering(val) {
    setFreeOfferings(prev => prev.includes(val) ? prev.filter(o => o !== val) : [...prev, val])
  }

  function addService(service) {
    setPaidServices(prev => [...prev, service])
    setShowAddService(false)
  }

  function removeService(idx) {
    setPaidServices(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!accommodationType) { toast.error('Please select an accommodation type'); return }
    setSaving(true)
    try {
      const payload = {
        accommodationType, maxGuests, freeOfferings,
        houseRules:        houseRules || undefined,
        languagesForGuests,
        femaleOnly, isAcceptingGuests, isListingActive,
        paidServices,
      }

      let res
      if (hostId) {
        res = await fetch(`/api/hosts/${hostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/hosts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return }
      if (!hostId) setHostId(data.data._id)
      toast.success('Your host listing has been saved!')
    } catch {
      toast.error('Network error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Host Listing">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} variant="card" className="h-48" />)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title={hostId ? 'Edit Host Listing' : 'Create Host Listing'}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-4">

        {/* Accommodation type */}
        <Section title="Accommodation type" description="What kind of space will you offer guests?">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACCOMMODATION_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccommodationType(value)}
                className={cn(
                  'flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all text-sm font-medium',
                  accommodationType === value
                    ? 'border-brand bg-brand-lighter text-brand'
                    : 'border-gray-100 hover:border-gray-200 text-gray-600'
                )}
              >
                <Icon className="w-6 h-6" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* Max guests */}
        <Section title="Maximum guests" description="How many guests can you accommodate at once?">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">Max guests at once</p>
            <Stepper value={maxGuests} onChange={setMaxGuests} min={1} max={6} />
          </div>
        </Section>

        {/* Free offerings */}
        <Section title="Free offerings" description="What do you provide at no extra charge?">
          <div className="grid grid-cols-2 gap-2">
            {FREE_OFFERINGS.map(({ value, label, icon: Icon }) => {
              const selected = freeOfferings.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleOffering(value)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left',
                    selected
                      ? 'border-teal bg-teal-lighter text-teal-dark'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              )
            })}
          </div>
        </Section>

        {/* House rules */}
        <Section title="House rules" description="Let guests know what to expect.">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Optional</span>
              <span className={cn('text-[11px]', houseRules.length > 900 ? 'text-amber' : 'text-gray-400')}>
                {houseRules.length}/1000
              </span>
            </div>
            <Textarea
              value={houseRules}
              onChange={e => setHouseRules(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="e.g. No smoking indoors, quiet after 10pm, please remove shoes at the door…"
            />
          </div>
        </Section>

        {/* Languages */}
        <Section title="Languages for guests" description="Languages you can communicate with guests in.">
          <TagInput
            tags={languagesForGuests}
            onChange={setLanguagesForGuests}
            suggestions={COMMON_LANGUAGES}
            placeholder="Type a language and press Enter…"
          />
        </Section>

        {/* Toggles */}
        <Section title="Listing settings">
          <Toggle
            checked={femaleOnly}
            onChange={setFemaleOnly}
            label="Female guests only"
            description="Only female-identifying verified members can send you stay requests"
          />
          <div className="border-t border-gray-100" />
          <div className="text-xs text-gray-400 -mt-2 pb-2">
            All SisterRoam members are verified, but this filter ensures only female members see your listing in the female-only filter.
          </div>
          <Toggle
            checked={isAcceptingGuests}
            onChange={setIsAcceptingGuests}
            label="Currently accepting guests"
            description="Turn off to temporarily pause new requests"
          />
          <div className="border-t border-gray-100" />
          <Toggle
            checked={isListingActive}
            onChange={setIsListingActive}
            label="Show in search results"
            description="Turn off to completely hide your listing from browse"
          />
        </Section>

        {/* Paid services */}
        <Section
          title="Paid services"
          description="Offer experiences or services to your guests for a fee."
        >
          {!canAddPaidServices ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Lock className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Verification required</p>
                <p className="text-xs text-gray-500 mt-0.5">Complete verification to add paid services</p>
                <Button href="/profile/verification" size="sm" variant="secondary" className="mt-2">
                  Get verified
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Existing services */}
              {paidServices.map((svc, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                    {svc.description && <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>}
                    <p className="text-xs text-brand font-semibold mt-1">
                      {svc.currency === 'INR' ? '₹' : '$'}{svc.price}
                      {' · '}{svc.duration?.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeService(idx)}
                    className="p-1.5 text-gray-400 hover:text-danger rounded-lg hover:bg-danger-lighter transition-colors"
                    aria-label="Remove service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add service form or button */}
              {showAddService ? (
                <AddServiceForm onAdd={addService} onCancel={() => setShowAddService(false)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddService(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-brand hover:text-brand transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add a paid service
                </button>
              )}
            </div>
          )}
        </Section>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-10">
        <div className="max-w-2xl mx-auto">
          <Button fullWidth loading={saving} onClick={handleSave}>
            {hostId ? 'Save listing' : 'Create listing'}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
