import { test, expect, resetDb, createUser, findUser, login, PNG_1PX } from '../helpers.mjs'

test.beforeAll(resetDb)

test('edit profile saves and shows on the profile page', async ({ page }) => {
  const user = await createUser({ occupation: 'Nurse' })
  await login(page, user.email)
  await page.goto('/profile/edit')
  const occupation = page.getByLabel('Occupation')
  await expect(occupation).toHaveValue('Nurse')
  await occupation.fill('Trekking guide')
  await page.getByRole('button', { name: 'Save changes' }).tap()
  await page.waitForURL(/\/profile$/)
  await expect.poll(async () => (await findUser(user.email)).occupation).toBe('Trekking guide')
})

test('profile photo: file picker offers camera + gallery and the upload is held for review', async ({ page }) => {
  const user = await createUser()
  await login(page, user.email)
  await page.goto('/profile/edit')

  const input = page.locator('input[type="file"][accept="image/*"]').first()
  // No `capture` attribute → Android shows BOTH camera and gallery.
  await expect(input).not.toHaveAttribute('capture', /.*/)
  await input.setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG_1PX })
  await expect(page.getByRole('heading', { name: 'Adjust photo' })).toBeVisible()
  await page.getByRole('button', { name: 'Use this photo' }).tap()

  await expect(page.getByText(/appear once approved/i)).toBeVisible({ timeout: 20_000 })
  const fresh = await findUser(user.email)
  expect(fresh.profilePhotoStatus).toBe('pending')
  expect(page.cloudinaryUploads.at(-1).folder).toBe('sisterroam/profiles')
})
