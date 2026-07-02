-- ════════════════════════════════════════════════════════════════════════
-- 🗑 ระบบถังขยะรูป + ขอลบรูป (mirror ระบบลบผู้ป่วย) — v0.7.20.0
-- สร้าง 2026-07-02
-- ════════════════════════════════════════════════════════════════════════
--
-- tb_patient_images มี deleted_at + deleted_by อยู่แล้ว (soft-delete)
-- เพิ่มคอลัมน์รองรับ:
--   เฟส 1 (ถังขยะ):  deleter_name, delete_reason  — โชว์ในถังขยะว่าใครลบ/เหตุผล
--   เฟส 2 (ขอลบรูป):  delete_req_*                — สถานะ "รอแอดมินอนุมัติลบรูป" (ฝ้าขาว)
--
-- run ผ่าน Supabase MCP แล้ว (migration: add_image_trash_and_delete_request)

alter table public.tb_patient_images
  add column if not exists deleter_name     text,        -- ชื่อคนลบ ณ ตอนลบ (โชว์ในถังขยะ)
  add column if not exists delete_reason    text,        -- เหตุผลตอนลบ/ตอน approve คำขอ
  add column if not exists delete_req_by     uuid,       -- user ที่ "ขอลบ" (เฟส 2)
  add column if not exists delete_req_name   text,       -- ชื่อคนขอลบ ณ ตอนขอ
  add column if not exists delete_req_at      timestamptz,-- เวลาขอลบ
  add column if not exists delete_req_reason  text;       -- เหตุผลขอลบ (บังคับกรอกฝั่ง UI)

-- ดัชนีช่วย query รูปที่มีคำขอลบค้าง (แอดมินดูรายการรออนุมัติ)
create index if not exists idx_tb_patient_images_delete_req
  on public.tb_patient_images (delete_req_at)
  where delete_req_by is not null and deleted_at is null;
