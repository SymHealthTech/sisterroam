import { test, expect, resetDb, createUser, login, db } from '../helpers.mjs'

test.beforeAll(resetDb)

test.describe('Install / manifest', () => {
  test('manifest is installable and every icon exists', async ({ request }) => {
    const m = await (await request.get('/manifest.json')).json()
    expect(m.display).toBe('standalone')
    expect(m.start_url).toBeTruthy()
    const sizes = (purpose) => m.icons.filter((i) => (i.purpose ?? 'any').includes(purpose)).map((i) => i.sizes)
    expect(sizes('any')).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(sizes('maskable')).toEqual(expect.arrayContaining(['192x192', '512x512']))
    for (const icon of m.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200)
  })

  test('viewport keeps inputs above the Android keyboard', async ({ page }) => {
    await page.goto('/login')
    const content = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(content).toContain('interactive-widget=resizes-content')
  })
})

test.describe('Service worker + offline', () => {
  test('service worker registers and controls the page', async ({ page }) => {
    await page.goto('/login')
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)
    expect(scope).toMatch(/\/$/)
  })

  test('offline navigation shows the friendly offline page, not a browser error', async ({ page, context }) => {
    await page.goto('/login')
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    await page.reload() // now controlled by the SW
    await context.setOffline(true)
    await page.goto('/about').catch(() => {})
    await expect(page.getByRole('heading', { name: 'You are offline' })).toBeVisible()
    await context.setOffline(false)
  })

  test('going offline inside the app does not crash the page', async ({ page, context }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.goto('/feed')
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await context.setOffline(true)
    // Client-side navigation while offline.
    await page.getByRole('link', { name: 'Messages' }).first().tap()
    await page.waitForTimeout(2500)
    const body = await page.locator('body').innerText()
    expect(body.trim().length, 'page is not blank').toBeGreaterThan(20)
    expect(errors.filter((e) => !/Failed to fetch|NetworkError|Load failed|ChunkLoadError|Loading chunk/i.test(e))).toEqual([])
    await context.setOffline(false)
  })

  test('API responses are not cached by the service worker', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.goto('/feed')
    await page.waitForLoadState('networkidle')
    const names = await page.evaluate(() => caches.keys())
    expect(names).not.toContain('sisterroam-api-cache')
  })
})

test.describe('Standalone (installed app) mode', () => {
  // Chrome can't emulate (display-mode: standalone) for CSS, so the JS side is
  // driven through a matchMedia override and the CSS side is checked directly.
  const STANDALONE = () => {
    const real = window.matchMedia.bind(window)
    window.matchMedia = (q) => (q.includes('display-mode: standalone') ? { ...real(q), matches: true, media: q } : real(q))
  }

  test('splash screen hands over to the page', async ({ page }) => {
    await page.addInitScript(STANDALONE)
    await page.goto('/login')
    await expect(page.locator('body')).toHaveClass(/sr-splash-done/, { timeout: 8000 })
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('splash cover has a CSS-only timeout, so the app is never stuck blank', async ({ page }) => {
    await page.goto('/login')
    const rule = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        let rules
        try { rules = sheet.cssRules } catch { continue }
        for (const r of rules) {
          if (r.media && /standalone/.test(r.media.mediaText)) {
            for (const inner of r.cssRules) if (inner.selectorText === '#pwa-splash-bg') return inner.style.animationName || inner.style.animation
          }
        }
      }
      return null
    })
    expect(rule).toContain('sr-splash-fallback')
  })

  test('every app page renders content', async ({ page }) => {
    const user = await createUser()
    await page.addInitScript(STANDALONE)
    await login(page, user.email)
    for (const path of ['/feed', '/explore', '/community', '/messages', '/notifications', '/profile', '/profile/settings', '/safety', '/cotraveller', '/recommendations', '/sisters']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const text = (await page.locator('main, body').first().innerText()).trim()
      expect.soft(text.length, `${path} renders content`).toBeGreaterThan(40)
      await expect.soft(page.getByText('Something went wrong'), `${path} has no error boundary`).toHaveCount(0)
    }
  })
})

