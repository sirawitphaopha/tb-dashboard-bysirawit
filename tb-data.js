
// ========== CONSTANTS ==========
window.TAMBONS = ['พิมาย','พิมายเหนือ','กู่','ตูม','สำโรงปราสาท','โพธิ์ศรี','สมอ','ดวนใหญ่','บ้านไทย','ไพรขลา'];
window.REGIMENS = ['2HRZE/4HR','2HRZE/7HR','2HRE/7HR','2HRZE/10HR','6-9H','3HR'];
window.EXTRA_PULMONARY_TYPES = ['TB Lymphadenitis','TB Pleural','TB Meningitis','TB Cutaneous','TB Spine','TB Skeletal','TB Colon','อื่นๆ (Other)'];
window.PATIENT_TYPES = ['New','Relapse','Treatment Failure','Default'];
window.DISEASE_LOCATIONS = ['LTBI','Pulmonary','Extra-pulmonary'];
window.PREFIXES = ['นาย','นาง','นางสาว','เด็กชาย','เด็กหญิง'];

window.DRUG_RANGES = {
  R:{ name:'Rifampicin (R)',   strength:300, min:8,  max:12, absMax:600  },
  H:{ name:'Isoniazid (H)',    strength:100, min:4,  max:6,  absMax:300  },
  Z:{ name:'Pyrazinamide (Z)', strength:500, min:20, max:30, absMax:2000 },
  E:{ name:'Ethambutol (E)',   strength:400, min:15, max:20, absMax:1600 },
};

