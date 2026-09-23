# SisterRoam → Google Play (Trusted Web Activity) Plan

- **Package:** `com.sisterroam.app`
- **Origin:** `https://sisterroam.com` (from `metadataBase` in `src/app/layout.js`)
- **Goal:** Ship the existing Next.js PWA to Google Play as a TWA. Inside the Android app, the $5 sister-verification fee goes through **Google Play Billing**. The website keeps **Dodo Payments**.
- **Status legend:** `[ ]` todo · `[x]` done · `[~]` in progress · `[-]` dropped
- **Written:** 2026-09-23. **Phase 1 (bug fixing) done 2026-09-23**, awaiting review and deploy. We tick items off in this file as we go.

---

## 1. Current system summary

### 1.1 Stack

| Layer | What | Where |
|---|---|---|
| Framework | Next.js **16.2.4** (App Router, JavaScript, built with `--webpack`), React 19.2 | `package.json` |
| Middleware | Next 16 `proxy.js` (not `middleware.js`) | `src/proxy.js` |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | `src/app/globals.css` |
| DB | MongoDB + Mongoose 9 | `src/lib/mongodb.js`, `src/models/*` |
| Auth | NextAuth v5 beta, Credentials provider only (email + password, email OTP at signup), JWT sessions (30 days) | `src/lib/auth.js`, `src/auth.config.js` |
| Media | Cloudinary. Verification media uses `authenticated` delivery. Public images use `moderation:"manual"`. NSFWJS pre-filter loaded from CDN. | `src/lib/cloudinary.js`, `src/lib/nsfw.js` |
| Real-time | SSE (`/api/sse`, `maxDuration 60`) + Pusher | `src/lib/sse.js` |
| Email | Resend | `src/lib/resend.js` |
| Payments | Dodo Payments SDK `dodopayments` | `src/lib/dodo.js` |
| PWA | `next-pwa` 5.6 (Workbox). SW is generated into `public/sw.js`. Manifest is `public/manifest.json` with `start_url: /feed`, `display: standalone`. | `next.config.mjs` |
| Hosting | Vercel (plus one daily cron: `/api/cron/verification-docs-reminder`) | `vercel.json` |
| Analytics | GA4 via `@next/third-parties` | `NEXT_PUBLIC_GA_ID` |

### 1.2 Auth
- **Signup:** `POST /api/auth/signup` stores the pending signup in an `OtpRecord` and emails an OTP. `POST /api/otp/verify` creates the `User` with `emailVerified: true`.
- **Login:** `authorize()` in `src/lib/auth.js` checks the bcrypt password and rejects the login if `!emailVerified`, if the account is banned, or if it is suspended.
- **Session:** JWT. At sign-in the token copies `id, verificationTier, role, isAdmin, onboardingCompleted, onboardingStep, username, fullName, profilePhotoUrl`. The `session()` callback in `auth.config.js` exposes those fields on `session.user`.
- **Keeping the tier fresh:** `AppLayout.jsx` fetches `/api/users` and calls `useSession().update({ verificationTier })` when the DB tier differs from the token. The `jwt` callback merges **whatever the client sends** into the token (`if (trigger === 'update' && session) return { ...token, ...session }`). See Bug B1.
- **Gates:** `requireVerified(session)` and `isVerifiedMember(session)` in `src/lib/apiHelpers.js` read `session.user.verificationTier`, which comes from the JWT. Admin checks read `session.user.isAdmin`, also from the JWT. `proxy.js` handles login, onboarding and `/admin` redirects.

### 1.3 Payment flow (Dodo, current)
1. `/onboarding/verify` (`src/app/(onboarding)/onboarding/verify/page.js`) walks through Country → Documents → Payment. The ID front, ID back and intro video are **held in IndexedDB** (`src/lib/pendingMedia.js`) and are not uploaded yet.
2. **Pay $5:** `POST /api/payments/create`
   - Rejects the request if the tier is already paid/verified/trusted, or if a `completed` `verified_badge` Payment already exists.
   - Reuses a pending session created in the last 2 minutes.
   - Otherwise calls `createCheckoutSession()` with `DODO_PRODUCT_ID_USD`, `metadata: { userId, purpose: 'verified_badge' }`, `return_url=/onboarding/verify?payment=return` and `cancel_url=…?payment=cancelled`.
   - Creates `Payment{status:'pending', amount:5, currency:'USD', dodoPaymentLinkId, checkoutUrl}`.
   - The client then does `window.location.assign(checkoutUrl)`. If the page is running as a standalone PWA, it first sets an `sr_pwa_checkout` cookie for the browser→PWA handoff.
3. **Return:** `?payment=return` calls `POST /api/payments/activate`. That route calls `dodoClient.checkoutSessions.retrieve()` and requires `payment_status === 'succeeded'`. On success it sets `User.verificationTier = 'paid'`, marks the Payment `completed` and creates a notification.
4. **Finalize:** `finalizeAndProceed()` uploads the held media. The upload signature routes are **payment-gated**: they require a completed `verified_badge` Payment. The client then posts to `POST /api/verification` (which creates the `VerificationRequest`), clears IndexedDB and routes on to `/onboarding/profile` or `/feed`.
5. **Webhook:** `POST /api/payments/webhook` checks the signature with `dodoClient.webhooks.unwrap` (standardwebhooks).
   - `payment.succeeded` marks the Payment completed (`amount = total_amount/100`, `dodoPaymentId`) and sets `verificationTier: 'paid'`.
   - `payment.failed` marks the Payment failed and creates a notification.
   - It always returns 200.
