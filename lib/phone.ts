// ════════════════════════════════════════════════════════════════
// ตัวกลางตรวจ + จัดรูปแบบเบอร์โทร — ใช้ร่วมทุกที่ที่รับ/แก้เบอร์
// (หน้าสมัคร + profile/update + edit-self + approve-edit)
//
// ⚠️ ฝั่งหน้าเว็บ (public/*.jsx) มีตัวคู่กันใน public/tb-data.js
//    คือ window.tbValidatePhone / window.tbFormatPhone — แก้ที่นี่ต้องแก้ที่นั่นให้ตรงกัน
// ════════════════════════════════════════════════════════════════

/** จัดรูปแบบเบอร์ใส่ขีด: 0812345678 → 081-234-5678 (รูปแบบมาตรฐานที่เก็บลง DB) */
export function formatPhone(val: string | null | undefined): string {
  const d = (val || '').replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}

/**
 * ตรวจเบอร์โทร (เข้มสุด): มือถือ 06/08/09 + เบอร์บ้าน กทม. 02
 * + บล็อกเลขซ้ำกันทั้งหมด / เลขเรียงต่อกัน
 */
export function validatePhone(phone: string | null | undefined): { ok: boolean; msg: string } {
  const d = (phone || '').replace(/\D/g, '')
  if (d.length === 0) return { ok: false, msg: 'กรุณากรอกเบอร์โทรศัพท์' }
  if (d.length !== 10) return { ok: false, msg: 'เบอร์โทรต้องมี 10 หลัก (เช่น 081-234-5678)' }

  // ต้องขึ้นต้นด้วย 02 (เบอร์บ้าน กทม.) หรือ 06/08/09 (มือถือ)
  const prefix2 = d.slice(0, 2)
  const validPrefixes = ['02', '06', '08', '09']
  if (!validPrefixes.includes(prefix2)) {
    const provincialLandline: Record<string, string> = {
      '03': 'ภาคกลาง/ตะวันออก',
      '04': 'ภาคอีสาน',
      '05': 'ภาคเหนือ',
      '07': 'ภาคใต้',
    }
    if (provincialLandline[prefix2]) {
      return {
        ok: false,
        msg: `เบอร์ ${prefix2} เป็นเบอร์บ้านต่างจังหวัด (${provincialLandline[prefix2]}) — ระบบไม่รองรับ กรุณาใช้เบอร์มือถือ (06/08/09) หรือเบอร์บ้านกรุงเทพ (02)`,
      }
    }
    if (prefix2 === '00' || prefix2.startsWith('1')) {
      return { ok: false, msg: 'เบอร์ที่กรอกไม่ถูกต้อง กรุณากรอกเบอร์มือถือ (06/08/09) หรือเบอร์บ้าน กทม. (02)' }
    }
    if (prefix2 === '01') {
      return { ok: false, msg: 'รหัส 01 เป็นเบอร์บริการพิเศษ (ไม่ใช่เบอร์ส่วนตัว) — กรุณาใช้เบอร์มือถือ (06/08/09)' }
    }
    return { ok: false, msg: 'เบอร์ต้องขึ้นต้นด้วย 02 (กทม.), 06, 08 หรือ 09 (มือถือ)' }
  }

  // บล็อกเลขซ้ำกันทั้งหมด — เช่น 0000000000, 0888888888
  if (/^(\d)\1{9}$/.test(d)) {
    return { ok: false, msg: 'เบอร์ที่กรอกเป็นเลขซ้ำกันทั้งหมด กรุณากรอกเบอร์จริง' }
  }

  // บล็อก 8 หลักหลังเป็นเลขซ้ำ — เช่น 0811111111, 0900000000
  const last8 = d.slice(2)
  if (/^(\d)\1{7}$/.test(last8)) {
    return { ok: false, msg: 'เบอร์ที่กรอกมีรูปแบบผิดปกติ กรุณากรอกเบอร์จริง' }
  }

  // บล็อกเลขเรียงต่อกัน (ขึ้น/ลง) — เช่น 0123456789, 0987654321
  const isAscending = (s: string) => {
    for (let i = 1; i < s.length; i++) {
      if (parseInt(s[i]) !== (parseInt(s[i - 1]) + 1) % 10) return false
    }
    return true
  }
  const isDescending = (s: string) => {
    for (let i = 1; i < s.length; i++) {
      if (parseInt(s[i]) !== (parseInt(s[i - 1]) - 1 + 10) % 10) return false
    }
    return true
  }
  if (isAscending(d) || isDescending(d) || isAscending(last8) || isDescending(last8)) {
    return { ok: false, msg: 'เบอร์ที่กรอกเป็นเลขเรียงต่อกัน กรุณากรอกเบอร์จริง' }
  }

  return { ok: true, msg: '' }
}
