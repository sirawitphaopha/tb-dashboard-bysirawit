-- v0.7.19.x — เก็บคุณภาพการบีบจริงตอนอัป (92/87) ไม่ให้แสดงผลเพี้ยนเมื่อเปลี่ยนหมวด
-- เพิ่มคอลัมน์เฉยๆ ไม่กระทบเดิม · Supabase env เดียว รันครั้งเดียว
alter table public.tb_patient_images
  add column if not exists quality integer;
