---
name: แก้ error 500 "เปิดเว็บ local ไม่ติด" หลัง rebuild (chunk หาย)
description: ปัญหาเรื้อรัง — เปิด localhost ไม่ติด 500 หลัง npm run build · ต้นตอ browser cache HTML เก่า · แก้ถาวรด้วย Cache-Control no-store ใน next.config.js (v0.7.17.4)
type: reference
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 🛑 อาการ: เปิด local ไม่ติด error 500 หลัง rebuild

**Console error ที่เห็น:**
```
Failed to load resource: 500 (Internal Server Error) — /_next/static/chunks/XXXX.js
Refused to execute script ... MIME type ('text/plain') is not executable
```

พี่กันเจอซ้ำหลายรอบใน session 2026-06-01 (หงุดหงิดมาก "อีกแล้วววว", "เปิดไม่ติดสักที")

## ต้นตอ (root cause)
1. `npm run build` (prod) → chunk ตั้งชื่อตาม content hash → **เปลี่ยนทุก rebuild**
2. rebuild → ไฟล์ chunk เก่าถูกลบจาก `.next/static/chunks/`
3. browser **จำ HTML เก่า** (cache) ที่ `<script src>` ชี้ไป chunk hash เก่า
4. refresh → browser ขอ chunk เก่าที่หายแล้ว → server ตอบ 500 (text/plain) → MIME error

## ✅ วิธีแก้ถาวร (ทำแล้วใน v0.7.17.4 — be8562d)

**ไฟล์:** `D:\tb-dashboard-bysirawit\next.config.js` — เพิ่ม header rule:
```js
{
  source: '/((?!_next/static|_next/image|favicon).*)',
  headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
}
```
- HTML document → `no-store` → browser ไม่จำ → refresh ได้ HTML ใหม่ชี้ chunk ปัจจุบันเสมอ
- `/_next/static/*` → ยกเว้น → คง `immutable` cache (chunk hash-based โหลดเร็ว)
- **ผล:** หลัง rebuild กด R ธรรมดาพอ ไม่ต้อง Ctrl+Shift+R · ไม่เจอ 500 อีก

## ❌ ทางที่ลองแล้วไม่เวิร์ก
- **npm run dev** — monolith 10K บรรทัด คอมไพล์ครั้งแรก **> 5 นาที ไม่ขึ้น** → ดองทิ้ง ใช้ prod build เหมือนเดิม
- บอก user ให้ Ctrl+Shift+R ทุกครั้ง — แก้ปลายเหตุ พี่กันรำคาญ

## 🔧 workflow restart server (ตามที่ทำจริง — Windows)
1. kill prod เก่าก่อนเสมอ (ไม่งั้น port 3001 ติด → ตัวใหม่ start ไม่ขึ้น แต่ task บอก exit 0 หลอกๆ):
   - ใช้ **PowerShell tool** (ไม่ใช่ bash) เพราะ bash แปลง `$_` เป็น "extglob" เพี้ยน:
   - `Get-NetTCPConnection -LocalPort 3001 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
2. `rm -rf .next` (บางทีต้องรัน 2 รอบ "Directory not empty")
3. `NODE_OPTIONS="--max-old-space-size=8192" npm run build` (เคยเจอ OOM code 134 ถ้าไม่เพิ่ม heap)
4. `PORT=3001 npm run start` (background)
5. verify: `curl -s -D - http://localhost:3001/login | grep -iE "HTTP|cache-control"` → ควรเห็น `no-store`

## ⚠️ Build OOM
- prod build เคยล้ม **exit code 134 (SIGABRT/OOM)** ถ้า heap ไม่พอ → ใส่ `NODE_OPTIONS="--max-old-space-size=8192"` เสมอ
- exit 3221226505 (0xC0000409) = มักเพราะ server เก่ายัง lock ไฟล์ .next → kill ให้หมดก่อน build
