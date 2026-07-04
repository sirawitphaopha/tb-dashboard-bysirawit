---
name: TB Dashboard session 2026-05-11
description: session วันที่ 11 พ.ค. 2026 — Full App Build, first real commit, v0.6.0
type: project
originSessionId: b0a2e4d4-f3c7-46d3-be82-61472dfac2e2
---
**วันที่:** 2026-05-11
**Commit:** `616d20f` — v0.6.0 · TB-CARE LINK — Full App Build (First Real Commit)
**Push:** GitHub `sirawitphaopha/tb-dashboard-bysirawit` main branch

## สิ่งที่ทำใน session นี้

### Dashboard
- KPI cards คลิกได้ → filter PatientList
- Bar chart: toggle รายเดือน/รายปี + year selector + คลิก filter
- Pie chart: doughnut → pie, เพิ่ม MDR-TB slice, คลิก filter
- Critical cases section

### Notification Bell (กระดิ่ง)
- `useNotifHelpers` hook สร้าง alert อัตโนมัติจากข้อมูลผู้ป่วย
- `NotificationPanel` dropdown + unread badge
- `NotificationFullModal` modal เต็มจอ filter/mark read

### ลงทะเบียนผู้ป่วยใหม่
- `AddPatientPage` ฟอร์มเต็ม, navigate ผ่าน nav='add-patient'
- checkbox โรคร่วมใช้ {name, abbr}, dropdown สูตรยาจาก settings

### Settings (AdminSettings)
- Tab โรคร่วม: form รับ {name, abbr}
- Tab เหตุผลเริ่มยาใหม่ (ใหม่ — สีส้ม): admin สร้าง/ลบเองได้
- Tab สูตรยา: เปลี่ยนจาก read-only → editable

### Patient List — Column Redesign
- 8 คอลัม: อายุ/เพศ/ตำบล, ชนิดTB/สูตรยา, ความคืบหน้า, น้ำหนัก, วันเริ่ม, วันนัด, โรคร่วม, สถานะ
- ลบคอลัม Adherence ออก
- Column manager: toggle + เลื่อนซ้าย/ขวา + reset → localStorage
- เคส critical: border-l-4 แดงซ้ายแถว, HN sticky left

### Header Bar
- controls (search, filter, column mgr, ลงทะเบียน) ย้ายเข้า header เมื่ออยู่หน้า patient-list
- Page title: icon + สี teal-700 (Option A)
- State lifted: ptSearch, ptFilter, ptShowColMgr → App level

### Scrollbar Fix
- flex column + h-full + overflow-hidden + flex-1 min-h-0
- scrollbar ลอยติดขอบล่าง browser เสมอ

### Data Model (tb-data.js)
- `DEFAULT_COMORBIDITIES`: string[] → {name,abbr}[] 19 รายการ
- `DEFAULT_RESTART_REASONS`: 8 เหตุผล

### Row Height
- `p-4` → `py-2 px-4` ทุก th/td

### Version
- v0.5.0 → v0.6.0 (2 ที่ใน tb-app.jsx)

## สถานะ
- Push แล้ว ✓
- Netlify deploy อัตโนมัติ

## สิ่งที่ยังไม่ได้ทำ (Pending)

1. **Login — auth จริง** — UI ทำแล้ว แต่ยังไม่ได้ต่อ auth จริง (hardcode อยู่)
2. **Supabase connection test** — ยังไม่ได้ทดสอบเพิ่มผู้ป่วยจริงแล้ว refresh ดู
3. **Column config sync via Supabase** — deferred ไว้ ตอนนี้ใช้ localStorage อย่างเดียว
4. **ปุ่ม "พิมพ์ใบจัดยา"** — กดแล้วแค่เปลี่ยนข้อความปุ่ม ยังไม่มี window.print() จริง
5. **Export Excel / PDF** — กดแล้วขึ้น "ส่งออกแล้ว!" แต่ไม่ได้ export ไฟล์จริง (Export CSV ของ DRP/Consult/Diagnosis ทำงานได้ปกติ)
6. **Tab ประวัติสูตร** — dropdown ทำแล้ว แต่ยังไม่เกลาเต็ม
7. **วันนัดถัดไป** — `nextAppt` และ `daysUntil` ยังเป็น demo data hardcode ยังไม่คำนวณจากข้อมูลจริง
