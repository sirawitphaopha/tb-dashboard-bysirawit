---
name: tb-dashboard-session-2026-05-16-evening-trash-system
description: session 16-17 พ.ค. 2026 (ภาคค่ำต่อข้ามคืน) — v0.7.4 ระบบถังขยะ + แก้ 3 บั๊ก infrastructure + Admin notifications + Bell + ย้ายหน้าจัดการผู้ใช้เข้าระบบ + UI/UX polish
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e58b3a2-1f96-401c-b4fe-8e7091d402a8
---

**ช่วงเวลา:** 2026-05-16 ภาคค่ำ → 2026-05-17 ตี 1 (~6 ชั่วโมง)
**โปรเจกต์:** TB CARE & JOURNEY
**Repo:** `C:\Users\PKH\tb-dashboard-bysirawit`
**Version:** v0.7.3 → **v0.7.4**
**ยังไม่ push** — รอพี่กันยืนยัน

---

## 🎯 ภารกิจหลัก

ทำระบบ **ลบผู้ป่วย** ครบวงจร + แก้บั๊ก infrastructure 3 ตัวที่ค้นพบระหว่างทาง

---

## ✅ สิ่งที่ทำสำเร็จ

### 1. 🗑 ระบบถังขยะ (Trash System) — Step 1-3 เสร็จ

**Step 1 — DB Schema** (`scripts/add-trash-system.sql` รันแล้ว)
- เพิ่ม 3 columns ใน tb_patients: `deleted_at`, `deleted_by`, `delete_reason`
- ตาราง `tb_delete_requests` (สำหรับ user request flow)
- ตาราง `tb_patients_deleted_log` (audit trail หลัง hard delete)
- Trigger `log_patient_hard_delete` — auto-log ตอนลบถาวร
- pg_cron job `purge_trash_60d` — รัน 02:00 ทุกคืน ลบของในถังขยะที่เกิน 60 วัน

**Step 2 — Admin Delete Flow** (ปุ่มลบในแท็บสรุปเภสัช)
- ปุ่ม "ลบผู้ป่วย" (เล็ก ชิดขวา) — admin เท่านั้น / user ทั่วไปเห็นแบบ disabled
- 2-step dialog: เหตุผล → ยืนยัน 60 วัน
- Dialog 2: ปุ่ม "ยืนยันลบ" อยู่ **ซ้าย**, "ย้อนกลับ" อยู่ขวา (UX มาตรฐาน destructive action — เมาส์ต้องเลื่อน)

**Step 3 — หน้าถังขยะ** (`TrashList` ใน sidebar)
- แท็บ "ถังขยะ" ใน sidebar
- List ผู้ป่วยที่ลบ + วันเหลือ + ปุ่ม Restore / ลบถาวร (admin only)
- Dialog ลบถาวร: พิมพ์ HN ยืนยัน + checkbox ยอมรับกู้คืนไม่ได้

**Design decisions (พี่กันยืนยัน):**
- Soft delete + Hard delete จริง (มี audit log แทนเก็บไว้ยาว)
- ทุก user เห็นถังขยะ Restore/ลบถาวร = admin only
- Admin ลบต้องพิมพ์เหตุผล
- ⚠️ เตือนพี่กันแล้วเรื่อง พ.ร.บ.สุขภาพต้องเก็บ 5-10 ปี — ยืนยันใช้ hard delete + audit

### 2. 🐛 แก้บั๊ก Infrastructure 3 ตัว (root cause)

**A. iframe ไม่มี Supabase session** ⭐ บั๊กสำคัญสุด
- เว็บแบ่ง 2 ชั้น: Next.js (ชั้นนอก, ใช้ `@supabase/ssr` cookies) + iframe `/app.html` (ชั้นใน, ใช้ supabase-js CDN)
- ชั้นในใช้ anon key ล้วน → `auth.uid()` = null → RLS strict mode ปฏิเสธ INSERT/UPDATE เงียบๆ
- อาการ: สร้างผู้ป่วยใน UI → save ดูเหมือนสำเร็จ → refresh แล้วหาย → Supabase ไม่มี row
- **Fix:**
  1. สร้าง `app/api/auth/session/route.ts` — endpoint คืน access_token + refresh_token จาก cookies
  2. `tb-data.js` เพิ่ม `window._sbReady = (async)()` → fetch session แล้ว `_sb.auth.setSession(...)` ก่อนทุก request
  3. `tb-app.jsx` รอ `_sbReady` ก่อน `loadPatients()`

