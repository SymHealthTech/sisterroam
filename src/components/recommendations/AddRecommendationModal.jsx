'use client'

import { useState } from 'react'
import { X, Bed, Utensils, Bus, Shield, Map, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'stay',      label: 'Stay',      icon: Bed,     hint: 'Name of hostel, guesthouse, or area' },
  { value: 'food',      label: 'Food',      icon: Utensils, hint: 'Restaurant or dish name' },
  { value: 'transport', label: 'Transport', icon: Bus,     hint: 'Transport route, app, or service name' },
  { value: 'safety',    label: 'Safety',    icon: Shield,  hint: 'Brief tip title' },
  { value: 'activity',  label: 'Activity',  icon: Map,     hint: 'Activity or attraction name' },
  { value: 'general',   label: 'General',   icon: Info,    hint: 'Any helpful tip title' },
]

const PRICE_RANGES = [
  { value: 'free',      label: 'Free' },
  { value: 'budget',    label: 'Budget ₹' },
  { value: 'mid_range', label: 'Mid ₹₹' },
  { value: 'splurge',   label: 'Splurge ₹₹₹' },
]

const EMPTY = {
  city: '', country: '',
  category: '',
  title: '', description: '',
  priceRange: '', approximatePrice: '',
  address: '', websiteUrl: '',
}

function Input({ className, ...props }) {
  return (
    <input {...props} className={cn('w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-0/30 transition', className)} />
  )
}

export default function AddRecommendationModal({ onClose, onCreated, onUpdated, initialRec }) {
  const isEditing = !!initialRec

  const [form, setForm] = useState(() => isEditing ? {
    city:             initialRec.city             ?? '',
    country:          initialRec.country          ?? '',
    category:         initialRec.category         ?? '',
    title:            initialRec.title            ?? '',
    description:      initialRec.description      ?? '',
    priceRange:       initialRec.priceRange        ?? '',
    approximatePrice: initialRec.approximatePrice  ?? '',
    address:          initialRec.address           ?? '',
    websiteUrl:       initialRec.websiteUrl        ?? '',
  } : EMPTY)

  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const showPrice = ['stay', 'food', 'activity'].includes(form.category)
  const cat = CATEGORIES.find(c => c.value === form.category)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.category)           { toast.error('Please select a category'); return }
    if (!form.title.trim())       { toast.error('Title is required'); return }
    if (!form.description.trim()) { toast.error('Description is required'); return }
    if (!form.city.trim())        { toast.error('City is required'); return }
    if (!form.country.trim())     { toast.error('Country is required'); return }

    setLoading(true)
    try {
      if (isEditing) {
        const body = {
          title:            form.title,
          description:      form.description,
          priceRange:       form.priceRange,
          approximatePrice: form.approximatePrice,
          address:          form.address,
          websiteUrl:       form.websiteUrl,
        }
        const res = await fetch(`/api/recommendations/${initialRec._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Failed to update recommendation'); return }
        toast.success('Recommendation updated!')
        onUpdated?.({ ...initialRec, ...data.data })
        onClose()
      } else {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Failed to add recommendation'); return }
        toast.success('Recommendation added!')
        onCreated?.(data.data)
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit recommendation' : 'Share a recommendation'}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-4">

            {/* City + Country */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-danger">*</span></label>
                <Input placeholder="Lisbon" value={form.city} onChange={e => set('city', e.target.value)} required disabled={isEditing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country <span className="text-danger">*</span></label>
                <Input placeholder="Portugal" value={form.country} onChange={e => set('country', e.target.value)} required disabled={isEditing} />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-danger">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => !isEditing && set('category', value)}
                    disabled={isEditing}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-colors',
                      form.category === value
                        ? 'bg-brand text-white border-brand'
                        : 'border-gray-200 text-gray-600 hover:border-brand',
                      isEditing && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-danger">*</span>
              </label>
              <Input
                placeholder={cat?.hint ?? 'What are you recommending?'}
                value={form.title}
                onChange={e => set('title', e.target.value)}
                maxLength={150}
                required
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Description <span className="text-danger">*</span></label>
                <span className="text-xs text-gray-400">{form.description.length}/1000</span>
              </div>
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Share all the helpful details — price, location, what makes it special, tips for getting there..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-0/30 transition resize-none"
              />
            </div>

            {/* Price (for stay/food/activity) */}
            {showPrice && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price range</label>
                  <div className="flex gap-2 flex-wrap">
                    {PRICE_RANGES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set('priceRange', form.priceRange === value ? '' : value)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs border transition-colors',
                          form.priceRange === value
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Approximate price (optional)</label>
                  <Input placeholder="e.g. ₹400/night or $8/meal" value={form.approximatePrice} onChange={e => set('approximatePrice', e.target.value)} maxLength={50} />
                </div>
              </div>
            )}

            {/* Address + Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address (optional)</label>
              <Input placeholder="Street or area name" value={form.address} onChange={e => set('address', e.target.value)} maxLength={300} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website (optional)</label>
              <Input type="text" placeholder="example.com" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} />
              <p className="mt-1 text-xs text-gray-400">Please enter a URL</p>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              {isEditing ? 'Save changes' : 'Add recommendation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
