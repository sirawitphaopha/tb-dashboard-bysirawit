-- ═════════════════════════════════════════════════════════════════════════
-- Extend tb_password_change_log — เก็บทุก attempt (สำเร็จ + พลาด)
-- ─────────────────────────────────────────────────────────────────────────
-- เพิ่ม column:
--   • action          — 'change' (เปลี่ยนในโปรไฟล์) | 'reset' (ตั้งใหม่หลังลืม)
--   • success         — สำเร็จไหม
--   • failure_reason  — ถ้าพลาด เหตุผลคืออะไร (rate_limited, wrong_old_password,
--                       weak_password, invalid_token, etc.)
--   • email_attempted — เก็บอีเมลที่ใช้ตอน reset (เผื่อไม่มี user_id เช่น token หมด)
--
-- เปลี่ยน user_id เป็น nullable — บาง failed attempt ไม่รู้ user
-- ═════════════════════════════════════════════════════════════════════════

-- 1. ทำ user_id เป็น nullable (เก่าเป็น not null)
alter table public.tb_password_change_log
  alter column user_id drop not null;

-- 2. เพิ่ม column ใหม่ (default ค่าเดิมเพื่อ backward compatible)
alter table public.tb_password_change_log
  add column if not exists action          text    not null default 'change',
  add column if not exists success         boolean not null default true,
  add column if not exists failure_reason  text,
  add column if not exists email_attempted text;

-- 3. constraint ค่า action
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tb_password_change_log_action_check'
  ) then
    alter table public.tb_password_change_log
      add constraint tb_password_change_log_action_check
      check (action in ('change', 'reset'));
  end if;
end $$;

-- 4. index สำหรับ query "ทุก attempt ของ user X" + "failed attempts ใน 24h"
create index if not exists idx_pw_change_log_user_action_time
  on public.tb_password_change_log(user_id, action, changed_at desc);

create index if not exists idx_pw_change_log_success_time
  on public.tb_password_change_log(success, changed_at desc)
  where success = false;

comment on column public.tb_password_change_log.action is
  '''change'' = เปลี่ยนในโปรไฟล์ / ''reset'' = ตั้งใหม่หลังลืมรหัส';
comment on column public.tb_password_change_log.success is
  'true = สำเร็จ / false = failed (ดู failure_reason)';
comment on column public.tb_password_change_log.failure_reason is
  'rate_limited / wrong_old_password / weak_password / invalid_token / update_failed';
