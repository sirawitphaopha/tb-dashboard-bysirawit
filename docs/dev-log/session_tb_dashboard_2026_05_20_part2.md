---
name: session-tb-dashboard-2026-05-20-part2
description: "Session 2026-05-20 part 2 — Admin Edit User + Profile Edit Log + วิเคราะห์ RequestEditModal (TODO) — v0.7.10"
metadata:
  node_type: memory
  type: project
  originSessionId: 4c32d047-50a1-47bd-afc4-50172419a488
---

# TB Dashboard session 2026-05-20 (part 2)

**version:** v0.7.9.7 → v0.7.10
**commit:** 6ec65b5

---

## สิ่งที่ทำในวันนี้

### ฟีเจอร์ Admin แก้ไขข้อมูล User

**ไฟล์ใหม่:**
- `app/api/admin/edit-user/route.ts` — API POST รับ userId + fields ที่แก้
  - เช็ค admin ก่อน
  - ดึง snapshot ก่อนแก้
  - เปรียบเทียบ changes field-by-field
  - Update profiles
  - Insert log ลง tb_profile_edit_log

**ไฟล์แก้:**
- `public/tb-modals.jsx` — AdminUsersTab:
  - เพิ่ม state: editingUser, editForm, editBusy, editError
  - เพิ่มฟังก์ชัน openEdit / closeEdit / submitEdit
  - ปุ่ม "แก้ไข" สีเขียวเข้มทุก card (list + card view) ทุกสถานะ
  - Edit modal: ชื่อ/นามสกุล, ชื่อรพ., ประเภทรพ., แผนก, วิชาชีพ, เลขใบ
  - อัปเดต PROFESSION_LABELS_TH ครบ (nurse1/nurse2/publichealthofficer/publichealthtech)
  - เพิ่ม HOSPITAL_TYPES_LIST และ DEPARTMENTS_LIST

**SQL รันที่ Supabase (รันแล้ว):**
```sql
create table tb_profile_edit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  edited_by     uuid references profiles(id),
  edited_at     timestamptz default now(),
  changes       jsonb not null,
  snapshot_before jsonb not null
);
alter table tb_profile_edit_log enable row level security;
create policy "admin only" on tb_profile_edit_log
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
```

---

## วิเคราะห์ RequestEditModal (รูปที่พี่กันส่งมา)

popup "ส่งคำขอแก้ไขข้อมูล" ใน `public/tb-app.jsx` บรรทัด 2442–2452

**สถานะตอนนี้: ยังไม่ทำงานจริง**
- กดส่งแล้ว → แค่ `alert()` หลอก
- ไม่ได้บันทึก request ลง DB
- ไม่ได้ส่งเมลหา admin
- ไม่ได้ส่งเมลยืนยันหา user

**งานที่ต้องทำต่อ:**
1. สร้าง table `tb_profile_edit_requests` เก็บ request ที่ user ส่งมา
2. API `/api/profile/request-edit` — บันทึก request + ส่งเมลแจ้ง admin
3. Admin เห็น pending requests ในหน้าจัดการผู้ใช้
4. เมื่อ admin แก้ไขเสร็จ → ส่งเมลแจ้ง user

---

## ค้างต่อ
- ระบบ RequestEditModal ทั้ง 4 ข้อข้างบน
- Bug Audit ข้อ 9-12 ยังไม่ได้เริ่ม
- Bug ข้อ 2, 3-4: deploy แล้ว รอทดสอบจริง
