---
name: tb-dashboard-pending-master
description: 📌 MASTER LIST — รวมทุกอย่างที่ยังไม่ได้ทำใน TB Dashboard ไว้ที่เดียว — อ่านไฟล์นี้ก่อนเสมอเมื่อพี่กันถามถึง roadmap/pending/สิ่งที่ค้าง
metadata: 
  node_type: memory
  type: project
  originSessionId: ea782730-7b5c-45d9-87f4-7d857e102cad
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB CARE & JOURNEY — Master Pending List

**อัปเดต:** 2026-05-17 (ภาคค่ำ — v0.7.7.2 deployed)
**วัตถุประสงค์:** รวมทุกของค้างจากทุก session มาไว้ที่เดียว เพื่อไม่ต้องวนอ่านหลายไฟล์

> **กฎการใช้:** ถ้าพี่กันถาม "ยังเหลืออะไร" / "roadmap" / "สิ่งที่ยังไม่ได้ทำ" / "แพลนคืออะไร" → อ่านไฟล์นี้ก่อนเสมอ ไม่ต้องไปวนเปิด session files
>
> **กฎการอัปเดต:** เมื่อทำเสร็จข้อไหน → mark ✅ ในไฟล์นี้ (ไม่ต้องลบ เก็บไว้เป็น history) เมื่อมีของใหม่ที่ค้าง → เพิ่มเข้าหมวดที่เหมาะสมพร้อมวันที่
>
> **อย่าลบของจาก session files เดิม** — ปล่อยไว้เป็น point-in-time record ไฟล์นี้คือ index รวม

---

## 🧰 ของค้างเก่าจาก v0.6.0 (session 2026-05-11) — ปุ่มหลอก/ยังไม่ทำงานจริง

1. **Supabase connection test** — ยังไม่ได้ทดสอบเพิ่มผู้ป่วยจริงแล้ว refresh ดู
2. **Column config sync via Supabase** — ตอนนี้ใช้ localStorage อย่างเดียว
3. **ปุ่ม "พิมพ์ใบจัดยา"** — กดแล้วแค่เปลี่ยนข้อความปุ่ม ยังไม่มี `window.print()` จริง
4. **Export Excel / PDF** — กดแล้วขึ้น "ส่งออกแล้ว!" แต่ไม่ได้ export ไฟล์จริง (DRP/Consult/Diagnosis CSV ใช้ได้ปกติ)
5. **Tab ประวัติสูตร** — dropdown ทำแล้ว แต่ยังไม่เกลาเต็ม
6. **วันนัดถัดไป (`nextAppt`, `daysUntil`)** — ยังเป็น demo hardcode ไม่ได้คำนวณจากข้อมูลจริง

> ⚠️ ข้อสังเกต: ข้อ 3-4 เป็น "ปุ่มหลอก" ผู้ใช้จริงจะงง → ทำพร้อม launch หรือซ่อนปุ่มไปก่อน

---

## 🎨 ของค้างจาก v0.7.0 Roadmap (session 2026-05-15)

7. **เกลา Timeline**
8. **Filter หัวคอลัมตารางแบบ Excel**

---

## 🔴 ก่อน Launch จริง (priority สูงสุด)

9. ✅ **ซื้อ domain `tbjourney.care`** (2026-05-16) + เชื่อม Custom Domain เข้า Cloudflare Worker tb-dashboard-bysirawit สำเร็จ — เปิด https://tbjourney.care เข้าเว็บได้แล้ว ⏳ verify DNS ใน Resend = ยังไม่ทำ
10. เปลี่ยน `EMAIL_FROM` ใน `lib/resend.ts` จาก `onboarding@resend.dev` → `noreply@tbjourney.care`
11. ตั้ง **Env Vars บน Cloudflare** ทั้ง 2 sections (Runtime + Build) — ดู [[knowledge_env_production]]
12. ตั้ง **Site URL + Redirect URLs** ใน Supabase Auth → Authentication → URL Configuration

---

## 🟡 Phase 2 ฟีเจอร์ (หลัง Phase 1 backend เสร็จ)

13. **ระบบเปลี่ยนรหัสผ่าน**:

    **A. ✅ เปลี่ยนรหัสในโปรไฟล์ — เสร็จ v0.7.12.0 (2026-05-27)** ดู [[session-tb-dashboard-2026-05-27]]
    - Toggle view ในฝั่งขวา Profile Modal (ไม่ซ้อน popup)
    - Strength meter + checklist 5 ข้อ (copy จาก register เป๊ะ)
    - บังคับ re-auth รหัสเดิม + ห้ามตั้งซ้ำรหัสเดิม
    - Rate limit 3 ครั้ง/24 ชม. (table `tb_password_change_log` + audit IP/UA)
    - ส่งเมลแจ้งเตือนผ่าน Resend
    - API เดียวรวม flow atomic: `/api/auth/change-password`

    **B. ✅ ลืมรหัส / รีเซ็ตทางอีเมล — เสร็จ v0.7.12.1 (2026-05-27)** ดู [[session-tb-dashboard-2026-05-27]]
    - ลิงก์ "ลืมรหัสผ่าน" ในหน้า login → /reset-password (กรอกอีเมล) → เมล Resend → /reset-password/confirm (token_hash) → ตั้งรหัสใหม่
    - ใช้ verifyOtp + token_hash แทน PKCE (admin-generated link ไม่มี code_verifier)
    - Anti-enumeration (ตอบ success เสมอ) + Rate limit 3/ชม.ต่ออีเมล + Server strength enforce
    - Audit log ครบ: tb_password_reset_log (คำขอ) + tb_password_change_log (เพิ่ม action+success+failure_reason)
    - ส่งเมลแจ้งเตือนหลัง reset สำเร็จ (กันคนแฮกอีเมลไป reset)
14. **Profile Modal ปุ่ม "ส่งคำขอแก้ไข"** — ยัง alert placeholder ต้องเชื่อม edit_requests table + API
15. **Session Timeout 12 ชม. (PDPA)** — ตอนนี้ใช้ Option A (ปล่อยไปก่อน) Option B = implement เองฝั่ง code (ฟรี เก็บ timestamp ใน cookie/localStorage)
16. **Email Verification ตอน Register** — ตอนนี้ auto-confirm ข้าม verify อาจเปลี่ยนให้กดลิงก์ก่อน

---

## 🟢 ไม่เร่งด่วน

17. **Admin Audit Log** — เก็บ log การ approve/reject/edit (ใคร/เมื่อไหร่/เปลี่ยนอะไร)
18. **Edit Request System** — table `edit_requests` + API + admin UI
19. ⚠️ **RLS Strict mode สำหรับ `tb_patients`** — ตอนนี้ authenticated CRUD ได้หมด ต้อง:
    - DELETE → admin only
    - SELECT/UPDATE → เฉพาะ user รพ.เดียวกัน
    - INSERT → approved user เท่านั้น
20. ✅ **Rate Limiting ตอน Register** — ทำแล้ว v0.7.5.4: 3 ครั้ง/สัปดาห์ (rejection_week_start + rejection_week_count) + ปุ่มปลดล็อกสำหรับ Admin + auto-reset หลัง 7 วัน
21. **Notification System ในแอป** — เชื่อมกระดิ่งกับ approve/reject event

---

## 🔵 Future Vision (long-term)

22. **Multi-Hospital Support** — data isolation ระดับโรงพยาบาล, dashboard แยกตาม รพ.
23. **ขาย/แจกให้โรงพยาบาลอื่นใช้** — design รองรับ multi-tenant ตั้งแต่ตอนนี้

