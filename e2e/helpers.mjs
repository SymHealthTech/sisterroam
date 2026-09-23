import { test as base, expect } from '@playwright/test'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { Webhook } from 'standardwebhooks'
import { MONGO_URI, MOCK_URL, E2E_DB_NAME, DODO_WEBHOOK_SECRET, CLOUD_NAME, assertE2eDatabase } from './env.mjs'

export { expect, ObjectId }

export const PASSWORD = 'Password123'

/* ── Database (the sisterroam_e2e database ONLY) ─────────────── */

let client
export async function db() {
  assertE2eDatabase(MONGO_URI)
  if (!client) client = await new MongoClient(MONGO_URI).connect()
  return client.db(E2E_DB_NAME)
}

export async function resetDb() {
  const d = await db()
  if (d.databaseName !== E2E_DB_NAME) throw new Error('Refusing to reset a non-e2e database')
  const cols = await d.listCollections({}, { nameOnly: true }).toArray()
  // Keep indexes (the app relies on unique indexes) — just empty the data.
  await Promise.all(cols.filter(c => !c.name.startsWith('system.')).map(c => d.collection(c.name).deleteMany({})))
}

let userSeq = 0
const passwordHash = bcrypt.hashSync(PASSWORD, 10)

/** Insert a ready-to-use member. Defaults: verified, onboarded, email-verified. */
export async function createUser(overrides = {}) {
  const d = await db()
  const n = `${Date.now().toString(36)}${++userSeq}`
  const doc = {
    email: `sister${n}@e2e.test`,
    password: passwordHash,
    emailVerified: true,
    fullName: `Test Sister ${n}`,
    username: `sister${n}`,
    age: 29,
    gender: 'female',
    city: 'Pune',
    country: 'India',
    languages: ['English'],
    verificationTier: 'verified',
    role: 'guest',
    isAdmin: false,
    isActive: true,
    onboardingStep: 3,
    onboardingCompleted: true,
    profilePhotoStatus: 'approved',
    emailNotifications: {
      newRequest: true, requestAccepted: true, requestDeclined: true, newMessage: true,
      checkinReminder: true, reviewReceived: true, verificationUpdate: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
  const { insertedId } = await d.collection('users').insertOne(doc)
  return { ...doc, _id: insertedId, id: insertedId.toString() }
}

export async function createHost(overrides = {}) {
  const user = await createUser({ role: 'host', city: 'Goa', ...overrides })
  const d = await db()
  await d.collection('hostprofiles').insertOne({
    userId: user._id,
    accommodationType: 'private_room',
    maxGuests: 1,
    freeOfferings: ['bed', 'wifi'],
    femaleOnly: true,
    isAcceptingGuests: true,
    isListingActive: true,
    houseRules: 'No smoking',
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return user
}

export async function findUser(email) {
  return (await db()).collection('users').findOne({ email })
}

/* ── Mocks ───────────────────────────────────────────────────── */

export async function emailsTo(address) {
  const r = await fetch(`${MOCK_URL}/__emails?to=${encodeURIComponent(address)}`)
  return r.json()
}

export async function latestOtp(address) {
  const list = await emailsTo(address)
  const html = list.at(-1)?.html ?? ''
  const m = html.replace(/<[^>]+>/g, ' ').match(/\b(\d{6})\b/)
  return m?.[1]
}

/** Sign a Dodo webhook exactly like Dodo does (standardwebhooks). */
export function signDodoWebhook(payload) {
  const body = JSON.stringify(payload)
  const id = `msg_e2e_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const ts = new Date()
  const signature = new Webhook(DODO_WEBHOOK_SECRET).sign(id, ts, body)
  return {
    body,
    headers: {
      'content-type': 'application/json',
      'webhook-id': id,
      'webhook-timestamp': Math.floor(ts.getTime() / 1000).toString(),
      'webhook-signature': signature,
    },
  }
}

/* ── Browser ─────────────────────────────────────────────────── */

let uploadSeq = 0

/**
 * Every test page: third-party scripts (analytics, NSFWJS CDN) are blocked and
 * browser uploads to Cloudinary are answered by a fake — nothing leaves the
 * machine. `page.cloudinaryUploads` records what the app tried to upload.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    page.cloudinaryUploads = []
    await page.route(/googletagmanager\.com|google-analytics\.com|cdn\.jsdelivr\.net/, (r) => r.abort())
    await page.route('https://api.cloudinary.com/**', async (route) => {
      const req = route.request()
      const url = req.url()
      const kind = url.includes('/video/') ? 'video' : 'image'
      const body = req.postData() ?? ''
      const folder = body.match(/name="folder"\r\n\r\n([^\r]+)/)?.[1] ?? 'sisterroam'
      const type = body.match(/name="type"\r\n\r\n([^\r]+)/)?.[1] ?? 'upload'
      const publicId = `${folder}/e2e_${++uploadSeq}`
      page.cloudinaryUploads.push({ url, folder, type, publicId })
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          public_id: publicId,
          secure_url: `https://res.cloudinary.com/${CLOUD_NAME}/${kind}/${type}/v1/${publicId}.${kind === 'video' ? 'mp4' : 'webp'}`,
        }),
      })
    })
    await use(page)
  },
})

export async function login(page, email, password = PASSWORD) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /^sign in|^log in/i }).tap()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 })
}

/** 1×1 PNG and a tiny MP4 header — enough for file inputs and size checks. */
export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
export const TINY_MP4 = Buffer.concat([
  Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex'),
  Buffer.alloc(2048),
])
