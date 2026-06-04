-- v0.7.19.0 — ระบบรูปภาพผู้ป่วย (CXR / Lab / Document / Other)
-- เก็บไฟล์จริงใน Cloudflare R2 (private bucket tb-patient-images) · ตารางนี้เก็บ metadata + storage_key
-- patient_id = TEXT (tb_patients.id เป็น text เช่น 'P001')
-- ⚠️ Supabase env เดียว (dev=prod) → รันครั้งเดียวพอ

create table if not exists public.tb_patient_images (
  id           uuid        primary key default gen_random_uuid(),
  patient_id   text        not null references public.tb_patients(id) on delete cascade,
  type         text        not null default 'other' check (type in ('cxr','lab','document','other')),
  storage_key  text        not null,                 -- patients/<patientId>/<uuid>.webp
  mime         text,
  size_bytes   integer,
  width        integer,
  height       integer,
  title        text,
  note         text,
  uploaded_by  uuid,
  uploaded_at  timestamptz not null default now(),
  deleted_at   timestamptz,
  deleted_by   uuid
);

create index if not exists idx_patient_images_patient on public.tb_patient_images (patient_id, deleted_at);
create index if not exists idx_patient_images_type    on public.tb_patient_images (type, deleted_at);

alter table public.tb_patient_images enable row level security;

-- ดู/เพิ่ม = ผู้ใช้ที่อนุมัติแล้ว (ลบจัดการผ่าน API admin client + เช็คสิทธิ์ในโค้ด)
drop policy if exists "patient_images_select_approved" on public.tb_patient_images;
create policy "patient_images_select_approved" on public.tb_patient_images
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
  );

drop policy if exists "patient_images_insert_approved" on public.tb_patient_images;
create policy "patient_images_insert_approved" on public.tb_patient_images
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
  );
