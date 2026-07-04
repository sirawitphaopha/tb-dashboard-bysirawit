---
name: tb-dashboard-session-2026-05-15-part2
description: "session ต่อจากภาคแรก 15 พ.ค. 2026 — v0.7.1: Register form revamp + Profile modal redesign + .gitignore + Critical RLS fix ทั้ง 2 project"
metadata: 
  node_type: memory
  type: project
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

**วันที่:** 2026-05-15 (ภาคต่อ)
**โปรเจกต์:** TB CARE & JOURNEY + TB Calculator (เช็คทั้ง 2 project)
**Version สิ้นสุด:** v0.7.1
**Commits:**
- TB Dashboard: `93cf7fa` (v0.7.1) + `da6de3f` (security RLS)
- TB Calculator: `a7b45b3` (security RLS, rebased on top of v1.6.5)

---

## 🎨 Part A: UI Revamp (v0.7.1)

### Register form (`app/register/page.tsx`) — รื้อใหม่ทั้งหน้า
แบ่ง 3 section ใน scroll เดียว (max-w-lg):

**Account section:**
- Username + Email (grid 1fr 2fr — Email กว้าง 2 เท่า)
- Password + Confirm Password
- `autoComplete="new-password"` + `name` attr → Chrome เด้ง suggest strong password
- Strength threshold: 5/5 → 4/5 (length ≥ 8 บังคับ)
- PasswordEye component (animated SVG eye เปิด/หลับตา 0.12s ease) — สร้างใหม่ใน `components/PasswordEye.tsx`

**Personal Info section:**
- ชื่อ + นามสกุล แยก
- Profession dropdown 9 ตัวเลือก (เพิ่ม "เจ้าหน้าที่สาธารณสุข" จากเดิม 8 ตัว)
- License Number ที่มี prefix badge สีเขียว auto ตาม profession (ว./ท./ภ./ป.)
- Phone auto-format `0xxx-xxx-xxxx` จากตัวเลขล้วน

**Hospital section:**
- Hospital Name + Hospital Type dropdown 10 ตัวเลือก
- ระดับโรงพยาบาลแยกตามมาตรฐานสาธารณสุขไทย: A / S / M1 / M2 / F1 / F2 / F3 + เอกชน + สสจ./สสอ. + รพ.สต.
- Department + ระบุเองได้ถ้าเลือก "อื่นๆ"

**UX อื่นๆ:**
- ปุ่ม "ย้อนกลับ" มุมซ้ายบน
- เกลาคำให้ทางการ: "หากท่านเป็นสมาชิกอยู่แล้ว กรุณาเข้าสู่ระบบ" / "หากท่านยังไม่เป็นสมาชิก กรุณาลงทะเบียน"
- Success screen: hourglass icon สีอำพัน "ส่งคำขอสำเร็จ — รอ admin อนุมัติ"

### Profile Modal (`public/tb-app.jsx`) — รื้อใหม่เป็นแนวนอน
ขนาด 920px × 88vh (จากเดิม 480px แนวตั้ง)

**Left column (280px gradient teal):**
- Avatar 90px มีขอบขาว — ใช้ตัวย่อตามวิชาชีพ (ภก./นพ./พว./ทพ.)
- ชื่อ + วิชาชีพ + Role badge
- Quick info card (รพ. + แผนก + วันเริ่มใช้)
- ปุ่ม "เปลี่ยนรหัสผ่าน" disabled (badge "เร็วๆ นี้") + "ปิดหน้าต่าง"

**Right column (scrollable, 2 columns layout):**
- **Section 1: ข้อมูลที่แก้ไขได้เอง** (สี teal, ดินสอ) → เบอร์โทร + แผนก
  - กดดินสอ → field เป็น input/dropdown → ✓/✗ save/cancel ทันที
- **Section 2: ต้องขออนุมัติแก้ไข** (สีอำพัน, ล็อค) → ชื่อ + วิชาชีพ + เลขใบประกอบ + รพ. + ประเภท รพ.
  - กดล็อค → sub-modal "ส่งคำขอแก้ไข" พร้อมกรอกค่าใหม่ + เหตุผล
  - กดส่งคำขอ → alert placeholder (รอ Resend integration)
- **Section 3: ข้อมูลระบบ (read-only)** → email + username + role + since

### Layout fix
- ลบ `overflow-hidden` + `h-full` ออกจาก `<body>` ใน `app/layout.tsx` → หน้า register scroll ได้

---

## 🔒 Part B: Critical Security Fix — RLS

### พบปัญหา
ทดสอบด้วย script `check-rls.mjs` (ทำตัวเป็นคนแปลกหน้าใช้ anon key):
- **TB Calc** (4 tables) — anon DELETE ได้ทุกตาราง
- **TB Dashboard** (tb_patients) — anon DELETE ข้อมูลคนไข้ได้