6. **Promo (free waiver):** `POST /api/promo/validate`, then `POST /api/promo/redeem`. Redeem claims one use of the `PromoCode` atomically, creates a $0 completed Payment and sets the tier to `paid`.
7. The Dodo environment is chosen by `NODE_ENV`: `production` means `live_mode`, anything else means `test_mode`.

### 1.4 How "verified" is stored (MongoDB)
- **`User.verificationTier`**: `'basic' | 'paid' | 'verified' | 'trusted'`, default `basic`, indexed.
  - `basic`: signed up, not paid. Sent to `/verify`.
  - `paid`: fee paid or waived; KYC is under admin review. The member can read the app, but `requireVerified` blocks write actions.
  - `verified`: an admin approved the KYC in `PATCH /api/verification/[id]` (which sets `verificationTier: 'verified'`, deletes the intro video, notifies and emails).
  - `trusted`: a higher tier that the gates treat the same as verified.
- **`Payment`** (`src/models/Payment.js`) fields:
  - `userId`, `dodoPaymentId` (unique sparse), `dodoPaymentLinkId`, `checkoutUrl`
  - `amount`, `currency` (enum `INR|USD`)
  - `purpose` (default `verified_badge`)
  - `status` (`pending|completed|failed|refunded`)
  - `paidAt`, `webhookPayload`, `promoCode`, `ipAddress`, `userAgent`
  - A "completed `verified_badge` Payment" is the proof of payment used by the upload gates and by the admin users page.
- **`VerificationRequest`** holds the KYC media refs (`idDocument*`, `idDocumentBack*`, `selfieVideo*`, all Cloudinary `authenticated`), plus `status pending|approved|rejected`, `rejectionCount`, `reviewerNotes`, `reviewedBy`.
- **`PromoCode`** holds free-waiver codes (`first_100`, `brand_ambassador`) with `usedCount`/`maxUses`/`usedBy`.

---

## 2. Target architecture (Play Billing inside the TWA)

```
Android app (TWA, com.sisterroam.app, Chrome)
  └─ /onboarding/verify  →  detects Play Billing is available
       ├─ getDigitalGoodsService('https://play.google.com/billing')
       ├─ PaymentRequest([{ supportedMethods: 'https://play.google.com/billing', data: { sku: 'verified_badge' } }])
       └─ purchaseToken ──POST──► /api/payments/play/verify   (new)
                                   ├─ Google Play Developer API: purchases.products.get
                                   ├─ check purchaseState=0, token not seen before, productId matches
                                   ├─ purchases.products.acknowledge (must be within 3 days or Google auto-refunds)
                                   ├─ Payment{provider:'google_play', googlePurchaseToken, googleOrderId, status:'completed'}
                                   └─ User.verificationTier: basic → paid   (conditional update, never downgrade)
       then the same finalizeAndProceed() uploads the held KYC media (unchanged)

Google Cloud Pub/Sub (RTDN) ──push──► /api/payments/play/rtdn   (new)  → refunds/voids → Payment.status='refunded' (+ tier policy)

Website (browser) → unchanged Dodo flow
```

Key choices, to confirm as we go:
- **Product:** one **one-time, non-consumable** in-app product, id `verified_badge`, priced at US$5 with Play's local price conversion. Acknowledge it on the server and **never consume** it.
- **One entitlement, two providers:** the `verified_badge` Payment stays the single source of truth, with a new `provider` field (`dodo | google_play | promo`). All existing gates ("completed verified_badge Payment exists") keep working without changes.
- **Cross-platform:** a member who paid on the web is not asked to pay again in the app (Play allows access to content bought elsewhere). A member who paid through Play is `paid` on the web too.
- **Play Billing detection** (not user-agent sniffing): `'getDigitalGoodsService' in window` **and** the service resolves for `https://play.google.com/billing`. Use a `?source=twa` launch URL and `document.referrer` of `android-app://com.sisterroam.app` only as secondary hints.

---

## 3. Checklist

### Phase 1: Bug fixing ✅ done 2026-09-23 (not yet deployed)

Work was done against the live codebase with production in mind: Dodo is live with real payments, and the web flow must keep working. Every change is backward-compatible with existing members and payments. **Nothing has been committed or deployed yet.** Review the diff, deploy, then do the "After deploy" checks at the bottom of this phase.

#### 1a. User flows covered by end-to-end tests

55 Playwright tests in `e2e/tests/`, run on **Pixel 7 emulation (touch, mobile UA, 412×915)** in Google Chrome. **Result: 55/55 passing** on the final build (incl. messaging formatting, ticks, per-message delete and the security fixes S1–S10).

