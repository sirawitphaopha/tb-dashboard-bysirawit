// tb-constants.js — enums / labels / lab-reference tables (แยกจาก tb-data.js รอบ 3)
// pure data, assign window.* · โหลดก่อน globals.js snapshot (ดู TbBundle import order)

// ========== CONSTANTS ==========
window.TAMBONS = ['พิมาย','พิมายเหนือ','กู่','ตูม','สำโรงปราสาท','โพธิ์ศรี','สมอ','ดวนใหญ่','บ้านไทย','ไพรขลา'];
window.REGIMENS = ['2HRZE/4HR','2HRZE/7HR','2HRE/7HR','2HRZE/10HR','6-9H','3HR'];
window.EXTRA_PULMONARY_TYPES = ['TB Lymphadenitis','TB Pleural','TB Meningitis','TB Cutaneous','TB Spine','TB Skeletal','TB Colon','อื่นๆ (Other)'];
window.PATIENT_TYPES = ['New','Relapse','Treatment Failure'];
window.DISEASE_LOCATIONS = ['LTBI','Pulmonary','Extra-pulmonary'];
window.PREFIXES = ['นาย','นาง','นางสาว','เด็กชาย','เด็กหญิง'];

// ════════ บัญชีกลางวิชาชีพ (ฝั่งหน้าเว็บ) ════════
// ⚠️ ต้องตรงกับ lib/professions.ts ฝั่งเซิร์ฟเวอร์เสมอ (key + label + prefix)
// key = ค่าที่เก็บจริงในฐานข้อมูล (คอลัมน์ profession)
// prefix = คำนำหน้า "เลขใบประกอบ" (ภ.12345)
// titleMale/titleFemale = ตัวย่อวิชาชีพตามเพศ (null = ไม่มีตัวย่อ → ใช้คำนำหน้านามตรงๆ)
window.TB_NAME_PREFIXES = ['นาย', 'นาง', 'นางสาว'];  // ผู้ใช้เลือกคำนำหน้านี้ ระบบแปลงเป็นตัวย่อวิชาชีพให้
window.TB_PROFESSIONS = {
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
};
// ป้ายภาษาไทยล้วน (key → label) ใช้ตอนแสดงผล/dropdown
window.TB_PROFESSION_LABELS = Object.fromEntries(
  Object.entries(window.TB_PROFESSIONS).map(([k, v]) => [k, v.label])
);
// helper: คำนำหน้าเลขใบประกอบตามวิชาชีพ
window.tbProfPrefix = (key) => (window.TB_PROFESSIONS[key] && window.TB_PROFESSIONS[key].prefix) || '';
// helper: ตัดเหลือเฉพาะตัวเลข (ลอกคำนำหน้าทุกแบบออก)
window.tbLicenseDigits = (val) => (val || '').replace(/\D/g, '');
// helper: ประกอบเลขใบประกอบเต็ม = คำนำหน้า + ตัวเลข
window.tbBuildLicense = (key, raw) => window.tbProfPrefix(key) + window.tbLicenseDigits(raw);
// helper: คำนำหน้าที่แสดงจริง = ตัวย่อวิชาชีพตามเพศ (ถ้ามี) ไม่งั้นใช้คำนำหน้านามตรงๆ
window.tbDisplayTitle = (key, namePrefix) => {
  var p = window.TB_PROFESSIONS[key];
  if (p && p.titleMale) {
    var isFemale = (namePrefix === 'นาง' || namePrefix === 'นางสาว');
    return isFemale ? (p.titleFemale || p.titleMale) : p.titleMale;
  }
  return namePrefix || '';
};