### สาเหตุที่แท้จริง — `allow all` policy
- ทั้ง 2 project มี RLS เปิดอยู่แล้ว ✅
- แต่มี policy เก่าชื่อ "allow all" (COMMAND=ALL, APPLIED TO=public) ที่อนุญาตทุกอย่าง
- Postgres RLS ใช้ OR logic → policy ใหม่ที่เพิ่มเข้าไปก็ไม่ทำงาน

### การแก้
1. ลบ policy "allow all" ทิ้งจาก Dashboard ของแต่ละ project (ใช้มือ จุดสามจุด → Delete)
2. รัน SQL สร้าง policy ใหม่ที่ explicit:

**TB Calc** (`scripts/fix-rls.sql`):
- visits: anon INSERT + SELECT (สำหรับนับสถิติ) + UPDATE (บันทึก duration)
- calculations / fdc_reverse / events: anon INSERT only — ห้าม SELECT/UPDATE/DELETE

**TB Dashboard** (`scripts/fix-rls.sql`):
- tb_patients: authenticated เท่านั้น (SELECT/INSERT/UPDATE/DELETE)
- anon ทำอะไรไม่ได้เลย

---

## 🔐 Part C: .gitignore — เกือบเสียท่า

ก่อน commit v0.7.1 แคลร์ตรวจพบว่า **repo ไม่มี `.gitignore` เลย** — เสี่ยง `.env.local` (Supabase API keys) หลุดขึ้น GitHub
- สร้างใหม่ตามมาตรฐาน Next.js (ignore: node_modules, .next, .env*, tsbuildinfo, .vscode, .idea)
- เช็ค git history → ไม่มีไฟล์ sensitive หลุดก่อนหน้านี้
- เพิ่ม `scripts/check-rls.mjs` ใน gitignore (debug script ส่วนตัว มี anon key hardcoded)

TB Calc มี .gitignore อยู่แล้ว แต่ไม่มี `.claude/` → เพิ่มเข้าไปด้วย

---

## 📚 บทเรียนสำคัญ (บันทึกแยกใน memory)

1. **[[feedback_user_is_normal_person]]** — พี่กัน = เภสัชกร ไม่ใช่โปรแกรมเมอร์ ห้ามคาดเดาว่ารู้ syntax/ศัพท์เทคนิค ทำทีละขั้น รอ confirm
2. **[[feedback_explain_code_to_nondev]]** — ส่ง code ก้อนใหญ่ต้องอธิบาย comment syntax ก่อน อย่าใส่ภาษาไทย/เลขข้อใน comment
3. **[[feedback_gitignore_first]]** — โปรเจกต์ใหม่ทุกครั้งต้องเช็ค `.gitignore` ก่อน commit แรก
4. **[[knowledge_env_local]]** — ใช้ `.env.example` pattern เก็บ template, `.env.local` จริงเก็บใน Google Drive/Bitwarden
5. **[[knowledge_supabase_rls]]** — โปรเจกต์ Supabase ใหม่ต้องลบ policy "allow all" ก่อน production

---

## 💼 ความรู้ที่พี่กันได้วันนี้ (จากบทสนทนา)

- **`.gitignore`** = "โพยรายชื่อของห้ามแตะ" ให้ Git อ่าน เพื่อไม่ส่งของลับขึ้น GitHub
- **`.env.local`** vs **`.env.example`** — ของจริงไม่ commit, template commit ได้
- **anon key** ≠ **service_role key** — anon ออกแบบให้ public ได้ แต่ต้องป้องกันด้วย RLS
- **RLS** = ระบบรักษาความปลอดภัยฝั่ง database ของ Supabase
- **Policy "allow all"** = ตัวร้ายที่ปิดประตูแบบเปิดโล่ง
- **Git ไม่ใช่ Dropbox** — เก็บ "ประวัติการเปลี่ยนแปลง" ไม่ใช่ "ไฟล์ล่าสุด" → ต้องดึงทุก commit
- **3 เครื่อง** สลับใช้ → ต้อง pull ก่อน push เสมอ (กัน conflict)

---

## 🚀 Roadmap ถัดไป (Phase 1 — Backend Foundation)

ตามแผนที่บันทึกใน `C:\Users\PKH\.claude\plans\image-2-concurrent-comet.md`:
1. สร้าง Supabase `profiles` table (SQL พร้อมแล้วในแผน)
2. สมัคร Resend + เพิ่ม `RESEND_API_KEY` ใน `.env.local`
3. สร้าง email templates (admin notify, user welcome/rejected, field edit request)
4. API routes: `/api/register`, `/api/admin/approve`, `/api/admin/reject`, `/api/profile/*`
5. หน้า `/pending-approval` + `/rejected` + `/admin/users`
6. middleware เช็ค `profiles.status`
7. Wire Profile modal → ลบ `DEMO_USER`, fetch จาก Supabase จริง
