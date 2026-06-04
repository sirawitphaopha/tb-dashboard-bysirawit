// ─────────────────────────────────────────────────────────────────────────
// lib/r2.ts — Cloudflare R2 helper (S3-compatible) ผ่าน aws4fetch
//
// ใช้ aws4fetch (เบา ~6KB เหมาะ edge/Workers) sign S3 request ของ R2
// env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
//      R2_BUCKET_AVATAR (avatar public) · R2_BUCKET_PATIENT (รูปผู้ป่วย private)
// รองรับหลาย bucket: ส่ง bucket param · default = avatar bucket (โค้ดเดิมไม่ต้องแก้)
// ─────────────────────────────────────────────────────────────────────────
import { AwsClient } from 'aws4fetch'

const AVATAR_BUCKET = process.env.R2_BUCKET_AVATAR || 'tb-avatars'

function client() {
  return new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    region: 'auto',
    service: 's3',
  })
}

function endpoint(key: string, bucket: string) {
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${key}`
}

// presigned PUT URL — client เอาไป PUT ไฟล์ตรงเข้า R2
export async function presignPut(key: string, expiresSec = 300, bucket: string = AVATAR_BUCKET): Promise<string> {
  const url = new URL(endpoint(key, bucket))
  url.searchParams.set('X-Amz-Expires', String(expiresSec))
  const signed = await client().sign(url.toString(), { method: 'PUT', aws: { signQuery: true } })
  return signed.url
}

// presigned GET URL — signed link สำหรับ "ดู" ไฟล์ใน private bucket (เอาไปใส่ <img src>)
export async function presignGet(key: string, expiresSec = 3600, bucket: string = AVATAR_BUCKET): Promise<string> {
  const url = new URL(endpoint(key, bucket))
  url.searchParams.set('X-Amz-Expires', String(expiresSec))
  const signed = await client().sign(url.toString(), { method: 'GET', aws: { signQuery: true } })
  return signed.url
}

// ลบ object ออกจาก R2 (server-side, ใช้กุญแจ — ไม่ผ่าน presigned)
export async function r2Delete(key: string, bucket: string = AVATAR_BUCKET): Promise<Response> {
  return client().fetch(endpoint(key, bucket), { method: 'DELETE' })
}
