-- ═════════════════════════════════════════════════════════════════════════
-- tb_password_change_log
-- ─────────────────────────────────────────────────────────────────────────
-- เก็บประวัติการเปลี่ยนรหัสผ่านของผู้ใช้
-- ใช้สำหรับ:
--   1. จำกัด 3 ครั้ง/24 ชั่วโมง (กันสแปม / กันแฮกเกอร์เปลี่ยนรัวๆ)
--   2. Audit log — ตรวจย้อนหลังได้ว่าใครเปลี่ยนรหัสเมื่อไหร่จาก IP/browser ไหน
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists public.tb_password_change_log (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  changed_at  timestamptz not null default now(),
  ip_address  text,        -- IP ตอนเปลี่ยน (อาจเป็น Cloudflare CF-Connecting-IP)
  user_agent  text         -- browser/device (เผื่อ audit)
);

-- index สำหรับ query "count ใน 24h ล่าสุดของ user X"
create index if not exists idx_pw_change_log_user_time
  on public.tb_password_change_log(user_id, changed_at desc);

-- RLS: บล็อกทุก client — เข้าได้เฉพาะ API ที่ใช้ service_role key
alter table public.tb_password_change_log enable row level security;

drop policy if exists "no client access" on public.tb_password_change_log;
create policy "no client access" on public.tb_password_change_log
  for all
  using (false)
  with check (false);

-- comment เอกสาร
comment on table public.tb_password_change_log is
  'ประวัติการเปลี่ยนรหัสผ่าน — ใช้จำกัด rate (3 ครั้ง/24 ชม.) + audit';
