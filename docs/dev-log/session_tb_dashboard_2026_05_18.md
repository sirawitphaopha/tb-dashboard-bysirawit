---
name: session-tb-dashboard-2026-05-18
description: 📌 Session 2026-05-18 — v0.7.8 → v0.7.9 — Reject History System ครบวงจร + Bug Audit เริ่มแก้ 1/12
metadata: 
  node_type: memory
  type: project
  originSessionId: 8f66f4b8-12ae-40d6-8b85-2c70a9e39652
---

# TB Dashboard session 2026-05-18 — v0.7.8 → v0.7.9

## งานที่ทำในรอบนี้

### v0.7.8 — Reject History System + Custom Popups + Register Validation
- ตาราง `tb_user_reject_log` (id, user_id, rejected_by, rejected_reason, rejected_at) + RLS admin-only + realtime
- API reject INSERT log ทุกครั้ง (ไม่ overwrite rejected_reason)
- แท็บใหม่ "ประวัติการปฏิเสธ" (สีม่วง) ใน AdminUsersTab — Hybrid table + expandable
- ToastModal แทน alert() ของเบราว์เซอร์ทั้ง 6 จุดใน AdminUsersTab
- หน้าสมัคร: ปิดเว้นวรรค (username/email/password), แบ่งข้อความเตือน 2 บรรทัด
- License duplicate check (กัน rate-limit bypass)
- Validate เบอร์โทร 10 หลัก

### v0.7.8.1 — Phone Validation เข้มขึ้น
- รับเฉพาะ 02 (กทม.), 06/08/09 (มือถือ)
- บล็อก: เลขซ้ำหมด, 8 หลังซ้ำ, เลขเรียง
- ภาคต่างจังหวัด (03/04/05/07) บอกชัดว่าเบอร์บ้านภาคไหน

### v0.7.8.2 — Snapshot + License Digits-Only Compare
- เพิ่ม 4 columns snapshot ใน tb_user_reject_log (username/first/last/email at_reject)
- API reject snapshot ข้อมูล user ตอนนั้น
- loader ใช้ snapshot ก่อน fallback profile ปัจจุบัน
- License dup check เทียบเฉพาะ digits (ลอก prefix ว./ท./ภ./ป. ออก)
- ⚠️ ไฟล์ `update-user-reject-log-snapshot.sql` มี `delete from` อันตราย (ถูกปิดใน v0.7.9)

### v0.7.8.3 — License Field Visual Feedback
- กรอบช่อง license + แถบ prefix เปลี่ยนแดงเมื่อซ้ำ
- ข้อความเตือนใต้ช่อง
- พิมพ์แก้ → กรอบกลับเป็นปกติทันที (error clear auto)

### v0.7.8.4 — UX Polish
- Reject History redesign: 1 อีเมล = 1 แถว, ขยายเห็น timeline ทุก attempt
- คน reject แสดง "(admin)" ต่อท้าย
- Fix badge ประวัติการปฏิเสธ แสดง 0 ตอนเปิดหน้า (โหลด eager)
- Fix badge "0" ค้างที่เมนู "จัดการผู้ใช้" sidebar
- เพิ่มปุ่มรีเฟรชทั้งเว็บ (window.location.reload) ข้าง bell — icon fa-arrows-rotate หมุน 180° hover
- ไอคอน header (search/refresh/bell) เปลี่ยนเป็น teal-700 ให้กลมกลืน
- ปิด chart animation (entry only) — เก็บ hover effect

### v0.7.9 — Bug Audit Round 1 (1/12)
- ปิดคำสั่ง DELETE อันตรายใน `scripts/update-user-reject-log-snapshot.sql` (ใส่ `--` หน้า)
- เพิ่มคำเตือนภาษาคนชัดเจน อธิบายว่า -- หมายถึงอะไร

---

## 🐛 Bug Audit 2026-05-18 (12 ข้อ)

แคลร์สแกนโค้ดเจอ 12 บั๊ก/จุดเสี่ยง — แก้แล้ว 1 ข้อ
**ดูรายละเอียดทั้งหมดที่ [[project_tb_dashboard_bugs_2026_05_18]]**

### สถานะปัจจุบัน (2026-05-18 ภาคบ่าย)
- ✅ ข้อ 1 — ปิดคำสั่ง SQL อันตราย (v0.7.9, deployed)
- ⏭️ **กลับมาทำต่อ: ข้อ 2** — FK error ตอนลบบัญชี user ถาวร (hard-delete-user)
- ⏳ เหลือ: 11 ข้อ

---

## 🔑 Feedback ใหม่ที่บันทึก

- [[feedback_thai_first_with_glossary]] — ภาษาไทยมาก่อน วงเล็บแปลคำอังกฤษ
- [[feedback_user_controls_version]] — พี่กันคุม version เอง ห้าม bump อัตโนมัติ

---

## 💾 SQL ที่รันแล้ว

```sql
-- ตาราง tb_user_reject_log + RLS + realtime
CREATE TABLE tb_user_reject_log (...);
CREATE POLICY "admin read/write reject log" ...;
ALTER PUBLICATION supabase_realtime ADD TABLE tb_user_reject_log;

-- Snapshot columns
ALTER TABLE tb_user_reject_log
  ADD COLUMN IF NOT EXISTS username_at_reject text,
  ADD COLUMN IF NOT EXISTS first_name_at_reject text,
  ADD COLUMN IF NOT EXISTS last_name_at_reject text,
  ADD COLUMN IF NOT EXISTS email_at_reject text;

-- (ลบ test data ทำครั้งเดียวแล้ว ปิดคำสั่งใน v0.7.9)
```

---

## 🔗 ที่เกี่ยวข้อง
- [[project_tb_dashboard_bugs_2026_05_18]] — รายการบั๊ก 12 ข้อ
- [[project_tb_dashboard_pending_master]] — pending master list (+ ข้อ 36 OTP roadmap)
- [[session_tb_dashboard_2026_05_17_part3]] — session ก่อนหน้า v0.7.7.2
