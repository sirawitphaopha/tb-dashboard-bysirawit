---
name: env-vars-production-vs-local
description: 🔑 ก่อน deploy ทุกครั้ง ต้องตั้ง Environment Variables บน Cloudflare Pages Dashboard ให้ตรงกับ .env.local เพราะ .env.local อยู่ในเครื่องเท่านั้น ไม่ได้ขึ้น GitHub
metadata: 
  node_type: memory
  type: reference
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

# 💡 บทเรียนสำคัญจากพี่กัน (2026-05-15)

พี่กันถามว่า:
> "ถ้าเมลอยู่บนเครื่อง แล้วเราส่งเว็บขึ้นรันบนคลาวด์แฟร์ แปลว่าในคลาวด์แฟร์ก็จะไม่รู้นี่นาว่าต้องส่งไปเมลไหน"

**คำตอบ:** ใช่! `.env.local` อยู่ในเครื่อง dev เท่านั้น — production ต้องตั้ง env vars ในระบบ host

---

## 🏠 vs ☁️ Local vs Production

| ที่ | ตัวแปรเก็บที่ไหน | ใช้ตอนไหน |
|---|---|---|
| **Local dev** | ไฟล์ `.env.local` ในโปรเจกต์ | `npm run dev` |
| **Cloudflare Pages** | Dashboard → Settings → Environment variables | เว็บที่ deploy แล้ว |
| **Vercel** | Dashboard → Settings → Environment Variables | (ไม่ได้ใช้กับโปรเจกต์นี้) |

**ชื่อตัวแปรต้องเหมือนกันเป๊ะ** — แค่เก็บคนละที่

---

## ✅ Supabase: dev กับ prod ใช้ตัวเดียวกัน (ยืนยันโดยพี่กัน 2026-05-20)

ทั้งตอน dev ในเครื่อง (`.env.local`) และ production (Cloudflare/tbjourney.care)
**ชี้ไป Supabase project เดียวกัน** = `https://cioswzdbonnbhbyynrhh.supabase.co`

**ผลที่ตามมา — สำคัญ:**
- รัน SQL ใน Supabase **รอบเดียวพอ** ใช้ได้ทั้ง dev และ prod ทันที
- **ห้ามเตือนซ้ำ** ว่า "ต้องรัน SQL บน prod ด้วย" — มันคือฐานเดียวกัน พี่กันรำคาญ
- ข้อมูลผู้ใช้/ผู้ป่วยจริงอยู่ในฐานเดียวนี้ → ระวังตอนทดสอบ อย่าทำข้อมูลจริงเสีย

---

## 📋 ตัวแปรที่ต้องตั้งบน Cloudflare (TB Dashboard)

ก่อน deploy production ครั้งแรก ต้องไปเพิ่มทีละตัวที่:
**Cloudflare Dashboard → Pages → tb-dashboard-bysirawit → Settings → Environment variables**

```
NEXT_PUBLIC_SUPABASE_URL          = https://cioswzdbonnbhbyynrhh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = sb_publishable_*  (ดูใน .env.local)
SUPABASE_SERVICE_ROLE_KEY         = sb_secret_*       (ดูใน .env.local)
RESEND_API_KEY                    = re_*              (ดูใน .env.local)
ADMIN_EMAIL                       = siravitphoapha9928@hotmail.com,siravitphoapha9928@gmail.com
```

**สำคัญ:** Cloudflare Pages มี 2 environment:
- **Production** = main branch
- **Preview** = branch อื่นๆ
- ตั้ง vars ใน Production environment ก่อนเสมอ (Preview ตั้งเหมือนกันได้ ถ้าต้องการทดสอบ branch แยก)

---

## ⚠️ จุดที่หลายคนสะดุด

1. **ลืมตั้ง env บน Cloudflare** → เว็บ build ผ่าน แต่ functions ล้ม (Supabase ต่อไม่ติด, เมลส่งไม่ออก)
2. **ใส่ space ในค่าตัวแปร** → Cloudflare ตัด whitespace บางครั้ง → ใส่ค่าตรงๆ ไม่ต้องมี space
3. **ใส่ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_*` → ตัวนี้ frontend อ่านได้** (จะอยู่ใน bundle ที่ส่งไป browser) — ห้ามใส่ secrets ใน `NEXT_PUBLIC_*`
4. **ลืมแยก service_role กับ anon** — ถ้าใส่ผิด อาจหลุดให้ frontend = อันตรายมาก

---

## 🔐 ความปลอดภัยของ env บน Cloudflare

- Cloudflare เก็บค่าตัวแปร**เข้ารหัส** ไม่ปรากฏใน build output
- เฉพาะ vars ที่ขึ้นต้น `NEXT_PUBLIC_*` เท่านั้นที่ส่งให้ browser
- vars อื่นๆ (เช่น `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) อยู่ฝั่ง server เท่านั้น

---

## 🆕 Cloudflare Variable Type — Text vs Secret

Cloudflare Workers/Pages มี Variable Type 3 แบบ: **Text / Secret / JSON**

| Type | Dashboard | Code อ่านได้? | ใช้กับอะไร |
|---|---|---|---|
| **Text** | ดูค่าเดิมได้ตลอด | ✅ | ค่าทั่วไป — URL, email, config |
| **Secret** | ซ่อนเป็น `***` ดูค่าเดิมไม่ได้หลังตั้ง | ✅ | API key, token, รหัสลับ |
| **JSON** | ดูค่าเดิมได้ | ✅ (parse เป็น object) | ค่าซ้อน object/array |

### ⭐ Convention มาตรฐาน (90% ของ dev ใช้)

