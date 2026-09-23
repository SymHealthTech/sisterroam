import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import authConfig from '@/auth.config'
import { checkRateLimit } from '@/lib/rateLimit'
import { isSessionRevoked } from '@/lib/sessionRevocation'

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
      async authorize(credentials, request) {
        if (typeof credentials?.email !== 'string' || typeof credentials?.password !== 'string') return null

        try {
          await connectDB()
        } catch {
          return null
        }

        // Slow down password guessing: 10 tries per account and (default) 100 per
        // IP address every 15 minutes. The IP limit is generous because mobile
        // carriers share one IP between many people. Fails open on DB hiccups.
        const WINDOW = 15 * 60 * 1000
        const email = credentials.email.toLowerCase().trim()
        const ip = request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const [byEmail, byIp] = await Promise.all([
          checkRateLimit(`login:${email}`, { max: 10, windowMs: WINDOW }),
          checkRateLimit(`login-ip:${ip}`, { max: Number(process.env.LOGIN_RATE_LIMIT_PER_IP) || 100, windowMs: WINDOW }),
        ])
        if (!byEmail.allowed || !byIp.allowed) return null

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

        // A member who deactivated her account is reactivated by signing in.
        if (user.isActive === false) {
          await User.updateOne({ _id: user._id }, { $set: { isActive: true } }).catch(() => {})
        }

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

    async jwt({ token, user, account, trigger }) {
      // Signed in before her last password change (on another device) → out.
      if (!account && token?.id) {
        const authAt = token.authAt ?? (token.iat ? token.iat * 1000 : 0)
        if (await isSessionRevoked(token.id, authAt)) return null
      }
      // `update()` is callable from the browser with ANY payload, so it must never
      // be trusted — merging it let a member set her own verificationTier/isAdmin.
      // Treat an update as "refresh from the database" and ignore the payload.
      if (trigger === 'update') {
        if (!token?.id) return token
        let fresh
        try {
          await connectDB()
          fresh = await User.findById(token.id)
            .select('fullName username profilePhotoUrl profilePhotoStatus verificationTier role isAdmin onboardingCompleted onboardingStep isPermanentlyBanned isSuspended suspendedUntil')
            .lean()
        } catch {
          return token // transient DB error — keep the current session
        }
        // Deleted or banned account → end the session.
        if (!fresh || fresh.isPermanentlyBanned) return null
        if (fresh.isSuspended && fresh.suspendedUntil > new Date()) return null
        token.verificationTier    = fresh.verificationTier
        token.role                = fresh.role
        token.isAdmin             = fresh.isAdmin
        token.onboardingCompleted = fresh.onboardingCompleted
        token.onboardingStep      = fresh.onboardingStep
        token.username            = fresh.username
        token.fullName            = fresh.fullName
        // Only an approved photo may surface in avatars (pending ones stay hidden).
        token.profilePhotoUrl =
          !fresh.profilePhotoStatus || fresh.profilePhotoStatus === 'approved'
            ? fresh.profilePhotoUrl ?? null
            : null
        return token
      }
      if (account) {
        token.authAt = Date.now()
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
