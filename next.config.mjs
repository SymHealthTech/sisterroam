import withPWA from 'next-pwa'

const pwa = withPWA({
  dest: 'public',
  // Registered from components/pwa/SWUpdater.jsx — next-pwa's own register
  // script only runs on Pages-Router pages, which this app doesn't use.
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline.html',
  },
  buildExcludes: [/middleware-manifest\.json$/],
  // API responses are deliberately NOT cached: they are per-member (profile,
  // messages, payment status) and a shared device would serve one member's data
  // to the next. Offline, API calls fail and pages show their error states.
  runtimeCaching: [
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'sisterroam-image-cache',
        expiration: { maxEntries: 128, maxAgeSeconds: 2592000 },
      },
    },
    {
      // Never cache private media (ID documents, intro videos) on the device.
      urlPattern: /^https:\/\/res\.cloudinary\.com\/(?!.*\/authenticated\/)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'sisterroam-cloudinary-cache',
        expiration: { maxEntries: 64, maxAgeSeconds: 2592000 },
      },
    },
    {
      // Page navigations always go to the network (HTML is per-member, never
      // cached). The route exists so that, offline, next-pwa's fallback serves
      // /offline.html instead of the browser's error page.
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkOnly',
      options: {},
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  async redirects() {
    return [
      { source: '/browse',             destination: '/explore',               permanent: false },
      { source: '/blog',               destination: '/stories',               permanent: true  },
      { source: '/blog/:slug',         destination: '/stories/:slug',         permanent: true  },
      { source: '/community/blog',     destination: '/community/stories',     permanent: true  },
      { source: '/community/blog/new', destination: '/community/stories/new', permanent: true  },
      { source: '/community/blog/:slug', destination: '/stories/:slug',       permanent: true  },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
          // Minimal CSP: no <base> hijacking, no plugins, no framing (clickjacking).
          // Scripts are not restricted here so GA / Dodo / Cloudinary keep working.
          { key: 'Content-Security-Policy', value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'" },
        ],
      },
    ]
  },
}

export default pwa(nextConfig)