### 52. Bundle Size Budget (ดอง — รอ multi-tenant launch) — เพิ่ม 2026-06-01
- **เพดานเว็บ:** ตั้งกฎ "bundle ห้ามเกิน 2 MB" (ยืดหยุ่น) เผื่อใส่ฟีเจอร์โตขึ้นเรื่อยๆ
- **Setup:** `npm install @next/bundle-analyzer` + script `"analyze": "ANALYZE=true npm run build"`
- **ทำไมดอง:** ตอนนี้ใช้คนเดียว (พี่กัน) → user เน็ตเร็ว → bundle 2 MB โหลด 1-2 วินาที ไม่กระทบ
- **ทำตอน:** เริ่มเตรียมเปิดให้ รพ. อื่นใช้ (multi-tenant) → user หลายคน → เน็ตช้า/มือถือ → bundle ขนาดสำคัญ

### 53. GitHub Action CI — auto bundle check (ดอง — รอ multi-tenant launch) — เพิ่ม 2026-06-01
- **คนงานหุ่นยนต์:** สร้าง `.github/workflows/size-check.yml` → auto check ทุก push/PR
- **ทำงาน:** ถ้า bundle > 2 MB → block PR + แสดง warning
- **Tool:** ใช้ `size-limit` หรือ custom script
- **ทำไมดอง:** ใช้คนเดียว → แคลร์ระวังเองได้ → ไม่ต้องการ automation ตอนนี้
- **ทำตอน:** พร้อมกับข้อ 52 (เปิด multi-tenant) → ป้องกัน fast regression
- **Prerequisite:** Enable GitHub Actions feature ใน repo settings (1 click)

---

## ✨ QoL Improvements (เพิ่ม 2026-05-16)

### 29. 🎬 Popup Animation ทั้งเว็บ (เพิ่ม 2026-05-29 — นำร่องแล้วที่ About)
- **เป้าหมาย:** นำ popup animation แบบ A (Fade + Scale + Slide) ไปใช้กับ **popup/modal ทั้งหมดของเว็บ**
- ตอนนี้ทำแล้วเฉพาะ AboutModal (v0.7.13.4) — popup อื่นยังเด้งปุ๊บปั๊บ
- **สูตรที่เลือก (อยู่ใน `public/app.html`):**
  - เปิด: `.modal-A` 0.9s `cubic-bezier(0.16,1,0.3,1)` — opacity 0→1 + scale 0.96→1 + translateY 35px→0
  - ปิด: `.modal-A-out` 0.6s `cubic-bezier(0.4,0,1,1)` — เลื่อนลง 35px + จางหาย
  - overlay: `.modal-overlay-out` พื้นหลังจางตอนปิด
  - keyframes สำรอง B/C/D เตรียมไว้แล้วใน app.html
- **วิธี apply (pattern จาก AboutModal):** state `closing` + `handleClose()` setTimeout(onClose, 580) + สลับ class เปิด/ปิด + ปุ่มปิด/คลิก overlay เรียก handleClose
- **popup ที่ต้องไล่ทำ:** UserProfileModal, confirm popups ต่างๆ, notification modal, delete dialogs, ฯลฯ
- **งานปานกลาง** — ทำทีละ popup ระวัง popup ที่ unmount ทันที (ต้องเพิ่ม closing state)

### 30. 📜 Changelog Popup — ประวัติการอัปเดตเว็บ (เพิ่ม 2026-05-29 — พี่กันอยากได้)
- **เป้าหมาย:** popup แสดง "ประวัติการอัปเดตเว็บ (Changelog)" ให้ user เห็นว่าแต่ละเวอร์ชันเพิ่ม/แก้อะไร
- **แรงบันดาลใจ:** เว็บ Pharmatools (by เภสัชเอ็นดู) — popup เด้งตอน login มีหัวข้อ "🎉 ประวัติการอัปเดตเว็บ (Changelog)"
  แสดงรายการเรียงจากใหม่→เก่า: เวอร์ชัน X.X.X (วันที่) + bullet สิ่งที่เพิ่ม/แก้ + ปุ่ม "รับทราบและเข้าสู่ระบบ"
- **องค์ประกอบที่ต้องมี:**
  - data array เก็บ version history (version, วันที่, รายการ changes แต่ละข้อ + ไอคอน emoji)
  - popup scroll ได้ (เวอร์ชันเยอะ) เรียงใหม่→เก่า
  - เด้งอัตโนมัติครั้งแรกหลัง update (เทียบ APP_VERSION กับ last-seen ใน localStorage) — เห็นแล้วไม่เด้งซ้ำ
  - มีปุ่มเปิดเองได้ (เช่นในเมนู/About) — กดดูประวัติย้อนหลัง
  - ปุ่ม "รับทราบและเข้าสู่ระบบ" / ปิด
- **ข้อมูลพร้อมแล้ว:** commit history ทั้งหมด (v0.6.0 → v0.7.13.4) มีรายละเอียดครบ ใช้เขียน changelog ได้เลย
- **ใช้ popup animation A** (ข้อ 29) ตอนเด้ง
- **งานปานกลาง** — UI + data array + localStorage logic

### 27. Visit Form แยก 2 แบบ: OPD / Admit
- ปัจจุบันฟอร์มเหมือน OPD อย่างเดียว
- ต้องการ: toggle เลือก OPD หรือ Admit → UI เปลี่ยนนิดๆ ตามประเภท
- Admit: วันที่ admit/discharge ควรอยู่รวมกัน, field อื่นๆ ตามบริบท ward
- **สถานะ:** ไว้ระดมสมองตอนทำจริง ตอนนี้แค่ note ไว้

### 28. Timeline + หน้ากรอกข้อมูล — รีวิวครั้งใหญ่ (version ถัดไป)
- Timeline ปรับปรุง UI ใหม่
- เมื่อแก้ไขโดสยา → ควร auto-log เข้า timeline ด้วย (ตอนนี้ยังไม่ทำ)
- ฟอร์มกรอกข้อมูล Visit รีวิวและขยาย field ครั้งใหญ่
- **สถานะ:** รอทำทั้ง package ในเวอร์ชั่นถัดไป

---

## 🤖 AI Integration (เพิ่ม 2026-05-16)

### 25. AI วิเคราะห์/แนะนำเคส
- เรียก Claude/Gemini/GPT API จากฝั่ง server ส่งข้อมูลคนไข้ → ได้คำวิเคราะห์กลับ
- Use case: "adherence ตก 3 เดือนควรทำยังไง" / "ALT ขึ้น 3 เท่า hold ยาตัวไหน" / "สรุปประวัติคนไข้"
- ต้องการ: API route ฝั่ง server, UI ปุ่ม "ขอคำแนะนำ AI", panel แสดงผล

### 26. AI Auto-fill ฟอร์ม Visit จาก text ก้อนใหญ่ (Structured Extraction)
- **ฟีเจอร์เรือธง** ตามที่พี่กันต้องการ — ลด data entry 80-90%
- Flow: paste text รวม (ปากเปล่า+lab+CXR+sputum+ยา) → กดปุ่ม → AI สกัดเป็น JSON → JS ยิงเข้าช่องฟอร์ม → user review + save
- ใช้ JSON schema ตามฟอร์ม visit ของเรา
- บังคับ user review ก่อน save ทุกครั้ง ห้าม auto-save

### ⚠️ ข้อควรระวังก่อนทำ AI features (สำคัญ — อ่านก่อนเริ่ม)
1. **💰 ค่าใช้จ่าย:** API ไม่ฟรี — Claude/GPT ~0.30-2 บาท/เคส ต้องคิด budget + อาจ rate-limit ผู้ใช้
2. **🔒 PDPA:** ข้อมูลคนไข้ส่งไป external (Anthropic/OpenAI/Google) ต้องระบุใน privacy policy + ขอ consent + พิจารณา de-identify ก่อนส่ง
3. **🤖 Hallucination:** AI อาจมั่ว โดยเฉพาะ dose/ยา — **บังคับ user review** + ห้าม auto-save + แสดง disclaimer ชัดเจน
4. **🔑 API key:** ต้องอยู่ server-side เท่านั้น (ใน .env + Cloudflare env vars) ห้ามให้ frontend เห็น
5. **🏥 เลือก model:** Claude Sonnet 4.6 หรือ GPT-4 เหมาะกับ medical Thai มากกว่า Gemini
6. **🧾 Logging:** เก็บ log ทุก AI call (ใคร/เมื่อไหร่/เคสไหน/ผลลัพธ์) สำหรับ audit + accountability

