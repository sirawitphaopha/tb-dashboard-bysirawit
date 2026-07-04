---
name: tb-dashboard-version-locations
description: 🚨 TB Dashboard version ต้องแก้ใน CODE ก่อนเสมอ — 2 ที่ — ห้าม commit/push จนกว่าจะแก้ทั้งคู่
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ea782730-7b5c-45d9-87f4-7d857e102cad
---

# 🚨 กฎเหล็ก — เปลี่ยน version ทุกครั้ง ต้องแก้ในโค้ดก่อนเสมอ

**Why:** 2026-05-17 แคลร์ commit + push v0.7.5.1 โดยไม่ได้แก้ version ในไฟล์ก่อน — พี่กันต้องเตือน

**How to apply:** ทันทีที่ตัดสินใจ version ใหม่ → แก้ 2 ไฟล์นี้ก่อน แล้วค่อย commit

---

## ตำแหน่งที่ต้องแก้ (อัปเดต 2026-05-21 — v0.7.10.4+)

| # | ไฟล์ | ตัวแปร/บริบท |
|---|---|---|
| 1 | `public/tb-app.jsx` | `const APP_VERSION = '0.7.10.4'` (footer + popup About ใช้ตัวนี้ตัวเดียว) |
| 2 | `public/tb-app.jsx` | `const BUILD_DATE = '21 พ.ค. 2569'` (วันที่บิ้ว ในpopup About) — **อัปเดตคู่ version ทุกครั้ง** |
| 3 | `app/login/page.tsx` | hardcode `Version 0.7.10.4` (Footer ใต้ฟอร์ม login) |

> 💡 ตั้งแต่ v0.7.10.4: tb-app footer เลิก hardcode แล้ว ใช้ `{APP_VERSION}` — แก้ APP_VERSION ที่เดียวคุมทั้ง footer + popup
> ⚠️ แต่ login/page.tsx ยัง hardcode (คนละ module) + BUILD_DATE ต้องแก้มือ

## ลำดับที่ถูกต้องทุกครั้ง

1. **แก้โค้ด** → แก้ version ใน `tb-app.jsx` + `login/page.tsx` ให้ตรงกัน
2. **ตรวจ** → grep หาเลขเวอร์ชันเก่าทั้ง repo: `grep -rn "0\.7\.X"` (แทน X ด้วยเลขเก่า)
3. **commit** → รวมไฟล์ version เข้า commit เดียวกับ feature
4. **ถาม push** → "push ด้วยไหมคะ?" รอพี่กันยืนยัน

## format ในแต่ละไฟล์

**public/tb-app.jsx:**
```jsx
<p ...>v0.7.5.1 ·<span style={{color:'#fbbf24'}}>ยังไม่เผยแพร่</span></p>
```

**app/login/page.tsx:**
```jsx
<p ...>Version 0.7.5.1 · <span style={{ color: '#fbbf24', fontWeight: 600 }}>ยังไม่เผยแพร่</span></p>
```

> ⚠️ format ต่างกัน: tb-app.jsx ใช้ `v0.7.5.1` (ขึ้นต้น v) แต่ login ใช้ `Version 0.7.5.1` (มีคำว่า Version)

## ป้าย "ยังไม่เผยแพร่"

- คงไว้จนกว่าพี่กันพร้อม launch จริง — ห้ามลบโดยไม่ถาม

---

## 🔴 ประวัติการลืม (เกิดซ้ำ — อ่านก่อนเปลี่ยน version ทุกครั้ง)

- **2026-05-17:** push v0.7.5.1 โดยไม่แก้ version เลย → พี่กันเตือน
- **2026-05-21:** push v0.7.10.2 แล้ว แต่ **`app/login/page.tsx` ยังค้างที่ 0.7.9.5** (แก้แค่ `tb-app.jsx` ที่เดียว) → พี่กันจับได้
- **2026-05-29:** 🔴 push หลายรอบ (v0.7.12.3 → 13.2) โดย **ไม่เคยอัปเดต `BUILD_DATE` เลย** ค้างที่ '22 พ.ค. 2569' ตลอด → พี่กันโกรธ "ตอนเปลี่ยน version เธอต้องดูวันด้วย"

> ⚠️ **จุดที่ตกหล่นบ่อยที่สุด = `app/login/page.tsx` (version) + `BUILD_DATE` (วันที่)**
> 🚨 **BUILD_DATE ต้อง = วันที่ push จริง** (วันที่เปลี่ยน version) — แปลงเป็น พ.ศ. (ค.ศ.+543) เช่น 2026-05-29 → '29 พ.ค. 2569'

## ✅ วิธีกันลืม — ทำทุกครั้งที่เปลี่ยน version
1. แก้ **ทั้ง 2 ไฟล์** พร้อมกันในการแก้ครั้งเดียว: `public/tb-app.jsx` + `app/login/page.tsx`
2. **ค้นยืนยันทันที** หลังแก้ — ค้นเลข version ใหม่ทั้ง repo ต้องเจอ **2 จุด** (ถ้าเจอแค่ 1 = ยังตกหล่น)
3. **ค้นเลขเก่า** ด้วย — ต้องไม่เหลือเลย ถ้าเจอ = ยังลืมแก้
