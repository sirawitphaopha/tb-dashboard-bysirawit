-- ═══════════════════════════════════════════════════════
-- 🔒 Fix RLS — TB Dashboard (patients)
-- Project: cioswzdbonnbhbyynrhh.supabase.co
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════
-- ⚠️  สำคัญมาก: นี่คือข้อมูลคนไข้ ต้อง strict กว่า TB Calc

-- 1. เปิด RLS
alter table public.tb_patients enable row level security;

-- 2. ลบ policy เก่าทิ้ง (ถ้ามี)
drop policy if exists "patients select authenticated" on public.tb_patients;
drop policy if exists "patients insert authenticated" on public.tb_patients;
drop policy if exists "patients update authenticated" on public.tb_patients;
drop policy if exists "patients delete authenticated" on public.tb_patients;

-- 3. ห้าม anon ทำอะไรกับ tb_patients เลย — ต้อง login ก่อนเท่านั้น
--    (anon key ที่อยู่ในไฟล์ js จะไม่สามารถแตะข้อมูลคนไข้ได้)

create policy "patients select authenticated"
  on public.tb_patients for select
  to authenticated
  using (true);

create policy "patients insert authenticated"
  on public.tb_patients for insert
  to authenticated
  with check (true);

create policy "patients update authenticated"
  on public.tb_patients for update
  to authenticated
  using (true)
  with check (true);

create policy "patients delete authenticated"
  on public.tb_patients for delete
  to authenticated
  using (true);

-- ═══════════════════════════════════════════════════════
-- ✅ หลังรันเสร็จ:
--    - anon key (ใน frontend code) จะ DELETE/UPDATE/INSERT/SELECT ไม่ได้เลย
--    - ต้อง login ผ่าน Supabase Auth เท่านั้น จึงจะแตะข้อมูลได้
--    - ตอนนี้ใช้ระดับ "authenticated" ทั้งหมด = ทุก user ที่ login ทำได้ทุกอย่าง
--
-- 🔜 ในอนาคต (หลังสร้าง profiles table):
--    - เปลี่ยน DELETE → เฉพาะ admin (เช็คจาก profiles.role = 'admin')
--    - เปลี่ยน INSERT/UPDATE → เฉพาะ approved users
--    - SELECT → อาจจำกัดเฉพาะ user ที่อยู่โรงพยาบาลเดียวกัน
-- ═══════════════════════════════════════════════════════
