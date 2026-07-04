---
name: TB Dashboard session 2026-06-01 part 4 — v0.7.17.3 Phase 4A+4B + ScrollNav + Boot flow
description: Phase 4 frontend ปิดงานครบ — Activity Log default 30 วัน + Session History pagination/filter + ScrollNav (React Portal) + Profile modal height conditional + Boot flow ลื่น (early-return V2Skeleton)
type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# v0.7.17.3 — Phase 4 Frontend ปิดงานครบ (2026-06-01 evening session)

**Commits:** 6ca9ec8 (main) + 172a9f9 (chore) บน main branch

## 🎯 Phase 4A — Activity Log default 30 วัน
- `ActivityLogTab` (~line 4496): `const [fTime, setFTime] = useState('30d')` แทน `useState('')`
- หน้าเปิด → default แสดง 30 วันล่าสุด · เปลี่ยน preset อื่นได้ตลอด
- ลด query load + ข้อมูลเกี่ยวข้องกว่า

## 📜 Phase 4B — Session History Revamp ครบวงจร

### Backend (`app/api/auth/sessions/history/route.ts`)
- Query params ใหม่: `page`, `pageSize`, `since`, `until`, `device`, `status`, `q`
- Response: `{ rows, total, hasMore, page, pageSize }`
- pageSize clamp 10-100 (default 50)
- Status: `active` (end_reason IS NULL) | `manual` | `session_expired` | `forced_by_user` | `forced_by_admin`
- TypeScript fix: cast `(data as any[])` แก้ "Property length does not exist on type never"

### Frontend (`SessionsPanel` + `SessionPagination`)
- `SessionPagination` component ใหม่ — เลขหน้า `< 1 2 3 ... 12 >` + window ±2 + ellipsis + highlight + บรรทัด "แสดง X-Y จาก Z รายการ · หน้า A / B"
- Filter panel เลียนแบบ ActivityLogTab: search (debounce 400ms) + อุปกรณ์ + ช่วงเวลา (today/7d/30d/all/custom + date range) + สถานะ 6 ตัว + ล้างค่า
- Default: 30 วันล่าสุด + pageSize 50
- **แถวเดียว**: `flexWrap: nowrap` + search หด `flex: '1 1 80px'`
- **Row clickable**: กดที่ IP / ชื่ออุปกรณ์ / ป้ายสถานะ → set filter อัตโนมัติ
- **Optimistic UX**: keep data + dim 55% + chip "กำลังกรอง" มุมขวาบนตอน refresh (`historyRefreshing` แยก `historyLoading`)
- **Stable height**: `minHeight: 200px` + `position: relative` → กรอบไม่หดตอน loading

## 🔼 ScrollNav — ปุ่มลอย ▲▼ (3 จุด)

**ติดตั้งที่:**
1. Main content (line 7447) — `mainScrollRef`, zIndex 30
2. SessionsPanel history (line 10782) — `getScrollContainer()` walk parent, zIndex 9990
3. ChangelogPage right col — `rightColRef`

**Critical bug + fix:**
- `position: fixed` ใน element ที่อยู่ใต้ `modal-A` (มี CSS transform animation) ถูก position **เทียบกับ modal-A ไม่ใช่ viewport** ตาม CSS spec
- ครั้งแรกใส่ปุ่มที่ z=9990 → ปุ่มโผล่นอกโมดอลที่มุม viewport ผิดที่
- **Fix:** ใช้ `React.createPortal` render ที่ `document.body` → หนีออกจาก subtree ของ modal-A → position:fixed ทำงานถูกต้อง

**Position calc:**
- ใช้ `container.getBoundingClientRect()` แล้วคำนวณ `right = innerWidth - rect.right + 16` / `bottom = innerHeight - rect.bottom + 16`
- ปุ่มเกาะมุมล่างขวา **ของกรอบจริง** ไม่ใช่ viewport
- recompute ทุก 800ms + on resize เผื่อ layout เปลี่ยน

**สไตล์:**
- ปกติ: พื้นขาว 70% + `backdrop-blur: 4px` + ขอบเทล 25% + อักษรเทล + เงาเบาๆ
- Hover: solid teal + ขาว + ยกตัว -2px + เงาเข้ม
- ลำดับ iteration: solid teal เด่นเกิน → พี่กันบอก "อ่อนใส จางๆ" → เปลี่ยนใส

