---
name: session-tb-dashboard-2026-07-06-v0-7-22
description: TB Dashboard session 6 ก.ค. 69 — ยกเครื่องหน้าประวัติรูป + แก้บั๊กลาก SVG → push v0.7.22.0
metadata: 
  node_type: memory
  type: project
  originSessionId: 7aa68f83-dda6-4087-a662-3dcb5fe5fceb
---

# TB Dashboard — session 6 ก.ค. 2569 (v0.7.22.0)

**Repo:** D:\tb-dashboard-bysirawit · live tbjourney.care (ยังไม่เผยแพร่) · Supabase `cioswzdbonnbhbyynrhh` (dev=prod)
**push แล้ว:** ✅ **v0.7.22.0** — feature `b7b048c` + chore `293d20f` (sync 0 0) · **ไม่มี SQL ใหม่**
> ⚠️ ก่อนหน้ามี 2 commit เอกสารจากอีก session (idea-0.8 · 7c5c819/44761b1) — pull มาก่อน push (แตะแค่ docs ไม่ชนโค้ด)

## งานที่ทำ (v0.7.22.0 — ยกเครื่องหน้าประวัติรูป ImageLogPage)
ต่อจาก v0.7.21.3 · พี่กันสั่งเสริมหลายรอบ ทำครบ:
1. **รูปย่อจริง** ทั้งมุมตามรูป+ตามเวลา (log API presign `thumbs`/`fulls` เฉพาะรูปที่ยังไม่ลบถาวร · รูปลบถาวร=placeholder ไฟ) + กรอบเทลจางรูป active + `LogThumb`
2. **กดรูปย่อ = เปิด AvatarLightbox** (ตัวเดียวกับคลัง · ซูม/หมุน · **กันคลิกขวา/เซฟ · ไม่มีปุ่มดาวน์โหลด**) · `snapToImLike`→`patientImgInfo`
3. **SHA-256 เต็ม + ไฮไลต์เลขวิเศษ** ทั้ง 2 มุม
4. **ป้ายสีบทบาท** แอดมิน(อำพัน)/ผู้ใช้(ฟ้า) `roleBadge` + **"หมายเหตุ:"** `noteText` + "อนุมัติลบ (เข้าถังขยะ)" เต็ม
5. **กดยุบต่อการ์ด + ปุ่มยุบทั้งหมด** (`collapsed`/`toggleAll`)
6. **กดป้าย "ภาพคล้าย #X" กรองย่อยกลุ่มนั้น** (`dupFocus`) + ปุ่มเฉพาะรูปซ้ำ
7. **แถบสรุปยอด event** กดกรองได้ (toggle `eventSet` · ตรึงในหัว sticky · นับจาก `dateqFiltered`)
8. **ปุ่ม "ดูในคลัง"** (`openImageInGallery`+`pendingOpenId`) + **"เวชระเบียน"** (`onOpenPatient`→`setClinical` ใน monolith) — ประวัติ 2 มุม + เมนูตัวดูรูปคลัง
9. **แก้บั๊กตัวนับเหตุการณ์** ไม่ลดตอนกรองรูปซ้ำ (`imgEventCount` จาก `imgSource`)
10. 🐛 **แก้บั๊กใหญ่: AvatarLightbox ลากรูป SVG ไม่ได้ตอนซูมสูง** (แนวนอนล็อก · แนวตั้งได้) — SVG `naturalWidth`=200 ≠ ขนาดเรนเดอร์จริง 1067 → `baseSize()` คิดขอบเขตลากเล็กจิ๋ว · **แก้: `baseSize()` อ่าน `imgRef.current.offsetWidth/offsetHeight`** (ขนาดจริง ถูกทุกชนิด) + guard หารศูนย์ที่ baseSize/fitRatio/onLoad · minimap ตรงตาม

**ไฟล์:** `app/api/patient/images/log/route.ts` · `app/legacy/parts/shared.jsx` (AvatarLightbox) · `parts/patient-images/image-log.jsx` (หลัก) · `parts/patient-images/library.jsx` · `tb-monolith.jsx` · `login/page.tsx` · CLAUDE.md · README.md

## 🎓 บทเรียนสำคัญ (จดลง skill แล้ว)
- 🔴 **ห้ามเคลม "บั๊กหาย" จากค่าภายใน (transform tx / ตัวเลข JS) ทั้งที่ลากจริงยังไม่ขยับ** — พี่กันจับได้ ("มาบอกว่าหายได้ไงวะ") → **ต้องพิสูจน์ด้วยภาพ/พฤติกรรมจริง**
- 🔴 user บอกเงื่อนไขเทส ("ซูม 1000%") = **เทสตามนั้น ห้ามเปลี่ยนเป็น 200% เอง**
- 🔴 แก้เสร็จ HMR อาจไม่เข้า tab user → **Ctrl+Shift+R** ก่อนสรุปว่าแก้ไม่ได้ผล
- 🔴 **เทส pan lightbox อัตโนมัติ: CDP left_click_drag แพนไม่ได้ (ทั้งรูปถ่าย/SVG)** → ต้อง JS `dispatchEvent` mousemove บน div backdrop (zIndex 10001) แล้ววัด `getBoundingClientRect().left` ก่อน/หลัง (พิสูจน์ moved=-6000 = แก้ติดผล)
- ✅ เทส "หน้าจริง" ใน Chrome ที่ล็อกอิน (claude-in-chrome) ไม่ใช่ mock — แต่**ไม่ต้องเทสทุกครั้ง** (พี่กันเทสเอง/มือถือ 192 ได้)

## 🔭 งานต่อไป / ค้าง
1. **(เล็ก · ถ้าพี่กันอยากได้)** กด "เวชระเบียน" แล้วกด "กลับ" ตอนนี้กลับมาหน้า**คลังรูป** (ไม่ใช่ประวัติเป๊ะที่กดมา) — ถ้าอยากให้กลับหน้าประวัติเป๊ะ ต้องยก `libView` ขึ้นระดับบน
2. **0.8:** คลังความรู้ TB + PDF viewer + ระบบเตรียมเคส (roadmap = `docs/idea-0.8.md` + `docs/ideas.md`)
3. **ค้างไกล:** bug audit · split monolith · 0.9 AI · 1.0
- ✅ v0.7.21.1/.2/.3 + v0.7.22.0 พี่กันเทสครบ (Chrome + มือถือ 192.168.34.126:3000)

## หมายเหตุ
- LAN IP = **192.168.34.126** (เท่าเดิม · R2 CORS อนุญาตแล้ว · IP ไม่เปลี่ยน)
- dev server รัน `0.0.0.0:3000` (เข้าจากมือถือได้)
- ⚠️ `scripts/rollback-cleanup-easter-egg-log.sql` (untracked · ไม่ใช่ของเรา) = ไม่ commit
- ดู [[session-tb-dashboard-2026-07-05]] (session ก่อน v0.7.21.3)
