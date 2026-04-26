import withPWA from 'next-pwa'

const pwa = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
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
      { source: '/browse',            destination: '/explore',           permanent: false },
      { source: '/blog',              destination: '/stories',           permanent: true  },
      { source: '/blog/:slug',        destination: '/stories/:slug',     permanent: true  },
      { source: '/community/blog',    destination: '/community/stories', permanent: true  },
      { source: '/community/blog/new',destination: '/community/stories/new', permanent: true },
      { source: '/community/blog/:slug', destination: '/stories/:slug',  permanent: true  },
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
