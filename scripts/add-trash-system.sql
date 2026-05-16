-- ═══════════════════════════════════════════════════════
-- 🗑 Trash System — TB Dashboard
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- Project: cioswzdbonnbhbyynrhh.supabase.co
-- ═══════════════════════════════════════════════════════
-- ระบบลบผู้ป่วย 3 ระดับ:
--   1. Soft delete (deleted_at != null) → อยู่ในถังขยะ 60 วัน
--   2. Hard delete → ลบออกจาก DB จริง (มี audit log)
--   3. User ทั่วไป → ส่งคำขอ → admin approve/reject
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────
-- 1. เพิ่มคอลัมน์ใน tb_patients (soft delete)
-- ─────────────────────────────────────────────────────
alter table public.tb_patients
  add column if not exists deleted_at    timestamptz,
  add column if not exists deleted_by    uuid references public.profiles(id),
  add column if not exists delete_reason text;

create index if not exists idx_tb_patients_deleted_at
  on public.tb_patients(deleted_at)
  where deleted_at is not null;

-- ─────────────────────────────────────────────────────
-- 2. ตาราง tb_delete_requests (คำขอลบจาก user ทั่วไป)
-- ─────────────────────────────────────────────────────
create table if not exists public.tb_delete_requests (
  id            uuid primary key default gen_random_uuid(),
  patient_id    text not null references public.tb_patients(id) on delete cascade,
  requested_by  uuid not null references public.profiles(id),
  requested_at  timestamptz not null default now(),
  reason        text not null,
  status        text not null default 'pending'
                  check (status in ('pending','approved','rejected')),
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,
  review_note   text
);

create index if not exists idx_delete_requests_status
  on public.tb_delete_requests(status);
create index if not exists idx_delete_requests_patient
  on public.tb_delete_requests(patient_id);

alter table public.tb_delete_requests enable row level security;

-- ทุก approved user เห็น requests ได้
drop policy if exists "delete_req select approved" on public.tb_delete_requests;
create policy "delete_req select approved"
  on public.tb_delete_requests for select to authenticated
  using (exists (select 1 from public.profiles
                  where id = auth.uid() and status = 'approved'));

-- approved user สร้าง request ของตัวเองได้
drop policy if exists "delete_req insert own" on public.tb_delete_requests;
create policy "delete_req insert own"
  on public.tb_delete_requests for insert to authenticated
  with check (
    requested_by = auth.uid()
    and exists (select 1 from public.profiles
                  where id = auth.uid() and status = 'approved')
  );

-- เฉพาะ admin update (approve/reject) ได้
drop policy if exists "delete_req update admin" on public.tb_delete_requests;
create policy "delete_req update admin"
  on public.tb_delete_requests for update to authenticated
  using (exists (select 1 from public.profiles
                  where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles
                  where id = auth.uid() and role = 'admin'));

-- ─────────────────────────────────────────────────────
-- 3. ตาราง tb_patients_deleted_log (audit trail หลัง hard delete)
-- ─────────────────────────────────────────────────────
create table if not exists public.tb_patients_deleted_log (
  id              uuid primary key default gen_random_uuid(),
  patient_hn      text not null,
  patient_name    text,
  patient_age     int,
  patient_gender  text,
  regimen         text,
  deleted_by      uuid references public.profiles(id),
  deleted_at      timestamptz not null default now(),
  reason          text,
  data_snapshot   jsonb     -- เก็บ key fields เผื่อ audit
);

alter table public.tb_patients_deleted_log enable row level security;

-- ทุก approved user เห็น log ได้
drop policy if exists "deleted_log select approved" on public.tb_patients_deleted_log;
create policy "deleted_log select approved"
  on public.tb_patients_deleted_log for select to authenticated
  using (exists (select 1 from public.profiles
                  where id = auth.uid() and status = 'approved'));

