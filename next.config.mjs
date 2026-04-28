import withPWA from 'next-pwa'

const pwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline.html',
  },
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/sisterroam\.com\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'sisterroam-api-cache',
        expiration: { maxEntries: 64, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'sisterroam-image-cache',
        expiration: { maxEntries: 128, maxAgeSeconds: 2592000 },
      },
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'sisterroam-cloudinary-cache',
        expiration: { maxEntries: 64, maxAgeSeconds: 2592000 },
      },
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
      { protocol: 'https', hostname: 'randomuser.me' },
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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ]
  },
}

export default pwa(nextConfig)