---

## ⚠️ ยังไม่ได้ทดสอบ

24. **Approve/Reject flow ครบวงจร** — รอ verify domain (Resend free + onboarding@resend.dev ส่งได้แค่ gmail พี่กัน) เทสครบ:
    1. สมัครด้วยเมลอื่น (เช่น hotmail)
    2. ตรวจเมล admin notify (gmail)
    3. ตรวจเมล user pending (hotmail)
    4. `/admin/users` → approve
    5. ตรวจเมล approved (hotmail)
    6. user login เข้าระบบได้
    7. ทดสอบ reject flow + เหตุผล

---

## 🗑 ระบบถังขยะ — Trash System (เริ่ม 2026-05-16 ภาคค่ำ)

**เป้าหมาย:** ลบผู้ป่วยแบบมี soft delete → ถังขยะ 60 วัน → hard delete + audit log

### สถานะแต่ละ Step
- ✅ **Step 1: DB Schema** — `scripts/add-trash-system.sql` รันเสร็จ (เพิ่มคอลัมน์ deleted_at/by/reason, ตาราง tb_delete_requests + tb_patients_deleted_log, trigger, pg_cron auto-purge 60 วัน)
- ✅ **Step 2: Admin delete flow** — ปุ่มลบในแท็บสรุปเภสัช + 2 dialog (เหตุผล → ยืนยัน60วัน) — ค้าง: ยังไม่ได้เทสจริงเพราะติดบั๊ก schema/RLS อื่น
- ✅ **Step 3: หน้าถังขยะ** — list คนในถังขยะ + ปุ่ม Restore + ปุ่มลบถาวร + dialog พิมพ์ HN ยืนยัน
- ✅ **Step 4: User request flow** — ปุ่ม "ขอลบผู้ป่วย" สำหรับ user ทั่วไป + dialog ใส่เหตุผล + กด once แล้ว disable แสดง "รออนุมัติลบ..."
- ✅ **Step 5: Bell + Email** — Bell admin (แจ้งใน notification + badge sidebar ถังขยะ) + เมลแจ้ง admin เมื่อมีคำขอ + เมลแจ้ง user เมื่อ approved/rejected + เมลเขียน admin contact (siravitphoapha9928@gmail.com) ในถังขยะ
- ✅ **Step 6: ทดสอบ pg_cron auto-purge (2026-05-17)** — job `purge_trash_60d` มีจริง simulate 61 วัน → DELETE manual → ลบจริง
- ✅ **Step 7: เมล เมื่อ hard delete** — FK fix: delete tb_delete_requests ก่อน lookup requested_by แล้วค่อย delete tb_patients → ส่งเมล 'hard-deleted' + 'restored' ให้ user
- ✅ **Step 8: Bell notification ใน-app สำหรับ user (v0.7.7, 2026-05-17)** — table `tb_notifications` + insert ใน delete-notify route + realtime subscribe ใน tb-app.jsx → user เห็น bell เด้งทันที กดที่ reject/restored → เปิด clinical modal ผู้ป่วยคนนั้นเลย

### Design decisions (ตัดสินไว้แล้ว)
- Soft delete + Hard delete จริง (ผู้ใช้ยืนยัน — มี audit log ป้องกัน)
- ทุก user เห็นถังขยะได้ แต่ Restore/ลบถาวร = admin เท่านั้น
- ลบถาวรต้อง: พิมพ์ HN ยืนยัน + checkbox "เข้าใจว่ากู้คืนไม่ได้"
- Admin ลบ → ต้องพิมพ์เหตุผล (required)
- ระหว่างรอ admin อนุมัติคำขอลบ → ผู้ป่วยยังอยู่หน้า Active ปกติ + ป้าย "รออนุมัติลบ"
- ⚠️ **เตือนพี่กันแล้ว** เรื่อง พ.ร.บ.สุขภาพ ต้องเก็บเวชระเบียน 5-10 ปี — พี่กันยืนยันใช้ hard delete + audit log

---

## 🐛 บั๊กที่เพิ่งแก้ (2026-05-16 ภาคค่ำ)

### A. ไม่มี Session ใน iframe (root cause สำคัญ)
- **อาการ:** save patient → 400 reject เงียบๆ ตอนนี้บอก "approved + admin แล้ว แต่ INSERT ไม่ผ่าน"
- **Root cause:** เว็บแบ่ง 2 ชั้น (Next.js + iframe `/app.html`) — login token อยู่ในชั้นนอก (cookies via `@supabase/ssr`) แต่ `window._sb` ใน `tb-data.js` ใช้ anon key ล้วน → `auth.uid()` = null → RLS strict mode บล็อก
- **Fix:**
  1. สร้าง `app/api/auth/session/route.ts` — endpoint คืน access_token + refresh_token
  2. `tb-data.js` เพิ่ม `window._sbReady` — fetch session แล้ว `_sb.auth.setSession(...)` ก่อนเรียกอะไร
  3. `tb-app.jsx` รอ `_sbReady` ก่อน `loadPatients()`
- **บทเรียน:** ทุกครั้งที่เพิ่ม RLS policy ที่อิง `auth.uid()` → ต้องเช็คว่า client มี session token จริง ไม่ใช่ anon

### B. Profiles RLS infinite recursion
- **อาการ:** error `42P17: infinite recursion detected in policy for relation "profiles"`
- **Root cause:** policy บน profiles มี subquery `select from profiles` → triggers same policy → loop
- **Fix:** ใน `scripts/fix-schema-and-profiles-rls.sql`:
  - สร้าง `public.is_admin()` + `public.is_approved()` เป็น `security definer` (bypass RLS)
  - drop policies เดิมทั้งหมด + สร้างใหม่ใช้ function แทน subquery
  - อัปเดต tb_patients/tb_delete_requests/tb_patients_deleted_log policies ใช้ function เดียวกัน
- **บทเรียน:** policy ห้ามทำ subquery กลับเข้าตารางตัวเอง — ใช้ SECURITY DEFINER function แทน

### C. tb_patients ขาดคอลัมน์เพียบ
- **อาการ:** `PGRST204: Could not find the 'archived'/'outcome' column`
- **Root cause:** ตอน build app ไม่ได้สร้างคอลัมน์ครบ — `patientToDb` ส่ง 30+ field แต่ DB มีไม่ครบ
- **Fix:** `scripts/fix-schema-and-profiles-rls.sql` เพิ่ม `add column if not exists` ทั้ง 30+ ฟิลด์
- **บทเรียน:** ถ้าเพิ่มฟิลด์ใหม่ในฟอร์มผู้ป่วย → ต้อง alter table เพิ่มคอลัมน์ด้วย (รัน SQL ใหม่ทีหลังได้)

---

## 📝 ระบบกรอกข้อมูลผู้ป่วยยังไม่สมบูรณ์

29. **ฟอร์มผู้ป่วย expand ทีหลัง** — ปัจจุบันยังขาดข้อมูลหลายช่อง (พี่กันบอก 2026-05-16 ภาคค่ำ ตอนรัน fix schema) — เมื่อขยายฟอร์ม ให้รัน `alter table add column if not exists` เพิ่มได้เรื่อยๆ

