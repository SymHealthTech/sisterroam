import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const textareaBase =
  'w-full px-3 py-2.5 rounded-lg border bg-white text-sm text-gray-900 ' +
  'placeholder:text-gray-400 resize-none overflow-hidden ' +
  'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const Textarea = forwardRef(function Textarea(
  { label, error, helper, required, name, id, rows = 4, className, onInput, ...props },
  ref
) {
  const inputId = id ?? name

  function handleInput(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
    onInput?.(e)
  }

  return (
    <div className="flex flex-col">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-gray-600 mb-1">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        name={name}
        rows={rows}
        required={required}
        onInput={handleInput}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined
        }
        className={cn(textareaBase, error ? 'border-danger' : 'border-gray-200', className)}
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

export default Textarea
