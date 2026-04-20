import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Textarea = forwardRef(function Textarea({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900',
          'placeholder:text-gray-400 text-sm resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          'transition-shadow duration-150',
          error && 'border-danger focus:ring-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})

export default Textarea
