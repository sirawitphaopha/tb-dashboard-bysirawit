---
name: tb-dashboard-2026-07-05-v0-7-21-1
description: TB Dashboard — v0.7.21.1 เก็บ hash WebP + แก้บั๊ก SHA-256 บน IP (crypto.subtle secure-context) + หน้าประวัติกรองทันที/multi-select/มุมตามรูป/snapshot ภาษาคน + กรองรูปซ้ำในคลัง + ตรึงส่วนหัว 3 หน้า · กฎใหม่ version 4 ตำแหน่ง · แก้ CORS พอร์ต local
metadata:
  node_type: memory
  type: project
  originSessionId: 7aa68f83-dda6-4087-a662-3dcb5fe5fceb
---
# TB Dashboard — Session 2026-07-05 (ต่อจาก 07-04)

**Repo:** `D:\tb-dashboard-bysirawit` · main · push ตรง (Cloudflare Pages) · Live tbjourney.care

## ✅ push v0.7.21.3 (feature eaa2910 + chore 51ed870) — พี่กันเทสแล้ว · ⚠️ ตอน push tool ขึ้น "Server error" (เน็ตหลุด) แต่ **push ลง GitHub สำเร็จแล้ว** (verify: origin/main มี eaa2910+51ed870 · local=origin)
- **🥚 Easter egg "เฉพาะเลขวิเศษ"** — ตรวจเลขส่วนตัวสั้นๆ (ตัดเลขเต็มออก · พี่กันOKให้ขึ้น git) ที่บังเอิญโผล่ในค่าแฮช · `MAGIC_NUMBERS`/`detectMagic`/`highlightMagic` ใน shared.jsx · ไฮไลต์ popup=เทล/แถบข้าง=อำพัน · ปุ่มกรอง "เฉพาะเลขวิเศษ" ใน library → `MAGIC_IMAGE` (รูปปลอม SVG data-URI · แฮช crafted · ไม่มีในคลังปกติ · ดู/ขยาย/โหลด SVG ได้ · ลบ/แก้ไม่ได้ `isMagic` guard) · verify Chrome ผ่าน
- **แท็บกรองหมวด = multi-select** (`typeSet` Set แทน `filter` string · กดซ้ำเลิก · เลือกหลายอัน · exclusive กับ magic)
- **อัป SVG ได้ ไม่แปลง WebP** (patient-tab isSvg → เก็บต้นฉบับ ext svg · presign รับ svg · +ข้อความรองรับ SVG · ⚠️ security SVG ฝัง JS ได้ · แสดงผ่าน img ปลอดภัย/direct-URL รันได้ ค่อย sanitize)
- **บทเรียน push:** tool ขึ้น "Server error" ≠ git ล้มเหลว — เน็ตหลุดตอนจบ tool แต่ push อาจลง GitHub แล้ว → **verify `git fetch` + `git log origin/main` ก่อนสรุป** · ห้ามเถียงว่าสำเร็จโดยไม่เช็คสด
- id ในหัวการ์ดประวัติ = UUID สุ่มของ Postgres (ไม่ใช่จากเนื้อรูป · เนื้อรูป=hash)

