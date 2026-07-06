-- v0.8 — คลังความรู้: เพิ่มคอลัมน์ device (อัปจากอุปกรณ์/เบราว์เซอร์ไหน) ใน tb_knowledge_docs
-- โชว์ในหน้า "คุณสมบัติของเอกสาร" ของตัวอ่าน PDF · เก็บตอนอัป (detectDevice ฝั่ง client)
-- ⚠️ Supabase env เดียว (dev=prod) · idempotent (add column if not exists)
alter table public.tb_knowledge_docs add column if not exists device text;
