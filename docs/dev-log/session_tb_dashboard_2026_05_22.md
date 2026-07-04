---
name: session-tb-dashboard-2026-05-22
description: 📌 session 2026-05-22 — v0.7.11.2 (Bug Audit ข้อ 12 + ระบบเหตุผล/audit ปิด-กู้คืนบัญชี + เมล + แท็บประวัติ) + v0.7.11.3 (ลบหน้า admin เก่า + แก้ลิงก์เมล + ข้อ 11 rate limit Cloudflare) — push ครบ 3 รอบ
metadata: 
  node_type: memory
  type: project
  originSessionId: 120cc71d-ee9e-42fa-b136-cbd53746ebe5
---

# 📌 TB Dashboard session 2026-05-22

push 3 รอบ: a91288d (v0.7.11.2) · 0776d72 (v0.7.11.3) · [v0.7.11.2 ก่อนหน้านี้คือ commit แรก]

## 🔍 รีวิว Bug Audit 12 ข้อ (เช็คจากโค้ดจริง — แก้ความเข้าใจผิด)
พี่กันงงว่าแก้ถึงไหน → เช็คโค้ดจริงพบว่าแก้ไปมากกว่าที่ memory จด:
- มี "ข้อ" 2 ชุดเลขชนกัน (Bug Audit 1-12 vs Master Pending 1-40) → ทำให้งง
- ✅ ข้อ 1,2,3,4 · 🟡 ข้อ 5 ครึ่งทาง (CSP ทำแล้ว, token→httpOnly **ข้ามไปก่อน** เสี่ยง iframe)
- ✅ ข้อ 6 (license `.in()`) · ✅ ข้อ 8 (บังคับเบอร์โทร) · ✅ ข้อ 11 (session นี้) · ✅ ข้อ 12 (session นี้)
- **เหลือจริง: ข้อ 7, 9, 10** (7=admin คนเดียวไม่เร่ง / 9=ผลน้อย / 10=ทำพร้อมเว็บช้าข้อ 40)

---

## ✅ v0.7.11.2 (commit a91288d) — Bug Audit ข้อ 12 + ระบบเหตุผล
**🧪 เทสผ่านแล้ว** (พี่กันยืนยัน 2026-05-22)

### 🐛 ข้อ 12 — restore-user guard
- กู้คืนได้เฉพาะบัญชี "ถูกปิดบัญชี" — เปลี่ยนป้ายแยกประเภท `rejected_reason==='ปิดบัญชีโดย Admin'` → ใช้ `deactivated_at` (UI isDeactivated 2 จุด + API)
- ปลดล็อกให้ rejected_reason เก็บเหตุผลจริงได้

### ✨ ระบบเหตุผล + Audit Trail
- ตารางใหม่ `tb_user_action_log` (scripts/add-user-action-log.sql) — user_id, action(deactivate/restore), reason(not null), performed_by, performed_at + RLS admin read + FK cascade — **รันบน Supabase production แล้ว**
- ปิดบัญชี: popup + ช่องเหตุผล (บังคับ) → เก็บใน rejected_reason + log
- กู้คืน: popup ยืนยันใหม่ + ช่องเหตุผล (บังคับ) + log
- เมล userDeactivatedEmail/userRestoredEmail เพิ่ม param reason + กล่องแสดงเหตุผล
- แท็บใหม่ "ประวัติเปิด-ปิดบัญชี" (ActionHistoryTable + window.loadUserActionLog) — เรียงเวลา: action·user·เหตุผล·admin·เวลา
- ตัด "ค่ะ" จากเมลกู้คืน + popup approve/reject

## ✅ v0.7.11.3 (commit 0776d72) — เก็บกวาด + ข้อ 11
**ยังไม่เทส** (push หลังสุด)

### 🗑️ ลบหน้า admin เก่า
- ลบ `app/admin/users/page.tsx` (475 บรรทัด) — หน้าจัดการผู้ใช้เวอร์ชันแรก (route /admin/users) ถูกแทนด้วย AdminUsersTab ฝังใน dashboard แล้ว, ไม่มีลิงก์ชี้มา, ใช้ browser alert (ผิดกฎ)
- ตรวจก่อนลบ: ไม่มี import/middleware/named export พึ่งพา — เจอจุดเดียว = ปุ่มในเมล adminNotifyEmail
- แก้ `lib/email-templates.ts` adminNotifyEmail: approveUrl `/admin/users` → `baseUrl` (หน้าแรก, badge แดงนำทางต่อ)

### 🚦 ข้อ 11 — Rate Limiting (Cloudflare ล้วน ไม่มีโค้ด)
- ตั้งใน Cloudflare > Security > Security rules > Rate limiting rules (UI ใหม่รวม WAF ใน Security rules)
- กฎ "กันบอทสมัครสมาชิก": URI Path eq /api/register, เกิน 5 req/10s ต่อ IP → Block 10s
- free plan: Rate limiting 1 rule (period+duration ล็อก 10s), Custom rules ฟรี 5, Managed ต้อง Pro
- active บน production แล้ว

## ✅ v0.7.11.4 (commit a5edffd) — Audit Log ขั้น 1-2 + สำเนาโปรไฟล์ทั้งใบ
**🧪 เทสผ่านแล้ว** (ขั้น 1, 2, สำเนาทั้งใบ)

