'use client'

import Link from 'next/link'
import { MapPin, Calendar, Globe } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
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

function TagPill({ children }) {
  return (
    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
      {children}
    </span>
  )
}

export default function TravelerProfileClient({ user }) {
  const location = [user.city, user.country].filter(Boolean).join(', ')
  const memberYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null

  return (
    <AppLayout title={user.fullName ?? 'Profile'}>
      <div className="max-w-xl mx-auto px-4 py-5 pb-12">

        {/* ── Profile header card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="h-20 bg-brand-lighter relative">
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <Avatar
                src={user.profilePhotoUrl}
                name={user.fullName}
                size="xl"
                className="ring-4 ring-white"
              />
            </div>
          </div>

          <div className="pt-12 pb-5 px-5 text-center space-y-2">
            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>

            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {user.verificationTier === 'trusted' && <Badge variant="trusted">Trusted</Badge>}
              {(user.verificationTier === 'verified' || user.verificationTier === 'trusted') && (
                <Badge variant="verified">✓ Verified</Badge>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 text-sm text-gray-500 flex-wrap">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {location}
                </span>
              )}
              {memberYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  Member since {memberYear}
                </span>
              )}
            </div>

            {user.travellerCategories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                {user.travellerCategories.map(cat => (
                  <span key={cat} className="text-xs bg-brand-lighter text-brand px-2.5 py-0.5 rounded-full">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Content sections ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-6">

          {user.languages?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Speaks</p>
              <div className="flex flex-wrap gap-1.5">
                {user.languages.map(l => <TagPill key={l}>{l}</TagPill>)}
              </div>
            </div>
          )}

          {user.bio && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About</p>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{user.bio}</p>
            </div>
          )}

          {user.countriesVisited?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Countries visited</p>
              <div className="flex gap-2 flex-wrap">
                {user.countriesVisited.map(c => (
                  <span key={c} className="text-sm bg-brand-lighter text-brand px-3 py-1 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}

          {user.hobbies?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Hobbies &amp; interests</p>
              <div className="flex flex-wrap gap-1.5">
                {user.hobbies.map(h => <TagPill key={h}>{h}</TagPill>)}
              </div>
            </div>
          )}

          {(user.instagramUrl || user.linkedinUrl) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Social</p>
              <div className="flex items-center gap-3 flex-wrap">
                {user.instagramUrl && (
                  <a href={user.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand transition-colors">
                    <Globe className="w-4 h-4" />
                    {user.instagramUrl.replace(/.*instagram\.com\//, '').replace(/\/$/, '') || 'Instagram'}
                  </a>
                )}
                {user.linkedinUrl && (
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand transition-colors">
                    <Globe className="w-4 h-4" />
                    {user.linkedinUrl.replace(/.*linkedin\.com\/(in\/)?/, '').replace(/\/$/, '') || 'LinkedIn'}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
