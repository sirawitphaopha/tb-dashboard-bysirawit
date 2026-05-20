-- ════════════════════════════════════════════════════════════
-- เพิ่มคอลัมน์สำหรับระบบ "อนุมัติคำขอแก้ไขข้อมูล"
-- ตาราง: tb_profile_edit_requests
-- รันใน Supabase → SQL Editor (ปลอดภัย รันซ้ำได้ ใช้ IF NOT EXISTS)
-- ════════════════════════════════════════════════════════════

-- คอลัมน์เก็บว่าใครเป็นคนพิจารณา (admin)
ALTER TABLE tb_profile_edit_requests
  ADD COLUMN IF NOT EXISTS reviewed_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS review_note   text,
  ADD COLUMN IF NOT EXISTS reviewer_name_at_review text;

-- index ช่วยให้ query คำขอที่ค้างอยู่ (pending) เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_edit_requests_status
  ON tb_profile_edit_requests (status);

CREATE INDEX IF NOT EXISTS idx_edit_requests_user
  ON tb_profile_edit_requests (user_id);

-- ── tb_notifications: คำขอแก้ไขไม่มีผู้ป่วย จึงต้องอนุญาตให้ patient_name ว่างได้ ──
-- (ถ้าคอลัมน์เป็น nullable อยู่แล้ว คำสั่งนี้จะไม่มีผล ไม่ error)
ALTER TABLE tb_notifications ALTER COLUMN patient_name DROP NOT NULL;

-- ════════════════════════════════════════════════════════════
-- RLS (ระบบกั้นสิทธิ์) สำหรับ tb_profile_edit_requests
-- ให้ admin อ่านคำขอทั้งหมดได้ และ user อ่าน/สร้างของตัวเองได้
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.tb_profile_edit_requests ENABLE ROW LEVEL SECURITY;

-- admin เห็นคำขอทุกคน / user เห็นเฉพาะของตัวเอง
DROP POLICY IF EXISTS "edit_req select" ON public.tb_profile_edit_requests;
CREATE POLICY "edit_req select"
  ON public.tb_profile_edit_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- user สร้างคำขอของตัวเองได้ (เผื่อกรณีไม่ได้ผ่าน API service-role)
DROP POLICY IF EXISTS "edit_req insert own" ON public.tb_profile_edit_requests;
CREATE POLICY "edit_req insert own"
  ON public.tb_profile_edit_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- เฉพาะ admin update (approve/reject) ได้
DROP POLICY IF EXISTS "edit_req update admin" ON public.tb_profile_edit_requests;
CREATE POLICY "edit_req update admin"
  ON public.tb_profile_edit_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
