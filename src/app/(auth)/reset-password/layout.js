// Metadata wrapper for the (client-component) reset-password page. Additive
// only — returns children unchanged, so flow/rendering/behavior are identical;
// this only attaches metadata. Same pattern as (public)/browse/layout.js.
export const metadata = {
  title: 'Reset Password',
  description:
    'Choose a new password for your SisterRoam account and get back to connecting with verified sisters.',
  // Thin utility page — should not be indexed.
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://sisterroam.com/reset-password' },
}

export default function ResetPasswordLayout({ children }) {
  return children
}
