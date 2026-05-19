-- ════════════════════════════════════════════════════════════════════
-- 👤 User Name Snapshots — TB Dashboard
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- Project: cioswzdbonnbhbyynrhh.supabase.co
-- ════════════════════════════════════════════════════════════════════
-- เป้าหมาย: ให้ลบบัญชี user ถาวรได้ โดยที่บันทึกเก่า (คำขอลบ, log การลบคนไข้)
--          ยังเก็บ "ชื่อ ณ ตอนนั้น" ไว้เป็นตัวหนังสือ — กันชื่อหายเวลาลบบัญชี
--
-- หลักการ:
--   1) เพิ่มคอลัมน์เก็บชื่อแบบ snapshot (text) ในตารางที่อ้างถึง user
--   2) เปลี่ยน FK ทุกตัวเป็น ON DELETE SET NULL → ลบ user แล้วแถวยังอยู่
--   3) Backfill: เติมชื่อจาก profile ปัจจุบันลงแถวเก่าทั้งหมด
--   4) แก้ trigger ให้ copy ชื่อ snapshot ไปลง log อัตโนมัติ
-- ════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────
-- 1. เพิ่มคอลัมน์ snapshot (text เก็บชื่อ ณ ตอนนั้น)
-- ─────────────────────────────────────────────────────
alter table public.tb_delete_requests
  add column if not exists requester_name_at_request text,
  add column if not exists reviewer_name_at_review   text;

alter table public.tb_patients
  add column if not exists deleter_name_at_delete text;

alter table public.tb_patients_deleted_log
  add column if not exists deleter_name_at_delete text;


-- ─────────────────────────────────────────────────────
-- 2. ปลด NOT NULL ของ requested_by
--    (จำเป็นต้องปลด เพื่อให้ ON DELETE SET NULL ทำงานได้
--     ไม่งั้นพอลบ user ที่เป็นเจ้าของคำขอ → DB จะ error)
-- ─────────────────────────────────────────────────────
alter table public.tb_delete_requests
  alter column requested_by drop not null;


-- ─────────────────────────────────────────────────────
-- 3. เปลี่ยน FK ทุกตัวเป็น ON DELETE SET NULL
--    (drop ของเดิมก่อน แล้ว add ใหม่)
-- ─────────────────────────────────────────────────────

-- 3.1 tb_delete_requests.requested_by → profiles(id)
alter table public.tb_delete_requests
  drop constraint if exists tb_delete_requests_requested_by_fkey;
alter table public.tb_delete_requests
  add constraint tb_delete_requests_requested_by_fkey
  foreign key (requested_by) references public.profiles(id)
  on delete set null;

-- 3.2 tb_delete_requests.reviewed_by → profiles(id)
alter table public.tb_delete_requests
  drop constraint if exists tb_delete_requests_reviewed_by_fkey;
alter table public.tb_delete_requests
  add constraint tb_delete_requests_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles(id)
  on delete set null;

-- 3.3 tb_patients.deleted_by → profiles(id)
alter table public.tb_patients
  drop constraint if exists tb_patients_deleted_by_fkey;
alter table public.tb_patients
  add constraint tb_patients_deleted_by_fkey
  foreign key (deleted_by) references public.profiles(id)
  on delete set null;

-- 3.4 tb_patients_deleted_log.deleted_by → profiles(id)
alter table public.tb_patients_deleted_log
  drop constraint if exists tb_patients_deleted_log_deleted_by_fkey;
alter table public.tb_patients_deleted_log
  add constraint tb_patients_deleted_log_deleted_by_fkey
  foreign key (deleted_by) references public.profiles(id)
  on delete set null;


-- ─────────────────────────────────────────────────────
-- 4. Backfill snapshot จาก profile ปัจจุบัน
--    เติมชื่อ "first_name last_name" ลงในแถวเก่าที่ snapshot ยังว่าง
-- ─────────────────────────────────────────────────────

-- 4.1 tb_delete_requests — เติมชื่อผู้ยื่นคำขอ
update public.tb_delete_requests r
   set requester_name_at_request =
       trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,''))
  from public.profiles p
 where r.requested_by = p.id
   and r.requester_name_at_request is null;

-- 4.2 tb_delete_requests — เติมชื่อผู้รีวิว (admin)
update public.tb_delete_requests r
   set reviewer_name_at_review =
       trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,''))
  from public.profiles p
 where r.reviewed_by = p.id
   and r.reviewer_name_at_review is null;

-- 4.3 tb_patients — เติมชื่อคนที่กดลบ (อยู่ในถังขยะ)
update public.tb_patients t
   set deleter_name_at_delete =
       trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,''))
  from public.profiles p
 where t.deleted_by = p.id
   and t.deleter_name_at_delete is null;

-- 4.4 tb_patients_deleted_log — เติมชื่อคนที่ลบคนไข้ (audit log)
update public.tb_patients_deleted_log l
   set deleter_name_at_delete =
       trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,''))
  from public.profiles p
 where l.deleted_by = p.id
   and l.deleter_name_at_delete is null;


-- ─────────────────────────────────────────────────────
-- 5. แก้ trigger log_patient_hard_delete
--    ให้ copy deleter_name_at_delete ลง log ด้วย
--    (ของเดิม copy เฉพาะ deleted_by ที่เป็น uuid)
-- ─────────────────────────────────────────────────────
create or replace function public.log_patient_hard_delete()
returns trigger as $$
begin
  insert into public.tb_patients_deleted_log
    (patient_hn, patient_name, patient_age, patient_gender, regimen,
     deleted_by, deleter_name_at_delete,
     deleted_at, reason, data_snapshot)
  values
    (old.hn,
     old.name,
     old.age,
     old.gender,
     old.regimen,
     old.deleted_by,
     old.deleter_name_at_delete,    -- ⭐ snapshot ชื่อ ณ ตอนลบ
     now(),
     old.delete_reason,
     to_jsonb(old) - 'data_snapshot');
  return old;
end;
$$ language plpgsql security definer;


-- ════════════════════════════════════════════════════════════════════
-- ✅ ตรวจสอบหลังรัน (ลอง copy ไปวางใน SQL Editor ดู ทีละ query)
-- ════════════════════════════════════════════════════════════════════
--
-- 1) เช็คคอลัมน์ snapshot ถูกเพิ่มครบ:
--    select table_name, column_name
--      from information_schema.columns
--     where (table_name='tb_delete_requests'
--             and column_name in ('requester_name_at_request','reviewer_name_at_review'))
--        or (table_name='tb_patients'
--             and column_name = 'deleter_name_at_delete')
--        or (table_name='tb_patients_deleted_log'
--             and column_name = 'deleter_name_at_delete');
--    → ควรได้ 4 แถว
--
-- 2) เช็ค FK เป็น SET NULL:
--    select conname, confdeltype
--      from pg_constraint
--     where conname in (
--       'tb_delete_requests_requested_by_fkey',
--       'tb_delete_requests_reviewed_by_fkey',
--       'tb_patients_deleted_by_fkey',
--       'tb_patients_deleted_log_deleted_by_fkey'
--     );
--    → confdeltype ควรเป็น 'n' ทั้ง 4 แถว ('n' = SET NULL)
--
-- 3) เช็ค backfill ทำงาน:
--    select id, requested_by, requester_name_at_request
--      from public.tb_delete_requests limit 5;
--    → ถ้ามีคำขอเก่า ช่อง requester_name_at_request ควรมีชื่อ
-- ════════════════════════════════════════════════════════════════════
