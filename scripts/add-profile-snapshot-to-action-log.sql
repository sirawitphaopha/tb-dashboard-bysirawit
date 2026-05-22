-- ════════════════════════════════════════════════════════════════════
-- 🛡️ Audit Log — เก็บ "สำเนาโปรไฟล์ทั้งใบ" ใน tb_user_action_log
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════════════
-- เก็บ profile ทั้งก้อน ณ ตอนนั้น เป็น JSON (profile_snapshot)
-- → อยากแสดง field ไหนในประวัติ (username/วิชาชีพ/เลขใบ/รพ./หน่วยงาน/อื่นๆ)
--   ก็ดึงจาก JSON ได้เลย ไม่ต้องเพิ่มคอลัมน์/รัน SQL อีก
-- ════════════════════════════════════════════════════════════════════

alter table public.tb_user_action_log
  add column if not exists profile_snapshot jsonb;

-- backfill จาก profiles ปัจจุบัน (เฉพาะแถวที่ user ยังอยู่)
update public.tb_user_action_log l
set profile_snapshot = to_jsonb(p.*)
from public.profiles p
where l.user_id = p.id
  and l.profile_snapshot is null;
