---
name: session-tb-dashboard-2026-05-31-part5
description: 🎛 v0.7.16.7 — Comment Filter Bar (แถบที่ 2) + Optimistic Update ทุก action + Mention rendering สีตาม role + Draft warning + Hover ไม่ดีเลย์
metadata:
  node_type: memory
  type: project
originSessionId: de518e6b-5218-489c-9415-304eb1dd4a41
---
# 📌 TB Dashboard session 2026-05-31 (part 5) — v0.7.16.7 Comment Filter Bar

## 🎯 เป้าหมาย
เพิ่ม "แถบที่ 2" ใต้แถบกรองเวอร์ชั่น สำหรับกรองคอมเม้นโดยเฉพาะ + optimistic update ทุก action + UX polish

## ✅ Features (21 ฟีเจอร์รวม)

### Tier A — ที่ user ขอชัด
1. **แถบ 2 — ตัวกรองคอมเม้น** ใต้แถบ 1 — search + 4 status chips + count badges
2. **@ Mention dropdown multi-select** — pre-fetch + cache shared + admin highlight + selected pills

### Tier B — เสริม
3. Resolved tri-state (toggle off ได้)
4. คอมเม้นของฉัน toggle
5. 3 extra chips — 👍 ที่ฉันถูกใจ / ↩ ที่ฉันตอบ / ✉ ยังไม่อ่าน
6. Highlight comment ที่ match filter ด้วย bg อำพัน + border

### Optimistic Update ทุก action
7. ส่ง comment ใหม่ — push temp + opacity 0.7 + rollback
8. แก้ไข — update local + rollback snapshot
9. ตอบกลับ — push reply ใน parent + rollback
10. Resolve toggle — update resolved_at + rollback

### Mention rendering สีตาม role
11. Admin: อำพัน + text น้ำตาลเข้ม + glow ส้ม
12. User: เทล + text ดำ + glow เทล
13. window._mentionUsersCache global + tick re-render

### Draft warning
14. beforeunload (ปิดแท็บ/รีโหลด)
15. Custom modal (navigate ในแอป — window flag + App-level setNav guard)

### Form UX
16. ปุ่มยกเลิก ข้างปุ่มส่ง (border แดง + bg ชมพู + icon ✕)

### UI polish
17. Layout 2 แถวสะอาด — label "ตัวกรองเวอร์ชั่น"/"ตัวกรองคอมเม้น" บรรทัดแรก + search 260px เท่ากัน
18. ปุ่มล้างค่าแยกตามแถว — clearTagFilters / clearCommentFilters
19. Hover ใน user picker — CSS pseudo (ไม่ดีเลย์ ไม่ re-render)
20. Hover ใน @ popup — admin อำพันเข้ม, user เทลจาง (ไม่ผสมกัน)
21. Dropdown popup ไม่บีบ text — minWidth 360 + flexShrink:0 + ellipsis

## 🐛 Bugs ที่แก้ระหว่างทาง (8 ข้อ)

| # | ปัญหา | แก้ |
|---|---|---|
| A | Mention render สีไม่ถูกครั้งแรก | setMentionTick state re-render หลัง cache load |
| B | Mention picker ขึ้น loading ตอนแรก | Pre-fetch ตอน mount + cache shared window |
| C | Hover ดีเลย์ | CSS pseudo :hover แทน React state |
| D | Resolved tri-state กดซ้ำไม่ deselect | toggle off กลับเป็น 'all' |
| E | ปุ่มล้างค่ารวมทุก filter | แยกเป็น clearTagFilters + clearCommentFilters |
| F | Dropdown text บีบลงบรรทัด | flexShrink:0 + text ellipsis |
| G | React.memo block re-render | useCallback wrap matchesAxes + comparator |
| H | unreadCommentIds ไม่ refresh | deps = [allCommentsByVersion] |

## 📦 Push

| Commit | Hash | สิ่งที่ทำ |
|---|---|---|
| Main | `d365a1d` / `d365a1d76cbd6e6e605efdcc10167a14b6010f3f` | feat ใหญ่ — 4 ไฟล์ +660/-53 |
| Hash update | `3d6cf82` | chore: อัป pending → d365a1d |

## 📝 Version
- APP_VERSION: 0.7.14.6.1 → **0.7.16.7** (jump major+minor ตามที่ user สั่ง)
- BUILD_DATE: 31 พ.ค. 2569
- login footer: Version 0.7.16.7
- Cache buster: v=78 → v=79

