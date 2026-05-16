-- ═══════════════════════════════════════════════════════
-- 🔧 Fix Schema (missing columns) + Profiles RLS recursion
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- Project: cioswzdbonnbhbyynrhh.supabase.co
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────
-- 1. เพิ่มคอลัมน์ที่ขาดใน tb_patients
--    (if not exists = ถ้ามีแล้วข้าม ไม่ error)
-- ─────────────────────────────────────────────────────
alter table public.tb_patients
  add column if not exists archived           boolean default false,
  add column if not exists outcome            jsonb,
  add column if not exists regimen_history    jsonb default '[]'::jsonb,
  add column if not exists comorbidities      jsonb default '[]'::jsonb,
  add column if not exists concomitant_drugs  jsonb default '[]'::jsonb,
  add column if not exists labs               jsonb default '[]'::jsonb,
  add column if not exists sputum             jsonb default '[]'::jsonb,
  add column if not exists adr                jsonb default '{}'::jsonb,
  add column if not exists visits             jsonb default '[]'::jsonb,
  add column if not exists dot                jsonb default '{}'::jsonb,
  add column if not exists custom_doses       jsonb,
  add column if not exists patient_type       text,
  add column if not exists disease_location   text,
  add column if not exists extra_pulmonary_type text,
  add column if not exists hiv_status         text,
  add column if not exists hiv_note           text,
  add column if not exists next_appt          text,
  add column if not exists days_until         int,
  add column if not exists start_date         text,
  add column if not exists subdistrict        text,
  add column if not exists prefix             text,
  add column if not exists first_name         text,
  add column if not exists last_name          text,
  add column if not exists adherence          int,
  add column if not exists phase              text,
  add column if not exists month              int,
  add column if not exists day                int,
  add column if not exists status             text,
  add column if not exists updated_at         timestamptz default now(),
  add column if not exists created_at         timestamptz default now();

-- ─────────────────────────────────────────────────────
-- 2. แก้ Profiles RLS recursion
--    Root cause: policy เก่าน่าจะมี subquery select from profiles เอง → วน loop
--    Fix: ใช้ SECURITY DEFINER function ที่ bypass RLS
-- ─────────────────────────────────────────────────────

-- function เช็ค admin (bypass RLS เพราะ security definer)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ลบ policy เก่าทั้งหมดของ profiles
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname='public' and tablename='profiles' loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;

-- เปิด RLS
alter table public.profiles enable row level security;

-- SELECT: user เห็น profile ตัวเอง + admin เห็นทุกคน
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() OR public.is_admin());

-- INSERT: เฉพาะตอน register (id ต้องตรงกับ auth.uid())
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- UPDATE: user แก้ของตัวเอง + admin แก้ของใครก็ได้
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() OR public.is_admin())
  with check (id = auth.uid() OR public.is_admin());

-- DELETE: admin เท่านั้น
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- ─────────────────────────────────────────────────────
-- 3. แทน subquery select profiles ใน policies tb_patients
--    ด้วย function is_approved() / is_admin() — ป้องกัน recursion
-- ─────────────────────────────────────────────────────
drop policy if exists "patients select approved" on public.tb_patients;
create policy "patients select approved"
  on public.tb_patients for select
  to authenticated
  using (public.is_approved());

drop policy if exists "patients insert approved" on public.tb_patients;
create policy "patients insert approved"
  on public.tb_patients for insert
  to authenticated
  with check (public.is_approved());

drop policy if exists "patients update approved" on public.tb_patients;
create policy "patients update approved"
  on public.tb_patients for update
  to authenticated
  using (public.is_approved())
  with check (public.is_approved());

drop policy if exists "patients delete admin" on public.tb_patients;
create policy "patients delete admin"
  on public.tb_patients for delete
  to authenticated
  using (public.is_admin());

-- ─────────────────────────────────────────────────────
-- 4. แทนใน tb_delete_requests + tb_patients_deleted_log
-- ─────────────────────────────────────────────────────
drop policy if exists "delete_req select approved" on public.tb_delete_requests;
create policy "delete_req select approved"
  on public.tb_delete_requests for select to authenticated
  using (public.is_approved());

drop policy if exists "delete_req insert own" on public.tb_delete_requests;
create policy "delete_req insert own"
  on public.tb_delete_requests for insert to authenticated
  with check (requested_by = auth.uid() and public.is_approved());

drop policy if exists "delete_req update admin" on public.tb_delete_requests;
create policy "delete_req update admin"
  on public.tb_delete_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "deleted_log select approved" on public.tb_patients_deleted_log;
create policy "deleted_log select approved"
  on public.tb_patients_deleted_log for select to authenticated
  using (public.is_approved());

drop policy if exists "deleted_log insert admin" on public.tb_patients_deleted_log;
create policy "deleted_log insert admin"
  on public.tb_patients_deleted_log for insert to authenticated
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════
-- ✅ หลังรันเสร็จ:
--    - tb_patients มีคอลัมน์ครบทุกตัวที่ frontend ส่ง
--    - profiles RLS ไม่ recursive แล้ว
--    - ทุก policy ใช้ function is_admin() / is_approved() bypass RLS
-- ═══════════════════════════════════════════════════════
