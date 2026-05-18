-- ============================================================
-- ตาราง tb_user_reject_log
-- เก็บประวัติการปฏิเสธผู้ใช้ทุกครั้ง (ไม่เขียนทับของเดิม)
-- ============================================================

create table if not exists public.tb_user_reject_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  rejected_by     uuid references auth.users(id) on delete set null,
  rejected_reason text not null,
  rejected_at     timestamptz not null default now()
);

-- index ช่วยให้ค้นประวัติของ user คนเดียวได้เร็ว
create index if not exists tb_user_reject_log_user_id_idx
  on public.tb_user_reject_log (user_id);

create index if not exists tb_user_reject_log_rejected_at_idx
  on public.tb_user_reject_log (rejected_at desc);

-- เปิดระบบกั้นสิทธิ์ (RLS)
alter table public.tb_user_reject_log enable row level security;

-- policy: เฉพาะ admin เท่านั้นที่อ่านได้
drop policy if exists "admin read reject log" on public.tb_user_reject_log;
create policy "admin read reject log"
  on public.tb_user_reject_log
  for select
  using (public.is_admin());

-- policy: เฉพาะ admin เท่านั้นที่เขียนได้ (ตัว API จะใช้ service role ข้าม RLS อยู่แล้ว)
drop policy if exists "admin write reject log" on public.tb_user_reject_log;
create policy "admin write reject log"
  on public.tb_user_reject_log
  for insert
  with check (public.is_admin());

-- เปิด realtime ให้แท็บใหม่อัปเดตทันทีเมื่อมีการ reject
alter publication supabase_realtime add table public.tb_user_reject_log;