## ✅ push v0.7.21.2 (feature 9d29fef + chore bd98723) — พี่กันเทสครบทุกจุดแล้ว
งานเกลา UX รอบใหญ่ (feedback หลายรอบ · เทสทีละจุด)
- **📦 โหลดครั้งเดียว (seed+revalidate · กฎใหม่)** — seed จาก cache ตอน mount (ไม่ skeleton) แล้วดึงสดเบื้องหลัง · helper กลาง `loadCache/saveCache` ที่ `parts/shared.jsx` · ทำที่ image-log/trash(+ฟัง tb-img-changed)/sessions/admin-users/changelog-comments/activity-log(seed default view+guard) · storage มี TTL เดิม · profile/change-password=ฟอร์มไม่ต้อง · `invalidateImgCaches` เคลียร์ tb_libimg/tb_imgtrash/tb_imglog/tb_patimg_*
- **📌 sticky แก้ช่องว่าง (บทเรียน · verify Chrome)** — sticky ใน `p-6` (padding-top 24) ใช้ `top:0` = ติดต่ำ 24px เนื้อหาโผล่ · แก้ **`top:'-24px'` + `margin:'0 -24px'` + `padding:'12px 24px'`** (gap=0) · **margin-top ลบยิ่งทำ gap** · จำลอง layout ในหน้าเทส public/ วัด getBoundingClientRect + screenshot ก่อนใส่จริง
- **🔍 ปุ่มดูข้อมูล 3 ที่** — `SnapModal` ใช้ซ้ำได้ (isEvent flag · rawJson ภายใน) + `imageToSnap()` export · การ์ดแกลเลอรี(มุมล่างขวา · stopPropagation กันเปิด lightbox) + แถบข้าง lightbox(`infoAction` prop · ปุ่มในแถบขวา ไม่ใช่ toolbar) + หน้า log · library/patient-tab/trash
- **🎨 หน้าดูข้อมูล** — ทุกกรอบเต็มกว้าง(ข้อมูลรูป/เวลา 2 คอลัมน์) · รวม ต้นฉบับ↔ไฟล์ที่เก็บ เป็นตารางเทียบ · แฮชจัดกลุ่ม ต้นฉบับ(JPEG)/WebP/pHash · ปุ่ม "ดูข้อมูลดิบ (JSON)" ขนาดคงที่ + copy JSON · ปิดสีเทล
- **🐛 แก้บั๊กขนาดรูปจอ 768** — JustifiedGallery แถวสุดท้าย(รูปน้อย)ยืดเต็มกว้างถึง targetHeight×1.25 → natural h ตกช่วง jh..jh×1.25 = กลาง/ใหญ่เท่ากัน · แก้ **cap ที่ targetHeight เป๊ะ** + jh **100/135/240** · **บทเรียน: เทส UI ในกรอบที่ถูก** (จอ 768 sidebar ยุบ56/กาง260 → กรอบ ~664/460px · แคลร์เทสผิดที่ 744 กว้างเกิน · verify Chrome cw=664: 100/135/183)
- ทั้งหมด: 16 ไฟล์ · CLAUDE.md+skill(sync)+README กฎใหม่ (version 4 ตำแหน่ง/โหลดครั้งเดียว/sticky no-gap/เช็ค Chrome ก่อนส่ง UI)

## ✅ push v0.7.21.1 (feature 4fac47e + chore ff3c322) — ⚠️ พี่กันขอ push ก่อนเทส (ยังไม่เทส action)
ต่อยอด v0.7.21 (ระบบประวัติรูป audit log + hash) ให้ใช้งานได้ครบจริง

### 🔑 เก็บ hash ไฟล์ WebP (คู่ต้นฉบับ)
- อัป = คำนวณ hash 2 ไฟล์: ต้นฉบับ (นิ่ง) + WebP (ไฟล์เก็บจริง) + pHash · คอลัมน์ใหม่ `webp_sha256/md5/crc32` (รันผ่าน MCP แล้ว)
- โชว์ hash **ครบทุกค่า** ในตัวดูรูป (shared.jsx แผงข้อมูล) + หน้ารายละเอียดประวัติ (ค่าเต็ม ไม่ตัด)

### 🐛🐛 บทเรียนใหญ่ 1 — SHA-256/MD5/CRC32 ว่างตอนเปิดผ่านเลข IP (LAN)
- **ต้นเหตุ:** `crypto.subtle` เบราว์เซอร์ให้ใช้เฉพาะ **secure context (https / localhost)** · เปิดผ่าน `http://192.168.x.x` = ไม่ secure → `crypto.subtle` = **undefined** → `sha256Hex` โยน TypeError · โค้ดเดิม sha256 อยู่ try เดียวกันก่อน md5/crc32 → พังลากตัวอื่นด้วยหมด (log: `Cannot read properties of undefined (reading 'digest')`)
- **แก้ (image-hash.js):** (1) เขียน `_sha256` pure-JS fallback — verify test vector (abc/""/ยาว) + node crypto (200KB) ตรงเป๊ะ · (2) `sha256Hex` ลอง native ก่อน ไม่มีค่อย fallback → ทำงานทุก context · (3) `computeByteHashes` แยก try แต่ละ hash (ตัวพังไม่ลากตัวอื่น)
- **จำ:** hashing/crypto ฝั่ง client ที่ต้องรองรับ LAN → อย่าพึ่ง crypto.subtle อย่างเดียว ต้องมี fallback + isolate