-- เฉพาะ admin insert log ได้ (จริงๆ จะ insert ผ่าน trigger ก็ได้)
drop policy if exists "deleted_log insert admin" on public.tb_patients_deleted_log;
create policy "deleted_log insert admin"
  on public.tb_patients_deleted_log for insert to authenticated
  with check (exists (select 1 from public.profiles
                  where id = auth.uid() and role = 'admin'));

-- ─────────────────────────────────────────────────────
-- 4. แก้ RLS tb_patients ให้รองรับ soft delete
--    (ของเดิมจาก fix-rls-strict.sql — เพิ่ม filter deleted_at)
-- ─────────────────────────────────────────────────────
-- SELECT: approved user เห็นทั้ง active และ deleted (เพื่อให้เห็นถังขยะ)
-- UPDATE: ถ้าจะ restore (set deleted_at=null) → admin เท่านั้น
--         ถ้าจะ update field อื่น → ต้องเป็น active (deleted_at is null)
-- DELETE: admin เท่านั้น (hard delete)

drop policy if exists "patients update approved" on public.tb_patients;
create policy "patients update approved"
  on public.tb_patients for update to authenticated
  using (
    exists (select 1 from public.profiles
              where id = auth.uid() and status = 'approved')
  )
  with check (
    exists (select 1 from public.profiles
              where id = auth.uid() and status = 'approved')
  );
-- หมายเหตุ: การ "set deleted_at != null" (soft delete) ต้องตรวจสิทธิ์ใน application layer
--          เพราะ RLS ไม่รู้ business intent — admin = soft+hard delete ได้, user = ทำได้แค่ insert request

-- ─────────────────────────────────────────────────────
-- 5. Trigger: ตอน hard delete tb_patients → ใส่ log อัตโนมัติ
-- ─────────────────────────────────────────────────────
create or replace function public.log_patient_hard_delete()
returns trigger as $$
begin
  insert into public.tb_patients_deleted_log
    (patient_hn, patient_name, patient_age, patient_gender, regimen,
     deleted_by, deleted_at, reason, data_snapshot)
  values
    (old.hn,
     old.name,
     old.age,
     old.gender,
     old.regimen,
     old.deleted_by,
     now(),
     old.delete_reason,
     to_jsonb(old) - 'data_snapshot');  -- snapshot ของ row เก่า
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_patient_hard_delete on public.tb_patients;
create trigger trg_log_patient_hard_delete
  before delete on public.tb_patients
  for each row execute function public.log_patient_hard_delete();

-- ─────────────────────────────────────────────────────
-- 6. pg_cron — auto-purge หลัง 60 วันในถังขยะ
--    (รันรายวัน 02:00 น. — เวลา Bangkok = UTC+7)
-- ─────────────────────────────────────────────────────
-- ⚠️ ต้องเปิด pg_cron extension ก่อน:
--    Supabase Dashboard → Database → Extensions → ค้นหา "pg_cron" → Enable
create extension if not exists pg_cron;

-- ลบ cron เก่า (ถ้ามี) แล้วสร้างใหม่
select cron.unschedule('purge_trash_60d') where exists (
  select 1 from cron.job where jobname = 'purge_trash_60d'
);

select cron.schedule(
  'purge_trash_60d',
  '0 19 * * *',  -- 19:00 UTC = 02:00 Bangkok
  $$
    delete from public.tb_patients
    where deleted_at is not null
      and deleted_at < now() - interval '60 days';
  $$
);

-- ═══════════════════════════════════════════════════════
-- ✅ ตรวจสอบหลังรัน
-- ═══════════════════════════════════════════════════════
-- 1. เช็คคอลัมน์ใหม่:
--    select column_name from information_schema.columns
--    where table_name='tb_patients' and column_name like 'delete%';
--    → ควรเห็น 3 แถว
--
-- 2. เช็คตารางใหม่:
--    select table_name from information_schema.tables
--    where table_name in ('tb_delete_requests','tb_patients_deleted_log');
--    → ควรเห็น 2 แถว
--
-- 3. เช็ค cron:
--    select jobname, schedule from cron.job where jobname='purge_trash_60d';
--    → ควรเห็น 1 แถว
-- ═══════════════════════════════════════════════════════
