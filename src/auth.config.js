// Edge-safe auth config — no mongoose/DB imports (safe for proxy/middleware runtime)
const authConfig = {
  pages: {
    signIn: '/login',
    error:  '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60,
  },
  callbacks: {
    session({ session, token }) {
      session.user.id                = token.id
      session.user.fullName          = token.fullName
      session.user.profilePhotoUrl   = token.profilePhotoUrl
      session.user.verificationTier  = token.verificationTier
      session.user.role              = token.role
      session.user.isAdmin           = token.isAdmin
      session.user.onboardingCompleted = token.onboardingCompleted
      session.user.onboardingStep    = token.onboardingStep
      session.user.username          = token.username
      session.user.googleId          = token.googleId
      return session
    },
  },
  providers: [],
}

export default authConfig
