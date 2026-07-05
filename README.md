# TB CARE & JOURNEY

ระบบบริหารจัดการผู้ป่วยวัณโรค (Tuberculosis patient-management dashboard) สำหรับเภสัชกรโรงพยาบาล — เว็บใช้งานจริงที่ **https://tbjourney.care**

> โปรเจกต์ส่วนตัว พัฒนาโดยเภสัชกรโรงพยาบาลปรางค์กู่ ร่วมกับ Claude Code · UI ภาษาไทยเป็นหลัก · ปัจจุบันใช้งานภายใน (single tenant) และออกแบบเผื่อขยายเป็นหลายโรงพยาบาล (multi-tenant) ในอนาคต

---

## ภาพรวม

TB CARE & JOURNEY เป็นเว็บแอปสำหรับติดตามและบริหารข้อมูลผู้ป่วยวัณโรคตลอดคอร์สการรักษา — ตั้งแต่ลงทะเบียนผู้ป่วย บันทึกสูตรยา ผลแล็บ ภาพเอกซเรย์ทรวงอก (CXR) การติดตามการกินยา (adherence) ไปจนถึงระบบผู้ใช้/สิทธิ์ และบันทึกการทำงาน (audit log) แบบครบวงจร

### ฟีเจอร์หลัก

- **จัดการผู้ป่วย** — เพิ่ม/แก้/ดูข้อมูลผู้ป่วย, สูตรยา TB + ขนาดยา, ผลแล็บ/เสมหะ, ADR, การนัด, timeline การรักษา
- **ระบบรูปภาพผู้ป่วย** — อัปโหลด CXR / ผลแล็บ / เอกสาร (รองรับ JPG/PNG/WebP/AVIF/GIF/HEIC/TIFF), คลังรูปแบบ Google Photos, ตัวดูรูปซูมระดับพิกเซล, เทียบ CXR, เก็บไฟล์บน Cloudflare R2
- **รูปโปรไฟล์ (Avatar)** — อัปโหลด + ครอบรูป เก็บบน R2
- **ระบบผู้ใช้ + อนุมัติ** — สมัคร → แอดมินอนุมัติ/ปฏิเสธ, สมัครใหม่หลังถูกปฏิเสธ, จำกัดจำนวนครั้ง, จัดการผู้ใช้ (ค้นหา/กรอง/หลายมุมมอง)
- **ถังขยะผู้ป่วย** — ลบแบบ soft delete → เก็บ 60 วัน → ลบถาวร + audit log, ผู้ใช้ทั่วไป "ขอลบ" แอดมินอนุมัติ
- **ถังขยะรูปภาพ** — ลบรูปแล้วกู้คืนได้ (เก็บไฟล์ไว้ 60 วัน) · ถังรวมทุกผู้ป่วยในเมนู "ถังขยะ" (สลับผู้ป่วย/รูป) จัดกลุ่มตาม HN + ค้นหา/กรอง + มุมมองการ์ด/แถว/ขนาด · ลบต้องกรอกเหตุผล + HN + ยืนยัน 2 ชั้น · กู้คืน/ลบถาวร = แอดมิน
- **ขอลบรูป (เฟส 2) + ลบอัตโนมัติ** — ลบรูปตรง = แอดมินเท่านั้น · คนอื่นกด "ขอลบรูป" (ยืนยัน 2 ชั้น) → รูปขึ้นฝ้าขาว "รออนุมัติลบ" (เห็นข้ามเครื่อง realtime) + แจ้งเมล/กระดิ่งแอดมิน → แอดมินอนุมัติ (เข้าถังขยะ · ป๊อป 2 ขั้น) หรือปฏิเสธ (กลับปกติ · ป๊อป 1 ขั้น) · **แจ้งเมลครบทุกขั้น** (ขอลบ→ผู้ขอ+แอดมิน · อนุมัติ/ปฏิเสธ/แอดมินยกเลิกแทน→ผู้ขอ · ลบถาวร/กู้คืน→เจ้าของรูป) · **เมนูถังขยะมี badge นับของในถัง** (เลขรวม + แยกแท็บผู้ป่วย/รูป) · รูปในถังเกิน 60 วันถูกลบอัตโนมัติ (row + ไฟล์ R2)
- **ประวัติรูปภาพ (audit log) + ตรวจรูปซ้ำ** — บันทึก **ทุก event ของรูป** (อัปโหลด/แก้/ขอลบ/ยกเลิก/แอดมินลบตรง/อนุมัติ/ปฏิเสธ/กู้คืน/ลบถาวร/auto-purge) ลงตาราง `tb_image_event_log` (jsonb snapshot · **เก็บถาวรแม้รูปลบถาวร**) · ดูที่หน้าคลังรูปภาพ กด toggle "ประวัติ" (แอดมิน) มีตัวกรอง event/วันที่ + ไทม์ไลน์ + ดู snapshot · ตอนอัปคำนวณ **SHA-256 / MD5 / CRC32 (ต้นฉบับ) + pHash (dHash · จับภาพเดียวกันแม้คนละไฟล์)** เก็บไว้ตรวจรูปซ้ำ
- **ความปลอดภัย/บัญชี** — เปลี่ยนรหัสในโปรไฟล์, ลืมรหัส/รีเซ็ตทางอีเมล, บันทึก session/login/logout, แจ้งเตือนทางอีเมล (Resend)
- **กระดิ่งแจ้งเตือน (Realtime)** — แจ้งแอดมินเมื่อมีผู้สมัคร/คำขอลบ, แจ้งผู้ใช้เมื่อถูกอนุมัติ/กู้คืน
- **พื้นที่จัดเก็บ (แอดมินเท่านั้น)** — วัดการใช้พื้นที่จริง Cloudflare R2 (นับไฟล์ในถังแบบเป๊ะ) + Supabase (แยกพื้นที่ระบบ/ข้อมูลจริง) · การ์ดเล็กที่แดชบอร์ด + แท็บกราฟวงกลม/บาร์แยกสีตามหมวดในตั้งค่าระบบ · เตือนเมื่อใช้เกิน 80%
- **ประวัติเวอร์ชัน (Changelog)** — หน้าแสดงประวัติการอัปเดต สร้างอัตโนมัติจาก git log

