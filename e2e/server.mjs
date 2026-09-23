/**
 * Starts the mocks, (optionally) builds the app against them, then serves the
 * production build on APP_PORT. Used as Playwright's webServer.
 *
 *   node e2e/server.mjs           # serve an existing e2e build
 *   node e2e/server.mjs --build   # build first (needed after code changes)
 *
 * Production build (not `next dev`) because next-pwa only emits the service
 * worker in production, and the PWA checks need it.
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { startMocks } from './mocks.mjs'
import { APP_PORT, MONGO_URI, assertE2eDatabase, serverEnv } from './env.mjs'

const require = createRequire(import.meta.url)
const nextBin = require.resolve('next/dist/bin/next')
assertE2eDatabase(MONGO_URI)
const env = { ...process.env, ...serverEnv }

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextBin, ...args], { env, stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} exited ${code}`))))
  })
}

const mocks = await startMocks()
console.log('[e2e] mocks up (Resend, Dodo); database: sisterroam_e2e')

const shutdown = async () => { await mocks.stop().catch(() => {}); process.exit(0) }
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

if (process.argv.includes('--build')) {
  await run(['build', '--webpack'])
}

const server = spawn(process.execPath, [nextBin, 'start', '-p', String(APP_PORT)], { env, stdio: 'inherit' })
server.on('exit', shutdown)
