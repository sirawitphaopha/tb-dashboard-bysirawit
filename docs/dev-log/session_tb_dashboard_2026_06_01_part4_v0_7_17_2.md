---
name: 🎨 TB Dashboard session 2026-06-01 part 3 — v0.7.17.2 Changelog UX Overhaul
description: รวมงานหลัง lazy render — bell scroll multi-fix + ChangelogPage 2-col layout + คอมเม้น→ความคิดเห็น + back-to-top + UX polish
type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# v0.7.17.2 — Changelog Page UX Overhaul (commit 67a75a7 + hash eb61166)

## เริ่มจากเทส v0.7.17.1 → เจอบักกระดิ่ง → ขยาย scope เป็น UX overhaul

### Iteration ของ Bell scroll fix
1. **v0.7.17.2 hotfix**: `highlightCommentId` prop + skip lazy when target in list — แก้กรณี comment ที่ 16+ ไม่อยู่ใน DOM
2. + ขยาย `visibleTimelineCount` ครอบคลุม targetIdx ของ version — แก้กรณี version ที่ 16+ ถูก lazy บัง
3. + Multi-scroll retry 4 รอบ (0/300/700/1200ms) + flash ที่ 1300ms — ครอบคลุม layout shift ตอน lazy mount + comments loading + reflow

→ ทั้ง 3 iteration รวมใน v0.7.17.2

### Changelog Page Layout Refactor (2-column Gmail-style)

โครงสร้างใหม่:
```
Banner 1-line: รวม [83] เวอร์ชัน · ตั้งแต่ v0.5.0 ถึง v0.7.17.2
┌──────────┬─────────────────────────────────┐
│ Filter   │ Version cards (กว้าง +20%)     │
│ Sidebar  │                                 │
│ 260px    │ ⬆️ Back-to-top button          │
│ พับได้   │                                 │
│ scroll   │ scroll อิสระ                   │
│ อิสระ    │                                 │
└──────────┴─────────────────────────────────┘
```

**Key CSS patterns:**
- `height: calc(100vh - 200px)` บน 2-col wrapper
- Each column: `overflow-y: auto`
- `overscroll-behavior: contain` — กัน scroll chain ไปยัง parent
- `scrollbar-gutter: stable` — กัน layout shift เมื่อ scrollbar โผล่/หาย
- `flex-shrink: 0` บน flex children — กันหดเมื่อ parent มี maxHeight

### Filter Sidebar Redesign

- 2 sections collapsible — เริ่ม "พับ" ทั้งคู่
- chips 1-per-row (ข้อความซ้าย + icon ขวา + นับขวา)
- search input full-width (ไม่ทะลุ box)
- chevron toggle ลอยขวา-บน (sticky)
- localStorage จำสถานะ sidebar open/closed

### Hover Hierarchy (4 ระดับ)

ตัวกรองเวอร์ชั่น (teal):
- chips hover: `#f0fdfa` (teal-50) + border `#5eead4`
- header hover: `#ccfbf1` (teal-100) — เข้มกว่า

ตัวกรองความคิดเห็น (amber):
- chips hover: `#fef3c7` (amber-100) + border `#fbbf24`
- header hover: `#fde68a` (amber-200) — เข้มกว่า

→ Visual hierarchy: header > chip (เข้มกว่า = สำคัญกว่า)

### Mention Dropdown 2-line Layout

ก่อน: 1 บรรทัด `@user · ADMIN · ชื่อยาว... · เภสัช (2)` — ชื่อโดนตัด
หลัง:
```
☐ @SirawitP  ADMIN              (2)   ← บรรทัด 1
   นาย สิรวิชญ์ เผ่าผา · เภสัชกร      ← บรรทัด 2
```

- title tooltip ครอบคลุม (hover เห็นเต็ม)
- position: absolute (ออกจาก button ตรงๆ ไม่ลอย fixed)
- maxHeight 240px, overflowY auto

### Back-to-top Button

- วงกลม teal 44x44px มี ⬆️
- โผล่ตอน `scrollTop > 300px` (right column)
- Smooth scroll กลับบน
- Hover: ขยับขึ้น 2px + เข้ม
- position: absolute ของ 2-col wrapper (มุมขวาล่าง)

### Banner Cleanup

ก่อน: ไอคอน scroll + หัวข้อ "ประวัติเวอร์ชั่น" + "รวม X เวอร์ชัน" + chips + "ตั้งแต่..." (3 บรรทัด)
หลัง: "รวม [83] เวอร์ชัน · ตั้งแต่ v0.5.0 ถึง v0.7.17.2" + chips (1 บรรทัด)
- เลข 83 ฟอนต์ 28px Manrope letter-spacing -0.5px (focal point)
- ลบไอคอน + ลบหัวข้อ (ซ้ำกับ nav menu)

