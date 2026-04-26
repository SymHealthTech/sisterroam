import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
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
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()
          const dbUser = await User.findOne({
            $or: [{ googleId: account.providerAccountId }, { email: user.email }],
          })
          if (dbUser) {
            if (dbUser.isPermanentlyBanned) return false
            if (dbUser.isSuspended && dbUser.suspendedUntil > new Date()) return false
          }
        } catch (err) {
          console.error('[auth][signIn][google]', err)
          // Allow sign-in — jwt callback will handle user creation
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
            let dbUser = await User.findOne({
              $or: [{ googleId: account.providerAccountId }, { email: token.email }],
            })

            if (!dbUser) {
              dbUser = await User.create({
                googleId: account.providerAccountId,
                email: token.email,
                fullName: token.name,
                profilePhotoUrl: token.picture,
                emailVerified: true,
              })
            } else if (!dbUser.googleId) {
              dbUser.googleId = account.providerAccountId
              await dbUser.save()
            }

            token.id = dbUser._id.toString()
            token.verificationTier = dbUser.verificationTier
            token.role = dbUser.role
            token.isAdmin = dbUser.isAdmin
            token.onboardingCompleted = dbUser.onboardingCompleted
            token.username = dbUser.username
            token.fullName = dbUser.fullName
            token.profilePhotoUrl = dbUser.profilePhotoUrl ?? token.picture
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
          token.username = user.username
          token.fullName = user.fullName
          token.profilePhotoUrl = user.profilePhotoUrl
        }
      }
      return token
    },
  },
})
