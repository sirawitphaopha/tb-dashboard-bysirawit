---
name: supabase-rls
description: "🚨 จุดสำคัญ — โปรเจกต์ Supabase ใหม่ต้องเช็ค RLS + ลบ policy \"allow all\" ก่อนใช้งานจริง ไม่งั้นข้อมูลทุกอย่างเปิดให้ใครก็ลบได้"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

# 🚨 บทเรียนสำคัญ — Supabase RLS Audit (2026-05-15)

ค้นพบว่า **ทั้งสอง project ของพี่กัน** (TB Calc + TB Dashboard) ปล่อยข้อมูลให้ใครก็ลบ/แก้ได้ทั้งฐาน เพราะ:

1. **RLS เปิดอยู่แล้ว** ✅ (Supabase default)
2. **แต่มี policy ชื่อ `allow all`** (COMMAND=ALL, APPLIED TO=public) ที่ทำให้ทุกคนเข้าได้
3. policy ใหม่ที่แคลร์สร้าง = ไม่มีผล เพราะ Postgres RLS ใช้ OR logic — มีป้ายเดียวบอก "ผ่าน" = ผ่าน

# กฎเหล็กสำหรับโปรเจกต์ Supabase ทุกตัว

## 1. เช็คทุก project ก่อน deploy production
- ไปที่ **Authentication → Policies**
- เช็คทุก table: มี policy ชื่อ "allow all" หรือ "enable read access for all users" หรือ APPLIED TO = `public` ไหม
- ถ้ามี → ลบทิ้งทันที (ใช้จุดสามจุด ⋮ → Delete)

## 2. policy ที่ปลอดภัย ควรกำหนดให้ชัดเจน
- ❌ APPLIED TO = `public` (= ทุกคนรวม anon)
- ✅ APPLIED TO = `anon` (= คนยังไม่ login) — สำหรับ table ที่ต้อง track โดยไม่ login เช่น analytics
- ✅ APPLIED TO = `authenticated` (= login แล้ว) — สำหรับ table ข้อมูลคนไข้/sensitive

## 3. หลีกเลี่ยง command "ALL"
- ❌ `for all` (= SELECT/INSERT/UPDATE/DELETE ทั้งหมด)
- ✅ แยกเป็นแต่ละ command: `for select` / `for insert` / `for update` / `for delete`
- โดยเฉพาะ DELETE — ควรจำกัดเฉพาะ admin หรือไม่เปิดเลย

# วิธีเช็คความปลอดภัย (Audit)

## วิธีที่ 1 — เช็คด้วยตา (แนะนำสำหรับคนทั่วไป)
1. Supabase Dashboard → Authentication → Policies
2. ดูทุก table ที่ใช้งาน
3. ดูคอลัมน์ APPLIED TO: ห้ามมี `public` (ถ้ามีต้องลบ)
4. ดูคอลัมน์ COMMAND: ระวัง `ALL` (ถ้าเปิดให้ public)

## วิธีที่ 2 — Script test อัตโนมัติ
ไฟล์ `scripts/check-rls.mjs` ใน `C:\Users\PKH\tb-dashboard-bysirawit\`
- รัน: `node scripts/check-rls.mjs`
- ทดสอบ READ / INSERT / DELETE ด้วย anon key
- ⚠️  ข้อจำกัด: DELETE test ของ script ปัจจุบันยังไม่แม่นยำ 100% ถ้า column id เป็น text type — ใช้เป็น indicator คร่าวๆ ได้

## วิธีที่ 3 — SQL ตรวจ policies ทั้งหมด
```sql
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

# Policy ที่ใช้จริงตอนนี้

## TB Calculator (analytics) — `ryewggkhunpuipgkgbfv`
- **visits**: anon INSERT, anon SELECT (count), anon UPDATE
- **calculations**: anon INSERT only
- **fdc_reverse**: anon INSERT only
- **events**: anon INSERT only
- 🔒 ไม่มีใคร DELETE ได้

## TB Dashboard (patients) — `cioswzdbonnbhbyynrhh`
- **tb_patients**: authenticated SELECT/INSERT/UPDATE/DELETE (ทุก action ต้อง login)
- 🔒 anon ทำอะไรไม่ได้เลย

# SQL ไฟล์ที่ใช้แก้ (เก็บไว้)
- `C:\Users\PKH\tb-dashboard-bysirawit\scripts\fix-rls-tbcalc.sql`
- `C:\Users\PKH\tb-dashboard-bysirawit\scripts\fix-rls-tbdashboard.sql`

# Future Work — ทำให้ปลอดภัยขึ้นอีก
- แยก policy DELETE สำหรับ tb_patients → เฉพาะ admin (เช็ค role จาก profiles table)
- จำกัด SELECT tb_patients → เฉพาะ user ที่อยู่โรงพยาบาลเดียวกัน
- สร้าง audit log ทุก DELETE/UPDATE

ดูเพิ่ม: [[knowledge_env_local]] · [[feedback_gitignore_first]]