// ════════ เบอร์โทร (ฝั่งหน้าเว็บ) — ต้องตรงกับ lib/phone.ts ฝั่งเซิร์ฟเวอร์ ════════
// จัดรูปแบบใส่ขีด: 0812345678 → 081-234-5678
window.tbFormatPhone = (val) => {
  var d = (val || '').replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + '-' + d.slice(3);
  return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
};
// ตรวจเบอร์ (เข้มสุด): มือถือ 06/08/09 + เบอร์บ้าน กทม. 02 + บล็อกเลขซ้ำ/เรียง
window.tbValidatePhone = (phone) => {
  var d = (phone || '').replace(/\D/g, '');
  if (d.length === 0) return { ok: false, msg: 'กรุณากรอกเบอร์โทรศัพท์' };
  if (d.length !== 10) return { ok: false, msg: 'เบอร์โทรต้องมี 10 หลัก (เช่น 081-234-5678)' };
  var prefix2 = d.slice(0, 2);
  var validPrefixes = ['02', '06', '08', '09'];
  if (validPrefixes.indexOf(prefix2) === -1) {
    var provincial = { '03': 'ภาคกลาง/ตะวันออก', '04': 'ภาคอีสาน', '05': 'ภาคเหนือ', '07': 'ภาคใต้' };
    if (provincial[prefix2]) return { ok: false, msg: 'เบอร์ ' + prefix2 + ' เป็นเบอร์บ้านต่างจังหวัด (' + provincial[prefix2] + ') — ระบบไม่รองรับ กรุณาใช้เบอร์มือถือ (06/08/09) หรือเบอร์บ้านกรุงเทพ (02)' };
    if (prefix2 === '00' || prefix2.charAt(0) === '1') return { ok: false, msg: 'เบอร์ที่กรอกไม่ถูกต้อง กรุณากรอกเบอร์มือถือ (06/08/09) หรือเบอร์บ้าน กทม. (02)' };
    if (prefix2 === '01') return { ok: false, msg: 'รหัส 01 เป็นเบอร์บริการพิเศษ (ไม่ใช่เบอร์ส่วนตัว) — กรุณาใช้เบอร์มือถือ (06/08/09)' };
    return { ok: false, msg: 'เบอร์ต้องขึ้นต้นด้วย 02 (กทม.), 06, 08 หรือ 09 (มือถือ)' };
  }
  if (/^(\d)\1{9}$/.test(d)) return { ok: false, msg: 'เบอร์ที่กรอกเป็นเลขซ้ำกันทั้งหมด กรุณากรอกเบอร์จริง' };
  var last8 = d.slice(2);
  if (/^(\d)\1{7}$/.test(last8)) return { ok: false, msg: 'เบอร์ที่กรอกมีรูปแบบผิดปกติ กรุณากรอกเบอร์จริง' };
  var asc = function (s) { for (var i = 1; i < s.length; i++) { if (parseInt(s[i]) !== (parseInt(s[i - 1]) + 1) % 10) return false; } return true; };
  var desc = function (s) { for (var i = 1; i < s.length; i++) { if (parseInt(s[i]) !== (parseInt(s[i - 1]) - 1 + 10) % 10) return false; } return true; };
  if (asc(d) || desc(d) || asc(last8) || desc(last8)) return { ok: false, msg: 'เบอร์ที่กรอกเป็นเลขเรียงต่อกัน กรุณากรอกเบอร์จริง' };
  return { ok: true, msg: '' };
};

window.OUTCOME_TYPES = [
  { value:'Cured',          label:'รักษาหาย (Cured)',                color:'text-green-700 bg-green-100'   },
  { value:'Completed',      label:'ครบการรักษา (Treatment Completed)',color:'text-teal-700 bg-teal-100'     },
  { value:'Failed',         label:'รักษาไม่สำเร็จ (Treatment Failed)',color:'text-red-700 bg-red-100'       },
  { value:'Died',           label:'เสียชีวิต (Died)',                color:'text-gray-600 bg-gray-200'     },
  { value:'LostToFollowUp', label:'ขาดการติดตาม (Lost to Follow-up)',color:'text-amber-700 bg-amber-100'   },
  { value:'NotEvaluated',   label:'ไม่ได้ประเมิน (Not Evaluated)',   color:'text-purple-700 bg-purple-100' },
];

window.DRUG_RANGES = {
  R:  { name:'Rifampicin (R)',        strength:300, min:8,   max:12, absMax:600  },
  H:  { name:'Isoniazid (H)',         strength:100, min:4,   max:6,  absMax:300  },
  Z:  { name:'Pyrazinamide (Z)',      strength:500, min:20,  max:30, absMax:2000 },
  E:  { name:'Ethambutol (E)',        strength:400, min:15,  max:20, absMax:1600 },
  Lfx:{ name:'Levofloxacin (Lfx)',   strength:500, min:7.5, max:10, absMax:1000 },
  Am: { name:'Amikacin (Am)',         strength:500, min:15,  max:20, absMax:1500, unit:'vial' },
};