- **ขั้น 1** กันประวัติหายตอนลบ: tb_user_action_log + snapshot ชื่อ + FK user_id → ON DELETE SET NULL (update-user-action-log-snapshot.sql) + ป้าย "ลบบัญชีแล้ว"
- **ขั้น 2** จดการลบ: เพิ่ม action 'delete' (add-delete-to-action-log.sql) + hard-delete-user รับเหตุผล + จด log ก่อนลบ + popup เหตุผล + **แท็บใหม่ "ประวัติการลบบัญชี" (แดง)** แยกจากปิด/กู้คืน
- **สำเนาโปรไฟล์ทั้งใบ** (profile_snapshot jsonb, add-profile-snapshot-to-action-log.sql): API target select('*') → เก็บทั้งก้อน → ประวัติแสดง วิชาชีพ/เลขใบ/รพ./หน่วยงาน/@username — **เพิ่ม field แสดงทีหลังไม่ต้องรัน SQL อีก** (ถอน username_at_action ที่เคยทำ เปลี่ยนเป็น snapshot)
- UX: "(แอดมิน)" ต่อท้ายผู้ทำ + loadActionLog(false) หลังทุก action (badge เรียลไทม์) + เกลาป้ายซ้ำ (ซ่อน "ลบบัญชีแล้ว" ในแท็บลบ)
- ไฟล์: 3 API (deactivate/restore/hard-delete) + tb-data.js (loadUserActionLog) + tb-modals.jsx (ActionHistoryTable + แท็บ + popup) + 3 SQL
- ⚠️ profession แปลง key→label ด้วย PROFESSION_LABELS_TH (window.TB_PROFESSION_LABELS)
- 🔢 SQL รันครบ 3 ไฟล์บน production แล้ว
- ดู [[tb-dashboard-audit-plan]] — เหลือขั้น 3,4,5

## ✅ v0.7.11.5 (commit c3eb1c7) — Audit ขั้น 3-4 + จัดระเบียบแท็บใหม่
- **จัดแท็บ 2 แถว**: แถว1 พิจารณาสมัคร (รออนุมัติ/อนุมัติแล้ว/ปฏิเสธ) · แถว2 จัดการผู้ใช้ (ผู้ใช้ทั้งหมด/ถูกปิดบัญชี/ประวัติ) — แก้ปัญหา "ถูกปิดบัญชีปนกับปฏิเสธ" โดยแยกด้วย deactivated_at (counts.rejected = ไม่มี deactivated_at, counts.deactivated = มี)
- **ขั้น 3** จดการอนุมัติ: action 'approve' (add-approve-to-action-log.sql) + approve API จด log + popup ยืนยัน (ไม่กรอกเหตุผล)
- **ขั้น 4** ยุบประวัติ 3 แท็บ → "ประวัติ" + sub-tab 4 อัน (renderTab helper + historyTab state) + ช่องค้นหา (historySearch + matchHist)
- sub-tab คำเต็ม: อนุมัติเข้าระบบ/ปฏิเสธคำขอสมัคร/ปิด-กู้คืนบัญชี/ลบบัญชีถาวร (กันสับสนกับแท็บสถานะ)
- ไฟล์: approve/route.ts + tb-modals.jsx + tb-app/login (version) + 1 SQL
- ⏳ เหลือขั้น 5 (UI 2 คอลัมน์) — กำลังทำ ดู [[tb-dashboard-audit-plan]]

## ✅ v0.7.11.6 (commit 5ea6aa9) — Audit ขั้น 5 + ขัดเกลา UX 🏆 ครบ 5/5 ขั้น
- **ขั้น 5** ActionPairTable: sub-tab "ปิด-กู้คืนบัญชี" แสดง 2 คอลัมน์ จับคู่ ปิด↔กู้คืน ต่อ user/รอบ (algorithm: group by user → sort เก่า→ใหม่ → จับ deactivate กับ restore ถัดมา)
- คอลัมน์กู้คืนแยก 3 สถานะ: กู้คืนแล้ว(ข้อมูล) / "ลบบัญชีแล้ว"(user.isDeleted) / "ยังไม่กู้คืน"(ค้าง)
- spinner fix: filter==='history' โหลด false (ข้อมูลโหลดตอน mount แล้ว)
- layout shift fix: scrollbarGutter:'stable' ที่ content div (tb-app.jsx 2401)
- เกลาหัวข้อ: "ระบบจัดการสมาชิกและบัญชีผู้ใช้ · เฉพาะ Admin"
- ช่องค้นหาประวัติ: placeholder + matchHist เหมือนช่องหลัก (เพิ่ม hospital_name + license_number)

## 📌 แพลนหน้า / ค้าง
- 🆕 **กันเดารหัสผ่านที่ login** (rate limit หน้า login เหมือน register) — พี่กันสนใจ ไว้แพลนหน้า → [[tb-dashboard-pending-master]]
- Bug Audit เหลือ ข้อ 7, 9, 10 (ไม่เร่งด่วน) + ข้อ 5 ครึ่งทาง
- ⚠️ v0.7.11.3 ยังไม่เทส (ลบหน้า + เมล) — แต่เป็น cleanup เสี่ยงต่ำ

ดู [[project_tb_dashboard_bugs_2026_05_18]] · [[tb-dashboard-pending-master]]