| Variable | Type | เหตุผล |
|---|---|---|
| `NEXT_PUBLIC_*` (ทุกตัว) | **Text** | ไปฝั่ง browser อยู่แล้ว — Secret ไม่ช่วยอะไรเพิ่ม แค่ซ่อนจาก dashboard |
| URL, email, ค่าทั่วไป | **Text** | ดูทบทวนได้ตลอด |
| `*_SERVICE_ROLE_KEY`, `*_API_KEY`, secret token | **Secret** | ถ้าใครเข้า dashboard ได้ ก็ขโมยไม่ได้ |

### ⚠️ ทำไม NEXT_PUBLIC_* เป็น Secret ก็ไม่ช่วย?

Next.js inline ค่า `NEXT_PUBLIC_*` เข้า bundle ที่ส่งให้ browser ตอน build
→ ใครเปิด View Source ของเว็บก็เห็นค่าได้
→ Secret ใน Cloudflare = แค่ซ่อนจาก Dashboard ของเจ้าของเอง
→ เหมือนเอากุญแจซ่อนใต้พรม แต่บอกตำแหน่งให้คนอื่น

### 💡 จะตั้งเป็น Secret ทุกอันก็ได้

ใช้งานได้ปกติ ไม่ผิด — แต่ระวัง:
- หลังตั้ง Secret แล้ว **เปลี่ยนค่าได้ แต่ดูค่าเดิมไม่ได้**
- ถ้าลืม ต้องไปดูที่ source (Supabase Dashboard, Resend Dashboard, etc.)
- เพื่อความสะดวก — ค่าที่ไม่ลับ ปล่อยเป็น Text ดีกว่า

---

## 🐛 Cloudflare Build Crash จาก Module-Load Init

**บทเรียนจาก 2026-05-16:** Build แรกของ v0.7.2 ล้มเหลวด้วย error:
> `Missing API key. Pass it to the constructor new Resend("re_123")`

**สาเหตุ:** ไฟล์ `lib/resend.ts` มี
```ts
export const resend = new Resend(process.env.RESEND_API_KEY!)  // ❌ ผิด
```

→ ตอน Next.js build รัน "collect page data" มันโหลด module นี้
→ `process.env.RESEND_API_KEY` ตอน build time = **undefined** (Cloudflare expose env เฉพาะ runtime ไม่ใช่ build time)
→ `new Resend()` throw error → build crash

**แก้:** Lazy init — สร้าง instance ตอนเรียกใช้ครั้งแรก
```ts
let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || '')
  return _resend
}
// ใช้: getResend().emails.send(...)
```

**กฎเหล็ก:** ไฟล์ใน `lib/` **ห้าม instantiate client ที่ต้องการ env vars ตอน module-load**
- ❌ `export const client = new XYZ(process.env.KEY!)`
- ✅ `export function getClient() { return new XYZ(process.env.KEY || '') }`

ใช้กับ: Resend, Stripe, Twilio, OpenAI, Supabase service-role (ตัวที่ต้อง API key)
ยกเว้น: Supabase anon client OK เพราะ `createServerClient` รับ env เป็น argument ตอนเรียก ไม่ใช่ตอน import

---

## 🚨 Cloudflare Workers ไม่รัน Next.js Middleware!

**บทเรียนสำคัญสุดจาก 2026-05-16:** หลัง deploy v0.7.2 บน Cloudflare Workers
พบว่า **middleware.ts ไม่ทำงาน** — ผู้ใช้เข้า base URL ได้เลยโดยไม่ต้อง login

**สาเหตุ:**
- Next.js 16 มี warning: `"middleware" file convention is deprecated. Please use "proxy" instead`
- Cloudflare Workers + OpenNext deployment ไม่ execute middleware.ts (รูปแบบเก่า)
- ทุก auth check ใน middleware ถูกข้าม

**กฎเหล็ก:** บน Cloudflare Workers / Pages
- ❌ อย่าพึ่ง middleware.ts สำหรับ auth gating
- ✅ ต้อง enforce auth ในระดับ **page component** (server component) หรือ **API route handler** โดยตรง

**Pattern ที่ใช้:** Server-side auth check ในหน้าที่ต้องการการป้องกัน
```tsx
// app/page.tsx — Server Component
export const dynamic = 'force-dynamic'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createServerClient(URL, KEY, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} }
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // เช็ค status ต่อ
  const { data: profile } = await supabase.from('profiles')
    .select('status').eq('id', user.id).maybeSingle()
  if (profile?.status === 'pending')  redirect('/pending-approval')
  if (profile?.status === 'rejected') redirect('/rejected')

  return <YourPageContent />
}
```

API routes: ใช้ `createServerClient` + check `auth.getUser()` ใน handler

**TODO ใน future:** ลอง rename `middleware.ts` → `proxy.ts` ตาม Next.js 16 convention
อาจช่วยให้ทำงานบน Cloudflare ได้ (ยังไม่ได้ทดสอบ)

---

## 📝 Checklist ก่อน deploy ครั้งแรก

- [ ] `.env.local` ทำงานบนเครื่อง dev สมบูรณ์
- [ ] Push code ขึ้น GitHub (ทุกอย่างที่ไม่ใช่ .env.local)
- [ ] เข้า Cloudflare Pages dashboard
- [ ] เพิ่ม env vars ทุกตัวที่อยู่ใน `.env.local`
- [ ] Trigger redeploy (กด Retry deployment หรือ push commit ใหม่)
- [ ] ทดสอบหลัง deploy: register → ตรวจอีเมล admin → approve → user login

---

ดู [[knowledge_env_local]] · [[feedback_gitignore_first]]
