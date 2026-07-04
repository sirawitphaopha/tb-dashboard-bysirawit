---
name: supabase-single-env
description: TB Dashboard ใช้ Supabase project เดียวสำหรับทั้ง dev และ production — รัน SQL ครั้งเดียวพอ ไม่ต้องถามแยก
metadata: 
  node_type: memory
  type: project
  originSessionId: 1f6e6634-a264-4da1-9733-cdfa847fcd37
---

# 🗄 TB Dashboard — Supabase Project เดียว (dev = production)

โปรเจกต์ TB Dashboard ใช้ **Supabase project ตัวเดียว** สำหรับทั้ง dev (localhost:3000) และ production (tbjourney.care)

- **localhost** เชื่อม Supabase เดียวกับ production ผ่าน `.env.local`
- รัน SQL บน Supabase Dashboard ครั้งเดียว → ทั้ง dev และ production ใช้ schema/ข้อมูลเดียวกันทันที
- **อย่าถามพี่กันแบบ "รันบน dev แล้วหรือยัง? รันบน production แล้วหรือยัง?"** เพราะมันเป็นที่เดียวกัน
- พี่กันรำคาญถ้าถามซ้ำ

## ที่ถูกต้อง
- ✅ "รัน SQL แล้วหรือยังคะ?"
- ✅ "ที่อยู่ไฟล์: scripts/xxx.sql — รันบน Supabase แล้วบอกแคลร์นะคะ"

## ที่ไม่ควรถาม
- ❌ "รันทั้ง dev + production แล้วหรือยังคะ?"
- ❌ "บน production รันแล้วใช่ไหม?"
- ❌ ตารางที่บอกสถานะ dev/production แยก
