---
name: 🎨 TB Dashboard session 2026-06-01 part 6 — v0.7.17.4 Changelog ครบถ้วน + แก้ 500 ถาวร
description: เติมปุ่มฉบับเต็มที่ขาด (14.4/14.5/14.6) + แก้ tag ไม่ขึ้น (fix/polish) + sync 22 bodies ตรง git + Cache-Control header แก้ 500 chunk ถาวร + กรอบอำพันการ์ดล่าสุด
type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# v0.7.17.4 — Changelog ครบถ้วน + แก้ปัญหา 500 ถาวร (2026-06-01)

**Commits:** be8562d (main) + 5d904e2 (chore hash) บน main

## 📜 หน้าประวัติเวอร์ชั่น — เติมให้ครบทุกเวอร์ชั่น 7.14.0+

### ปัญหาที่ user รายงาน (จาก 2 รูป)
1. บางเวอร์ชั่นไม่มีปุ่ม "บันทึกฉบับเต็ม"
2. บางบรรทัดไม่มีป้าย tag กำกับ
3. body บางตัวไม่ใช่ commit detail จริงใน GitHub

### Root cause + แก้
1. **ปุ่มฉบับเต็มหาย** — เงื่อนไขปุ่มคือ `{v.body && (...)}` (tb-monolith.jsx line 8304)
   - 14.4 / 14.5 / 14.6 ไม่มี field `body` → ไม่มีปุ่ม
   - แก้: Node script ดึง `git log -1 --format=%b <commitFull>` มาใส่
2. **tag ไม่ขึ้น chip** — `TagChip: if (!TAGS[tagKey]) return null` (line 8251)
   - ใช้ `fix` (7) + `polish` (10) ที่ไม่อยู่ใน TB_TAGS (มีแค่ feature/ui/bug/security/backend/remove/text)
   - tag ไม่รู้จัก = render เป็น null = บรรทัดโล่งไม่มีป้าย
   - แก้: `fix` → `bug` (global) · `polish` → ui/text/backend/remove ตามบริบท (10 จุดแยกแก้)
3. **body ไม่ตรง git** — sync ทุกเวอร์ชั่น 7.14.0 → 7.17.3 (22 ตัว) ด้วย git %b
   - เดิมสรุปสั้นเขียนมือ 500-2,000 ตัว → ตอนนี้ commit detail เต็ม 5,000-11,000 ตัว
   - Node script + safety check (หา old body ไม่เจอ = ข้าม กันพัง) · replaced 22 skipped 0

**TB_TAGS valid 7 ตัว:** feature / ui / bug / security / backend / remove / text
(ห้ามใช้ fix / polish — render เป็น null)

## 🐛 แก้ error 500 chunk หาย ถาวร
ดูเต็ม [[knowledge_local_500_chunk_fix]]
- ต้นตอ: prod build เปลี่ยน chunk hash ทุก rebuild → browser จำ HTML เก่า → ขอ chunk ที่หาย → 500
- npm run dev ลองแล้ว **ช้าเกิน > 5 นาทีไม่ขึ้น** (monolith ใหญ่) → ดอง
- แก้ถาวร: `next.config.js` เพิ่ม Cache-Control `no-store` ให้ HTML (ยกเว้น _next/static)
  - source: `/((?!_next/static|_next/image|favicon).*)`
  - refresh ธรรมดาพอ ไม่ต้อง Ctrl+Shift+R

## 🎨 กรอบอำพันการ์ดล่าสุด
- tb-monolith.jsx line ~8696 — การ์ด `isLatest` ใน Timeline view
- `border: 2px #fbbf24` + `bg #fffbeb` + `boxShadow glow rgba(251,191,36,0.28)`
- พี่กันชอบโทนอำพัน → ใช้เน้นเวอร์ชั่นใหม่สุด

## 📝 Version + วันที่
- APP_VERSION 17.3 → 17.4 (tb-monolith.jsx + login/page.tsx)
- **วันนี้ = 1 มิ.ย. 2569** (พี่กันแก้ — แคลร์เคยเขียน 2 มิ.ย. ผิด ทั้ง session)
  - แก้ changelog 4 entries (17.0-17.3) + rename 4 session memo files 06_02 → 06_01_partN + MEMORY.md links
- comment marker 'v0.7.17.3' ในโค้ดคงไว้ (ฟีเจอร์เพิ่มใน 17.3 จริง)

## 🥚 Easter egg = ของหวง (เพิ่มกฎเหล็ก)
- Phase 4C (pg_cron ลบ easter egg log) **ยกเลิก** — พี่กัน veto "สำคัญที่สุด ห้ามลบ"
- จะใส่ไข่อีกหลายจุด = ความสนุก/ตัวตน · ดู [[feedback_easter_egg_sacred]]
- ทำ rollback SQL ไว้ที่ `scripts/rollback-cleanup-easter-egg-log.sql` (เผื่อ user รัน job ไปแล้ว)

## 💡 Lessons
1. **ปุ่มฉบับเต็ม = ผูกกับ field `body`** ไม่ใช่ commitFull · ทุกเวอร์ชั่นต้องมี body
2. **tag ต้องอยู่ใน TB_TAGS 7 ตัว** เท่านั้น · ใช้นอกชุด = chip หาย (return null เงียบๆ)
3. **dev mode ไม่เหมาะ monolith ใหญ่** — คอมไพล์ครั้งแรกช้ามาก · ใช้ prod build + Cache-Control header แทน
4. **kill server ใช้ PowerShell tool** ไม่ใช่ bash (bash แปลง `$_` → "extglob" เพี้ยน)
5. **build เพิ่ม heap เสมอ** `NODE_OPTIONS=--max-old-space-size=8192` (กัน OOM 134)
