-- v0.7.19.x — เปิด Realtime ให้ tb_patient_images (อัป/ลบ/แก้ เห็นสดทุกคน ข้ามผู้ใช้)
-- รันครั้งเดียว · ถ้าตารางอยู่ใน publication แล้วจะ error ปล่อยได้
alter publication supabase_realtime add table public.tb_patient_images;
