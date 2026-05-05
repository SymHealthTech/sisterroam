import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const inputBase =
  'w-full h-[44px] sm:h-[40px] px-3 rounded-lg border bg-white text-sm text-gray-900 ' +
  'placeholder:text-gray-400 ' +
  'focus:outline-none focus:border-brand focus:ring-0 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const Input = forwardRef(function Input(
  { label, error, helper, type = 'text', required, name, id, className, ...props },
  ref
) {
  const inputId = id ?? name

  return (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-gray-600 mb-1"
        >
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        required={required}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
        }
        className={cn(inputBase, error ? 'border-danger' : 'border-gray-200', className)}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger mt-1" role="alert">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${inputId}-helper`} className="text-xs text-gray-500 mt-1">
          {helper}
        </p>
      )}
    </div>
  )
})

export default Input
