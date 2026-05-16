-- ═══════════════════════════════════════════════════════
-- 🔒 RLS Strict Mode — TB Dashboard (tb_patients)
-- รันที่: Supabase Dashboard → SQL Editor → New Query → Run
-- Project: cioswzdbonnbhbyynrhh.supabase.co
-- ═══════════════════════════════════════════════════════
-- เป้าหมาย:
--   SELECT/INSERT/UPDATE → เฉพาะ approved user (status='approved')
--   DELETE              → เฉพาะ admin (role='admin')
--
-- ที่ไม่ทำตอนนี้ (ทำทีหลังเมื่อเพิ่ม column hospital_id):
--   Hospital scoping — เฉพาะ user รพ.เดียวกันเท่านั้นที่ดูได้
-- ═══════════════════════════════════════════════════════

-- 1. ลบ policy เก่า (authenticated ทำได้ทุกอย่าง)
drop policy if exists "patients select authenticated" on public.tb_patients;
drop policy if exists "patients insert authenticated" on public.tb_patients;
drop policy if exists "patients update authenticated" on public.tb_patients;
drop policy if exists "patients delete authenticated" on public.tb_patients;

-- 2. SELECT → ต้องเป็น approved
create policy "patients select approved"
  on public.tb_patients for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved'
    )
  );

-- 3. INSERT → ต้องเป็น approved
create policy "patients insert approved"
  on public.tb_patients for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved'
    )
  );

-- 4. UPDATE → ต้องเป็น approved (เช็คทั้งตอนอ่านและตอนเขียน)
create policy "patients update approved"
  on public.tb_patients for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'approved'
    )
  );

-- 5. DELETE → ต้องเป็น admin เท่านั้น
create policy "patients delete admin"
  on public.tb_patients for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════
-- ✅ หลังรันเสร็จ พฤติกรรมที่คาดหวัง:
--   anon (ไม่ login)            → ทำอะไรไม่ได้เลย (เหมือนเดิม)
--   pending user                → ทำอะไรไม่ได้เลย (เปลี่ยน: เดิมทำได้)
--   rejected user               → ทำอะไรไม่ได้เลย (เปลี่ยน: เดิมทำได้)
--   approved user (role=user)   → SELECT/INSERT/UPDATE ได้ แต่ DELETE ไม่ได้
--   approved + role=admin       → ทำได้ทุกอย่างรวมถึง DELETE
-- ═══════════════════════════════════════════════════════
