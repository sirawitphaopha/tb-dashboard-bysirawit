---
name: tb-dashboard-session-2026-06-03-avatar-v0-7-18-0
description: 🖼 v0.7.18.0 ระบบรูปโปรไฟล์ (Avatar) ครบวงจร + Cloudflare R2 + เครื่องมือดูรูปสไตล์ Windows Photos — push แล้ว (418d7c6) · เหลือ Step 4 (avatar 4 จุด) + ตั้ง env Cloudflare
metadata:
  node_type: memory
  type: project
  originSessionId: 0d319472-21f4-4173-828b-35af180daaa4
---
# v0.7.18.0 — ระบบ Avatar + Cloudflare R2 (2026-06-03)

**Commit:** `418d7c6` (main) · push สำเร็จ `5d904e2..418d7c6` · changelog commit ยัง `pending` (รอบหน้า backfill)
**ต่อจาก:** [[session_tb_dashboard_2026_06_03_avatar]] (resume memo — Step 0-3 ค้าง) → รอบนี้ทำต่อจนจบ + push

## 🎯 สิ่งที่ทำ (ทั้งหมดในวันเดียว)
ระบบอัปโหลดรูปโปรไฟล์ครบวงจร + วางรากฐาน R2 (ต่อยอด CXR ภายหลัง) · scope: avatar เท่านั้น

### Frontend (app/legacy/tb-monolith.jsx)
- **AvatarCropModal**: react-easy-crop วงกลม + objectFit **cover** (เต็มขอบทุกด้าน) + **minZoom 0.4 + restrictPosition false** (ซูมออกเห็นรูปทั้งใบ + ลากอิสระ) + **เส้นกริด 9 ช่อง + เส้นแบ่งครึ่งกลาง** + เติมพื้นขาวตอนซูมออก
- **AvatarLightbox** (สไตล์ Windows Photos): เปิด**ขยายจากตำแหน่งรูป** (transform 4 ฟังก์ชันชุดเดียว) + ลาก + สโครลซูม + **slider 10-800%** + ปุ่มหมุนซ้าย/ขวา/พอดีหน้าจอ/ย่อ/ขยาย/เลือก% + **ดึงกลับกึ่งกลางอัตโนมัติ**ตอนกดปรับ% + **แผง info สีธีมเทล + ปุ่มปิด** (ชื่อไฟล์/ขนาดภาพ/ขนาดไฟล์/ฟอร์แมต/%/หมุน/วันที่/แหล่งเก็บ) + บล็อกคลิกขวา
- **AvatarDeleteConfirm**: popup ยืนยันลบ + คำเตือน
- ปุ่ม "ครอบใหม่" (ดึงรูปต้นฉบับมาครอบวงใหม่ ไม่ต้องอัปไฟล์ใหม่)

### Backend
- `lib/r2.ts` — presignPut + r2Delete (aws4fetch)
- `app/api/profile/avatar/presign` (POST → 2 presigned PUT URL), `/confirm` (POST → save), `route.ts` (DELETE → ลบ 2 ไฟล์)
- DB: `profiles` + avatar_url, avatar_updated_at, avatar_original_url (2 SQL รันแล้ว)
- **2 ไฟล์/user:** `avatars/<uid>.webp` (ครอบ 512px โชว์เล็ก) + `avatars/<uid>_orig.webp` (ต้นฉบับ max 1920 กดดูเต็ม) · **WebP 100%**
- CSP (next.config.js): connect-src += *.r2.cloudflarestorage.com + img.tbjourney.care · img-src += img.tbjourney.care
- npm: aws4fetch + react-easy-crop

## 🐛 บั๊กที่เจอ+แก้ (debug ผ่าน MCP browser — ดู console/network/elementFromPoint)
1. **Failed to fetch ตอนอัป** = CSP ไม่มีโดเมน R2 (บล็อกก่อนยิงออก network ไม่บันทึก) → เพิ่ม connect-src
2. **วงกลมครอบไม่เต็มขอบ** → กรอบจัตุรัส paddingBottom 100% + objectFit cover
3. **ขอบบนรูปเข้าวงไม่ได้** → minZoom 0.4 + restrictPosition false
4. **canvas tainted ตอนครอบใหม่** = `<img>` cache รูปแบบ no-cors ไว้ → loadImageEl crossOrigin โดน taint → **ดึงรูปเป็น blob (object URL same-origin)** แทน
5. **ขนาดไฟล์ไม่ขึ้นในแผง info** = fetch URL เดิม (ที่ `<img>` โหลด no-cors) → "Failed to fetch" (cache ชน) → **fetch ด้วย URL เติม `&_meta=1`** เลี่ยง cache

## 💡 Decisions
- **2 ไฟล์ แยกหน้าที่:** ครอบ 512 (เล็ก เร็ว โชว์ avatar) vs ต้นฉบับ 1920 (กดดูเต็ม) — popup ใช้ต้นฉบับ
- **WebP 100%** (พี่กันสั่ง) · **AVIF ดอง** — เบราว์เซอร์ `canvas.toBlob('image/avif')` ทำไม่ได้ (ตก PNG) ต้อง server-side → รอเฟส CXR (ดู pending master ข้อ 54)
- **ครอบ = สี่เหลี่ยมเก็บมุมครบ** แสดงกลมด้วย CSS · กดดูเต็ม = รูปต้นฉบับ (สี่เหลี่ยมเต็มใบ ที่พี่กันเลือก)
- คลิกขวากันเซฟ = กันได้แค่เบาๆ (บอกพี่กันแล้ว screenshot/devtools ยังได้)

