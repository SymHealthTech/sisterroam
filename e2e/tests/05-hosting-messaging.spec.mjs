import { test, expect, resetDb, createUser, createHost, login, db } from '../helpers.mjs'

test.beforeAll(resetDb)

function isoDay(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const INTRO =
  'Hi! I am a solo traveller from Pune visiting Goa for a week of beaches and local food. ' +
  'I loved your profile and would be grateful to stay with you.'

test('guest requests a stay, host accepts, and they chat', async ({ browser }) => {
  const host = await createHost()
  const guest = await createUser({
    emergencyContactName: 'Mum', emergencyContactPhone: '+919876543210', emergencyContactRelationship: 'Parent',
  })
  const d = await db()
  const hostProfile = await d.collection('hostprofiles').findOne({ userId: host._id })

  // ── Guest: explore → host → request ──
  const gCtx = await browser.newContext(test.info().project.use)
  const g = await gCtx.newPage()
  await g.route(/googletagmanager|google-analytics|cdn\.jsdelivr/, (r) => r.abort())
  await login(g, guest.email)
  await g.goto(`/explore/${hostProfile._id}`)
  await g.getByRole('link', { name: /Request a stay/ }).first().tap()
  await g.waitForURL(/\/request\//)
  await g.locator('#checkInDate').fill(isoDay(10))
  await g.locator('#checkOutDate').fill(isoDay(13))
  await g.locator('#message').fill(INTRO)
  const ack = g.locator('input[type="checkbox"]').last()
  if (await ack.count()) await ack.check({ force: true })
  await g.getByRole('button', { name: /Send request to/ }).tap()
  await g.waitForURL(/\/messages\//, { timeout: 20_000 })

  const req = await d.collection('hostingrequests').findOne({ guestId: guest._id })
  expect(req?.status).toBe('pending')
  expect(req.hostId.toString()).toBe(host.id)

  // ── Host: accept + reply ──
  const hCtx = await browser.newContext(test.info().project.use)
  const h = await hCtx.newPage()
  await h.route(/googletagmanager|google-analytics|cdn\.jsdelivr/, (r) => r.abort())
  await login(h, host.email)
  await h.goto(`/messages/${req._id}`)
  await h.getByRole('button', { name: 'Accept request' }).tap()
  await expect.poll(async () => (await d.collection('hostingrequests').findOne({ _id: req._id })).status).toBe('accepted')

  const box = h.getByPlaceholder('Type a message…')
  await box.fill('Welcome! See you soon.')
  await h.getByRole('button', { name: 'Send' }).tap()
  await expect(h.getByText('Welcome! See you soon.').last()).toBeVisible()

  // ── Guest sees the reply ──
  await g.goto(`/messages/${req._id}`)
  await expect(g.getByText('Welcome! See you soon.').last()).toBeVisible({ timeout: 15_000 })
  // The composer must stay on screen on a phone.
  const composer = g.getByPlaceholder('Type a message…')
  await expect(composer).toBeInViewport()

  await gCtx.close()
  await hCtx.close()
})

test('messages list shows the conversation', async ({ page }) => {
  const host = await createHost()
  const guest = await createUser()
  const d = await db()
  await d.collection('hostingrequests').insertOne({
    guestId: guest._id, hostId: host._id, checkInDate: new Date(Date.now() + 864e6), checkOutDate: new Date(Date.now() + 1100e6),
    nights: 3, message: 'hello', status: 'accepted', requestType: 'hosting', lastMessageAt: new Date(),
    lastMessagePreview: 'hello there', createdAt: new Date(), updatedAt: new Date(),
  })
  await login(page, guest.email)
  await page.goto('/messages')
  await expect(page.getByText(host.fullName).first()).toBeVisible()
})

test('chat keeps line breaks and shows *bold* / _italic_', async ({ page }) => {
  const host = await createHost()
  const guest = await createUser()
  const { insertedId } = await (await db()).collection('hostingrequests').insertOne({
    guestId: guest._id, hostId: host._id, checkInDate: new Date(Date.now() + 864e6), checkOutDate: new Date(Date.now() + 1100e6),
    nights: 3, message: 'hello', status: 'accepted', requestType: 'hosting', createdAt: new Date(), updatedAt: new Date(),
  })
  await login(page, guest.email)
  await page.goto(`/messages/${insertedId}`)
  const box = page.getByPlaceholder('Type a message…')
  await box.tap()
  // On a phone Enter must add a new line, not send.
  await box.pressSequentially('First line')
  await box.press('Enter')
  await box.press('Enter')
  await box.pressSequentially('New paragraph with ')
  await page.getByRole('button', { name: 'Bold' }).tap()
  await box.pressSequentially('bold')
  await box.press('End')
  await box.pressSequentially(' and _italic_ text')
  await expect(box).toHaveValue('First line\n\nNew paragraph with *bold* and _italic_ text')
  await page.getByRole('button', { name: 'Send' }).tap()

  const bubble = page.locator('div.whitespace-pre-wrap', { hasText: 'First line' }).last()
  await expect(bubble.locator('strong')).toHaveText('bold')
  await expect(bubble.locator('em')).toHaveText('italic')
  expect(await bubble.innerText()).toContain('First line\n\nNew paragraph')

  // Stored as typed; still formatted after a reload.
  await expect.poll(async () => (await (await db()).collection('messages').findOne({ requestId: insertedId }))?.content).toBe('First line\n\nNew paragraph with *bold* and _italic_ text')
  await page.reload()
  await expect(page.locator('div.whitespace-pre-wrap strong', { hasText: 'bold' }).last()).toBeVisible()
})

test('ticks: sent → delivered → read, and delete for me / for everyone', async ({ browser }) => {
  const host = await createHost()
  const guest = await createUser()
  const d = await db()
  const { insertedId } = await d.collection('hostingrequests').insertOne({
    guestId: guest._id, hostId: host._id, checkInDate: new Date(Date.now() + 864e6), checkOutDate: new Date(Date.now() + 1100e6),
    nights: 3, message: 'hello', status: 'accepted', requestType: 'hosting', createdAt: new Date(), updatedAt: new Date(),
  })
  const open = async (user) => {
    const ctx = await browser.newContext(test.info().project.use)
    const p = await ctx.newPage()
    await p.route(/googletagmanager|google-analytics|cdn\.jsdelivr/, (r) => r.abort())
    await login(p, user.email)
    return { ctx, p }
  }
  const longPress = (locator) => locator.evaluate(async (el) => {
    const touch = new Touch({ identifier: 1, target: el, clientX: 20, clientY: 20 })
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [touch], targetTouches: [touch], changedTouches: [touch] }))
    await new Promise((r) => setTimeout(r, 700))
    el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], targetTouches: [], changedTouches: [touch] }))
  })

  // Guest sends while the host's app is closed → single tick.
  const g = await open(guest)
  await g.p.goto(`/messages/${insertedId}`)
  await g.p.getByPlaceholder('Type a message…').fill('Tick test one')
  await g.p.getByRole('button', { name: 'Send' }).tap()
  const firstRow = g.p.locator('div.group', { hasText: 'Tick test one' })
  await expect(firstRow.getByLabel('Sent')).toBeVisible()

  // Host opens the app (not the chat) → delivered.
  const h = await open(host)
  await h.p.goto('/feed')
  await expect.poll(async () => (await d.collection('messages').findOne({ content: 'Tick test one' }))?.deliveredAt).toBeTruthy()
  await expect(firstRow.getByLabel('Delivered')).toBeVisible({ timeout: 20_000 })

  // Host opens the chat → read (blue).
  await h.p.goto(`/messages/${insertedId}`)
  await expect(h.p.getByText('Tick test one').last()).toBeVisible()
  await expect(firstRow.getByLabel('Read')).toBeVisible({ timeout: 20_000 })

  // Host long-presses the guest's message → "Delete for me" only (not for everyone).
  await longPress(h.p.locator('div.whitespace-pre-wrap', { hasText: 'Tick test one' }).last())
  await expect(h.p.getByRole('button', { name: 'Delete for everyone' })).toHaveCount(0)
  const deleted = h.p.waitForResponse((r) => r.url().includes('/api/messages/item/') && r.request().method() === 'DELETE')
  await h.p.getByRole('button', { name: 'Delete for me' }).tap()
  expect((await deleted).status()).toBe(200)
  await expect(h.p.locator('div.whitespace-pre-wrap', { hasText: 'Tick test one' })).toHaveCount(0)
  await h.p.reload()
  await expect(h.p.getByPlaceholder('Type a message…')).toBeVisible()
  await expect(h.p.locator('div.whitespace-pre-wrap', { hasText: 'Tick test one' })).toHaveCount(0)
  // …but the guest still has it.
  await g.p.reload()
  await expect(g.p.locator('div.whitespace-pre-wrap', { hasText: 'Tick test one' })).toBeVisible()

  // Guest deletes her own second message for everyone.
  await g.p.getByPlaceholder('Type a message…').fill('Tick test two')
  await g.p.getByRole('button', { name: 'Send' }).tap()
  await expect(h.p.locator('div.whitespace-pre-wrap', { hasText: 'Tick test two' })).toBeVisible({ timeout: 20_000 })
  // Options open only once the message has left the "sending" state.
  await expect(g.p.locator('div.group', { hasText: 'Tick test two' }).getByLabel(/Sent|Delivered|Read/)).toBeVisible()
  await longPress(g.p.locator('div.whitespace-pre-wrap', { hasText: 'Tick test two' }).last())
  await g.p.getByRole('button', { name: 'Delete for everyone' }).tap()
  await expect(g.p.locator('div.whitespace-pre-wrap', { hasText: 'Tick test two' })).toHaveCount(0)
  await expect(h.p.locator('div.whitespace-pre-wrap', { hasText: 'Tick test two' })).toHaveCount(0, { timeout: 20_000 })
  expect(await d.collection('messages').countDocuments({ content: 'Tick test two' })).toBe(0)

  await g.ctx.close()
  await h.ctx.close()
})

test('unverified member: "Get verified" in a chat opens the verification flow', async ({ page }) => {
  const host = await createHost()
  const guest = await createUser({ verificationTier: 'basic' })
  const { insertedId } = await (await db()).collection('hostingrequests').insertOne({
    guestId: guest._id, hostId: host._id, status: 'accepted', requestType: 'direct', createdAt: new Date(), updatedAt: new Date(),
  })
  await login(page, guest.email)
  await page.goto(`/messages/${insertedId}`)
  await expect(page.getByText('Only verified sisters can reply')).toBeVisible()
  await page.getByRole('link', { name: 'Get verified' }).tap()
  await page.waitForURL(/\/onboarding\/verify/)
  await expect(page.getByRole('heading', { name: 'Where are you from?' })).toBeVisible()
  await expect(page.getByText('No verification request found.')).toHaveCount(0)
})

test('paid member without documents still gets the re-upload screen', async ({ page }) => {
  const user = await createUser({ verificationTier: 'paid' })
  await login(page, user.email)
  await page.goto('/profile/verification')
  await expect(page).toHaveURL(/\/profile\/verification/)
  await expect(page.getByText('No verification request found.')).toHaveCount(0)
})
