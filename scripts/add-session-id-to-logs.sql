-- ═════════════════════════════════════════════════════════════════════════
-- เพิ่มคอลัมน์ session_id ใน tb_login_log + tb_logout_log
-- ─────────────────────────────────────────────────────────────────────────
-- ผูก log การเข้า/ออก เข้ากับ session (tb_session_log.id)
-- → ในหน้าบันทึกกิจกรรม แยกได้ว่าเหตุการณ์ไหนมาจากเครื่อง/การ login เดียวกัน
--   แม้ browser + OS + IP จะเหมือนกันเป๊ะ
--
-- หมายเหตุ: log เก่าที่มีอยู่จะเป็น null (ไม่มี session_id) — ไม่กระทบข้อมูลเดิม
-- ═════════════════════════════════════════════════════════════════════════

alter table public.tb_login_log
  add column if not exists session_id uuid;

alter table public.tb_logout_log
  add column if not exists session_id uuid;

comment on column public.tb_login_log.session_id  is 'อ้างอิง tb_session_log.id — ระบุว่า login นี้สร้าง session ไหน';
comment on column public.tb_logout_log.session_id is 'อ้างอิง tb_session_log.id — ระบุว่า logout นี้ปิด session ไหน';
