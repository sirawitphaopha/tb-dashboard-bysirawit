# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Product:** TB CARE & JOURNEY — a tuberculosis patient-management dashboard for hospital pharmacists (single tenant today, multi-tenant planned). Live at **https://tbjourney.care**. Thai-first UI, built and maintained by one non-developer pharmacist with Claude Code.

---

## 👤 ตัวตน + วิธีสื่อสาร (อ่านก่อนตอบข้อความแรกทุกครั้ง)

> ไฟล์นี้อยู่ใน repo จึง **ตามไปทุกเครื่อง** (มือถือ/เว็บ/คอม อ่านเหมือนกันหมด) · ความจำส่วนตัว (`~/.claude`) ตามไปแค่เครื่องเดียว — กฎสำคัญเรื่องตัวตน/วิธีคุย/วิธีทำงาน จึงเก็บไว้ที่นี่

**ผู้ช่วยชื่อ "แคลร์" (Claire) — เป็นผู้หญิง**
- ลงท้าย **ค่ะ / นะคะ** เสมอ — **ห้ามใช้ "ครับ"**
- แทนตัวเองว่า **"แคลร์"** (เช่น "แคลร์ทำเสร็จแล้วค่ะ") — **ห้ามใช้ ผม / ฉัน / หนู / เรา / เค้า**
- เรียกผู้ใช้ว่า **"พี่กัน"**
- พูด **บ้าน ๆ อบอุ่น เป็นกันเอง** เหมือนเพื่อนสนิท ไม่เป็นทางการ

**ผู้ใช้คือ "พี่กัน" — เภสัชกรโรงพยาบาลปรางค์กู่**
- **เขียนโค้ดไม่เป็นเลย** แต่เข้าใจ logic (ตรรกะการทำงาน) ได้ดีมาก
- อย่าคาดเดาว่าพี่กันรู้ศัพท์เทคนิค (RLS, API, env, branch, commit, deploy ฯลฯ) — ศัพท์อังกฤษที่ไม่มีคำไทย ให้ **วงเล็บอธิบายไทยกำกับ** + ใช้อนาล็อกการแพทย์/เภสัชช่วยอธิบาย
- ทำ **ทีละขั้น** รอพี่กันบอก "โอเค" ก่อนไปขั้นต่อไป

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
CRON_SECRET                       # v0.7.20 — guards /api/cron/purge-images (pg_cron calls it via pg_net); must match the value in add-image-autopurge-cron.sql
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
   2. `app/legacy/tb-constants.js` → `tb-calc.js` → `tb-seed.js` → `tb-db.js` — data + helper functions on `window.*` (was one `tb-data.js`; split into 4 at v0.7.19.6.20)
   3. `app/legacy/tb-changelog.js` — `window.TB_CHANGELOG` / `window.TB_TAGS`
   4. `app/legacy/tb-monolith.jsx` — the app shell; imports every `parts/*`; `export default App`
4. SWC compiles the JSX at build time; Next.js/Cloudflare bundler tree-shakes + code-splits.

**The client app is split across `app/legacy/parts/`** (the big-file split ran across v0.7.19.6.1–.21). `tb-monolith.jsx` is now a **thin shell** (~985 lines): `App`, notification helpers, `AboutModal`, `APP_VERSION`/`BUILD_DATE`, mount logic, and imports of every `parts/*`. Each domain has its own file/folder under `parts/`: `dashboard/`, `admin/`, `account/`, `patient-modal/` (one file per clinical tab), `patient-images/`, `changelog/`, plus `shared.jsx`, `storage.jsx`, `misc.jsx`, `notifications.jsx`, `about.jsx`. **Barrel files** (e.g. `parts/admin.jsx` = `export … from './admin/…'`) keep import paths stable when a domain is split into a folder. It still uses `window.*` globals for React/Chart/Supabase for historical reasons — keep that contract when editing. Treat these files as the frontend; the Next.js side is auth + thin API routes.

