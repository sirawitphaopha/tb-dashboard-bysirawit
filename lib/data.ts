// ========== CONSTANTS ==========
export const TAMBONS = ['พิมาย','พิมายเหนือ','กู่','ตูม','สำโรงปราสาท','โพธิ์ศรี','สมอ','ดวนใหญ่','บ้านไทย','ไพรขลา'];
export const REGIMENS = ['2HRZE/4HR','2HRZE/7HR','2HRE/7HR','2HRZE/10HR','6-9H','3HR'];
export const EXTRA_PULMONARY_TYPES = ['TB Lymphadenitis','TB Pleural','TB Meningitis','TB Cutaneous','TB Spine','TB Skeletal','TB Colon','อื่นๆ (Other)'];
export const PATIENT_TYPES = ['New','Relapse','Treatment Failure','Default'];
export const DISEASE_LOCATIONS = ['LTBI','Pulmonary','Extra-pulmonary'];
export const PREFIXES = ['นาย','นาง','นางสาว','เด็กชาย','เด็กหญิง'];

export const DRUG_RANGES = {
  R: { name: 'Rifampicin (R)', strength: 300, min: 8, max: 12, absMax: 600 },
  H: { name: 'Isoniazid (H)', strength: 100, min: 4, max: 6, absMax: 300 },
  Z: { name: 'Pyrazinamide (Z)', strength: 500, min: 20, max: 30, absMax: 2000 },
  E: { name: 'Ethambutol (E)', strength: 400, min: 15, max: 20, absMax: 1600 },
};

export const DEFAULT_COMORBIDITIES = [
  'เบาหวาน (DM)','ความดันโลหิตสูง (HT)','HIV/AIDS',
  'โรคไตเรื้อรัง (CKD)','ตับแข็ง (Liver Cirrhosis)','ถุงลมโป่งพอง (COPD)',
  'มะเร็ง (Cancer)','ภาวะขาดสารอาหาร','ยากดภูมิ (Immunosuppressive)',
  'โรคข้ออักเสบรูมาตอยด์ (RA)','โรคหัวใจ (CVD)'
];

export const DEFAULT_DRUGS = [
  'Metformin','Glipizide','Insulin','Amlodipine','Enalapril','Losartan',
  'Furosemide','ARV (Efavirenz)','ARV (PI-based)','Prednisolone','Allopurinol','Warfarin'
];

// ADR master list
export const ADR_LIST = [
  { key: 'neuropathy', label: 'ชาปลายมือ-เท้า', sub: 'Peripheral Neuropathy', drug: 'H' },
  { key: 'nausea', label: 'คลื่นไส้ อาเจียน', sub: 'Nausea / Vomiting', drug: 'HRZE' },
  { key: 'arthralgia', label: 'ปวดข้อ', sub: 'Arthralgia / Hyperuricemia', drug: 'Z' },
  { key: 'optic', label: 'ตาพร่า / มองเห็นผิดปกติ', sub: 'Optic Neuritis', drug: 'E' },
  { key: 'rash', label: 'ผื่นคัน / ลมพิษ', sub: 'Skin Rash / Urticaria', drug: 'HRZE' },
  { key: 'jaundice', label: 'ตัวเหลือง ตาเหลือง', sub: 'Jaundice / Hepatotoxicity', drug: 'HR' },
  { key: 'fever', label: 'ไข้จากยา', sub: 'Drug Fever', drug: 'HRZE' },
  { key: 'orange_urine', label: 'ปัสสาวะสีส้ม-แดง', sub: 'Orange Urine (ปกติจาก R)', drug: 'R' },
  { key: 'alopecia', label: 'ผมร่วง', sub: 'Alopecia', drug: 'R' },
  { key: 'gi', label: 'ปวดท้อง / ท้องเสีย', sub: 'GI Disturbance', drug: 'HRZE' },
  { key: 'neuro', label: 'ซึมเศร้า / นอนไม่หลับ', sub: 'Neuropsychiatric', drug: 'H' },
  { key: 'edema', label: 'บวม', sub: 'Edema', drug: '-' },
];

export const CONSULT_TYPES = [
  'ปรับขนาดยา (Dose Adjustment)',
  'Drug Interaction',
  'ADR Management',
  'Renal Dosing (CrCl)',
  'Medication Counseling',
  'Lab Interpretation',
  'TB Education',
  'อื่นๆ',
];

export const DRP_TYPES = [
  { code: 'C1', label: 'C1 — ใช้ยาที่ไม่จำเป็น' },
  { code: 'C2', label: 'C2 — ต้องการยาเพิ่ม' },
  { code: 'C3', label: 'C3 — ยาไม่มีประสิทธิภาพ' },
  { code: 'C4', label: 'C4 — ขนาดยาต่ำเกินไป' },
  { code: 'C5', label: 'C5 — อาการไม่พึงประสงค์ (ADR)' },
  { code: 'C6', label: 'C6 — ขนาดยาสูงเกินไป' },
  { code: 'C7', label: 'C7 — ผู้ป่วยไม่ให้ความร่วมมือ (Non-compliance)' },
  { code: 'C8', label: 'C8 — อื่นๆ' },
];

