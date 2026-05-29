-- ═════════════════════════════════════════════════════════════════════════
-- tb_logout_log
-- ─────────────────────────────────────────────────────────────────────────
-- เก็บประวัติการออกจากระบบ
-- ใช้สำหรับ:
--   1. Audit log — ดูได้ว่าใครออกเมื่อไหร่ จาก IP/Device ไหน
--   2. รองรับ session_expired ในอนาคต (ทำพร้อม Session Activity Log)
--
-- logout_type:
--   - manual          → ผู้ใช้กดปุ่มออกเอง
--   - session_expired → session หมดอายุ (รอทำในข้อ B)
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists public.tb_logout_log (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        references auth.users(id) on delete set null,
  email          text,
  logout_type    text        not null default 'manual',
  ip_address     text,
  user_agent     text,
  logged_out_at  timestamptz not null default now()
);

-- เผื่อ query ดูประวัติออกของ user
create index if not exists idx_logout_log_user_time
  on public.tb_logout_log(user_id, logged_out_at desc);

-- constraint: logout_type ต้องเป็นค่าที่อนุญาต
alter table public.tb_logout_log
  drop constraint if exists tb_logout_log_type_check;
alter table public.tb_logout_log
  add constraint tb_logout_log_type_check
  check (logout_type in ('manual', 'session_expired'));

-- RLS: บล็อก client ทั้งหมด เข้าได้แค่ service_role
alter table public.tb_logout_log enable row level security;

drop policy if exists "no client access" on public.tb_logout_log;
create policy "no client access" on public.tb_logout_log
  for all
  using (false)
  with check (false);

comment on table public.tb_logout_log is
  'ประวัติการออกจากระบบ — manual + session_expired (future)';
