import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local so the script works without extra flags
const envFile = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n')
  for (const line of lines) {
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
  console.error('Error: MONGODB_URI is not set. Add it to .env.local or set it in the environment.')
  process.exit(1)
}

const PromoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ['brand_ambassador', 'first_100'], required: true },
    maxUses: { type: Number, required: true, default: 100 },
    usedCount: { type: Number, default: 0 },
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        userEmail: String,
        usedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
    notes: { type: String },
  },
  { timestamps: true },
)

const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema)

const PROMO_CODES = [
  {
    code: 'BRAND100',
    type: 'brand_ambassador',
    maxUses: 100,
    notes: 'Brand ambassador promo code',
  },
  {
    code: 'NEWSIS100',
    type: 'first_100',
    maxUses: 100,
    notes: 'New sisters first-100 promo code',
  },
]

async function seed() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false })
  console.log('Connected to MongoDB')

  for (const data of PROMO_CODES) {
    const result = await PromoCode.findOneAndUpdate(
      { code: data.code },
      { $setOnInsert: data },
      { upsert: true, returnDocument: 'after', rawResult: true },
    )
    const action = result.lastErrorObject?.updatedExisting ? 'already exists' : 'created'
    console.log(`  ${data.code} — ${action}`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
