-- v0.8 — เปิด realtime ให้คลังความรู้ (tb_knowledge_docs)
-- ให้เครื่องอื่นที่เปิดหน้าคลัง PDF อยู่ เห็นการอัป/ลบ ทันที (subscribe postgres_changes)
-- เพิ่มตารางเข้า publication supabase_realtime (แบบเดียวกับ tb_changelog_comments / tb_patient_images)
-- ⚠️ Supabase env เดียว (dev=prod) → รันครั้งเดียวพอ · idempotent (รันซ้ำ = ข้าม ไม่ error)
do $$
begin
  alter publication supabase_realtime add table public.tb_knowledge_docs;
exception
  when duplicate_object then null;   -- ตารางอยู่ใน publication แล้ว = ข้าม
end $$;