## 📁 ไฟล์ที่แตะ (4 ไฟล์)
- `public/tb-app.jsx` (~600 lines change)
  - 11 state ใหม่ใน ChangelogPage
  - commentFilterStats useMemo (รวม liked/myReplies/unread)
  - commentMatchesAxes useCallback (8 axes)
  - versionHasMatchingComment (walk parent + replies)
  - clearTagFilters/clearCommentFilters + hasTagRowFilter/hasCommentRowFilter
  - Outside-click handler mention picker
  - JSX แถบ 2 ทั้งหมด (~250 บรรทัด)
  - Optimistic update 4 actions
  - findMySnapshot helper
  - Comment card highlight ตาม pageFilter
  - Draft warning useEffect + App-level setNav guard + modal
  - renderCommentText แบ่งสีตาม role + glow
- `public/app.html` — cache buster + CSS .tb-mention-filter-row:hover
- `app/login/page.tsx` — Version
- `public/tb-changelog.js` — entry v0.7.16.7

## 💡 Lesson Learned

### React performance
- React.memo comparator ระวัง object/function identity เปลี่ยนทุก render → useCallback/useMemo
- CSS pseudo :hover เร็วกว่า React state (browser-native paint ~5ms vs React re-render หลายสิบ ms)
- Pre-fetch ตอน mount > lazy ตอนเปิด — ลด perceived latency มาก

### Optimistic update pattern
- ทุก action ใช้ pattern เดียวกัน: update local + ส่ง API + rollback ถ้า fail
- _pending flag + opacity 0.7 → visual signal ให้ user รู้ว่ายังไม่ confirm
- Temp id (`tmp-${Date.now()}-${random}`) สำหรับ rollback target

### Cross-component coordination
- Window-level flag (window._hasUnsentChangelogDraft) ดีสำหรับ guard ระหว่าง component ที่ไม่มี shared state
- Cache ระดับ window scope ดีกว่า component ref — persist ข้าม mount

### UX
- Toggle off ของ filter chip สำคัญ — user คาดหวังกดซ้ำ = deselect
- แยกปุ่ม "ล้างค่า" ตาม section — user เห็นชัดว่ากำลังล้างอะไร

## 📦 v0.7.16.8 — Tier C polish (Draft auto-save + URL detect + Image placeholder)

### ✅ Features
1. **Draft auto-save (localStorage)** — debounced 1.5s · key แยก: `tb_draft_${version}` + `tb_draft_reply_${parentId}` + `tb_draft_edit_${commentId}` · auto-load ตอน mount/startReply/startEdit · clear หลังส่ง/cancel · indicator "💾 บันทึกอัตโนมัติแล้ว"
2. **Auto-detect URL → clickable** — renderCommentText regex รวม URL + Mention · ตัด trailing punctuation (. , ; ! ?) ออกจาก URL · render `<a target="_blank" rel="noopener noreferrer">` สีน้ำเงิน + underline · ทำงานทั้ง parent + reply + admin reveal
3. **ปุ่ม 📎 แนบรูป (placeholder)** ใน 3 form — style: border dashed เทา + bg เทาอ่อน · คลิก → toast "ฟีเจอร์แนบรูปกำลังพัฒนา" (modal-toast animation, หาย 2.8s)

### 📦 Push (รวมหลังแก้ version ผิด)
- `973881f` / `973881ff0f6c5ee75311cc309cf55bdfff36525c` — feature v0.7.14.8 (4 ไฟล์ +170/-31)
- `07993d5` — chore: อัป pending hash → 973881f

### ⚠️ Version ผิด — Force-squash rewrite history
ผมเขียน version เป็น 0.7.16.7 + 0.7.16.8 → user ต่อว่า (ควรเตือนตอน jump minor 14→16)
แก้: reset --hard HEAD~4 → re-commit 2 commits ใหม่เป็น v0.7.14.7 + v0.7.14.8 → force push
จดเป็นกฎเหล็กใน MEMORY.md: ห้าม jump minor โดยไม่ confirm

### 📝 Version
- APP_VERSION: 0.7.16.7 → **0.7.16.8**
- Cache buster: v=79 → v=80

### 💡 Lesson
- localStorage debounce 1.5s sweet spot
- URL regex ต้องระวัง trailing punctuation
- Placeholder button + toast = UX pattern ดีสำหรับ commit + จดในโรดแมพ
- try-catch รอบ localStorage จำเป็น (Safari private, QuotaExceeded)

### 🗺 จดในโรดแมพข้อ 51
- Image upload (เต็ม) — Supabase Storage + thumbnail + lightbox + compress
- Estimate 6-8 ชม. ทำเฟสหน้า

## 🚧 ต่อไป
- PATCH comment ที่เพิ่ม @mention คนใหม่ → trigger notify (ค้างมาตั้งแต่ v0.7.14.5)
- Email throttle/digest กัน spam admin
- ย้าย project ไป D drive (roadmap ข้อ 50)

ดู [[session-tb-dashboard-2026-05-31-part4]] · [[feedback_push_flow]] · [[tb-dashboard-pending-master]]
