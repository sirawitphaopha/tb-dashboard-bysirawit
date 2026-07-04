---
name: project-tb-dashboard-bugs-2026-05-18
description: "🐛 รายการ 12 บั๊ก/จุดเสี่ยงที่แคลร์สแกนเจอวันที่ 2026-05-18 — ครอบคลุม API admin, register, auth, security ยังไม่แก้"
metadata: 
  node_type: memory
  type: project
  originSessionId: 8f66f4b8-12ae-40d6-8b85-2c70a9e39652
---

# 🐛 TB Dashboard — Bug Audit 2026-05-18

**สแกนเมื่อ:** 2026-05-18 (v0.7.8.4)
**ขอบเขต:** จุดสำคัญ — API admin/register/auth, RLS, ตัวคำนวณยา, ระบบลบผู้ป่วย

## 📊 ความคืบหน้า: 8/12 + ครึ่งข้อ 5 (อัปเดต 2026-05-22)

- ✅ **ข้อ 12 — restore-user guard (v0.7.11.2)** ✅ **เทสผ่านแล้ว** — ใช้ deactivated_at เป็นป้ายแยกประเภท + กู้คืนได้เฉพาะคนถูกปิดบัญชี + ระบบเหตุผล/audit log
- ✅ **ข้อ 11 — Rate Limiting (v0.7.11.3)** ทำใน Cloudflare (ไม่มีโค้ด): /api/register เกิน 5 req/10s/IP → block 10s | ⏳ future: ทำ login ด้วย (พี่กันสนใจ)
- 🟡 **ข้อ 5** — ครึ่งทาง: CSP+X-Frame ทำแล้ว · token→httpOnly **ข้ามไปก่อน** (ไว้ทำพร้อมงาน iframe ใหญ่)
- ⏳ **ข้อ 7** (race condition) → ทำ **หลังสร้างระบบแอดมินหลายคน** (race เกิดตอนหลาย admin กดพร้อมกัน) ดู [[tb-dashboard-pending-master]] ข้อ 42
- ⏭️ **ข้อ 9 — ข้ามถาวร** (2026-05-22 พี่กันตัดสินใจ) — ไม่คุ้ม: tb-data.js เป็น static ไม่ผ่าน build (ย้าย env ยุ่ง) + เป็น public key อยู่แล้ว (ย้ายไปก็ไม่ปลอดภัยขึ้น) → ลงแรงเยอะ ได้ผลเกือบศูนย์
- ⏳ **ข้อ 10** (middleware query ทุก request) → ทำตอน **optimize** พร้อมเรื่องเว็บช้า [[tb-dashboard-pending-master]] ข้อ 40

**สรุป:** เหลือ 5(ครึ่ง), 7, 10 — ข้อ 9 ตัดทิ้ง · ทุกข้อมีแผนว่าทำตอนไหนแล้ว
- ดู [[session-tb-dashboard-2026-05-22]]

---
### (รายละเอียดเดิม)
## 📊 ความคืบหน้า: 6/12 + ครึ่งข้อ 5 (อัปเดต 2026-05-22 จากการเช็คโค้ดจริง)

- ✅ ข้อ 1 — ปิดคำสั่ง SQL อันตราย (deployed)
- ✅ ข้อ 2 — FK error ลบ user (Snapshot Pattern) **แก้แล้ว แต่ยังไม่เทส** 🧪
- ✅ ข้อ 3 — approve เช็คสถานะ (Status Guard) **แก้แล้ว แต่ยังไม่เทส** 🧪
- ✅ ข้อ 4 — reject เช็คสถานะ (Status Guard) **แก้แล้ว แต่ยังไม่เทส** 🧪
- 🟡 ข้อ 5 — **ครึ่งทาง:** ทำ CSP+X-Frame headers แล้ว (v0.7.9.4) แต่ส่วน "ย้าย token → httpOnly cookie" **ข้ามไปก่อน** (2026-05-22 พี่กันตัดสินใจ — เสี่ยงกระทบระบบ iframe/บันทึกผู้ป่วยทั้งหมด ไว้ทำพร้อมงาน iframe ครั้งใหญ่)
- ✅ ข้อ 6 — license ดึงทั้งตาราง **แก้แล้ว** (แก้พ่วงตอนรวมระบบ license v0.7.10.3 → ใช้ `.in('license_number', possibleFormats)` แทน select ทั้ง table)
- ✅ ข้อ 8 — เบอร์โทร optional **แก้แล้ว** (บังคับกรอกเบอร์ required v0.7.10.5)
- ⏳ เหลือจริง: ข้อ 7, 9, 10, 11, 12

> ⚠️ บทเรียน: ข้อ 6 กับ 8 ถูกแก้ "พ่วงไป" ตอนทำฟีเจอร์อื่น แต่ลืมมา mark ในไฟล์นี้ → ทำให้พี่กันงงว่าแก้ถึงไหนแล้ว ครั้งหน้าแก้บั๊กพ่วงต้องมา update ไฟล์นี้ทันที

---

## 🔴 ร้ายแรง (ควรแก้ก่อน)

### 1. ไฟล์ SQL มีคำสั่งลบประวัติ reject ทั้งหมด
- **ไฟล์:** `scripts/update-user-reject-log-snapshot.sql`
- **บรรทัด:** `delete from public.tb_user_reject_log;`
- **ผลกระทบ:** กดผิด/รันซ้ำ = ประวัติ reject ทั้งหมดหาย
- **วิธีแก้:** comment บรรทัดนั้นออก หลังจากรันครั้งแรกเสร็จ