---

## Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| ภาษา | TypeScript + JSX |
| Styling | Tailwind CSS 3 |
| ฐานข้อมูล / Auth / Realtime | Supabase (Postgres + Auth + Realtime) |
| อีเมล | Resend |
| เก็บไฟล์รูป | Cloudflare R2 (S3-compatible ผ่าน `aws4fetch`) |
| กราฟ | Chart.js |
| Deploy | Cloudflare Pages (โดเมน tbjourney.care) |

---

## เริ่มต้นใช้งาน (Development)

```bash
npm install
# สร้างไฟล์ .env.local (ดูตัวแปรด้านล่าง) แล้ว:
npm run dev            # เปิดที่ http://localhost:3000
```

เทสจากมือถือ / คอมอีกเครื่องในไวไฟเดียวกัน:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
# แล้วเปิด http://<IP-เครื่องนี้>:3000 บนอีกเครื่อง
# (IP ต้องอยู่ใน allowedDevOrigins ใน next.config.js ก่อน)
```

### ตัวแปรสภาพแวดล้อม (`.env.local` และบน Cloudflare Pages)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # sb_publishable_*
SUPABASE_SERVICE_ROLE_KEY          # sb_secret_* (ฝั่ง server เท่านั้น — ข้าม RLS)
RESEND_API_KEY                     # re_*
ADMIN_EMAIL                        # อีเมลแอดมิน คั่นด้วย comma
R2_ACCESS_KEY_ID                   # Cloudflare R2 (รูปผู้ป่วย + avatar)
R2_SECRET_ACCESS_KEY
R2_BUCKET_PATIENT                  # เช่น tb-patient-images
CRON_SECRET                        # v0.7.20 — กุญแจป้องกัน /api/cron/purge-images (pg_cron เรียก) — ต้องตรงกับใน SQL
```

> Dev กับ Production ชี้ไปที่ Supabase project **เดียวกัน** — SQL ที่รันในแดชบอร์ดมีผลทั้งสองฝั่ง ให้ถือว่าข้อมูล dev = ข้อมูลจริง

---

## โครงสร้างโปรเจกต์

```
app/
  page.tsx              # Server Component — เช็ค auth แล้ว mount แอป
  layout.tsx            # root layout (ฟอนต์ / FontAwesome / global)
  login/                # หน้า login (+ footer แสดง version)
  register/             # หน้าสมัคร
  pending-approval/     # หน้า "รออนุมัติ"
  rejected/             # หน้า "ถูกปฏิเสธ"
  reset-password/       # ลืมรหัส / ตั้งรหัสใหม่
  components/
    TbAppMount.tsx      # dynamic import (ssr:false) + V2Skeleton ระหว่างโหลด
    TbBundle.tsx        # chain: setup → tb-constants/calc/seed/db → tb-changelog → tb-monolith
    V2Skeleton.tsx      # โครงหน้า pulse ระหว่างโหลด
  legacy/
    setup.ts            # เซ็ต window.React/Chart/supabase (แทน CDN เดิม)
    tb-constants.js     # ค่าคงที่/enum/label            ┐ เดิมเป็น tb-data.js
    tb-calc.js          # ฟังก์ชันคำนวณ (ขนาดยา/CrCl)     │ ไฟล์เดียว
    tb-seed.js          # ข้อมูลตัวอย่าง INITIAL_PATIENTS  │ แยก 4 ไฟล์
    tb-db.js            # Supabase client + โหลด/บันทึก    ┘ (v0.7.19.6.20)
    tb-changelog.js     # ประวัติเวอร์ชัน (auto-generate — ห้ามแก้มือ)
    tb-monolith.jsx     # 🐚 shell บาง ๆ (App + แจ้งเตือน + version + mount)
    parts/              # ⭐ ตัวแอปจริง แยกโดเมน (dashboard/ admin/ account/ patient-modal/ ฯลฯ)
  api/
    auth/    admin/    patient/    profile/    register/    login-lookup/
lib/                    # supabase clients, r2, resend, email-templates, helpers
scripts/                # *.mjs (Node one-off) + *.sql (รันมือใน Supabase)
middleware.ts           # session check + status redirect (อย่าเปลี่ยนชื่อเป็น proxy.ts)
next.config.js          # CSP + security headers + allowedDevOrigins
```

