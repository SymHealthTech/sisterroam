/**
 * Promotes a user to admin by email.
 * Run: node scripts/make-admin.mjs <email>
 */

import mongoose from 'mongoose'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '../.env.local')
const env = readFileSync(envPath, 'utf8')
for (const line of env.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  if (!process.env[key]) process.env[key] = value
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email>')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI)

const result = await mongoose.connection.collection('users').updateOne(
  { email: email.toLowerCase().trim() },
  { $set: { isAdmin: true } }
)

if (result.matchedCount === 0) {
  console.error(`No user found with email: ${email}`)
} else if (result.modifiedCount === 0) {
  console.log(`User ${email} is already an admin.`)
} else {
  console.log(`✓ ${email} is now an admin.`)
}

await mongoose.disconnect()
