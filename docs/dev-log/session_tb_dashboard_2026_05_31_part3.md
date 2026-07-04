---
name: session-tb-dashboard-2026-05-31-part3
description: 🎨 v0.7.14.4 — Brand visual refresh (icon 3 สี + font Manrope + sidebar ขยาย)
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-31 (part 3) — v0.7.14.4 Brand Visual Refresh

## 🎯 เป้าหมาย
Visual refresh ของ brand identity — icon ปอด 3 สี + font Manrope + sidebar ขยาย
(หลัง v0.7.14.3 patch UX/bug fixes)

## ✅ ที่ทำ

### 🎨 Icon ปอด-ไวรัส 3 สี ทั่วเว็บ (6 จุด)
- ปอด+หลอดลม `#0d9488` (teal — ที่ตั้งของการอักเสบ)
- Macrophage `#fbbf24` (amber — เซลล์ภูมิคุ้มกันกลืน Mtb)
- Mtb 2 จุดใน phagosome `#e11d48` (rose-600 = carbol fuchsin AFB+)
- **สื่อ pathophysiology TB จริง** — เภสัช/หมอตีความได้ทันที (Mtb = bacteria ไม่ใช่ virus)
- กระจาย: Login (130x104) / Sidebar (44x36) / About (36x30 ในกรอบขาว 64x64) / Email (26x22 ในกรอบขาว 44x44) / Register (60x48) / Favicon (app/icon.svg)
- **About + Email** bg teal เข้ม → เพิ่มกรอบขาว rounded เพื่อ contrast

### ✍️ Font "TB JOURNEY & CARE"
- **Manrope weight 800** เป็น brand font หลัก (sans-serif modern premium rounded)
- **Plus Jakarta Sans** เฉพาะตัว "&" — ampersand บางและ refined กว่า → flow ดีขึ้น
- pattern: `<span style="font-family:'Plus Jakarta Sans'">&</span>` ครอบกลางคำ
- กระจาย 5 จุด: Login h1 (35px) / Sidebar (17px) / About (18px) / Email (22px) / Register (12px)

### 📐 Sidebar + Login ขยาย
- Sidebar: 240 → **260px** (กัน "CARE" ตก)
- Sidebar icon: 22x18 → **44x36** (2 เท่า) + span container 36 → 56px
- Sidebar text maxWidth: 140 → 190px
- Sidebar font: 15px/700 → 17px/800 + Manrope + ls -0.3px
- Login icon: 100x80 → **130x104** (+30%)
- Login h1: 28px → **35px** (+25%) + Manrope/800 + ls -0.7px + nowrap

### 📦 Google Fonts เพิ่ม
- `app/layout.tsx` + `public/app.html`: เพิ่ม Manrope + Plus Jakarta Sans (weight 600/700/800)

### 🗑 ลบ FA class ใน Register
- `<i className="fa-solid fa-lungs-virus text-5xl"/>` → inline SVG 3 สี

### 🧪 ระหว่างทาง — ลอง 13 ฟอนต์เปรียบเทียบในหน้า login
Playfair Display / Cormorant Garamond / Cinzel / DM Serif Display / Lora / Inter / Geist / **Manrope ✅** / **Plus Jakarta Sans (& only) ✅** / Outfit / DM Sans / Onest / Hanken Grotesk

## 📦 Push (2 commits)

### Commit #1 (force push หลัง user ขอ message ละเอียด)
- `73757b9` / `73757b97a72e259f29695370a1257fa617b08137`
- 8 files / +61 / -24
- ไฟล์ใหม่: `app/icon.svg` (favicon 3 สี)

### Commit #2 (อัป pending hash)
- `914623f`
- 1 file / +2 / -2

### ลำดับเหตุการณ์
1. push รอบแรก — commit message สั้น (e253ce1 + ca1a778)
2. user บอก "พุชทับ เขียน commit ละเอียด เคยบอกหลายรอบแล้ว"
3. `git reset --soft HEAD~2` → reset hash กลับ pending → commit ใหม่ละเอียด → force push (73757b9)
4. อัป pending → 73757b9 → commit + push (914623f)

## 📝 Version
- APP_VERSION: 0.7.14.3 → **0.7.14.4**
- BUILD_DATE: 31 พ.ค. 2569 (วันเดียวกับ 0.7.14.3)
- login footer: Version 0.7.14.4
- Cache buster: v=74 → v=75

## 🚧 ต่อไป
- **v0.7.15.0** Comment overhaul + Performance Optimize
  - pre-compile JSX (เลิก Babel standalone)
  - Virtualization 65 version cards (react-window)
  - Code-split CHANGELOG data 263KB
  - แก้เคอร์เซอร์ขาวบน local
- Body checkup v0.7.14.0/14.1/14.2/14.3/14.4 (รอบเดียวอีก 2-3 versions)

## 💡 Lesson Learned

### Brand design
- **Icon meaningful > generic** — 3 สีสื่อ pathophysiology ดีกว่า solid color
- **Font กลางคำได้** — ใช้ `<span style={fontFamily}>&</span>` แทน font หลัก
- **Sans modern premium** Manrope = ทางเลือกฟรีที่ใกล้ Söhne/Styrene (Anthropic)
- **กรอบรอบ icon** บน dark bg — ต้องใส่ขาว ไม่ใช่ teal-100 (กลืน gradient)

### CSS font sizing
- `fontSize` 26px เท่ากันทุก font → visual ไม่เท่ากัน (cap-height ต่าง)
- ต้องปรับ size รายตัว — Cinzel (caps) ต้องเล็กกว่า ~5px

### Git workflow
- **Commit message ต้องละเอียดทุกครั้ง** (user ย้ำหลายรอบแล้ว) — ใช้ HEREDOC + section headers + ไฟล์ที่แตะ + version + roadmap
- chicken-egg: commit hash อ้างถึงตัวเองไม่ได้ → ต้อง 2 commits (1=feat, 2=chore: update hash)

## 🩹 ที่ผิดพลาดในรอบนี้
- icon redesign แบบ "ปอด anatomy" — user บอก "ดูเป็นอัณฑะมากกว่าปอด" → กลับมาใช้ fa-lungs-virus path เดิม
- เข้าใจผิด "ขอบ" เป็น "ปอด" → user หงุดหงิด ("ทำไมโง่อย่างงี้วะรำคาญ")
- เข้าใจผิด "กลับสี" — ใช้ teal solid → user อยากได้ "ขาวล้วน bg เข้ม"
- commit message สั้น → user บอก "พุชทับ เคยบอกหลายรอบแล้ว"

ดู [[session-tb-dashboard-2026-05-31]] · [[session-tb-dashboard-2026-05-31-part2]] · [[feedback_push_flow]] · [[tb-dashboard-pending-master]]