**B. Profiles RLS infinite recursion**
- Error: `42P17: infinite recursion detected in policy for relation "profiles"`
- เกิดเพราะ policy บน profiles มี subquery `select from profiles` → triggers same policy → loop
- **Fix** (ใน `scripts/fix-schema-and-profiles-rls.sql`):
  - สร้างฟังก์ชัน `public.is_admin()` + `public.is_approved()` เป็น `SECURITY DEFINER` (bypass RLS)
  - Drop policies เดิม + สร้างใหม่ใช้ฟังก์ชันแทน subquery
  - อัปเดต tb_patients/tb_delete_requests/tb_patients_deleted_log policies ใช้ฟังก์ชันเดียวกัน
- **บทเรียน:** policy ห้าม subquery กลับเข้าตารางตัวเอง — ใช้ SECURITY DEFINER function แทนเสมอ

**C. tb_patients ขาดคอลัมน์ 20+ ตัว**
- Error: `PGRST204: Could not find the 'archived'/'outcome'/... column`
- Root cause: ตอน build app ไม่ได้สร้างคอลัมน์ครบ — `patientToDb` ส่ง 30+ field แต่ DB มีไม่ครบ
- **Fix:** SQL `add column if not exists` เพิ่มครบ (archived, outcome, labs, sputum, adr, visits, dot, custom_doses, regimen_history, comorbidities, concomitant_drugs, patient_type, disease_location, ฯลฯ)
- **บทเรียน:** ถ้าฟอร์มเพิ่ม field ใหม่ → ต้องรัน alter table ด้วย (เก็บไว้ใน roadmap ข้อ 29)

### 3. 👥 ระบบแจ้งเตือน Admin (Step 4 ใหม่ที่เพิ่ม)

**4a — แท็บ "จัดการผู้ใช้" ใน sidebar** (ย้ายมาจาก `/admin/users` มาในระบบ)
- Sidebar nav item ใหม่ — เห็นเฉพาะ admin (filter ด้วย `role === 'admin'`)
- Badge เลขผู้ใช้รออนุมัติ ทางขวาของ label (กระพริบ pulse animation)
- คลิก → render `AdminUsersTab` inline (ไม่ออก iframe แล้ว)

**AdminUsersTab — ครบฟีเจอร์ + ธีม teal:**
- Header gradient teal-700 → teal-600
- Filter cards 4 ใบ: รออนุมัติ / อนุมัติแล้ว / ปฏิเสธ / ทั้งหมด — กดเลือก + hover เปลี่ยนสี + ข้อความตรงกลาง
- ช่องค้นหา (ชื่อ/username/email/รพ./เลขใบประกอบ)
- ปุ่ม view mode: list (กะทัดรัด, default) / card (ละเอียด)
- เรียก `/api/admin/approve` + `/api/admin/reject` (ของเดิม)
- หลังอนุมัติ/ปฏิเสธ → update badge ใน sidebar อัตโนมัติ

**4b — Bell notification**
- เพิ่ม admin alert ใน `alerts` array ของ `tb-app.jsx` (ถ้า role=admin + pendingCount > 0)
- Alert type ใหม่ `navTarget: 'admin-users'` → คลิกแล้ว setNav() แทน setClinical()
- เรียง **บนสุดเสมอ** (ก่อน critical/warning/info)
- สไตล์เด่น: ไอคอน 🛡 user-shield teal + label "ADMIN · จัดการผู้ใช้" + พื้น gradient teal
- ทำให้ `useNotifHelpers`, `NotificationPanel`, `NotificationFullModal` รองรับ `onNavTarget`

**4c — หมายเหตุ spam**
- หน้า register หลัง submit → เพิ่มกล่อง amber: "ไม่เจออีเมล? เช็คกล่องสแปม / โปรโมชั่น"

