'use client'

import { cn } from '@/lib/utils'

export default function Toggle({ checked, onChange, label, className }) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', className)}>
      <div
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-brand' : 'bg-gray-200'
        )}
        onClick={() => onChange(!checked)}
      >
        <div className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
          checked && 'translate-x-5'
        )} />
      </div>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}
