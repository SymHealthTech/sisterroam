'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MapPin, Globe, Star, Calendar, ExternalLink } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Skeleton from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS = {
  solo_traveller: 'Solo traveller',
  backpacker: 'Backpacker',
  cyclist: 'Cyclist',
  trekker: 'Trekker',
  runner: 'Runner',
  ultramarathon: 'Ultra runner',
  road_tripper: 'Road tripper',
  family_tourist: 'Family traveller',
}

function TagList({ items, labelMap }) {
  if (!items?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
          {labelMap ? (labelMap[item] ?? item) : item}
        </span>
      ))}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton variant="avatar" className="w-24 h-24" />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  )
}

export default function UserProfilePage({ params }) {
  const { userId } = use(params)
  useSession()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setUser(json.data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <AppLayout title="Profile">
        <ProfileSkeleton />
      </AppLayout>
    )
  }

  if (notFound || !user) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-base font-medium text-gray-700">Profile not found</p>
          <p className="text-sm text-gray-400 mt-1">This member may no longer be active.</p>
        </div>
      </AppLayout>
    )
  }

  const isHost = user.role === 'host' || user.role === 'both'
  const memberYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null
  const location = [user.city, user.country].filter(Boolean).join(', ')

  return (
    <AppLayout title={user.fullName ?? 'Profile'}>
      <div className="max-w-lg mx-auto px-4 pt-6 pb-12">

        {/* ── Hero ── */}
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <Avatar
            src={user.profilePhotoUrl}
            name={user.fullName}
            size="xl"
          />
          <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
          <Badge
            variant={
              user.verificationTier === 'trusted' ? 'trusted' :
              user.verificationTier === 'verified' ? 'verified' : 'basic'
            }
            size="md"
          >
            {user.verificationTier === 'trusted' ? 'Trusted member' :
             user.verificationTier === 'verified' ? 'Verified member' : 'Member'}
          </Badge>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {location}
              </span>
            )}
            {memberYear && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Since {memberYear}
              </span>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        {(user.totalStays > 0 || user.totalReviews > 0) && (
          <div className="flex justify-center gap-6 py-3 mb-6 border-y border-gray-100">
            {user.totalStays > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{user.totalStays}</p>
                <p className="text-xs text-gray-500">{user.totalStays === 1 ? 'Stay' : 'Stays'}</p>
              </div>
            )}
            {user.averageRating > 0 && (
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber text-amber" />
                  {user.averageRating.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">{user.totalReviews} {user.totalReviews === 1 ? 'review' : 'reviews'}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Bio ── */}
        {user.bio && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
          </div>
        )}

        {/* ── Journey details ── */}
        <div className="space-y-4 mb-6">
          {user.travellerCategories?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Traveller type</h2>
              <TagList items={user.travellerCategories} labelMap={CATEGORY_LABELS} />
            </div>
          )}

          {user.languages?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Languages</h2>
              <TagList items={user.languages} />
            </div>
          )}

          {user.hobbies?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Hobbies & interests</h2>
              <TagList items={user.hobbies} />
            </div>
          )}

          {user.countriesVisited?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Countries visited <span className="normal-case font-normal text-gray-500">({user.countriesVisited.length})</span>
              </h2>
              <TagList items={user.countriesVisited} />
            </div>
          )}
        </div>

        {/* ── Host listing CTA ── */}
        {isHost && (
          <Link
            href={`/explore/${userId}`}
            className="flex items-center justify-between w-full px-4 py-3.5 bg-brand-lighter border border-brand/20 rounded-xl hover:bg-brand/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-dark">View host listing</p>
                <p className="text-xs text-brand/70">See where she hosts travellers</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-brand/60" />
          </Link>
        )}
      </div>
    </AppLayout>
  )
}
