-- ═════════════════════════════════════════════════════════════════════════
-- tb_activity_log (VIEW)
-- ─────────────────────────────────────────────────────────────────────────
-- "สมุดรวมเล่มเดียว" — รวม log ทุกตารางเป็น timeline เดียว เรียงตามเวลา
-- ใช้ในหน้า "บันทึกกิจกรรม" (admin) — ดูว่าใครเข้า/ออก/เปลี่ยนรหัส/เจอ easter egg
--
-- รวม 5 ตาราง (ไม่รวม tb_session_log เพราะซ้ำกับ login/logout):
--   tb_login_log · tb_logout_log · tb_password_change_log
--   tb_password_reset_log · tb_easter_egg_log
--
-- คอลัมน์มาตรฐาน:
--   event_time · user_id · email · category · event_key · success · detail
--   · ip_address · user_agent · device_type · session_id
--
-- device_type — แยกจาก user_agent ด้วย regex (สำหรับใช้กรองตามชนิดอุปกรณ์)
--   desktop / mobile / tablet / unknown
--
-- 🛡 security_invoker = on → view ใช้สิทธิ์ของผู้เรียก
--    client (anon/authenticated) โดน RLS using(false) ของตารางต้นทางบล็อก
--    เข้าถึงได้เฉพาะ service_role (ผ่าน API /api/admin/activity-log)
-- ═════════════════════════════════════════════════════════════════════════

-- ลบ view เก่าก่อน (จำเป็นเพราะมีการเพิ่ม/สลับคอลัมน์ — create or replace ทำไม่ได้)
-- ลบ view ไม่กระทบข้อมูลในตารางจริง
drop view if exists public.tb_activity_log;

create view public.tb_activity_log
with (security_invoker = on) as
select
  base.*,
  case
    when base.user_agent is null or base.user_agent = ''            then 'unknown'
    when base.user_agent ~* 'iPad|Tablet'                          then 'tablet'
    when base.user_agent ~* 'Android' and base.user_agent !~* 'Mobile' then 'tablet'
    when base.user_agent ~* 'Mobile|iPhone|iPod|Android'           then 'mobile'
    else 'desktop'
  end as device_type
from (

  -- 1) เข้าสู่ระบบ
  select
    ll.attempted_at                                              as event_time,
    ll.user_id                                                   as user_id,
    ll.email_attempted                                           as email,
    'login'::text                                                as category,
    case when ll.success then 'login_success' else 'login_failed' end as event_key,
    ll.success                                                   as success,
    ll.failure_reason                                            as detail,
    ll.ip_address                                                as ip_address,
    ll.user_agent                                                as user_agent,
    ll.session_id                                                as session_id,
    ll.device_fp                                                 as device_fp
  from public.tb_login_log ll

  union all

  -- 2) ออกจากระบบ
  select
    lo.logged_out_at,
    lo.user_id,
    lo.email,
    'logout',
    'logout_' || lo.logout_type,
    null::boolean,
    lo.logout_type,
    lo.ip_address,
    lo.user_agent,
    lo.session_id,
    lo.device_fp
  from public.tb_logout_log lo

  union all

  -- 3) เปลี่ยน / ตั้งรหัสผ่านใหม่
  select
    pc.changed_at,
    pc.user_id,
    pc.email_attempted,
    'password',
    'password_' || pc.action || case when pc.success then '_success' else '_failed' end,
    pc.success,
    coalesce(pc.failure_reason, pc.action),
    pc.ip_address,
    pc.user_agent,
    null::uuid,
    null::text
  from public.tb_password_change_log pc

  union all

  -- 4) ขอลิงก์ลืมรหัสผ่าน
  select
    pr.requested_at,
    pr.user_id,
    pr.email_attempted,
    'password',
    'password_reset_request',
    pr.email_sent,
    case when pr.email_sent then 'sent' else coalesce(pr.error_message, 'failed') end,
    pr.ip_address,
    pr.user_agent,
    null::uuid,
    null::text
  from public.tb_password_reset_log pr

  union all

  -- 5) easter egg 🥚
  select
    ee.occurred_at,
    ee.user_id,
    ee.email,
    'easter',
    'easter_' || ee.event_type,
    null::boolean,
    ee.event_type,
    ee.ip_address,
    ee.user_agent,
    null::uuid,
    null::text
  from public.tb_easter_egg_log ee

) base;

-- จำกัดสิทธิ์: เฉพาะ service_role อ่านได้ (defense in depth คู่กับ security_invoker)
revoke all on public.tb_activity_log from anon, authenticated;
grant select on public.tb_activity_log to service_role;

comment on view public.tb_activity_log is
  'Timeline รวม log ทุกตาราง (เข้า/ออก/รหัสผ่าน/easter) + device_type — ใช้ในหน้าบันทึกกิจกรรม admin';