30. **AdminUsersTab — หลายมุมมอง (view modes)** — ปัจจุบันแสดงเป็น card-row (1 row ต่อ user) ตอนกด "ทั้งหมด" → อยาก toggle ได้ระหว่าง: list view / grid card view / table view / timeline view (พี่กันบอก 2026-05-17 ตอนทำ Step 4a) — **ตอนนี้มี list/card 2 มุมมองแล้ว ค่อยขยายเพิ่ม**

32. ✅ **ระบบ Reject/Re-register — v0.7.5.4 (2026-05-17)** — ครบแล้ว:
    - ✅ reject → user สมัครใหม่ด้วยเมลเดิมได้ (reset เป็น pending)
    - ✅ rate limit 3 ครั้ง/สัปดาห์ (auto-reset หลัง 7 วัน)
    - ✅ admin ปุ่มปลดล็อก (🔓 สีส้ม) เมื่อ user โดนบล็อก
    - ✅ admin ปุ่มลบถาวร (🔥) ใน rejected tab
    - ✅ hard-delete → ส่งเมลแจ้ง user ว่าบัญชีถูกลบ
    - ⏳ **ค้าง (พรุ่งนี้ทำ — 2026-05-18):** เก็บ history การ reject (rejected_reason ถูก overwrite ตอน re-register) — แผน: สร้าง table `tb_user_reject_log` (id, user_id, rejected_by, rejected_reason, rejected_at) + แก้ API reject ให้ INSERT แทน overwrite + UI ใน AdminUsersTab แสดง history
    - ⏳ ค้าง: admin notification เมื่อ user re-register หลังถูก reject

34. ✅ **ปิดบัญชี approved user (2026-05-17)** — ปุ่ม "ปิดบัญชี" (🚫 สีส้ม) ใน approved tab → เปลี่ยนสถานะเป็น rejected → จากนั้นลบถาวรได้ตามปกติ | API: `/api/admin/deactivate-user` | ป้องกันลบ Admin โดยไม่ตั้งใจ
    - ⏳ อนาคต: ระบบ user management สมบูรณ์ (soft-delete + audit trail) ต้องออกแบบใหม่ตอนทำ multi-tenant

35. **Multi-Tenant Architecture — อนาคต** — ตอนนี้ทุก user อยู่ฐานข้อมูลเดียวกัน | แผน: แยก partition ต่าง รพ./องค์กร ผู้ใช้ใน รพ.เดียวกันดูข้อมูลผู้ป่วยร่วมกันได้ ต่าง รพ.แยกกัน | ดู [[project_tb_dashboard_business_model]]

31. **AdminUsersTab — Phase 2 ปรับแต่ง (2026-05-17 จด)** — รอระดมไอเดียตอนทำจริง:
    - 🔍 Filter หัวคอลัมน์เหมือน Excel (วิชาชีพ / รพ. / แผนก / สถานะ — ตัวเลือก dropdown ช่วย)
    - 🗑 ระบบลบ user (soft delete + ถังขยะ + audit เหมือนระบบลบผู้ป่วย)
    - 📊 Sort ตามคอลัมน์ (กดหัวคอลัมน์)
    - 🏷 Bulk actions (เลือกหลายคนทีเดียว → approve/reject/ลบ)
    - 📤 Export CSV รายชื่อ user
    - 🔑 ระบบ reset password ให้ user (admin ช่วย)
    - 📝 Edit profile ของ user คนอื่น (admin override)
    - บลาๆ — รอระดมตอนทำจริง

---

## 📱 ระบบเบอร์โทร + OTP (เพิ่ม 2026-05-18)

### 36. ระบบยืนยันเบอร์โทรด้วย OTP
- ตอนสมัคร — ส่ง OTP ไปเบอร์มือถือ ผู้สมัครใส่รหัสยืนยัน
- ใช้ป้องกัน: bot, การสมัครหลายบัญชี, ยืนยันตัวตน
- service ที่อาจใช้: Twilio / Vonage / Firebase Phone Auth / SMS local provider ของไทย
- ⚠️ ต้องคิดเรื่อง: ค่าใช้จ่ายต่อ OTP, rate limit, ฟอลแบ็คเมื่อส่งไม่สำเร็จ
- **สถานะ (2026-05-20):** เบอร์โทรบังคับกรอกแล้ว (required) — รอทำ OTP จริงตอนพร้อม budget

---

## 🛠 Developer Preview Subdomain (เพิ่ม 2026-05-17)

### 33. สร้าง dev.tbjourney.care — ระบบหลังบ้านสำหรับผู้พัฒนา

**ไอเดีย:** สร้างเว็บแยกอีกตัวที่ `dev.tbjourney.care` สำหรับพี่กันคนเดียว ใช้ดูหน้าซ่อนทั้งหมดได้โดยไม่ต้องทำตาม flow จริง

**ตัวอย่างหน้าซ่อนที่ควรดูได้:**
- `/register` → หน้า "ส่งคำขอเรียบร้อย" (ปกติขึ้นหลังกดสมัครสำเร็จ)
- `/register` → หน้า "อีเมลนี้มีคนสมัครแล้ว" (error state)
- `/pending-approval` → หน้า "รออนุมัติ" (ขึ้นหลัง login ก่อน admin approve)
- `/rejected` → หน้า "ถูกปฏิเสธ" + เหตุผล (ขึ้นหลัง admin reject)
- อีเมลทุกฉบับ — admin notify / user pending / approved / rejected (ปกติต้องส่งจริงถึงจะเห็น)
- Toast / notification ทุกแบบ — success / error / warning
- Dialog ยืนยันลบผู้ป่วย, Dialog ถังขยะ, Dialog ลบถาวร

**วิธีทำ (คร่าวๆ):**
- สร้างโปรเจกต์ใหม่ (หรือ route แยก) ที่ `dev.tbjourney.care`
- ล็อกด้วยรหัสผ่านง่ายๆ (HTTP Basic Auth หรือ hardcode password ก็พอ — ไม่ต้องซับซ้อน เพราะใช้แค่คนเดียว)
- มีหน้า index แสดงลิงก์ทุกหน้าที่ซ่อนอยู่ กดแล้วเห็นได้เลย

**ประโยชน์:** ไม่ต้องสมัครจริง ไม่ต้องรอเมล ไม่ต้อง reject ตัวเอง แค่คลิกดูได้เลย

**สถานะ:** ไว้ทำทีหลัง — ตอนนี้ priority ต่ำ รอระบบหลักเสร็จก่อน

---

## 🔴 ระบบเลขใบประกอบวิชาชีพ — บั๊ก (audit 2026-05-21)

37. ✅ **ตารางวิชาชีพ→คำนำหน้า ซ้ำ 4 ที่ key ไม่ตรงกัน — แก้แล้ว 2026-05-21** (รวมบัญชีกลาง 2 เล่ม ⚠️ ยังไม่เทส) ดูเต็ม [[tb-dashboard-license-system]]
    - 🔴 พยาบาล/นักสาธารณสุข เปิดโปรไฟล์ → วิชาชีพกลายเป็น "อื่นๆ" (key nurse1 vs nurse)
    - 🔴 คำนำหน้าหายตอน admin อนุมัติแก้ (medtech/physio/radio prefix='' / พยาบาล key ไม่เจอ)
    - 🟠 regex ตัดคำนำหน้ารู้จักแค่ ว ท ภ ป (ช./ทน./ก./รส./สธ. ตัดไม่ออก)
    - 🟡 approve-edit แปลง label ไทย→key ไม่ครบ
    - 🎨 UX: "(prefix: ภ.)" อังกฤษ / 3 ทางเข้ากรอกไม่เหมือนกัน / admin ไม่มี validation
    - 💡 แก้: รวมตารางวิชาชีพเป็น single source + ใช้ key ชุด DB จริง + regex ครอบคลุม + กรอกแบบเดียวกันทุกที่
    - ⚠️ ระวัง migrate ค่า profession เดิมใน DB