### 2. ลบบัญชี user ถาวร อาจติด FK constraint
- **ไฟล์:** `app/api/admin/hard-delete-user/route.ts`
- **ปัญหา:** ลบเฉพาะ `tb_delete_requests WHERE requested_by = userId` แต่ user อาจอยู่ในคอลัมน์อื่น (approved_by, rejected_by) → FK error
- **ผลกระทบ:** error ตอนใช้งานจริง (ตอนนี้ admin คนเดียว อาจยังไม่เจอ)

### 3. /api/admin/approve — ไม่เช็คสถานะเดิม
- **ปัญหา:** approve user ที่อยู่ในสถานะใดก็ได้ (รวมถึง rejected ที่ถูกไล่)
- **ผลกระทบ:** bypass การพิจารณา ดึงคนที่ถูกไล่กลับเข้าระบบ
- **วิธีแก้:** เพิ่ม check `target.status === 'pending'` หรือใช้ restore-user แทน

### 4. /api/admin/reject — ไม่เช็คสถานะเดิม
- **ปัญหา:** reject user ที่ approved อยู่ได้ → กลายเป็น deactivate โดยไม่ตั้งใจ
- **วิธีแก้:** limit เฉพาะ pending — สำหรับ approved ต้องใช้ deactivate-user

---

## 🟡 ปานกลาง (แก้ตอนว่าง)

### 5. /api/auth/session คืน token ให้ client
- **ความเสี่ยง:** XSS attack → ขโมย token
- **ปัจจุบัน:** ใช้ pattern นี้กับ iframe (tb-data.js setSession)
- **อนาคต:** ควรย้ายไป httpOnly cookie

### 6. /api/register — license duplicate check ดึงทั้ง table
- **ไฟล์:** `app/api/register/route.ts` (line ~82-97)
- **ปัญหา:** `select * .not('license_number', 'is', null)` ดึงทุก profile
- **ผลกระทบ:** ช้าเมื่อ user > 1000
- **วิธีแก้:** สร้าง computed column `license_digits` หรือใช้ regex query

### 7. /api/admin/reject — race condition
- **ปัญหา:** query rejection_week → update → ไม่ atomic
- **ตัวอย่าง:** admin 2 คนกดพร้อมกัน count อาจไม่ตรง
- **ปัจจุบัน:** admin คนเดียว ไม่เจอ

### 8. register/page.tsx — เบอร์โทร optional
- **ปัญหา:** ปล่อยว่างได้ → DB เก็บ null
- **ผลกระทบ:** ทำ OTP ในอนาคตไม่ได้ ([[project_tb_dashboard_pending_master]] ข้อ 36)
- **วิธีแก้:** required field ตอนเปิด OTP

---

## 🟢 เล็กน้อย (รู้ไว้พอ)

### 9. Supabase URL + anon key hardcoded
- **ไฟล์:** `public/tb-data.js:632-633`
- **ปัญหา:** ไม่อยู่ใน env vars
- **ผลกระทบ:** rotate key = ต้องแก้โค้ด

### 10. middleware.ts query profiles ทุก request
- **ปัญหา:** ทุก page request → DB query 1 ครั้ง (เช็ค status)
- **ผลกระทบ:** DB load สูงโดยไม่จำเป็น
- **วิธีแก้:** cache status ใน session/cookie + invalidate ตอน approve/reject

### 11. ไม่มี rate limiting
- **ปัญหา:** /api/admin/* + /api/register สมัครได้ไม่จำกัด
- **ตอนนี้:** ใช้คนเดียว ไม่เจอ
- **อนาคต:** เปิดสาธารณะต้องมี

### 12. restore-user ไม่ check สถานะ target
- **ไฟล์:** `app/api/admin/restore-user/route.ts`
- **ปัญหา:** restore user ที่ approved อยู่ได้ (no-op)
- **ระดับ:** dead code path มากกว่าบั๊กจริง

---

## 🧪 รอเทส (แก้แล้ว แต่ยังไม่ได้ทดสอบ)

### 13. Bug ข้อ 2 — Snapshot Pattern (v0.7.9.1, 2026-05-19)
- **commit:** 16b3e40 (deployed)
- **เส้นทางเทส:** ดู [[project_tb_dashboard_bug2_pending_test]]
- **เมื่อเทสผ่าน:** ลบข้อนี้ + ลบ memory ไฟล์ pending test

### 14. Bug ข้อ 3-4 — Status Guards ใน approve/reject API (v0.7.9.3, 2026-05-19)
- **commit:** aabe17b (deployed)
- **เส้นทางเทส:**
  - approve user สถานะ pending → ต้องผ่าน
  - approve user สถานะ approved/rejected/deactivated → ต้องได้ 400 พร้อมข้อความบอกใช้ปุ่ม Restore/Activate
  - reject user สถานะ pending → ต้องผ่าน
  - reject user สถานะ approved → ต้องได้ 400 พร้อมข้อความบอกใช้ Deactivate
- **เมื่อเทสผ่าน:** ลบข้อนี้

---

## 🎯 ลำดับที่แนะนำให้แก้

1. ข้อ 1 → comment SQL ลบทิ้ง
2. ข้อ 2 → fix FK ใน hard-delete-user
3. ข้อ 3, 4 → check สถานะใน approve/reject

ส่วน 5-12 ทำตอนว่าง/ก่อนเปิดสาธารณะ

ดู [[project_tb_dashboard_pending_master]] · [[session_tb_dashboard_2026_05_17_part3]]