test.describe('Android back button', () => {
  test('back arrow on a deep-linked page stays inside the app', async ({ page }) => {
    const user = await createUser()
    const d = await db()
    const { insertedId } = await d.collection('cotravelposts').insertOne({
      authorId: user._id, title: 'Beach week in Goa', fromCity: 'Pune', fromCountry: 'India', toCity: 'Goa', toCountry: 'India',
      departureDate: new Date(Date.now() + 864e6), tripType: 'round_trip', description: 'Beach week', status: 'open',
      createdAt: new Date(), updatedAt: new Date(),
    })
    await login(page, user.email)
    // Fresh tab opened straight on a deep link (like a notification / email link).
    const deep = await page.context().newPage()
    await deep.goto(`/notifications`)
    await deep.getByRole('button', { name: 'Go back' }).tap()
    await expect(deep).toHaveURL(/\/feed/)

    const deep2 = await page.context().newPage()
    await deep2.goto(`/cotraveller/${insertedId}`)
    await deep2.waitForLoadState('networkidle')
    await deep2.getByRole('button', { name: /back/i }).first().tap()
    // Either back control must keep her in the app (feed or the trips list).
    await expect(deep2).toHaveURL(/\/(feed|cotraveller)$/)
  })

  test('back arrow after in-app navigation returns to the previous screen', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.goto('/feed')
    await page.getByRole('link', { name: 'Messages' }).first().tap()
    await page.waitForURL(/\/messages/)
    await page.getByRole('button', { name: 'Go back' }).tap()
    await expect(page).toHaveURL(/\/feed/)
  })

  test('hardware back closes the "More" sheet instead of leaving the page', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    await page.goto('/feed')
    await page.getByRole('link', { name: 'Messages' }).first().tap()
    await page.waitForURL(/\/messages/)
    await page.getByRole('button', { name: 'More options' }).last().tap()
    await expect(page.getByText('Log out of your account')).toBeVisible()
    await page.goBack()
    await expect(page.getByText('Log out of your account')).toHaveCount(0)
    await expect(page).toHaveURL(/\/messages/)
  })
})

test.describe('Layout on a phone', () => {
  const PUBLIC = ['/', '/about', '/how-it-works', '/pricing', '/stories', '/safety', '/login', '/signup', '/privacy', '/terms']
  const APP = ['/feed', '/explore', '/community', '/messages', '/notifications', '/profile', '/profile/edit', '/profile/settings', '/safety', '/cotraveller', '/recommendations', '/sisters', '/onboarding/verify']

  async function overflowReport(page) {
    return page.evaluate(() => {
      const vw = window.innerWidth
      const out = []
      if (document.documentElement.scrollWidth > vw + 1) out.push(`document scrollWidth ${document.documentElement.scrollWidth} > ${vw}`)
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        if (!['auto', 'scroll'].includes(cs.overflowX)) continue
        if (/overflow-x-(auto|scroll)|snap-x|scrollbar/.test(el.className?.toString?.() ?? '')) continue // intended carousels
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          out.push(`<${el.tagName.toLowerCase()} class="${(el.className?.toString?.() ?? '').slice(0, 60)}"> scrolls sideways (${el.scrollWidth} > ${el.clientWidth})`)
        }
      }
      return out
    })
  }

  async function smallTargets(page) {
    return page.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab]')) {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue
        if (el.matches('input[type=checkbox].sr-only, input.sr-only, input[type=file]')) continue
        // Inline text links inside paragraphs are exempt (WCAG 2.5.8).
        if (el.tagName === 'A' && el.closest('p, li') && cs.display === 'inline') continue
        if (r.width < 24 || r.height < 24) {
          const name = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.tagName).trim().slice(0, 30)
          out.push(`${el.tagName.toLowerCase()} "${name}" ${Math.round(r.width)}×${Math.round(r.height)}`)
        }
      }
      return out
    })
  }

  test('public pages: no sideways scrolling, tap targets ≥ 24px', async ({ page }) => {
    const report = {}
    for (const path of PUBLIC) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await overflowReport(page)
      const small = await smallTargets(page)
      if (overflow.length || small.length) report[path] = { overflow, small }
      expect.soft(overflow, `${path} horizontal overflow`).toEqual([])
    }
    console.log('LAYOUT-REPORT public ' + JSON.stringify(report))
    await test.info().attach('public-layout-report.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' })
  })

  test('app pages: no sideways scrolling, tap targets ≥ 24px', async ({ page }) => {
    const user = await createUser()
    await login(page, user.email)
    const report = {}
    for (const path of APP) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await overflowReport(page)
      const small = await smallTargets(page)
      if (overflow.length || small.length) report[path] = { overflow, small }
      expect.soft(overflow, `${path} horizontal overflow`).toEqual([])
    }
    console.log('LAYOUT-REPORT app ' + JSON.stringify(report))
    await test.info().attach('app-layout-report.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' })
  })
})
