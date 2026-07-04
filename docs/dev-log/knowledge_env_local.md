---
name: env-local
description: "อธิบาย .env.local คืออะไร, ทำไมถึงไม่ commit, และวิธีย้ายไปเครื่องใหม่ด้วย .env.example pattern"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

## .env.local คืออะไร

ไฟล์เก็บ "**ตัวแปรลับ**" ของโปรเจกต์ — API keys, รหัสฐานข้อมูล, secret tokens ต่างๆ
Next.js จะอ่านไฟล์นี้อัตโนมัติเวลารัน dev/build แล้วแทนค่าเข้าโค้ด

## ทำไมไม่ commit

ถ้า commit ขึ้น GitHub → ใครก็ตามที่เปิด repo เห็น = ขโมยรหัสได้ทันที
มีบอท scan GitHub หา API key หลุดอยู่ตลอด — เคสจริงคนเสียเงิน AWS หลายแสนเพราะรหัสหลุด 1 ครั้ง

## ปัญหาเวลาย้ายเครื่อง

ถ้า `.env.local` อยู่ใน `.gitignore` → ไม่ถูก push ขึ้น GitHub → **เครื่องใหม่ที่ clone ลงมาจะไม่มีไฟล์นี้** → รันโปรเจกต์ไม่ได้ (Supabase ต่อไม่ได้, ฯลฯ)

## วิธีแก้ — ใช้ pattern `.env.example`

สร้างไฟล์คู่กันสองตัว:

**`.env.local`** (ไฟล์จริง — gitignored, อยู่เฉพาะเครื่องตัวเอง):
```
NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ_REDACTEDจริงๆ
RESEND_API_KEY=re_EXAMPLE...จริงๆ
```

**`.env.example`** (template — commit ขึ้น GitHub ได้ เพราะค่าว่างเปล่า):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
```

`.gitignore` ตั้งให้ ignore `.env*` แต่ไม่ ignore `.env.example` (`!.env.example`)

## ขั้นตอนย้ายเครื่อง (เครื่องใหม่)

1. `git clone https://github.com/sirawitphaopha/tb-dashboard-bysirawit`
2. เปิดดูในเครื่องใหม่ — เห็น `.env.example` (จะรู้ว่าต้องใส่ตัวแปรอะไรบ้าง)
3. คัดลอกเป็น `.env.local`: `cp .env.example .env.local`
4. กรอกค่าจริงเข้าไป — หามาจาก:
   - Supabase Dashboard → Settings → API
   - Resend Dashboard → API Keys
   - หรือเก็บไว้ใน Password Manager (Bitwarden, 1Password) ส่วนตัว
5. `npm install` แล้ว `npm run dev` — ใช้งานได้

## ทางเลือกอื่น (ถ้าไม่อยากกรอกใหม่ทุกครั้ง)

- **Cloud password manager** — เก็บไฟล์ `.env.local` เต็มๆ ใน Bitwarden/1Password Notes
- **USB / external drive** — copy ไฟล์ไปด้วยตอนย้ายเครื่อง
- **ส่งให้ตัวเองทาง email/Telegram saved messages** — สะดวกแต่ไม่แนะนำ (Gmail อาจเก็บ log)

## สำหรับโปรเจกต์ TB CARE & JOURNEY (ปัจจุบัน)

`.env.local` เก็บ:
- `NEXT_PUBLIC_SUPABASE_URL` = https://cioswzdbonnbhbyynrhh.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sb_publishable_SuzwNfnSbCFCdNmDsMhydA_Yd8Nl0Yc
- `SUPABASE_SERVICE_ROLE_KEY` = sb_secret_* (server-side เท่านั้น)
- `RESEND_API_KEY` = re_* (สำหรับส่งเมล)
- `ADMIN_EMAIL` = siravitphoapha9928@gmail.com

ดู [[gitignore-ก่อน-commit-ครั้งแรกเสมอ]] สำหรับกฎการ commit

---

## 🆕 Supabase เปลี่ยนชื่อ Key (2026)

Supabase ออก **รูปแบบ API key ใหม่** ทยอยเลิกใช้แบบเก่า:

| ระบบ | รูปแบบเก่า (Legacy, JWT) | รูปแบบใหม่ (Publishable/Secret) |
|---|---|---|
| Public key | `eyJhbGciOi...` (เรียก `anon`) | `sb_publishable_*` |
| Server key | `eyJhbGciOi...` (เรียก `service_role`) | `sb_secret_*` |

**สิ่งที่ต้องรู้:**
- ใน Supabase Dashboard → Project Settings → API จะเห็น 2 tab:
  - **"Publishable and secret API keys"** ← ใหม่ (แนะนำ)
  - **"Legacy anon, service_role API keys"** ← เก่า (ยังใช้ได้ จะเลิกในอนาคต)
- ของ TB Dashboard ใช้ **รูปแบบใหม่** ทั้งหมด (sb_publishable, sb_secret)
- เวลาเอกสาร/คอร์สสอนเก่าๆ บอก "เอา anon key มาใส่ NEXT_PUBLIC_SUPABASE_ANON_KEY" — ใช้ key ใหม่ก็ได้ ไม่ต้องไปเอาตัวเก่ามา
- ห้ามใช้ `sb_secret_*` ในฝั่ง browser/frontend เด็ดขาด — มันบายพาส RLS ใช้ได้แต่ฝั่ง server เท่านั้น
