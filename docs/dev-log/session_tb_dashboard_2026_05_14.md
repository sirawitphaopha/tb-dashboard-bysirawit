---
name: tb-dashboard-session-2026-05-14
description: "session 14 พ.ค. 2026 — setup เครื่อง, โคลน repo, เข้าใจโครงสร้างไฟล์ TB-CARE LINK"
metadata: 
  node_type: memory
  type: project
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

**วันที่:** 2026-05-14
**โปรเจกต์:** TB-CARE LINK
**Repo local:** `C:\Users\PKH\tb-dashboard-bysirawit`

## สิ่งที่ทำ

- โคลน repo `sirawitphaopha/tb-dashboard-bysirawit` ลงเครื่อง
- ลบโฟลเดอร์ duplicate `UsersPKHtb-dashboard-bysirawit` ที่เกิดจาก Bash clone path ผิด

## โครงสร้างไฟล์ที่สำคัญ

ไฟล์หลักที่ต้องแก้จริงๆ **อยู่ใน `/public/`** ทั้งหมดค่ะ:

```
public/
├── index.html      ← หน้าหลัก โหลด library + ไฟล์อื่น
├── tb-data.js      ← ข้อมูล/ค่าคงที่ทั้งหมด
├── tb-modals.jsx   ← modal ต่างๆ
└── tb-app.jsx      ← logic หลัก ← แก้บ่อยสุด
```

`app/page.tsx` และ `components/TBApp.tsx` เป็นแค่ Next.js wrapper โหลด index.html ผ่าน `<iframe>` — **ไม่มี logic จริง**

**Stack จริง:** React CDN + JSX (ไม่ใช่ Next.js จริงๆ) ครอบ Next.js ไว้แค่เพื่อ deploy — **ใช้ Cloudflare Pages** (ไม่ใช่ Netlify)
