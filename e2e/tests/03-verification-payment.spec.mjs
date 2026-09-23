import { test, expect, resetDb, createUser, findUser, login, db, signDodoWebhook, PNG_1PX, TINY_MP4 } from '../helpers.mjs'

test.beforeAll(resetDb)

async function fillDocuments(page) {
  await page.goto('/onboarding/verify')
  await expect(page.getByRole('heading', { name: 'Where are you from?' })).toBeVisible()
  await page.getByRole('button', { name: 'Select your country' }).tap()
  await page.getByPlaceholder('Search country…').fill('India')
  await page.getByRole('button', { name: 'India', exact: true }).tap()
  await page.getByRole('button', { name: 'Continue' }).tap()

  await expect(page.getByRole('heading', { name: 'Add your ID' })).toBeVisible()
  const idInputs = page.locator('input[type="file"][accept^="image/"]')
  await idInputs.nth(0).setInputFiles({ name: 'front.png', mimeType: 'image/png', buffer: PNG_1PX })
  await page.getByRole('button', { name: 'Use photo' }).first().tap()
  await expect(page.getByText('Front of ID selected')).toBeVisible()
  await idInputs.nth(1).setInputFiles({ name: 'back.png', mimeType: 'image/png', buffer: PNG_1PX })
  await page.getByRole('button', { name: 'Use photo' }).first().tap()
  await expect(page.getByText('Back of ID selected')).toBeVisible()

  await page.getByRole('tab', { name: 'Upload file' }).tap()
  await page.locator('input[type="file"][accept^="video/"]').setInputFiles({ name: 'intro.mp4', mimeType: 'video/mp4', buffer: TINY_MP4 })
  await page.getByRole('button', { name: 'Upload video' }).tap()
  await expect(page.getByText('Video selected', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Continue' }).tap()
  await expect(page.getByRole('heading', { name: 'One-time verification fee' })).toBeVisible()
}

async function paymentsFor(userId) {
  return (await db()).collection('payments').find({ userId }).toArray()
}

test.describe('Verification + Dodo checkout (website flow)', () => {
  test('pay $5 → documents upload after payment → member is "paid" and under review', async ({ page }) => {
    const user = await createUser({ verificationTier: 'basic' })
    await login(page, user.email)
    await fillDocuments(page)
    expect(page.cloudinaryUploads, 'nothing uploaded before payment').toHaveLength(0)

    await page.getByRole('button', { name: /Pay \$5/ }).tap()
    await page.waitForURL(/localhost:4010\/checkout\//)
    await page.locator('#pay').tap()

    await page.waitForURL(/\/feed/, { timeout: 30_000 })
    const fresh = await findUser(user.email)
    expect(fresh.verificationTier).toBe('paid')

    const [payment] = await paymentsFor(user._id)
    expect(payment.status).toBe('completed')
    expect(payment.amount).toBe(5)
    expect(payment.currency).toBe('USD')

    const verif = await (await db()).collection('verificationrequests').findOne({ userId: user._id })
    expect(verif?.status).toBe('pending')
    expect(verif.idDocumentPublicId).toBeTruthy()
    expect(verif.idDocumentBackPublicId).toBeTruthy()
    expect(verif.selfieVideoPublicId).toBeTruthy()
    // ID photos + video were sent as private (authenticated) media.
    expect(page.cloudinaryUploads).toHaveLength(3)
    for (const u of page.cloudinaryUploads) expect(u.type).toBe('authenticated')
  })

  test('declined card shows "Payment failed", keeps her basic, and lets her retry', async ({ page }) => {
    const user = await createUser({ verificationTier: 'basic' })
    await login(page, user.email)
    await fillDocuments(page)
    await page.getByRole('button', { name: /Pay \$5/ }).tap()
    await page.waitForURL(/localhost:4010\/checkout\//)
    await page.locator('#fail').tap()

    await expect(page.getByText('Payment failed')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /Pay \$5/ })).toBeVisible()
    expect((await findUser(user.email)).verificationTier).toBe('basic')
    const [payment] = await paymentsFor(user._id)
    expect(payment.status).toBe('failed')
    expect(page.cloudinaryUploads).toHaveLength(0)
  })

  test('cancelled checkout returns to the payment step with no charge', async ({ page }) => {
    const user = await createUser({ verificationTier: 'basic' })
    await login(page, user.email)
    await fillDocuments(page)
    await page.getByRole('button', { name: /Pay \$5/ }).tap()
    await page.waitForURL(/localhost:4010\/checkout\//)
    await page.locator('#cancel').tap()
    await expect(page.getByText('Payment was cancelled')).toBeVisible()
    expect((await findUser(user.email)).verificationTier).toBe('basic')
  })

  test('a forged "?payment=return" without paying does not activate', async ({ page }) => {
    const user = await createUser({ verificationTier: 'basic' })
    await login(page, user.email)
    await page.goto('/onboarding/verify?payment=return')
    await expect(page.getByText(/No payment record|Payment failed|could not/i).first()).toBeVisible({ timeout: 20_000 })
    expect((await findUser(user.email)).verificationTier).toBe('basic')
  })
})

test.describe('Dodo webhook', () => {
  const post = (request, payload, headers) =>
    request.post('/api/payments/webhook', { data: payload.body, headers: headers ?? payload.headers })

  function succeeded(userId, paymentId = `pay_wh_${Date.now()}`) {
    return {
      type: 'payment.succeeded',
      data: { payment_id: paymentId, total_amount: 500, currency: 'USD', metadata: { userId: userId.toString(), purpose: 'verified_badge' } },
    }
  }

  test('rejects an unsigned / wrongly signed webhook', async ({ request }) => {
    const signed = signDodoWebhook(succeeded('0'.repeat(24)))
    const res = await post(request, signed, { ...signed.headers, 'webhook-signature': 'v1,bm90LXZhbGlk' })
    expect(res.status()).toBe(401)
  })

  test('payment.succeeded marks the checkout paid; a redelivery changes nothing', async ({ request }) => {
    const user = await createUser({ verificationTier: 'basic' })
    const d = await db()
    await d.collection('payments').insertOne({
      userId: user._id, dodoPaymentLinkId: 'cks_wh_1', amount: 5, currency: 'USD',
      purpose: 'verified_badge', status: 'pending', createdAt: new Date(), updatedAt: new Date(),
    })
    const event = succeeded(user._id, 'pay_wh_redeliver')
    expect((await post(request, signDodoWebhook(event))).status()).toBe(200)
    expect((await post(request, signDodoWebhook(event))).status()).toBe(200)

    expect((await findUser(user.email)).verificationTier).toBe('paid')
    const payments = await paymentsFor(user._id)
    expect(payments).toHaveLength(1)
    expect(payments[0]).toMatchObject({ status: 'completed', dodoPaymentId: 'pay_wh_redeliver', amount: 5 })
    const notes = await d.collection('notifications').countDocuments({ recipientId: user._id, type: 'verification_under_review' })
    expect(notes).toBe(1)
  })

  test('a late webhook never downgrades a verified member (B2)', async ({ request }) => {
    const user = await createUser({ verificationTier: 'verified' })
    expect((await post(request, signDodoWebhook(succeeded(user._id)))).status()).toBe(200)
    expect((await findUser(user.email)).verificationTier).toBe('verified')
  })

  test('a paid-but-unmatched payment is still recorded', async ({ request }) => {
    const user = await createUser({ verificationTier: 'basic' })
    expect((await post(request, signDodoWebhook(succeeded(user._id, 'pay_wh_orphan')))).status()).toBe(200)
    const [p] = await paymentsFor(user._id)
    expect(p).toMatchObject({ status: 'completed', dodoPaymentId: 'pay_wh_orphan' })
    expect((await findUser(user.email)).verificationTier).toBe('paid')
  })

  test('payment.failed marks only the pending checkout failed and notifies once', async ({ request }) => {
    const user = await createUser({ verificationTier: 'basic' })
    const d = await db()
    await d.collection('payments').insertOne({
      userId: user._id, amount: 5, currency: 'USD', purpose: 'verified_badge', status: 'pending', createdAt: new Date(), updatedAt: new Date(),
    })
    const event = { type: 'payment.failed', data: { payment_id: 'pay_wh_fail', metadata: { userId: user.id, purpose: 'verified_badge' } } }
    await post(request, signDodoWebhook(event))
    await post(request, signDodoWebhook(event))
    const [p] = await paymentsFor(user._id)
    expect(p.status).toBe('failed')
    const notes = await d.collection('notifications').find({ recipientId: user._id }).toArray()
    expect(notes).toHaveLength(1)
    expect(notes[0].link).toBe('/onboarding/verify')

    // A successful retry in the same checkout completes that same row.
    await post(request, signDodoWebhook(succeeded(user._id, 'pay_wh_retry_ok')))
    const after = await paymentsFor(user._id)
    expect(after).toHaveLength(1)
    expect(after[0]).toMatchObject({ status: 'completed', dodoPaymentId: 'pay_wh_retry_ok' })
  })

  test('events for other purposes are ignored', async ({ request }) => {
    const user = await createUser({ verificationTier: 'basic' })
    const event = succeeded(user._id)
    event.data.metadata.purpose = 'something_else'
    expect((await post(request, signDodoWebhook(event))).status()).toBe(200)
    expect((await findUser(user.email)).verificationTier).toBe('basic')
    expect(await paymentsFor(user._id)).toHaveLength(0)
  })
})
