// ════════════════════════════════════════════════════════════════
// บัญชีกลางวิชาชีพ — แหล่งข้อมูลเดียวฝั่งเซิร์ฟเวอร์
// ใช้ร่วมกันทุกที่: หน้าสมัคร + ทุก API (register / approve-edit / edit-user / edit-self)
//
// ⚠️ ฝั่งหน้าเว็บ (public/*.jsx) มีบัญชีคู่กันอยู่ใน public/tb-data.js
//    คือ window.TB_PROFESSIONS — ถ้าแก้ที่นี่ต้องแก้ที่นั่นให้ตรงกันเสมอ
//    (key + label + prefix ต้องเหมือนกันเป๊ะ ไม่งั้นการแปลง label↔key จะพัง)
// ════════════════════════════════════════════════════════════════

export interface Profession {
  label: string
  prefix: string
}

// key = ค่าที่เก็บจริงในฐานข้อมูล (คอลัมน์ profession)
export const PROFESSIONS: Record<string, Profession> = {
  doctor:              { label: 'แพทย์',                     prefix: 'ว.'  },
  dentist:             { label: 'ทันตแพทย์',                 prefix: 'ท.'  },
  pharmacist:          { label: 'เภสัชกร',                   prefix: 'ภ.'  },
  nurse1:              { label: 'พยาบาลวิชาชีพ (ชั้นหนึ่ง)', prefix: 'ป.'  },
  nurse2:              { label: 'พยาบาลเทคนิค (ชั้นสอง)',    prefix: 'ช.'  },
  medtech:             { label: 'นักเทคนิคการแพทย์',         prefix: 'ทน.' },
  physio:              { label: 'นักกายภาพบำบัด',            prefix: 'ก.'  },
  radio:               { label: 'นักรังสีการแพทย์',          prefix: 'รส.' },
  publichealthofficer: { label: 'นักสาธารณสุข',              prefix: 'สธ.' },
  publichealthtech:    { label: 'นักวิชาการสาธารณสุข',       prefix: ''    },
  officer:             { label: 'เจ้าพนักงาน',               prefix: ''    },
  other:               { label: 'อื่นๆ',                      prefix: ''    },
}

const LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(PROFESSIONS).map(([k, v]) => [v.label, k])
)

/** key วิชาชีพ → ป้ายภาษาไทย (ถ้าไม่รู้จัก คืนค่าเดิม) */
export function professionLabel(key: string | null | undefined): string {
  return PROFESSIONS[key || '']?.label || key || ''
}

/** ป้ายภาษาไทย → key (ถ้าไม่รู้จัก คืนค่าเดิม) */
export function professionKeyFromLabel(label: string | null | undefined): string {
  return LABEL_TO_KEY[label || ''] || label || ''
}

/** key วิชาชีพ → คำนำหน้าเลขใบประกอบ (วิชาชีพที่ไม่มีใบประกอบ = '') */
export function professionPrefix(key: string | null | undefined): string {
  return PROFESSIONS[key || '']?.prefix ?? ''
}

/** ตัดเหลือเฉพาะตัวเลข — ใช้ลอกคำนำหน้าออกจากเลขใบประกอบทุกแบบ (ว./ภ./ทน./สธ. ฯลฯ) */
export function licenseDigits(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '')
}

/** ประกอบเลขใบประกอบเต็ม = คำนำหน้าตามวิชาชีพ + ตัวเลข (กันคำนำหน้าซ้ำเสมอ) */
export function buildLicense(
  professionKey: string | null | undefined,
  rawValue: string | null | undefined,
): string {
  return professionPrefix(professionKey) + licenseDigits(rawValue)
}