| Flow | Spec | What is checked |
|---|---|---|
| Signup + email OTP | `01-auth` | Account only created after the OTP, wrong OTP, duplicate email |
| Login / logout | `01-auth` | Feed after login, wrong password, logged-out redirect, **sign-out really ends the session** |
| Session after closing the app | `01-auth` | Persistent 30-day cookie; relaunch with stored cookies stays signed in |
| Security | `02-security` | B1 forged `update()` rejected; tier change picked up from DB; deleted account loses session; photo-URL bypass; review-pending gate |
| Verification + **Dodo checkout** | `03-verification-payment` | Documents held until payment → pay → private uploads → `paid`; declined card; cancel; forged `?payment=return` |
| **Dodo webhook** | `03-verification-payment` | Bad signature 401; redelivery is a no-op; no downgrade of verified; unmatched payment recorded; failed → retry success; other purposes ignored |
| Profile edit + photo | `04-profile` | Save persists; picker offers camera + gallery (no `capture`); photo held for moderation |
| Hosting request + messaging | `05-hosting-messaging` | Explore → request → host accepts → chat both ways; composer on screen |
| Community | `06-…` | Post, like, comment |
| Notifications | `06-…` | List + mark all read |
| Settings | `06-…` | Notification toggle, change password, deactivate/reactivate, **delete account** |
| PWA | `07-pwa` | Manifest + icons; SW registers; offline page; no crash offline; API not cached; standalone splash; back button; no sideways scroll; tap targets |

**How to run:**

```
npm run e2e              # reuses the last e2e build
E2E_BUILD=1 npm run e2e  # rebuild first (after code changes)
```

The tests **never touch production**. The e2e server (`e2e/server.mjs`) uses:
- the separate `sisterroam_e2e` database on the same Atlas cluster (hard guard: it refuses any other database name)
- a local mock for Resend (emails are captured, not sent)
- a local mock Dodo checkout
- intercepted Cloudinary uploads

Note: the Atlas connection from the dev machine drops intermittently, so run with `--retries=2` if you see `ETIMEDOUT`.

#### 1b. Bug list, ranked

**🔴 Blocks users / breaks money or safety: all fixed**

- [x] **B1. Anyone could make herself verified or admin** via `useSession().update()`, skipping the $5 fee on web and Play and getting into `/admin`. The `jwt` callback now ignores the client payload and reloads tier, admin flag and onboarding state from MongoDB. Deleted or banned accounts are signed out on refresh. (`src/lib/auth.js`)
- [x] **N1. "Sign out" didn't sign out.** The `proxy.js` auth wrapper re-issues the session cookie on every request. Prefetches that were in flight when she tapped Sign out restored the session afterwards. Likely also affects the live site. Fixes: proxy no longer runs on `/api/auth/*`, and it no longer sets the session cookie (the session still rolls via `/api/auth/session`). (`src/proxy.js`)
- [x] **B2. A late or retried Dodo webhook downgraded `verified` members to `paid`.** It is now a conditional `basic → paid` only.
- [x] **B3. The webhook could update the wrong Payment row.** It now matches the Dodo payment id first, then the member's latest `verified_badge` checkout. A real payment with no matching row is still recorded.
- [x] **B8. The webhook returned 200 on errors,** so Dodo never retried. It now returns 500, which is safe because the handler is idempotent. Malformed user ids still get 200, so they don't retry forever.
- [x] **B5. Deleting an account left ID photos and the video in Cloudinary.** Wrong delivery type, and the ID back was never deleted. Fixed, with a fallback for older public uploads. Payment rows are **kept** for accounting (decision to confirm, see Phase 2).
- [x] **B6. The service worker cached every signed-in API response for 24 h,** leaking data across members on shared phones. The rule is removed, old caches are purged on load, and private (`/authenticated/`) Cloudinary media is no longer cached.
- [x] **N2. The service worker was never registered, on the live site too.** next-pwa's `register: true` only works in Pages-Router bundles, so there was no offline page and no update handling. It is now registered from `SWUpdater.jsx` (production only).
- [x] **N3. Offline page navigations showed the browser error page.** Custom `runtimeCaching` dropped next-pwa's page route. A network-only navigation route now serves `offline.html` when offline and never caches HTML.
- [x] **N4. Profile-photo moderation bypass.** A bare `profilePhotoUrl` PATCH (any URL, even another site) was shown with no review. New URLs must be our own Cloudinary `sisterroam/profiles` uploads, and they go back to `pending`. (`lib/moderation.js#checkProfilePhotoChange`, both user PATCH routes)
- [x] **N5. Stay-request form shown to `paid` members under review.** They filled in the whole form and then got a 403. They now see the "under review" gate, matching the API.
- [x] **N8. Installed app could stay a blank purple screen** if JS failed (offline, stale chunk), because the splash cover only lifted via JS. A CSS-only fallback now fades it after 4 s.
- [x] **N16. Stale JS chunk after a deploy showed "Something went wrong".** The error boundary now reloads once on `ChunkLoadError`.

**🟠 Annoying: all fixed**

