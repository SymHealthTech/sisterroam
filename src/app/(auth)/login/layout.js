// Metadata wrapper for the (client-component) login page. Additive only —
// returns children unchanged, so flow/rendering/behavior are identical; this
// only attaches metadata. Same pattern as (public)/browse/layout.js.
export const metadata = {
  title: 'Log In',
  description:
    'Log in to your SisterRoam account to connect with verified female hosts, co-travellers, and trusted local recommendations.',
  // Thin utility page — should not be indexed.
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://sisterroam.com/login' },
}

export default function LoginLayout({ children }) {
  return children
}
