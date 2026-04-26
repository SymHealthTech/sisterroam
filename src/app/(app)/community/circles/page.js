'use client'

import { useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { cn } from '@/lib/utils'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CIRCLES = [
  {
    id: 'solo-backpackers',
    name: 'Solo Backpackers',
    emoji: '🎒',
    color: 'from-brand-lighter to-pink/10',
    desc: 'Budget travel, hostels, and backpacking tips for women going solo on a budget.',
    members: 1240,
    posts: 3420,
    tags: ['Budget Travel', 'Hostels', 'Backpacking'],
  },
  {
    id: 'cycling-sisters',
    name: 'Cycling Sisters',
    emoji: '🚴',
    color: 'from-teal/10 to-teal-lighter/30',
    desc: 'Long-distance bike touring routes, gear recommendations, and community meetups.',
    members: 890,
    posts: 1670,
    tags: ['Cycling', 'Bike Touring', 'Routes'],
  },
  {
    id: 'trail-runners',
    name: 'Trail Runners',
    emoji: '🏃',
    color: 'from-amber/10 to-amber-lighter/30',
    desc: 'Trail running routes, race planning, and finding running buddies while travelling.',
    members: 540,
    posts: 980,
    tags: ['Running', 'Trails', 'Races'],
  },
  {
    id: 'digital-nomads',
    name: 'Digital Nomads',
    emoji: '💻',
    color: 'from-pink/10 to-pink-lighter/20',
    desc: 'Remote work, visa tips, co-working spaces, and slow travel lifestyle.',
    members: 2100,
    posts: 5890,
    tags: ['Remote Work', 'Visas', 'Slow Travel'],
  },
  {
    id: 'culture-seekers',
    name: 'Culture Seekers',
    emoji: '🌍',
    color: 'from-brand-lighter/50 to-teal-lighter/20',
    desc: 'Local food, history, language learning, and deep cultural immersion.',
    members: 1560,
    posts: 4120,
    tags: ['Culture', 'Food', 'Language'],
  },
]

function CircleCard({ circle, isJoined, onToggle }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className={cn('h-24 bg-gradient-to-br flex items-center justify-center text-5xl', circle.color)}>
        {circle.emoji}
      </div>
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-bold text-gray-900">{circle.name}</h3>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">{circle.desc}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {circle.tags.map(t => (
            <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{t}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>{circle.members.toLocaleString()} members</span>
          </div>
          <button
            onClick={() => onToggle(circle.id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              isJoined
                ? 'bg-brand text-white hover:bg-brand-dark'
                : 'bg-brand-lighter text-brand hover:bg-brand hover:text-white',
            )}
          >
            {isJoined ? 'Joined ✓' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CirclesPage() {
  const [joined, setJoined] = useState(new Set())

  function toggleJoin(id) {
    setJoined(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <AppLayout title="Circles">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-10">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/community" className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Circles</h1>
            <p className="text-sm text-gray-500">Communities of sisters with shared interests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CIRCLES.map(c => (
            <CircleCard
              key={c.id}
              circle={c}
              isJoined={joined.has(c.id)}
              onToggle={toggleJoin}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
