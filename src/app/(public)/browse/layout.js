export const metadata = {
  title: 'Browse Verified Hosts — Women Travel Community — SisterRoam',
  description:
    'Find verified women hosts worldwide. Browse by city, country, and travel style. Join the safe female travel community — free to sign up.',
  openGraph: {
    type: 'website',
    url: 'https://sisterroam.com/browse',
    siteName: 'SisterRoam',
    title: 'Browse Verified Women Hosts — SisterRoam',
    description: 'Find verified women hosts worldwide. Browse by city, country, and travel style.',
    images: [{ url: '/sisterroam-og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Verified Women Hosts — SisterRoam',
    description: 'Find verified women hosts worldwide. Browse by city, country, and travel style.',
    images: ['/sisterroam-og-image.png'],
  },
  alternates: {
    canonical: 'https://sisterroam.com/browse',
  },
}

export default function BrowseLayout({ children }) {
  return children
}
