-- ═════════════════════════════════════════════════════════════════════════
-- ขยาย check constraint ของ tb_logout_log.logout_type
-- ─────────────────────────────────────────────────────────────────────────
-- เดิมรองรับแค่ 'manual' + 'session_expired'
-- ใหม่: รองรับ 4 ค่า ตรงกับ tb_session_log.end_reason
--
--   manual            → กดปุ่มออกเอง
--   session_expired   → session หมดอายุ (จด session_expired_detection ใน middleware)
--   forced_by_user    → user คนนี้กดปุ่ม "ออกทุกอุปกรณ์" จากเครื่องอื่น
--   forced_by_admin   → admin บังคับให้ออก (รอ B3)
-- ═════════════════════════════════════════════════════════════════════════

alter table public.tb_logout_log
  drop constraint if exists tb_logout_log_type_check;

alter table public.tb_logout_log
  add constraint tb_logout_log_type_check
  check (logout_type in ('manual', 'session_expired', 'forced_by_user', 'forced_by_admin'));
