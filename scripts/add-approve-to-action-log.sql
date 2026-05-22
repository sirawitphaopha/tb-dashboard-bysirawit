-- ════════════════════════════════════════════════════════════════════
-- 🛡️ Audit Log ขั้น 3 — ให้สมุดบันทึกรับ action 'approve' (อนุมัติ)
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- ════════════════════════════════════════════════════════════════════
-- เพิ่ม 'approve' เพื่อจดประวัติการอนุมัติ (แอดมินคนไหนอนุมัติใคร เมื่อไหร่)
-- ════════════════════════════════════════════════════════════════════

alter table public.tb_user_action_log
  drop constraint if exists tb_user_action_log_action_check;

alter table public.tb_user_action_log
  add constraint tb_user_action_log_action_check
  check (action in ('deactivate', 'restore', 'delete', 'approve'));
