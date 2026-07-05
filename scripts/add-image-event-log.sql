-- ════════════════════════════════════════════════════════════
-- add-image-event-log.sql  —  ประวัติทุกการกระทำต่อรูปผู้ป่วย (Image Event Audit Log)
-- ใครทำอะไรกับรูปไหน เมื่อไหร่ ทำไม · เก็บถาวรแม้รูปถูกลบถาวรไปแล้ว (snapshot ยังอยู่ แค่ไม่มีไฟล์รูป)
-- เจ้าของรูป (คนอัป) แปะไว้ตั้งแต่ต้น · ยึดโครง tb_patients_deleted_log (jsonb snapshot)
-- RLS: client แตะไม่ได้ · เข้าถึงผ่าน API (service-role · admin เท่านั้น)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tb_image_event_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id     uuid NOT NULL,                       -- อ้างอิงรูป (ไม่ทำ FK เพราะรูปถูก hard-delete ได้)
  event_type   text NOT NULL CHECK (event_type IN (
                 'uploaded',                          -- อัปโหลดรูปใหม่
                 'metadata_updated',                  -- แก้ข้อมูลรูป (หมวด/ชื่อ/คำอธิบาย)
                 'delete_requested',                  -- ผู้ใช้ขอลบ
                 'delete_request_cancelled',          -- ยกเลิกคำขอลบ
                 'delete_direct',                     -- แอดมินลบตรง (ไม่ผ่านคำขอ)
                 'delete_approved',                   -- แอดมินอนุมัติลบ (เข้าถังขยะ)
                 'delete_rejected',                   -- แอดมินปฏิเสธคำขอ
                 'restored',                          -- กู้คืนจากถังขยะ
                 'hard_deleted',                      -- ลบถาวร (ลบไฟล์ R2 + row)
                 'purged')),                          -- ลบอัตโนมัติ/ลบตอนลบผู้ป่วย (bulk)

  -- snapshot ผู้ป่วย + รูป
  patient_id   text,
  patient_name text,
  patient_hn   text,
  image_type   text,                                 -- cxr / lab / document / other

  -- ผู้ทำ (actor) — snapshot ณ ตอนนั้น
  actor_id     uuid,
  actor_name   text,
  actor_role   text,                                 -- admin / user

  -- เจ้าของรูป (คนอัปโหลด · แปะตั้งแต่ต้น)
  owner_id     uuid,
  owner_name   text,

  reason       text,                                 -- เหตุผลขอลบ/ลบ/หมายเหตุปฏิเสธ/สรุป field ที่แก้
  snapshot     jsonb,                                -- metadata รูปเต็ม ณ ตอนนั้น (จาก tb_patient_images)
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- indexes (เรียงเวลา + กรองตามรูป/ผู้ป่วย/ชนิด event)
CREATE INDEX IF NOT EXISTS idx_image_event_log_time    ON public.tb_image_event_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_event_log_image   ON public.tb_image_event_log (image_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_event_log_patient ON public.tb_image_event_log (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_event_log_type    ON public.tb_image_event_log (event_type, created_at DESC);

-- RLS: no client access (เข้าผ่าน API service-role เท่านั้น)
ALTER TABLE public.tb_image_event_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no client access" ON public.tb_image_event_log;
CREATE POLICY "no client access" ON public.tb_image_event_log FOR ALL USING (false) WITH CHECK (false);

COMMENT ON TABLE public.tb_image_event_log IS 'ประวัติทุก event ของรูปผู้ป่วย (อัป/แก้/ลบทุกแบบ) · เก็บถาวรแม้รูปลบถาวร · admin ดูผ่าน API /api/patient/images/log';
