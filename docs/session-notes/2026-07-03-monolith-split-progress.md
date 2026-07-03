# 🔧 สถานะการผ่าไฟล์ยักษ์ tb-monolith.jsx (handoff สำหรับแชทใหม่)

> **แชทใหม่: อ่านไฟล์นี้ให้จบก่อนทำต่อ** — ไฟล์ plan เดิม (`~/.claude/plans/*.md`) อยู่นอก repo หายไปแล้ว
> ข้อมูลทั้งหมดที่ต้องใช้อยู่ในไฟล์นี้

## เป้าหมาย
ผ่า `app/legacy/tb-monolith.jsx` (เดิม 13,476 บรรทัด = ทั้งแอปหน้าบ้านในไฟล์เดียว) ออกเป็นไฟล์ย่อยใน
`app/legacy/parts/` ทีละเฟส **ย้ายโค้ดล้วน ไม่แก้ logic** โดย `tb-monolith.jsx` ยังเป็น entry ที่
`export default App` (TbBundle.tsx ไม่ต้องแก้)

## กฎสำคัญ (จากผู้ใช้)
- **ถามก่อน push ทุกครั้ง** — แต่ผู้ใช้อนุมัติให้ลุยทุกเฟส + merge เข้า main ได้เลยในรอบนี้
- **เวอร์ชันแต่ละเฟส = `0.7.19.6.X`** (X รันทีละเฟส ไม่ใส่ 0 นำ เช่น .1 .2 ... .10)
- commit message ละเอียด (goal / what / why / files)
- 1 เฟส = 1 branch = 1 commit = 1 PR merge เข้า main

## ✅ เฟสที่เสร็จแล้ว (เข้า main หมด, build ผ่านทุกเฟส)
| เฟส | เวอร์ชัน | ไฟล์ที่สร้าง | ย้ายอะไร |
|---|---|---|---|
| 1a | 0.7.19.6.1 | `parts/globals.js` | window.* จาก tb-data (ADR_LIST, calcDoses, Chart, INITIAL_PATIENTS, generateAlerts, DEFAULT_DRUGS, DEFAULT_RESTART_REASONS, PROFESSION_LABELS_TH, PROFESSIONS ฯลฯ) |
| 1b | 0.7.19.6.2 | `parts/shared.jsx` | useModalAnim, INP, FormSection, FieldError, RangeStatus, Badge + ลบ dead code `Object.assign(window,{...})` |
| 1c | 0.7.19.6.3 | `parts/shared.jsx` (+) | ConfirmModal, ToastModal, Field, FilterSelect, StatusBadge, ScrollNav |
| 1d | 0.7.19.6.4 | `parts/shared.jsx` (+) | relTime, r2AvatarUrl, normName, nameInitials, AVATAR_PALETTE, colorFromName, AvatarCircle |
| 2 | 0.7.19.6.5 | `parts/changelog.jsx` | ChangelogPage, CommitDetailModal, CHANGELOG_STATUS_META, ChangelogCommentSection |
| 3a | 0.7.19.6.6 | `parts/storage.jsx` | StorageMiniCard, StorageDonut, StorageDetail, StorageAlert + `_settingsWantTab` → `window._settingsWantTab` |
| 3 | 0.7.19.6.7 | `parts/admin.jsx` | AdminUsersTab, ActivityLogTab, AuditLogTab, AdminSettings + tables/activity helpers |
| 4 | 0.7.19.6.8 | `parts/misc.jsx` | TrashList + KnowledgeBase (ย้ายตรง — พึ่งแค่ useState/useEffect + window.loadTrashedPatients/_sb, ไม่มี cross-dep) |

**ผลลัพธ์ปัจจุบัน:** shell เหลือ ~8,007 บรรทัด (จาก 13,476) · parts มี 7 ไฟล์: globals.js, shared.jsx, changelog.jsx, storage.jsx, admin.jsx, misc.jsx