### 🐛🐛 บทเรียนใหญ่ 2 — อัปรูปไม่ได้ใน local ("เครือข่ายมีปัญหา") = CORS พอร์ต ไม่ใช่บั๊กโค้ด
- **ต้นเหตุ:** R2 CORS ของ bucket `tb-patient-images` อนุญาต origin แค่ **localhost:3001 + tbjourney.care** · แต่ `next dev` = พอร์ต **3000** → R2 บล็อก PUT (403 preflight) → `xhr.onerror` (helpers.jsx putWithProgress) → เด้ง "อัปโหลดไม่สำเร็จ — เครือข่ายมีปัญหา"
- **วินิจฉัย:** ยิง `curl -X OPTIONS` preflight เทส origin จริง (localhost:3000=403 · 3001=204 · tbjourney.care=204) → พิสูจน์ชัด ไม่เดา · (Windows curl ต้อง `--ssl-no-revoke`)
- **แก้:** เพิ่ม `http://localhost:3000` + IP LAN (`http://192.168.34.126:3000`) เข้า R2 Allowed Origins (Cloudflare dashboard) · ไม่แตะโค้ด
- **จำ:** อัปตรง browser→R2 ล้มใน local = เช็ค R2 CORS ก่อน (พอร์ต dev ต้องอยู่ใน allowlist) · IP LAN เปลี่ยนได้ตาม DHCP (ไม่ใช่ต่อการรัน) · page bg = teal-50 `#f0fdfa`

### 📜 หน้าประวัติรูป (image-log.jsx เขียนใหม่) — โหลดครั้งเดียว กรองทันที
- API `log/route.ts` เขียนใหม่ = คืน event ทั้งหมดรอบเดียว (cap 5000 · +imageId) · เอา server group/pagination ออก → client `useMemo` กรอง/group/dedup → **กดกรองปุ๊บทันที** (เดิมยิง server ทุกครั้ง+debounce=หน่วง)
- ดรอปดาวน์กรองเหตุการณ์ = **เลือกหลายข้อ** (checkbox + ล้าง/เลือกทั้งหมด) · ปุ่มกว้างคงที่ 178px (ติ๊กแล้วไม่ขยาย/ยุบ)
- มุม **"ตามรูป"** (group image_id) — การ์ดต่อรูป + สถานะ + จำนวน event + แฮชย่อ + ไทม์ไลน์ในรูป · ป้ายรูปซ้ำ (union-find · SHA เป๊ะ=ซ้ำ / pHash Hamming≤8=คล้าย)
- snapshot = **ภาษาคน** (SnapModal · grid แนวนอน auto-fit → จอกว้างไม่ต้องเลื่อน · มือถือเรียงลง) หมวด ข้อมูลรูป/ต้นฉบับ/ไฟล์เก็บ(บีบลด%)/เวลา/แฮช(เต็ม) + ปุ่ม "ดูข้อมูลดิบ JSON"

### 🖼 คลังรูป (library.jsx) — กรองเฉพาะรูปซ้ำ
- `dupMap` (useMemo · union-find · SHA เป๊ะ + pHash≤8) จากรูปทั้งหมด → ป้าย "ซ้ำ #n"/"คล้าย #n" การ์ด+แถว · ปุ่ม **"เฉพาะรูปซ้ำ"** (ม่วง · exclusive กับ "เฉพาะรูปที่ขอลบ") · import `phashDistance` จาก image-hash

