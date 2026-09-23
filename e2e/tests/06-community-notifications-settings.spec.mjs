import { test, expect, resetDb, createUser, findUser, login, db, PASSWORD } from '../helpers.mjs'

test.beforeAll(resetDb)

test.describe('Community feed', () => {
  test('post, like and comment', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.goto('/community')
    await page.getByText(/Share something with the community|Introduce yourself/).first().tap()
    const text = `Hello sisters from the e2e run ${Date.now()}`
    await page.getByPlaceholder('Share your travel experience, tips, or questions…').fill(text)
    await page.getByRole('button', { name: 'Post', exact: true }).tap()
    await expect(page.getByText(text)).toBeVisible()

    // The new post is the first card in the feed.
    await page.getByRole('button', { name: 'Like' }).first().tap()
    await expect.poll(async () => (await (await db()).collection('communityposts').findOne({ content: text }))?.likesCount).toBe(1)

    await page.getByRole('button', { name: 'Comments' }).first().tap()
    await page.getByPlaceholder('Add a comment…').fill('Lovely!')
    await page.getByPlaceholder('Add a comment…').press('Enter')
    await expect(page.getByText('Lovely!')).toBeVisible()
  })
})

test.describe('Notifications', () => {
  test('lists notifications and marks them read', async ({ page }) => {
    const user = await createUser()
    await (await db()).collection('notifications').insertOne({
      recipientId: user._id, type: 'new_message', title: 'E2E notification title', body: 'Body text',
      link: '/messages', isRead: false, createdAt: new Date(),
    })
    await login(page, user.email)
    await page.goto('/notifications')
    await expect(page.getByText('E2E notification title')).toBeVisible()
    await page.getByRole('button', { name: /Mark all read/ }).tap()
    await expect.poll(async () =>
      (await db()).collection('notifications').countDocuments({ recipientId: user._id, isRead: false })).toBe(0)
  })
})

test.describe('Settings', () => {
  test('email-notification toggle persists', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.goto('/profile/settings')
    const toggle = page.getByRole('checkbox').first()
    await toggle.waitFor({ state: 'attached' })
    const before = await toggle.isChecked()
    await toggle.locator('xpath=..').tap()
    await expect.poll(async () => {
      const u = await findUser(user.email)
      return Object.values(u.emailNotifications).filter((v) => v === false).length
    }).toBe(before ? 1 : 0)
  })

  test('change password, then log in with the new one', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.goto('/profile/settings')
    await page.getByRole('button', { name: /^Password/ }).tap()
    await page.getByPlaceholder('Your current password').fill(PASSWORD)
    await page.getByPlaceholder('At least 8 characters with a number').fill('NewPassword456')
    await page.getByPlaceholder('Repeat new password').fill('NewPassword456')
    await page.getByRole('button', { name: 'Update password' }).tap()
    await expect(page.getByText('Password updated!')).toBeVisible()

    await page.context().clearCookies()
    await login(page, user.email, 'NewPassword456')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('deactivate hides her, signing back in reactivates', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.goto('/profile/settings')
    await page.getByRole('button', { name: /^Deactivate$/ }).tap()
    await page.getByRole('button', { name: 'Yes, deactivate' }).tap()
    await expect.poll(async () => (await findUser(user.email)).isActive).toBe(false)
    await page.waitForURL((u) => u.pathname === '/', { timeout: 15_000 })
    await login(page, user.email)
    expect((await findUser(user.email)).isActive).toBe(true)
  })

  test('delete account removes her data and signs her out', async ({ page }) => {
    const user = await createUser()
    await (await db()).collection('verificationrequests').insertOne({
      userId: user._id, country: 'India', status: 'approved',
      idDocumentPublicId: 'sisterroam/verifications/e2e_front', idDocumentBackPublicId: 'sisterroam/verifications/e2e_back',
      createdAt: new Date(), updatedAt: new Date(),
    })
    await login(page, user.email)
    await page.goto('/profile/settings')
    await page.getByRole('button', { name: 'Delete', exact: true }).tap()
    await page.getByRole('button', { name: 'Yes, delete my account' }).tap()
    await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 })
    expect(await findUser(user.email)).toBeNull()
    expect(await (await db()).collection('verificationrequests').countDocuments({ userId: user._id })).toBe(0)
    await page.goto('/feed')
    await expect(page).toHaveURL(/\/login/)
  })
})
