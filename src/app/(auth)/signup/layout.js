// Metadata wrapper for the (client-component) signup page. Additive only —
// returns children unchanged, so flow/rendering/behavior are identical; this
// only attaches metadata. Same pattern as (public)/browse/layout.js.
export const metadata = {
  title: 'Create Your Account',
  description:
    'Join SisterRoam — the verified hosting community for female solo travellers. Free to sign up and connect with sisters you can trust.',
  // Thin utility page — should not be indexed.
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://sisterroam.com/signup' },
}

export default function SignupLayout({ children }) {
  return children
}
