-- ============================================================
-- ตาราง tb_user_action_log
-- "สมุดบันทึก" การกระทำของ Admin ต่อบัญชีผู้ใช้
-- เก็บทุกครั้งที่ ปิดบัญชี (deactivate) / กู้คืนบัญชี (restore)
-- ว่า ใครทำ · ทำกับใคร · เมื่อไหร่ · เพราะอะไร
-- ============================================================

create table if not exists public.tb_user_action_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,  -- บัญชีที่ถูกกระทำ
  action        text not null check (action in ('deactivate', 'restore')),   -- ปิดบัญชี หรือ กู้คืน
  reason        text not null,                                               -- เหตุผล (บังคับกรอก)
  performed_by  uuid references auth.users(id) on delete set null,           -- admin ที่กดทำ
  performed_at  timestamptz not null default now()                           -- เวลาที่ทำ
);

-- index ช่วยให้ค้นประวัติของ user คนเดียวได้เร็ว
create index if not exists tb_user_action_log_user_id_idx
  on public.tb_user_action_log (user_id);

-- index ช่วยเรียงตามเวลาล่าสุด
create index if not exists tb_user_action_log_performed_at_idx
  on public.tb_user_action_log (performed_at desc);

-- เปิดระบบกั้นสิทธิ์ข้อมูล (RLS)
alter table public.tb_user_action_log enable row level security;

-- policy: เฉพาะ admin เท่านั้นที่อ่านได้
drop policy if exists "admin read user action log" on public.tb_user_action_log;
create policy "admin read user action log"
  on public.tb_user_action_log
  for select
  using (public.is_admin());
