import Link from 'next/link'

export const metadata = {
  title: 'Page not found | SisterRoam',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Illustration */}
      <svg
        viewBox="0 0 200 160"
        className="w-52 h-40 mb-8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Globe */}
        <circle cx="100" cy="75" r="55" fill="#EEEDFE" stroke="#5D1A8B" strokeWidth="2" />
        <ellipse cx="100" cy="75" rx="25" ry="55" fill="none" stroke="#5D1A8B" strokeWidth="1.5" />
        <line x1="45" y1="75" x2="155" y2="75" stroke="#5D1A8B" strokeWidth="1.5" />
        <line x1="50" y1="52" x2="150" y2="52" stroke="#5D1A8B" strokeWidth="1" />
        <line x1="50" y1="98" x2="150" y2="98" stroke="#5D1A8B" strokeWidth="1" />
        {/* 404 */}
        <text x="100" y="83" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#5D1A8B">
          404
        </text>
        {/* Dotted path */}
        <circle cx="30" cy="130" r="4" fill="#D4537E" />
        <circle cx="50" cy="140" r="3" fill="#D4537E" opacity="0.6" />
        <circle cx="72" cy="145" r="4" fill="#D4537E" />
        <circle cx="95" cy="148" r="3" fill="#D4537E" opacity="0.6" />
        <circle cx="120" cy="145" r="4" fill="#D4537E" />
        <circle cx="145" cy="138" r="3" fill="#D4537E" opacity="0.6" />
        <circle cx="165" cy="128" r="4" fill="#D4537E" />
        {/* Traveller */}
        <circle cx="30" cy="118" r="6" fill="#5D1A8B" />
        <rect x="25" y="124" width="10" height="14" rx="2" fill="#5D1A8B" />
        <rect x="22" y="126" width="5" height="8" rx="1.5" fill="#D4537E" />
      </svg>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Lost on the road?</h1>
      <p className="text-gray-500 text-center mb-8 max-w-xs">
        This page doesn&apos;t exist — but there are plenty of great destinations waiting for you.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/feed"
          className="px-6 py-3 bg-brand text-white rounded-2xl font-medium text-sm hover:bg-brand-dark transition-colors text-center"
        >
          Go to feed
        </Link>
        <Link
          href="/explore"
          className="px-6 py-3 bg-brand-lighter text-brand rounded-2xl font-medium text-sm hover:bg-brand-lighter/70 transition-colors text-center"
        >
          Browse hosts
        </Link>
        <Link
          href="/"
          className="px-6 py-3 border border-gray-200 text-gray-600 rounded-2xl font-medium text-sm hover:border-gray-300 transition-colors text-center"
        >
          Homepage
        </Link>
      </div>
    </div>
  )
}
