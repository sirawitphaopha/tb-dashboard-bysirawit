---
name: tb-dashboard-session-2026-05-16-domain-live
description: session 16 พ.ค. 2026 (ภาคบ่าย) — tbjourney.care LIVE! เชื่อม domain + verify Resend + แก้ EMAIL_FROM + ตั้ง Supabase + Env vars + push v0.7.3
metadata: 
  node_type: memory
  type: project
  originSessionId: ea782730-7b5c-45d9-87f4-7d857e102cad
---

**วันที่:** 2026-05-16 (ภาคบ่าย — ต่อจาก backend complete ภาคเช้า)
**โปรเจกต์:** TB CARE & JOURNEY
**Repo:** `C:\Users\PKH\tb-dashboard-bysirawit`
**Version:** v0.7.2.4 → **v0.7.3**
**Commit:** `6c45961` — feat: v0.7.3 — tbjourney.care LIVE!
**Production URL:** https://tbjourney.care ✅

---

## 🎯 ภารกิจหลัก — เชื่อม Domain เข้า Production

พี่กันซื้อ domain ครั้งแรกในชีวิต! ตื่นเต้นมาก 🎉

ทำครบ 5 ขั้นภายใน session เดียว (~1.5 ชั่วโมง)

---

## ✅ สิ่งที่ทำ (5 ขั้น)

### 1. เชื่อม Custom Domain — Cloudflare Workers
- ซื้อ `tbjourney.care` ผ่าน Cloudflare Registrar (~1,200 บาท/ปี)
- Workers & Pages → tb-dashboard-bysirawit → Domains → Add Domain
- เลือก **Custom Domains** (ไม่ใช่ Route pattern)
- Subdomain field: ปล่อยว่าง (ใช้ root domain)
- เปิด `https://tbjourney.care` → เจอเว็บได้เลย ✓

### 2. Verify DNS ใน Resend
- เข้า Resend Dashboard → Domains → Add Domain `tbjourney.care`
- เลือก Region: **Tokyo (ap-northeast-1)** (ใกล้ไทย)
- ใช้ **Auto configure** → Resend คุย Cloudflare API ตรง → เติม 3 records (MX, DKIM, SPF) อัตโนมัติ
- DMARC (optional) ต้องเติมเองใน Cloudflare DNS:
  - Type: TXT, Name: `_dmarc`, Content: `v=DMARC1; p=none;`
- รอ 1-2 นาที → ทั้ง 4 records เขียวหมด ✅

### 3. แก้ EMAIL_FROM (lib/resend.ts)
- จาก `onboarding@resend.dev` → `noreply@tbjourney.care`
- ผลกระทบ: เมล admin notify/approve/reject ส่งจาก @tbjourney.care แล้ว ไม่เข้า spam

### 4. ตั้ง Supabase Auth — URL Configuration
- **Site URL:** `https://tbjourney.care`
- **Redirect URLs:**
  - `https://tbjourney.care/**` (production)
  - `http://localhost:3000/**` (local dev — localhost = "เครื่องนี้" ใช้ได้ทุกเครื่อง)

### 5. เพิ่ม Env Vars ใน Cloudflare Runtime
- พบว่า Runtime มีแค่ 2 ตัว (RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY)
- Build มีครบ 5 → ต้อง mirror ไป Runtime ด้วย
- เพิ่ม 3 ตัวขาด: ADMIN_EMAIL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Type: **Plaintext** (Cloudflare เรียกได้หลายชื่อ: Text/Plaintext/Variable = อันเดียวกัน)

### 6. Commit + Push v0.7.3
- Version bump 2 ที่: `public/tb-app.jsx` (sidebar) + `app/login/page.tsx` (login footer)
- คงป้าย "ยังไม่เผยแพร่" สีอำพันไว้ จนกว่าจะทดสอบ end-to-end ครบ
- Push สำเร็จ → Cloudflare auto-deploy

---

## 📌 บทเรียน/กฎใหม่ที่บันทึก

### memory ใหม่ที่สร้าง
1. **[[project_tb_dashboard_pending_master]]** — รวม 24+ ข้อ pending ทุก session ในไฟล์เดียว (เป็น index ใช้แทนการวนอ่าน session files)
2. **[[knowledge_tb_dashboard_version_locations]]** — Version มี 2 ที่ใน repo อย่าลืมอัปเดตทั้งคู่

### Roadmap ที่เพิ่ม (อยู่ใน pending master)
- ข้อ 25: AI วิเคราะห์/แนะนำเคส (Claude/Gemini/GPT)
- ข้อ 26: AI Auto-fill ฟอร์ม Visit จาก text ก้อนใหญ่ (Structured Extraction)
- ข้อ 27: Visit Form แยก OPD/Admit
- ข้อ 28: Timeline ปรับปรุง

---

## 💡 ความรู้ที่พี่กันได้วันนี้

- **Subdomain** = "ห้องย่อย" ของบ้านหลังใหญ่ — สร้างฟรี ไม่จำกัด เช่น `calc.tbjourney.care`
- **Root domain vs www** = ปัจจุบันนิยม root เปล่าๆ (สั้น จำง่าย)
- **Auto configure ใน Resend** = ปลอดภัย เร็ว ไม่พิมพ์ผิด (ดีกว่า manual)
- **DMARC** = ไม่ใช่ toggle เปิด-ปิด เป็น record ที่ต้องเพิ่มเอง (`p=none` = โหมด monitor ก่อน)
- **localhost:3000** = "เครื่องนี้" — ทุกเครื่องใช้ URL เดียวกันได้ ไม่ต้องแก้ตอนเปลี่ยนเครื่อง
- **Cloudflare env vars** = ต้องมีทั้ง Runtime + Build เท่ากัน (เหตุการณ์ล่ม v0.7.2.2 เคยเตือน)
- **Variable vs Secret** = Variable เห็นค่าได้ / Secret encrypted หลังบันทึก

---

## 🏥 ⚠️ ยังต้องทำต่อ (ใน master pending)

- ✅ **ข้อ 9: ซื้อ domain + verify Resend** — เสร็จแล้ว!
- ⏳ ทดสอบ Approve/Reject flow ครบวงจรกับเมลอื่น (ตอนนี้ส่งได้ทุกเมลแล้ว)
- ⏳ Phase 2 ฟีเจอร์ (reset password จริง, edit request, session timeout)
- ⏳ RLS strict mode tb_patients (security)

---

## 🗺 ดูเพิ่ม

- [[project_tb_dashboard_pending_master]] — master pending list
- [[session_tb_dashboard_2026_05_16_backend]] — Phase 1 backend complete (ภาคเช้า)
- [[knowledge_env_production]] — env vars Cloudflare
- [[knowledge_tb_dashboard_version_locations]] — version 2 ที่
