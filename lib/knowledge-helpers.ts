// helper สำหรับ API คลังความรู้ (PDF) — ชื่อ bucket + reuse auth helper ของรูปผู้ป่วย
// bucket แยกจากรูปผู้ป่วย (ไม่ปนข้อมูลคนไข้ + โควตาแยก) · key = library/<uuid>.pdf
export const LIBRARY_BUCKET = process.env.R2_BUCKET_LIBRARY || 'tb-knowledge'

// ยืม getRequester (auth + เช็ค approved/admin + admin client) จากระบบรูปผู้ป่วย — logic เหมือนกันเป๊ะ
export { getRequester } from './patient-image-helpers'