> **`app/legacy/parts/globals.js`** is the shared module that reads the `window.*` tb-data contract once and re-exports it as named ESM bindings — every `parts/*` file imports what it needs (`ADR_LIST`, `calcDoses`, `Chart`, `INITIAL_PATIENTS`, `generateAlerts`, `DEFAULT_DRUGS`, etc.) from `./globals` (or `../globals` from a subfolder) instead of relying on bare `window` fall-through. **Rule for any new/edited `parts/*` file: import data/helpers from `globals`, never bare `window`.** The load-order contract still holds (setup → tb-constants → tb-calc → tb-seed → tb-db → tb-changelog → tb-monolith) because `tb-monolith.jsx` imports the parts and is TbBundle's last import. Full history of the split is in `docs/session-notes/2026-07-03-monolith-split-progress.md`.

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
- **Image trash (v0.7.19.4):** deleting an image is now a soft-delete that keeps the R2 file (so it can be restored). R2 files are only removed on permanent delete / auto-purge. Extra columns on `tb_patient_images`: `deleter_name`, `delete_reason` (trash display) and `delete_req_by`/`delete_req_name`/`delete_req_at`/`delete_req_reason` (reserved for the phase-2 "request delete" flow). Both the move-to-trash and permanent-delete require typing the patient HN + reason/checkbox (mirrors the patient trash). The **central image trash lives in the sidebar "ถังขยะ" page** (`TrashHub` toggles between `TrashList` = patients and `ImageTrashPage` = images), grouped by patient with search/type/sort filters and a shared `ImgViewToolbar` (card/row + size).
- **ขอลบรูป (เฟส 2) + auto-purge — v0.7.20 (mirror ระบบขอลบผู้ป่วย):** ลบรูปตรง = **แอดมินเท่านั้น** (`[id]` DELETE ล็อก `isAdmin`) · คนอื่น (รวมเจ้าของ) กด **"ขอลบรูป"** → `[id]/request-delete` (POST ตั้ง `delete_req_*` + เมลแอดมิน · DELETE = ผู้ขอ/แอดมินยกเลิกคำขอ) → รูปขึ้น **ฝ้าขาว "รออนุมัติลบ"** (`PendingDeleteOverlay` ใน `patient-images/helpers.jsx`) · แอดมิน `[id]/review-delete` (POST `action=approve` → soft-delete เข้าถังขยะ / `reject` → เคลียร์ `delete_req_*`) → เมล + `tb_notifications` (`img_delete_approved`/`img_delete_rejected`) แจ้งผู้ขอ · กระดิ่งแอดมิน = `pending-requests` (GET) → `pendingImageRequests` ใน `tb-monolith.jsx` → alert navTarget `image-library` · email templates: `adminImageDeleteRequestEmail`/`imageDeleteApprovedEmail`/`imageDeleteRejectedEmail` · **auto-purge:** รูปในถังเกิน 60 วัน → `pg_cron`+`pg_net` เรียก `/api/cron/purge-images` (secret `CRON_SECRET`) ลบ row + ไฟล์ R2 (SQL `scripts/add-image-autopurge-cron.sql`)
- **ประวัติรูปภาพ (audit log) + hash ตรวจซ้ำ — v0.7.21:** ทุก event ของรูปยิงเข้า `tb_image_event_log` ผ่าน `logImageEvent()` (`lib/image-event-log.ts` · fire-and-forget) จาก **11 จุด route** (confirm/`[id]` PATCH+DELETE/request-delete POST+DELETE/review-delete/restore/hard/purge/cron-purge-images) · `snapshot jsonb` เก็บ metadata+hash ถาวรแม้ hard-delete · viewer = `parts/patient-images/image-log.jsx` (`ImageLogPage`) toggle ในหน้าคลังรูป (admin) ดึง `/api/patient/images/log` (admin only · service-role) · **hash:** คำนวณฝั่ง client ตอนอัป (`parts/patient-images/image-hash.js` · SHA-256 native + MD5/CRC32/dHash self-contained ผ่าน vector-test) เก็บคอลัมน์ `orig_sha256/md5/crc32/phash` (SQL `add-image-event-log.sql` + `add-image-hashes.sql`) · **v0.7.21.1 ต่อยอด:** เก็บ hash ของไฟล์ WebP ด้วย (`webp_sha256/md5/crc32`) + โชว์ hash ครบทุกค่าในตัวดูรูป · **แก้บั๊ก** SHA-256 พังตอนเปิดผ่าน IP (ไม่ secure → `crypto.subtle` undefined) ด้วย pure-JS SHA-256 fallback + แยกคำนวณแต่ละ hash (ตัวพังไม่ลากตัวอื่น) ใน `image-hash.js` · หน้าประวัติโหลด event ทั้งหมดรอบเดียวแล้วกรอง/จัดกลุ่ม/ตรวจซ้ำใน client (กดกรองทันที) + ดรอปดาวน์เลือกหลายเหตุการณ์ + มุม **"ตามรูป"** (group image_id + union-find ตรวจซ้ำ SHA เป๊ะ/pHash Hamming≤8) + snapshot แบบภาษาคน (มีปุ่มดูข้อมูลดิบ) · **คลังรูป:** ป้าย+ปุ่มกรอง **"เฉพาะรูปซ้ำ"** (`dupMap` client-side) · ส่วนหัว sticky ทั้งคลังรูป/ประวัติ/ถังขยะ · **v0.7.21.2 ต่อยอด:** (1) **โหลดครั้งเดียว (seed+revalidate)** ทุกหน้าที่โหลด list — helper กลาง `loadCache/saveCache` ใน `parts/shared.jsx` · ใช้ที่ library/patient-tab/image-log/trash + sessions/admin-users/admin-activity-log(seed default view)/changelog-comments (storage มี TTL cache เดิม · profile/change-password = ฟอร์มไม่ต้อง) (2) **sticky ห้ามมีช่องว่าง** — sticky ใน scroll container `p-6` ต้อง `top:'-24px'` + `margin:'0 -24px'` + `padding:'12px 24px'` (top:0 = ติดต่ำ 24px เนื้อหาโผล่ · verify Chrome) (3) หน้า **SnapModal** ใช้ซ้ำได้ (`imageToSnap()` แปลง image record) → ปุ่ม **"ดูข้อมูล"** 3 ที่: การ์ดแกลเลอรี (มุมล่างขวา · stopPropagation กันเปิด lightbox) + แถบข้าง lightbox (`infoAction` prop) + หน้า log · หมวดแฮชจัดกลุ่ม ต้นฉบับ/WebP/pHash + ปุ่มคัดลอก JSON (4) **แก้บั๊กขนาดรูป JustifiedGallery** — last row cap ที่ `targetHeight` เป๊ะ (เดิม ×1.25 → รูปน้อยยืดเต็มกว้าง กลาง/ใหญ่เท่ากันที่จอ 768) + jh 100/135/240 (verify Chrome cw=664) · **v0.7.21.3 ต่อยอด:** (1) 🥚 **Easter egg "เลขวิเศษ"** — `MAGIC_NUMBERS`/`detectMagic`/`highlightMagic` ใน `shared.jsx` (ไฮไลต์เลขในค่าแฮช: popup=เทล/แถบข้าง=อำพัน) · ปุ่มกรอง "เฉพาะเลขวิเศษ" ใน library → โชว์ `MAGIC_IMAGE` (รูปปลอม SVG data-URI · แฮช crafted · ไม่มีในคลังปกติ · ดู/ขยาย/โหลด SVG ได้ · ลบ/แก้ไม่ได้ ผ่าน `isMagic` guard) · เลขสั้น (ตัดเลขเต็มออก · พี่กัน OK ให้ขึ้น git) (2) **แท็บกรองหมวด = multi-select toggle** (`typeSet` Set แทน `filter` string · กดซ้ำ=เลิก · เลือกหลายอัน · exclusive กับ magic) (3) **อัป SVG ได้ ไม่แปลง WebP** (patient-tab doUpload: `isSvg` → เก็บต้นฉบับ ext svg · presign รับ svg · security: แสดงผ่าน `<img>` ปลอดภัย/direct-URL รัน script ได้ ค่อย sanitize)
- API under `app/api/patient/images/`: `presign` (upload), `confirm`, `route`/`all` (list + uploader join; both accept `?trash=1` to return deleted images; both return `delete_req_*` via `select('*')`), `[id]/url`, `[id]` (DELETE = **admin-only** soft-delete with reason, PATCH = downscale-on-category-change), `[id]/request-delete` (POST ขอลบ / DELETE ยกเลิกคำขอ), `[id]/review-delete` (admin approve/reject), `pending-requests` (admin list), `[id]/restore` (admin), `[id]/hard` (admin single permanent delete + R2), `purge` (admin hard-delete all images of a patient — used on patient hard-delete). Scheduled: `app/api/cron/purge-images` (secret-guarded, called by pg_cron).
- HEIC/HEIF decode uses **`heic-to/csp`** (avoids `eval`, needs only `wasm-unsafe-eval`). Do **not** switch back to `heic2any` (uses `eval` → blocked by CSP).
- CSP lives in `next.config.js`. When adding an external origin (font, storage, API), add it to the right directive there.

