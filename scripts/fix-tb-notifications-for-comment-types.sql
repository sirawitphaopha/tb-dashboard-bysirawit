-- ════════════════════════════════════════════════════════════════════════
-- v0.7.14.5 fix — แก้ tb_notifications ให้รองรับ comment_reply/mention/resolved
-- ปัญหา: ถ้า tb_notifications มี CHECK constraint บน type ที่ไม่รวม
--        comment_reply/comment_mention/comment_resolved → insert จะ fail แบบเงียบ
--        ทำให้ tag แล้วกระดิ่งไม่เด้ง
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. ตรวจให้แน่ใจว่าคอลัมน์ comment_version + comment_id มีอยู่ ──
ALTER TABLE tb_notifications
  ADD COLUMN IF NOT EXISTS comment_version text,
  ADD COLUMN IF NOT EXISTS comment_id      uuid REFERENCES tb_changelog_comments(id) ON DELETE SET NULL;

-- ── 2. ตรวจให้ patient_name อนุญาตให้ว่างได้ (เผื่อยังไม่ DROP NOT NULL) ──
ALTER TABLE tb_notifications ALTER COLUMN patient_name DROP NOT NULL;

-- ── 3. ลบ CHECK constraint ของ type (ถ้ามี) เพื่อให้รองรับ types ใหม่ ──
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'tb_notifications'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%type%'
  LOOP
    EXECUTE 'ALTER TABLE tb_notifications DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- ── 4. (เลือก) ใส่ CHECK ใหม่ที่รวม types ครบ — comment_* ใน list ──
-- ถ้าอยากกัน type แปลกๆ uncomment block ล่าง
-- ALTER TABLE tb_notifications
--   ADD CONSTRAINT tb_notifications_type_check
--   CHECK (type IN (
--     'delete_approved','delete_rejected','delete_restored','delete_permanent',
--     'edit_request_approved','edit_request_rejected',
--     'comment_reply','comment_mention','comment_resolved'
--   ));

-- ── 5. เปิด Realtime publication ของ tb_notifications (ถ้ายังไม่เปิด) ──
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tb_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
