import { test, expect, resetDb, createUser, findUser, latestOtp, login, PASSWORD } from '../helpers.mjs'

test.beforeAll(resetDb)

test.describe('Signup (email + OTP)', () => {
  test('creates the account only after the OTP and signs her in', async ({ page }) => {
    const email = `new.${Date.now()}@e2e.test`
    await page.goto('/signup')
    await page.getByLabel('Full name').fill('Asha Tester')
    await page.getByLabel('Email').fill(email)
    await page.getByPlaceholder('Min 8 chars with a number').fill(PASSWORD)
    await page.getByLabel('Confirm password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Continue' }).tap()

    await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible()
    expect(await findUser(email), 'no User row before the OTP is verified').toBeNull()

    await expect.poll(() => latestOtp(email)).toMatch(/^\d{6}$/)
    const otp = await latestOtp(email)
    const boxes = page.locator('input[inputmode="numeric"]')
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill(otp[i])
    await page.getByRole('button', { name: 'Verify email' }).tap()

    await page.waitForURL('**/onboarding/profile')
    const user = await findUser(email)
    expect(user?.emailVerified).toBe(true)
    expect(user?.verificationTier).toBe('basic')
  })

  test('wrong OTP shows an error and creates nothing', async ({ page }) => {
    const email = `wrong.${Date.now()}@e2e.test`
    await page.goto('/signup')
    await page.getByLabel('Full name').fill('Wrong Otp')
    await page.getByLabel('Email').fill(email)
    await page.getByPlaceholder('Min 8 chars with a number').fill(PASSWORD)
    await page.getByLabel('Confirm password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Continue' }).tap()
    await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible()
    await expect.poll(() => latestOtp(email)).toMatch(/^\d{6}$/)
    const otp = await latestOtp(email)
    const wrong = otp === '000000' ? '111111' : '000000'
    const boxes = page.locator('input[inputmode="numeric"]')
    for (let i = 0; i < 6; i++) await boxes.nth(i).fill(wrong[i])
    await page.getByRole('button', { name: 'Verify email' }).tap()
    await expect(page.getByText(/Incorrect OTP/)).toBeVisible()
    expect(await findUser(email)).toBeNull()
  })

  test('an email that already has an account is refused', async ({ page }) => {
    const existing = await createUser()
    await page.goto('/signup')
    await page.getByLabel('Full name').fill('Dup Tester')
    await page.getByLabel('Email').fill(existing.email)
    await page.getByPlaceholder('Min 8 chars with a number').fill(PASSWORD)
    await page.getByLabel('Confirm password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Continue' }).tap()
    await expect(page.getByText(/already/i).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
  })
})

test.describe('Login / logout', () => {
  test('login lands on the feed; wrong password is rejected', async ({ page }) => {
    const user = await createUser()
    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.locator('input[type="password"]').fill('not-the-password1')
    await page.getByRole('button', { name: 'Log in' }).tap()
    await expect(page.getByText('Invalid email or password. Please try again.')).toBeVisible()

    await login(page, user.email)
    await expect(page).toHaveURL(/\/feed/)
  })

  test('logged-out visitors are sent to login from app pages', async ({ page }) => {
    await page.goto('/messages')
    await expect(page).toHaveURL(/\/login/)
  })

  test('sign out from the mobile "More" sheet ends the session', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.getByRole('button', { name: 'More options' }).last().tap()
    await page.getByRole('button', { name: /Sign out/ }).tap()
    await page.waitForURL((u) => u.pathname === '/')
    await page.goto('/feed')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Session survives closing the app', () => {
  test('session cookie is persistent and a fresh app launch stays signed in', async ({ page, context, browser }) => {
    const user = await createUser()
    await login(page, user.email)

    const cookies = await context.cookies()
    const session = cookies.find((c) => c.name.includes('session-token'))
    expect(session, 'session cookie set').toBeTruthy()
    // A persistent cookie (not a browser-session cookie) — ~30 days.
    expect(session.expires).toBeGreaterThan(Date.now() / 1000 + 29 * 24 * 3600)

    // "Close" the app and launch it again with the same stored cookies.
    const state = await context.storageState()
    await page.close()
    const relaunched = await browser.newContext({ ...test.info().project.use, storageState: state })
    const p2 = await relaunched.newPage()
    await p2.goto('/feed')
    await expect(p2).toHaveURL(/\/feed/)
    const s = await p2.evaluate(() => fetch('/api/auth/session').then((r) => r.json()))
    expect(s.user.id).toBe(user.id)
    await relaunched.close()
  })
})
