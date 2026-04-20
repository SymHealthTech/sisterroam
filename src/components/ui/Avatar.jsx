import Image from 'next/image'
import { cn } from '@/lib/utils'

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

export default function Avatar({ src, name, size = 'md', className }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className={cn(
      'relative rounded-full bg-brand-lighter flex items-center justify-center font-semibold text-brand overflow-hidden shrink-0',
      sizes[size],
      className
    )}>
      {src ? (
        <Image src={src} alt={name || 'Avatar'} fill className="object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
