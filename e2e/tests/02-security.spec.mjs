import { test, expect, resetDb, createUser, createHost, findUser, login, db, ObjectId, PASSWORD, emailsTo } from '../helpers.mjs'
import { CLOUD_NAME } from '../env.mjs'

test.beforeAll(resetDb)

/** What next-auth's useSession().update(data) sends — callable by anyone. */
async function forgeSessionUpdate(page, data) {
  return page.evaluate(async (data) => {
    const { csrfToken } = await (await fetch('/api/auth/csrf')).json()
    const r = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csrfToken, data }),
    })
    return r.json()
  }, data)
}

test('B1: a member cannot make herself verified or admin via session update()', async ({ page }) => {
  const user = await createUser({ verificationTier: 'basic' })
  await login(page, user.email)

  const session = await forgeSessionUpdate(page, { verificationTier: 'verified', isAdmin: true })
  expect(session.user.verificationTier).toBe('basic')
  expect(session.user.isAdmin).toBe(false)

  const fresh = await page.evaluate(() => fetch('/api/auth/session').then((r) => r.json()))
  expect(fresh.user.verificationTier).toBe('basic')

  const admin = await page.evaluate(() => fetch('/api/admin/stats').then((r) => r.status))
  expect(admin).toBe(403)
  // Gated write stays blocked for a basic member.
  const post = await page.evaluate(() =>
    fetch('/api/cotraveller', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then((r) => r.status))
  expect(post).toBe(403)
})

test('B1: session update() picks up a real tier change from the database', async ({ page }) => {
  const user = await createUser({ verificationTier: 'paid' })
  await login(page, user.email)
  await (await db()).collection('users').updateOne({ _id: user._id }, { $set: { verificationTier: 'verified' } })
  const session = await forgeSessionUpdate(page, {})
  expect(session.user.verificationTier).toBe('verified')
})

test('B1: a deleted account loses its session on the next refresh', async ({ page }) => {
  const user = await createUser()
  await login(page, user.email)
  await (await db()).collection('users').deleteOne({ _id: user._id })
  await forgeSessionUpdate(page, {})
  const fresh = await page.evaluate(() => fetch('/api/auth/session').then((r) => r.json()))
  expect(fresh?.user).toBeFalsy()
})

test('profile photo cannot be pointed at an arbitrary URL to skip moderation', async ({ page }) => {
  const user = await createUser()
  await login(page, user.email)
  const patch = (url, body) => page.evaluate(async ({ url, body }) => {
    const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return r.status
  }, { url, body })

  expect(await patch('/api/users', { profilePhotoUrl: 'https://evil.example/x.jpg' })).toBe(400)
  expect(await patch(`/api/users/${user.id}`, { profilePhotoUrl: 'https://res.cloudinary.com/other-cloud/image/upload/sisterroam/profiles/x.jpg' })).toBe(400)

  const ours = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/sisterroam/profiles/e2e_ok.webp`
  expect(await patch(`/api/users/${user.id}`, { profilePhotoUrl: ours })).toBe(200)
  expect((await findUser(user.email)).profilePhotoStatus).toBe('pending')
})

test('stay-request form is not shown to members still under review', async ({ page }) => {
  const host = await createHost()
  const user = await createUser({ verificationTier: 'paid' })
  await login(page, user.email)
  await page.goto(`/request/${host.id}`)
  await expect(page.getByRole('heading', { name: 'Verification under review' })).toBeVisible()
  await expect(page.getByPlaceholder(/Tell .* a bit about yourself/)).toHaveCount(0)
})

test('story HTML is sanitised (stored XSS) and JSON-LD cannot break out', async ({ page, request }) => {
  const user = await createUser({ verificationTier: 'paid' })
  await login(page, user.email)
  const payload = '<p>' + 'Safe travel story text. '.repeat(12) + '</p>' +
    '<img src=x onerror="window.__xss=1"><svg/onload="window.__xss=1"><a href="javascript:window.__xss=1">x</a>' +
    '<iframe srcdoc="<script>window.__xss=1</script>"></iframe><b>kept bold</b>'
  const created = await page.evaluate(async (content) => {
    const r = await fetch('/api/stories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'My trip </script><script>window.__xss=1</script>', content, category: 'solo_travel', isPublished: true }),
    })
    return r.json()
  }, payload)
  expect(created.success).toBe(true)
  const saved = created.data.content
  expect(saved).not.toMatch(/onerror|onload|javascript:|<iframe|<svg/i)
  expect(saved).toContain('<b>kept bold</b>')

  // Even a story that was stored raw (before this fix) is cleaned on read.
  await (await db()).collection('travelstories').updateOne({ _id: new ObjectId(created.data._id) }, { $set: { content: payload } })
  const read = await (await request.get(`/api/stories/${created.data.slug}`)).json()
  expect(read.data.story.content).not.toMatch(/onerror|onload|javascript:|<iframe|<svg/i)
  expect(read.data.story.saves).toBeUndefined()

  await page.goto(`/stories/${created.data.slug}`)
  await expect(page.getByText('kept bold')).toBeVisible()
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
})

test('member profiles need a login', async ({ page, request }) => {
  const user = await createUser()
  const other = await createUser({ bio: 'Loves mountains' })
  expect((await request.get(`/api/users/${other.id}`)).status()).toBe(401)
  await login(page, user.email)
  const status = await page.evaluate((id) => fetch(`/api/users/${id}`).then((r) => r.status), other.id)
  expect(status).toBe(200)
  // The in-app profile page (server-rendered) still works for signed-in members.
  await page.goto(`/user/${other.id}`)
  await expect(page.getByRole('heading', { name: other.fullName }).last()).toBeVisible()
})

test('password guessing is throttled after 10 tries', async ({ page }) => {
  const user = await createUser()
  for (let i = 0; i < 10; i++) {
    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.locator('input[type="password"]').fill(`wrong-pass-${i}1`)
    await page.getByRole('button', { name: 'Log in' }).tap()
    await expect(page.getByText('Invalid email or password. Please try again.')).toBeVisible()
  }
  // Even the right password is refused inside the window.
  await page.getByLabel('Email').fill(user.email)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).tap()
  await expect(page.getByText('Invalid email or password. Please try again.')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('story cover cannot be pointed at an arbitrary URL', async ({ page }) => {
  const user = await createUser()
  await login(page, user.email)
  const status = await page.evaluate(async () => {
    const r = await fetch('/api/stories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'A trip with a sneaky cover', content: '<p>' + 'x '.repeat(150) + '</p>', category: 'solo_travel', coverImageUrl: 'https://evil.example/cover.jpg' }),
    })
    return r.status
  })
  expect(status).toBe(400)
})

test('host profile: address never public; age + socials for members only', async ({ page, request }) => {
  const host = await createHost({ age: 34, instagramUrl: 'https://instagram.com/hostsister', linkedinUrl: 'https://linkedin.com/in/hostsister' })
  await (await db()).collection('hostprofiles').updateOne({ userId: host._id }, { $set: { addressLine: '12 Secret Lane' } })

  const anon = await (await request.get(`/api/hosts/${host.id}`)).json()
  expect(anon.data.addressLine).toBeUndefined()
  expect(anon.data.userId.age).toBeUndefined()
  expect(anon.data.userId.instagramUrl).toBeUndefined()
  expect(anon.data.userId.linkedinUrl).toBeUndefined()
  expect(anon.data.userId.fullName).toBe(host.fullName)

  const member = await createUser()
  await login(page, member.email)
  const asMember = await page.evaluate((id) => fetch(`/api/hosts/${id}`).then((r) => r.json()), host.id)
  expect(asMember.data.userId.age).toBe(34)
  expect(asMember.data.userId.instagramUrl).toContain('hostsister')
  expect(asMember.data.addressLine).toBeUndefined()
  // Members still see the socials on the host page (server-rendered with her cookie).
  await page.goto(`/explore/${host.id}`)
  await expect(page.getByRole('link', { name: /hostsister/ }).first()).toBeVisible()

  await page.context().clearCookies()
  await login(page, host.email)
  const asOwner = await page.evaluate((id) => fetch(`/api/hosts/${id}`).then((r) => r.json()), host.id)
  expect(asOwner.data.addressLine).toBe('12 Secret Lane')
})

test('changing the password signs out every other device, keeps this one', async ({ browser }) => {
  const user = await createUser()
  const device = async () => {
    const ctx = await browser.newContext(test.info().project.use)
    const p = await ctx.newPage()
    await p.route(/googletagmanager|google-analytics|cdn\.jsdelivr/, (r) => r.abort())
    await login(p, user.email)
    return { ctx, p }
  }
  const phone = await device()
  const laptop = await device()

  await phone.p.goto('/profile/settings')
  await phone.p.getByRole('button', { name: /^Password/ }).tap()
  await phone.p.getByPlaceholder('Your current password').fill(PASSWORD)
  await phone.p.getByPlaceholder('At least 8 characters with a number').fill('BrandNew789')
  await phone.p.getByPlaceholder('Repeat new password').fill('BrandNew789')
  await phone.p.getByRole('button', { name: 'Update password' }).tap()
  await expect(phone.p.getByText('Password updated! Other devices have been signed out.')).toBeVisible()

  // This device stays signed in.
  await phone.p.goto('/feed')
  await expect(phone.p).toHaveURL(/\/feed/)
  expect(await phone.p.evaluate(() => fetch('/api/users').then((r) => r.status))).toBe(200)

  // The other device is signed out: API refused, pages go to login (no loop).
  expect(await laptop.p.evaluate(() => fetch('/api/users').then((r) => r.status))).toBe(401)
  await laptop.p.goto('/feed')
  await expect(laptop.p).toHaveURL(/\/login/)
  await expect(laptop.p.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  // …and can log in again with the new password.
  await login(laptop.p, user.email, 'BrandNew789')
  await expect(laptop.p).toHaveURL(/\/feed/)

  await phone.ctx.close()
  await laptop.ctx.close()
})

test('resetting a forgotten password signs out every device', async ({ page, request }) => {
  const user = await createUser()
  await login(page, user.email)
  expect(await page.evaluate(() => fetch('/api/users').then((r) => r.status))).toBe(200)

  await request.post('/api/auth/forgot-password', { data: { email: user.email } })
  await expect.poll(async () => (await emailsTo(user.email)).length).toBeGreaterThan(0)
  const html = (await emailsTo(user.email)).at(-1).html
  const token = html.match(/reset-password\?token=([a-f0-9]+)/)[1]
  const reset = await request.post('/api/auth/reset-password', { data: { token, password: 'ResetPass321' } })
  expect(reset.status()).toBe(200)

  expect(await page.evaluate(() => fetch('/api/users').then((r) => r.status))).toBe(401)
  await page.goto('/feed')
  await expect(page).toHaveURL(/\/login/)
})
