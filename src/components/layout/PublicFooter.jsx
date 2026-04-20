import Link from 'next/link'

const footerLinks = {
  Platform: [
    { href: '/browse', label: 'Find a Host' },
    { href: '/how-it-works', label: 'How it Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
  ],
  Safety: [
    { href: '/safety', label: 'Safety Centre' },
    { href: '/about', label: 'About Us' },
    { href: '/community', label: 'Community' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
    { href: '/cookies', label: 'Cookie Policy' },
  ],
}

export default function PublicFooter() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-white">SisterRoam</span>
              <span className="text-pink text-lg">♀</span>
            </div>
            <p className="text-sm leading-relaxed">
              The safe hospitality exchange community exclusively for female solo travellers.
            </p>
          </div>
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-semibold text-sm mb-3">{section}</h4>
              <ul className="space-y-2">
                {links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-8 border-t border-gray-800 text-sm text-center">
          © {new Date().getFullYear()} SisterRoam. Made with ♥ for women who roam.
        </div>
      </div>
    </footer>
  )
}