window.DEFAULT_COMORBIDITIES = [
  'เบาหวาน (DM)','ความดันโลหิตสูง (HT)','HIV/AIDS',
  'โรคไตเรื้อรัง (CKD)','ตับแข็ง (Liver Cirrhosis)','ถุงลมโป่งพอง (COPD)',
  'มะเร็ง (Cancer)','ภาวะขาดสารอาหาร','ยากดภูมิ (Immunosuppressive)',
  'โรคข้ออักเสบรูมาตอยด์ (RA)','โรคหัวใจ (CVD)'
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

// ========== DOSE CALCULATION ==========
window.calcDoses = function(weight, regimen, manualTabs) {
  const w = parseFloat(weight);
  if (!w || w < 5) return [];
  const r = regimen || '';
  let keys = ['R','H','Z','E'];
  if (r === '6-9H') keys = ['H'];
  else if (r === '3HR') keys = ['R','H'];
  else if (r.match(/HRE/) && !r.match(/Z/)) keys = ['R','H','E'];
  let auto = {};
  if (w < 40)      auto = {R:1,H:2,Z:2,E:2};
  else if (w < 55) auto = {R:2,H:3,Z:3,E:3};
  else if (w < 70) auto = {R:2,H:3,Z:3,E:3};
  else if (w < 85) auto = {R:3,H:4,Z:4,E:4};
  else             auto = {R:3,H:4,Z:5,E:4};
  return keys.map(function(key) {
    var d = DRUG_RANGES[key];
    var t = (manualTabs && manualTabs[key] != null) ? parseInt(manualTabs[key]) : (auto[key]||1);
    var dose = t * d.strength;
    var mgkg = +(dose/w).toFixed(1);
    var st = (mgkg > d.max || dose > d.absMax) ? 'high' : (mgkg < d.min) ? 'low' : 'ok';
    return { key, name:d.name, strength:d.strength, tabs:t, dose, mgkg, min:d.min, max:d.max, absMax:d.absMax, status:st };
  });
};

// CrCl Cockcroft-Gault
window.calcCrCl = function(age, weight, scr, gender) {
  if (!age || !weight || !scr || scr <= 0) return null;
  let crcl = ((140 - age) * weight) / (72 * scr);
  if (gender === 'F') crcl *= 0.85;
  return +crcl.toFixed(1);
};

window.crClStage = function(crcl) {
  if (crcl === null) return { label:'-', color:'text-gray-400' };
  if (crcl >= 90)  return { label:`Normal (${crcl})`,         color:'text-green-600'  };
  if (crcl >= 60)  return { label:`Mild CKD (${crcl})`,       color:'text-lime-600'   };
  if (crcl >= 30)  return { label:`Moderate CKD (${crcl})`,   color:'text-amber-600'  };
  if (crcl >= 15)  return { label:`Severe CKD (${crcl})`,     color:'text-orange-600' };
  return                   { label:`Kidney Failure (${crcl})`, color:'text-red-600'   };
};

window.generateAlerts = function(patients) {
  var alerts = [];
  patients.forEach(function(p) {
    var last = p.labs[p.labs.length-1];
    if (last && last.alt > 120)
      alerts.push({id:'alt-'+p.id,type:'critical',patient:p.name,msg:'ALT สูง '+last.alt+' U/L — ควรหยุดยาทันที',time:'ล่าสุด'});
    if (last && last.ua > 9)
      alerts.push({id:'ua-'+p.id,type:'warning',patient:p.name,msg:'Uric Acid สูง '+last.ua+' mg/dL',time:'ล่าสุด'});
    if (p.daysUntil <= 1)
      alerts.push({id:'appt-'+p.id,type:'info',patient:p.name,msg:'มีนัดพรุ่งนี้ ('+p.nextAppt+')',time:'วันนี้'});
    if ((p.comorbidities||[]).join(' ').includes('HIV'))
      alerts.push({id:'hiv-'+p.id,type:'warning',patient:p.name,msg:'ระวัง Drug Interaction: Rifampicin + ARV',time:'แจ้งเตือนต่อเนื่อง'});
  });
  return alerts;
};

// migrate old boolean adr → {checked, note}
window.migrateAdr = function(adr) {
  if (!adr) return {};
  const out = {};
  ADR_LIST.forEach(function(a) {
    const v = adr[a.key];
    if (v === undefined || v === null) { out[a.key] = {checked:false,note:''}; }
    else if (typeof v === 'boolean')   { out[a.key] = {checked:v,note:''}; }
    else                               { out[a.key] = v; }
  });
  return out;
};

window.CONSULT_TYPES = [
  'ปรับขนาดยา (Dose Adjustment)',
  'Drug Interaction',
  'ADR Management',
  'Renal Dosing (CrCl)',
  'Medication Counseling',
  'Lab Interpretation',
  'TB Education',
  'อื่นๆ',
];

window.DRP_TYPES = [
  { code:'C1', label:'C1 — ใช้ยาที่ไม่จำเป็น' },
  { code:'C2', label:'C2 — ต้องการยาเพิ่ม' },
  { code:'C3', label:'C3 — ยาไม่มีประสิทธิภาพ' },
  { code:'C4', label:'C4 — ขนาดยาต่ำเกินไป' },
  { code:'C5', label:'C5 — อาการไม่พึงประสงค์ (ADR)' },
  { code:'C6', label:'C6 — ขนาดยาสูงเกินไป' },
  { code:'C7', label:'C7 — ผู้ป่วยไม่ให้ความร่วมมือ (Non-compliance)' },
  { code:'C8', label:'C8 — อื่นๆ' },
];


window.LAB_GROUPS = [
  { id:'lft', label:'LFT (ตับ)', color:'amber', fields:[
    {key:'alt',  label:'ALT',      unit:'U/L',   lo:0,   hi:40,  critical:120},
    {key:'ast',  label:'AST',      unit:'U/L',   lo:0,   hi:40,  critical:120},
    {key:'alp',  label:'ALP',      unit:'U/L',   lo:40,  hi:150, critical:null},
    {key:'tbili',label:'T.Bili',   unit:'mg/dL', lo:0.2, hi:1.2, critical:3},
    {key:'dbili',label:'D.Bili',   unit:'mg/dL', lo:0,   hi:0.3, critical:null},
    {key:'ibili',label:'I.Bili',   unit:'mg/dL', lo:0.1, hi:1.0, critical:null},
    {key:'alb',  label:'Albumin',  unit:'g/dL',  lo:3.5, hi:5.0, critical:null, lowBad:true},
  ]},
  { id:'cbc', label:'CBC', color:'blue', fields:[
    {key:'wbc',  label:'WBC',  unit:'×10³/μL', lo:4.5, hi:11.0, critical:null},
    {key:'hb',   label:'Hb',   unit:'g/dL',   lo:12,  hi:17,   critical:7,   lowBad:true},
    {key:'hct',  label:'Hct',  unit:'%',       lo:36,  hi:52,   critical:null, lowBad:true},
    {key:'mcv',  label:'MCV',  unit:'fL',      lo:80,  hi:100,  critical:null},
    {key:'plt',  label:'Plt',  unit:'×10³/μL', lo:150, hi:400,  critical:50,  lowBad:true},
    {key:'n',    label:'N',    unit:'%',        lo:50,  hi:70,   critical:null},
    {key:'l',    label:'L',    unit:'%',        lo:20,  hi:40,   critical:null},
    {key:'m',    label:'M',    unit:'%',        lo:0,   hi:10,   critical:null},
    {key:'e',    label:'E',    unit:'%',        lo:0,   hi:5,    critical:null},
    {key:'b',    label:'B',    unit:'%',        lo:0,   hi:1,    critical:null},
  ]},
  { id:'renal', label:'Renal / UA', color:'indigo', fields:[
    {key:'scr',  label:'Scr',       unit:'mg/dL', lo:0.6, hi:1.2,  critical:5},
    {key:'bun',  label:'BUN',       unit:'mg/dL', lo:7,   hi:20,   critical:null},
    {key:'ua',   label:'Uric Acid', unit:'mg/dL', lo:3.5, hi:7.2,  critical:10},
  ]},
];

window.getLabStatus = function(val, field) {
  if (val === '' || val === null || val === undefined) return 'empty';
  const n = parseFloat(val);
  if (isNaN(n)) return 'empty';
  if (field.critical) {
    if (field.lowBad && n < field.critical) return 'critical';
    if (!field.lowBad && n > field.critical) return 'critical';
  }
  if (n < field.lo) return field.lowBad ? 'low-bad' : 'low';
  if (n > field.hi) return field.lowBad ? 'high-ok' : 'high';
  return 'normal';
};

window.LAB_STATUS_STYLE = {
  'critical': 'text-red-700 font-black bg-red-50',
  'low-bad':  'text-red-600 font-bold',
  'high':     'text-amber-700 font-bold',
  'high-ok':  'text-gray-500',
  'low':      'text-blue-600 font-semibold',
  'normal':   'text-green-700',
  'empty':    'text-gray-300',
};

// ========== INITIAL PATIENTS ==========
window.INITIAL_PATIENTS = [
  {
    id:'P001', hn:'12345/67',
    prefix:'นาย', firstName:'ณรงค์ศักดิ์', lastName:'สุขใจ',
    name:'นาย ณรงค์ศักดิ์ สุขใจ',
    age:45, gender:'M', patientType:'New',
    diseaseLocation:'Pulmonary', extraPulmonaryType:'',
    subdistrict:'พิมาย',
    weight:68, regimen:'2HRZE/4HR',
    regimenHistory:[
      {regimen:'2HRZE/4HR',startDate:'2024-08-10',reason:'เริ่มรักษาครั้งแรก',isCurrent:true}
    ],
    phase:'Intensive', month:2, day:50,
    status:'normal', adherence:98,
    comorbidities:['เบาหวาน (DM)'],
    concomitantDrugs:['Metformin 500mg OD'],
    hivStatus:null, hivNote:'',
    nextAppt:'25 ต.ค. 67', daysUntil:4, startDate:'2024-08-10',
    labs:[
      {tp:'M0',date:'2024-08-10',alt:30,ast:28,scr:0.9,ua:6.5,hbsag:'Negative',hcv:'Negative'},
      {tp:'M1',date:'2024-09-10',alt:45,ast:40,scr:0.9,ua:8.2,hbsag:'',hcv:''},
      {tp:'M2',date:'2024-10-10',alt:55,ast:48,scr:1.0,ua:9.1,hbsag:'',hcv:''},
    ],
    sputum:[{tp:'M0',result:'3+',date:'2024-08-10'}],
    adr:{
      neuropathy:{checked:false,note:''},nausea:{checked:true,note:'คลื่นไส้ตอนเช้า ดีขึ้นหลังกินยาหลังอาหาร'},
      arthralgia:{checked:false,note:''},optic:{checked:false,note:''},rash:{checked:false,note:''},
      jaundice:{checked:false,note:''},fever:{checked:false,note:''},orange_urine:{checked:true,note:'ปกติ'},
      alopecia:{checked:false,note:''},gi:{checked:false,note:''},neuro:{checked:false,note:''},edema:{checked:false,note:''}
    },
    visits:[
      {id:'v1',date:'2024-08-10',weight:68,note:'S: ไม่มีอาการผิดปกติ\nO: น้ำหนัก 68 kg, BP 120/80\nA: เริ่มยา TB ครั้งแรก ทนยาได้ดี\nP: นัดติดตาม 1 เดือน',type:'visit'},
      {id:'v2',date:'2024-09-10',weight:68,note:'S: คลื่นไส้ตอนเช้าเล็กน้อย\nO: ALT 45 (สูงเล็กน้อย)\nA: ADR จาก RIF/PZA ระดับเบา\nP: แนะนำกินยาหลังอาหาร เพิ่ม Pyridoxine B6',type:'visit'},
      {id:'v3',date:'2024-10-10',weight:68,note:'S: คลื่นไส้ดีขึ้น\nO: ALT 55, UA 9.1 (สูง)\nA: Hyperuricemia จาก PZA\nP: Monitor UA ต่อ, แนะนำดื่มน้ำมากๆ',type:'visit'},
    ],
    dot:{'2024-10-14':true,'2024-10-15':true,'2024-10-16':true,'2024-10-17':false,'2024-10-18':true,'2024-10-19':true,'2024-10-20':true,'2024-10-21':true},
    customDoses:null
  },
  {
    id:'P002', hn:'67890/67',
    prefix:'นางสาว', firstName:'จิราพร', lastName:'สว่างศรี',
    name:'นางสาว จิราพร สว่างศรี',
    age:32, gender:'F', patientType:'New',
    diseaseLocation:'Pulmonary', extraPulmonaryType:'',
    subdistrict:'กู่',
    weight:55, regimen:'2HRE/7HR',
    regimenHistory:[
      {regimen:'2HRZE/4HR',startDate:'2024-07-15',reason:'เริ่มรักษาครั้งแรก',endDate:'2024-10-15',isCurrent:false},
      {regimen:'2HRE/7HR',startDate:'2024-10-15',reason:'HOLD PZA — Drug-Induced Hepatitis (ALT 185)',isCurrent:true}
    ],
    phase:'Continuation', month:3, day:95,
    status:'critical', adherence:85,
    comorbidities:['HIV/AIDS'],
    concomitantDrugs:['ARV (Efavirenz) OD'],
    hivStatus:'Positive', hivNote:'CD4 = 350 cells/mm³',
    nextAppt:'22 ต.ค. 67', daysUntil:1, startDate:'2024-07-15',
    labs:[
      {tp:'M0',date:'2024-07-15',alt:25,ast:22,scr:0.8,ua:5.5,hbsag:'Negative',hcv:'Negative'},
      {tp:'M1',date:'2024-08-15',alt:80,ast:75,scr:0.85,ua:7.0,hbsag:'',hcv:''},
      {tp:'M2',date:'2024-09-15',alt:185,ast:160,scr:0.9,ua:8.5,hbsag:'',hcv:''},
    ],
    sputum:[
      {tp:'M0',result:'2+',date:'2024-07-15'},
      {tp:'M2',result:'Neg',date:'2024-09-20'},
    ],
    adr:{
      neuropathy:{checked:true,note:'ชาปลายนิ้วทั้งสองข้าง เริ่มเดือน 2'},
      nausea:{checked:true,note:'คลื่นไส้มาก โดยเฉพาะตอนเช้า'},
      arthralgia:{checked:false,note:''},optic:{checked:false,note:''},rash:{checked:false,note:''},
      jaundice:{checked:true,note:'ตัวเหลืองเล็กน้อย สังเกตได้ที่ตาขาว'},
      fever:{checked:false,note:''},orange_urine:{checked:true,note:'ปกติจาก RIF'},
      alopecia:{checked:false,note:''},gi:{checked:false,note:''},neuro:{checked:false,note:''},edema:{checked:false,note:''}
    },
    visits:[
      {id:'v1',date:'2024-07-15',weight:55,note:'เริ่มยา TB พร้อม ARV ระวัง Drug Interaction',type:'visit'},
      {id:'v2',date:'2024-09-15',weight:54,note:'ALT 185 — HOLD ยา TB ทุกตัว รอ LFT ซ้ำ 1 สัปดาห์',type:'visit'},
    ],
    dot:{'2024-10-14':true,'2024-10-15':true,'2024-10-16':true,'2024-10-17':false,'2024-10-18':false,'2024-10-19':true,'2024-10-20':false,'2024-10-21':true},
    customDoses:null
  },
  {
    id:'P003', hn:'11223/66',
    prefix:'นาย', firstName:'วิชัย', lastName:'ดวงดี',
    name:'นาย วิชัย ดวงดี',
    age:58, gender:'M', patientType:'New',
    diseaseLocation:'Pulmonary', extraPulmonaryType:'',
    subdistrict:'ตูม',
    weight:72, regimen:'2HRZE/4HR',
    regimenHistory:[
      {regimen:'2HRZE/4HR',startDate:'2024-05-20',reason:'เริ่มรักษาครั้งแรก',isCurrent:true}
    ],
    phase:'Continuation', month:5, day:152,
    status:'normal', adherence:95,
    comorbidities:['ความดันโลหิตสูง (HT)'],
    concomitantDrugs:['Amlodipine 5mg OD','Enalapril 5mg OD'],
    hivStatus:'Negative', hivNote:'',
    nextAppt:'28 ต.ค. 67', daysUntil:7, startDate:'2024-05-20',
    labs:[
      {tp:'M0',date:'2024-05-20',alt:28,ast:25,scr:1.0,ua:6.0,hbsag:'Negative',hcv:'Negative'},
      {tp:'M2',date:'2024-07-20',alt:35,ast:30,scr:1.1,ua:7.2,hbsag:'',hcv:''},
      {tp:'M4',date:'2024-09-20',alt:32,ast:28,scr:1.0,ua:7.8,hbsag:'',hcv:''},
    ],
    sputum:[
      {tp:'M0',result:'1+',date:'2024-05-20'},
      {tp:'M2',result:'Neg',date:'2024-07-25'},
      {tp:'M5',result:'Neg',date:'2024-10-22'},
    ],
    adr:{
      neuropathy:{checked:false,note:''},nausea:{checked:false,note:''},
      arthralgia:{checked:true,note:'ปวดข้อเข่าและข้อมือ เริ่มสัปดาห์ที่ 3'},
      optic:{checked:false,note:''},rash:{checked:false,note:''},jaundice:{checked:false,note:''},
      fever:{checked:false,note:''},orange_urine:{checked:true,note:'ปกติจาก RIF'},
      alopecia:{checked:false,note:''},gi:{checked:false,note:''},neuro:{checked:false,note:''},edema:{checked:false,note:''}
    },
    visits:[
      {id:'v1',date:'2024-05-20',weight:72,note:'เริ่มยา TB ครั้งแรก ไม่มีอาการผิดปกติ',type:'visit'},
      {id:'v2',date:'2024-07-20',weight:71,note:'ปวดข้อเข่า — น่าจะจาก Hyperuricemia เฝ้าระวัง',type:'visit'},
      {id:'v3',date:'2024-09-20',weight:71,note:'อาการปวดข้อดีขึ้น UA ยังสูงเล็กน้อย ทนยาได้ดี',type:'visit'},
    ],
    dot:{'2024-10-15':true,'2024-10-16':true,'2024-10-17':true,'2024-10-18':true,'2024-10-19':true,'2024-10-20':true,'2024-10-21':true},
    customDoses:null
  },
  {
    id:'P004', hn:'55555/67',
    prefix:'นาย', firstName:'ทดสอบ', lastName:'ระบบครบ',
    name:'นาย ทดสอบ ระบบครบ',
    age:42, gender:'M', patientType:'Relapse',
    diseaseLocation:'Extra-pulmonary', extraPulmonaryType:'TB Spine',
    subdistrict:'โพธิ์ศรี',
    weight:58, regimen:'2HRE/7HR',
    regimenHistory:[
      {regimen:'2HRZE/4HR',startDate:'2024-01-10',reason:'เริ่มรักษา Relapse',isCurrent:false,endDate:'2024-04-10'},
      {regimen:'2HRE/7HR',startDate:'2024-04-10',reason:'HOLD PZA — UA 11.2 + ปวดข้อมาก',isCurrent:true}
    ],
    phase:'Continuation', month:4, day:120,
    status:'normal', adherence:92,
    comorbidities:['เบาหวาน (DM)','ความดันโลหิตสูง (HT)'],
    concomitantDrugs:['Metformin 500mg BID','Amlodipine 5mg OD'],
    hivStatus:'Negative', hivNote:'',
    nextAppt:'5 พ.ค. 69', daysUntil:4, startDate:'2024-01-10',
    labs:[
      {tp:'M0',date:'2024-01-10',alt:32,ast:28,alp:88,tbili:0.6,dbili:0.2,alb:3.8,scr:0.95,bun:14,ua:7.2,hbsag:'Negative',hcv:'Negative',cbc:{wbc:6.2,hb:13.8,hct:41,mcv:85,plt:220,n:62,l:28,m:6,e:3,b:1}},
      {tp:'M2',date:'2024-03-10',alt:48,ast:42,alp:85,tbili:0.6,dbili:0.2,alb:3.7,scr:0.92,bun:13,ua:11.2,hbsag:'',hcv:'',cbc:{wbc:5.5,hb:13.2,hct:39,mcv:83,plt:205,n:65,l:25,m:6,e:3,b:1}},
      {tp:'M4',date:'2024-05-10',alt:38,ast:34,alp:80,tbili:0.5,dbili:0.1,alb:3.9,scr:0.90,bun:12,ua:7.8,hbsag:'',hcv:'',cbc:{}}
    ],
    sputum:[
      {tp:'M0',result:'2+',date:'2024-01-10',scantyCount:'',genexpert:'Detected',genexpertRif:'Sensitive'},
      {tp:'M2',result:'Scanty',date:'2024-03-10',scantyCount:'2-5/100F',genexpert:'Not Detected',genexpertRif:''},
      {tp:'M4',result:'Neg',date:'2024-05-10',scantyCount:'',genexpert:'',genexpertRif:''}
    ],
    adr:{
      neuropathy:{checked:false,note:''},
      nausea:{checked:true,note:'คลื่นไส้เล็กน้อยสัปดาห์แรก ดีขึ้นแล้ว'},
      arthralgia:{checked:true,note:'ปวดข้อเข่า — จาก UA สูง 11.2'},
      optic:{checked:false,note:''},rash:{checked:false,note:''},jaundice:{checked:false,note:''},
      fever:{checked:false,note:''},orange_urine:{checked:true,note:'ปกติจาก RIF — แจ้งผู้ป่วยแล้ว'},
      alopecia:{checked:false,note:''},gi:{checked:false,note:''},neuro:{checked:false,note:''},edema:{checked:false,note:''}
    },
    visits:[
      {
        id:'v1',date:'2024-01-10',weight:58,type:'visit',
        vitals:{bp:'128/82',hr:'78',rr:'18',temp:'36.7',o2:'98'},
        drugDoses:'H300 R450 Z1000 E800',
        note:'S: ปวดหลังลดลงบ้าง ไอแห้งๆ\nO: BW 58kg, BP 128/82\n>>> CXR: RUL infiltration ลดลงเล็กน้อย\n>>> Sputum AFB 2+ | GeneXpert: MTB Detected, RIF Sensitive\n>>> Baseline: AST 28 ALT 32 ALP 88 UA 7.2\nA: เริ่มยา Relapse case ทนยาได้ดี\nP: นัด 1 เดือน ติดตาม LFT + UA',
        consult:{type:'ปรับขนาดยา (Dose Adjustment)',note:'H300 R450 Z1000 E800 เหมาะสมสำหรับ BW 58kg'},
        drp:[],adrNoted:[],labData:{},sputumQuick:{}
      },
      {
        id:'v2',date:'2024-03-10',weight:59,type:'visit',
        vitals:{bp:'130/84',hr:'76',rr:'18',temp:'36.6',o2:'97'},
        drugDoses:'H300 R450 Z1000 E800',
        note:'S: ปวดข้อเข่ามากขึ้น บวมเล็กน้อย\nO: UA 11.2 → HOLD PZA\n>>> เปลี่ยนสูตรเป็น 2HRE/7HR\nA: Hyperuricemia จาก PZA ระดับสูง\nP: ตัด PZA, ต่อด้วย HRE, ติดตาม UA เดือนหน้า',
        consult:{type:'ADR Management',note:'Hyperuricemia UA 11.2 — HOLD PZA เปลี่ยนสูตร HRE'},
        drp:[{type:'C5',note:'ADR Hyperuricemia จาก PZA — UA 11.2 mg/dL ปวดข้อมาก'}],
        adrNoted:['arthralgia','nausea'],
        labData:{},
        sputumQuick:{tp:'M2',result:'Scanty',scantyCount:'2-5/100F',genexpert:'Not Detected',genexpertRif:''}
      },
      {
        id:'v3',date:'2024-05-10',weight:60,type:'visit',
        vitals:{bp:'124/78',hr:'70',rr:'16',temp:'36.4',o2:'99'},
        drugDoses:'H300 R450 E800',
        note:'S: อาการปวดข้อดีขึ้นมาก UA ลดลง\nO: UA 7.8, ALT 38 ปกติ, Sputum M4: Negative\nA: ตอบสนองต่อการรักษาดี Sputum Conversion สำเร็จ\nP: ต่อ HRE ครบกำหนด นัดอีก 1 เดือน',
        consult:{type:'Medication Counseling',note:'แนะนำความสำคัญของการกินยาต่อเนื่อง และสังเกตอาการตาพร่า (Optic Neuritis จาก EMB)'},
        drp:[],adrNoted:[],
        labData:{},
        sputumQuick:{tp:'M4',result:'Neg',scantyCount:'',genexpert:'',genexpertRif:''}
      }
    ],
    dot:{
      '2025-04-20':true,'2025-04-21':true,'2025-04-22':true,'2025-04-23':false,
      '2025-04-24':true,'2025-04-25':true,'2025-04-26':true,'2025-04-27':true,
      '2025-04-28':false,'2025-04-29':true,'2025-04-30':true,'2025-05-01':true
    },
    customDoses:null
  },
  {
    id:'P005', hn:'99001/68',
    prefix:'นาย', firstName:'สมชาย', lastName:'ทดสอบระบบ',
    name:'นาย สมชาย ทดสอบระบบ',
    age:38, gender:'M', patientType:'New',
    diseaseLocation:'Pulmonary', extraPulmonaryType:'',
    subdistrict:'สำโรงปราสาท',
    weight:63, regimen:'2HRZE/4HR',
    regimenHistory:[
      {regimen:'2HRZE/4HR',startDate:'2026-01-15',reason:'เริ่มรักษาครั้งแรก',isCurrent:true}
    ],
    phase:'Intensive', month:3, day:76,
    status:'critical', adherence:88,
    hasResistance:true,
    comorbidities:['เบาหวาน (DM)'],
    concomitantDrugs:['Metformin 500mg BID'],
    hivStatus:'Negative', hivNote:'',
    nextAppt:'10 พ.ค. 69', daysUntil:9, startDate:'2026-01-15',
    labs:[
      {tp:'M0',date:'2026-01-15',alt:28,ast:24,scr:0.9,ua:6.2,hbsag:'Negative',hcv:'Negative'},
      {tp:'M2',date:'2026-03-15',alt:38,ast:32,scr:0.95,ua:7.1,hbsag:'',hcv:''},
    ],
    sputum:[
      {
        tp:'M0',date:'2026-01-15',specimenType:'Sputum',
        afbSamples:[{result:'3+',scantyCount:''},{result:'2+',scantyCount:''},{result:'3+',scantyCount:''}],
        result:'3+',scantyCount:'',
        molecType:'GeneXpert MTB/RIF',genexpert:'Detected',mtbResult:'Detected',
        rifResult:'RIF resistant',genexpertRif:'Resistant',
        inhResult:'INH resistant',
        sldResults:{flqs:'Resistant',agcp:'Susceptible',eto:'Susceptible'},
        igraResult:'',extraLabs:{}
      },
      {
        tp:'M2',date:'2026-03-15',specimenType:'Sputum',
        afbSamples:[{result:'Scanty',scantyCount:'3'},{result:'Neg',scantyCount:''}],
        result:'Scanty',scantyCount:'3',
        molecType:'GeneXpert MTB/RIF',genexpert:'Detected',mtbResult:'Detected',
        rifResult:'RIF resistant',genexpertRif:'Resistant',
        inhResult:'',sldResults:{},igraResult:'',extraLabs:{}
      },
    ],
    adr:{
      neuropathy:{checked:false,note:''},nausea:{checked:true,note:'คลื่นไส้ตอนเช้า'},
      arthralgia:{checked:false,note:''},optic:{checked:false,note:''},rash:{checked:false,note:''},
      jaundice:{checked:false,note:''},fever:{checked:false,note:''},orange_urine:{checked:true,note:'ปกติจาก RIF'},
      alopecia:{checked:false,note:''},gi:{checked:false,note:''},neuro:{checked:false,note:''},edema:{checked:false,note:''}
    },
    visits:[
      {id:'v1',date:'2026-01-15',weight:63,type:'visit',
       vitals:{bp:'126/80',hr:'78',rr:'18',temp:'37.0',o2:'98'},
       drugDoses:'H300 R450 Z1000 E800',
       note:'S: ไอมีเสมหะ น้ำหนักลด 5 kg ใน 2 เดือน\nO: BW 63kg CXR: RUL cavity + infiltration\n>>> Sputum AFB 3+/2+/3+ | GeneXpert: MTB Detected, RIF Resistant, INH Resistant\n>>> FLQS: Resistant → pre-XDR-TB\nA: MDR-TB + INH resistant + FLQS resistant\nP: ส่งต่อผู้เชี่ยวชาญ MDR-TB clinic ด่วน',
       consult:{type:'Lab Interpretation',note:'GeneXpert RIF resistant + INH resistant + FLQS resistant → pre-XDR-TB'},
       drp:[{type:'C2',note:'ต้องการยา SLD regimen — ปรึกษา MDR-TB clinic ด่วน'}],
       adrNoted:['nausea'],labData:{},sputumQuick:{}}
    ],
    dot:{
      '2026-04-20':true,'2026-04-21':true,'2026-04-22':false,
      '2026-04-23':true,'2026-04-24':true,'2026-04-25':true,
      '2026-04-26':false,'2026-04-27':true,'2026-04-28':true,
      '2026-04-29':true,'2026-04-30':true,'2026-05-01':true
    },
    customDoses:null
  }
];
