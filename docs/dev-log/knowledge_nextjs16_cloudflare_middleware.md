---
name: knowledge-nextjs16-cloudflare-middleware
description: 🚨 Next.js 16 proxy.ts ใช้กับ Cloudflare Pages ไม่ได้ — ต้องใช้ middleware.ts (Edge) เท่านั้น
metadata:
  node_type: memory
  type: reference
  originSessionId: current
---

# 🚨 Next.js 16 `proxy.ts` ❌ Cloudflare Pages

**บันทึก:** 2026-05-19 (session ทำ Bug Audit หลังบ้าน)

## TL;DR

**ห้ามใช้ `proxy.ts` ใน TB Dashboard** ตราบใดที่ host บน Cloudflare Pages
ต้องใช้ `middleware.ts` (Edge runtime) เท่านั้น
ทนกับ deprecation warning ไปก่อน

## ปัญหาที่เจอจริง (v0.7.9.2 → v0.7.9.5)

1. Next.js 16 แสดง warning: "The 'middleware' file convention is deprecated. Please use 'proxy' instead."
2. ลอง rename `middleware.ts` → `proxy.ts` + เปลี่ยนชื่อฟังก์ชัน → dev server ผ่าน
3. push ไป Cloudflare Pages → build fail:
   ```
   [build] ERROR Node.js middleware is not currently supported.
           Consider switching to Edge Middleware.
   ```
4. ลองเพิ่ม `export const runtime = 'edge'` ใน proxy.ts → Next.js reject:
   ```
   ⨯ Route segment config is not allowed in Proxy file at "./proxy.ts".
     Proxy always runs on Node.js runtime.
   ```
5. → revert กลับเป็น middleware.ts (v0.7.9.5) production ฟื้น

## สาเหตุทางเทคนิค

| | middleware.ts | proxy.ts (Next.js 16+) |
|---|---|---|
| Runtime | Edge by default | **บังคับ Node.js** |
| เปลี่ยน runtime ได้ไหม | ได้ (export const runtime) | ❌ ไม่ได้ |
| Cloudflare Pages support | ✅ ผ่าน @opennextjs/cloudflare | ❌ ยังไม่รองรับ |
| Vercel support | ✅ | ✅ |

## เงื่อนไขที่จะใช้ proxy.ts ได้ (อนาคต)

ต้องเกิดอย่างใดอย่างหนึ่ง:
1. @opennextjs/cloudflare update รองรับ Node middleware
2. ย้าย host ไป Vercel (Vercel รองรับ Node middleware เลย)
3. Next.js 17+ อาจให้ proxy.ts เลือก Edge runtime ได้

## How to apply

- ถ้าพี่กันเห็น warning "middleware deprecated" — **บอกว่ายังไม่ต้องแก้** เพราะ Cloudflare บังคับ
- session ใหม่ที่จะ refactor middleware → check memory นี้ก่อน
- ก่อน rename `middleware.ts` → `proxy.ts` ต้องเช็คก่อนว่า:
  - host ย้ายไป Vercel แล้วหรือยัง?
  - หรือ @opennextjs/cloudflare release ที่รองรับ Node middleware ได้หรือยัง?

## ที่เกี่ยวข้อง
- [[knowledge_env_production]] — Cloudflare deploy details
- [[session_tb_dashboard_2026_05_19]] — session ที่เจอบั๊กนี้ (ถ้ามี)
