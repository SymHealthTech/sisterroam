'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'stay',      label: 'Stay' },
  { value: 'food',      label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'safety',    label: 'Safety' },
  { value: 'activity',  label: 'Activity' },
  { value: 'general',   label: 'General' },
]

function Input({ className, ...props }) {
  return (
    <input {...props} className={cn('w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition', className)} />
  )
}

export default function AskQuestionModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ city: '', country: '', category: '', question: '', context: '' })
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.city.trim())     { toast.error('City is required'); return }
    if (!form.country.trim())  { toast.error('Country is required'); return }
    if (!form.question.trim()) { toast.error('Question is required'); return }
    if (form.question.trim().length < 20) { toast.error('Question must be at least 20 characters'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/recommendations/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to post question'); return }
      toast.success('Question posted!')
      onCreated?.(data.data)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Ask a question</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-danger">*</span></label>
                <Input placeholder="Bangkok" value={form.city} onChange={e => set('city', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country <span className="text-danger">*</span></label>
                <Input placeholder="Thailand" value={form.country} onChange={e => set('country', e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category (optional)</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('category', form.category === value ? '' : value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs border transition-colors',
                      form.category === value
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
                <label className="text-sm font-medium text-gray-700">Your question <span className="text-danger">*</span></label>
                <span className="text-xs text-gray-400">{form.question.length}/500</span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                placeholder="What do you want to know? Be specific — good answers come from clear questions."
                value={form.question}
                onChange={e => set('question', e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition resize-none"
              />
              {form.question.length > 0 && form.question.length < 20 && (
                <p className="text-xs text-danger mt-1">At least 20 characters required</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">Context (optional)</label>
                <span className="text-xs text-gray-400">{form.context.length}/300</span>
              </div>
              <Input
                placeholder="Travelling in December, solo, budget backpacker..."
                value={form.context}
                onChange={e => set('context', e.target.value)}
                maxLength={300}
              />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Post question
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