export const LAB_GROUPS = [
  { id: 'lft', label: 'LFT (ตับ)', color: 'amber', fields: [
    { key: 'alt', label: 'ALT', unit: 'U/L', lo: 0, hi: 40, critical: 120 },
    { key: 'ast', label: 'AST', unit: 'U/L', lo: 0, hi: 40, critical: 120 },
    { key: 'alp', label: 'ALP', unit: 'U/L', lo: 40, hi: 150, critical: null },
    { key: 'tbili', label: 'T.Bili', unit: 'mg/dL', lo: 0.2, hi: 1.2, critical: 3 },
    { key: 'dbili', label: 'D.Bili', unit: 'mg/dL', lo: 0, hi: 0.3, critical: null },
    { key: 'ibili', label: 'I.Bili', unit: 'mg/dL', lo: 0.1, hi: 1.0, critical: null },
    { key: 'alb', label: 'Albumin', unit: 'g/dL', lo: 3.5, hi: 5.0, critical: null, lowBad: true },
  ]},
  { id: 'cbc', label: 'CBC', color: 'blue', fields: [
    { key: 'wbc', label: 'WBC', unit: '×10³/μL', lo: 4.5, hi: 11.0, critical: null },
    { key: 'hb', label: 'Hb', unit: 'g/dL', lo: 12, hi: 17, critical: 7, lowBad: true },
    { key: 'hct', label: 'Hct', unit: '%', lo: 36, hi: 52, critical: null, lowBad: true },
    { key: 'mcv', label: 'MCV', unit: 'fL', lo: 80, hi: 100, critical: null },
    { key: 'plt', label: 'Plt', unit: '×10³/μL', lo: 150, hi: 400, critical: 50, lowBad: true },
    { key: 'n', label: 'N', unit: '%', lo: 50, hi: 70, critical: null },
    { key: 'l', label: 'L', unit: '%', lo: 20, hi: 40, critical: null },
    { key: 'm', label: 'M', unit: '%', lo: 0, hi: 10, critical: null },
    { key: 'e', label: 'E', unit: '%', lo: 0, hi: 5, critical: null },
    { key: 'b', label: 'B', unit: '%', lo: 0, hi: 1, critical: null },
  ]},
  { id: 'renal', label: 'Renal / UA', color: 'indigo', fields: [
    { key: 'scr', label: 'Scr', unit: 'mg/dL', lo: 0.6, hi: 1.2, critical: 5 },
    { key: 'bun', label: 'BUN', unit: 'mg/dL', lo: 7, hi: 20, critical: null },
    { key: 'ua', label: 'Uric Acid', unit: 'mg/dL', lo: 3.5, hi: 7.2, critical: 10 },
  ]},
];

// ========== INTERFACES ==========
export interface Patient {
  id: string;
  hn: string;
  prefix: string;
  firstName: string;
  lastName: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  patientType: string;
  diseaseLocation: string;
  extraPulmonaryType: string;
  subdistrict: string;
  weight: number;
  regimen: string;
  regimenHistory: RegimenHistory[];
  phase: 'Intensive' | 'Continuation';
  month: number;
  day: number;
  status: 'normal' | 'warning' | 'critical';
  adherence: number;
  comorbidities: string[];
  concomitantDrugs: string[];
  hivStatus: string | null;
  hivNote: string;
  nextAppt: string;
  daysUntil: number;
  startDate: string;
  labs: LabRecord[];
  sputum: SputumRecord[];
  adr: Record<string, { checked: boolean; note: string }>;
  visits: VisitRecord[];
  dot: Record<string, boolean>;
  customDoses: Record<string, number> | null;
}

export interface RegimenHistory {
  regimen: string;
  startDate: string;
  reason: string;
  endDate?: string;
  isCurrent: boolean;
}

export interface LabRecord {
  tp: string;
  date: string;
  alt?: number;
  ast?: number;
  alp?: number;
  tbili?: number;
  dbili?: number;
  ibili?: number;
  alb?: number;
  scr?: number;
  bun?: number;
  ua?: number;
  hbsag?: string;
  hcv?: string;
  cbc?: Record<string, number>;
}

export interface SputumRecord {
  tp: string;
  result: string;
  date: string;
  scantyCount?: string;
  genexpert?: string;
  genexpertRif?: string;
}

export interface VisitRecord {
  id: string;
  date: string;
  weight: number;
  note: string;
  type: string;
  vitals?: Record<string, string>;
  drugDoses?: string;
  consult?: { type: string; note: string };
  drp?: { type: string; note: string }[];
  adrNoted?: string[];
  labData?: Record<string, unknown>;
  sputumQuick?: Record<string, unknown>;
}

