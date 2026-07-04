---
name: tb-dashboard-session-2026-06-03-avatar-r2
description: กำลังทำระบบอัปโหลดรูปโปรไฟล์ (avatar) + วางรากฐาน Cloudflare R2 · Step 0-3 เสร็จ (R2 setup + DB + API + หน้าจอครอบรูป) เหลือ build/test + Step 4-5 · ⚠️ resume งานนี้ได้เลย
metadata: 
  node_type: memory
  type: project
  originSessionId: 3b74c9fb-7751-4045-ac89-497f22edc1d2
---

# ระบบ Avatar + R2 — ค้างกลางทาง (resume ต่อได้)

**แผนเต็ม:** `C:\Users\User\.claude\plans\popup-animate-resilient-shamir.md` (section "แผนระบบอัปโหลดรูปโปรไฟล์ (Avatar)")

## เป้าหมาย
ระบบอัปโหลดรูปโปรไฟล์ (avatar) + วางรากฐาน R2 ให้ครบ เพื่อต่อยอด CXR ในอนาคต
**Scope รอบนี้:** avatar อย่างเดียว (อัป + แสดง 4 จุด) · ดูโปรไฟล์คนอื่น + CXR = roadmap

## Decisions
- Cloud: **Cloudflare R2** · ตู้ avatar = public (custom domain) · CXR = private (เฟสหลัง)
- Crop: วงกลม + ซูม (react-easy-crop) · ประมวลผลรูปฝั่ง client (Canvas → WebP, EXIF หายเอง)
- Upload: presigned PUT (client อัปตรงเข้า R2) · sign ด้วย aws4fetch

## ✅ เสร็จแล้ว

### Step 0 — R2 setup (พี่กันทำใน Cloudflare)
- bucket `tb-avatars` (public, APAC) · custom domain **img.tbjourney.care** (Access: Enabled)
- API token (Object Read & Write, เฉพาะ tb-avatars) · CORS policy (localhost:3001 + tbjourney.care, PUT/GET/HEAD)
- env ใน `.env.local` ครบ: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_AVATAR=tb-avatars, NEXT_PUBLIC_R2_AVATAR_URL=https://img.tbjourney.care
- ⚠️ env บน Cloudflare Pages dashboard **ยังไม่ได้ตั้ง** (ต้องตั้งก่อน deploy production)

### Step 1 — DB (รัน SQL แล้ว)
- profiles + column `avatar_url` (text) + `avatar_updated_at` (timestamptz)

### Step 2 — Backend API (เขียนเสร็จ)
- `lib/r2.ts` — presignPut() + r2Delete() ผ่าน aws4fetch
- `app/api/profile/avatar/presign/route.ts` — POST → presigned PUT URL (key `avatars/<userId>.webp`)
- `app/api/profile/avatar/confirm/route.ts` — POST → update avatar_url + avatar_updated_at (admin client)
- `app/api/profile/avatar/route.ts` — DELETE → ลบ R2 + ล้าง avatar_url
- npm: aws4fetch ติดตั้งแล้ว

### Step 3 — Frontend (เขียนเสร็จ ใน app/legacy/tb-monolith.jsx)
- import Cropper from 'react-easy-crop' (top)
- `loadImageEl()` + `cropToWebp()` (helper, ก่อน UserProfileModal)
- `AvatarCropModal` component (react-easy-crop วงกลม + zoom slider + ปุ่มใช้รูปนี้/ยกเลิก, createPortal)
- mapDb เพิ่ม avatarUrl + avatarUpdatedAt
- UserProfileModal: state (cropSrc, uploadingAvatar, avatarErr, avatarInputRef) + handlers (pickAvatarFile, handleCropConfirm, handleDeleteAvatar, avatarPublicUrl)
- avatar circle (90px) แสดง `<img>` ถ้ามี avatarPublicUrl · ไม่มี → shownTitle · ปุ่มกล้อง → file picker · ปุ่มลบรูป · render AvatarCropModal เมื่อ cropSrc
- npm: react-easy-crop ติดตั้งแล้ว

## ⬜ เหลือทำ (resume จากตรงนี้)
1. **เช็ค `app/api/profile/me/route.ts`** ว่า return `avatar_url` + `avatar_updated_at` ไหม — ถ้า select เฉพาะ column ต้องเพิ่ม 2 ตัวนี้ (ไม่งั้นเปิด modal ใหม่ไม่เห็นรูปที่อัปไว้) · **ยังไม่ได้เช็ค**
2. **Build + restart + test** — อัปรูปจริง: เลือกรูป → ครอบ → อัป → เห็นรูปในวงกลม · เช็ค R2 dashboard มีไฟล์ · เช็ค img.tbjourney.care/avatars/<id>.webp เปิดได้
3. **Step 4** — สร้าง `AvatarCircle({user, size})` component แสดง 4 จุด: sidebar current user (~line 7252) · comment author badge (~9676) · reply author badge (~9865) · profile modal (ทำแล้ว) · reuse `initials()` (~9587) · ต้องดึง avatar_url มากับ comment author + currentUser
4. **Step 5** — polish + bump version (next: v0.7.18.0) + push

## ⚠️ ปัญหา court bug (สาเหตุที่ /clear)
- ช่วง session นี้ AI (แคลร์) พิมพ์ tool-call **malformed หลุดเป็นตัวอักษร "court <invoke>"** เป็นช่วงๆ → พี่กันหงุดหงิดมาก
- สลับ model (4-6/4-7/4-8) แล้วยังโผล่ → แนะนำ /clear เริ่ม context ใหม่
- หลัง /clear: resume งานนี้ได้เลย โค้ด Step 1-3 เซฟในไฟล์ครบ

## test scripts ค้าง (ลบได้)
- `scripts/_test-r2.mjs`, `scripts/_test-presign.mjs` (ถ้าเขียนสำเร็จ) — ลบทิ้งได้ เป็น test ชั่วคราว
