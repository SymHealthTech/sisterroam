// Helper for the Lighthouse run: create a member in sisterroam_e2e, log in,
// print the session cookie header.
import { chromium } from '@playwright/test'
import { createUser, PASSWORD } from './helpers.mjs'
import { APP_URL } from './env.mjs'
const user = await createUser()
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
await page.goto(`${APP_URL}/login`)
await page.getByLabel('Email').fill(user.email)
await page.locator('input[type="password"]').fill(PASSWORD)
await page.getByRole('button', { name: 'Log in' }).click()
await page.waitForURL((u) => !u.pathname.startsWith('/login'))
const c = (await page.context().cookies()).filter((x) => x.name.includes('session-token'))
console.log(c.map((x) => `${x.name}=${x.value}`).join('; '))
await browser.close()
process.exit(0)