// ========== DOSE CALCULATION ==========
export function calcDoses(weight: number, regimen: string, manualTabs?: Record<string, number>) {
  const w = parseFloat(String(weight));
  if (!w || w < 5) return [];
  
  const r = regimen || '';
  let keys = ['R', 'H', 'Z', 'E'];
  if (r === '6-9H') keys = ['H'];
  else if (r === '3HR') keys = ['R', 'H'];
  else if (r.match(/HRE/) && !r.match(/Z/)) keys = ['R', 'H', 'E'];
  
  let auto: Record<string, number> = {};
  if (w < 40) auto = { R: 1, H: 2, Z: 2, E: 2 };
  else if (w < 55) auto = { R: 2, H: 3, Z: 3, E: 3 };
  else if (w < 70) auto = { R: 2, H: 3, Z: 3, E: 3 };
  else if (w < 85) auto = { R: 3, H: 4, Z: 4, E: 4 };
  else auto = { R: 3, H: 4, Z: 5, E: 4 };
  
  return keys.map((key) => {
    const d = DRUG_RANGES[key as keyof typeof DRUG_RANGES];
    const t = (manualTabs && manualTabs[key] != null) ? parseInt(String(manualTabs[key])) : (auto[key] || 1);
    const dose = t * d.strength;
    const mgkg = +(dose / w).toFixed(1);
    const st = (mgkg > d.max || dose > d.absMax) ? 'high' : (mgkg < d.min) ? 'low' : 'ok';
    return { key, name: d.name, strength: d.strength, tabs: t, dose, mgkg, min: d.min, max: d.max, absMax: d.absMax, status: st };
  });
}

// CrCl Cockcroft-Gault
export function calcCrCl(age: number, weight: number, scr: number, gender: 'M' | 'F') {
  if (!age || !weight || !scr || scr <= 0) return null;
  let crcl = ((140 - age) * weight) / (72 * scr);
  if (gender === 'F') crcl *= 0.85;
  return +crcl.toFixed(1);
}

export function crClStage(crcl: number | null) {
  if (crcl === null) return { label: '-', color: 'text-gray-400' };
  if (crcl >= 90) return { label: `Normal (${crcl})`, color: 'text-green-600' };
  if (crcl >= 60) return { label: `Mild CKD (${crcl})`, color: 'text-lime-600' };
  if (crcl >= 30) return { label: `Moderate CKD (${crcl})`, color: 'text-amber-600' };
  if (crcl >= 15) return { label: `Severe CKD (${crcl})`, color: 'text-orange-600' };
  return { label: `Kidney Failure (${crcl})`, color: 'text-red-600' };
}

export function generateAlerts(patients: Patient[]) {
  const alerts: Array<{ id: string; type: string; patient: string; msg: string; time: string }> = [];
  
  patients.forEach((p) => {
    const last = p.labs[p.labs.length - 1];
    if (last && last.alt && last.alt > 120)
      alerts.push({ id: 'alt-' + p.id, type: 'critical', patient: p.name, msg: 'ALT สูง ' + last.alt + ' U/L — ควรหยุดยาทันที', time: 'ล่าสุด' });
    if (last && last.ua && last.ua > 9)
      alerts.push({ id: 'ua-' + p.id, type: 'warning', patient: p.name, msg: 'Uric Acid สูง ' + last.ua + ' mg/dL', time: 'ล่าสุด' });
    if (p.daysUntil <= 1)
      alerts.push({ id: 'appt-' + p.id, type: 'info', patient: p.name, msg: 'มีนัดพรุ่งนี้ (' + p.nextAppt + ')', time: 'วันนี้' });
    if ((p.comorbidities || []).join(' ').includes('HIV'))
      alerts.push({ id: 'hiv-' + p.id, type: 'warning', patient: p.name, msg: 'ระวัง Drug Interaction: Rifampicin + ARV', time: 'แจ้งเตือนต่อเนื่อง' });
  });
  
  return alerts;
}

// migrate old boolean adr → {checked, note}
export function migrateAdr(adr: Record<string, unknown>) {
  if (!adr) return {};
  const out: Record<string, { checked: boolean; note: string }> = {};
  ADR_LIST.forEach((a) => {
    const v = adr[a.key];
    if (v === undefined || v === null) {
      out[a.key] = { checked: false, note: '' };
    } else if (typeof v === 'boolean') {
      out[a.key] = { checked: v, note: '' };
    } else {
      out[a.key] = v as { checked: boolean; note: string };
    }
  });
  return out;
}

export function getLabStatus(val: unknown, field: { lo: number; hi: number; critical: number | null; lowBad?: boolean }) {
  if (val === '' || val === null || val === undefined) return 'empty';
  const n = parseFloat(String(val));
  if (isNaN(n)) return 'empty';
  if (field.critical) {
    if (field.lowBad && n < field.critical) return 'critical';
    if (!field.lowBad && n > field.critical) return 'critical';
  }
  if (n < field.lo) return field.lowBad ? 'low-bad' : 'low';
  if (n > field.hi) return field.lowBad ? 'high-ok' : 'high';
  return 'normal';
}

export const LAB_STATUS_STYLE: Record<string, string> = {
  'critical': 'text-red-700 font-black bg-red-50',
  'low-bad': 'text-red-600 font-bold',
  'high': 'text-amber-700 font-bold',
  'high-ok': 'text-gray-500',
  'low': 'text-blue-600 font-semibold',
  'normal': 'text-green-700',
  'empty': 'text-gray-300',
};