window.DEFAULT_COMORBIDITIES = [
  { name:'เบาหวาน',                  abbr:'DM'        },
  { name:'ความดันโลหิตสูง',           abbr:'HT'        },
  { name:'HIV/AIDS',                  abbr:'HIV'       },
  { name:'โรคไตเรื้อรัง',             abbr:'CKD'       },
  { name:'ตับแข็ง',                   abbr:'Cirrhosis' },
  { name:'ถุงลมโป่งพอง',              abbr:'COPD'      },
  { name:'มะเร็ง',                    abbr:'Cancer'    },
  { name:'ภาวะขาดสารอาหาร',           abbr:'Malnutr'   },
  { name:'ยากดภูมิคุ้มกัน',           abbr:'Immuno'    },
  { name:'โรคข้ออักเสบรูมาตอยด์',     abbr:'RA'        },
  { name:'โรคหัวใจ',                  abbr:'CVD'       },
  { name:'ภาวะไขมันในเลือดสูง',       abbr:'DLP'       },
  { name:'โรคหลอดเลือดสมอง',          abbr:'Stroke'    },
  { name:'ตับอักเสบ B เรื้อรัง',      abbr:'HBV'       },
  { name:'ตับอักเสบ C เรื้อรัง',      abbr:'HCV'       },
  { name:'AF (หัวใจเต้นผิดจังหวะ)',    abbr:'AF'        },
  { name:'ใช้ยา Warfarin',            abbr:'Warfarin'  },
  { name:'ดื่มแอลกอฮอล์',             abbr:'EtOH'      },
  { name:'ตั้งครรภ์',                 abbr:'Preg'      },
];

window.DEFAULT_RESTART_REASONS = [
  'เริ่มรักษาครั้งแรก (Original)',
  'กลับเป็นซ้ำ (Relapse)',
  'รักษาล้มเหลว (Treatment Failure)',
  'หยุดยาและกลับมารักษาใหม่ (Re-treatment after Default)',
  'เริ่มใหม่หลัง DILI / Hepatotoxicity',
  'เริ่มใหม่หลัง ADR / Re-challenge ผื่น',
  'ปรับสูตรยา (Regimen Change)',
  'อื่นๆ',
];
window.DEFAULT_DRUGS = [
  'Metformin','Glipizide','Insulin','Amlodipine','Enalapril','Losartan',
  'Furosemide','ARV (Efavirenz)','ARV (PI-based)','Prednisolone','Allopurinol','Warfarin'
];

// ADR master list
window.ADR_LIST = [
  { key:'neuropathy',  label:'ชาปลายมือ-เท้า',          sub:'Peripheral Neuropathy',    drug:'H'     },
  { key:'nausea',      label:'คลื่นไส้ อาเจียน',          sub:'Nausea / Vomiting',        drug:'HRZE'  },
  { key:'arthralgia',  label:'ปวดข้อ',                    sub:'Arthralgia / Hyperuricemia',drug:'Z'     },
  { key:'optic',       label:'ตาพร่า / มองเห็นผิดปกติ',   sub:'Optic Neuritis',           drug:'E'     },
  { key:'rash',        label:'ผื่นคัน / ลมพิษ',           sub:'Skin Rash / Urticaria',    drug:'HRZE'  },
  { key:'jaundice',    label:'ตัวเหลือง ตาเหลือง',        sub:'Jaundice / Hepatotoxicity', drug:'HR'    },
  { key:'fever',       label:'ไข้จากยา',                  sub:'Drug Fever',               drug:'HRZE'  },
  { key:'orange_urine',label:'ปัสสาวะสีส้ม-แดง',          sub:'Orange Urine (ปกติจาก R)', drug:'R'     },
  { key:'alopecia',    label:'ผมร่วง',                    sub:'Alopecia',                 drug:'R'     },
  { key:'gi',          label:'ปวดท้อง / ท้องเสีย',        sub:'GI Disturbance',           drug:'HRZE'  },
  { key:'neuro',       label:'ซึมเศร้า / นอนไม่หลับ',     sub:'Neuropsychiatric',         drug:'H'     },
  { key:'edema',       label:'บวม',                       sub:'Edema',                    drug:'-'     },
];

