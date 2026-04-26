import { notFound } from 'next/navigation'
import HostDetailClient from './HostDetailClient'

const BASE = process.env.NEXTAUTH_URL || 'http://localhost:3000'

async function fetchHost(hostId) {
  try {
    const res = await fetch(`${BASE}/api/hosts/${hostId}`, {
      next: { revalidate: 300 },
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { hostId } = await params
  const host = await fetchHost(hostId)
  if (!host) return { title: 'Host not found — SisterRoam' }

  const user = host.userId ?? host.user ?? {}
  const name = user.fullName ?? 'Host'
  const city = user.city ?? ''
  const country = user.country ?? ''
  const location = [city, country].filter(Boolean).join(', ')
  const type = host.accommodationType?.replace(/_/g, ' ') ?? ''
  const langs = (user.languages ?? []).slice(0, 3).join(', ')
  const rating = user.averageRating ?? 0
  const reviews = user.totalReviews ?? 0

  return {
    title: `${name} — Verified Female Host in ${location} — SisterRoam`,
    description: `${name} hosts female solo travellers in ${city}. ${type ? type.charAt(0).toUpperCase() + type.slice(1) + '.' : ''} ${langs ? `Speaks ${langs}.` : ''} ${rating > 0 ? `${rating.toFixed(1)}★ from ${reviews} stay${reviews !== 1 ? 's' : ''}.` : ''}`.trim(),
    openGraph: {
      type: 'profile',
      title: `${name} — SisterRoam Host`,
      description: `${name} is a verified SisterRoam host in ${location}.`,
      images: user.profilePhotoUrl ? [{ url: user.profilePhotoUrl }] : [],
    },
  }
}

export default async function HostDetailPage({ params }) {
  const { hostId } = await params
  const host = await fetchHost(hostId)
  if (!host) notFound()

  return <HostDetailClient host={host} />
}