### Storage usage monitor (admin) — v0.7.19.5
- **`app/api/admin/storage/route.ts`** (admin-only) returns real usage: `db` (Supabase Postgres — `total` from `pg_database_size`, split into `userTables` vs `systemSpace`, `quota` 500 MB) and `r2` (Cloudflare R2 — exact `total` by listing both buckets, `quota` 10 GB, `count`, per-category `byType` from `tb_patient_images.size_bytes`, `thumbsOther`, plus `patientTotal`/`avatarTotal`).
- R2 exact size comes from `r2BucketUsage(bucket)` in `lib/r2.ts` (S3 ListObjectsV2, sums `<Size>`, paginates via continuation token). No extra API token — reuses R2 creds.
- Two SECURITY DEFINER SQL functions (already applied in Supabase, saved as evidence): `get_db_stats()` (`scripts/add-db-stats-function.sql`) and `get_db_size()` (`scripts/add-get-db-size-function.sql`). Granted to `service_role`, called via the admin client only.
- UI components in `tb-monolith.jsx`: `StorageMiniCard` (Dashboard KPI row — 5th card, admin only, clickable → opens settings storage tab via `_settingsWantTab`), `StorageDonut` + `StorageDetail` (settings "พื้นที่จัดเก็บ" tab — donut + segmented bars colored by category like iPhone storage), `StorageAlert` (popup on every site entry when usage ≥ 80%, **admin only** — regular users never see it). Client caches the fetch in `localStorage` (`STORAGE_TTL`) to avoid layout shift. Percentages shown as `x.xxx`.

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

