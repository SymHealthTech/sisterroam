/**
 * Creates or promotes the admin user (admin.sisterroam@gmail.com).
 * Run: node scripts/ensure-admin.mjs
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const envPath = resolve(__dirname, '../.env.local')
const env = readFileSync(envPath, 'utf8')
for (const line of env.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[key]) process.env[key] = val
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin.sisterroam@gmail.com'
const ADMIN_PASSWORD = process.argv[2] ?? 'SisterRoam@Admin2024!'

await mongoose.connect(process.env.MONGODB_URI)
const col = mongoose.connection.collection('users')

const existing = await col.findOne({ email: ADMIN_EMAIL })

if (existing) {
  await col.updateOne({ email: ADMIN_EMAIL }, { $set: { isAdmin: true } })
  console.log(`✓ ${ADMIN_EMAIL} already exists — isAdmin set to true.`)
} else {
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12)
  await col.insertOne({
    _id: new mongoose.Types.ObjectId(),
    email: ADMIN_EMAIL,
    password: hashed,
    fullName: 'SisterRoam Admin',
    username: 'sisterroam_admin',
    verificationTier: 'trusted',
    role: 'guest',
    isAdmin: true,
    isActive: true,
    isSuspended: false,
    isPermanentlyBanned: false,
    onboardingStep: 1,
    onboardingCompleted: true,
    emailVerified: true,
    emailNotifications: {
      newRequest: true, requestAccepted: true, requestDeclined: true,
      newMessage: true, checkinReminder: true, reviewReceived: true, verificationUpdate: true,
    },
    totalStays: 0, totalHostings: 0, averageRating: 0, totalReviews: 0,
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  console.log(`✓ Admin user created: ${ADMIN_EMAIL}`)
  console.log(`  Default password: ${ADMIN_PASSWORD}`)
  console.log('  Change this password immediately after first login.')
}

await mongoose.disconnect()
