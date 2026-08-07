/**
 * Seed official SisterRoam community posts from community_posts_seed.json.
 *
 * Design guarantees:
 *   - ADDITIVE ONLY. Never updates, deletes, or reorders existing posts.
 *   - IDEMPOTENT by `slug`. Re-running skips any slug that already exists.
 *   - Author is the official SisterRoam admin account, never a personal user.
 *   - createdAt = SEED_RUN_DATE + publish_offset_days, with a randomised
 *     time-of-day in 08:00–23:00 UTC (deterministic per slug) so timestamps
 *     don't cluster. Only the flagged post is pinned.
 *   - Markdown emphasis in bodies is flattened to clean plain text, because the
 *     feed renders `content` as plain text (whitespace-pre-wrap, no md parser).
 *
 * Usage:
 *   node scripts/seed-community-posts.mjs --dry-run   # print, write nothing
 *   node scripts/seed-community-posts.mjs             # write
 *
 * Env (optional):
 *   SEED_AUTHOR_EMAIL   email of the account to author as. If unset, the script
 *                       uses the sole isAdmin:true account; if there are 0 or >1
 *                       admins it aborts and lists candidates (never guesses).
 *   SEED_RUN_DATE       ISO date (YYYY-MM-DD) used as day 0. Defaults to today.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DRY_RUN = process.argv.includes('--dry-run')

/* ── Load .env.local (same approach as seed-promo-codes.mjs) ──────────── */
const envFile = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set. Add it to .env.local or the environment.')
  process.exit(1)
}

/* ── Minimal inline models (script runs outside Next, so no @/ alias) ──── */
const communityPostSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'safety_tips', 'trip_planning', 'looking_for_host', 'hosting_offer', 'achievements', 'questions', 'safety_brief', 'guide', 'founder_log', 'ask_community'],
      default: 'general',
    },
    imageUrls: { type: [String] },
    imagePublicIds: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    slug: { type: String, unique: true, sparse: true },
    tags: { type: [String], default: [] },
    source: { type: String },
  },
  { timestamps: true },
)
const CommunityPost = mongoose.models.CommunityPost || mongoose.model('CommunityPost', communityPostSchema)

// Loose User schema — we only read _id / fullName / isAdmin / email.
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }))

/* ── Category slug (seed) → model enum value ──────────────────────────── */
const CATEGORY_MAP = {
  'safety-brief':      'safety_brief',
  'guide':             'guide',
  'founder-log':       'founder_log',
  'ask-the-community': 'ask_community',
}

/* ── Markdown → plain text (the feed has no md renderer) ──────────────── */
// Drop **bold** and *italic* emphasis markers, keep the words and line breaks.
function flattenMarkdown(body) {
  return body
    .replace(/\*\*(.+?)\*\*/gs, '$1') // **bold**  → bold
    .replace(/\*(.+?)\*/gs, '$1')     // *italic*  → italic
    .replace(/\*/g, '')               // any stray asterisk
}

/* ── Deterministic per-slug RNG so dry-run matches the real run ───────── */
function makeRng(seedStr) {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

// createdAt = runDate(UTC 00:00) + offsetDays, + random time in [08:00, 23:00) UTC.
function computeCreatedAt(runDate, offsetDays, slug) {
  const d = new Date(Date.UTC(runDate.getUTCFullYear(), runDate.getUTCMonth(), runDate.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + offsetDays)
  const rng = makeRng(slug)
  const hour = 8 + Math.floor(rng() * 15)   // 8..22
  const min  = Math.floor(rng() * 60)
  const sec  = Math.floor(rng() * 60)
  d.setUTCHours(hour, min, sec, 0)
  return d
}

async function resolveAuthor() {
  const email = process.env.SEED_AUTHOR_EMAIL?.trim().toLowerCase()
  if (email) {
    const u = await User.findOne({ email }).lean()
    if (!u) {
      console.error(`Error: SEED_AUTHOR_EMAIL=${email} not found. Refusing to guess or create an account.`)
      process.exit(1)
    }
    return u
  }
  const admins = await User.find({ isAdmin: true }).select('_id fullName email').lean()
  if (admins.length === 1) return admins[0]
  if (admins.length === 0) {
    console.error('Error: no isAdmin:true account found. Set SEED_AUTHOR_EMAIL to the official account email.')
    process.exit(1)
  }
  console.error(`Error: ${admins.length} admin accounts found — cannot pick automatically. Set SEED_AUTHOR_EMAIL to one of:`)
  for (const a of admins) console.error(`   - ${a.email}  (${a.fullName})`)
  process.exit(1)
}

async function seed() {
  const runDate = process.env.SEED_RUN_DATE ? new Date(process.env.SEED_RUN_DATE + 'T00:00:00Z') : new Date()
  if (Number.isNaN(runDate.getTime())) {
    console.error(`Error: SEED_RUN_DATE is not a valid date: ${process.env.SEED_RUN_DATE}`)
    process.exit(1)
  }

  const seedPath = path.resolve(__dirname, '../community_posts_seed.json')
  const data = JSON.parse(fs.readFileSync(seedPath, 'utf8'))
  const posts = data.posts ?? []

  await mongoose.connect(MONGODB_URI, { bufferCommands: false })
  console.log(`Connected to MongoDB${DRY_RUN ? '  (DRY RUN — no writes)' : ''}`)

  const author = await resolveAuthor()
  console.log(`Author: ${author.fullName}  <${author.email}>  (${author._id})`)
  console.log(`Seed run date (day 0): ${runDate.toISOString().slice(0, 10)}  ·  ${posts.length} posts in file`)
  console.log('─'.repeat(72))

  let created = 0, skipped = 0
  for (const p of posts) {
    const category = CATEGORY_MAP[p.category]
    if (!category) {
      console.error(`  ! ${p.slug} — unknown category "${p.category}", skipping`)
      continue
    }
    const createdAt = computeCreatedAt(runDate, p.publish_offset_days, p.slug)

    const existing = await CommunityPost.findOne({ slug: p.slug }).select('_id').lean()
    if (existing) {
      skipped++
      console.log(`  = ${p.slug.padEnd(32)} SKIP (exists)`)
      continue
    }

    if (DRY_RUN) {
      created++
      console.log(`  + ${p.slug.padEnd(32)} ${createdAt.toISOString()}  [${category}]${p.pinned ? '  PINNED' : ''}`)
      continue
    }

    const doc = await CommunityPost.create({
      authorId: author._id,
      content: flattenMarkdown(p.body).trim(),
      category,
      slug: p.slug,
      tags: p.tags ?? [],
      isPinned: !!p.pinned,
      isPublished: true,
      source: 'seed',
    })
    // Mongoose auto-sets createdAt to now, and with { timestamps: true } it also
    // marks createdAt immutable — so a Mongoose updateOne $set is silently
    // dropped. Write through the native driver to force the backdated value.
    await CommunityPost.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt, updatedAt: createdAt } },
    )
    created++
    console.log(`  + ${p.slug.padEnd(32)} ${createdAt.toISOString()}  [${category}]${p.pinned ? '  PINNED' : ''}`)
  }

  console.log('─'.repeat(72))
  console.log(`${DRY_RUN ? 'Would create' : 'Created'}: ${created}   Skipped (already existed): ${skipped}`)

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
