import PublicNavbar from '@/components/layout/PublicNavbar'
import PublicFooter from '@/components/layout/PublicFooter'
import StoriesClient from './StoriesClient'

export const metadata = {
  title: 'Travel Stories — Real Experiences from Female Solo Travellers — SisterRoam',
  description:
    'Read authentic travel stories from verified female solo travellers. Discover destinations, safety tips, and real experiences from the SisterRoam women travel community.',
  openGraph: {
    type: 'website',
    url: 'https://sisterroam.com/stories',
    siteName: 'SisterRoam',
    title: 'Travel Stories — Real Experiences from Female Solo Travellers',
    description:
      'Authentic travel stories from verified female solo travellers. Safety tips, destinations, and real experiences from the SisterRoam community.',
    images: [{ url: '/sisterroam-og-image.png', width: 1200, height: 630, alt: 'SisterRoam Travel Stories' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Stories — Real Experiences from Female Solo Travellers',
    description: 'Authentic travel stories from verified female solo travellers on SisterRoam.',
    images: ['/sisterroam-og-image.png'],
  },
  alternates: {
    canonical: 'https://sisterroam.com/stories',
  },
}

export default function StoriesPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gray-50">
        <StoriesClient />
      </main>
      <PublicFooter />
    </>
  )
}
