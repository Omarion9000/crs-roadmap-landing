# PRAVÉ — CRS Roadmap Landing

Express Entry CRS score optimization SaaS. Helps Canadian immigration candidates identify the highest-ROI moves to improve their CRS score and qualify for Express Entry draws.

## Stack

- **Framework**: Next.js 16 App Router (TypeScript)
- **Styling**: Tailwind CSS v4
- **Auth**: Supabase (magic link, implicit flow)
- **Database**: Supabase (Postgres)
- **Payments**: Stripe (live)
- **Email**: Resend
- **Animations**: Framer Motion
- **Analytics**: Vercel Analytics
- **Deploy**: Vercel

## Domains

- `https://www.pravepath.ca` — primary (canonical)
- `https://pravepath.com` — same Vercel project
- Vercel project name: `crs-roadmap-landing`
- Deploy: `vercel --prod` from `/Users/omar/Projects/crs-roadmap-landing`

## Environment Variables (Vercel production)

| Variable | Value / Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.pravepath.ca` |
| `NEXT_PUBLIC_SUPABASE_URL` | set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | set |
| `SUPABASE_URL` | set |
| `SUPABASE_ANON_KEY` | set |
| `SUPABASE_SERVICE_ROLE_KEY` | set |
| `RESEND_API_KEY` | set |
| `RESEND_FROM_EMAIL` | `PRAVÉ <noreply@pravepath.ca>` |
| `CRON_SECRET` | set — required for `/api/cron/scrape-draws` |
| `STRIPE_SECRET_KEY` | live key, set |
| `STRIPE_WEBHOOK_SECRET` | live, set |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | live key, set |
| `OPENAI_API_KEY` | set |

Local `.env.local` only has `VERCEL_OIDC_TOKEN`. All secrets live in Vercel dashboard.

## Key Architecture Decisions

### Auth — implicit flow (important)
- `flowType: 'implicit'` is set on the Supabase browser client (`src/lib/supabase/browser.ts`)
- Magic links deliver tokens in the URL **hash fragment** (`#access_token=...&refresh_token=...`)
- Hash fragments are never sent to the server → auth callback **must** be a client component
- `src/app/auth/callback/page.tsx` is a client component that reads `window.location.hash` and calls `supabase.auth.setSession()`
- There is NO `route.ts` in `/auth/callback` — it was deleted intentionally
- Welcome email is triggered via `POST /api/auth/post-signin` (fire-and-forget from client after auth)

### iOS Webview handling
- Gmail, Instagram, Facebook on iPhone open links in WKWebView — no shared localStorage with Safari
- `isIosWebview()` detection runs client-side in `page.tsx` (UA check: iOS + no `Version/X.X Safari/`)
- If webview detected: shows "Open in Safari" page with `x-safari-https://` deep link + copy button
- Token is NOT consumed when webview is shown

### Auth redirect URL
- `emailRedirectTo` always uses `NEXT_PUBLIC_SITE_URL` as base (never `window.location.origin` from preview deployments)
- `VERCEL_URL` is excluded from the `getAuthBaseUrl()` fallback chain — it resolves to `*.vercel.app` which breaks auth
- Supabase Dashboard must have `https://www.pravepath.ca/auth/callback` in allowed redirect URLs

### i18n
- Language stored in `crs_lang` cookie (`"en"` | `"es"`)
- Context: `src/lib/i18n/context.tsx`
- Translations: `src/lib/i18n/translations.ts`
- Toggle in Navbar (desktop) and hamburger drawer (mobile)

### Draws scraper
- Cron: `GET /api/cron/scrape-draws` — runs every 2 hours via Vercel cron
- Auth: `Authorization: Bearer <CRON_SECRET>` (exact string comparison)
- Primary URL: `rounds-invitations/rounds-invitations-history.html`
- Fallback URL: `rounds-invitations/category-based-selection.html`
- General draws URL: `rounds-invitations.html`
- canada.ca blocks requests from dev machines (403/000) — test via `vercel curl`
- Scraped data saved to `express_entry_draws` table (unique constraint prevents duplicates)

