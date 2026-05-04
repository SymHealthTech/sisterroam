import { notFound } from 'next/navigation'
import HostDetailClient from '@/app/(app)/explore/[hostId]/HostDetailClient'
import TravelerProfileClient from './TravelerProfileClient'

const BASE = process.env.NEXTAUTH_URL || 'http://localhost:3000'

async function fetchHostProfile(userId) {
  try {
    const res = await fetch(`${BASE}/api/hosts/${userId}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

async function fetchUser(userId) {
  try {
    const res = await fetch(`${BASE}/api/users/${userId}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export default async function UserProfilePage({ params }) {
  const { userId } = await params

  // If the user has a host profile, show the exact same full explore view
  const hostProfile = await fetchHostProfile(userId)
  if (hostProfile) {
    return <HostDetailClient host={hostProfile} />
  }

  // Traveler-only: show profile without hosting section
  const user = await fetchUser(userId)
  if (!user) return notFound()

  return <TravelerProfileClient user={user} />
}