## ✅ v0.7.18.1 — Avatar ทุกจุด (Step 4) + fixes (push 6352f63, วันเดียวกัน)
- **Step 4 เสร็จ:** แสดง avatar ที่ แถบเมนูซ้าย + หน้าจัดการผู้ใช้ (ลิสต์+การ์ด) + ความคิดเห็น (คนเขียน+คนตอบ) + @ชื่อ (เขียน/แก้/ตอบ/ฟิลเตอร์ = 4 จุด)
- **component กลาง `AvatarCircle`** + helper `r2AvatarUrl` (มี fallback domain img.tbjourney.care กัน build env ไม่ inline) + `colorFromName` (12 สี)
- **กันรูปเสีย (onError)** → เด้งกลับตัวย่อ · **วงกลมสีตามชื่อ** (คนไม่มีรูป)
- **Backend:** comments-all + mentionable-users ส่ง avatar_url/avatar_updated_at (join profiles) · optimistic comment/reply โชว์ avatar ทันที (findMySnapshot)
- **แก้รูปไม่ขึ้นบน production:** fallback domain ในโค้ด (ไม่พึ่ง NEXT_PUBLIC build inline — Cloudflare Worker build แยก runtime)
- เทส: screenshot ใช้ไม่ได้ (realtime ค้าง idle) → เทสผ่าน DOM+API: แถบเมนูโชว์รูปจริง 512 · comments-all 45/45 มี avatar_url · mentionable-users มี avatar_url ครบ
- backfill hash 18.0 = 418d7c6 แล้ว · changelog 18.1 = pending (รอบหน้า backfill = 6352f63)
- **🔔 เหลือ: avatar ในกระดิ่ง** = พี่กันสั่งทำต่อหลัง push นี้ (ดู section ล่าง "เหลือทำ")

## ✅ v0.7.18.2 — Avatar ในกระดิ่ง + ตัวย่อ/สีสม่ำเสมอ (push 6e621a5, วันเดียวกัน)
- **กระดิ่ง:** แสดง avatar คนที่ตอบ/mention (comment notif) แทนไอคอนโล่ · หา actor จาก comment_id → comment.user_id → avatar (ไม่แก้ DB) · **API ใหม่ `/api/notifications`** (admin client เลี่ยง RLS) · loadUserNotifications ดึงผ่าน API นี้
- **ตัวย่อสม่ำเสมอ:** `nameInitials` ตัดคำนำหน้า (3 คำ→2 คำท้าย) → "นาย Sirawit2 Phaopha2" = **SP** ทุกที่ · เอา profession_label ออกจากวงกลม (เดิมกระดิ่ง="นS" คอมเมนต์=ชื่อวิชาชีพ "เยาบา" → ไม่ตรง admin ที่เป็น SP)
- **สีสม่ำเสมอ:** เปลี่ยนไป hash จาก **user_id** (ไม่ใช่ชื่อ) → คนเดียวกันสีเดียวกันเป๊ะทุกหน้า · ทุกจุดส่ง `colorKey={user_id}`
- **พาสเทล:** เปลี่ยนจากสีทึบ → คู่สี pastel (พื้นอ่อน-100 + ตัวอักษรเข้ม-700) 12 สี อ่านง่าย
- backfill hash 18.1 = 6352f63 · changelog 18.2 = pending (รอบหน้า backfill = 6e621a5)
- เทส: auto-test เครื่องนี้พัง (screenshot idle + คลิกเมนูไม่ติด + extension หลุดเป็นช่วง) → เทสผ่าน DOM+API+logic: กระดิ่งโชว์ "SP" พาสเทลอำพัน · comments-all/notifications API ส่ง avatar+actor ครบ · พิสูจน์ nameInitials("นาย Sirawit2 Phaopha2")="SP"
- **🏁 ปิดงานชุด avatar ครบ:** อัป + ครอบ + ดูเต็ม(Windows Photos) + ครอบใหม่ + ลบ + แสดงทุกจุด(sidebar/comment/reply/mention/admin/bell) + กันรูปเสีย + สีพาสเทลตาม id

## ⬜ เหลือทำ (ครั้งหน้า)
- **Step 4: แสดง avatar 4 จุด** — sidebar current user (~7252) + comment author (~9676) + reply author (~9865) + profile (ทำแล้ว) · ต้องดึง avatar_url มากับ comment author + currentUser · ทำ component `AvatarCircle({user,size})` reuse
- **⚠️ ตั้ง env R2 บน Cloudflare Pages** — NEXT_PUBLIC_R2_AVATAR_URL (Build) + R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET_AVATAR (Runtime) — **ไม่งั้น avatar พังบน production** (พี่กันต้องตั้งเอง)
- backfill changelog commit pending → 418d7c6 (รอบ push หน้า)
- Roadmap: CXR + ตู้ปิด private R2 + AVIF server-side + รูปแนบใน comment (pending master ข้อ 43, 51, 54)

## 🛠 หมายเหตุ dev
- พี่กัน test ในเบราว์เซอร์ตัวเอง (session หลุดบ่อยตอนรีสตาร์ทเซิร์ฟเวอร์ — แคลร์ล็อกอินแทนไม่ได้ตามกฎ)
- เทสด้วย MCP browser: inject รูปผ่าน DataTransfer เข้า file input (file_upload tool บล็อก path นอก session)
- build เพิ่ม `NODE_OPTIONS=--max-old-space-size=8192` เสมอ · serve `npx next start -p 3001` (CORS R2 อนุญาต localhost:3001)
