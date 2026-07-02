# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Product:** TB CARE & JOURNEY — a tuberculosis patient-management dashboard for hospital pharmacists (single tenant today, multi-tenant planned). Live at **https://tbjourney.care**. Thai-first UI, built and maintained by one non-developer pharmacist with Claude Code.

---

## Commands

```bash
npm run dev      # Next.js 16 dev server (Turbopack) at http://localhost:3000
npm run dev -- -H 0.0.0.0 -p 3000   # expose on LAN (test from phone / another PC on same wifi)
npm run build    # Production build (SWC)
npm run start    # Run production build locally
```

No test runner or linter is configured. There is no `.env.example` — copy the required vars (below) into `.env.local` manually.

### Testing from another device on the same wifi
Run with `-H 0.0.0.0`, then open `http://<this-PC-LAN-IP>:3000` on the other device. The LAN IP must be listed in `allowedDevOrigins` in `next.config.js` (otherwise Next.js blocks the cross-origin dev/HMR requests). Login and data work because Supabase + R2 are cloud services.

### Required env vars (`.env.local` **and** Cloudflare Pages)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # sb_publishable_* (new key format)
SUPABASE_SERVICE_ROLE_KEY         # sb_secret_*     (server-only, bypasses RLS)
RESEND_API_KEY                    # re_*
ADMIN_EMAIL                       # comma-separated list of admin emails
R2_ACCESS_KEY_ID                  # Cloudflare R2 (patient images + avatars)
R2_SECRET_ACCESS_KEY
R2_BUCKET_PATIENT                 # e.g. tb-patient-images
# (+ R2 account / avatar bucket vars used by lib/r2.ts)
```

> ⚠️ Cloudflare Pages **Runtime** env vars can drop after a deploy — re-check `ADMIN_EMAIL` and R2 keys after deploying. Dev and production point at the **same Supabase project**, so SQL run in the dashboard affects both. Treat dev data as production data.

### Admin / maintenance scripts (`scripts/`)
- `scripts/*.mjs` — one-off Node scripts (`node scripts/<name>.mjs`): `bootstrap-admin`, `clean-test-profiles`, `delete-test-user`, `generate-changelog`.
- `scripts/*.sql` — migrations run **manually** in the Supabase SQL editor. There is no migration tooling; apply in order.

> 🚨 **When Claude creates or edits any `.sql` file in `scripts/`**, the reply MUST surface the full Windows path in a code block **before** any other explanation — e.g. `D:\tb-dashboard-bysirawit\scripts\xxx.sql`. The user opens the path manually; do NOT explain how to run Supabase. Forgotten repeatedly — see user memory `feedback_sql_file_path.md`.

---

## Architecture

### Stack
Next.js 16 App Router + React 19, TypeScript, Tailwind 3, Supabase (Auth + Postgres + Realtime), Resend (email), Cloudflare R2 for image storage (via `aws4fetch`, S3-compatible). Deployed on Cloudflare Pages.

### How the app is served (NO iframe — changed in v0.7.17.0)
Earlier versions rendered the dashboard in an `<iframe src="/app.html">` and transpiled JSX in-browser with Babel. **That is gone.** The flow now:

1. **`app/page.tsx`** — thin Server Component. Auth/status gate (redirect to `/login`, `/pending-approval`, `/rejected`), then renders `<TbAppMount />`.
2. **`app/components/TbAppMount.tsx`** — `next/dynamic` import with `ssr: false` (the legacy code reads `window.*` at module scope, so it cannot run on the server). Shows `V2Skeleton` while loading.
3. **`app/components/TbBundle.tsx`** — chains the imports **in order** (order = evaluation order):
   1. `app/legacy/setup.ts` — sets `window.React`, `window.Chart`, `window.supabase` from npm packages (replaces the old CDN globals)
   2. `app/legacy/tb-data.js` — data + helper functions on `window.*`
   3. `app/legacy/tb-changelog.js` — `window.TB_CHANGELOG` / `window.TB_TAGS`
   4. `app/legacy/tb-monolith.jsx` — the entire dashboard UI; `export default App`
4. SWC compiles the JSX at build time; Next.js/Cloudflare bundler tree-shakes + code-splits.

**`app/legacy/tb-monolith.jsx` is the whole client application** (~9000+ lines): all pages (Dashboard, patient clinical modal, AdminUsersTab, TrashList, patient images, changelog, settings, profile, etc.), all modals, `APP_VERSION`/`BUILD_DATE`, and the mount logic. It still uses `window.*` globals for React/Chart/Supabase for historical reasons — keep that contract when editing. Treat this file as the frontend; the Next.js side is auth + thin API routes.

### Three Supabase clients — pick the right one
- `lib/supabase-browser.ts` — anon key, for Client Components / the legacy app
- `lib/supabase-server.ts` — anon key + cookie bridge, for Server Components / route handlers that should respect RLS
- `lib/supabase-admin.ts` — `createAdminClient()` with **service-role key, bypasses RLS** — server-only, never import from anything that runs in the browser

`lib/resend.ts` uses lazy init (`getResend()`) — never instantiate API clients at module load. Cloudflare's "collect page data" build step runs with env undefined; a module-load `new Resend(process.env.KEY!)` crashes the build. Same rule for R2 clients in `lib/r2.ts`.

### Auth gating — defense in depth
1. **`middleware.ts`** — Supabase session check, status redirects, session-expired detection (writes `tb_session_log` + `tb_logout_log`), throttled `last_active_at` ping (5-min cookie marker).
2. **Server Component checks** — every protected page **also** calls `supabase.auth.getUser()` and re-checks profile status, because **Cloudflare Workers historically did not run Next.js middleware** reliably. Never rely on middleware alone.
3. **API route handlers** — admin actions verify the caller is an admin via the cookie session, then use `createAdminClient()`.

> **Do NOT rename `middleware.ts` to `proxy.ts`** despite the Next.js 16 deprecation warning. Cloudflare Pages does not yet support the Node.js runtime `proxy.ts` requires. The warning is expected.

### Image storage — Cloudflare R2
- `lib/r2.ts` — R2 client (aws4fetch), `r2Delete()`, presign, etc. `lib/patient-image-helpers.ts` — `getRequester()`, `PATIENT_BUCKET`.
- Patient images: table `tb_patient_images` (soft-delete via `deleted_at`). Files stored under a per-patient key; `storage_key` + `thumb_key`. Signed GET URLs (short-lived) — never public.
- API under `app/api/patient/images/`: `presign` (upload), `confirm`, `route`/`all` (list + uploader join), `[id]/url`, `[id]` (DELETE soft + PATCH downscale-on-category-change), `purge` (admin hard-delete all images of a patient from R2 + DB — used when a patient is hard-deleted, to avoid orphan files in R2).
- HEIC/HEIF decode uses **`heic-to/csp`** (avoids `eval`, needs only `wasm-unsafe-eval`). Do **not** switch back to `heic2any` (uses `eval` → blocked by CSP).
- CSP lives in `next.config.js`. When adding an external origin (font, storage, API), add it to the right directive there.

### Database conventions
- `profiles.status` ∈ `pending | approved | rejected` drives redirects in middleware and page checks. `profiles.is_super_admin` is planned for the multi-admin feature.
- Heavy use of append-only log tables (`tb_session_log`, `tb_logout_log`, `tb_login_log`, `tb_password_change_log`, `tb_password_reset_log`, `tb_user_action_log`, `tb_profile_edit_log`, `tb_user_reject_log`). Most carry snapshot columns of user state at event time.
- **Soft-delete / trash for patients** (`scripts/add-trash-system.sql`): `deleted_at`/`deleted_by`/`delete_reason` on `tb_patients`, plus `tb_delete_requests` (user-requested delete → admin approval) and `tb_patients_deleted_log` (audit after hard delete). A `pg_cron` job purges trash older than 60 days.
- **RLS is enabled.** Never write an RLS policy that sub-queries its own table (causes `42P17` infinite recursion) — use `SECURITY DEFINER` functions like `public.is_admin()` / `public.is_approved()` instead. Admin-only operations belong in API routes using `createAdminClient()`, not in relaxed RLS.
- Adding a form field usually means an `alter table ... add column if not exists` — a missing column shows up as `PGRST204` at runtime, not build time.

### API route layout (`app/api/`)
- `auth/*` — login, signout, session lookup, password change/reset
- `admin/*` — approve/reject/restore/deactivate/hard-delete user, set-admin-role, activity log, edit-request review (admin-only; verify caller first)
- `patient/*` — delete-request flow (request / cancel / notify) + `patient/images/*` (see R2 section)
- `profile/*` — self-service profile update, edit-request submission, avatar upload
- `register`, `login-lookup` — public, pre-auth endpoints

---

## Version bumping (read before changing version)

The version string lives in **three code locations** — all must match, in the same commit:

| # | File | What to change |
|---|------|----------------|
| 1 | `app/legacy/tb-monolith.jsx` | `const APP_VERSION = '...'` |
| 2 | `app/legacy/tb-monolith.jsx` | `const BUILD_DATE = '...'` — Thai date, พ.ศ. = ค.ศ.+543 (e.g. `'2 ก.ค. 2569'` for 2026-07-02). **Must equal the actual push date.** |
| 3 | `app/login/page.tsx` | hardcoded `Version X.Y.Z` in the footer under the login form |

Format differs: `tb-monolith.jsx` footer shows `v0.7.19.3`; `login/page.tsx` shows `Version 0.7.19.3`. After editing, grep the repo for both the **new** and **old** version strings — the new one must appear in exactly these three spots (plus the changelog after regeneration), and the old one must be gone from code.

The **changelog is auto-generated from git log** — do not hand-edit `app/legacy/tb-changelog.js`. After committing the version bump with a detailed message, run:

```bash
node scripts/generate-changelog.mjs > app/legacy/tb-changelog.js
```

then commit that as `chore: update commit hash vX.Y.Z`. The generator turns each commit's subject + body into a changelog entry and auto-tags bullets by keyword, so **write detailed commit bodies** — they become the user-facing changelog.

The `ยังไม่เผยแพร่` (not yet released) badge stays until launch — do not remove it without asking.

---

## Conventions

### UI text
- **Thai-first.** Use Thai instead of transliterating English (ยืนยัน not confirm, เช็ค not check, บันทึก not save, กด not click, ฟีเจอร์ where unavoidable, etc.).
- **No `?` question marks in UI strings** anywhere — buttons, headings, modals, labels. Use the statement form: `ยืนยันออกจากระบบ`, not `ยืนยันออกจากระบบ?`.
- Teal is the brand color (`#0d9488` / `#0f766e`).

### Working style (see user memory for the full set)
- The maintainer is a pharmacist with **no coding background** but strong domain logic. Explain in plain Thai with medical analogies; go one step at a time.
- **Never push without asking**, and **never push before the user has tested** the change. Bump version → user tests on localhost → user confirms → then push.
- Before every push: update `CLAUDE.md` + `README.md` to match what changed; re-check Cloudflare env / SQL to run.
- Commit messages are **detailed** (Thai + English, with goal / what changed / files / version sections) — they double as the changelog source.
