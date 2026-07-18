// Metadata wrapper for the (client-component) forgot-password page. Additive
// only — returns children unchanged, so flow/rendering/behavior are identical;
// this only attaches metadata. Same pattern as (public)/browse/layout.js.
export const metadata = {
  title: 'Forgot Password',
  description:
    'Reset your SisterRoam password. Enter your email and we will send you a secure link to get back into your account.',
  // Thin utility page — should not be indexed.
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://sisterroam.com/forgot-password' },
}

export default function ForgotPasswordLayout({ children }) {
  return children
}
