-- ═════════════════════════════════════════════════════════════════════════
-- tb_login_log
-- ─────────────────────────────────────────────────────────────────────────
-- เก็บประวัติการ login ทุกครั้ง (สำเร็จ + พลาด)
-- ใช้สำหรับ:
--   1. Rate limit — 5 ครั้งผิด/15 นาที ต่ออีเมล + 20 ครั้งผิด/15 นาที ต่อ IP
--   2. Audit log — ตรวจย้อนได้ว่าใคร login เมื่อไหร่จาก IP/Device ไหน
--   3. ตรวจจับ brute force / credential stuffing
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists public.tb_login_log (
  id                uuid        primary key default gen_random_uuid(),
  email_attempted   text        not null,           -- อีเมลที่ใช้ login (หลัง resolve จาก username)
  username_attempted text,                          -- เผื่อ user กรอก username → เก็บไว้ด้วย
  user_id           uuid        references auth.users(id) on delete set null,
  success           boolean     not null,
  failure_reason    text,                           -- wrong_password / user_not_found / rate_limited_email / rate_limited_ip / status_not_approved
  ip_address        text,
  user_agent        text,
  attempted_at      timestamptz not null default now()
);

-- index สำหรับ rate limit query
create index if not exists idx_login_log_email_time
  on public.tb_login_log(email_attempted, attempted_at desc)
  where success = false;

create index if not exists idx_login_log_ip_time
  on public.tb_login_log(ip_address, attempted_at desc)
  where success = false;

-- index สำหรับ audit query "ดูประวัติ login ของ user X"
create index if not exists idx_login_log_user_time
  on public.tb_login_log(user_id, attempted_at desc);

-- RLS: บล็อก client ทั้งหมด เข้าได้แค่ service_role
alter table public.tb_login_log enable row level security;

drop policy if exists "no client access" on public.tb_login_log;
create policy "no client access" on public.tb_login_log
  for all
  using (false)
  with check (false);

comment on table public.tb_login_log is
  'ประวัติการ login ทุกครั้ง — rate limit (5/15min ต่ออีเมล, 20/15min ต่อ IP) + audit';
