-- ═════════════════════════════════════════════════════════════════════════
-- เพิ่มคอลัมน์ device_fp (Device Fingerprint) — "รหัสประจำเครื่อง"
-- ─────────────────────────────────────────────────────────────────────────
-- รหัสสุ่มที่ฝั่ง browser สร้างครั้งแรก เก็บใน localStorage ถาวร
-- → ไม่เปลี่ยนแม้ logout/login ใหม่ → แยก "เครื่อง" ได้จริง
--   แม้ browser + OS + IP เหมือนกันเป๊ะ
--
-- ต่างจาก session_id: session เปลี่ยนทุกครั้งที่ login / device_fp คงเดิมตลอด
-- ข้อจำกัด: ถ้าผู้ใช้ล้างข้อมูล browser / ใช้ incognito → ได้รหัสใหม่
--
-- เก็บใน 3 ตาราง:
--   tb_session_log — รหัสเครื่องของแต่ละ session
--   tb_login_log   — รหัสเครื่องตอน login
--   tb_logout_log  — รหัสเครื่องตอน logout (ดึงจาก session row)
-- ═════════════════════════════════════════════════════════════════════════

alter table public.tb_session_log
  add column if not exists device_fp text;

alter table public.tb_login_log
  add column if not exists device_fp text;

alter table public.tb_logout_log
  add column if not exists device_fp text;

comment on column public.tb_session_log.device_fp is 'รหัสประจำเครื่อง (localStorage) — แยกเครื่องแม้ UA เหมือนกัน';
comment on column public.tb_login_log.device_fp  is 'รหัสประจำเครื่องตอน login';
comment on column public.tb_logout_log.device_fp is 'รหัสประจำเครื่องตอน logout';
