---
name: session-tb-dashboard-2026-05-17-part3
description: "v0.7.6.3 → v0.7.7.2 — Bell user notifications, custom popups, badge persist, click-outside, realtime subscriptions, bug fixes"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e58b3a2-1f96-401c-b4fe-8e7091d402a8
---

# TB Dashboard session 2026-05-17 (part 3) — v0.7.6.3 → v0.7.7.2

ต่อจาก part 2 (v0.7.6.2 ที่ push แล้ว)

## งานที่ทำในรอบนี้

### v0.7.6.3 — Bell User Notifications
- สร้าง table `tb_notifications` (id, user_id, type, patient_name, patient_id, note, is_read, created_at)
- RLS: SELECT/UPDATE เฉพาะ owner, INSERT ผ่าน service role
- `delete-notify/route.ts` insert notification หลังส่งเมล
- `tb-data.js`: เพิ่ม `loadUserNotifications`, `markUserNotificationRead`
- `tb-app.jsx`: state `userDbNotifs`, merge เป็น `userNotifAlerts`, override markRead persist ลง DB
- กดที่ reject/restored notification → เปิด clinical modal ผู้ป่วยคนนั้น

### v0.7.6.4 — Custom Popups + Badge persist
- Approve popup สีแดง แทน `window.confirm` ห่วยๆ
- Restore popup สีเขียวทีล + inline error แทน `alert()`
- `acknowledged_at` column ใน `tb_delete_requests` → กด "รับทราบทั้งหมด" persist ลง DB
- Bell panel ปิดเอง: click-outside + nav change

### v0.7.7 — Pushed (commit 343482d)
- รวม v0.7.6.3 + v0.7.6.4 + ปรับ restored ให้ navigate ไปผู้ป่วย

### v0.7.7.1 — Bug fixes (commit 808e385)
- `cancelDeletePatient` เรียก `loadMyPendingDeleteRequests` (เดิมเรียก admin function → RLS block user)
- `restorePatient` UPDATE `tb_delete_requests` status `pending` → `restored`
- `loadMyPendingDeleteRequests` filter เฉพาะ `status='pending'` (เดิมรวม approved ทำให้ badge ค้าง)
- cancel API เพิ่ม `.select('id')` + 404 ถ้าไม่เจอ pending row

### v0.7.7.2 — Realtime subscriptions (commit e7be30b)
- 4 channels ใน tb-app.jsx — ไม่ต้อง refresh แล้ว
- `tb_delete_requests` (admin), `tb_notifications` (user), `tb_patients` (ทุกคน), `profiles` (admin)

## SQL ที่รันแล้ว

```sql
-- tb_notifications table + RLS
CREATE TABLE tb_notifications (...);
CREATE POLICY "own notifications select"/"own notifications update" ...;

-- acknowledged_at column
ALTER TABLE tb_delete_requests ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

-- restored ใน CHECK constraint
ALTER TABLE tb_delete_requests DROP CONSTRAINT tb_delete_requests_status_check;
ALTER TABLE tb_delete_requests ADD CONSTRAINT tb_delete_requests_status_check
  CHECK (status IN ('pending','approved','rejected','cancelled','restored'));

-- Data fix: approved orphans → restored
UPDATE tb_delete_requests dr SET status = 'restored'
WHERE dr.status = 'approved'
  AND EXISTS (SELECT 1 FROM tb_patients p WHERE p.id = dr.patient_id AND p.deleted_at IS NULL);

-- Realtime enable
ALTER PUBLICATION supabase_realtime ADD TABLE tb_delete_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tb_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tb_patients;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

## Step 6 ทดสอบเสร็จแล้ว
- pg_cron job `purge_trash_60d` มีจริง
- สร้าง test patient deleted_at = 61 วันที่แล้ว → รัน DELETE manual → ลบจริง ✅

## Pending (รอทำต่อพรุ่งนี้)
- **ข้อ 32 — History reject** (สิ่งที่ตกลงจะทำพรุ่งนี้):
  1. สร้าง table `tb_user_reject_log` (id, user_id, rejected_by, rejected_reason, rejected_at)
  2. แก้ API reject ให้ INSERT row แทน overwrite `rejected_reason`
  3. UI ใน AdminUsersTab แสดงประวัติ reject ทั้งหมดของ user
  - รอ confirm: ปุ่มเปิด popup / collapsible section ใต้ user card / แบบอื่น
- Admin notification เมื่อ user re-register หลังถูก reject

## Pending อื่นๆ (จาก master list)
- ข้อ 24: เทส approve/reject flow ครบวงจรด้วยเมลจริง (รอ verify DNS Resend)
- ข้อ 13: ระบบเปลี่ยนรหัสผ่านจริง
- ข้อ 14: ปุ่ม "ส่งคำขอแก้ไข" ใน Profile
- ข้อ 15: Session Timeout 12 ชม.
- ข้อ 25, 26: AI features (เรือธง)

**Why:** Realtime ทำให้ webapp รู้สึก "เป็นมืออาชีพ" — ไม่ต้องสอน user ว่าต้องกด refresh
**How to apply:** ทุกตารางที่ admin/user ต้องเห็นการเปลี่ยนแปลงสด → enable realtime + subscribe ใน tb-app.jsx
