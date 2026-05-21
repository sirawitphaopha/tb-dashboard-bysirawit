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
  prefix: string             // คำนำหน้า "เลขใบประกอบ" (เช่น ภ.12345)
  titleMale: string | null   // ตัวย่อวิชาชีพเพศชาย (null = วิชาชีพนี้ไม่มีตัวย่อ → ใช้คำนำหน้านามตรงๆ)
  titleFemale: string | null // ตัวย่อวิชาชีพเพศหญิง
}

// คำนำหน้านามที่ผู้ใช้เลือกเอง (ใช้บอกเพศ + เป็นคำนำหน้าจริงของวิชาชีพที่ไม่มีตัวย่อ)
export const NAME_PREFIXES = ['นาย', 'นาง', 'นางสาว']

// key = ค่าที่เก็บจริงในฐานข้อมูล (คอลัมน์ profession)
export const PROFESSIONS: Record<string, Profession> = {
  doctor:              { label: 'แพทย์',                     prefix: 'ว.',  titleMale: 'นพ.',  titleFemale: 'พญ.'   },
  dentist:             { label: 'ทันตแพทย์',                 prefix: 'ท.',  titleMale: 'ทพ.',  titleFemale: 'ทพญ.'  },
  pharmacist:          { label: 'เภสัชกร',                   prefix: 'ภ.',  titleMale: 'ภก.',  titleFemale: 'ภญ.'   },
  nurse1:              { label: 'พยาบาลวิชาชีพ (ชั้นหนึ่ง)', prefix: 'ป.',  titleMale: null,   titleFemale: null    },
  nurse2:              { label: 'พยาบาลเทคนิค (ชั้นสอง)',    prefix: 'ช.',  titleMale: null,   titleFemale: null    },
  medtech:             { label: 'นักเทคนิคการแพทย์',         prefix: 'ทน.', titleMale: 'ทนพ.', titleFemale: 'ทนพญ.' },
  physio:              { label: 'นักกายภาพบำบัด',            prefix: 'ก.',  titleMale: 'กภ.',  titleFemale: 'กภ.'   },
  radio:               { label: 'นักรังสีการแพทย์',          prefix: 'รส.', titleMale: null,   titleFemale: null    },
  publichealthofficer: { label: 'นักสาธารณสุข',              prefix: 'สธ.', titleMale: null,   titleFemale: null    },
  publichealthtech:    { label: 'นักวิชาการสาธารณสุข',       prefix: '',    titleMale: null,   titleFemale: null    },
  officer:             { label: 'เจ้าพนักงาน',               prefix: '',    titleMale: null,   titleFemale: null    },
  other:               { label: 'อื่นๆ',                      prefix: '',    titleMale: null,   titleFemale: null    },
}

/** เพศหญิงไหม — ดูจากคำนำหน้านาม (นาง/นางสาว = หญิง) */
function isFemalePrefix(namePrefix: string | null | undefined): boolean {
  return namePrefix === 'นาง' || namePrefix === 'นางสาว'
}

/**
 * คำนำหน้าที่แสดงจริง = ตัวย่อวิชาชีพตามเพศ (ถ้าวิชาชีพมีตัวย่อ)
 * ไม่งั้นใช้คำนำหน้านามตรงๆ (นาย/นาง/นางสาว)
 */
export function displayTitle(
  professionKey: string | null | undefined,
  namePrefix: string | null | undefined,
): string {
  const p = PROFESSIONS[professionKey || '']
  if (p && p.titleMale) {
    return isFemalePrefix(namePrefix) ? (p.titleFemale || p.titleMale) : p.titleMale
  }
  return namePrefix || ''
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
