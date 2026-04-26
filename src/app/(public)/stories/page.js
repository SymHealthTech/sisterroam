import PublicNavbar from '@/components/layout/PublicNavbar'
import PublicFooter from '@/components/layout/PublicFooter'
import StoriesClient from './StoriesClient'

export const metadata = {
  title: 'Travel Stories — Real Experiences from Female Solo Travellers — SisterRoam',
  description:
    'Read authentic travel stories from verified female solo travellers. Discover destinations, safety tips, and real experiences from the SisterRoam community.',
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
