import Image from 'next/image'
import { cn, getInitials, generateAvatarColor } from '@/lib/utils'

const SIZES = {
  xs: { cls: 'w-6 h-6',   text: 'text-[9px] font-semibold',  px: 24  },
  sm: { cls: 'w-8 h-8',   text: 'text-[11px] font-semibold', px: 32  },
  md: { cls: 'w-11 h-11', text: 'text-sm font-semibold',     px: 44  },
  lg: { cls: 'w-16 h-16', text: 'text-lg font-semibold',     px: 64  },
  xl: { cls: 'w-20 h-20', text: 'text-2xl font-bold',        px: 80  },
}

export default function Avatar({ name, src, size = 'md', className }) {
  const { cls, text, px } = SIZES[size]
  const initials = getInitials(name)
  const color    = generateAvatarColor(name)

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden shrink-0 flex items-center justify-center select-none',
        cls,
        className
      )}
      style={!src ? { backgroundColor: color.bg, color: color.text } : undefined}
      aria-label={name ?? 'User avatar'}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? 'User avatar'}
          fill
          sizes={`${px}px`}
          className="object-cover"
        />
      ) : (
        <span className={text} aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  )
}
