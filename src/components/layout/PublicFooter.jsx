import Link from 'next/link'

const PLATFORM_LINKS = [
  { href: '/browse',       label: 'Find a Host'    },
  { href: '/how-it-works', label: 'How it Works'   },
  { href: '/pricing',      label: 'Pricing'         },
  { href: '/stories',      label: 'Travel Stories'  },
  { href: '/signup',       label: 'Join Free'       },
]

const COMMUNITY_LINKS = [
  { href: '/community',          label: 'Community Feed'   },
  { href: '/community/circles',  label: 'Circles'          },
  { href: '/stories',            label: 'Travel Stories'   },
  { href: '/explore',            label: 'Explore Hosts'    },
]

const SUPPORT_LINKS = [
  { href: '/safety',   label: 'Safety Centre'   },
  { href: '/about',    label: 'About Us'         },
  { href: '/privacy',  label: 'Privacy Policy'   },
  { href: '/terms',    label: 'Terms of Service' },
  { href: '/cookies',  label: 'Cookie Policy'    },
]

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/sisterroam', label: 'Instagram', icon: 'IG' },
  { href: 'https://twitter.com/sisterroam',   label: 'Twitter',   icon: 'X'  },
  { href: 'https://facebook.com/sisterroam',  label: 'Facebook',  icon: 'FB' },
]

export default function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main grid — 4 cols desktop, 2 cols mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-xl font-bold text-brand">SisterRoam</span>
              <span className="text-pink text-lg" aria-hidden="true">♀</span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">
              The safe hospitality exchange community for female solo travellers worldwide.
            </p>
            <div className="space-y-1">
              <p className="text-xs text-gray-400">sisterroam.com</p>
              <p className="text-xs text-gray-400">nomadvital.com</p>
            </div>
          </div>

          {/* Col 2 — Platform */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-500 hover:text-brand transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Community */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Community
            </h4>
            <ul className="space-y-3">
              {COMMUNITY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-500 hover:text-brand transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Support */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-500 hover:text-brand transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {year} SisterRoam. Made with ♥ for women who roam.
          </p>

          {/* Social links */}
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-xs font-medium text-gray-400 hover:text-brand transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