## ⏳ เฟสที่เหลือ (4 เฟส)
| เฟส | เวอร์ชัน | ไฟล์ | ย้าย |
|---|---|---|---|
| 5 (images) | 0.7.19.6.9 | `parts/patient-images.jsx` | PatientImagesTab, ImageLibraryPage, ImageTrashPage, CXRComparePanel/Modal, TrashHub + image helpers |
| 6 (account) | 0.7.19.6.10 | `parts/account.jsx` | UserProfileModal, AvatarLightbox, SessionsPanel, ChangePasswordPanel + avatar crop/upload helpers |
| 7 (patient-modal) | 0.7.19.6.11 | `parts/patient-modal.jsx` | ClinicalModal + 8 tabs + DoseCalculator, DOTCalendar, VisitForm, DrugInteractionPanel (**หนักสุด — เทสต์กราฟ Chart.js แท็บ Lab**) |
| 8 (dashboard) | 0.7.19.6.12 | `parts/dashboard.jsx` | Dashboard, PatientList, ArchiveList, AllPatientsPage, WeeklyPrep, Reports + MONTH_LABELS/FAKE_* |

## 🛠️ สูตรทำแต่ละเฟส (ทำแบบนี้ทุกครั้ง)
1. `git checkout main && git pull && git checkout -b refactor/split-phase-X-<name>`
2. หา line boundaries: `grep -nE '^(function|const) (ComponentName)\b' app/legacy/tb-monolith.jsx`
   (บรรทัดขยับทุกเฟส ต้อง grep ใหม่เสมอ) — หาปลายด้วย `sed -n 'A,Bp'`
3. สร้าง part file: header (`'use client'` + `import * as React` + `const {useState,useEffect,useRef}=React`
   + import จาก `./shared` `./globals` `./storage` เท่าที่ใช้) + บล็อกที่ sed ออกมา + `export { ... }`
   - ตัวอย่าง extract: `{ echo "header..."; sed -n 'A,Bp' tb-monolith.jsx; echo "export {...}"; } > parts/X.jsx`
4. **eslint no-undef หา dependency ที่ขาด** (ดู §เครื่องมือ) → เติม import ให้ครบ
5. ลบบล็อกจาก shell: `sed -i 'A,Bd' tb-monolith.jsx` (ระวัง off-by-one ที่ `}` ปิดฟังก์ชัน!)
   + เพิ่ม `import { ... } from './parts/X'` ที่ shell + แก้ comment ค้าง
6. bump version 2 ที่: `APP_VERSION` ใน tb-monolith.jsx + `Version` ใน app/login/page.tsx
7. `npm run build` (ใส่ env หลอก ดู §เครื่องมือ) ต้องผ่าน + eslint ทุก parts ต้องสะอาด
8. commit ละเอียด → push → เปิด PR → merge เข้า main → sync main

## ⚠️ กับดักที่เจอมาแล้ว (ต้องระวัง)
1. **eslint config มี Chart/supabase/React/process เป็น global** → no-undef ไม่จับ bare `Chart`/`supabase`
   → ต้อง grep เองว่า part ใช้ bare Chart/supabase ไหม แล้ว import จาก globals ถ้าใช้
2. **sed ลบบล็อกมัก off-by-one ที่ `}` ปิดฟังก์ชัน** → เช็ค seam หลังลบทุกครั้ง (ดูว่ามี `}` ค้าง)
3. **createPortal**: component ที่ render ผ่าน Portal (StorageAlert, ScrollNav, modal บางตัว)
   ต้อง `import { createPortal } from 'react-dom'` ใน part — build ไม่จับ (runtime error) แต่ no-undef จับ
4. **eslint no-undef ที่ grep แค่ "is not defined" จะพลาด parse error** → ดู output เต็ม (`| tail -15`)
5. **repo เป็น shallow clone** → ห้าม regenerate changelog (`generate-changelog.mjs`) จนกว่าจะ
   `git fetch --unshallow origin` ก่อน (ไม่งั้น changelog พังหมด ลบพันบรรทัด)
6. **changelog generator รองรับเวอร์ชันแค่ 4 ช่วง** → `0.7.19.6.X` ถูกตัดเหลือ `0.7.19.6` รวมกลุ่มเดียว
   → ข้ามการ regenerate changelog รายเฟสได้ (ทำทีเดียวตอนจบ) ไม่ใช่เรื่องคอขาดบาดตาย
