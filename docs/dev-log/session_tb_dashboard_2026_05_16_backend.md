---
name: tb-dashboard-session-2026-05-16-backend-complete
description: "session 16 พ.ค. 2026 — Phase 1 Backend สมบูรณ์: Supabase profiles + Resend integration + Admin approval flow + Profile/Sidebar เชื่อม data จริง"
metadata: 
  node_type: memory
  type: project
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

**วันที่:** 2026-05-15 → 2026-05-16 (ทำต่อจาก v0.7.1)
**โปรเจกต์:** TB CARE & JOURNEY
**Repo local:** `C:\Users\PKH\tb-dashboard-bysirawit`
**สถานะ:** ✅ Deploy production สำเร็จหลัง 3 hotfixes บน Cloudflare
**Commits:** 092d2b5 (v0.7.2) → 511b4d2 → e436055 (v0.7.2.1) → a2de01d (v0.7.2.2) → f67023e (v0.7.2.3)
**Production URL:** https://tb-dashboard-bysirawit.siravitphoapha9928.workers.dev

---

## 🎯 เป้าหมายที่บรรลุ — "ระบบทำงานทะลุถึง Resend"

จากที่พี่กันบอกว่า "ระบบเราต้องเสร็จ จนถึง resend" — สำเร็จครบทุกข้อ

ระบบ register → email → admin approve → user login → profile edit ใช้งานได้จริงในเครื่อง dev

---

## 🗄 Supabase Setup

### Tables ที่สร้าง
**`public.profiles`** — รัน SQL ใน Supabase Dashboard:
```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  first_name text,
  last_name text,
  profession text,
  license_number text,
  phone text,
  hospital_name text,
  hospital_type text,
  department text,
  department_other text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  role text default 'user' check (role in ('admin','user')),
  rejected_reason text,
  created_at timestamptz default now(),
  approved_at timestamptz
);
-- + ALTER TABLE add column email text (รันแยกตอนต้องการ)
```

RLS policies: users see/insert/update own + admins see/update all

---

## 📧 Resend Setup

- พี่กันสมัคร Resend ด้วย **siravitphoapha9928@gmail.com** (GitHub login)
- ⚠️ **ข้อจำกัด free + onboarding@resend.dev:** ส่งได้แค่ gmail (signup email) เท่านั้น
- API key: `re_REDACTED_removed_before_git` (อยู่ใน .env.local — อย่าให้หลุด)
- ห้ามทดสอบ register ด้วยเมลอื่นนอกจาก gmail นี้ จนกว่าจะ verify domain

### Email Templates (`lib/email-templates.ts`)
4 ฉบับ HTML inline CSS:
1. `adminNotifyEmail` — แจ้ง admin มีคนสมัครใหม่ + ปุ่ม "เข้าหน้าจัดการผู้ใช้"
2. `userPendingEmail` — แจ้ง user รออนุมัติ (ทางการ ไม่ใช่ ค่ะ/นะคะ)
3. `userApprovedEmail` — แจ้ง user อนุมัติแล้ว + ปุ่มเข้าสู่ระบบ
4. `userRejectedEmail` — แจ้ง user ปฏิเสธ + เหตุผล

---

## 📦 ไฟล์ที่สร้างวันนี้

### lib/
- `lib/supabase-admin.ts` — service-role client (bypass RLS, server-only)
- `lib/resend.ts` — Resend client + `ADMIN_EMAILS` array (รองรับหลายเมลคั่นด้วย comma)
- `lib/email-templates.ts` — 4 HTML templates

### API routes
- `app/api/register/route.ts` — POST: signUp + insert profile + ส่ง 2 เมล (admin + user)
- `app/api/admin/approve/route.ts` — POST: เช็ค admin role → update status=approved + ส่งเมล
- `app/api/admin/reject/route.ts` — POST: เช็ค admin + เหตุผล → update status=rejected + ส่งเมล
- `app/api/profile/me/route.ts` — GET: คืน profile ของ user ที่ login
- `app/api/profile/update/route.ts` — POST: แก้เฉพาะ self-editable (phone, department, department_other)
- `app/api/login-lookup/route.ts` — POST: username → email (สำหรับ login ด้วย username)

### Pages
- `app/pending-approval/page.tsx` — แสดง user ที่ status=pending
- `app/rejected/page.tsx` — แสดงเหตุผลถ้าโดน reject + ปุ่ม logout
- `app/admin/users/page.tsx` — admin dashboard: filter tabs (pending/approved/rejected/all),
  card view, ปุ่ม approve (เขียว), reject (แดง พร้อม modal กรอกเหตุผล), กันคน non-admin

