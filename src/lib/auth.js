import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import authConfig from '@/auth.config'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          await connectDB()
        } catch {
          return null
        }

        const user = await User.findByEmail(credentials.email).select('+password')

        if (!user || !user.password) return null

        const isValid = await user.comparePassword(credentials.password)
        if (!isValid) return null

        // Email OTP verification is mandatory. The signup flow only reaches
        // sign-in AFTER the OTP step, so blocking here does not affect the happy
        // path — it stops half-created (pre-OTP) accounts from logging in.
        if (!user.emailVerified) return null

        if (user.isPermanentlyBanned) return null
        if (user.isSuspended && user.suspendedUntil > new Date()) return null

        return {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          username: user.username,
          profilePhotoUrl: user.profilePhotoUrl,
          verificationTier: user.verificationTier,
          role: user.role,
          isAdmin: user.isAdmin,
          onboardingCompleted: user.onboardingCompleted,
          onboardingStep: user.onboardingStep,
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update' && session) {
        return { ...token, ...session }
      }
      if (account) {
        token.id = user.id
        token.verificationTier = user.verificationTier
        token.role = user.role
        token.isAdmin = user.isAdmin
        token.onboardingCompleted = user.onboardingCompleted
        token.onboardingStep = user.onboardingStep
        token.username = user.username
        token.fullName = user.fullName
        token.profilePhotoUrl = user.profilePhotoUrl
      }
      return token
    },
  },
})
