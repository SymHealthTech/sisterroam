import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Environment for the e2e server. Every external service is replaced:
 *   - MongoDB   → the SEPARATE `sisterroam_e2e` database on the same cluster
 *                 (the live `sisterroam` database is never read or written)
 *   - Resend    → local mock (emails are captured, never sent)
 *   - Dodo      → local mock checkout (no real charges, test or live)
 *   - Cloudinary→ fake credentials; browser uploads are intercepted in tests
 * These values override .env.local because Next never overwrites variables
 * that are already set in process.env.
 */
export const APP_PORT = 3100
export const MOCK_PORT = 4010

export const APP_URL = `http://localhost:${APP_PORT}`
export const MOCK_URL = `http://localhost:${MOCK_PORT}`
export const E2E_DB_NAME = 'sisterroam_e2e'

// Same cluster/credentials as .env.local, but the database path is swapped for
// the e2e database. E2E_MONGODB_URI can point at a different cluster entirely.
function readEnvLocal(key) {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env.local')
  if (!fs.existsSync(file)) return undefined
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (t.startsWith(`${key}=`)) return t.slice(key.length + 1).trim().replace(/^["']|["']$/g, '')
  }
  return undefined
}

function e2eMongoUri() {
  const base = process.env.E2E_MONGODB_URI || readEnvLocal('MONGODB_URI')
  if (!base) throw new Error('No MongoDB URI: set E2E_MONGODB_URI or MONGODB_URI in .env.local')
  const u = new URL(base)
  u.pathname = `/${E2E_DB_NAME}`
  return u.toString()
}

export const MONGO_URI = e2eMongoUri()

/** Hard stop if a URI would ever point anywhere but the e2e database. */
export function assertE2eDatabase(uri) {
  if (new URL(uri).pathname !== `/${E2E_DB_NAME}`) {
    throw new Error(`Refusing to run: database is not ${E2E_DB_NAME}`)
  }
}
assertE2eDatabase(MONGO_URI)

// standardwebhooks secret (base64 of "sisterroam-e2e-webhook-secret-01")
export const DODO_WEBHOOK_SECRET = 'whsec_c2lzdGVycm9hbS1lMmUtd2ViaG9vay1zZWNyZXQtMDE='
export const CLOUD_NAME = 'e2e-cloud'

export const serverEnv = {
  MONGODB_URI: MONGO_URI,
  AUTH_SECRET: 'e2e-auth-secret-not-for-production-0123456789',
  NEXTAUTH_SECRET: 'e2e-auth-secret-not-for-production-0123456789',
  AUTH_URL: APP_URL,
  NEXTAUTH_URL: APP_URL,
  AUTH_TRUST_HOST: 'true',
  RESEND_API_KEY: 're_e2e_test',
  RESEND_BASE_URL: MOCK_URL,
  RESEND_FROM_EMAIL: 'SisterRoam <noreply@e2e.test>',
  DODO_SECRET_KEY: 'dodo_e2e_test',
  DODO_WEBHOOK_SECRET,
  DODO_BASE_URL: MOCK_URL,
  DODO_PRODUCT_ID_USD: 'pdt_e2e_verified_badge',
  CLOUDINARY_CLOUD_NAME: CLOUD_NAME,
  CLOUDINARY_API_KEY: '000000000000000',
  CLOUDINARY_API_SECRET: 'e2e-cloudinary-secret',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CLOUD_NAME,
  // Non-empty so .env.local's real GA id is not inlined; tests block gtag.
  NEXT_PUBLIC_GA_ID: 'G-E2ETEST000',
  ADMIN_EMAIL: 'admin@e2e.test',
  CRON_SECRET: 'e2e-cron-secret',
  DODO_ENV: 'test_mode',
  // The suite logs in far more often than a person would, all from one IP.
  LOGIN_RATE_LIMIT_PER_IP: '100000',
}
