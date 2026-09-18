/**
 * Cleanup job for stale/abandoned public images stuck in manual moderation.
 *
 * Cloudinary holds manually-moderated images as `pending` and never delivers
 * them until approved. If one is never actioned (member abandoned the flow, or
 * it slipped through the queue), it just sits there. This script deletes pending
 * images older than a threshold and clears their DB references.
 *
 * Usage:
 *   node scripts/cleanup-pending-media.mjs            # delete pending > 30 days
 *   node scripts/cleanup-pending-media.mjs --days 14  # custom threshold
 *   node scripts/cleanup-pending-media.mjs --dry-run  # report only, no changes
 *
 * Reads MONGODB_URI + CLOUDINARY_* from .env.local (like the seed scripts).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { v2 as cloudinary } from 'cloudinary'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local
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

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const daysIdx = args.indexOf('--days')
const THRESHOLD_DAYS = daysIdx !== -1 ? Number(args[daysIdx + 1]) : 30

const { MONGODB_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
if (!MONGODB_URI) { console.error('MONGODB_URI is not set.'); process.exit(1) }
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('CLOUDINARY_* env vars are not set.'); process.exit(1)
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})

// Minimal schemas (strict:false so we only touch the fields we name).
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }))
const CommunityPost = mongoose.models.CommunityPost || mongoose.model('CommunityPost', new mongoose.Schema({}, { strict: false, collection: 'communityposts' }))
const TravelStory = mongoose.models.TravelStory || mongoose.model('TravelStory', new mongoose.Schema({}, { strict: false, collection: 'travelstories' }))

async function clearRefs(publicId) {
  await User.updateOne(
    { profilePhotoPublicId: publicId },
    { $unset: { profilePhotoUrl: '', profilePhotoPublicId: '' }, $set: { profilePhotoStatus: 'rejected' } },
  )
  await TravelStory.updateOne(
    { coverImagePublicId: publicId },
    { $unset: { coverImageUrl: '', coverImagePublicId: '' }, $set: { coverModerationStatus: 'rejected' } },
  )
  const post = await CommunityPost.findOne({ imagePublicIds: publicId })
  if (post) {
    const idx = (post.imagePublicIds ?? []).indexOf(publicId)
    if (idx !== -1) {
      post.imageUrls.splice(idx, 1)
      post.imagePublicIds.splice(idx, 1)
    }
    post.approvedImagePublicIds = (post.approvedImagePublicIds ?? []).filter((id) => id !== publicId)
    const allApproved =
      post.imagePublicIds.length === 0 ||
      post.imagePublicIds.every((id) => post.approvedImagePublicIds.includes(id))
    post.moderationStatus = allApproved ? 'approved' : 'pending'
    await post.save()
  }
}

async function run() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false })
  console.log(`Connected. Threshold: ${THRESHOLD_DAYS} days${dryRun ? ' (dry run)' : ''}`)

  let deleted = 0
  let next = null
  do {
    const res = await cloudinary.api.resources_by_moderation('manual', 'pending', {
      max_results: 100,
      ...(next ? { next_cursor: next } : {}),
    })
    next = res.next_cursor
    for (const r of res.resources ?? []) {
      const age = Date.now() - new Date(r.created_at).getTime()
      if (age < THRESHOLD_DAYS * 86400000) continue
      console.log(`  stale (${Math.round(age / 86400000)}d): ${r.public_id}`)
      if (dryRun) { deleted++; continue }
      await clearRefs(r.public_id)
      await cloudinary.uploader.destroy(r.public_id, { resource_type: 'image' }).catch(() => {})
      deleted++
    }
  } while (next)

  console.log(`${dryRun ? 'Would delete' : 'Deleted'} ${deleted} stale pending image(s).`)
  await mongoose.disconnect()
}

run().catch((err) => { console.error(err); process.exit(1) })
