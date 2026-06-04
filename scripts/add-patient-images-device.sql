-- v0.7.19.x — เก็บอุปกรณ์ที่อัปรูป (iOS / Android / Windows / Mac) แสดงในข้อมูลรูป
-- เพิ่มคอลัมน์เฉยๆ ไม่กระทบข้อมูลเดิม · Supabase env เดียว (dev=prod) รันครั้งเดียว
alter table public.tb_patient_images
  add column if not exists device text;