---

## 📷 อัปโหลดรูปโปรไฟล์ (เพิ่ม 2026-05-21)

38. ✅ **ระบบอัปโหลดรูปโปรไฟล์ผู้ใช้ — เสร็จ v0.7.18.0 (2026-06-03)** ดู [[session_tb_dashboard_2026_06_03_avatar_v0_7_18_0]] — ครอบ (cover+กริด+ซูมออก) + เก็บ 2 ไฟล์ (ครอบ 512 + ต้นฉบับ 1920 WebP100%) บน Cloudflare R2 + เครื่องมือดูรูปสไตล์ Windows Photos + ครอบใหม่ + ลบ(ยืนยัน) · **เหลือ Step 4: แสดง avatar ที่ sidebar + comment author/reply (ตอนนี้โชว์เฉพาะใน profile modal)** + ตั้ง env R2 บน Cloudflare
    - ⚠️ **ตอนทำจริง: ต้องบีบอัดรูปแบบไม่เสียความละเอียด** (พี่กันเน้น) — พิจารณา: resize + compress ฝั่ง client ก่อนอัป (เช่น browser-image-compression), เก็บใน Supabase Storage, จำกัดขนาด/นามสกุล, แปลง WebP
    - เก็บ URL รูปใน profiles (เพิ่มคอลัมน์ avatar_url)

## 💊 ระบบรายการยา (วิสัยทัศน์ — เพิ่ม 2026-05-21)

39. **ระบบรายการยาโรคร่วม — แผนเต็ม** (หน้าตั้งค่า > ยาโรคร่วม)
    **วิสัยทัศน์ที่พี่กันวางไว้:**
    - 📚 ระบบมี **รายการยาให้มากที่สุด** (comprehensive drug list) มาให้ตั้งแต่แรก
    - ➕ ผู้ใช้ **add ยาที่ไม่มีเองได้** (มีช่องเพิ่มแล้ว)
    - 🔗 ยาเหล่านี้ **เชื่อมกับประวัติผู้ป่วย** — ตอนสร้าง/แก้ผู้ป่วย เลือกยาโรคร่วมจากรายการนี้ (concomitant drugs)
    - ⚠️ ยา **เชื่อมกับระบบ Drug Interaction** — เช็คปฏิกิริยากับยา TB อัตโนมัติ
    - 🗂 **จัดกลุ่มยา** (กำลังจะทำเป็นขั้นแรก) — แบ่งยา 12 ตัวปัจจุบันเป็นหมวด เช่น เบาหวาน/ความดัน-หัวใจ/ขับปัสสาวะ/HIV/อื่นๆ
    **สถานะ:** ขั้นแรก = จัดกลุ่มยาในหน้าตั้งค่าก่อน (ยังไม่เริ่ม รอสรุปกลุ่มกับพี่กัน)
    **ยาปัจจุบัน 12 ตัว:** Metformin, Glipizide, Insulin, Amlodipine, Enalapril, Losartan, Furosemide, ARV (Efavirenz), ARV (PI-based), Prednisolone, Allopurinol, Warfarin

## 🚀 Performance — ทำเว็บให้เร็วขึ้น (เพิ่ม 2026-05-21, พี่กันสั่งทำพรุ่งนี้)

40. **เว็บเริ่มช้า/หมุนๆ — ต้อง optimize (priority: พรุ่งนี้ 2026-05-22)**
    - อาการ: พี่กันบอกเว็บ "เริ่มหมุนๆ" (โหลดช้า)
    - **สาเหตุที่น่าสงสัยที่สุด:** `public/app.html` ใช้ **Babel standalone transpile ใน browser ตอน runtime** (`<script type="text/babel">`) — ช้ามากเพราะ tb-app.jsx + tb-modals.jsx ใหญ่ขึ้นเรื่อยๆ ต้อง compile ใหม่ทุกครั้งที่โหลด
    - แนวทางแก้ที่ควรพิจารณา:
      * 🥇 **Pre-compile JSX → JS** ตอน build (เลิกใช้ Babel standalone) — ผลกระทบเยอะสุด
      * โหลด React/Chart.js/FontAwesome แบบ defer/async หรือ self-host
      * code-split / lazy load แท็บที่ไม่ได้ใช้
      * ลดขนาด tb-app.jsx (ตอนนี้ไฟล์เดียวใหญ่มาก ~3000 บรรทัด)
    - ⚠️ ระวัง: ถ้าเปลี่ยน build process ต้องเทสว่า Cloudflare Pages ยัง deploy ได้

## 👑 ระบบสิทธิ์แอดมิน / หลายแอดมิน (เพิ่ม 2026-05-22 — พี่กันจะทำเป็นงานถัดไป)

42. **ระบบให้อภิสิทธิ์แอดมิน (Admin Privileges)** — 📐 **แผนพร้อมแล้ว (คุย 2026-05-22) รอวันว่างทำ**

    **✅ design ตัดสินแล้ว:** Super Admin — **พี่กันคนเดียว**แต่งตั้ง/ถอนแอดมินได้ (admin ธรรมดาทำงานได้หมดแต่แต่งตั้งคนอื่นไม่ได้) — กัน admin คนอื่นถอนสิทธิ์พี่กันเอง

    **🔧 วิธีทำ (แนะนำ — ไม่ต้องรื้อของเดิม):**
    - ใช้ **ป้าย `is_super_admin` (boolean)** ติดบัญชีพี่กัน — ไม่เพิ่ม role ใหม่ → ไม่ต้องแก้ API เดิม 11 จุด (ที่เช็ค `role !== 'admin'`)
    - พี่กัน = role 'admin' + is_super_admin=true | admin ธรรมดา = role 'admin' + is_super_admin=false
    - ✅ currentUser มาจาก profile/me ที่ `select('*')` → เพิ่มคอลัมน์แล้ว currentUser ได้ is_super_admin ฟรี ไม่ต้องแก้

    **🛠 ขอบเขตงาน:**
    1. SQL: `alter table profiles add column is_super_admin boolean default false` + bootstrap `update ... set is_super_admin=true where email='siravitphoapha9928@gmail.com'`
    2. API ใหม่ `set-admin-role`: เช็ค caller.is_super_admin + รับ userId+makeAdmin + update role 'admin'/'user'
    3. ปุ่ม "ตั้งเป็นแอดมิน"/"ถอนสิทธิ์แอดมิน" (เห็นเฉพาะ super admin) + popup ยืนยัน

    **🛡 กฎความปลอดภัย (ต้องใส่):** เห็นปุ่มเฉพาะ super admin · ห้ามถอน/แตะ super admin (กันพี่กันโดนถอน) · ห้ามถอนตัวเอง

    **🤔 ประเด็นค้างต้องตัดสินตอนทำ:**
    1. **ปุ่ม "ถอน admin→user" วางไหน?** — ปัญหา: ตอนนี้ admin ไม่โผล่ในแท็บไหนให้จัดการเลย (ปุ่มจัดการซ่อนเมื่อ role==='admin') → ต้องเพิ่มที่แสดงรายชื่อแอดมิน เช่น แท็บ "ผู้ใช้ทั้งหมด" โชว์ป้าย admin + ปุ่มถอน
    2. **จดประวัติการแต่งตั้ง/ถอนไหม?** — เข้าระบบ audit (action 'grant_admin'/'revoke_admin' ใน tb_user_action_log) หรือทำปุ่มเฉยๆ ก่อน
    3. แสดงป้าย Super Admin/Admin ใน user list ไหม

    **⚠️ พอมีหลายแอดมิน → เพิ่ม realtime ข้ามเครื่อง** ให้ tb_user_action_log (ตอนนี้ self-action อัปเดตทันที แต่ข้ามเครื่องยังไม่ subscribe)
    - ดู [[project_tb_dashboard_business_model]]

    **🔌 ฟีเจอร์ที่จะปลดล็อกตอนทำเรื่องนี้:**
    - **🚪 Admin บังคับ logout user** — ปุ่มในหน้าจัดการผู้ใช้ "บังคับให้ออกจากระบบทุกอุปกรณ์" (`/api/admin/force-signout`)
      - เพิ่มแล้วใน schema: `tb_session_log.end_reason = 'forced_by_admin'` + `tb_logout_log.logout_type = 'forced_by_admin'`
      - UI ป้ายแดง "admin บังคับออก" ในประวัติ session แสดงรอแล้ว (B3 — v0.7.12.5)
      - ใช้ตอน: user ถูกแฮก / ออกจากงาน / ใช้เครื่องไม่ปลอดภัย
      - ต้องเช็ค: admin ที่กดต้องมีสิทธิ์ + ห้ามบังคับ super admin ออก
    - **⚡ Race condition reject** (Bug Audit ข้อ 7) — มีปัญหาตอน admin หลายคนกดปฏิเสธพร้อมกัน
    - **🔔 Realtime sync** — bell + audit log ข้ามเครื่องต้อง subscribe