## Supabase Tables

| Table | Purpose |
|---|---|
| `express_entry_draws` | Express Entry draw history scraped from canada.ca |
| `ircc_news` | IRCC news feed |
| `roadmaps` | User roadmap snapshots (profile_snapshot JSON) |
| `subscriptions` | Stripe subscription records (plan, status, user_id) |

## Project Structure (key files)

```
src/
  app/
    auth/callback/page.tsx          # Client-side auth handler (implicit flow)
    api/auth/post-signin/route.ts   # Welcome email (called after setSession)
    api/cron/scrape-draws/route.ts  # canada.ca draws scraper (cron)
    api/health/route.ts             # Health check: { ok, supabase, draws_count }
    api/ai/strategy/route.ts        # OpenAI strategy generation
    api/simulate/route.ts           # CRS simulation
    login/page.tsx                  # Login page (Suspense wrapper)
    simulator/                      # Simulator flow
    dashboard/                      # Authenticated dashboard
    billing/                        # Stripe billing
    crs-calculator/                 # CRS calculator with CLB guide
    not-found.tsx                   # Branded 404 (bilingual)
  components/
    home/PremiumHome.tsx            # Landing page (FAQ, sections, hero)
    home/DrawsNewsFeed.tsx          # Real-time Express Entry draws feed
    Navbar.tsx                      # Navbar with hamburger drawer (mobile)
    auth/LoginPageClient.tsx        # Login form client component
  lib/
    supabase/browser.ts             # flowType:'implicit' — do not change
    supabase/server.ts              # SSR server client
    supabase/admin.ts               # Service role admin client
    authRedirect.ts                 # getAuthBaseUrl, getAuthRedirectUrl
    i18n/translations.ts            # All EN/ES copy
    draws/scraper.ts                # canada.ca HTML scraper
    crs/                            # CRS score calculation logic
```

## Implemented Features

- Landing page with dark design, animated hero, FAQ accordion, pricing section
- Real-time Express Entry draws news feed (DrawsNewsFeed component)
- Full i18n EN/ES across all pages
- CRS Calculator (audited: Skill Transferability, French bonus, Job offer, Canadian education, CLB reference guide, estimate disclaimer)
- Simulator with complete flow for anonymous and authenticated users
- Magic link auth with implicit flow (client-side hash handling)
- iOS webview detection and "Open in Safari" page
- Hamburger menu mobile (drawer with all nav items)
- Branded 404 page (bilingual)
- Welcome email via Resend (dark-branded, bilingual, idempotent via `welcome_sent` flag)
- Vercel Analytics
- Stripe live configured with webhook
- Express Entry draws scraper from canada.ca
- `/api/health` endpoint: `{ ok, supabase, draws_count }`

## Pending

- [ ] Verify Stripe checkout end-to-end with real card
- [ ] Populate Supabase with real draws from canada.ca (scraper returning `scraped: 0` — canada.ca may be blocking; test again from Vercel)
- [ ] Social proof / testimonials section in landing
- [ ] Launch strategy: Reddit r/ImmigrationCanada, r/ExpressEntry, Facebook groups (PGWP)
- [ ] Add `https://www.pravepath.ca/auth/callback` to Supabase Dashboard allowed redirect URLs (if not already done)
- [ ] Customize Supabase magic link email template in Dashboard → Auth → Email Templates (add "open in Safari" note — we can't do this from code)

## Common Commands

```bash
# Deploy to production
vercel --prod

# Check production health
vercel curl /api/health

# Trigger manual draw scrape (replace with real secret from Vercel)
grep CRON_SECRET /tmp/env_prod.txt   # get secret
vercel curl "/api/cron/scrape-draws" -H "Authorization: Bearer <secret>"

# Pull production env vars locally
vercel env pull --environment=production /tmp/env_prod.txt

# Build locally
npm run build
```
