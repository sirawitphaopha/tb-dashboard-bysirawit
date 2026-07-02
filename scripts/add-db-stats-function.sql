-- ════════════════════════════════════════════════════════════════════════
-- 📊 ฟังก์ชันสรุปขนาดฐานข้อมูล (แยก พื้นที่ระบบ vs ข้อมูลจริง) — แถบพื้นที่แอดมิน
-- สร้าง/รัน 2026-07-02 (ผ่าน Supabase MCP)
-- ════════════════════════════════════════════════════════════════════════
-- total       = pg_database_size ทั้งก้อน (รวมตารางระบบ Postgres + extension)
-- user_tables = ผลรวมขนาดตาราง public ของเราจริงๆ
-- พื้นที่ระบบ = total - user_tables (มีมาแต่แรก ลบไม่ได้)

create or replace function public.get_db_stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'total', pg_database_size(current_database()),
    'user_tables', coalesce((
      select sum(pg_total_relation_size(relid))
      from pg_catalog.pg_statio_user_tables
      where schemaname = 'public'
    ), 0)
  );
$$;

grant execute on function public.get_db_stats() to service_role;
