import Link from 'next/link'

const PLATFORM_LINKS = [
  { href: '/browse',               label: 'Find a Host'       },
  { href: '/how-it-works',         label: 'How it Works'      },
  { href: '/about',                label: 'About us'          },
  { href: '/about#founder',        label: 'Our founder'       },
  { href: '/about#ngo',            label: 'Our mission'       },
  { href: '/about#contact',        label: 'Contact us'        },
  { href: '/stories',              label: 'Travel Stories'    },
  { href: '/signup',               label: 'Join Free'         },
  { href: 'https://nutracare360.ca', label: 'nutracare360.ca ↗', external: true },
]

const COMMUNITY_LINKS = [
  { href: '/community',          label: 'Community Feed'      },
  { href: '/community/circles',  label: 'Circles'             },
  { href: '/cotraveller',        label: 'Find a Co-Traveller' },
  { href: '/stories',            label: 'Travel Stories'      },
  { href: '/explore',            label: 'Explore Hosts'       },
]

const SUPPORT_LINKS = [
  { href: '/safety',   label: 'Safety Centre'   },
  { href: '/about',    label: 'About Us'         },
  { href: '/privacy',  label: 'Privacy Policy'   },
  { href: '/terms',    label: 'Terms of Service' },
  { href: '/cookies',  label: 'Cookie Policy'    },
]

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
)

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const SOCIAL_LINKS = [
  { href: 'https://instagram.com/sisterroam', label: 'Instagram', Icon: InstagramIcon },
  { href: 'https://twitter.com/sisterroam',   label: 'Twitter',   Icon: TwitterIcon   },
  { href: 'https://facebook.com/sisterroam',  label: 'Facebook',  Icon: FacebookIcon  },
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
          </div>

          {/* Col 2 — Platform */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-brand transition-colors"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-sm text-gray-500 hover:text-brand transition-colors"
                    >
                      {l.label}
                    </Link>
                  )}
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
                className="text-gray-400 hover:text-brand transition-colors"
              >
                <s.Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
