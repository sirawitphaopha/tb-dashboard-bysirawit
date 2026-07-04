---
name: design-tbcarelink
description: โทนสีและ design guideline ของ TB-CARE LINK ที่ต้องยึดตลอดการพัฒนา
metadata: 
  node_type: memory
  type: project
  originSessionId: 92e270da-2652-4d4f-8507-b3a3d855ba94
---

## สีหลัก

| บทบาท | สี | ตัวอย่าง class / hex |
|---|---|---|
| Primary (ทั่วไป) | **Teal** | `teal-600` `#0d9488`, `teal-700` `#0f766e` |
| แจ้งเตือนเบา (remind) | **Amber** | bg `#fffbeb`, border `#f59e0b`, text `#92400e` |
| แจ้งเตือนหนัก (error/critical) | **Red** | `red-500` `#ef4444`, `red-600` |
| Success | **Green** | `green-500` `#22c55e` |

**Why:** amber ไม่ใช่สีแจ้งเตือนทุกอย่าง — ใช้เฉพาะ "เตือนเบาๆ" เช่น กรุณาบันทึกก่อน, อย่าลืม ฯลฯ ส่วนอะไรที่หนักจริงๆ เช่น error, Lab ผิดปกติ, ข้อมูลหาย → red

**How to apply:**
- ปุ่มหลัก, sidebar, header, icon → teal
- เตือนเบา (remind, กรุณา, อย่าลืม) → amber
- เตือนหนัก (error, critical, ข้อมูลหาย, ออกระบบ) → red
- ห้ามใช้สีเทาเข้ม (`#1f2937`) สำหรับ toast
- ใช้ inline style สีแทน Tailwind dynamic class เพราะ Tailwind CDN scan template string ไม่ได้
