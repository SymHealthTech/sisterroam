// Metadata wrapper for the (client-component) coming-soon page. Additive only —
// returns children unchanged, so the page's flow, rendering, and behavior are
// identical; this only attaches metadata. Same pattern as (public)/browse/layout.js.
export const metadata = {
  title: 'Coming Soon',
  description:
    'Something new is on the way from SisterRoam — the verified hosting community for female solo travellers. Join the list to be the first to know.',
  openGraph: {
    type: 'website',
    url: 'https://sisterroam.com/coming-soon',
    siteName: 'SisterRoam',
    title: 'Coming Soon — SisterRoam',
    description:
      'Something new is on the way from SisterRoam. Join the list to be the first to know.',
    images: [{ url: '/sisterroam-og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coming Soon — SisterRoam',
    description: 'Something new is on the way. Join the list to be first to know.',
    images: ['/sisterroam-og-image.png'],
  },
  // Live production site — keep the pre-launch page out of the index by default.
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://sisterroam.com/coming-soon' },
}

export default function ComingSoonLayout({ children }) {
  return children
}