## 🛡️ Security — Rate Limiting (อัปเดต 2026-05-22)

41. **กันเดารหัสผ่านที่หน้า login (Rate Limiting)** — พี่กันสนใจ ไว้แพลนหน้า
    - ทำเหมือน register (v0.7.11.3) แต่กับหน้า login — กันบอท brute force เดารหัส
    - วิธี: Cloudflare > Security rules > Rate limiting (มีโควต้า Custom rules ฟรีอีก 5 กฎ แต่ rate limiting rule ฟรีแค่ 1 ใช้กับ register ไปแล้ว → login ต้องใช้ Custom rule หรืออัปเกรด plan)
    - ⚠️ ต้องเช็ค: login endpoint คือ /api/login-lookup หรือ Supabase auth โดยตรง (อาจต้องกันที่ Supabase ระดับ Auth แทน)
    - กฎ rate limiting อื่นที่น่าทำตอนเปิดสาธารณะ: geo-block, captcha challenge, ปกป้อง /api/* ทั้งหมด

## 📸 v0.7.15 — ระบบอัปโหลดภาพ + Cloudflare R2 (เพิ่ม 2026-05-30 — พี่กันวางแผน)

43. **ระบบอัปโหลดภาพครบวงจร — Profile + CXR** · ✅ Profile avatar = v0.7.18.x · ✅ CXR/Lab/เอกสาร = **push v0.7.19.0→.2 (e79c733/bf162f6/0080b87)** — แท็บรูป + คลังรูป (Google Photos) + เทียบ CXR + ตัวดูรูประดับเว็บดัง + HEIC (heic-to/csp) + เปลี่ยนหมวดย่อจริง + Realtime + ลบ optimistic+FLIP + คนอัปโหลด+ตัวกรอง · ✅ **env R2 prod ตั้งครบแล้ว (4 มิ.ย.)** · 🔭 **ไฟล์กำพร้าตอนลบผู้ป่วย (Gemini), ถังขยะรูป, "ขอลบ" user ทั่วไป, empty state สวย, กันลากทัมเนล, favorite, lossless, DICOM** ดู [[session_tb_dashboard_2026_06_04_cxr_resume]]

    **🎯 เป้าหมาย:**
    - รูปโปรไฟล์ผู้ใช้ (icon กล้องที่ทำไว้แล้วใน Profile Modal — ตอนนี้แสดง "เร็วๆ นี้")
    - **แท็บใหม่ "รูปภาพ" ในโปรไฟล์ผู้ป่วย** สำหรับเก็บภาพ CXR + lab/document อื่นๆ

    **🗄 Storage: Cloudflare R2**
    - ใช้ R2 (S3-compatible) เก็บไฟล์จริง — แทน Supabase Storage (ราคาถูกกว่า + ไม่มี egress fee)
    - bucket แยก: `tb-profiles/` กับ `tb-patient-images/`
    - URL pattern: signed URL (เปิดอ่านได้เฉพาะ user ที่ login + permission ถูก)

    **🖼 Compression (สำคัญ):**
    - **รูปโปรไฟล์** → บีบเป็น AVIF + WebP (small file, fast load) — resize 256x256 พอ
    - **รูป CXR** → **ห้ามลดความละเอียด** ใช้ AVIF lossless หรือ WebP lossless เท่านั้น (เภสัช/แพทย์ต้อง zoom ดูได้ละเอียด)
    - lib: ใช้ `sharp` หรือ `wasm-image-optimization` ฝั่ง Worker (Cloudflare Workers รองรับ)

    **🔌 API ที่ต้องสร้าง:**
    - `POST /api/profile/upload-avatar` — รับ multipart → resize → upload R2 → update profile.avatar_url
    - `POST /api/patient/upload-image` — admin/user สำหรับ patient ผูก + tag type (CXR/Lab/Document)
    - `DELETE /api/patient/image/:id` — ลบรูป (audit log)
    - `GET /api/patient/:id/images` — list รูปทั้งหมดของ patient

    **🗄 Schema ใหม่:**
    - `tb_patient_images` table: id, patient_id, uploaded_by, image_url, type (cxr/lab/document/other), title, note, uploaded_at, deleted_at
    - `profiles.avatar_url` — เพิ่ม column รูปโปรไฟล์

    **🎨 UI:**
    - แท็บใหม่ในผู้ป่วย "📸 รูปภาพ" — gallery view + lightbox (กดดูเต็มจอ zoom ได้)
    - upload zone (drag-drop) + preview ก่อนอัปโหลด + progress bar
    - icon กล้องในโปรไฟล์ (มีอยู่แล้ว) — เลิก disabled state เปลี่ยนเป็น upload จริง

    **🛡 Security:**
    - file size limit (avatar 5MB / CXR 50MB)
    - validate MIME type (.jpg/.png/.webp/.avif/.dcm สำหรับ DICOM ถ้ารองรับ)
    - virus scan? (เผื่อจุดที่ user upload ไฟล์อันตราย)
    - signed URL หมดอายุ (5 นาที) — กัน hotlink

    **⚙️ Cloudflare R2 setup:**
    - สร้าง R2 bucket + access key
    - เพิ่ม env var R2 credentials (ใน .env.local + Cloudflare Pages)
    - CORS policy → อนุญาตเฉพาะ tbjourney.care

## ⚡ v0.7.16 — Performance Optimization (เพิ่ม 2026-05-30, ขยาย 31 พ.ค.)

44. **เพิ่มความเร็วเว็บ — Faster Load + Less Lag**

    **🎯 เป้าหมาย:**
    - เปิดเว็บครั้งแรก (cold load) เร็วขึ้น — ปัจจุบันรู้สึกหน่วง
    - โหลดข้อมูลในแต่ละหน้าเร็วขึ้น
    - reduce time-to-interactive
    - แก้อาการค้างหน้า Changelog ตอนเปิด comment (เหลือ 60% — ปรับ 100%)

    **🔍 สาเหตุที่น่าจะช้าตอนนี้:**
    - `public/app.html` ใช้ **Babel standalone transpile JSX ใน browser** ตอน runtime
    - tb-app.jsx + tb-modals.jsx ใหญ่มาก (~3700+/4800+ บรรทัด ต่อไฟล์)
    - ทุก request ต้อง compile JSX ใหม่ทุกครั้ง — ไม่ cache
    - `tb-changelog.js` 263KB JSON-ish (60+ versions × body + bullets)
    - 65 version cards render พร้อมกัน → reconciliation ช้า

    **🥇 แนวทางหลัก (impact สูงสุด):**
    - **Pre-compile JSX → JS** ตอน build → เลิกใช้ Babel standalone
    - lib: Vite / esbuild / SWC compile JSX ตอน deploy
    - หรือย้ายมาเป็น Next.js component (รวมเข้า app/ ไม่ใช้ iframe + babel)

    **🥈 แนวทางเสริม:**
    - โหลด React/Chart.js/FontAwesome แบบ defer/async หรือ self-host (เลิก CDN)
    - **Code-split** แท็บที่ไม่ได้ใช้ — ไม่โหลด AdminUsersTab/ActivityLog ถ้า user ไม่ใช่ admin
    - **Lazy load** ChangelogPage / ClinicalModal — โหลดตอนเปิดจริงๆ
    - **ลดขนาด tb-app.jsx** — แยกเป็นไฟล์ย่อยตามฟีเจอร์

    **🆕 จุดที่เจอใน v0.7.14.2 (รอแก้รอบนี้):**
    - **Virtualization 65 version cards** — render เฉพาะที่อยู่ใน viewport (react-window/react-virtual)
    - **Code-split CHANGELOG data** — โหลดเฉพาะรุ่นที่ user ดู ไม่ดึง 263KB หมด
    - **CommentSection virtualization** — ถ้ามีหลาย version expanded
    - **Defer non-critical CSS** ใน app.html (Font Awesome 6.0)
    - **Replace FA CDN → inline SVG** สำหรับ icon ที่ใช้บ่อย (ลด CSS download)
    - **เปลี่ยน FA CDN จาก v6.0.0 → v6.x latest** (icon design ใหม่กว่า ตรงกับ inline SVG)
    - **Image preload** ถ้ามี
    - **React.memo + useMemo รอบใหญ่** — เจาะทุก component ที่ใหญ่

    **🐛 Bug-list ที่เลื่อนจาก v0.7.14.2 มาแก้รอบนี้:**
    - 🖱 เคอร์เซอร์ขาวในช่อง input บน **localhost** (production ดำปกติ)
      - น่าจะเกิดจาก iframe + Chrome dev mode / cache CSS
      - ต้องเช็ค: Chrome flags, extension, DevTools mobile emulation
      - ถ้าแก้ที่ code: ใส่ `caret-color: #0d9488` ที่ทุก `input/textarea` ทั่วทั้งเว็บ (มี ~20 จุด)
    - 💬 Comment auto-expand ตอน mount ยังทำให้เปิดหน้าช้าเล็กน้อย (bulk fetch ช่วยได้ 60%)
      - ทางเลือก: Intersection Observer — fetch เฉพาะ version ที่ scroll เข้า viewport

    **🛡 ข้อระวัง:**
    - ถ้าเปลี่ยน build process ต้องเทสว่า Cloudflare Pages ยัง deploy ได้
    - ระวัง runtime error เพราะ transpile ต่างกัน (Babel standalone vs SWC)
    - เทสทุกหน้าทุก popup หลังเปลี่ยน

    **📊 วัดผล:**
    - ก่อน vs หลัง: Lighthouse score, Time to Interactive, First Contentful Paint
    - Network tab: total bytes transferred + count requests
    - real-user feel: เปิด tbjourney.care บนมือถือ 4G
    - หน้า Changelog: เปิด → ทุก section พร้อมใช้ < 500ms

## 📜 Changelog Page — โรดแมพปรับปรุง (เพิ่ม 2026-05-30 — สำหรับ v0.7.14.2+ หรือ v0.7.15)

45. **Changelog Page polish — เพิ่มลูกเล่นเก็บตก**

    **A. ปุ่ม copy commit message ฉบับเต็ม + แบบย่อย**
    - icon copy ติดบน popup commit detail
    - icon copy เล็กๆ ติดบนแต่ละ entry ใน timeline/grouped view
    - กด copy → copy ข้อความ commit ฉบับเต็ม (`title + body`) เข้า clipboard
    - แสดง **Toast สั้นๆ** "คัดลอกข้อมูลแล้ว" (ใช้ ToastModal เดิม)
    - ใช้ `navigator.clipboard.writeText()`

    **B. แบนเนอร์ตรึง (sticky)** — banner gradient teal ตอนนี้เลื่อนหายตอน scroll → ตรึงไว้บนสุด

    **C. Icon จำนวนการแก้ไข กดได้เป็นฟิลเตอร์**
    - badge เล็กๆ บอกจำนวน change ต่อ entry (เช่น "10 รายการ") ตอนนี้แสดงเฉยๆ
    - **ทำให้กดได้** → กดแล้ว filter chips ของ tag ทั้ง 7 แสดง count เฉพาะ entry นั้น
    - หรือกดแล้วเปิด/ปิด expand เร็ว เหมือนกดที่หัวข้อ

    **D. ระบบ Comment ต่อ version**
    - admin/user เขียน comment ใต้ version นั้นได้
    - **เก็บข้อมูลใน DB** — ตาราง `tb_changelog_comments` (version, user_id, comment_text, status, created_at, updated_at, deleted_at)
    - **status** เช่น `feedback` / `bug_report` / `request` / `note` — user เลือกตอนเขียน → ใช้เป็น filter
    - แสดง: ใครคอมเมนต์ (display_name + avatar) + เวลา + สถานะ (badge สี)
    - **แก้ไข/ลบได้** (ของตัวเอง / admin ลบของใคร ก็ได้) — soft delete
    - ส่งเมลแจ้ง admin เมื่อมี comment ใหม่ (เป็น feedback channel)
    - 🎯 **ประโยชน์:** ใช้เป็นช่อง feedback + bug report ในตัว ไม่ต้องส่งเมลออกจากระบบ

    **E. เปลี่ยนคำปุ่ม "ดูเต็ม"**
    - คำใหม่ที่อาจใช้: "📖 อ่านรายละเอียด" / "📋 commit เต็ม" / "🔍 ดูครบ" / "↗ เปิดดู"
    - หรือ icon-only ก็ได้ (มี tooltip)

    **F. คลิกที่ change → deep link ไปยังฟีเจอร์นั้น**
    - แต่ละ change item ในรายการ → ถ้าฟีเจอร์มีหน้าให้ไป (เช่น "ระบบ Session Activity Log") → กดแล้ว setNav('sessions') หรือเปิดแท็บที่เกี่ยวข้องเลย
    - ✅ **ใช้ตอน user เปิด changelog แล้วเห็นฟีเจอร์ใหม่ → กดดูทันที**
    - ⚠️ ต้องตัดสิน mapping ระหว่าง change item → target nav (เพิ่มฟิลด์ `link` ใน change object?)

    **G. ป้าย "New" บน sidebar เมนู "ประวัติเวอร์ชั่น"**
    - จุดสีแดง / badge "New" เล็กๆ แปะที่เมนู sidebar ถ้า **ผู้ใช้คนนั้นยังไม่ได้กดเข้าหน้านี้** หลังมี version ใหม่
    - mechanism: เก็บ `last_seen_version` ใน DB (`profiles.changelog_last_seen_version`) หรือ localStorage
    - ถ้า `last_seen_version < APP_VERSION` → แสดงป้าย
    - กดเข้าหน้า → อัปเดต last_seen = APP_VERSION → ป้ายหาย
    - ✅ **กระตุ้นให้ user เห็นว่ามีอะไรใหม่** (เหมือน notification dot)

## 🔧 Infrastructure / Maintenance

### 50. ✅ ย้าย project ไปไดรฟ์ D:\ (เพิ่ม 2026-05-31 · เสร็จ 2026-05-31)
- **เหตุผล:** C drive เคยเต็ม 100% ระหว่างทำ v0.7.14.5 → ทำให้ Edit tool เขียนไฟล์เสีย (tb-app.jsx เหลือ 0 bytes ต้อง git restore + reconstruct ทั้งหมด — เสียเวลาเยอะ)
- **สถานะ:** D drive ว่าง ~78GB (สำรวจ 2026-05-31), C เต็มบ่อย
- **ขนาดที่จะย้าย:** source ~5MB (project รวม 819MB แต่ node_modules+next 814MB build ใหม่ได้)
- **ขั้นตอน (ทำเมื่อพี่กันสั่ง "ย้ายเลย"):**
  1. ปิด dev server (Ctrl+C)
  2. `robocopy "D:\tb-dashboard-bysirawit" "D:\tb-dashboard-bysirawit" /E /XD node_modules .next`
  3. `cd D:\tb-dashboard-bysirawit && npm install`
  4. ทดสอบ `npm run dev` ที่ใหม่
  5. ลบ folder เดิม `D:\tb-dashboard-bysirawit`
  6. อัป Claude memory paths ทุกที่ที่ reference `D:\tb-dashboard-bysirawit\` → `D:\tb-dashboard-bysirawit\`
- **ไฟล์ที่ต้องอัปหลังย้าย:**
  - `~/.claude/projects/.../memory/MEMORY.md` (กฎ SQL path)
  - `~/.claude/projects/.../memory/feedback_sql_file_path.md`
  - `D:\tb-dashboard-bysirawit\CLAUDE.md` (คงเดิม แค่ path เปลี่ยน)
  - session memos ที่อ้าง path (search & replace)
- **ระวัง:** `.env.local` ต้อง copy ไปด้วย (ไม่อยู่ใน git, robocopy /E จะ copy ให้)
- **ประโยชน์:** ลด pressure C drive + แยก dev work ออกจาก system drive + กัน Edit เสียจาก ENOSPC อีก

## 📷 ระบบ Image upload ใน Comment (เพิ่ม 2026-05-31)

### 51. Image upload (เต็ม) — แนบรูปใน comment
- **สถานะปัจจุบัน:** มีปุ่ม 📎 "แนบรูป" ใน 3 form (draft/reply/edit) — แสดง toast "กำลังพัฒนา"
- **ที่ต้องทำเต็ม:**
  - Supabase Storage bucket ใหม่: `changelog-comments` (public read หรือ signed url)
  - Upload UI: drag-drop + file picker + paste from clipboard
  - Thumbnail preview ก่อนส่ง
  - Render รูปใน comment (lightbox click → ขยาย)
  - Compress client-side (canvas resize) → ลด upload size
  - File type validate: image/* เท่านั้น
  - Size limit: ~5MB per file (กัน abuse)
  - Multiple files ใน 1 comment (max 3-5 รูป)
  - DB schema: `tb_changelog_comment_images` (id, comment_id, storage_path, mime_type, size_bytes, created_at)
  - RLS: select by anyone, insert by comment owner only
  - Delete cascade เมื่อ delete comment (soft delete → keep image, hard delete → remove from storage)
- **Use case จริง:**
  - เภสัชเห็นบั๊ก → screenshot → แนบ → admin ดูได้ทันที (เร็วกว่าพิมพ์อธิบาย)
  - Admin ตอบ "ดูตรงนี้นะ" + screenshot ของหน้าจอที่แก้แล้ว
- **Estimate:** 6-8 ชม. (UI + backend + storage setup + thumbnail)
- **Priority:** สูง (impact 8/10) — ทำหลังเฟสปัจจุบัน

## ✅ Phase 4 Maintenance (2026-06-01 — เสร็จครบ)

### 4A ✅ Activity Log default 30 วัน (v0.7.17.3)
- หน้า 'บันทึกกิจกรรม' (admin) default fTime='30d' ตอน mount
- ลด query load + ข้อมูลเกี่ยวข้องกว่า

### 4B ✅ Session History pagination + filter ครบ (v0.7.17.3)
- API `/api/auth/sessions/history` รองรับ page/pageSize/since/until/device/status/q
- UI: pagination เลขหน้า + filter ชุดใหญ่ + clickable rows + keep data + ScrollNav

### 4C ❌ ยกเลิก — เก็บ tb_easter_egg_log ถาวร (2026-06-01)
- 🚨 **พี่กัน veto:** "easter egg = สิ่งสำคัญที่สุด ห้ามลบ"
- ลบ SQL file ทิ้งแล้ว · job pg_cron ไม่ตั้ง
- ตารางนี้ขึ้นทะเบียน "เก็บตลอดชีพ" เหมือนตารางอื่นทุกตัวในระบบ

### 4D — Manual habits (ไม่มี code)
- **Slow Query Weekly Review** (5 นาที/สัปดาห์): Supabase Dashboard → Reports → Database Performance → ดู query > 500ms
- **Realtime Channels Review** (10 นาที/ไตรมาส): Supabase Dashboard → Realtime → Stats → เช็ค bandwidth % free tier · 7 channels ปัจจุบัน · ถ้า > 70% review channel ใหม่

---

## 🔮 Deferred — รอ Multi-Tenant Launch

### 52. Bundle Size Budget — ดอง รอ multi-tenant
- npm install `@next/bundle-analyzer` + setup `ANALYZE=true npm run build`
- กำหนด threshold 2 MB (ยืดหยุ่น)
- script ใน `package.json`: `"analyze": "ANALYZE=true npm run build"`
- **เปิดใช้ตอน:** เตรียม launch multi-tenant (user หลาย รพ.) เพราะ user เดียวยังไม่กระทบ

### 53. GitHub Action CI — Bundle Size Check — ดอง รอ multi-tenant
- สร้าง `.github/workflows/size-check.yml`
- Auto run บน push + PR
- Block ถ้า bundle > threshold
- ใช้ `size-limit` หรือ custom script
- **เปิดใช้ตอน:** launch multi-tenant — ป้องกัน contributor push code หนัก

---

## 🖼 ระบบรูปภาพ — AVIF (เพิ่ม 2026-06-03)

### 54. AVIF compression (server-side) — ดอง รอเฟส CXR
- **เหตุผลที่ยังไม่ทำ:** เบราว์เซอร์ **บีบ AVIF ฝั่ง client ไม่ได้** (เทสแล้ว `canvas.toBlob('image/avif')` ตกกลับเป็น PNG) → ต้องทำ **ฝั่ง server** (Cloudflare Image Resizing / Worker + wasm)
- **ปัจจุบัน avatar:** ใช้ WebP 100% (lossy q1.0) ทั้งรูปครอบ (512px) + รูปต้นฉบับ (max 1920) — พี่กันสั่ง 100% (2026-06-03)
- **แผน AVIF:** ทำตอนระบบ **CXR (เอกซเรย์ปอด)** — รูปใหญ่/สำคัญ คุ้มกับการ setup server-side · ไอเดียพี่กัน "ใหญ่→AVIF เล็ก→WebP" ดี แต่ต้องรอ encode ฝั่ง server
- **เทียบขนาด (รูป 1000×1000 มี noise):** WebP90=556KB · WebP80=415KB · JPEG90=505KB · PNG=2.7MB · AVIF=client ทำไม่ได้
- ดู [[project_tb_dashboard_pending_master]] ข้อ 43 (CXR) + ข้อ 51 (รูปใน comment)

---

## 🔗 ไฟล์ที่เกี่ยวข้อง

- [[project_tb_dashboard_roadmap]] — roadmap version เก่า (แบ่งหมวด priority)
- [[session_tb_dashboard_2026_05_16_backend]] — Phase 1 backend complete
- [[session_tb_dashboard_2026_05_15_part2]] — UI revamp + RLS fix
- [[session_tb_dashboard_2026_05_15]] — Login จริง Supabase Auth
- [[session_tb_2026_05_11]] — Full App Build v0.6.0 (ของค้างข้อ 1-6)
- [[knowledge_env_production]] — env vars บน Cloudflare
- [[knowledge_supabase_rls]] — RLS policies
