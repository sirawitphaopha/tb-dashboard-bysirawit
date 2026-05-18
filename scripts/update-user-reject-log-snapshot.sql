-- ============================================================
-- เพิ่มคอลัมน์ snapshot ใน tb_user_reject_log
-- เก็บข้อมูล user ตอนที่ถูก reject (ไม่ใช่ปัจจุบัน)
-- + ลบ record test เก่าออก (เพราะไม่มี snapshot)
-- ============================================================

-- 1) เพิ่มคอลัมน์ snapshot
alter table public.tb_user_reject_log
  add column if not exists username_at_reject   text,
  add column if not exists first_name_at_reject text,
  add column if not exists last_name_at_reject  text,
  add column if not exists email_at_reject      text;

-- 2) ลบ record test เก่าทั้งหมด (เพราะไม่มี snapshot — เริ่มเก็บใหม่ตั้งแต่ครั้งหน้า)
delete from public.tb_user_reject_log;
