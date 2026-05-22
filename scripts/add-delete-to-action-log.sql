-- ════════════════════════════════════════════════════════════════════
-- 🛡️ Audit Log ขั้น 2 — ให้สมุดบันทึกรับ action 'delete' (ลบบัญชี)
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════════════
-- เดิม tb_user_action_log รับแค่ 'deactivate' / 'restore'
-- เพิ่ม 'delete' เพื่อจดประวัติการลบบัญชีถาวร (ใครลบ/เมื่อไหร่/ทำไม)
-- ════════════════════════════════════════════════════════════════════

alter table public.tb_user_action_log
  drop constraint if exists tb_user_action_log_action_check;

alter table public.tb_user_action_log
  add constraint tb_user_action_log_action_check
  check (action in ('deactivate', 'restore', 'delete'));