> ⭐ **ตัวแอปจริงอยู่ใน `app/legacy/parts/`** (แยกจาก monolith เสร็จช่วง v0.7.19.6.x · `tb-monolith.jsx` เหลือ ~985 บรรทัดเป็น shell) เขียนด้วย JSX ที่ SWC แปลงตอน build — ตั้งแต่ v0.7.17.0 เลิกใช้ iframe + Babel แล้ว

---

## สถาปัตยกรรมสำคัญ (สรุป — รายละเอียดใน `CLAUDE.md`)

- **ไม่มี iframe แล้ว** — `app/page.tsx` เช็ค login ฝั่ง server → mount แอปด้วย `next/dynamic` (ssr:false เพราะโค้ดอ่าน `window.*`)
- **Auth ป้องกันหลายชั้น** — middleware + เช็คซ้ำใน Server Component ทุกหน้า (เพราะ Cloudflare อาจไม่รัน middleware) + เช็คในทุก API admin
- **Supabase clients 3 ตัว** — browser (anon) / server (anon+cookie, เคารพ RLS) / admin (service role, ข้าม RLS — ฝั่ง server เท่านั้น)
- **RLS** — ห้ามเขียน policy ที่ sub-query ตารางตัวเอง (recursion) ใช้ `SECURITY DEFINER` function แทน
- **รูปภาพ** — เก็บบน R2, signed URL อายุสั้น, soft-delete ผ่าน `deleted_at`, HEIC ใช้ `heic-to/csp` (เลี่ยง eval)

---

## การอัปเดตเวอร์ชัน (Version bump)

แก้เลขเวอร์ชันให้ตรงกัน **3 ที่** ในคอมมิตเดียว:

1. `app/legacy/tb-monolith.jsx` → `const APP_VERSION`
2. `app/legacy/tb-monolith.jsx` → `const BUILD_DATE` (วันที่ไทย พ.ศ. = ค.ศ.+543 · ต้องตรงวันที่ push จริง)
3. `app/login/page.tsx` → `Version X.Y.Z` (footer)

จากนั้น commit ด้วย message ละเอียด แล้วสร้าง changelog ใหม่:

```bash
node scripts/generate-changelog.mjs > app/legacy/tb-changelog.js
```

แล้ว commit changelog เป็น `chore: update commit hash vX.Y.Z` (changelog สร้างจาก commit message — เขียน body ให้ละเอียดเพราะกลายเป็น changelog ที่ผู้ใช้เห็น)

---

## Deploy

Push ขึ้น branch `main` → Cloudflare Pages build + deploy อัตโนมัติ → เว็บจริง https://tbjourney.care

**เช็คก่อน/หลัง deploy ทุกครั้ง:**
- ตัวแปร env บน Cloudflare (โดยเฉพาะ `ADMIN_EMAIL` + R2 keys — อาจหลุดหลัง deploy)
- SQL ที่ต้องรันใน Supabase (ถ้ามีการแก้ schema)

---

## หมายเหตุ

- UI ภาษาไทยเป็นหลัก · **ห้ามใช้เครื่องหมาย `?` ในข้อความ UI**
- สีหลักของแบรนด์ = เทล (teal `#0d9488`)
- popup เนื้อหาทั่วไปใช้ฉากหลังเบลอเทล + โบเก้อำพัน (class `.tb-backdrop` ใน `globals.css`) · ตัวดูรูปใหญ่คงพื้นดำ (รายละเอียดกฎ 3 กลุ่มใน `CLAUDE.md`)
- แจ้งเตือนบนเมนู (badge) = ระบบกลางเดียวกันทุกที่ (`renderNotif` · แถบเต็ม=วงแดงมีเลขวูบวาบ / ยุบ=จุดแดงที่ icon) · การกระทำสำคัญทุกอย่างต้องมี popup ยืนยันก่อนเสมอ (ดู `CLAUDE.md`)
- โปรเจกต์นี้เก็บเวชระเบียนผู้ป่วย — ระวังเรื่อง PDPA และ พ.ร.บ.สุขภาพ (เก็บเวชระเบียน 5–10 ปี) เมื่อออกแบบระบบลบข้อมูล
