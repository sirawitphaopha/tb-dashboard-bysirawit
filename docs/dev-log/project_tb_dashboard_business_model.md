---
name: tb-dashboard-business-model
description: TB Dashboard วางแผนขายเป็น subscription/ซื้อขาด — multi-tenant ต่างรพ. แยกข้อมูลกัน
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e58b3a2-1f96-401c-b4fe-8e7091d402a8
---

# TB Dashboard — Business Model (วางแผน 2026-05-17)

พี่กันวางแผนให้ TB CARE & JOURNEY เป็นสินค้าที่ขายได้จริง

## รูปแบบการขาย
- Subscription รายเดือน/ปี **หรือ** ซื้อขาด (ยังไม่ตัดสินใจ)

## โครงสร้าง Multi-Tenant (แยกข้อมูลต่างรพ.)
- แต่ละ รพ./องค์กร = เนื้อที่ข้อมูลแยกกัน user ข้าม รพ. มองข้อมูลกันไม่ได้
- user ใน **รพ.เดียวกัน** ถึงจะดูข้อมูลผู้ป่วยร่วมกันได้
- ยังไม่ได้ implement — อยู่ในแผนระยะถัดไป

## Admin
- พี่กัน (siravitphoapha9928@gmail.com) = Super Admin คนเดียวในตอนนี้
- อนาคตอาจให้แต่ละ รพ. มี Admin ของตัวเอง

**Why:** ตอนแรกคิดว่าระบบนี้ใช้แค่ รพ.ปรางค์กู่ แต่จริงๆ วางแผนขายด้วย
**How to apply:** feature ที่ออกแบบควรรองรับ multi-tenant ไว้ในใจด้วย ไม่ใช่แค่ single-org