### 📌 ตรึงส่วนหัว (sticky) — คลังรูป/ประวัติ/ถังขยะ
- toggle + แถบกรอง `position:sticky top:0` · bg `#f0fdfa` (=teal-50 พื้นหน้า) · full-bleed ด้วย negative margin -24px (scroll container = `mainScrollRef` p-6)
- ประวัติ/ถังขยะ: ส่ง toggle เข้า sticky ผ่าน prop `headerExtra` (ตรึงก้อนเดียวไม่ทับกัน) · ถังขยะย้ายกล่องเตือน 60 วันลงใต้แถบกรอง
- hover class กลางใน globals.css: `.tb-hovbg` / `.tb-hovgray` / `.tb-hovteal` (ใช้กับ element inline-style)

## 🆕 กฎใหม่ (5 ก.ค. 69) — เวอร์ชัน 4 ตำแหน่งเสมอ
- **`X.Y.Z.W` เสมอ** — เติม `.0` ถ้าขาด (`0.7.21` → `0.7.21.0`) · **ห้ามเกิน 4** (`0.7.21.2.5` → `0.7.21.2`) · ที่ push แล้วไม่แก้ย้อนหลัง (`0.7.19.6.22` เก่าคงไว้)
- จดใน: skill (working-with-gun ทั้ง master + repo copy) · MEMORY.md · CLAUDE.md · README.md

## 🔭 งานต่อไป / ค้าง
1. **🖼 ปรับหน้าประวัติรูป มุม "ตามรูป" (พี่กันสั่งต่อ · ทำเลย) — push v0.7.21.3 แล้วค่อยทำ:**
   - **โชว์รูปย่อจริงในหัวการ์ด** (แทนไอคอนเทา + id) — รูปที่ยังอยู่ = signed URL · ลบถาวรแล้ว = ไอคอน+"ไฟล์ถูกลบถาวร" (ต้องให้ API log สร้าง signed URL)
   - **SHA-256 ค่าเต็มในหัวการ์ด** (เดิมย่อ `e70b...`)
   - **กดยุบ/กางกิจกรรมได้** (collapse events ต่อรูป)
   - **"อนุมัติลบ (เข้าถัง)" → เขียนเต็ม "เข้าถังขยะ"** (แก้ label ใน EV map image-log.jsx)
   - **tag "ภาพคล้าย #n" งง** → คิดว่ารวม/กรองได้ไหม (พี่กันสงสัย)
   - **บอกให้ชัดว่ากดเหตุการณ์ดูรายละเอียดได้** (hover เปลี่ยนสี + คำว่า "ดูข้อมูล")
   - แคลร์เสนอเพิ่ม: ปุ่ม "ดูรูปนี้ในคลัง" · แถบสรุป event ด้านบน (พี่กันยังไม่เลือก)
2. **action เดิม v0.7.21 ยังไม่เทสครบ** (11 event log · อัป/แก้/ขอลบ/ยกเลิก/อนุมัติ/ปฏิเสธ/ลบตรง/กู้/ลบถาวร) — เทสได้ตอนสะดวก
3. **0.8:** คลังความรู้ TB + PDF viewer + อัปไฟล์ไกด์ไลน์ (roadmap จริง = `docs/ideas.md`)
4. **ค้างไกล:** bug audit · split monolith · 0.9 AI · 1.0
- ✅ v0.7.21.1 + v0.7.21.2 พี่กันเทสครบแล้ว (hash/ประวัติ/ตามรูป/รูปซ้ำ/sticky/โหลดครั้งเดียว/ปุ่มดูข้อมูล/ขนาดรูป)

## หมายเหตุ
- dev server รันอยู่ (bg task · localhost:3000) · SQL webp columns รันบน dev=prod แล้ว (MCP)
- ⚠️ scripts/rollback-cleanup-easter-egg-log.sql (untracked · ไม่ใช่ของเรา) = ไม่ commit
- ดู [[tb-dashboard-2026-07-04-v0-7-19-7]] (session ก่อน · v0.7.20-0.7.21)
