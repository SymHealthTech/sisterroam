import { defineConfig, devices } from '@playwright/test'
import { APP_URL } from './e2e/env.mjs'

/**
 * End-to-end tests. They run against an ISOLATED server (see e2e/server.mjs):
 * in-memory MongoDB, mocked Resend + Dodo, intercepted Cloudinary. They never
 * touch production data, send email, or create real payments.
 *
 *   npm run e2e             # reuse the last e2e build
 *   E2E_BUILD=1 npm run e2e # rebuild first (after code changes)
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  workers: 1, // one shared in-memory database
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/report' }]],
  outputDir: 'e2e/results',
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'pixel-7',
      // Installed Google Chrome (no Playwright browser download needed), emulating
      // a Pixel 7: Android UA, 412×915 viewport, DPR 2.625, touch + mobile.
      use: { ...devices['Pixel 7'], hasTouch: true, isMobile: true, channel: 'chrome' },
    },
  ],
  webServer: {
    command: `node e2e/server.mjs${process.env.E2E_BUILD ? ' --build' : ''}`,
    url: `${APP_URL}/login`,
    timeout: 15 * 60_000,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
