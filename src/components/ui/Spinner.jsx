import { cn } from '@/lib/utils'

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }
  return (
    <div className={cn(
      'border-2 border-brand border-t-transparent rounded-full animate-spin',
      sizes[size],
      className
    )} />
  )
}
