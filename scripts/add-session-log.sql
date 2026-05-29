-- ═════════════════════════════════════════════════════════════════════════
-- tb_session_log
-- ─────────────────────────────────────────────────────────────────────────
-- เก็บประวัติ "ผู้ที่ยังอยู่ในระบบตอนนี้" + ที่เคยอยู่
-- ใช้สำหรับ:
--   1. หน้า "อุปกรณ์ที่เข้าใช้งาน" ในโปรไฟล์
--   2. ปุ่ม "ออกจากระบบทุกอุปกรณ์ยกเว้นเครื่องนี้"
--   3. ตรวจจับ session หมดอายุ (รอ B2)
--   4. Admin บังคับ logout user (รอ B2/B3)
--
-- end_reason:
--   - null              → ยัง active อยู่
--   - manual            → กดปุ่มออกจากระบบเอง
--   - session_expired   → session หมดอายุ (B2)
--   - forced_by_user    → เจ้าตัวกด "ออกทุกอุปกรณ์" (B2)
--   - forced_by_admin   → admin บังคับให้ออก (B2/B3)
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists public.tb_session_log (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  email           text,
  ip_address      text,
  user_agent      text,
  device_label    text,        -- "Chrome 131 on Windows 11" / "Safari 17 on iPhone (iOS 17.2)"
  browser_name    text,
  browser_version text,
  os_name         text,
  os_version      text,
  device_type     text,        -- mobile / tablet / desktop / unknown
  device_vendor   text,        -- Apple / Samsung / null
  device_model    text,        -- iPhone / Galaxy S24 / null
  started_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now(),
  ended_at        timestamptz,
  end_reason      text
);

-- constraint: end_reason ต้องเป็นค่าที่อนุญาต
alter table public.tb_session_log
  drop constraint if exists tb_session_log_end_reason_check;
alter table public.tb_session_log
  add constraint tb_session_log_end_reason_check
  check (end_reason is null or end_reason in ('manual', 'session_expired', 'forced_by_user', 'forced_by_admin'));

-- index หา session active ของ user
create index if not exists idx_session_log_user_active
  on public.tb_session_log(user_id, last_active_at desc)
  where ended_at is null;

-- index ดูประวัติทั้งหมดของ user (รวมที่จบแล้ว)
create index if not exists idx_session_log_user_time
  on public.tb_session_log(user_id, started_at desc);

-- RLS: บล็อก client ทั้งหมด เข้าได้แค่ service_role
alter table public.tb_session_log enable row level security;

drop policy if exists "no client access" on public.tb_session_log;
create policy "no client access" on public.tb_session_log
  for all
  using (false)
  with check (false);

comment on table public.tb_session_log is
  'session ที่ active + ประวัติทั้งหมด — รองรับ "อุปกรณ์ที่เข้าใช้งาน" + "ออกทุกเครื่อง"';