7. **cross-dependency**: บาง domain ใช้ของ domain อื่น → ต้องย้ายตัวที่ใช้ร่วมเข้า shared ก่อน
   (ทำมาแล้ว: avatar→shared เฟส 1d, storage แยกก่อน admin เฟส 3a)
8. **APP_VERSION**: parts อ่านผ่าน `window.APP_VERSION` (shell ตั้ง `window.APP_VERSION = APP_VERSION`)
   เพราะ APP_VERSION ต้องอยู่ shell ตามธรรมเนียม version bump
9. **git config**: ตั้ง `user.email noreply@anthropic.com` + `user.name Claude` ก่อน commit (ให้ขึ้น Verified)
10. **package-lock.json**: ถ้า npm install ไปแก้มัน ให้ `git checkout -- package-lock.json` (อย่า commit)

## 🧰 เครื่องมือ
**eslint no-undef** (ติดตั้งแล้วด้วย `npm i --no-save eslint@9 globals`):
```bash
# config อยู่ที่ scratchpad (นอก repo) — ถ้าหาย สร้างใหม่: flat config, files *.jsx/*.js,
# globals: browser + es2021 + React/Chart/supabase/process readonly, rule no-undef:error,
# import globals ด้วย absolute path จาก node_modules/globals/index.js
npx eslint --config <scratchpad>/eslint-noundef.mjs app/legacy/parts/*.js app/legacy/parts/*.jsx
```
**build ด้วย env หลอก** (เครื่องคลาวด์ไม่มี Supabase key จริง — build จริงจะ fail ตอน prerender ถ้าไม่ใส่):
```bash
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_placeholder" \
SUPABASE_SERVICE_ROLE_KEY="sb_secret_placeholder" \
npm run build
```
(ต้อง `npm install` ก่อนถ้า node_modules ยังไม่มี)

## 📍 เฟส 5 (images) — พร้อมทำต่อทันที
- component ที่ต้องย้าย (grep ใหม่เสมอ): PatientImagesTab, ImageLibraryPage, ImageTrashPage,
  CXRComparePanel, CXRCompareModal, TrashHub (+ image helpers เช่น loadCache)
  → ล่าสุดกลุ่มนี้อยู่แถว ~2152–2900 ใน shell แต่ต้อง grep ใหม่ (บรรทัดขยับหลังเฟส 4)
- ⚠️ TrashHub เรียก TrashList (อยู่ parts/misc แล้ว) + ImageTrashPage → part images ต้อง
  `import { TrashList } from './misc'` ด้วย (cross-part import ครั้งแรกของโครงการ)
- deps ที่ต้องเช็ค: bare Chart/supabase, createPortal (lightbox/modal), window.* image helpers,
  heic-to/csp, utif (TIFF), presign/confirm fetch — ระวัง import ให้ครบ
- เทสต์หนักกว่าเฟส misc (อัปโหลด/ลบ/กู้คืนรูป) — ผู้ใช้เทสต์ localhost ทีเดียวตอนจบ

## 📝 หมายเหตุรอบนี้ (เฟส 4)
- ผู้ใช้อนุมัติให้ **push เข้า main ตรง ไม่แยกกิ่ง/ไม่เปิด PR** ในรอบนี้ (commit 03e35d7)
- misc ย้ายตรงได้เพราะ self-contained (ไม่ใช้ AvatarCircle/softDeletePatient อย่างที่โน้ตเก่าคาด —
  TrashList แสดงตัวย่อชื่อด้วย div เอง, ลบ/กู้คืนผ่าน props onHardDelete/onRestore จาก App)

## หมายเหตุการเทสต์
เครื่องคลาวด์เทสต์กดจริงไม่ได้ (ไม่มี key + คนละเครื่องกับ localhost ผู้ใช้) → ใช้ build + eslint no-undef
เป็น gate · ผู้ใช้เทสต์ localhost เองทีหลัง ถ้าเฟสไหนพัง `git revert <commit>` ได้สะอาด (ย้ายโค้ดล้วน)