### Scripts (local-only, ใส่ใน .gitignore)
- `scripts/delete-test-user.mjs` — ลบ auth user + cascade profile
- `scripts/clean-test-profiles.mjs` — ลบ orphan profiles
- `scripts/bootstrap-admin.mjs` — promote user เป็น admin + approved
- `scripts/check-rls.mjs` — audit RLS (จาก session ก่อนหน้า)

### ไฟล์ที่แก้
- `app/register/page.tsx` — submit ไป `/api/register` แทน `supabase.auth.signUp` ตรงๆ +
  ใช้ `licenseNum` ไม่ใช่ `licenseNumber` (typo fix) + spacing ของ success screen
- `app/login/page.tsx` — รองรับ username login (lookup email ก่อนถ้าไม่มี @)
- `middleware.ts` — เช็ค profiles.status (pending → /pending-approval, rejected → /rejected) +
  ใส่ `/api/register`, `/api/login-lookup` ใน public paths
- `public/tb-app.jsx`:
  - App component: เพิ่ม `useEffect` fetch `/api/profile/me` → set `currentUser` state
  - Sidebar: avatar + ชื่อ + วิชาชีพ ดึงจาก `currentUser` (ไม่ hardcoded)
  - UserProfileModal: fetch profile + map snake_case → camelCase + saveEdit → POST API
- `.env.local`:
  - `SUPABASE_SERVICE_ROLE_KEY=sb_secret_REDACTED_removed_before_git`
  - `RESEND_API_KEY=re_REDACTED_removed_before_git`
  - `ADMIN_EMAIL=siravitphoapha9928@gmail.com`

---

## 👤 บัญชี Admin ของพี่กัน

- **Email:** siravitphoapha9928@gmail.com
- **Username:** SirawitP
- **Password:** WpXQWa6hvXJmXZH* (Chrome auto-generated, เก็บใน password manager)
- **Role:** admin
- **Status:** approved

---

## 🔥 Hotfix Series — Cloudflare Deploy ล้ม 3 รอบ ก่อนสำเร็จ

### v0.7.2.1 — Fix Resend module-load crash (commit 511b4d2)
**ปัญหา:** Cloudflare build crash ด้วย error:
`Missing API key. Pass it to the constructor new Resend("re_123")`

**สาเหตุ:** `lib/resend.ts` มี `export const resend = new Resend(process.env.RESEND_API_KEY!)`
ที่ instantiate ตอน module load → Next.js build "collect page data" import module นี้
→ `process.env.RESEND_API_KEY` ตอน build time = undefined (Cloudflare expose
เฉพาะ runtime ไม่ใช่ build time) → throw error

**แก้:** เปลี่ยนเป็น lazy init ผ่าน `getResend()` function — สร้าง Resend instance
ตอนเรียกใช้ครั้งแรกเท่านั้น (runtime)

→ **กฎเหล็ก:** ไฟล์ใน `lib/` ห้าม instantiate client ที่ต้องการ env vars ตอน module-load

### v0.7.2.2 — Fix prerender crash + Build env vars (commit a2de01d)
**ปัญหา:** Build crash รอบ 2 ด้วย error:
`@supabase/ssr: Your project's URL and API key are required to create a Supabase client!`
`Error occurred prerendering page "/admin/users"`

**สาเหตุ:** Cloudflare มี env vars 2 sections:
- **Runtime "Variables and Secrets"** (top of Settings) — เว็บรันจริงเห็น
- **Build > Variables and secrets** (under Build section) — ตอน build เห็น

เราตั้งแค่ Runtime → Next.js build (รวม pre-render) ไม่เห็น `NEXT_PUBLIC_*`
→ `createClient()` ใน pages crash ตอน pre-render

**แก้ 2 ส่วน:**
1. **Code:** เพิ่ม `export const dynamic = 'force-dynamic'` ที่ 3 pages
   (admin/users, pending-approval, rejected) — บอก Next.js ห้าม pre-render
2. **Cloudflare config:** เพิ่ม env vars 5 ตัวใน **Build > Variables and secrets** ด้วย
   (Encrypt API keys ที่เป็นความลับ)

→ **กฎเหล็ก:** Cloudflare Workers ต้องตั้ง env vars ทั้ง 2 sections (Runtime + Build)

### v0.7.2.3 — Server-side auth in root page (commit f67023e) — 🚨 Critical Security
**ปัญหา:** Build ผ่านแล้ว แต่ production มีช่องโหว่ใหญ่!
- เข้า base URL → เข้า dashboard ได้เลยโดยไม่ต้อง login!
- middleware.ts ไม่ทำงานบน Cloudflare Workers

