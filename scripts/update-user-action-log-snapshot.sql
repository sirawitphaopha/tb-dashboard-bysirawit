-- ════════════════════════════════════════════════════════════════════
-- 🛡️ Audit Log ขั้น 1 — กันประวัติปิด/กู้คืนหายตอนลบ user
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════════════
-- เป้าหมาย: ให้ลบ user ถาวรได้ โดยประวัติใน tb_user_action_log ยังอยู่
--          (เก็บ "ชื่อ ณ ตอนนั้น" เป็นตัวหนังสือ + เปลี่ยน FK เป็น SET NULL)
-- หลักการ (เลียนแบบ tb_user_reject_log ที่ทำสำเร็จแล้ว):
--   1) เพิ่มคอลัมน์ snapshot เก็บชื่อ user + ชื่อ admin ที่กดทำ
--   2) ปลด NOT NULL ของ user_id (เพื่อให้ SET NULL ทำงานได้)
--   3) เปลี่ยน FK user_id: ON DELETE CASCADE → ON DELETE SET NULL
--   4) Backfill: เติมชื่อจาก profiles ลงแถวเก่า (ที่ทำวันนี้)
-- ════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────
-- 1. เพิ่มคอลัมน์ snapshot (text เก็บชื่อ ณ ตอนนั้น)
-- ─────────────────────────────────────────────────────
alter table public.tb_user_action_log
  add column if not exists first_name_at_action      text,  -- ชื่อจริง user ที่ถูกกระทำ
  add column if not exists last_name_at_action       text,  -- นามสกุล user
  add column if not exists email_at_action           text,  -- อีเมล user
  add column if not exists performer_name_at_action  text;  -- ชื่อ admin ที่กดทำ


-- ─────────────────────────────────────────────────────
-- 2. ปลด NOT NULL ของ user_id
--    (จำเป็น เพื่อให้ ON DELETE SET NULL ทำงานได้
--     ไม่งั้นพอลบ user → DB จะ error)
-- ─────────────────────────────────────────────────────
alter table public.tb_user_action_log
  alter column user_id drop not null;


-- ─────────────────────────────────────────────────────
-- 3. เปลี่ยน FK user_id: CASCADE → SET NULL
--    (ลบ user แล้วแถว log ยังอยู่ ไม่หายตาม)
-- ─────────────────────────────────────────────────────
alter table public.tb_user_action_log
  drop constraint if exists tb_user_action_log_user_id_fkey;
alter table public.tb_user_action_log
  add constraint tb_user_action_log_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;


-- ─────────────────────────────────────────────────────
-- 4. Backfill — เติมชื่อจาก profiles ปัจจุบัน ลงแถวเก่าที่ยังว่าง
-- ─────────────────────────────────────────────────────
-- 4.1 ชื่อ user ที่ถูกกระทำ
update public.tb_user_action_log l
set first_name_at_action = p.first_name,
    last_name_at_action  = p.last_name,
    email_at_action      = p.email
from public.profiles p
where l.user_id = p.id
  and l.first_name_at_action is null;

-- 4.2 ชื่อ admin ที่กดทำ
update public.tb_user_action_log l
set performer_name_at_action = nullif(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), '')
from public.profiles p
where l.performed_by = p.id
  and l.performer_name_at_action is null;
