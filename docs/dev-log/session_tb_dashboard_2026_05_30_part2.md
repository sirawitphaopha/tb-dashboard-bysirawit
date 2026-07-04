---
name: session-tb-dashboard-2026-05-30-part2
description: 📜 v0.7.14.0 — หน้าประวัติเวอร์ชั่น (Changelog Page) Mini Wiki ในเว็บ + ปรับเป็น tab page เหมือนแท็บอื่น
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-30 (part 2) — v0.7.14.0 Changelog Page

## 🎯 เป้าหมาย
สร้างหน้า Changelog เก็บประวัติทุก minor version (v0.5.0 → v0.7.14.0)
เป็น mini-wiki ในเว็บ สำหรับเจ้าของระบบไว้ดูความคืบหน้า ไม่ทำ auto-popup ตอน login (เก็บไว้ v1.0)

## ✅ ที่ทำ

### ไฟล์ใหม่: `public/tb-changelog.js`
- Data source แยกออกจาก tb-app.jsx (ข้อมูลยาว แก้บ่อย)
- โหลดเป็น global window.TB_CHANGELOG + window.TB_TAGS
- โหลดก่อน tb-app.jsx ใน app.html (ลำดับ: data.js → changelog.js → modals.jsx → app.jsx)

### Schema (สำคัญสำหรับครั้งหน้า)
```js
window.TB_CHANGELOG = [{
  major: '0.7', era: '...', icon: '⚡', color: '#0f766e', period: '...', description: '...',
  versions: [{
    version: '0.7.14.0', date: '30 พ.ค. 2569', commit: '985b2de',
    title: '...', changes: [{ tag: 'feature', text: '...' }]
  }]
}]
window.TB_TAGS — 7 ประเภท: feature/ui/bug/security/backend/remove/text
```

### Component ใหม่: ChangelogPage (~270 บรรทัด ใน tb-app.jsx)
- เป็น **tab page** ไม่ใช่ modal (render ภายใต้ main content area)
- ใช้ pattern เดียวกับ AdminUsersTab: `<div className="space-y-4 tb-fade">` + banner gradient teal card
- 3 ส่วน: Banner (มี toggle view ใน banner) + Filter card + Body
- 2 view modes:
  - Timeline: เรียงใหม่→เก่า เป็น vertical timeline
  - Grouped: 3-level collapse (Major → Minor groups → Patches)
- Group L2 อัตโนมัติจาก parts[0..3] ของ version (เช่น 0.7.13.5 → group 0.7.13)
- Filter: search (debounce 300ms) + 7 tag chips + ล้างค่า

### Entry points (2 ทาง)
1. **Sidebar menu** ใหม่ "ประวัติเวอร์ชั่น" icon `fa-scroll` (ไม่ชนกับ "ประวัติลบถาวร" fa-clock-rotate-left)
   - มี divider คั่นจากกลุ่ม admin tabs
   - **user ทุกคนเห็น** (ไม่ใช่ admin-only)
2. **AboutModal** — ลิงก์ "ดูประวัติเวอร์ชัน" ใต้ Build date

### ข้อมูลเริ่มต้น (47 entries)
- v0.5.0 (Genesis, 1 entry)
- v0.6.x (First Real Build, 3 entries)
- v0.7.x (Auth + Audit Era, 43 entries: 0.7.0 → 0.7.14.0)

ทุก entry สรุปเป็นภาษาคน + คงศัพท์ทางการที่จำเป็น

## 🐛 Feedback ระหว่างเทส

**รอบ 1** (เปิดเป็น full-screen modal มี "กลับ"):
- ✅ สวยมาก
- ❌ แบนเนอร์ติดขอบบน → ขอเว้น space เหมือนแท็บอื่น
- ❌ "แยกตามรุ่น" → "แยกตามเวอร์ชั่น"
- ❌ ขอ 3 ระดับ: 0.5/6/7 → 0.7.1-13 → 0.7.13.1-5

**รอบ 2** (หลัง user feedback ครั้ง 2):
- ❌ ไม่เอาปุ่ม "กลับ" — ขอกดเมนูซ้ายเปลี่ยนหน้าได้ (เป็น tab จริงๆ)
- ❌ แบนเนอร์ขอเหมือนแท็บอื่นเป๊ะ (จัดการผู้ใช้)
- ❌ ทุก user เห็นได้ (ไม่ admin-only)
- ❌ เมนู sidebar ขอใหญ่เท่าแท็บอื่น + icon ไม่ใช่นาฬิกา (ซ้ำ ประวัติลบถาวร)

→ แก้ทั้งหมดในรอบ 2: ปรับเป็น tab page เต็มตัว ใช้ pattern AdminUsersTab + icon fa-scroll

## 📦 Push
- commit `985b2de`
- 4 files / +1040 / -10
- ไฟล์: app/login/page.tsx, public/app.html, public/tb-app.jsx, public/tb-changelog.js (ใหม่)

## 📝 Version
- APP_VERSION: 0.7.13.5 → 0.7.14.0 (bump minor — ฟีเจอร์ใหม่ขนาดใหญ่)
- BUILD_DATE: 30 พ.ค. 2569 (วันเดียวกับ 0.7.13.5)
- login footer: Version 0.7.14.0

## 💡 Decision log

- **Data hard-code ใน JS** — แก้ง่าย โหลดเร็ว track ใน git
- **เป็น tab ไม่ใช่ modal** — UX สม่ำเสมอ กดเมนูซ้ายเปลี่ยนหน้าได้
- **Banner ใช้ Tailwind class เดียวกับ AdminUsersTab** — `bg-gradient-to-r from-teal-700 to-teal-600 rounded-2xl p-5`
- **Group L2 อัตโนมัติ** — ไม่ต้องระบุกลุ่มในข้อมูล (parts[0..3] ของ version)
- **ไม่ทำ localStorage last-seen marker** — เก็บไว้ตอน v1.0 (auto-popup เด้งหลัง user update)
- **ไม่ขึ้น v0.8** — เก็บไว้สำหรับ milestone ใหญ่กว่า (จบ Epic audit/log + Bug Audit ครบ)

## 🚧 Pending Master ที่เคลียร์ไป
- ✅ ข้อ 30 — Changelog Popup (เพิ่ม 2026-05-29) → เสร็จเป็น Changelog Page (ไม่ใช่ popup)

## 🚧 ต่อไป — แผนใหญ่
- ⏳ Epic audit/log ขั้น 4: Sensitive Action Log (PDPA) — ยังไม่เริ่ม
- ⏳ Bug Audit ข้อ 7 (race condition reject) + ข้อ 10 (middleware cache)
- 📌 ถ้าครบทั้งหมดข้างบน → bump v0.8 ปิด Audit Era

## 🔁 วิธีเพิ่ม entry ใหม่ใน tb-changelog.js (สำหรับครั้งหน้า)

1. หลัง push version ใหม่ (เช่น v0.7.15.0) → เปิด public/tb-changelog.js
2. ใน major.versions[] ที่ตรงรุ่น → push entry ใหม่ไว้ "บนสุด" (เรียงใหม่→เก่า)
3. ฟิลด์: version, date (พ.ศ.), commit (sha สั้น 7 ตัว), title, changes[]
4. tag ต้องเลือกจาก 7 ประเภทใน window.TB_TAGS
5. ถ้าเปิดรุ่นใหม่ (v0.8) → เพิ่ม major block ใหม่ "บนสุด" ของ TB_CHANGELOG[]

ดู [[session-tb-dashboard-2026-05-30]] · [[tb-dashboard-pending-master]]
