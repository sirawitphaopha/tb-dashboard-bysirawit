-- ════════════════════════════════════════════════════════════════════════
-- tb_changelog_comments — ระบบ comment ต่อ version ใน Changelog Page
-- เพิ่มใน v0.7.14.2 (2026-05-30)
--
-- กฎ:
-- • ทุก user (authenticated) เห็น comment ทุกอัน (ที่ไม่ถูก soft delete)
-- • user เขียน comment ของตัวเองได้ + แก้ไข + ลบ (soft) ของตัวเอง
-- • admin ใช้ service_role ลบ comment ของคนอื่น (ผ่าน API)
-- • snapshot ฟิลด์ email/display_name/role ไว้ (กันลบ — แสดงต่อได้)
-- • status: feedback / bug_report / request / note
-- ════════════════════════════════════════════════════════════════════════

create table if not exists tb_changelog_comments (
  id            uuid primary key default gen_random_uuid(),
  version       text not null,
  user_id       uuid references auth.users(id) on delete set null,
  email         text not null,
  display_name  text not null,
  role          text not null check (role in ('admin','user')),
  profession_label text,                          -- snapshot ตัวย่อวิชาชีพ (เช่น ภก./ภญ./นพ.) ใช้แสดงใน avatar
  comment_text  text not null check (char_length(comment_text) between 1 and 2000),
  status        text not null check (status in ('feedback','bug_report','request','note')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  deleted_by    uuid references auth.users(id) on delete set null,
  edited        boolean not null default false
);

create index if not exists idx_changelog_comments_version
  on tb_changelog_comments(version)
  where deleted_at is null;

create index if not exists idx_changelog_comments_user
  on tb_changelog_comments(user_id);

create index if not exists idx_changelog_comments_created
  on tb_changelog_comments(created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────
alter table tb_changelog_comments enable row level security;

-- SELECT: authenticated user เห็นทั้งหมด (ที่ยังไม่ถูก soft delete)
drop policy if exists "select all comments" on tb_changelog_comments;
create policy "select all comments"
  on tb_changelog_comments for select
  to authenticated
  using (deleted_at is null);

-- INSERT: เฉพาะตัวเอง (user_id ต้อง = auth.uid())
drop policy if exists "insert own comment" on tb_changelog_comments;
create policy "insert own comment"
  on tb_changelog_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: เฉพาะตัวเอง
drop policy if exists "update own comment" on tb_changelog_comments;
create policy "update own comment"
  on tb_changelog_comments for update
  to authenticated
  using (auth.uid() = user_id);

-- DELETE (hard delete — RLS ปกติ ปกติเราใช้ soft delete ผ่าน UPDATE deleted_at)
-- ห้าม client hard delete — admin ลบของคนอื่นใช้ service_role ผ่าน API
drop policy if exists "no client hard delete" on tb_changelog_comments;
create policy "no client hard delete"
  on tb_changelog_comments for delete
  to authenticated
  using (false);

-- ── Migration: เพิ่มคอลัมน์ profession_label (สำหรับตารางที่สร้างไปแล้ว) ──
-- รันได้ซ้ำได้ปลอดภัย (if not exists)
alter table tb_changelog_comments
  add column if not exists profession_label text;

-- ── หมายเหตุการใช้งาน ─────────────────────────────────────────────────
-- • API POST ใช้ service_role + snapshot email/display_name/role จาก profiles
-- • API PATCH (edit own) ใช้ RLS ปกติ — ต้อง auth.uid() = user_id
-- • API DELETE (soft delete) ใช้ UPDATE set deleted_at + deleted_by
--   - ลบของตัวเอง → ใช้ RLS ปกติ
--   - admin ลบของคนอื่น → ใช้ service_role bypass RLS
-- • Realtime ยังไม่เปิดในรอบนี้ (เก็บไว้ปรับปรุงต่อ)