- [x] **B7. Vercel preview deploys would hit Dodo live mode.** They are now forced to test mode. `DODO_ENV` can override. **Production is unchanged (live).**
- [x] **B9. Duplicate "Payment received" notification** (activate + webhook): deduped.
- [x] **B10. "Payment failed" notification linked to `/verify`.** It now links to `/onboarding/verify`, and is only sent on a real pending → failed transition.
- [x] **B4 (partial). Webhook checks `metadata.purpose`.** Product-id check not added (payload shape not verified against a live event, so it's too risky to reject real payments on it).
- [x] **N6. "Deactivate account" did nothing** (`isActive` was dropped). It now hides her (hosts list, DMs, counts already honour it). Signing in reactivates, as the dialog promises.
- [x] **N7. Update prompt:** a new deploy used to **force-reload** the page, which could lose a half-written post. Now it shows an "A new version is available · Refresh" toast. The app also checks for updates when it returns to the foreground (every 30 min at most).
- [x] **N9. Back arrows with no in-app history** (deep link, app launch, return from Dodo) left the app or went back to the Dodo page. The new `useSafeBack(fallback)` keeps her in the app. (9 back buttons, `src/hooks/useSafeBack.js`)
- [x] **N10. Android back button didn't close the "More" sheet**; it left the page. Fixed in `TabBar.jsx`.
- [x] **N11. On-screen keyboard could cover the chat composer and bottom sheets.** Added `interactive-widget=resizes-content` to the viewport. ⚠️ Verify on a real Android phone (can't be emulated).
- [x] **N12. Form labels not linked to inputs** (screen readers). `Input` now generates an id.
- [x] **N13. Tap targets under 24 px:** password eye 16 px, footer icons 18 px, tag-remove 12 px, and post Like/Comment/Share (~20 px, no labels). All enlarged and labelled.
- [x] **N14. Homepage LCP 7.0 s** (1920 px CSS background). Now `next/image` with `priority`: **LCP 3.9 s, performance 61 → 81.**
- [x] **N15. `aria-label` on a plain `div` avatar** (invalid). Now `role="img"`.
- [x] **N17.** Verification result email: HTML-escaped the name and notes; no crash if the member was deleted mid-review.
- [x] **B11. Maskable icons were copies of the square icons.** Regenerated with a safe-zone margin.
- [x] **B14.** HTML escaping, see N17.

**💬 Messaging improvements (requested 2026-09-23): done**

- [x] **M1. Line breaks, paragraphs, bold and italic in chat.** Line breaks used to collapse to one line, and on phones Enter always sent the message, so a line break couldn't even be typed.
  - Bubbles now keep line breaks and render WhatsApp-style `*bold*`, `_italic_` and `~strike~` (as React elements, never HTML).
  - On phones Enter adds a new line; on computers Enter sends and Shift+Enter adds a new line.
  - B / I buttons in the composer; the composer scrolls past 5 lines.
  - Previews, notifications and emails strip the markers. (`src/lib/messageText.js`)
- [x] **M2. Delete one message.** Long-press (touch) or right-click / hover ⌄ (computer) opens Copy, **Delete for me** (any message, hidden only for you via `Message.deletedFor`) and **Delete for everyone** (own messages; removed live from the other person's open chat).
- [x] **M3. WhatsApp-style ticks** on your own messages:

  | Tick | Meaning |
  |---|---|
  | 🕓 | Sending |
  | ✓ | Sent |
  | ✓✓ grey | Delivered: the recipient's app was open and received it (new `Message.deliveredAt`) |
  | ✓✓ blue | Read: she opened the chat |

  Ticks update live over SSE, with polling as a fallback. Logic is in `src/lib/messageStatus.js`.
- Known limits:
  - "Delete for me" on the *latest* message doesn't change the conversation-list preview, which is shared by both people.
  - There's no setting yet to turn read receipts off.
  - Messages still auto-expire after 30 days (existing TTL index).

**🔒 Security review (2026-09-23): code fixes done, account hardening is the owner's job**

What was checked:
- **Every API route:** is a login required, and does it check ownership, participation or admin?
- **Data exposure:** fields returned about members.
- **Injection:** XSS, query injection and JSON-LD.
- **Brute force:** login and password-reset abuse.
- **Secrets:** git history.

Already solid:
- **Messages:** only the two people in a conversation can read them, and each message-API call checks this.
- **Admin data:** all admin, KYC-document and safety-report routes check `isAdmin`, which can no longer be faked (B1).
- **Private media:** ID photos and the intro video are `authenticated` Cloudinary media, reachable only through short-lived signed URLs.
- **Passwords:** bcrypt (cost 12). Reset tokens are random, stored hashed and expire in 1 h.
- **Webhooks:** Dodo and Cloudinary webhooks verify signatures.
- **Secrets:** none found in git history.

Fixed:
- [x] **S1 (critical): stored XSS in travel stories.**
  - The problem: the regex "sanitiser" let `<img onerror=…>`, `<svg onload>` and `javascript:` links through, and any paid member can write a story. The script would run as the reader: it could read her messages and profile, or, for an admin, reach KYC document links.
  - The fix: allow-list sanitising with `sanitize-html` on save **and** on read (`src/lib/sanitize.js`).
- [x] **S2 (high): JSON-LD `<script>` breakout.** A story title containing `</script>` could inject HTML into the public story page. `safeJsonLd()` escapes it on all 4 pages.
- [x] **S3 (high): member profiles were public.** `/api/users/[id]` returned any member's age, city, bio and Instagram/LinkedIn to anyone, logged in or not. It now needs a login and is no longer CDN-cached.
- [x] **S4 (medium): unlimited password guessing.** Now 10 tries per account and 100 per IP per 15 min (`LOGIN_RATE_LIMIT_PER_IP` can override).
- [x] **S5 (medium): reset-email flooding.** Max 3 reset emails per address per hour; the response still never reveals whether an account exists.
- [x] **S6 (medium): story cover could be any URL,** bypassing photo moderation. Same rule as profile photos (N4) now.
- [x] **S7 (low): the story API exposed who saved each story.** Removed.
- [x] **S8 (low): no CSP.** Added a minimal one (`base-uri 'self'; object-src 'none'; frame-ancestors 'none'`). Scripts are deliberately not restricted yet (GA, Dodo, Cloudinary, NSFWJS CDN).

Still open (decisions / later):
- [ ] **Messages are not end-to-end encrypted.**
  - Atlas encrypts data at rest and all traffic is HTTPS.
  - Anyone with database or Vercel access (you, or someone who takes over those accounts) can read them.
  - True E2E encryption is a large project (keys on each device, no admin moderation of DMs).
- [x] **S9. Host profile privacy.** Logged-out visitors no longer get a host's age or Instagram/LinkedIn. The host's street address (`addressLine`) is returned **only to the host herself**; before this it was returned to anyone. `/api/hosts/[id]` is now `private, no-store` (its CDN cache rule was removed from `vercel.json`), and member pages forward the session cookie.
- [x] **S10. Changing or resetting a password signs out every other device.**
  - How it works: `User.passwordChangedAt`, plus each session's `authAt`. Any session that signed in earlier is refused by API routes (the `jwt` callback) and treated as logged out by `proxy.js`, which also clears the stale cookie on page loads.
  - The device that changed the password signs straight back in. A forgotten-password reset signs out every device.
  - Implemented in `src/lib/sessionRevocation.js` with a 30 s cache per server instance.
- [ ] **A strict script CSP (nonces)** needs a staged rollout, in report-only mode first.
- [ ] **Owner account hardening (most important):**
  - Turn on 2-factor authentication for Vercel, MongoDB Atlas, Cloudinary, Dodo, Resend, GitHub, Google (GA, Play Console) and the admin email inbox.
  - Use a long unique password for the SisterRoam admin account.
  - Rotate the Atlas database password if it was ever shared.
  - Keep `.env.local` off shared drives.

**🟡 Cosmetic: not fixed (as instructed)**

- [ ] Colour contrast: teal-on-teal-lighter chips, `text-gray-400` hints, `#888780` on pricing (Lighthouse a11y 94–96). Needs a design decision.
- [ ] Footer uses `<h4>` without `h2`/`h3` (heading order).
- [ ] Disabled "Download on the App Store / Google Play" buttons: their label doesn't match their visible text. Update when the Play listing is live.
- [ ] Inline text links 16–20 px tall ("Forgot password?", "See all", "Add hobbies…").
- [ ] `AppLayout`'s module-level `freshDataCache` survives a sign-out → sign-in as someone else in the same tab (brief wrong avatar/tier until refetch).
- [ ] The web splash shows after Android's own TWA splash (double splash). Handle in Phase 3 (skip the web splash in the TWA).
- [ ] With `resizes-content`, the bottom TabBar rides above the keyboard while typing. Consider hiding it when an input is focused.
- [ ] 17 pre-existing ESLint errors (`react-hooks/set-state-in-effect` ×15, unescaped quotes ×2), all in working code that wasn't touched.

**Still open from the original list**

- [ ] **B12.** `public/sw.js`, `workbox-*.js` and `fallback-*.js` are committed build artifacts. Vercel regenerates them, so it's harmless. To untrack them: add them to `.gitignore` and run `git rm --cached`.
- [ ] **B13.** Widen `Payment.currency` for Play's local currencies → moved to Phase 5.
- [ ] **B15.** Ghost-account cleanup script written, **not run against production**:
  1. Report: `npm run cleanup:ghosts`
  2. Delete: `npm run cleanup:ghosts -- --apply`

  It never deletes anyone who has a Payment or a VerificationRequest.
- [x] **B16.** `next build` passes; lint has no new errors.

#### 1c. Lighthouse (mobile, local production build)

| Page | Perf | A11y | Best practices | SEO |
|---|---|---|---|---|
| `/` | 61 → **81** | 90 → **94** | 100 | 100 |
| `/login` | 96 | 96 → **100** | 100 | 66 (intentional `noindex`) |
| `/pricing` | 89 → **96** | 96 | 100 | 100 |
| `/feed` | 82 | 95 | 96 | 66 (app page, `noindex`) |
| `/community` | 89 | 95 | 96 | 66 |
| `/messages` | 91 | 95 | 96 | 66 |

The remaining a11y points are colour contrast (cosmetic, above). The best-practices 96 on app pages comes from 401 console errors that are most likely caused by how Lighthouse injects the test cookie.

#### 1d. After deploy (manual)

- [ ] **Sign out on the live site on a phone**, then reopen `/feed`. It must ask you to log in (N1).
- [ ] Make one real $5 Dodo payment with a test account (or use a promo code) end to end. Check the Dodo dashboard shows the webhook answered **200**.
- [ ] Open the site, deploy again, and check the "new version available" toast appears (N7).
- [ ] Turn on airplane mode in the installed PWA and open a page: the "You are offline" page should appear (N2/N3).
- [ ] On an Android phone, open a chat and type: the composer stays above the keyboard (N11).
- [ ] **Rollback note for N2:** if the newly registered service worker ever misbehaves:
  1. Replace the `register('/sw.js')` call in `SWUpdater.jsx` with `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))`.
  2. Deploy.

### Phase 2: Play compliance

Payments policy
- [ ] Inside the Android app, the $5 fee goes **only** through Play Billing.
  - In the TWA: hide the Dodo button, remove the "Secure payment via Dodo Payments" copy (verify page and `profile/settings/page.js:596`), and show no link or price comparison that steers users to web checkout.
- [ ] **Promo codes:** hide the free-waiver promo box in the TWA. Redeeming off-Play codes for in-app digital access is a policy risk.
  - Options: use **Play Console promo codes** for the `verified_badge` product, or let ambassadors redeem on the website only.
- [ ] Check the current Play policy on external links and alternative billing (the US changes after Epic v. Google, and user-choice billing in India/EEA). **Don't depend on it for v1.**

Account and data
- [ ] **Account deletion:** in-app delete already exists (`profile/settings` → `DELETE /api/users/delete-account`). Also publish a **public web page** where users can request deletion without the app (required URL in the Data-safety form). Fix B5 first.
- [ ] **Data-safety form.** Declare:
  - name, email, phone, age, gender
  - city/country, and approximate or precise location (SOS/check-ins)
  - photos, videos, **government ID**
  - messages, UGC
  - purchase history (Play)
  - app interactions (GA4)

  Also state that data is encrypted in transit, that deletion is available, and which third parties are involved (Cloudinary, Resend, Pusher, MongoDB Atlas, Vercel, GA4, Dodo on the web only).
- [ ] **Prominent disclosure + consent** before ID/video capture (Personal & Sensitive User Data policy): say why, where it is stored, how long, and who sees it.
- [ ] Update the privacy policy (`src/app/(public)/privacy/page.js`) to cover: Google Play as a payment processor, the Android app, retention of Payment records, and the real deletion behaviour after B5.

UGC and safety
- [ ] **UGC policy:** check that there is in-app reporting for posts, comments, stories and users, **and user blocking** (blocking looks missing; confirm). Terms acceptance at signup and an active moderation queue (moderation already exists).
- [ ] SOS / safety copy must not imply it replaces emergency services. Add an explicit "call local emergency number" line.
- [ ] Target audience **18+ only**. Content rating questionnaire: users interact, UGC, shares location.
- [ ] Women-only membership: describe the eligibility rules clearly in the listing and the terms, and make sure the review team can see why they apply.

Developer account
- [ ] Decide between a **personal and an organization** developer account.
  - Personal accounts created after Nov 2023 must run a **closed test with ≥12 testers for 14 consecutive days** before production access.
  - An organization account needs a D-U-N-S number and avoids that requirement.
- [ ] Merchant/payments profile set up in Play Console (needed to sell in-app products). Sort out tax and bank details.

### Phase 3: Android wrapper (Bubblewrap)
- [ ] Install JDK 17 + Android SDK via `npm i -g @bubblewrap/cli`, then run `bubblewrap doctor`.
- [ ] Run `bubblewrap init --manifest https://sisterroam.com/manifest.json` with:
  - `packageId`: `com.sisterroam.app`, app name "SisterRoam", launcher name "SisterRoam"
  - `host`: `sisterroam.com` (**pick apex vs www once and redirect the other at Vercel**; asset links must be on the exact host)
  - start URL: `/feed?source=twa`
  - theme/nav/background colors `#5D1A8B`, orientation portrait
  - the maskable icon from B11, 512px
  - `fallbackType`: `customtabs`. The WebView fallback has no Digital Goods API.
  - `features.playBilling.enabled: true`
  - `enableNotifications`: decide based on whether web push gets added. Currently realtime is SSE/Pusher only.
  - `enableLocationDelegation: true` (SOS/check-ins use geolocation)
  - `targetSdkVersion`: whatever Play currently requires (check in Console; it rises every August).
- [ ] Camera and microphone for ID/video capture go through Chrome's permission prompt. Test them on-device.
- [ ] Generate the **upload keystore**, back it up in 2+ secure places plus a password manager, and never commit it. Enroll in **Play App Signing**.
- [ ] Version scheme: `appVersionCode` increments on every upload. Note that `bubblewrap update` is needed when the manifest changes.
- [ ] Keep the wrapper project in its own folder or repo (e.g. `android/` or a separate repo). Decide which, and add it to `.gitignore`/docs.
- [ ] Produce a signed AAB with `bubblewrap build`.

### Phase 4: Digital Asset Links
- [ ] Get **both** SHA-256 fingerprints: the Play **app-signing** key (Console → App integrity) and the **upload** key (for local and sideloaded testing).
- [ ] Add `public/.well-known/assetlinks.json` containing `delegate_permission/common.handle_all_urls`, `package_name: com.sisterroam.app` and both fingerprints.
- [ ] Check it is served at `https://sisterroam.com/.well-known/assetlinks.json`:
  - status 200, `Content-Type: application/json`, **no redirect**
  - not intercepted by `proxy.js` (the `.json` static rule currently lets it through; confirm)
  - not cached badly by the SW
- [ ] Validate with Google's Statement List tester or `adb shell pm verify-app-links`, and confirm **no URL bar** appears in the installed app.
- [ ] If both apex and www serve content, publish asset links on both, or redirect one of them.

### Phase 5: Play Billing integration
Play Console
- [ ] Create the in-app product `verified_badge` (one-time, non-consumable), US$5, auto-converted local prices. Review the rounding.
- [ ] Create a Google Cloud service account, link it in Play Console (API access), and grant it "View financial data" and "Manage orders".
- [ ] Store its key in Vercel env vars (`GOOGLE_PLAY_SA_JSON` or split vars) and `PLAY_PACKAGE_NAME=com.sisterroam.app`. Never commit it.
- [ ] Set up **RTDN**: a Pub/Sub topic, then a push subscription to `https://sisterroam.com/api/payments/play/rtdn`, verified with an OIDC token or a shared secret.

Server
- [ ] `Payment` model changes:
  - add `provider` (`dodo|google_play|promo`), with a migration that backfills existing rows
  - add `googlePurchaseToken` (**unique sparse**, which blocks token replay across accounts), `googleOrderId`, `googleProductId`, `acknowledged`
  - widen `currency` (B13)
- [ ] `POST /api/payments/play/verify`:
  - require auth
  - call `androidpublisher.purchases.products.get`, then check `purchaseState===0`, the product id, and that the token is unused
  - call `acknowledge`
  - upsert the Payment
  - apply the conditional tier update `basic→paid`
  - make it idempotent, and return the same shape as `/api/payments/activate` so `finalizeAndProceed()` can be reused
- [ ] `POST /api/payments/play/rtdn`: handle `ONE_TIME_PRODUCT_PURCHASED`, `ONE_TIME_PRODUCT_CANCELED`, and voided purchases (or poll the **Voided Purchases API** from the existing daily cron).
- [ ] **Refund policy decision:** on a Play refund or void, set the Payment to `refunded` and set the tier to `basic` if the member is still `paid`. What happens if they are already `verified`?
- [ ] Update the upload signature gates, the admin users page, the admin delete (`confirmPaid`) and `payments/status` so they treat `google_play` Payments the same as Dodo ones. Most already key on "completed verified_badge", so this is mostly verification.
- [ ] Update `proxy.js` if needed so the RTDN route is reachable without a session. API paths already pass through; confirm.

Client (`/onboarding/verify`, `profile/settings`)
- [ ] `lib/playBilling.js`: `isPlayBillingAvailable()`, `getProductDetails('verified_badge')` (for the localized price string), `purchase()` (PaymentRequest → `purchaseToken`), and `listPurchases()` for recovery.
- [ ] Render the price from `getDetails()` in the TWA instead of the hard-coded `"$5"` (`verify/page.js:197`).
- [ ] **Recovery on launch:** if `listPurchases()` returns an owned `verified_badge` whose Payment isn't recorded (the app was killed mid-flow), POST it to `/verify`. Otherwise the purchase is never acknowledged and Google refunds it after 3 days.
- [ ] Skip the `sr_pwa_checkout` cookie handoff inside the TWA. It is only for the Dodo redirect.
- [ ] TWA without Play Billing available (non-Chrome default browser, old Chrome, sideloaded build): show "Update Chrome / install from Google Play". **Do not** fall back to Dodo inside the app.

### Phase 6: Testing
- [ ] Add license testers in Play Console. Test on the **internal testing** track (Play Billing needs a Play-installed build).
- [ ] Test cards: "always approves", "always declines", "slow card" (pending purchase, `purchaseState=2`: don't grant until it moves to purchased).
- [ ] Happy path: signup → OTP → documents → Play purchase → verify → ack → media upload → admin approve → `verified`.
- [ ] Kill the app right after the purchase sheet closes → relaunch → recovery acknowledges and grants.
- [ ] Replay the same `purchaseToken` from a second account → rejected.
- [ ] Refund from Play Console → RTDN → tier behaves as decided.
- [ ] Cross-platform: pay on the web, then log in on Android → no paywall. Pay on Android, then log in on the web → paid.
- [ ] Regression on the website: Dodo checkout, cancel, failed, processing, webhook retry, promo redeem, PWA handoff cookie.
- [ ] B1 regression: calling `update({ isAdmin:true, verificationTier:'verified' })` from the console changes nothing.
- [ ] Asset links: no URL bar on a clean install; deep links from email (`/messages/...`, `/onboarding/verify`) open in the app.
- [ ] Camera and microphone capture, geolocation (SOS), file upload picker, offline page, back-button behaviour, logout → login as a different user (no cached data, B6).
- [ ] Test devices: low-end Android 10, a recent Pixel, and a Samsung with Samsung Internet as the default browser.
- [ ] Pre-launch report (Play Console) has no crashes or accessibility blockers.

### Phase 7: Store listing
- [ ] App name, short description (80 chars) and full description (4000 chars), framed around safety and verified women travellers, with no unverifiable claims.
- [ ] Graphics: 512×512 icon, 1024×500 feature graphic, and ≥2 phone screenshots (plus 7″/10″ tablet if we declare tablet support). No real members' faces or IDs without consent.
- [ ] Category: Travel & Local. Add a contact email, website and **privacy policy URL**.
- [ ] Content rating questionnaire, target audience (18+), ads declaration (none), Data safety (Phase 2), and financial features declaration (none).
- [ ] **App access for reviewers:** provide a test account that is already verified, plus instructions. Reviewers can't pass KYC, and a blocked review is the most common TWA rejection.
- [ ] Explain in the listing and in the app that the one-time fee pays for identity verification by a human reviewer.

### Phase 8: Launch
- [ ] Closed testing (≥12 testers × 14 days if on a personal account), then fix the feedback.
- [ ] Production rollout staged at 10 % → 50 % → 100 %. Watch Vercel logs for `/api/payments/play/*`, Play Console vitals and orders.
- [ ] Monitoring and alerts: unacknowledged purchases older than 24 h (a cron check), RTDN failures, the verify error rate.
- [ ] Runbook: rotating the service-account key, handling a refund dispute, manual grant/revoke by an admin, updating asset links if the signing key changes.
- [ ] Update this repo's memory/docs with the final architecture.

---

## 4. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | **B1 session escalation.** Anyone can make themselves `verified`/admin without paying, so billing on either platform is meaningless until it is fixed. | Critical → **fixed in code, pending deploy** | Deploy Phase 1. |
| R2 | **Play policy rejection over payments.** Showing Dodo, the web price or the promo box inside the TWA counts as steering. Off-Play promo codes unlocking in-app access. | High | Detect the TWA and hide those surfaces; use Play promo codes; get a policy read before submitting. |
| R3 | **Reviewers can't get past the paywall and KYC.** They can't pay or upload an ID, so the review gets rejected for "restricted access". | High | A pre-verified reviewer account in App access, with clear instructions. |
| R4 | **Refund abuse.** Pay through Play, upload documents, get onboarded, refund within 48 h, still `paid`. | High | RTDN + Voided Purchases handling; decide the downgrade policy (B2-style conditional updates). |
| R5 | **Unacknowledged purchases get auto-refunded after 3 days** if the verify call fails or the app is killed. | High | Server-side acknowledge, `listPurchases()` recovery on launch, a cron alert. |
| R6 | **Sensitive data (government ID + video) in a Play app.** Data-safety and User-Data policy scrutiny; B5 means deletion currently isn't truthful. | High | Fix B5, add a prominent disclosure, keep the privacy policy accurate, add a web deletion page. |
| R7 | **Digital Goods API only works in a Play-installed TWA running on Chrome.** Users whose default browser is Samsung Internet/Firefox, or who have old Chrome, can't pay in-app, and we can't send them to the web. | Medium | A clear "update/enable Chrome" message; `fallbackType: customtabs`; measure how often it happens. |
| R8 | **Revenue and pricing differences.** Play takes 15 % (small-business tier, after enrolling) and converts prices per country, so net is about $4.25 before tax and local prices differ from the website's $5. | Medium | Accept it or set per-country prices; keep the website copy neutral. |
| R9 | **Two payment providers.** Duplicate entitlements (someone pays on both), inconsistent admin views, Payment schema drift. | Medium | One `verified_badge` entitlement with a `provider` field; `create` and `play/verify` both refuse if a completed Payment exists; one migration. |
| R10 | **Asset-links mismatch** (apex vs www, a missing app-signing fingerprint, a redirect): the URL bar shows and the app looks like a browser, which risks a "minimum functionality / webview spam" rejection. | Medium | Canonicalize the host and publish both fingerprints; check on a clean Play install. |
| R11 | **The 12-tester / 14-day closed-test rule** (personal accounts) delays launch by 2+ weeks. | Medium | Recruit testers early, or use an organization account. |
| R12 | **UGC and women-only safety policy.** Missing block-user and report flows, or safety features that over-promise. | Medium | Complete the Phase 2 UGC items; add SOS disclaimers. |
| R13 | **SW caching of authenticated API data (B6)** leaks across accounts on shared devices, a bigger deal in an app. | Medium → **fixed, pending deploy** | Deploy Phase 1. |
| R14 | **Keystore loss.** Can't ship updates if the upload key is lost (Play App Signing lets us reset the upload key, but it takes time). | Medium | Back it up in two places; enroll in Play App Signing. |
| R15 | **Next 16 / NextAuth v5 beta / next-pwa 5.6 is an ageing combination.** `next-pwa` is unmaintained, and a framework upgrade could break the SW or billing in the app. | Low-Med | Pin versions for launch; plan a move to `@serwist/next` later. |
| R16 | **Dodo live mode from preview deployments (B7)** means real charges during QA. | Low-Med → **fixed, pending deploy** | Previews forced to test mode; `DODO_ENV` overrides. |
| R18 | **The service worker is new for live users (N2).** Every member gets a registered SW on the next deploy. | Low-Med | API/HTML never cached; rollback steps in Phase 1d. |
| R17 | **Target API level deadlines.** Play raises the minimum `targetSdk` every August; a stale wrapper blocks updates. | Low | Calendar reminder; run `bubblewrap update` yearly. |

---

## 5. Open decisions
- [ ] Apex `sisterroam.com` or `www`: which host is canonical for the TWA?
- [ ] Personal or organization Play developer account?
- [ ] Play refund of an already-`verified` member: revoke, keep, or flag for admin?
- [ ] Promo/ambassador codes on Android: Play promo codes, or website-only redemption?
- [ ] Web push notifications for Android (a new feature) or not for v1?
- [ ] Where the Bubblewrap project lives (subfolder or separate repo)?
