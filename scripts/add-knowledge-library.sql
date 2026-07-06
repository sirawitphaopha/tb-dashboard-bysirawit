-- v0.8 — คลังความรู้วัณโรค (ระบบ PDF) · ตาราง tb_knowledge_docs
-- เก็บไฟล์ PDF จริงใน Cloudflare R2 (bucket แยกใหม่ tb-knowledge / env R2_BUCKET_LIBRARY)
--   ตารางนี้เก็บ metadata + storage_key (ตัวไฟล์อยู่ R2)
-- สิทธิ์: ทุกคนที่อนุมัติแล้ว "อ่าน" ได้ · เฉพาะแอดมิน "อัปโหลด/ลบ" ได้
--   (admin op จริงทำผ่าน API + createAdminClient() ในโค้ด · RLS นี้เป็น defense-in-depth อีกชั้น)
-- ใช้ helper is_approved() / is_admin() (SECURITY DEFINER · bypass RLS กันวน loop 42P17)
-- ⚠️ Supabase env เดียว (dev=prod) → รันครั้งเดียวพอ · idempotent (รันซ้ำได้)

create table if not exists public.tb_knowledge_docs (
  id           uuid        primary key default gen_random_uuid(),
  category     text        not null default 'other' check (category in ('guideline','trial','other')),
  title        text,                                   -- ไม่บังคับ · ว่าง = ใช้ file_name
  file_name    text,                                   -- ชื่อไฟล์ต้นฉบับ (ใช้เป็น fallback title + ชื่อตอนดาวน์โหลด)
  source_url   text,                                   -- ลิงก์ต้นฉบับ (ไม่บังคับ)
  storage_key  text        not null,                   -- library/<uuid>.pdf
  thumb_key    text,                                   -- library/<uuid>_thumb.webp (รูปหน้าปก · หน้าแรกของ PDF)
  mime         text        default 'application/pdf',
  size_bytes   integer,                                -- ใช้ในหน้า storage monitor
  page_count   integer,                                -- จำนวนหน้า (คำนวณตอนอัปด้วย pdf.js)
  uploaded_by  uuid,
  uploaded_at  timestamptz not null default now()
  -- ไม่มี soft-delete: ลบจริง (hard delete) เพราะไม่ใช่ข้อมูลผู้ป่วย
);

create index if not exists idx_knowledge_category on public.tb_knowledge_docs (category, uploaded_at desc);
create index if not exists idx_knowledge_uploaded on public.tb_knowledge_docs (uploaded_at desc);

alter table public.tb_knowledge_docs enable row level security;

-- อ่าน = ผู้ใช้ที่อนุมัติแล้วทุกคน
drop policy if exists "knowledge_select_approved" on public.tb_knowledge_docs;
create policy "knowledge_select_approved" on public.tb_knowledge_docs
  for select using (public.is_approved());

-- เขียน/แก้/ลบ = แอดมินเท่านั้น (ป้องกันซ้ำอีกชั้นนอกเหนือ API)
drop policy if exists "knowledge_insert_admin" on public.tb_knowledge_docs;
create policy "knowledge_insert_admin" on public.tb_knowledge_docs
  for insert with check (public.is_admin());

drop policy if exists "knowledge_update_admin" on public.tb_knowledge_docs;
create policy "knowledge_update_admin" on public.tb_knowledge_docs
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "knowledge_delete_admin" on public.tb_knowledge_docs;
create policy "knowledge_delete_admin" on public.tb_knowledge_docs
  for delete using (public.is_admin());