**สาเหตุ:** Next.js 16 มี warning ตอน build:
`The "middleware" file convention is deprecated. Please use "proxy" instead`
- Cloudflare Workers OpenNext deployment ไม่ run middleware.ts
- ทุก redirect ตาม auth ใน middleware ถูกข้าม
- รวมถึง check `profile.status` (pending/rejected)

**แก้:** เปลี่ยน `app/page.tsx` เป็น Server Component (async)
- อ่าน cookies → ตรวจ Supabase auth → ตรวจ profile.status
- ถ้าไม่ผ่าน → `redirect()` ก่อน render iframe
- กลายเป็น auth check ฝั่ง server แทน middleware

→ **กฎเหล็ก:** อย่าพึ่ง Next.js middleware บน Cloudflare Workers
   ต้อง enforce auth ใน page components หรือ API routes โดยตรง

---

## ⚠️ ยังไม่ได้ทดสอบ (รอตอนสะดวก)

### ทดสอบ user คนอื่น (Approve / Reject flow ครบ)
- ❌ ยังเทสไม่ได้เพราะ Resend ส่งได้แค่ gmail พี่กันเท่านั้น
- พอ verify domain ของตัวเองแล้ว → ค่อยทดสอบ:
  1. สมัครด้วยเมลอื่น (เช่น hotmail)
  2. ตรวจเมล admin notify (ที่ gmail)
  3. ตรวจเมล user pending (ที่ hotmail)
  4. เข้า `/admin/users` → กด approve
  5. ตรวจเมล approved (ที่ hotmail)
  6. user login → เข้าระบบได้
  7. ทดสอบ reject flow ใหม่อีกบัญชี — เช็คเมล + เหตุผล

### Profile Modal — ปุ่มยังไม่ทำ
- "เปลี่ยนรหัสผ่าน" — disabled อยู่ (รอ /reset-password flow)
- Sub-modal "ส่งคำขอแก้ไข" — ยัง alert placeholder (รอ edit_requests table + API)

---

## 🚧 Pending Tasks ก่อน Deploy Production

1. **ซื้อ domain** + verify ใน Resend → ส่งให้ใครก็ได้ (อันนี้สำคัญสุด)
2. **ตั้ง env vars บน Cloudflare Pages** (5 ตัวแปร) — ดู [[knowledge_env_production]]
3. **ตั้ง Site URL ใน Supabase Auth** (URL จริงของเว็บที่ deploy)
4. **commit + push** (รอบ commit แบบยาว ครอบคลุมทุกการเปลี่ยนแปลง)

---

## 📚 บทเรียนที่บันทึกแยกใน memory วันนี้

1. **[[feedback_user_is_normal_person]]** — อัปเดต: เพิ่ม "ตอบจุดสำคัญก่อน อย่าวกอ้อม"
2. **[[feedback_proactive_warnings]]** — กฎเหล็กใหม่: ทุก push = production deploy ต้องเตือนล่วงหน้า
3. **[[knowledge_env_production]]** — ก่อน deploy ต้องตั้ง env บน Cloudflare
4. **[[knowledge_env_local]]** — อัปเดต: Supabase เปลี่ยน key naming (sb_publishable/sb_secret)
5. **[[feedback_explain_code_to_nondev]]** — บรรทัด `--` คือ comment ระบบข้าม

---

## 💡 ความรู้ที่พี่กันได้วันนี้

- **Resend** = บริการส่งเมลภายนอก (เหมือนบริษัทขนส่ง)
- **Free plan + onboarding@resend.dev** = ส่งได้แค่กลับไปหาตัวเอง (anti-spam)
- **Verify domain** = ปลดล็อกส่งให้ใครก็ได้
- **Env vars ใน .env.local ≠ ใน Cloudflare** = ต้องตั้ง 2 ที่
- **anon key vs service_role key** = อันแรก public ได้, อันหลังห้ามเลย
- **RLS allow all** = ตัวร้ายต้องลบทิ้งทุกโปรเจกต์ใหม่
- **service_role bypass RLS** = ใช้ฝั่ง server เท่านั้น (ใน API routes)
- **Cascade delete** = ลบ auth.users → profile หายตาม
- **Bootstrap admin** = user แรกต้อง promote ผ่าน script เพราะ register form default = pending+user

---

## 🗺 ลิงก์ที่ใช้บ่อย

- Supabase TB Dashboard: https://supabase.com/dashboard/project/cioswzdbonnbhbyynrhh
- Supabase TB Calc: https://supabase.com/dashboard/project/ryewggkhunpuipgkgbfv
- Resend Dashboard: https://resend.com/emails
- Resend Logs: https://resend.com/logs

ดู [[session_tb_dashboard_2026_05_15_part2]] (UI revamp) · [[project_tb_dashboard_roadmap]] (roadmap)
