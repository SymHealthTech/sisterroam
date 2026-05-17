import { notFound, redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import HostProfile from '@/models/HostProfile'
import User from '@/models/User'

const BASE = process.env.NEXTAUTH_URL || 'https://sisterroam.com'

async function getHostByUsername(username) {
  try {
    await connectDB()
    const user = await User.findOne({ username }).select('_id fullName').lean()
    if (!user) return null
    const host = await HostProfile.findOne({ userId: user._id, isListingActive: true }).lean()
    if (!host) return null
    return { user, host }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { username } = await params
  const data = await getHostByUsername(username)
  if (!data) return { title: 'Host not found — SisterRoam' }

  const { user } = data
  return {
    title: `${user.fullName} — Verified Host on SisterRoam`,
    description: `View ${user.fullName}'s verified host profile on SisterRoam. Stay with verified women hosts worldwide in the safe female travel community.`,
    openGraph: {
      type: 'profile',
      url: `https://sisterroam.com/host/${username}`,
      siteName: 'SisterRoam',
      title: `${user.fullName} — Verified Host on SisterRoam`,
      description: `View ${user.fullName}'s verified host profile on SisterRoam.`,
      images: [{ url: '/sisterroam-og-image.png', width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `https://sisterroam.com/host/${username}`,
    },
  }
}

export default async function PublicHostProfilePage({ params }) {
  const { username } = await params
  const data = await getHostByUsername(username)

  if (!data) notFound()

  // Redirect to the authenticated host detail page so logged-in users get the full experience
  redirect(`/explore/${data.host._id.toString()}`)
}
