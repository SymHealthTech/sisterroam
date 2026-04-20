import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, ShieldCheck } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

export default function HostCard({ host }) {
  const { user, location, accommodation, rating, reviewCount, safety } = host

  return (
    <Link href={`/explore/${host._id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-44 bg-gray-100">
        {host.photos?.[0] ? (
          <Image src={host.photos[0]} alt={host.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-lighter to-pink-lighter flex items-center justify-center">
            <span className="text-4xl">🏠</span>
          </div>
        )}
        {safety?.femaleOnlyGuests && (
          <div className="absolute top-2 left-2">
            <Badge variant="pink">♀ Women only</Badge>
          </div>
        )}
        {user?.verificationTier >= 2 && (
          <div className="absolute top-2 right-2">
            <Badge variant="teal"><ShieldCheck className="w-3 h-3 inline mr-1" />Verified</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{host.title}</h3>
            <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{location?.city}, {location?.country}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-amber text-amber" />
            <span className="font-semibold">{rating?.toFixed(1) || 'New'}</span>
            {reviewCount > 0 && <span className="text-gray-400 text-xs">({reviewCount})</span>}
          </div>
        </div>

        {accommodation?.amenities?.length > 0 && (
          <div className="flex gap-1 mt-3 flex-wrap">
            {accommodation.amenities.slice(0, 3).map(a => (
              <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
