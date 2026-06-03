-- v0.7.18.0 — เก็บ "ที่อยู่รูปต้นฉบับ" ของ avatar (สำหรับ popup กดดูรูปเต็มแบบต้นฉบับ ไม่ใช่รูปครอบจัตุรัส)
-- รูปครอบ (จัตุรัส) เก็บใน avatar_url อยู่แล้ว · รูปต้นฉบับ (สัดส่วนเดิม ย่อ max 1920) เก็บใน avatar_original_url
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_original_url TEXT;
