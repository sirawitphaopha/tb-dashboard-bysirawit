# TB Dashboard — Dev Log (บันทึกการพัฒนา)

โฟลเดอร์นี้เก็บ **บันทึกทุก session การพัฒนา** ของ TB Dashboard (TB JOURNEY & CARE) ตั้งแต่วันแรก
เพื่อให้ Claude (รวมถึงบนมือถือ ที่ทำงานผ่าน git repo) อ่านเข้าใจบริบท ประวัติ และเหตุผลของทุกการตัดสินใจได้

## อ่านอะไรก่อน
- **กฎการทำงาน + ทักษะ + ข้อผิดพลาด** → [`.claude/skills/working-with-gun/SKILL.md`](../../.claude/skills/working-with-gun/SKILL.md) (คู่มือหลัก โหลดก่อนลงมือทุกครั้ง)
- **งานค้าง/roadmap** → `project_tb_dashboard_pending_master.md`
- **session ล่าสุด** → ไฟล์ `session_tb_dashboard_<วันที่ล่าสุด>.md` (ดู section "ต่อไป/ค้าง")

## ประเภทไฟล์
- `session_tb_dashboard_*.md` — บันทึกราย session (สิ่งที่ทำ/บั๊กที่แก้/version/งานต่อ) เรียงตามวันที่
- `session_tb_2026_05_11.md` — session แรกสุด (สร้างแอป)
- `project_tb_dashboard_*.md` — เอกสารโปรเจกต์ (roadmap / bug audit / business model / license / audit plan / pending master)
- `knowledge_*.md` — ความรู้เทคนิคเฉพาะ (Supabase single env / Cloudflare middleware / env / error 500 fix / RLS / version locations)
- `design_tbcarelink.md` — ระบบดีไซน์ (โทนสี teal/amber/red) · `feedback_easter_egg_sacred.md` — easter egg log ห้ามลบ

> ไฟล์เหล่านี้คัดลอกจากระบบ memory ของ Claude (พี่กันสั่งให้ขึ้น git 4 ก.ค. 69) · เนื้อหาเป็นภาษาไทยเป็นหลัก
