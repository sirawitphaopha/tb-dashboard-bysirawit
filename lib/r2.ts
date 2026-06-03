// ─────────────────────────────────────────────────────────────────────────
// lib/r2.ts — Cloudflare R2 helper (S3-compatible) ผ่าน aws4fetch
//
// ใช้ aws4fetch (เบา ~6KB เหมาะ edge/Workers) sign S3 request ของ R2
// env ที่ต้องมี: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_AVATAR
// ─────────────────────────────────────────────────────────────────────────
import { AwsClient } from 'aws4fetch'

function client() {
  return new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    region: 'auto',
    service: 's3',
  })
}

function endpoint(key: string) {
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_AVATAR}/${key}`
}

// สร้าง "ลิงก์อัปชั่วคราว" (presigned PUT URL) — client เอาไป PUT ไฟล์ตรงเข้า R2
// ไม่ sign content-type → client ส่ง content-type: image/webp ได้อิสระ (R2 เก็บตามที่ส่ง)
export async function presignPut(key: string, expiresSec = 300): Promise<string> {
  const url = new URL(endpoint(key))
  url.searchParams.set('X-Amz-Expires', String(expiresSec))
  const signed = await client().sign(url.toString(), {
    method: 'PUT',
    aws: { signQuery: true },
  })
  return signed.url
}

// ลบ object ออกจาก R2 (server-side, ใช้กุญแจ — ไม่ผ่าน presigned)
export async function r2Delete(key: string): Promise<Response> {
  return client().fetch(endpoint(key), { method: 'DELETE' })
}
