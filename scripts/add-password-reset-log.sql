-- ═════════════════════════════════════════════════════════════════════════
-- tb_password_reset_log
-- ─────────────────────────────────────────────────────────────────────────
-- เก็บประวัติคำขอรีเซ็ตรหัสผ่าน (ลืมรหัสผ่าน) ทุกครั้ง
-- ใช้สำหรับ:
--   1. Rate limit 3 ครั้ง/ชั่วโมง ต่ออีเมล (กันสแปม / กันใช้ระบบเป็นเครื่องมือยิงเมล)
--   2. Audit log — ตรวจย้อนได้ว่าใครขอเมื่อไหร่ จาก IP ไหน เมลส่งสำเร็จไหม
--
-- หมายเหตุ: เก็บ "email_attempted" เป็น text ไม่ใช่ FK
-- เพราะถ้าอีเมลไม่อยู่ในระบบเราก็ยังต้องเก็บ log (ดูได้ว่าใครพยายามยิงเมลคนอื่น)
-- ═════════════════════════════════════════════════════════════════════════

create table if not exists public.tb_password_reset_log (
  id                uuid        primary key default gen_random_uuid(),
  email_attempted   text        not null,        -- อีเมลที่ใช้ขอรีเซ็ต (อาจอยู่หรือไม่อยู่ใน DB)
  user_id           uuid        references auth.users(id) on delete set null,  -- null = ไม่เจอ user
  requested_at      timestamptz not null default now(),
  ip_address        text,
  user_agent        text,
  email_sent        boolean     not null default false,  -- ส่งเมลสำเร็จไหม
  error_message     text                                  -- ถ้าส่งล้มเหลว
);

-- index สำหรับ rate limit query "count by email + 1h window"
create index if not exists idx_pw_reset_log_email_time
  on public.tb_password_reset_log(email_attempted, requested_at desc);

create index if not exists idx_pw_reset_log_user_time
  on public.tb_password_reset_log(user_id, requested_at desc);

-- RLS: บล็อกทุก client — เข้าได้เฉพาะ service_role
alter table public.tb_password_reset_log enable row level security;

drop policy if exists "no client access" on public.tb_password_reset_log;
create policy "no client access" on public.tb_password_reset_log
  for all
  using (false)
  with check (false);

comment on table public.tb_password_reset_log is
  'ประวัติคำขอรีเซ็ตรหัสผ่าน — rate limit 3/ชม. + audit';
