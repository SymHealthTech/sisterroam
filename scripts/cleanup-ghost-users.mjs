/**
 * One-off cleanup of "ghost" User rows left over from before the 2026-07-17
 * signup fix, when a User was created BEFORE the email OTP was verified. Those
 * rows have emailVerified:false, can never log in, but still show up in member
 * lists and counts.
 *
 * Safety rails — a row is only removed when ALL of these hold:
 *   - emailVerified is false
 *   - it is not an admin
 *   - it has NO Payment of any kind (never touch anyone who paid)
 *   - it has no VerificationRequest
 *
 * Usage:
 *   node scripts/cleanup-ghost-users.mjs           # report only (default)
 *   node scripts/cleanup-ghost-users.mjs --apply   # actually delete
 *
 * Reads MONGODB_URI from .env.local (like the other scripts).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const envFile = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (!(k in process.env)) process.env[k] = v
  }
}

const apply = process.argv.includes('--apply')

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set')
  process.exit(1)
}

await mongoose.connect(process.env.MONGODB_URI)
const db = mongoose.connection.db

const candidates = await db.collection('users')
  .find({ emailVerified: false, isAdmin: { $ne: true } })
  .project({ email: 1, fullName: 1, createdAt: 1 })
  .toArray()

const ghosts = []
for (const u of candidates) {
  const [payments, verifs] = await Promise.all([
    db.collection('payments').countDocuments({ userId: u._id }),
    db.collection('verificationrequests').countDocuments({ userId: u._id }),
  ])
  if (payments === 0 && verifs === 0) ghosts.push(u)
}

console.log(`${candidates.length} unverified-email accounts, ${ghosts.length} safe to remove:`)
for (const g of ghosts) {
  console.log(`  ${g._id}  ${g.email}  ${g.fullName ?? ''}  created ${g.createdAt?.toISOString?.() ?? '?'}`)
}

if (apply && ghosts.length) {
  const res = await db.collection('users').deleteMany({ _id: { $in: ghosts.map(g => g._id) } })
  console.log(`Deleted ${res.deletedCount} ghost accounts.`)
} else if (!apply) {
  console.log('\nReport only — re-run with --apply to delete.')
}

await mongoose.disconnect()