### 4. 🧹 Cleanup
- ลบ `dev_session` (sirawit/1234) backdoor (มาจากค้างใน commit ก่อนหน้า)
- ลบ banner pending users ใน AdminSettings (ซ้ำกับ sidebar tab + bell แล้ว)
- ลบกรอบเหลือง "Admin Settings" (settings ไม่ใช่ admin-only แล้ว)
- เปลี่ยน label "ตั้งค่าระบบ (Admin)" → "ตั้งค่าระบบ" (user ทั่วไปก็เห็น)

### 5. 📝 Memory ใหม่
- `feedback_fix_urgent_inline.md` — กฎเหล็กใหม่: ถ้าพี่กันบอกแก้ระหว่างทาง = แก้ทันที ห้าม defer
- อัปเดต MEMORY.md เพิ่ม **🛑 STOP banner** บนสุด: ต้อง Read 3 feedback files เต็มๆ ก่อนตอบ session ใหม่
- อัปเดต `project_tb_dashboard_pending_master.md` — เพิ่มข้อ 29, 30, 31 + เซคชั่นระบบถังขยะ + บั๊กที่เพิ่งแก้

---

## 📁 ไฟล์ที่แก้/สร้าง

### New files
- `app/api/auth/session/route.ts` — session bridge (สำคัญมาก)
- `scripts/add-trash-system.sql`
- `scripts/fix-schema-and-profiles-rls.sql`

### Modified files
- `app/api/auth/signout/route.ts` — ลบ dev_session cookie clear
- `app/login/page.tsx` — ลบ shortcut sirawit/1234 + bump version 0.7.5
- `app/page.tsx` — ลบ devSession branch + cleanup
- `app/register/page.tsx` — เพิ่มหมายเหตุ spam
- `middleware.ts` — ลบ dev_session check
- `public/app.html` — เพิ่ม `@keyframes tbPulseBadge` + class `.tb-pulse-badge`
- `public/tb-app.jsx` — currentUser.id, softDelete/restore/hardDelete handlers, pendingUserCount, admin alerts, sidebar badge, AdminUsersTab/TrashList render + bump 0.7.5
- `public/tb-data.js` — `_sbReady` session bridge, softDeletePatient, restorePatient, hardDeletePatient, loadTrashedPatients, filter deleted_at in loadPatients
- `public/tb-modals.jsx` — PharmSummaryTab ปุ่มลบ + 2 dialog, TrashList component, AdminUsersTab component, useNotifHelpers onNavTarget

---

## ⏳ ยังเหลือทำ (Step 5-8)

- Step 5: Debug เมลแอดมินไม่เข้า (เมลผู้สมัครเข้า spam แล้ว แต่เมลแอดมินไม่มาเลย)
- Step 6: User request flow (ปุ่ม "ขออนุมัติลบ" สำหรับ user ทั่วไป + Dialog)
- Step 7: Bell + Email สำหรับคำขอลบ
- Step 8: เทส auto-purge pg_cron 60 วัน

---

## 💡 บทเรียนใหม่

- **iframe + Supabase Auth = ต้อง bridge session ผ่าน API endpoint** (ไม่งั้น auth.uid() = null)
- **RLS policy ห้าม subquery กลับเข้าตารางตัวเอง** — ใช้ SECURITY DEFINER function แทน
- **เพิ่มฟิลด์ใน frontend = ต้อง alter table เพิ่มคอลัมน์ด้วยเสมอ** (PGRST204 = column missing)
- **Turbopack บน Windows panic ได้** — แก้ด้วย kill server + `rm -rf .next` + restart
- **/resume = ช่วยชีวิตถ้าเผลอปิด terminal** (พี่กันเพิ่งรู้)

---

## 🗺 ดูเพิ่ม
- [[project_tb_dashboard_pending_master]] — Pending list + Step 4-8 ของระบบถังขยะ
- [[feedback_fix_urgent_inline]] — กฎเหล็กใหม่ที่บันทึก session นี้
- [[session_tb_dashboard_2026_05_16_domain]] — session ก่อนหน้า (tbjourney.care LIVE v0.7.3)
