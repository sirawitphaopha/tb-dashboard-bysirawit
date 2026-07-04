---
name: session-tb-dashboard-2026-05-30
description: 🎨 v0.7.13.5 — Popup animation modal-A กระจายทั้งเว็บ + Toast slide-up + setup เครื่องใหม่ User
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-30 — v0.7.13.5 Popup Animation มาตรฐานเดียวทั้งเว็บ

## 🆕 Setup เครื่องใหม่ User (ก่อนเริ่มงาน)

ย้ายจากเครื่องเก่า (PKH) มาเครื่องใหม่ (User):
- ✅ Git/Node/VS Code มีอยู่แล้ว
- ✅ Clone `tb-dashboard-bysirawit` ไป `D:\tb-dashboard-bysirawit`
  - หมายเหตุ: ชื่อ GitHub user คือ `sirawitphaopha` (ไม่มี i ตรงกลาง — เกือบจำผิด)
- ✅ `npm install` (126 packages)
- ✅ สร้าง `.env.local` ครบ (Supabase URL+keys, Resend, ADMIN_EMAIL)
- ✅ สร้าง Resend key ใหม่ `tb-dashboard2` (key เก่าเครื่อง PKH ใช้คู่กันได้ ไม่ชนกัน — domain lock = tbjourney.care, Permission = Sending access)
- ✅ Import memory ครบ 52 ไฟล์จาก zip → คลุม TB Calculator + TB Dashboard ทั้งหมด
- ✅ สร้าง `CLAUDE.md` ที่ root ของ tb-dashboard repo (ยังไม่ commit — แยกต่างหากจาก v0.7.13.5)

**บทเรียน:** Memory ระหว่างเครื่อง path ไม่เหมือนกัน (PKH vs User) — copy ไฟล์ใน folder `memory/` ไปวางที่ path ใหม่ตรงๆ ได้เลย

---

## 🎯 v0.7.13.5 — เป้าหมาย
ต่อยอด v0.7.13.4 (AboutModal มี animation A ฟีดแบ็กดี) → **กระจาย animation เดียวกันทั้งเว็บ** เพื่อ UX สม่ำเสมอ

## ✅ ที่ทำ

### Helper function ใหม่
`useModalAnim(onClose, {fast, duration})` วางใน tb-modals.jsx (โหลดก่อน tb-app.jsx → ทั้ง 2 ไฟล์ใช้ได้)
- return `{closing, close, modalCls, overlayCls}`
- `fast: true` → ใช้ `modal-A-out-fast` (0.25s) สำหรับ full-screen modal

### CSS ใหม่ใน app.html
- `.modal-A-out-fast` + `.modal-overlay-out-fast` (0.25s) — สำหรับปิดเร็ว
- `.modal-toast` + `.modal-toast-out` (slide-up เข้า 0.32s / fade-up ออก 0.28s)

### Popup ที่ใส่ modal-A (เด้งสม่ำเสมอ)
**ใช้ helper เต็ม pattern (เปิด+ปิด animation):**
- NotificationFullModal, UserProfileModal (loading + main), ConfirmModal, RequestEditModal
- ClinicalModal **(พิเศษ — เปิดมี A แต่ปิดทันที** เพราะเป็น full-screen ปิดช้ารู้สึกหน่วง — คุณกันสั่งเอง)

**Inline state-based ใส่ class modal-A อย่างเดียว (entrance only):**
- 14 confirm dialogs ในแท็บ ลบ/ขอลบ/admin actions
- Easter Egg popup, Warn Close, Sign Out Other Devices, Leave Page, SputumDelayed

### Toast แยก animation
- ToastModal เปลี่ยน `tb-fade` → `modal-toast` (slide-up จากล่าง)
- ปิดเอง: setClosing → setTimeout(onClose, 280) → modal-toast-out

### เว้นไม่แตะ (คนละ pattern)
- NotificationPanel (dropdown กระดิ่ง — มี notif-modal expand แล้ว)
- ColumnManager / DrugInteractionPanel (inline ไม่ใช่ popup)
- DirtyToast banner, Avatar coming-soon badge (inline status)

## 🐛 Issue ระหว่างเทส
- **ClinicalModal ปิดช้า 0.6s** → ลดเหลือ 0.25s (modal-A-out-fast) → ยังช้า → **ปิดทันทีไม่มี animation เลย** (คุณกันสั่ง)
  - **Pattern ที่ใช้:** `const modalCls = 'modal-A'; const close = onClose;` — เปิดมี animation, ปิดดิบ
  - **บทเรียน:** full-screen modal ใส่ exit animation ไม่เวิร์ก — UX expect "back" = ทันที

## 📦 Push
- commit `22fc0d9`
- ไฟล์: app/login/page.tsx, public/app.html, public/tb-app.jsx, public/tb-modals.jsx
- 4 files / +99 / -48

## 📝 Version
- APP_VERSION: 0.7.13.4 → 0.7.13.5
- BUILD_DATE: 29 พ.ค. 2569 → 30 พ.ค. 2569
- login/page.tsx: Version 0.7.13.4 → 0.7.13.5

## 🚧 ค้างไว้
- CLAUDE.md untracked — สร้างไว้แต่ยังไม่ commit (อาจรวมกับ commit อื่นในอนาคต)
- Epic audit/log ข้อ 4 (Sensitive Action Log — PDPA) ยังไม่ได้เริ่ม
- Bug Audit ข้อ 7 (race condition reject) + ข้อ 10 (middleware cache) ยังค้าง

ดู [[session-tb-dashboard-2026-05-29]] · [[tb-dashboard-pending-master]]
