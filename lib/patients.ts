import type { Patient } from './data';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'P001', hn: '12345/67',
    prefix: 'นาย', firstName: 'ณรงค์ศักดิ์', lastName: 'สุขใจ',
    name: 'นาย ณรงค์ศักดิ์ สุขใจ',
    age: 45, gender: 'M', patientType: 'New',
    diseaseLocation: 'Pulmonary', extraPulmonaryType: '',
    subdistrict: 'พิมาย',
    weight: 68, regimen: '2HRZE/4HR',
    regimenHistory: [
      { regimen: '2HRZE/4HR', startDate: '2024-08-10', reason: 'เริ่มรักษาครั้งแรก', isCurrent: true }
    ],
    phase: 'Intensive', month: 2, day: 50,
    status: 'normal', adherence: 98,
    comorbidities: ['เบาหวาน (DM)'],
    concomitantDrugs: ['Metformin 500mg OD'],
    hivStatus: null, hivNote: '',
    nextAppt: '25 ต.ค. 67', daysUntil: 4, startDate: '2024-08-10',
    labs: [
      { tp: 'M0', date: '2024-08-10', alt: 30, ast: 28, scr: 0.9, ua: 6.5, hbsag: 'Negative', hcv: 'Negative' },
      { tp: 'M1', date: '2024-09-10', alt: 45, ast: 40, scr: 0.9, ua: 8.2, hbsag: '', hcv: '' },
      { tp: 'M2', date: '2024-10-10', alt: 55, ast: 48, scr: 1.0, ua: 9.1, hbsag: '', hcv: '' },
    ],
    sputum: [{ tp: 'M0', result: '3+', date: '2024-08-10' }],
    adr: {
      neuropathy: { checked: false, note: '' }, nausea: { checked: true, note: 'คลื่นไส้ตอนเช้า ดีขึ้นหลังกินยาหลังอาหาร' },
      arthralgia: { checked: false, note: '' }, optic: { checked: false, note: '' }, rash: { checked: false, note: '' },
      jaundice: { checked: false, note: '' }, fever: { checked: false, note: '' }, orange_urine: { checked: true, note: 'ปกติ' },
      alopecia: { checked: false, note: '' }, gi: { checked: false, note: '' }, neuro: { checked: false, note: '' }, edema: { checked: false, note: '' }
    },
    visits: [
      { id: 'v1', date: '2024-08-10', weight: 68, note: 'S: ไม่มีอาการผิดปกติ\nO: น้ำหนัก 68 kg, BP 120/80\nA: เริ่มยา TB ครั้งแรก ทนยาได้ดี\nP: นัดติดตาม 1 เดือน', type: 'visit' },
      { id: 'v2', date: '2024-09-10', weight: 68, note: 'S: คลื่นไส้ตอนเช้าเล็กน้อย\nO: ALT 45 (สูงเล็กน้อย)\nA: ADR จาก RIF/PZA ระดับเบา\nP: แนะนำกินยาหลังอาหาร เพิ่ม Pyridoxine B6', type: 'visit' },
      { id: 'v3', date: '2024-10-10', weight: 68, note: 'S: คลื่นไส้ดีขึ้น\nO: ALT 55, UA 9.1 (สูง)\nA: Hyperuricemia จาก PZA\nP: Monitor UA ต่อ, แนะนำดื่มน้ำมากๆ', type: 'visit' },
    ],
    dot: { '2024-10-14': true, '2024-10-15': true, '2024-10-16': true, '2024-10-17': false, '2024-10-18': true, '2024-10-19': true, '2024-10-20': true, '2024-10-21': true },
    customDoses: null
  },
  {
    id: 'P002', hn: '67890/67',
    prefix: 'นางสาว', firstName: 'จิราพร', lastName: 'สว่างศรี',
    name: 'นางสาว จิราพร สว่างศรี',
    age: 32, gender: 'F', patientType: 'New',
    diseaseLocation: 'Pulmonary', extraPulmonaryType: '',
    subdistrict: 'กู่',
    weight: 55, regimen: '2HRE/7HR',
    regimenHistory: [
      { regimen: '2HRZE/4HR', startDate: '2024-07-15', reason: 'เริ่มรักษาครั้งแรก', endDate: '2024-10-15', isCurrent: false },
      { regimen: '2HRE/7HR', startDate: '2024-10-15', reason: 'HOLD PZA — Drug-Induced Hepatitis (ALT 185)', isCurrent: true }
    ],
    phase: 'Continuation', month: 3, day: 95,
    status: 'critical', adherence: 85,
    comorbidities: ['HIV/AIDS'],
    concomitantDrugs: ['ARV (Efavirenz) OD'],
    hivStatus: 'Positive', hivNote: 'CD4 = 350 cells/mm³',
    nextAppt: '22 ต.ค. 67', daysUntil: 1, startDate: '2024-07-15',
    labs: [
      { tp: 'M0', date: '2024-07-15', alt: 25, ast: 22, scr: 0.8, ua: 5.5, hbsag: 'Negative', hcv: 'Negative' },
      { tp: 'M1', date: '2024-08-15', alt: 80, ast: 75, scr: 0.85, ua: 7.0, hbsag: '', hcv: '' },
      { tp: 'M2', date: '2024-09-15', alt: 185, ast: 160, scr: 0.9, ua: 8.5, hbsag: '', hcv: '' },
    ],
    sputum: [
      { tp: 'M0', result: '2+', date: '2024-07-15' },
      { tp: 'M2', result: 'Neg', date: '2024-09-20' },
    ],
    adr: {
      neuropathy: { checked: true, note: 'ชาปลายนิ้วทั้งสองข้าง เริ่มเดือน 2' },
      nausea: { checked: true, note: 'คลื่นไส้มาก โดยเฉพาะตอนเช้า' },
      arthralgia: { checked: false, note: '' }, optic: { checked: false, note: '' }, rash: { checked: false, note: '' },
      jaundice: { checked: true, note: 'ตัวเหลืองเล็กน้อย สังเกตได้ที่ตาขาว' },
      fever: { checked: false, note: '' }, orange_urine: { checked: true, note: 'ปกติจาก RIF' },
      alopecia: { checked: false, note: '' }, gi: { checked: false, note: '' }, neuro: { checked: false, note: '' }, edema: { checked: false, note: '' }
    },
    visits: [
      { id: 'v1', date: '2024-07-15', weight: 55, note: 'เริ่มยา TB พร้อม ARV ระวัง Drug Interaction', type: 'visit' },
      { id: 'v2', date: '2024-09-15', weight: 54, note: 'ALT 185 — HOLD ยา TB ทุกตัว รอ LFT ซ้ำ 1 สัปดาห์', type: 'visit' },
    ],
    dot: { '2024-10-14': true, '2024-10-15': true, '2024-10-16': true, '2024-10-17': false, '2024-10-18': false, '2024-10-19': true, '2024-10-20': false, '2024-10-21': true },
    customDoses: null
  },
  {
    id: 'P003', hn: '11223/66',
    prefix: 'นาย', firstName: 'วิชัย', lastName: 'ดวงดี',
    name: 'นาย วิชัย ดวงดี',
    age: 58, gender: 'M', patientType: 'New',
    diseaseLocation: 'Pulmonary', extraPulmonaryType: '',
    subdistrict: 'ตูม',
    weight: 72, regimen: '2HRZE/4HR',
    regimenHistory: [
      { regimen: '2HRZE/4HR', startDate: '2024-05-20', reason: 'เริ่มรักษาครั้งแรก', isCurrent: true }
    ],
    phase: 'Continuation', month: 5, day: 152,
    status: 'normal', adherence: 95,
    comorbidities: ['ความดันโลหิตสูง (HT)'],
    concomitantDrugs: ['Amlodipine 5mg OD', 'Enalapril 5mg OD'],
    hivStatus: 'Negative', hivNote: '',
    nextAppt: '28 ต.ค. 67', daysUntil: 7, startDate: '2024-05-20',
    labs: [
      { tp: 'M0', date: '2024-05-20', alt: 28, ast: 25, scr: 1.0, ua: 6.0, hbsag: 'Negative', hcv: 'Negative' },
      { tp: 'M2', date: '2024-07-20', alt: 35, ast: 30, scr: 1.1, ua: 7.2, hbsag: '', hcv: '' },
      { tp: 'M4', date: '2024-09-20', alt: 32, ast: 28, scr: 1.0, ua: 7.8, hbsag: '', hcv: '' },
    ],
    sputum: [
      { tp: 'M0', result: '1+', date: '2024-05-20' },
      { tp: 'M2', result: 'Neg', date: '2024-07-25' },
      { tp: 'M5', result: 'Neg', date: '2024-10-22' },
    ],
    adr: {
      neuropathy: { checked: false, note: '' }, nausea: { checked: false, note: '' },
      arthralgia: { checked: true, note: 'ปวดข้อเข่าและข้อมือ เริ่มสัปดาห์ที่ 3' },
      optic: { checked: false, note: '' }, rash: { checked: false, note: '' }, jaundice: { checked: false, note: '' },
      fever: { checked: false, note: '' }, orange_urine: { checked: true, note: 'ปกติจาก RIF' },
      alopecia: { checked: false, note: '' }, gi: { checked: false, note: '' }, neuro: { checked: false, note: '' }, edema: { checked: false, note: '' }
    },
    visits: [
      { id: 'v1', date: '2024-05-20', weight: 72, note: 'เริ่มยา TB ครั้งแรก ไม่มีอาการผิดปกติ', type: 'visit' },
      { id: 'v2', date: '2024-07-20', weight: 71, note: 'ปวดข้อเข่า — น่าจะจาก Hyperuricemia เฝ้าระวัง', type: 'visit' },
      { id: 'v3', date: '2024-09-20', weight: 71, note: 'อาการปวดข้อดีขึ้น UA ยังสูงเล็กน้อย ทนยาได้ดี', type: 'visit' },
    ],
    dot: { '2024-10-15': true, '2024-10-16': true, '2024-10-17': true, '2024-10-18': true, '2024-10-19': true, '2024-10-20': true, '2024-10-21': true },
    customDoses: null
  },
  {
    id: 'P004', hn: '55555/67',
    prefix: 'นาย', firstName: 'ทดสอบ', lastName: 'ระบบครบ',
    name: 'นาย ทดสอบ ระบบครบ',
    age: 42, gender: 'M', patientType: 'Relapse',
    diseaseLocation: 'Extra-pulmonary', extraPulmonaryType: 'TB Spine',
    subdistrict: 'โพธิ์ศรี',
    weight: 58, regimen: '2HRE/7HR',
    regimenHistory: [
      { regimen: '2HRZE/4HR', startDate: '2024-01-10', reason: 'เริ่มรักษา Relapse', isCurrent: false, endDate: '2024-04-10' },
      { regimen: '2HRE/7HR', startDate: '2024-04-10', reason: 'HOLD PZA — UA 11.2 + ปวดข้อมาก', isCurrent: true }
    ],
    phase: 'Continuation', month: 4, day: 120,
    status: 'normal', adherence: 92,
    comorbidities: ['เบาหวาน (DM)', 'ความดันโลหิตสูง (HT)'],
    concomitantDrugs: ['Metformin 500mg BID', 'Amlodipine 5mg OD'],
    hivStatus: 'Negative', hivNote: '',
    nextAppt: '5 พ.ค. 69', daysUntil: 4, startDate: '2024-01-10',
    labs: [
      { tp: 'M0', date: '2024-01-10', alt: 32, ast: 28, alp: 88, tbili: 0.6, dbili: 0.2, alb: 3.8, scr: 0.95, bun: 14, ua: 7.2, hbsag: 'Negative', hcv: 'Negative' },
      { tp: 'M2', date: '2024-03-10', alt: 48, ast: 42, alp: 85, tbili: 0.6, dbili: 0.2, alb: 3.7, scr: 0.92, bun: 13, ua: 11.2, hbsag: '', hcv: '' },
      { tp: 'M4', date: '2024-05-10', alt: 38, ast: 34, alp: 80, tbili: 0.5, dbili: 0.1, alb: 3.9, scr: 0.90, bun: 12, ua: 7.8, hbsag: '', hcv: '' }
    ],
    sputum: [
      { tp: 'M0', result: '2+', date: '2024-01-10', scantyCount: '', genexpert: 'Detected', genexpertRif: 'Sensitive' },
      { tp: 'M2', result: 'Scanty', date: '2024-03-10', scantyCount: '2-5/100F', genexpert: 'Not Detected', genexpertRif: '' },
      { tp: 'M4', result: 'Neg', date: '2024-05-10', scantyCount: '', genexpert: '', genexpertRif: '' }
    ],
    adr: {
      neuropathy: { checked: false, note: '' },
      nausea: { checked: true, note: 'คลื่นไส้เล็กน้อยสัปดาห์แรก ดีขึ้นแล้ว' },
      arthralgia: { checked: true, note: 'ปวดข้อเข่า — จาก UA สูง 11.2' },
      optic: { checked: false, note: '' }, rash: { checked: false, note: '' }, jaundice: { checked: false, note: '' },
      fever: { checked: false, note: '' }, orange_urine: { checked: true, note: 'ปกติจาก RIF — แจ้งผู้ป่วยแล้ว' },
      alopecia: { checked: false, note: '' }, gi: { checked: false, note: '' }, neuro: { checked: false, note: '' }, edema: { checked: false, note: '' }
    },
    visits: [
      {
        id: 'v1', date: '2024-01-10', weight: 58, type: 'visit',
        vitals: { bp: '128/82', hr: '78', rr: '18', temp: '36.7', o2: '98' },
        drugDoses: 'H300 R450 Z1000 E800',
        note: 'S: ปวดหลังลดลงบ้าง ไอแห้งๆ\nO: BW 58kg, BP 128/82\n>>> CXR: RUL infiltration ลดลงเล็กน้อย\n>>> Sputum AFB 2+ | GeneXpert: MTB Detected, RIF Sensitive\n>>> Baseline: AST 28 ALT 32 ALP 88 UA 7.2\nA: เริ่มยา Relapse case ทนยาได้ดี\nP: นัด 1 เดือน ติดตาม LFT + UA',
        consult: { type: 'ปรับขนาดยา (Dose Adjustment)', note: 'H300 R450 Z1000 E800 เหมาะสมสำหรับ BW 58kg' },
        drp: [], adrNoted: [], labData: {}, sputumQuick: {}
      },
      {
        id: 'v2', date: '2024-03-10', weight: 59, type: 'visit',
        vitals: { bp: '130/84', hr: '76', rr: '18', temp: '36.6', o2: '97' },
        drugDoses: 'H300 R450 Z1000 E800',
        note: 'S: ปวดข้อเข่ามากขึ้น บวมเล็กน้อย\nO: UA 11.2 → HOLD PZA\n>>> เปลี่ยนสูตรเป็น 2HRE/7HR\nA: Hyperuricemia จาก PZA ระดับสูง\nP: ตัด PZA, ต่อด้วย HRE, ติดตาม UA เดือนหน้า',
        consult: { type: 'ADR Management', note: 'Hyperuricemia UA 11.2 — HOLD PZA เปลี่ยนสูตร HRE' },
        drp: [{ type: 'C5', note: 'ADR Hyperuricemia จาก PZA — UA 11.2 mg/dL ปวดข้อมาก' }],
        adrNoted: ['arthralgia', 'nausea'],
        labData: {},
        sputumQuick: { tp: 'M2', result: 'Scanty', scantyCount: '2-5/100F', genexpert: 'Not Detected', genexpertRif: '' }
      },
      {
        id: 'v3', date: '2024-05-10', weight: 60, type: 'visit',
        vitals: { bp: '124/78', hr: '70', rr: '16', temp: '36.4', o2: '99' },
        drugDoses: 'H300 R450 E800',
        note: 'S: อาการปวดข้อดีขึ้นมาก UA ลดลง\nO: UA 7.8, ALT 38 ปกติ, Sputum M4: Negative\nA: ตอบสนองต่อการรักษาดี Sputum Conversion สำเร็จ\nP: ต่อ HRE ครบกำหนด นัดอีก 1 เดือน',
        consult: { type: 'Medication Counseling', note: 'แนะนำความสำคัญของการกินยาต่อเนื่อง และสังเกตอาการตาพร่า (Optic Neuritis จาก EMB)' },
        drp: [], adrNoted: [],
        labData: {},
        sputumQuick: { tp: 'M4', result: 'Neg', scantyCount: '', genexpert: '', genexpertRif: '' }
      }
    ],
    dot: {
      '2025-04-20': true, '2025-04-21': true, '2025-04-22': true, '2025-04-23': false,
      '2025-04-24': true, '2025-04-25': true, '2025-04-26': true, '2025-04-27': true,
      '2025-04-28': true, '2025-04-29': true, '2025-04-30': true, '2025-05-01': true
    },
    customDoses: null
  }
];
