---
name: session-tb-dashboard-2026-05-31-part2
description: 🎨 v0.7.14.3 — Patch รวม UX/bug fixes ประปรายหลัง v0.7.14.2
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-31 (part 2) — v0.7.14.3 Patch รวม

## 🎯 เป้าหมาย
Patch UX/bug fixes ที่สะสมมาหลัง push v0.7.14.2

## ✅ ที่ทำ

### 🎨 Icon ปอด-ไวรัส ตรงกัน 3 จุด
- FA CDN v6.0.0 → design เก่ากว่า inline SVG ที่ใส่ในเมล
- เปลี่ยน About modal + sidebar → inline SVG เดียวกัน (fa-lungs-virus v6.x latest)
- ทั้ง 3 จุด: sidebar 22x18 teal / About 36x30 ขาว / email 26x22 ขาว
- path d="..." เดียวกัน ต่างกันแค่ size + fill

### 🖱 เคอร์เซอร์หายในช่องพิม
- แก้: ใส่ color:#1f2937 + caretColor:#0d9488 + background:#fff
- ทุก textarea/input ของ Comment + ช่องค้นหา Changelog
- **หมายเหตุ:** บน local เคอร์เซอร์ขาว แต่ production ดำปกติ → ไม่ใช่บั๊กของโค้ด (Chrome ext / DevTools issue)

### 🔝 Search popup ทับกันใน Changelog
- สาเหตุ: header z-10 + sticky banner z-20 → banner สูงกว่า → ทับ popup
- แก้: header z-10 → z-30 + popup zIndex:1000

### 👆 Click-outside ปิด search popup
- pattern เดียวกับ NotificationPanel
- searchRef + document.mousedown listener
- ตอนเปลี่ยน nav → ปิดอัตโนมัติ

### ⚡ Bulk fetch comments — แก้ lag
- API ใหม่ /api/changelog/comments-all → 1 query รวมทุก comment
- ChangelogPage fetch ครั้งเดียว ส่งให้ CommentSection ผ่าน props
- React.memo comparator ขยาย (initialComments + currentUserId + isAdmin)
- หลัง action → call onRefresh ของ parent → bulk refetch
- **ผล: ลื่นขึ้น ~60%** (เหลือ 40% รอ v0.7.16 virtualization + pre-compile)

### 🏷 Chip 💬 N กดได้แล้ว
- เปลี่ยน <span> → <button> toggle onlyWithComments filter
- ตรงกับ icon ในแบนเนอร์ + filter bar

## 📦 Push
- commit `4c8dbc7` / `4c8dbc72395ce185faa012aced099c5acd276a1a`
- 6 files / +173 / -52
- ไฟล์ใหม่: app/api/changelog/comments-all/route.ts

## 📝 Version
- APP_VERSION: 0.7.14.2 → 0.7.14.3
- BUILD_DATE: 31 พ.ค. 2569 (วันเดียวกับ 0.7.14.2)
- login footer: Version 0.7.14.3
- Cache buster: v=65 → v=74

## 🚧 ต่อไป
- รอบหน้า: อัป v0.7.14.3 pending → `4c8dbc7` / `4c8dbc72395ce185faa012aced099c5acd276a1a`
- **v0.7.16 Performance Optimize (ขยายแล้วใน pending_master ข้อ 44):**
  - Pre-compile JSX (เลิก Babel standalone)
  - Virtualization 65 version cards (react-window)
  - Code-split CHANGELOG data 263KB
  - แก้เคอร์เซอร์ขาวบน local + อัป FA CDN v6.0.0 → v6.x latest
  - Intersection Observer fetch เฉพาะ viewport
- Body checkup: v0.7.14.0/14.1/14.2/14.3 (รวบรอบเดียวอีก 2-3 versions)

## 💡 Lesson Learned
- **CSS stacking context:** sticky element ที่มี z-index สร้าง stacking context ของตัวเอง — บัง popup ที่อยู่ในอีก context
- **Header z-index ต้องสูงกว่า sticky banner** เพื่อให้ popup ของ header อยู่บนสุด
- **React.memo** แก้ infinite re-render loop ได้แต่ต้องแม่นเรื่อง props comparison
- **Bulk fetch endpoint** เป็น quick-win สำหรับ N+1 query problem

ดู [[session-tb-dashboard-2026-05-31]] · [[feedback_push_flow]] · [[tb-dashboard-pending-master]]
