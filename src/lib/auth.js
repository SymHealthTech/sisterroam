import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import authConfig from '@/auth.config'

async function generateUniqueUsername(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15) || 'sister'

  let username = base
  let counter = 1

  while (await User.findOne({ username })) {
    username = base + counter
    counter++
  }

  return username
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

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

    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()

          const existingUser = await User.findOne({
            $or: [
              { email: profile.email },
              { googleId: profile.sub },
            ],
          })

          if (existingUser) {
            if (existingUser.isPermanentlyBanned) return false
            if (existingUser.isSuspended && existingUser.suspendedUntil > new Date()) {
              return false
            }

            // Link googleId if they previously signed up with email+password
            if (!existingUser.googleId) {
              await User.findByIdAndUpdate(existingUser._id, {
                $set: { googleId: profile.sub, emailVerified: true },
              })
            }

            return true
          }

          // New user — create minimal account, skip OTP step
          const username = await generateUniqueUsername(
            profile.name || profile.email.split('@')[0]
          )

          await User.create({
            email: profile.email,
            googleId: profile.sub,
            fullName: profile.name || '',
            username,
            emailVerified: true,
            phoneVerified: false,
            verificationTier: 'basic',
            role: 'guest',
            onboardingStep: 2,
            onboardingCompleted: false,
            isActive: true,
          })

          return true
        } catch (error) {
          console.error('Google signIn error:', error)
          return false
        }
      }
      return true
    },

    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update' && session) {
        return { ...token, ...session }
      }
      if (account) {
        if (account.provider === 'google') {
          try {
            await connectDB()
            const dbUser = await User.findOne({ email: token.email })
            if (dbUser) {
              token.id = dbUser._id.toString()
              token.verificationTier = dbUser.verificationTier
              token.role = dbUser.role
              token.isAdmin = dbUser.isAdmin
              token.onboardingCompleted = dbUser.onboardingCompleted
              token.onboardingStep = dbUser.onboardingStep
              token.username = dbUser.username
              token.fullName = dbUser.fullName
              token.profilePhotoUrl = dbUser.profilePhotoUrl ?? token.picture
              token.googleId = dbUser.googleId
            }
          } catch (err) {
            console.error('[auth][jwt][google]', err)
            token.fullName = token.fullName ?? token.name
            token.profilePhotoUrl = token.profilePhotoUrl ?? token.picture
          }
        } else {
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
      }
      return token
    },
  },
})
