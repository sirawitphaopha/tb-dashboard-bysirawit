-- v0.7.19.0 (polish) — เพิ่มข้อมูลรูปผู้ป่วย: ทัมเนล + ขนาด/ชนิดไฟล์ต้นฉบับ
-- เพิ่มคอลัมน์เฉยๆ ไม่กระทบข้อมูลเดิม · Supabase env เดียว (dev=prod) → รันครั้งเดียว
alter table public.tb_patient_images
  add column if not exists thumb_key       text,      -- คีย์รูปย่อใน R2 (patients/<pid>/<uuid>_thumb.webp)
  add column if not exists orig_size_bytes integer,   -- ขนาดไฟล์ต้นฉบับก่อนบีบ (bytes)
  add column if not exists orig_mime       text;      -- ชนิดไฟล์ต้นฉบับ (image/png, image/jpeg, ...)