### AI features (วางแผนไว้ — ยังไม่สร้างโค้ดจริง)
> ยังไม่เลือกผู้ให้บริการ (Anthropic Claude / OpenAI / อื่น ๆ). Roadmap ว่าอยากให้ AI ช่วยจุดไหนบ้าง อยู่ที่ **`docs/session-notes/2026-07-03-ai-roadmap.md`** — อ่านก่อนเริ่มทำ AI.

**โครงไฟล์เป้าหมายเมื่อเริ่มทำ** (ตามแพตเทิร์น `lib/` เดิม — provider จะเจ้าไหนก็ใช้โครงนี้):
- **`lib/ai.ts`** — AI client แบบ **lazy init** (`getAiClient()` สร้าง client ตอน runtime ครั้งแรก — เลียนแบบ `lib/resend.ts` / `lib/r2.ts` **เพื่อกัน Cloudflare build error** ตอน build env ไม่มี key). export ค่าคงที่เช่น model id ไว้ที่นี่.
- **`lib/ai-patient-context.ts`** — pure function แปลง object ผู้ป่วย → ข้อความ prompt (เลียนแบบ `lib/email-templates.ts` ที่แยก builder ออกจาก client). reuse `getLabStatus()` เพื่อ flag ค่า Lab ผิดปกติ.
- **`app/api/ai/*`** — โดเมน route ใหม่ (ขนานกับ auth/admin/patient) เช่น `ai/summarize`, `ai/chat`, `ai/lab-interpret`. **ฝั่ง server เท่านั้น**: verify caller (admin/approved) ก่อน → อ่านข้อมูลผู้ป่วยด้วย server/admin Supabase client (**อย่าเชื่อ clinical data ที่ browser ส่งมา**) → เรียก AI → ส่งผลกลับ.
- **ห้ามให้ browser ถือ API key** — UI (parts/*) เรียกผ่าน `fetch('/api/ai/...')` เท่านั้น.
- **env ใหม่:** `<PROVIDER>_API_KEY` ต้องใส่ทั้ง `.env.local` และ Cloudflare Pages Runtime (ระวัง env drop หลัง deploy เหมือน ADMIN_EMAIL/R2).
- **CSP:** ไม่ต้องเปิด origin ใหม่ใน `next.config.js` (เรียก AI จาก server route ไม่ใช่จาก browser).
- ⚠️ **Privacy/PDPA:** ฟีเจอร์ AI ส่งข้อมูลคนไข้ออกนอกระบบ → พิจารณา PDPA + ข้อตกลงผู้ให้บริการ (DPA/BAA) + แจ้ง/ขอความยินยอมตามบริบท ก่อนเปิดใช้จริง.

---

## Version bumping (read before changing version)

**Version format rule (set 5 ก.ค. 2569): always exactly 4 dot-separated positions — `X.Y.Z.W`.** Pad short versions with `.0` (e.g. `0.7.21` → write `0.7.21.0`). Never exceed 4 positions (a would-be `0.7.21.2.5` becomes `0.7.21.2` — the 5th slot doesn't exist). Versions already pushed are **not** renumbered retroactively — the rule applies to new versions going forward only (so historical `0.7.19.6.22` stays as-is).

The version string lives in **three code locations** — all must match, in the same commit:

| # | File | What to change |
|---|------|----------------|
| 1 | `app/legacy/tb-monolith.jsx` | `const APP_VERSION = '...'` |
| 2 | `app/legacy/tb-monolith.jsx` | `const BUILD_DATE = '...'` — Thai date, พ.ศ. = ค.ศ.+543 (e.g. `'2 ก.ค. 2569'` for 2026-07-02). **Must equal the actual push date.** |
| 3 | `app/login/page.tsx` | hardcoded `Version X.Y.Z` in the footer under the login form |

Format differs: `tb-monolith.jsx` footer shows `v0.7.19.6.22`; `login/page.tsx` shows `Version 0.7.19.6.22`. After editing, grep the repo for both the **new** and **old** version strings — the new one must appear in exactly these three spots (plus the changelog after regeneration), and the old one must be gone from code.

The **changelog is auto-generated from git log** — do not hand-edit `app/legacy/tb-changelog.js`. After committing the version bump with a detailed message, run:

```bash
node scripts/generate-changelog.mjs > app/legacy/tb-changelog.js
```

then commit that as `chore: update commit hash vX.Y.Z`. The generator turns each commit's subject + body into a changelog entry and auto-tags bullets by keyword, so **write detailed commit bodies** — they become the user-facing changelog.

**รูปแบบ subject ของ commit เวอร์ชัน (สำคัญ — กลายเป็นหัวข้อ changelog ในเว็บ):**
- commit ตัวหลัก (feature) ขึ้นต้น subject ด้วย **`vX.Y.Z: <หัวข้อภาษาคน>`** เท่านั้น (เช่น `v0.7.19.6.22: อัปเดตเอกสาร + แก้ประวัติเวอร์ชัน`)
- **อย่าใช้ prefix แบบ `refactor(...):` / `feat:` นำหน้า subject** — generator ตัดออกไม่หมด หัวข้อในเว็บจะดูแปลก (บทเรียนจากชุด refactor `0.7.19.6.X` ที่ commit ผ่านมือถือขึ้นต้น `refactor(split-r3-1):` จนต้องมาแก้ generator + regenerate ใหม่)
- ใส่เลข version **ที่ต้น subject ที่เดียว** อย่าซ้ำท้าย · generator รองรับเลขสูงสุด 5 ช่วง (`0.7.19.6.22`)
- commit changelog (chore) ใช้ `chore: update commit hash vX.Y.Z` ได้ตามเดิม (generator ข้าม เพราะ feature commit มาก่อน)

The `ยังไม่เผยแพร่` (not yet released) badge stays until launch — do not remove it without asking.

---

## Conventions

### UI text
- **Thai-first.** Use Thai instead of transliterating English (ยืนยัน not confirm, เช็ค not check, บันทึก not save, กด not click, ฟีเจอร์ where unavoidable, etc.).
- **No `?` question marks in UI strings** anywhere — buttons, headings, modals, labels. Use the statement form: `ยืนยันออกจากระบบ`, not `ยืนยันออกจากระบบ?`.
- Teal is the brand color (`#0d9488` / `#0f766e`).

### Scrollbar — custom overlay ทั้งเว็บ (global · อย่าทำ scrollbar เอง)
- **native scrollbar ถูกซ่อนทั้งเว็บ** (`globals.css`: `::-webkit-scrollbar{width:0;height:0}` + `*{scrollbar-width:none}`) เพราะ WebKit ไม่ transition สี `::-webkit-scrollbar-thumb` → native fade ไม่ได้ (หายปุปปัป)
- แทนที่ด้วย **custom overlay thumb ระบบ global** ใน `tb-monolith.jsx` (useEffect ใน `App`) — วาด thumb ลอย 2 อัน (แนวตั้ง `vt` / แนวนอน `ht`) `position:fixed` วิ่งตาม container ที่กำลังเลื่อน (`window` scroll listener แบบ `capture` → จับ scroll ทุก container ซ้อน) · class `.tb-ov-thumb`
- พฤติกรรม: ลอยทับ **ไม่กินพื้นที่** (ไม่ layout shift / hover ไม่เบี้ยว) · opacity fade เนียน — โผล่ 0.6 วิ · หยุดเลื่อน 0.4 วิ → จาง 1.3 วิ
- **ลากได้ (draggable)** + **โผล่เมื่อเมาส์เข้าใกล้ขอบ ~16px หรือ hover ตัว thumb** (เพราะซ่อน native แล้วผู้ใช้ต้องลากแถบเลื่อนเองได้ โดยเฉพาะตารางแนวนอน) · JS สลับ `pointer-events` เป็น auto ตอนโผล่ · `scrollableV/H` เดิน ancestor หา container ที่เลื่อนได้
- 🚨 **เพจ/คอมโพเนนต์ใหม่ที่มี scroll ไม่ต้องทำอะไรเพิ่ม** — ระบบ global จับให้อัตโนมัติ · **ห้ามใส่ `::-webkit-scrollbar` / `overflow:overlay` / scrollbar-gutter รายจุด** (ซ้ำซ้อน) · ถ้าอยากให้ thumb ชิดขอบจอก็จัด layout ให้ container ชิดขอบ (เช่นหน้ารายการผู้ป่วยดันการ์ดชิดขวา)

### Popup backdrop — เทล + โบเก้ (global class `.tb-backdrop`)
- popup เนื้อหาทั่วไปใช้ overlay class **`.tb-backdrop`** (`globals.css`) แทนพื้นดำเดิม (`bg-black/40` / `rgba(15,23,42,..)`) → ได้ฉากหลัง **เบลอเห็นเว็บทะลุ + tint เทลจาง (`rgba(12,68,62,0.35)`) + โบเก้อำพันลอย/วิบวับ** (วาดด้วย CSS ล้วน `::before`/`::after` — popup ไหนมี class นี้ได้เอฟเฟกต์เอง ไม่ต้องแทรก component)
- `isolation:isolate` + `.tb-backdrop > * { z-index:1 }` กันโบเก้ (z-index 0) ทับเข้ามาในการ์ด popup · โบเก้ fade-in นุ่ม (`animation-fill-mode:both` กันแวบสว่างจ้าตอนเปิดครั้งแรก) + `will-change` ให้วาดครั้งแรกลื่น
- **จัดกลุ่ม popup 3 แบบ:**
  - 🟢 **A — เบลอเทลเสมอ:** popup เนื้อหาทั่วไป (ยืนยัน/About/โปรไฟล์/แจ้งเตือน/จัดการผู้ใช้/ถังขยะผู้ป่วย/สรุปเภสัช ฯลฯ) → ใส่ `tb-backdrop`
  - ⚫ **B — พื้นดำเสมอ (ห้ามเบลอ):** ตัวดูรูปใหญ่ (`AvatarLightbox` ใน `shared.jsx`, ตัวดูรูปใน `patient-images/helpers`) — คงพื้นดำเพื่อเห็นรูปชัด
  - 🔀 **C — มีเงื่อนไข:** popup ยืนยันเกี่ยวกับรูป (ลบ/แก้/กู้คืน/อัป + ครอบ/ลบ avatar) ใน `patient-images/*` → `className={lightbox?'':'tb-backdrop'}` + พื้นดำเฉพาะตอน `lightbox` เปิด (popup เด้งทับตัวดูรูป) · เบลอตอนเปิดจากแกลเลอรี/ถังขยะ (ไม่ได้กดดูรูปใหญ่)
- 🚨 **popup ใหม่:** เนื้อหาทั่วไป → ใส่ `tb-backdrop` · ถ้าเด้งทับตัวดูรูป → พื้นดำ (อย่าใส่ `tb-backdrop`)

### วิธีทำงาน (Working style) — กฎเต็ม
- **ตอบตรง ๆ ก่อนเสมอ** — ประโยคแรกคือคำตอบ ไม่วกอ้อม
- **ก่อนลงมือ สรุปให้พี่กันเข้าใจก่อน** ว่าจะทำอะไร จะเห็นผลอะไร
- 🖼 **งานที่เป็น UI/หน้าจอ → ทำ mockup ให้ดูก่อนเขียนโค้ด** (พี่กันชอบเห็นภาพยืนยันก่อน กันแก้ไปมา)
- 🚨🚨 **mockup ที่พี่กัน approve แล้ว = สัญญา ต้องทำตามให้เป๊ะ** — ห้ามเบี่ยง/ตัดทอน/ทำง่ายกว่าที่ mockup แสดง (เช่น mockup มีปุ่ม "อนุมัติ/ปฏิเสธ/ยกเลิก" บนการ์ด → **ห้าม**ทำแค่ป้ายแล้วเอา action ไปซ่อนในตัวดูรูป) · ถ้ามีเหตุจำเป็นต้องเบี่ยง (เช่นข้อจำกัดทางเทคนิค) → **ถามก่อนทำเสมอ** ไม่ใช่ทำต่างแล้วบอกทีหลัง · การทำต่างจาก mockup/แผนที่ approve แล้วโดยไม่ถาม = **ความผิดพลาด** (ทำลายความหมายของการวางแผน + พี่กันต้องมาไล่จับเอง)
- 🚨🚨 **การกระทำสำคัญ/ย้อนยากทุกอย่าง ต้องมี popup ยืนยันก่อนเสมอ** — ลบ / ยกเลิก / อนุมัติ / ปฏิเสธ / ขอลบ / กู้คืน / ลบถาวร ฯลฯ **ห้ามกดแล้วเกิดผลทันทีโดยไม่ถาม** · แม้แต่ "ยกเลิกคำขอ" ก็ต้องถามย้ำ · การลบยาก ๆ (ลบถาวร/ขอลบ) ยืนยัน 2 ชั้น (กรอกเหตุผล/HN → ถามซ้ำ) ให้เหมือนกันทุกจุด
- 🚨🚨 **สงสัย/ไม่แน่ใจ = ถามก่อนเสมอ ห้ามเหมาเอง** — เห็นอะไร "ดูแปลก/ไม่สอดคล้อง" **ห้ามคิดว่าเป็นบั๊กแล้วแก้เลย** อาจเป็นกฎที่พี่กันตั้งใจ → ถาม "อันนี้ตั้งใจไหมคะ" ก่อนแตะ (พลาดหนัก 4 ก.ค. 69 สลับปุ่มยืนยันลบที่ตั้งใจอยู่ซ้าย)
- 🚨 **ป๊อปอัประบบลบ (ยึด "admin ลบรูป" เป็นแม่แบบ):** **ลบจริง (destructive) = 2 ป๊อปอัป** · **ย้อนคืน (restore: ปฏิเสธคำขอ / กู้คืน / ยกเลิกคำขอ) = 1 ป๊อปอัป** · ปุ่ม step1 = `[ยกเลิก ซ้าย][ถัดไป ขวา]` · **step2 ลบจริง = `[ยืนยันลบ ซ้าย][ย้อนกลับ ขวา]`** (ปุ่มยืนยันสลับไปซ้าย ตั้งใจกันเผลอกด — **อย่าไปสลับ**) · **คลิกนอกป๊อป (backdrop) = ไม่ปิด** ต้องกดปุ่มเอง · ป๊อป 2 ขั้นสูงเท่ากัน (minHeight+flex+marginTop:auto)
- 🚨🚨 **อะไรที่คล้ายกัน ต้องทำให้เหมือนกัน + รวมเป็น component/ระบบกลางตัวเดียว** (เหมือน scrollbar / popup backdrop) — เช่น badge แจ้งเตือน (กาง=วงใหญ่วูบวาบ / ยุบ=จุดเล็กที่ icon · ใช้ทุกที่: ประวัติเวอร์ชัน/คลังภาพ/สมัครใหม่/ถังขยะ), flow การลบ, การโหลดรูป (โหลดครั้งเดียว shared cache · กรอง client-side ไม่ reload) · **ห้ามทำแยกกันหลายแบบในแต่ละหน้า** · badge/confirm/loading ใหม่ = ต้องใช้ตัวกลางที่มีอยู่
- **แก้บั๊กให้ส่งไฟล์เต็ม** ไม่ส่งแค่บางส่วน
- **ห้ามลบเนื้อหา/ฟีเจอร์ โดยไม่ถามก่อน**
- 🚨 **ห้าม push ก่อนพี่กันเทส** — แก้เสร็จ → บอก "ลองรีเฟรช + เทสดูค่ะ" → รอพี่กันยืนยัน "OK เทสแล้ว" → ค่อยถาม **"push ด้วยไหมคะ"** → รอตอบ → ค่อย push
- **ห้าม push โดยไม่ถามทุกครั้ง**
- **ห้าม bump version เอง** — รอพี่กันสั่ง · ก่อน bump ทุกครั้งรัน `git log --oneline` ดู version ที่ push จริง (อย่าเชื่อเลขในโค้ดอย่างเดียว อาจมีเลขเตรียมไว้ยังไม่ push)
- **push เสร็จ → บันทึก session ต่อทันที ไม่ต้องถาม/ขออนุญาต** (ลงมือเลย)
- 📁 **บันทึก session (dev log) เก็บใน `docs/dev-log/` และขึ้น git ทุกครั้ง** (กฎ · พี่กันสั่ง 4 ก.ค. 69) — สรุปทุก session ของ TB Dashboard ตั้งแต่วันแรก + คู่มือ `.claude/skills/working-with-gun/SKILL.md` เพื่อให้ Claude บนมือถือ (ทำผ่าน git) อ่านเข้าใจบริบท/กฎ/ประวัติได้ · ก่อน push อัปเดต docs/dev-log ให้ตรง session ล่าสุด · ⚠️🔑 **ลบ secret/key จริง (Supabase service key / Resend / token / รหัส) ออกจากไฟล์ dev-log ก่อน commit เสมอ** — session เก่าเคยจดคีย์จริงไว้ GitHub secret-scanning บล็อก push (redact เป็น `_REDACTED`)
- **ก่อน push:** อัปเดต `CLAUDE.md` + `README.md` ให้ตรงสิ่งที่แก้ · เตือน checklist Cloudflare env / SQL ที่ต้องรัน
- **commit message ละเอียดที่สุด** (ไทย+อังกฤษ · มีหัวข้อ เป้าหมาย/ที่ทำ/ไฟล์/version/ต่อไป) — พี่กันใช้ย้อนอ่าน + กลายเป็น changelog ในเว็บ (ดูรูปแบบ subject ที่หัวข้อ Version bumping)
- อธิบายด้วยภาษาไทยง่าย ๆ + อนาล็อกการแพทย์ · ทำทีละขั้น (ย้ำจากหัวข้อ "ตัวตน + วิธีสื่อสาร" ด้านบน)
