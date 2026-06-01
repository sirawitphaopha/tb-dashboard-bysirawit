# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js 16 dev server (Turbopack) at http://localhost:3000
npm run build    # Production build
npm run start    # Run production build locally
```

No test runner or linter is configured. There is no `.env.example` — copy required vars (see below) into `.env.local` manually.

### Required env vars (`.env.local` and Cloudflare Pages)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # sb_publishable_* (new key format)
SUPABASE_SERVICE_ROLE_KEY        # sb_secret_*     (server-only)
RESEND_API_KEY                   # re_*
ADMIN_EMAIL                      # comma-separated list
```

Dev and production point at the **same Supabase project** — SQL run in the dashboard takes effect for both. Treat dev data as production data.

### Admin scripts

`scripts/*.mjs` are one-off Node scripts (run with `node scripts/<name>.mjs`). `scripts/*.sql` are migrations run manually in the Supabase SQL editor — there is no migration tooling.

> 🚨 **When Claude creates or edits any `.sql` file in `scripts/`**, the reply MUST surface the full Windows path in a code block before any other explanation — e.g. `C:\Users\User\tb-dashboard-bysirawit\scripts\xxx.sql`. The user opens the path manually; do NOT explain how to run Supabase. Forgotten repeatedly. See user memory `feedback_sql_file_path.md`.

## Architecture

### Stack
Next.js 16 App Router + React 19, TypeScript, Tailwind 3, Supabase (Auth + Postgres + Realtime), Resend (email). Deployed on Cloudflare Pages via OpenNext.

### The iframe pattern (important)
`app/page.tsx` is a thin Server Component that performs auth/status gating and then renders `<iframe src="/app.html">`. The actual dashboard UI lives in **static files under `public/`**:

- `public/app.html` — loads React 18 UMD, Tailwind CDN, Chart.js, Font Awesome, Sarabun font, **and @babel/standalone**
- `public/tb-app.jsx` — main app shell + pages (Dashboard, AdminSettings, etc.), transpiled in-browser by Babel
- `public/tb-modals.jsx` — modal components
- `public/tb-data.js` — static data / helpers

This is why `next.config.js` CSP allows `'unsafe-eval'` and several CDNs. Treat `public/*.jsx` as the client-side application; the Next.js side is auth + thin API routes only.

### Three Supabase clients — pick the right one
- `lib/supabase-browser.ts` — anon key, used in Client Components
- `lib/supabase-server.ts` — anon key + cookie bridge, used in Server Components / route handlers that should respect RLS
- `lib/supabase-admin.ts` — `createAdminClient()` with **service role key, bypasses RLS** — server-only, never import from anything that runs in the browser

`lib/resend.ts` uses lazy init (`getResend()`) — do not instantiate API clients at module load. Cloudflare build's "collect page data" runs with env vars undefined; module-load `new Resend(process.env.KEY!)` crashes the build.

### Auth gating — defense in depth
1. **`middleware.ts`** — Supabase session check, status redirects (pending → `/pending-approval`, rejected → `/rejected`), session-expired detection (writes to `tb_session_log` + `tb_logout_log`), and throttled `last_active_at` ping (5 min cookie marker).
2. **Server Component checks** — every protected page (e.g. `app/page.tsx`) **also** calls `supabase.auth.getUser()` and re-checks profile status. This is required because **Cloudflare Workers historically did not execute Next.js middleware** reliably. Never rely on middleware alone for auth.
3. **API route handlers** — admin actions in `app/api/admin/*` use `createAdminClient()` after verifying the caller is an admin via the cookie session.

**Do not rename `middleware.ts` to `proxy.ts`** despite the Next.js 16 deprecation warning. Cloudflare Pages does not yet support Node.js runtime middleware, which `proxy.ts` requires. The deprecation warning is intentional; the file header comment documents this.

### Database conventions
- `profiles.status` ∈ `pending | approved | rejected` drives redirects in both middleware and page-level checks.
- Heavy use of append-only log tables (`tb_session_log`, `tb_logout_log`, `tb_login_log`, `tb_password_change_log`, `tb_user_action_log`, `tb_profile_edit_log`, `tb_user_reject_log`, audit/edit-request review tables). Most have snapshot columns capturing user state at the time of the event.
- **Soft-delete / trash system** for patients (see `scripts/add-trash-system.sql`) — delete requests go through admin approval, with a cancel window.
- RLS is enabled. When adding tables, follow existing RLS patterns (see `scripts/fix-rls*.sql`); admin-only operations should be done via `createAdminClient()` in API routes rather than relaxing RLS.

### API route layout
- `app/api/auth/*` — login, signout, session lookups, password change/reset
- `app/api/admin/*` — approve/reject/restore/edit user, activity log, edit-request review (admin-only; verify caller before using admin client)
- `app/api/patient/*` — delete-request flow (request / cancel / notify)
- `app/api/profile/*` — self-service profile update and edit-request submission
- `app/api/register` and `app/api/login-lookup` — public endpoints used pre-auth

## Version bumping (read before changing version)

Every version bump must touch **two files in the same commit**:

1. `public/tb-app.jsx` — `const APP_VERSION = '...'` and `const BUILD_DATE = '...'` (Thai date format, พ.ศ. = ค.ศ.+543, e.g. `'29 พ.ค. 2569'` for 2026-05-29). `BUILD_DATE` must equal the actual push date.
2. `app/login/page.tsx` — hardcoded `Version X.Y.Z` in the footer under the login form.

Format differs between files: `tb-app.jsx` uses `v0.7.10.4`, `login/page.tsx` uses `Version 0.7.10.4`. After editing, grep the repo for both the new and old version strings to confirm — the new version must appear in exactly these two places and the old version must be gone.

The "ยังไม่เผยแพร่" (not yet released) badge stays until launch — do not remove it without asking.

## UI conventions

- UI text is **Thai-first**. Use Thai equivalents instead of transliterating English terms (ยืนยัน not confirm, เช็ค not check, บันทึก not save, etc.).
- **No `?` question marks in UI strings** anywhere (buttons, headings, modals, labels). Use the statement form: "ยืนยันออกจากระบบ" not "ยืนยันออกจากระบบ?".
