import './globals.css'
import SessionProvider from '@/components/auth/SessionProvider'
import ToastProvider from '@/components/ui/Toast'

export const metadata = {
  title: {
    default: 'SisterRoam — Safe Hosting for Female Solo Travellers',
    template: '%s | SisterRoam',
  },
  description:
    'The safe hospitality exchange community exclusively for female solo travellers. Find trusted female hosts worldwide.',
  keywords: ['female solo travel', 'women hosting', 'safe travel', 'hospitality exchange'],
  authors: [{ name: 'SisterRoam' }],
  creator: 'SisterRoam',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'SisterRoam',
    title: 'SisterRoam — Safe Hosting for Female Solo Travellers',
    description: 'Connect with verified female hosts worldwide. Travel safely.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SisterRoam',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SisterRoam',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#5D1A8B',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SisterRoam" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Splash screens for common iPhones */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        <SessionProvider>
          {children}
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  )
}
