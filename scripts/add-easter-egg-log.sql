-- ═════════════════════════════════════════════════════════════════════════
-- tb_easter_egg_log
-- ─────────────────────────────────────────────────────────────────────────
-- เก็บประวัติคนที่เจอ easter egg 🥚 (คลิกโลโก้ 10 ครั้ง)
-- เก็บไว้ขำๆ + ดูว่าใครซน
--
-- event_type:
--   - discovered  → กดอ่านข้อความ easter egg จนจบครั้งแรก (ปลดล็อก)
--   - kicked_out  → คลิกโลโก้ 10 ครั้งซ้ำหลังปลดล็อก → ระบบเตะออก 😏
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists public.tb_easter_egg_log (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users(id) on delete set null,
  email        text,
  event_type   text        not null,
  ip_address   text,
  user_agent   text,
  occurred_at  timestamptz not null default now()
);

-- constraint
alter table public.tb_easter_egg_log
  drop constraint if exists tb_easter_egg_log_type_check;
alter table public.tb_easter_egg_log
  add constraint tb_easter_egg_log_type_check
  check (event_type in ('discovered', 'kicked_out'));

-- index ดูประวัติของ user คนเดียว
create index if not exists idx_easter_egg_log_user_time
  on public.tb_easter_egg_log(user_id, occurred_at desc);

-- RLS: บล็อก client ทั้งหมด เข้าได้แค่ service_role
alter table public.tb_easter_egg_log enable row level security;

drop policy if exists "no client access" on public.tb_easter_egg_log;
create policy "no client access" on public.tb_easter_egg_log
  for all
  using (false)
  with check (false);

comment on table public.tb_easter_egg_log is
  'ประวัติคนเจอ easter egg 🥚 — เก็บไว้ดูเล่นๆ ว่าใครซน';
