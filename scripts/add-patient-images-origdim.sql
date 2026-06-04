-- v0.7.19.x — เก็บขนาดภาพต้นฉบับ (ก่อนบีบ) แสดงในข้อมูลรูป
-- เพิ่มคอลัมน์เฉยๆ ไม่กระทบเดิม · Supabase env เดียว รันครั้งเดียว
alter table public.tb_patient_images
  add column if not exists orig_width  integer,
  add column if not exists orig_height integer;