**z-index strategy:**
- main app ScrollNav = 30 (ต่ำกว่า modal overlay z:50 → ถูกบังเวลามี modal เปิด ถูกต้อง)
- modal-internal ScrollNav = 9990 (อยู่บนสุดเหนือ modal ตัวเอง)

**Threshold:** 50px (ลดจาก 120) → ปุ่มโผล่ไวขึ้น

**Cleanup:** ChangelogPage ลบปุ่ม back-to-top เดิม + `showBackToTop` state + `onScroll` handler → แทนด้วย ScrollNav

## 🪟 Profile modal — height conditional ตาม mode

```jsx
...(mode === 'profile'
  ? { maxHeight: 'min(88vh, 720px)' }      // หดตาม content (ไม่โล่ง)
  : { height: '88vh', maxHeight: '720px' }) // ล็อค size (กรอบนิ่งตอน filter)
```

- **mode='profile'** → maxHeight ลื่นได้ → กรอบหดตาม content (พี่กันบอก fixed อันแรกแล้วโล่ง)
- **mode='sessions' / 'changePassword'** → height fixed → กรอบนิ่งตอน filter ไม่ขยับ
- **รองรับทั้ง 1080p (cap 720px) และ 768p รพ (88vh = 676px)** — ไม่ตันจอเล็ก

## 🚀 Boot flow — ตัดขั้นโหลดกลางจอ

**เดิม:** LoginSpinner → V2Skeleton → "กำลังโหลดข้อมูล" spinner กลางจอ → dashboard (4 ขั้น 2 loading state)

**ใหม่:** LoginSpinner → V2Skeleton → dashboard ตรงไป (3 ขั้น 1 loading state)

**วิธี:** ใน `App()` function — early-return `<V2Skeleton />` ถ้า `dbLoading === true` (line 7164 เดิม) แทนการ render layout + spinner กลางจอ (line 7438 เดิม) · `import V2Skeleton from '../components/V2Skeleton'`

## 🐛 Bug fixes
- Filter panel ตอน loading หดสั้นลง → wrap minHeight + position relative + overlay spinner
- "น่าสงสัย" filter ไม่เหมาะ (user ดูประวัติของตัวเอง) → ลบออก เปลี่ยนเป็น dropdown "สถานะ"
- TypeScript build error → cast `(data as any[])` ใน sessions/history route

## 💡 Lessons

1. **CSS `transform` บน ancestor → `position: fixed` ใน descendant กลายเป็น relative ต่อ ancestor** (CSS containing block spec) → React Portal ไปที่ `document.body` คือคำตอบ
2. **Keep data + dim + chip** = UX ดีกว่า skeleton เต็มจอตอน filter (เหมือน Google search)
3. **Modal height conditional ตาม mode** = pattern ดี ไม่ต้องบังคับทุก mode ใช้ขนาดเดียว · profile โล่งถ้าล็อค · sessions ต้องล็อคเพื่อ filter ไม่ขยับ
4. **Boot flow 1 loading state พอ** ไม่ต้อง 2-3 ขั้น · early-return Skeleton จนกว่าข้อมูลพร้อม
5. **`flexWrap: nowrap` + `flex: 1 1 80px`** บน search input = บังคับ filter row เดียว · search หดอัตโนมัติ
6. **z-index strategy ในแอปที่มี modal**: main = ต่ำ (ถูกบังด้วย overlay 50) · modal-internal = สูง (เหนือ overlay ตัวเอง)
7. **Browser cache issue หลัง rebuild**: chunk filename เปลี่ยน → cached HTML ชี้ไป chunk ที่หาย → 500 · แก้ Ctrl+Shift+R

## 📝 Memory rule ใหม่
- [`feedback_explain_browser_steps.md`](feedback_explain_browser_steps.md) — อธิบายขั้นกด UI/browser ให้พี่กัน เริ่มจาก keyboard shortcut ก่อน · ห้ามใช้ "คลิกขวาที่ปุ่ม refresh"
