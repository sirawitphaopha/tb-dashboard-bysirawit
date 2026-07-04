---
name: 🧹 TB Dashboard session 2026-06-01 part 2 — v0.7.17.1 Cleanup
description: Phase 3 follow-up — Lazy render 7 หน้า + Logout -80% + ลบ iframe ครบ + ปลด CSP
type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# v0.7.17.1 — Phase 3 Cleanup (commit 389f161 + hash 1e246ab)

## งานที่ทำในรอบนี้

### 1. Lazy Render 7 หน้า
Pattern เดียวกัน: `useState visibleCount` + `useEffect reset on filter change` + `.slice(0, visibleCount).map()` + ปุ่ม "ดูเพิ่ม"

| หน้า | เริ่มต้น | เพิ่มครั้งละ |
|---|---|---|
| PatientList | 50 | +50 |
| ArchiveList | 50 | +50 |
| AllPatientsPage | 50 | +50 |
| AdminUsersTab | 50 | +50 |
| AuditLogTab | 50 | +50 |
| TrashList | 30 | +30 |
| ChangelogCommentSection | 15 | +15 |

ActivityLogTab มี server-side pagination อยู่แล้ว → ไม่แก้

### 2. Logout เร็วขึ้น 80%

Backend (`app/api/auth/signout/route.ts`):
- ก่อน: 5 ops sequential = ~500-1000ms
  - getUser → device_fp → signOut → logout_log insert → session_log update
- หลัง: parallel + fire-and-forget = ~280ms critical path
  - getUser + device_fp ขนาน (Promise.all)
  - signOut (critical)
  - logout_log + session_log fire-and-forget

Frontend (tb-monolith.jsx):
- เพิ่ม `useState loggingOut`
- กด logout → `setLoggingOut(true)` → overlay teal spinner ทันที + ข้อความ "กำลังออกจากระบบ..."
- fetch ใต้ดิน → finally redirect
- perceived: instant (-80% feel)

### 3. Cleanup iframe ครบ

ลบ:
- public/app.html
- public/tb-app.jsx (5,874 บรรทัด — อยู่ใน monolith แล้ว)
- public/tb-modals.jsx (4,832 บรรทัด)
- public/tb-data.js
- public/tb-changelog.js
- app/components/HomeShell.tsx
- app/v2/ folder (page.tsx + TbAppMount + TbBundle)

ย้าย:
- app/v2/TbAppMount.tsx → app/components/TbAppMount.tsx
- app/v2/TbBundle.tsx → app/components/TbBundle.tsx
- app/page.tsx import path: './v2/TbAppMount' → './components/TbAppMount'

ลบจาก package.json:
- script "build:jsx" + "prebuild"
- devDep "esbuild": "^0.28.0"

### 4. CSP Tightened

ลบจาก script-src:
- 'unsafe-eval' (Babel ไม่ใช้แล้ว)
- cdn.tailwindcss.com (compile-time)
- cdn.jsdelivr.net (Chart.js + Supabase ใช้ npm)
- unpkg.com (React UMD ไม่ใช้แล้ว)

frame-src: 'self' → 'none' (ไม่ใช้ iframe แล้ว)

ก่อน: `script-src 'self' 'unsafe-inline' 'unsafe-eval' 4 CDNs`
หลัง: `script-src 'self' 'unsafe-inline'` เท่านั้น

→ XSS attack surface ลดลงมาก

## บัก/ปัญหาที่เจอระหว่างทำ

### TypeError: Property 'catch' does not exist on PromiseLike
- Supabase queries return PromiseLike ไม่ใช่ Promise → ใช้ `.catch()` ตรงๆ ไม่ได้
- แก้: wrap ใน async function + try/catch

### ลบ app/v2/ ทั้ง folder → import path เสีย
- app/page.tsx import จาก './v2/TbAppMount' → folder ลบไปแล้ว
- แก้: ย้าย TbAppMount + TbBundle ไป app/components/ + update import path

## Push history
- v0.7.17.1 commit `389f161` — Phase 3 Cleanup
- hash update commit `1e246ab`

## Rollback note
ไฟล์ iframe ถูกลบทั้งหมด — ไม่มี backup ภายในแล้ว
ถ้ามีปัญหา → git revert commit นี้ → กลับสู่ v0.7.17.0 (ยังมี iframe files ครบ)

## TODO รอบหน้า
- Component split — แยก tb-monolith.jsx → app/dashboard/, app/patient/, app/admin/, etc.
- Image upload สำหรับ comment (pending master ข้อ 51)

## Lessons
- Optimistic UI overlay = perceived instant (ใช้กับทุก action ที่รอนาน)
- Fire-and-forget log writes — ลด critical path เยอะ (logs ไม่ต้อง block response)
- Supabase PromiseLike ต้อง wrap ใน async function ก่อนใช้ .catch()
- ลบ folder → check imports ที่ reference ก่อน (เกือบพัง deploy)

ดู [[session_tb_dashboard_2026_06_01_part2]] (Phase 3 หลัก) · [[project_tb_dashboard_pending_master]]