### Right Column +20% Wider

- Timeline view: maxWidth 780→936px
- Grouped view: maxWidth 880→1056px

### "คอมเม้น" → "ความคิดเห็น" (23 จุด)

ตามกฎเหล็ก "ห้ามทับศัพท์" ของพี่กัน:
- tb-monolith.jsx: 11 จุด
- tb-changelog.js: 12 จุด

ตัวอย่าง:
- ตัวกรองคอมเม้น → ตัวกรองความคิดเห็น
- ค้นหาข้อความในคอมเม้น → ค้นหาข้อความในความคิดเห็น
- เฉพาะมีคอมเม้น → เฉพาะมีความคิดเห็น
- คอมเม้นของฉัน → ความคิดเห็นของฉัน

### Color Polish

- ปุ่ม "เฉพาะมีความคิดเห็น" (ในกล่องเวอร์ชั่น) → เทา (ไม่ใช่อำพันแล้ว)
- กล่อง "ตัวกรองความคิดเห็น" (ใหญ่) → คืนสีอำพันเดิม
- ตัวเลือก "ความคิดเห็นของฉัน/ที่ฉันถูกใจ/ที่ฉันตอบ/ยังไม่อ่าน" → เทาเหมือนกันหมด
- เก็บสีเขียวไว้เฉพาะ "แท็กผู้ใช้"

## ปัญหาที่เจอระหว่างทำ (iteration history)

### Scroll issue
1. รอบแรก: ใช้ sticky + inner div scroll → scrollbar shift ทำ chips ขยับ
2. เพิ่ม `scrollbar-gutter: stable` → กัน shift ได้แต่ยังเลื่อนไม่สุด
3. ใส่ `flex-shrink: 0` บน filter boxes → กรอบไม่หดแต่ scroll ยังไปกวน page
4. รื้อใหม่: 2-col แยก scroll อิสระแบบ Gmail → จบ

### Mention dropdown position
1. รอบแรก: `position: fixed` กับ JS calculate → ลอยโดดแปลกๆ
2. ลอง flip up/down → ยังโดน taskbar
3. กลับเป็น `position: absolute` ตรงๆใต้ button → ดี
4. แก้ชื่อยาว: 2-line layout + tooltip → จบ

## Push history
- v0.7.17.2 commit `67a75a7` — Changelog UX Overhaul
- hash update commit `eb61166`

## TODO รอบหน้า
- Banner ปรับเพิ่มได้ (user ค้างบอกว่าจะเสนอใหม่)
- ฟีเจอร์อื่นๆใน pending master

## Lessons (UI/UX patterns เก็บไว้ใช้)

### Scroll patterns:
- **2 scroll containers แยก** = standard pattern (Gmail/Outlook/Slack)
- **`scrollbar-gutter: stable`** = ป้องกัน layout shift เมื่อ scrollbar โผล่/หาย
- **`flex-shrink: 0`** บน flex children = กันหดเมื่อ parent มี maxHeight
- **`overscroll-behavior: contain`** = กัน scroll chaining ไปยัง parent
- **`height: calc(100vh - X)`** บน flex wrapper + `flex:1, height:100%` บน children = พื้นที่ scroll คงที่

### Lazy render + DOM scroll:
- ตอน scroll-to-id หา element ที่อาจอยู่ใน lazy เขต → ขยาย visibleCount ก่อน
- Layout shift หลัง mount → multi-scroll retry (3-4 รอบ ใน 1.2 วินาที)
- pass `highlightId` prop เผื่อ component ภายในรู้ว่าต้อง skip lazy

### Visual hierarchy:
- หัวข้อ section: สีเข้มกว่า items ภายใน (เข้ม = สำคัญกว่า)
- Focal point: 1 ตัวเลขใหญ่ ๆ (28px+) ในแบนเนอร์ → ตา user หาเจอเร็ว
- chips 1-per-row + ข้อความซ้าย + icon ขวา = เรียงสวยกว่า inline horizontal

### Mention pickers / user lists:
- 2-line layout = standard กันชื่อยาวๆ (Gmail/Slack ก็ใช้)
- บรรทัด 1: identifier + status badges + meta
- บรรทัด 2: full name (truncate + tooltip)

### Naming:
- "ทับศัพท์" = ผิดสำหรับ user ไทยที่ไม่มีพื้นโค้ด
- comment → ความคิดเห็น เสมอ (เพิ่มในรายการห้ามทับศัพท์)

ดู [[session_tb_dashboard_2026_06_01_part3]] (lazy render) · [[feedback_plain_thai_chat]]
