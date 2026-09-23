/**
 * A tiny HTTP server that stands in for Resend and Dodo.
 *
 * Resend:  POST /emails                  → captured, listed at GET /__emails
 * Dodo:    POST /checkouts               → creates a fake checkout session
 *          GET  /checkouts/:id           → { payment_status } like the real API
 *          GET  /checkout/:id            → hosted "checkout page" (Pay / Fail / Cancel)
 *          POST /__dodo/:id?status=…     → force a session status from a test
 */
import http from 'node:http'
import { MOCK_PORT } from './env.mjs'

const emails = []
const sessions = new Map()
let seq = 0

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type })
  res.end(type === 'application/json' ? JSON.stringify(body) : body)
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  try { return JSON.parse(raw || '{}') } catch { return {} }
}

function checkoutPage(s) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Mock Dodo Checkout</title></head>
<body style="font-family:sans-serif;padding:24px">
  <h1>Mock Dodo checkout</h1>
  <p>Session ${s.id} — $5.00</p>
  <a id="pay" href="/checkout/${s.id}/finish?result=succeeded" style="display:block;padding:14px;background:#5D1A8B;color:#fff;margin:8px 0">Pay $5</a>
  <a id="fail" href="/checkout/${s.id}/finish?result=failed" style="display:block;padding:14px;margin:8px 0">Card declined</a>
  <a id="cancel" href="/checkout/${s.id}/finish?result=cancelled" style="display:block;padding:14px;margin:8px 0">Cancel</a>
</body></html>`
}

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${MOCK_PORT}`)
  const p = url.pathname

  if (p === '/__health') return send(res, 200, { ok: true })

  // ── Resend ──
  if (req.method === 'POST' && p === '/emails') {
    const body = await readJson(req)
    emails.push({ ...body, at: Date.now() })
    return send(res, 200, { id: `email_${++seq}` })
  }
  if (p === '/__emails') {
    if (req.method === 'DELETE') { emails.length = 0; return send(res, 200, { ok: true }) }
    const to = url.searchParams.get('to')
    const list = to ? emails.filter(e => [].concat(e.to).includes(to)) : emails
    return send(res, 200, list)
  }

  // ── Dodo API ──
  if (req.method === 'POST' && p === '/checkouts') {
    const body = await readJson(req)
    const id = `cks_e2e_${++seq}`
    const s = { id, status: null, body }
    sessions.set(id, s)
    return send(res, 200, { session_id: id, checkout_url: `http://localhost:${MOCK_PORT}/checkout/${id}` })
  }
  let m = p.match(/^\/checkouts\/([^/]+)$/)
  if (req.method === 'GET' && m) {
    const s = sessions.get(m[1])
    if (!s) return send(res, 404, { message: 'not found' })
    return send(res, 200, { id: s.id, payment_status: s.status, payment_id: s.paymentId ?? null })
  }
  m = p.match(/^\/__dodo\/([^/]+)$/)
  if (m) {
    const s = sessions.get(m[1])
    if (!s) return send(res, 404, {})
    s.status = url.searchParams.get('status')
    return send(res, 200, s)
  }
  if (p === '/__dodo') {
    return send(res, 200, [...sessions.values()])
  }

  // ── Hosted checkout ──
  m = p.match(/^\/checkout\/([^/]+)$/)
  if (m && sessions.has(m[1])) return send(res, 200, checkoutPage(sessions.get(m[1])), 'text/html')
  m = p.match(/^\/checkout\/([^/]+)\/finish$/)
  if (m && sessions.has(m[1])) {
    const s = sessions.get(m[1])
    const result = url.searchParams.get('result')
    s.status = result === 'cancelled' ? 'cancelled' : result
    if (result === 'succeeded') s.paymentId = `pay_e2e_${++seq}`
    const target = result === 'cancelled' ? s.body.cancel_url : s.body.return_url
    res.writeHead(302, { Location: target })
    return res.end()
  }

  send(res, 404, { message: `mock: no route for ${req.method} ${p}` })
}

export async function startMocks() {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => send(res, 500, { message: e.message }))
  })
  await new Promise((r) => server.listen(MOCK_PORT, r))
  return {
    async stop() {
      await new Promise((r) => server.close(r))
    },
  }
}
