---
name: session-tb-dashboard-2026-05-17-part2
description: "v0.7.6.2 session — Audit Log tab, Cancel Delete Request (popup+email+badge), CHECK constraint fix, RLS bypass via API route"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e58b3a2-1f96-401c-b4fe-8e7091d402a8
---

# TB Dashboard session 2026-05-17 (part 2) — v0.7.6.2

ต่อจาก v0.7.6.1 ที่ push ไปแล้ว

## สิ่งที่ทำ

### 1. แก้ "?" ในหน้า UI
- แก้ใน `lib/email-templates.ts` และ `public/tb-modals.jsx` รวม 4 จุด
- เกิดจาก emoji ใน string ที่ render ไม่ได้บนบาง browser

### 2. Audit Log Tab (ประวัติการลบถาวร)
- เพิ่ม `AuditLogTab` component ใน `public/tb-modals.jsx`
- ดึงข้อมูลจาก `tb_patients_deleted_log` + JOIN `admin:deleted_by(first_name, last_name)`
- แสดง: HN, ชื่อ, สูตรยา, ลบโดย, วันที่, เหตุผล
- เฉพาะ Admin — nav item `{ id:'audit-log', icon:'fa-clock-rotate-left', label:'ประวัติลบถาวร' }`
- ข้อมูลบันทึกอัตโนมัติด้วย DB trigger `trg_log_patient_hard_delete` (ทำไว้แล้ว ไม่ต้องแก้ backend)

### 3. ระบบยกเลิกคำขอลบ (Cancel Delete Request)
**Flow:**
- ใน `PharmSummaryTab` → badge "รออนุมัติการลบ" + ปุ่ม "ยกเลิกคำขอ"
- กดปุ่ม → popup confirmation สีส้ม (ยืนยันก่อน)
- ยืนยัน → เรียก `/api/patient/cancel-delete-request` (POST)
- API: ตรวจ session → UPDATE status='cancelled' ด้วย admin client (bypass RLS) → ส่งเมล Admin
- TrashList Admin: แสดง cancelled requests ในช่วง 7 วัน ด้วย style สีเทา + badge "ผู้ใช้ยกเลิกแล้ว"

**ไฟล์ที่เกี่ยวข้อง:**
- `public/tb-modals.jsx` — PharmSummaryTab, TrashList, ClinicalModal
- `public/tb-app.jsx` — state `cancelledDeleteCount`, fn `cancelDeletePatient`, adminAlerts, green badge nav
- `public/tb-data.js` — `window.loadCancelledDeleteCount()`, `window.cancelDeleteRequest()`
- `app/api/patient/cancel-delete-request/route.ts` — NEW API route
- `lib/email-templates.ts` — NEW `adminDeleteRequestCancelledEmail()`

### 4. Green Badge + Bell สำหรับ Admin
- `cancelledDeleteCount > 0` AND ไม่มี pending → ถังขยะแสดง green badge (pill สีเขียว `#16a34a`)
- Bell notification: "มี X คำขอลบที่ผู้ใช้ยกเลิกเองแล้ว — คลิกเพื่อดู" (type: 'info' = สีฟ้า)
- badge รูปแบบเดียวกับ red badge แต่เป็นสีเขียว

## บั๊กที่เจอและแก้

### CHECK constraint บน `tb_delete_requests.status`
- ปัญหา: constraint เดิมมีแค่ `('pending','approved','rejected')` — 'cancelled' ไม่ผ่าน
- แก้: พี่กันรัน SQL:
```sql
ALTER TABLE tb_delete_requests DROP CONSTRAINT tb_delete_requests_status_check;
ALTER TABLE tb_delete_requests ADD CONSTRAINT tb_delete_requests_status_check
  CHECK (status IN ('pending','approved','rejected','cancelled'));
```

### RLS blocking UPDATE จาก browser
- ปัญหา: `window._sb` (anon client) ถูก policy "delete_req update admin" block
- แก้: ย้าย cancel logic → server-side API route `cancel-delete-request/route.ts`
  ใช้ `createAdminClient()` bypass RLS ได้

## Version
- v0.7.6.1 → v0.7.6.2
- แก้ใน `public/tb-app.jsx` และ `app/login/page.tsx`

## Pending ยังไม่ได้ทำ
- Step 6: ทดสอบ pg_cron auto-purge
- Step 8: Bell notification ในแอปสำหรับ user (tb_notifications table)
- History การ reject (rejected_reason ถูก overwrite ตอน re-register)
- Future: แจ้ง user ผ่านในแอปเมื่อ Admin approve/reject delete request

**Why:** ระบบ cancel ช่วยให้ user แก้ mistake ได้เอง ลด workload Admin เพิ่ม transparency
**How to apply:** ทุก UPDATE ที่ไม่ใช่ Admin action ต้องผ่าน API route ที่ใช้ admin client เพราะ RLS block browser anon client
