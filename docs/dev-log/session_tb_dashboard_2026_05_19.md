---
name: session-tb-dashboard-2026-05-19
description: 📌 Session 2026-05-19 — Bug Audit Round 2-3 (ข้อ 2, 3, 4, 5B) + กู้ Cloudflare build fail — v0.7.9.1 → v0.7.9.5
metadata:
  node_type: memory
  type: project
  originSessionId: current
---

# TB Dashboard session 2026-05-19 — Bug Audit Round 2-3 + กู้ Cloudflare

**push 5 ครั้งในวันเดียว** — ปิดบั๊ก 5 ข้อ + กู้ production 1 ครั้ง

## ลำดับเหตุการณ์

### v0.7.9.1 — Bug ข้อ 2 (Snapshot Pattern + FK SET NULL)
- ปัญหา: `hard-delete-user` ติด FK constraint เมื่อ user เคยทำงานในระบบ
- แก้: Snapshot Pattern เก็บชื่อ user เป็นตัวหนังสือ + FK ทุกตัวเป็น `ON DELETE SET NULL`
- ไฟล์ SQL: `scripts/add-user-name-snapshots.sql` (รัน Supabase แล้ว)
- 4 คอลัมน์ snapshot ใหม่:
  - `tb_delete_requests.requester_name_at_request`
  - `tb_delete_requests.reviewer_name_at_review`
  - `tb_patients.deleter_name_at_delete`
  - `tb_patients_deleted_log.deleter_name_at_delete`
- โค้ดแก้: tb-data.js (helper + 5 ฟังก์ชัน), tb-modals.jsx (fallback display), hard-delete-user/route.ts
- commit: 16b3e40
- **ยังไม่เทส** → [[project_tb_dashboard_bug2_pending_test]]

### v0.7.9.2 — middleware → proxy.ts (❌ ทำให้ Cloudflare พัง)
- แก้ deprecation warning ของ Next.js 16
- rename middleware.ts → proxy.ts + เปลี่ยนชื่อฟังก์ชัน
- เทส local ผ่าน ✅
- **Cloudflare build fail** (รู้ทีหลัง) — เพราะ proxy.ts บังคับ Node runtime, opennextjs-cloudflare รองรับเฉพาะ Edge
- commit: 0bfad0b

### v0.7.9.3 — Bug ข้อ 3-4 (Status guards)
- ปัญหา: `/api/admin/approve` และ `/api/admin/reject` ไม่เช็คสถานะเดิม → bypass การพิจารณา
- แก้: เพิ่ม guard ใน 2 ไฟล์ — อนุญาตเฉพาะ status='pending'
- error message ภาษาไทยชัดเจน บอกใช้ปุ่ม Restore/Activate/Deactivate แทน
- commit: aabe17b
- **ยังไม่เทส** → ข้อ 14 ใน bug audit

### v0.7.9.4 — Bug ข้อ 5 (ทาง B: CSP + Security headers)
- เลือกทาง B (เพิ่มเกราะ XSS) แทนทาง A (refactor token เป็น httpOnly cookie — เก็บไว้อนาคต)
- ตรวจก่อนแก้: 0 hits ของ `dangerouslySetInnerHTML`/`innerHTML` ทั่วโค้ด — สะอาดอยู่แล้ว
- เพิ่ม `headers()` ใน `next.config.js`:
  - Content-Security-Policy ครอบคลุม CDN ทั้งหมด (Tailwind, jsdelivr, cdnjs, unpkg, Supabase)
  - 'unsafe-eval' จำเป็นสำหรับ Babel-in-browser
  - 'unsafe-inline' style จำเป็นสำหรับ Tailwind runtime
  - X-Content-Type-Options, Referrer-Policy, X-Frame-Options
- แก้ครั้งที่ 1 ลืม connect-src ให้ CDN source maps → DevTools เห็น error 6 ตัว → แก้
- เทส local ผ่าน Console สะอาด ✅
- commit: 736ccf1

### 🚑 Cloudflare build fail!
- ตอนเย็น Cloudflare ส่ง log: build ล้มตั้งแต่ v0.7.9.2 (ทุก deploy หลังจากนั้น = ไม่ขึ้น production)
- log: `Node.js middleware is not currently supported`
- ลอง add `runtime = 'edge'` ใน proxy.ts → Next.js 16 reject: `Route segment config is not allowed in Proxy file`
- → **proxy.ts กับ Cloudflare เข้ากันไม่ได้** ในเทคโนโลยีปัจจุบัน

### v0.7.9.5 — Revert proxy.ts → middleware.ts
- ลบ proxy.ts + recreate middleware.ts content เดิม
- เพิ่ม comment เตือนว่าทำไมยังใช้ middleware.ts
- bump version + commit + push
- Cloudflare build ผ่าน ✨ — deploy ทุก commit ที่ค้าง (v0.7.9.1, .3, .4) ขึ้นพร้อมกัน
- commit: 4cc6797

---

## 🐛 Bug Audit สถานะหลัง session นี้

| ข้อ | สถานะ |
|---|---|
| 1 | ✅ ปิด (v0.7.9) |
| 2 | 🧪 deploy แล้ว รอเทส (v0.7.9.1) — ดู [[project_tb_dashboard_bug2_pending_test]] |
| 3-4 | 🧪 deploy แล้ว รอเทส (v0.7.9.3) — ข้อ 14 |
| 5 ทาง B | ✅ ปิด (v0.7.9.4) — CSP + headers |
| 5 ทาง A | 🔮 roadmap อนาคต (refactor token → httpOnly cookie) |
| 6-12 | ⏳ ยังเหลือ 7 ข้อ |

---

## 📚 Memory ใหม่ที่เพิ่ม

- [[knowledge_nextjs16_cloudflare_middleware]] — ห้าม rename middleware.ts → proxy.ts บน Cloudflare
- [[project_tb_dashboard_bug2_pending_test]] — Bug 2 รอเทส

---

## 🎓 บทเรียนสำคัญ

1. **Next.js 16 proxy.ts ≠ Cloudflare** — proxy.ts บังคับ Node runtime, Cloudflare ต้อง Edge
   ครั้งหน้าถ้าจะ migrate ให้เช็ค @opennextjs/cloudflare รองรับยังก่อน
2. **deploy แล้วต้องดู Cloudflare** — ไม่ใช่แค่ push เสร็จก็จบ ต้องเช็คว่า build success
3. **Snapshot Pattern** ที่เริ่มใช้ใน v0.7.8.2 (reject log) ขยายมาใช้ใน v0.7.9.1 (delete requests, patients) ได้ดี
4. **CSP report-only mode ไม่ได้ใช้** — แคลร์ตัดสินใจตั้ง enforce ตั้งแต่แรกเพราะ rules เคลียร์ดี

---

## 🔗 ที่เกี่ยวข้อง
- [[session_tb_dashboard_2026_05_18]] — session ก่อน (Bug Audit Round 1, v0.7.9)
- [[project_tb_dashboard_bugs_2026_05_18]] — Bug Audit master list (อัปเดต ข้อ 13-14)
- [[knowledge_nextjs16_cloudflare_middleware]] — กฎใหม่
- [[project_tb_dashboard_bug2_pending_test]] — Bug 2 รอเทส
