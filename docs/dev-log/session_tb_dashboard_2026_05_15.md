---
name: tb-dashboard-session-2026-05-15
description: "session 15 พ.ค. 2026 — v0.7.0: ระบบ Login จริง Supabase Auth, หน้า Register+PasswordStrength, Middleware, เปลี่ยนชื่อ TB CARE & JOURNEY"
metadata: 
  node_type: memory
  type: project
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

**วันที่:** 2026-05-15
**โปรเจกต์:** TB CARE & JOURNEY (เปลี่ยนชื่อจาก TB-CARE LINK)
**Version สิ้นสุด session:** v0.7.0
**Commit:** `cb66855`
**Repo local:** `C:\Users\PKH\tb-dashboard-bysirawit`
**Deploy:** Cloudflare Pages (auto จาก GitHub `sirawitphaopha/tb-dashboard-bysirawit` main)

---

## สิ่งที่เปลี่ยนใน v0.7.0

### Setup เครื่องใหม่
- ติดตั้ง Node.js LTS ผ่าน winget
- เปิด PowerShell execution policy: `RemoteSigned`
- โคลน repo ใหม่ (ลบอันเก่าทิ้งก่อน เพราะค้างที่ v0.6.0)
- `npm install` ติดตั้ง 106 packages

### ระบบ Login จริง (Supabase Auth)
- ติดตั้ง `@supabase/ssr` และ `@supabase/supabase-js`
- สร้าง `.env.local` — NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
- สร้าง `lib/supabase-browser.ts` — browser client
- สร้าง `lib/supabase-server.ts` — server client (cookie-based)
- สร้าง `middleware.ts` — ป้องกันทุก route, redirect ไป /login ถ้าไม่ login
  - รองรับ Supabase session และ dev_session cookie
- สร้าง `app/api/auth/signout/route.ts` — POST sign out + ล้าง dev cookie

### หน้า Login (app/login/page.tsx)
- design เหมือนหน้าเดิมทุกอย่าง (teal gradient, white card, ไอคอนปอด)
- field: Email/Username + Password (ไม่มีปุ่มดูรหัสผ่าน)
- **Dev bypass:** username=`sirawit`, password=`1234` → set cookie `dev_session=sirawit`
- error message เมื่อ login ผิด
- ลิงก์ไปหน้า Register

### หน้า Register (app/register/page.tsx)
- Password Strength Indicator มาตรฐานสากล (5 เกณฑ์)
- progress bar สี แดง/เหลือง/น้ำเงิน/เขียว
- Confirm Password + real-time validation
- หลัง register → แสดงหน้ายืนยัน "ตรวจสอบอีเมล"

### ลบ Login Demo ออก (tb-app.jsx)
- ลบ state: `page`, `loggingIn`, `showPassword` (login form)
- ลบ function `login()` และ `if (page==='login')` render block
- ปุ่ม Log out ใน sidebar → เรียก `fetch('/api/auth/signout')` แล้ว redirect

### เปลี่ยนชื่อโปรเจกต์
- "TB-CARE LINK" → "TB CARE & JOURNEY" ทุกจุด:
  - layout.tsx, page.tsx, login, register, index.html, tb-app.jsx (sidebar)

### Layout
- `app/layout.tsx`: เพิ่ม Font Awesome 6 CDN + Google Fonts Sarabun

### Version
- v0.6.21 → v0.7.0 (login page + sidebar footer)

---

## Roadmap v0.8
1. ต่อ Supabase RLS (Row Level Security) ป้องกัน database จริง
2. เกลา Timeline
3. Filter หัวคอลัมตารางแบบ Excel
4. ระบบ reset password จริง
