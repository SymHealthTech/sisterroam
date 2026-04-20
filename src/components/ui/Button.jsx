import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-brand text-white hover:bg-brand-dark active:scale-95',
  secondary: 'bg-pink text-white hover:bg-pink-dark active:scale-95',
  outline: 'border-2 border-brand text-brand hover:bg-brand-lighter active:scale-95',
  ghost: 'text-brand hover:bg-brand-lighter active:scale-95',
  danger: 'bg-danger text-white hover:bg-danger-dark active:scale-95',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  full: 'w-full px-4 py-3 text-base rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
