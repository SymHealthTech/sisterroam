import './globals.css'
import { auth } from '@/lib/auth'
import SessionProvider from '@/components/auth/SessionProvider'
import ToastProvider from '@/components/ui/Toast'
import SplashScreen from '@/components/ui/SplashScreen'
import PWAInstallButton from '@/components/ui/PWAInstallButton'

export const metadata = {
  metadataBase: new URL('https://sisterroam.com'),
  title: {
    default: 'SisterRoam — Explore Fearlessly, Together',
    template: '%s — SisterRoam',
  },
  description:
    'The verified hosting community for female solo travellers. Find a verified female host, a co-traveller, or local recommendations — all from sisters you can trust.',
  keywords: [
    'female solo travel',
    'women hosting women',
    'safe travel for women',
    'verified female hosts',
    'solo female traveller community',
    'Dr Manisha Sonawane',
    'SisterRoam',
    'co-traveller finder',
    'travel recommendations women',
    'female travel community India',
  ],
  authors: [{ name: 'Dr Manisha Sonawane', url: 'https://sisterroam.com/about' }],
  creator: 'Dr Manisha Sonawane',
  publisher: 'SisterRoam',

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/sisterroam-favicon-32.svg', type: 'image/svg+xml' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/sisterroam-favicon-32.svg', color: '#5D1A8B' },
    ],
  },

  manifest: '/manifest.json',

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sisterroam.com',
    siteName: 'SisterRoam',
    title: 'SisterRoam — Explore Fearlessly, Together',
    description:
      'The verified hosting community for female solo travellers. Stay with verified sisters. Host fearless women. Explore together.',
    images: [
      {
        url: '/sisterroam-og-image.png',
        width: 1200,
        height: 630,
        alt: 'SisterRoam — The verified hosting community for female solo travellers',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'SisterRoam — Explore Fearlessly, Together',
    description: 'The verified hosting community for female solo travellers.',
    images: ['/sisterroam-og-image.png'],
    creator: '@sisterroam',
    site: '@sisterroam',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://sisterroam.com',
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SisterRoam',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#5D1A8B' },
    { media: '(prefers-color-scheme: dark)', color: '#5D1A8B' },
  ],
}

export default async function RootLayout({ children }) {
  const session = await auth()
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SisterRoam" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        {/* Rendered server-side so it's in the DOM before JS loads.
            CSS makes it a full-screen purple cover in standalone mode,
            preventing any flash of content before the React splash mounts. */}
        <div id="pwa-splash-bg" aria-hidden="true" />
        <SessionProvider session={session}>
          <SplashScreen />
          {children}
          <PWAInstallButton />
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  )
}
