
// ========== CONSTANTS ==========
window.TAMBONS = ['พิมาย','พิมายเหนือ','กู่','ตูม','สำโรงปราสาท','โพธิ์ศรี','สมอ','ดวนใหญ่','บ้านไทย','ไพรขลา'];
window.REGIMENS = ['2HRZE/4HR','2HRZE/7HR','2HRE/7HR','2HRZE/10HR','6-9H','3HR'];
window.EXTRA_PULMONARY_TYPES = ['TB Lymphadenitis','TB Pleural','TB Meningitis','TB Cutaneous','TB Spine','TB Skeletal','TB Colon','อื่นๆ (Other)'];
window.PATIENT_TYPES = ['New','Relapse','Treatment Failure'];
window.DISEASE_LOCATIONS = ['LTBI','Pulmonary','Extra-pulmonary'];
window.PREFIXES = ['นาย','นาง','นางสาว','เด็กชาย','เด็กหญิง'];

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

// ========== DOSE CALCULATION ==========
window.calcDoses = function(weight, regimen, manualTabs, customStrengths) {
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
    var str = (customStrengths && customStrengths[key] != null) ? customStrengths[key] : d.strength;
    var t = (manualTabs && manualTabs[key] != null) ? parseFloat(manualTabs[key]) : (auto[key]||1);
    var dose = t * str;
    var mgkg = +(dose/w).toFixed(1);
    var st = (mgkg > d.max || dose > d.absMax) ? 'high' : (mgkg < d.min) ? 'low' : 'ok';
    return { key, name:d.name, strength:str, tabs:t, dose, mgkg, min:d.min, max:d.max, absMax:d.absMax, status:st };
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
    if (last) {
      LAB_GROUPS.forEach(function(grp) {
        grp.fields.forEach(function(f) {
          if (!f.critical) return;
          var val = grp.id === 'cbc' ? (last.cbc||{})[f.key] : last[f.key];
          if (val === undefined || val === null || val === '') return;
          if (getLabStatus(val, f) === 'critical') {
            var dir = f.lowBad ? 'ต่ำวิกฤต' : 'สูงวิกฤต';
            alerts.push({id:f.key+'-'+p.id,type:'critical',patient:p.name,patientId:p.id,msg:f.label+' '+val+' '+f.unit+' — '+dir,time:'ล่าสุด'});
          }
        });
      });
      if (last.ua > 9 && last.ua <= 10)
        alerts.push({id:'ua-'+p.id,type:'warning',patient:p.name,patientId:p.id,msg:'Uric Acid สูง '+last.ua+' mg/dL',time:'ล่าสุด'});
    }
    if (p.daysUntil != null && p.daysUntil <= 1)
      alerts.push({id:'appt-'+p.id,type:'info',patient:p.name,patientId:p.id,msg:'มีนัดพรุ่งนี้ ('+p.nextAppt+')',time:'วันนี้'});
    if ((p.comorbidities||[]).join(' ').includes('HIV'))
      alerts.push({id:'hiv-'+p.id,type:'warning',patient:p.name,patientId:p.id,msg:'ระวัง Drug Interaction: Rifampicin + ARV',time:'แจ้งเตือนต่อเนื่อง'});
    if (last && last.scr) {
      var crcl = calcCrCl(p.age, p.weight, last.scr, p.gender);
      if (crcl !== null && crcl < 30)
        alerts.push({id:'crcl-'+p.id,type:'critical',patient:p.name,patientId:p.id,msg:'CrCl ต่ำ '+crcl+' mL/min — ควรปรับขนาด EMB/PZA หรือพิจารณาหยุด (เสี่ยง Optic Neuritis และ UA สูง)',time:'ล่าสุด'});
    }
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
    {key:'alb',  label:'Albumin',  unit:'g/dL',  lo:3.5, hi:5.0, critical:2.5, lowBad:true},
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
    {key:'scr',  label:'Scr',       unit:'mg/dL', lo:0.6, hi:1.2,  critical:null},
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
    comorbidities:['DM'],
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
    comorbidities:['HIV'],
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
    comorbidities:['HT'],
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
    comorbidities:['DM','HT'],
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
    id:'P006', hn:'33221/68',
    prefix:'นาย', firstName:'ประสิทธิ์', lastName:'แก้วมณี',
    name:'นาย ประสิทธิ์ แก้วมณี',
    age:68, gender:'M', patientType:'New',
    diseaseLocation:'Pulmonary', extraPulmonaryType:'',
    subdistrict:'ดวนใหญ่',
    weight:58, regimen:'2HRZE/4HR',
    regimenHistory:[
      {regimen:'2HRZE/4HR',startDate:'2026-03-01',reason:'เริ่มรักษาครั้งแรก',isCurrent:true}
    ],
    phase:'Intensive', month:2, day:71,
    status:'normal', adherence:90,
    comorbidities:['CKD','HT'],
    concomitantDrugs:['Amlodipine 5mg OD','Enalapril 5mg OD'],
    hivStatus:'Negative', hivNote:'',
    nextAppt:'13 พ.ค. 69', daysUntil:2, startDate:'2026-03-01',
    labs:[
      {tp:'M0',date:'2026-03-01',alt:28,ast:25,alb:3.4,scr:2.1,bun:28,ua:7.8,hbsag:'Negative',hcv:'Negative',cbc:{hb:10.2,hct:31,plt:185}},
      {tp:'M2',date:'2026-05-01',alt:32,ast:28,alb:2.2,scr:2.8,bun:34,ua:9.2,hbsag:'',hcv:'',cbc:{hb:6.5,hct:20,plt:162}},
    ],
    sputum:[{tp:'M0',result:'2+',date:'2026-03-01'}],
    adr:{
      neuropathy:{checked:false,note:''},nausea:{checked:true,note:'คลื่นไส้เล็กน้อย'},
      arthralgia:{checked:true,note:'ปวดข้อเข่า สงสัย Hyperuricemia จาก PZA'},
      optic:{checked:false,note:''},rash:{checked:false,note:''},jaundice:{checked:false,note:''},
      fever:{checked:false,note:''},orange_urine:{checked:true,note:'ปกติจาก RIF'},
      alopecia:{checked:false,note:''},gi:{checked:false,note:''},neuro:{checked:false,note:''},edema:{checked:false,note:''}
    },
    visits:[
      {id:'v1',date:'2026-03-01',weight:58,type:'visit',
       vitals:{bp:'148/90',hr:'76',rr:'18',temp:'36.8',o2:'97'},
       drugDoses:'H300 R450 Z1000 E800',
       note:'S: ไอมีเสมหะ เหนื่อยง่าย\nO: BW 58kg, BP 148/90, Scr 2.1 → CrCl ~28 mL/min\n>>> Sputum AFB 2+\nA: PTB New case + CKD stage 4 — เสี่ยง EMB/PZA สะสม\nP: Monitor Scr/UA ทุกเดือน เฝ้าระวัง Optic Neuritis',
       consult:{type:'Renal Dosing (CrCl)',note:'CrCl ~28 mL/min — ควรพิจารณาปรับขนาด EMB และ monitor UA จาก PZA ใกล้ชิด'},
       drp:[{type:'C6',note:'EMB 800mg อาจสูงเกินไปสำหรับ CrCl < 30 — เสี่ยง Optic Neuritis'}],
       adrNoted:[],labData:{},sputumQuick:{}}
    ],
    dot:{
      '2026-04-20':true,'2026-04-21':true,'2026-04-22':true,'2026-04-23':true,
      '2026-04-24':false,'2026-04-25':true,'2026-04-26':true,'2026-04-27':true,
      '2026-05-01':true,'2026-05-02':true,'2026-05-03':false,'2026-05-04':true
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
    comorbidities:['DM'],
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
  },

  // ── Demo: ผู้ป่วยที่บันทึก Outcome แล้ว พร้อมทดสอบระบบทะเบียนจบการรักษา ──
  {
    id:'pt-demo-archive',
    hn:'TB0010',
    prefix:'นางสาว', firstName:'สุภาพร', lastName:'ลาภมณี',
    name:'นางสาวสุภาพร ลาภมณี',
    age:34, gender:'F',
    patientType:'New', diseaseLocation:'Pulmonary', extraPulmonaryType:'',
    subdistrict:'กู่',
    weight:52, regimen:'2HRZE/4HR',
    regimenHistory:[
      {regimen:'2HRZE/4HR',startDate:'2025-12-01',reason:'เริ่มรักษาครั้งแรก',isCurrent:true}
    ],
    phase:'Continuation', month:5, day:155,
    status:'normal', adherence:96,
    hasResistance:false,
    comorbidities:[], concomitantDrugs:[],
    hivStatus:'Negative', hivNote:'',
    nextAppt:'', daysUntil:null, startDate:'2025-12-01',
    labs:[
      {tp:'M0',date:'2025-12-01',alt:22,ast:18,scr:0.8,ua:4.1,hbsag:'Negative',hcv:'Negative'},
      {tp:'M2',date:'2026-02-01',alt:26,ast:20,scr:0.82,ua:4.3,hbsag:'',hcv:''},
      {tp:'M5',date:'2026-05-01',alt:24,ast:19,scr:0.79,ua:4.0,hbsag:'',hcv:''},
    ],
    sputum:[
      {
        tp:'M0',date:'2025-12-01',specimenType:'Sputum',
        afbSamples:[{result:'2+',scantyCount:''},{result:'1+',scantyCount:''}],
        result:'2+',scantyCount:'',
        molecType:'GeneXpert MTB/RIF',genexpert:'Detected',mtbResult:'Detected',
        rifResult:'RIF susceptible',genexpertRif:'Susceptible',
        inhResult:'',sldResults:{},igraResult:'',extraLabs:{}
      },
      {
        tp:'M2',date:'2026-02-01',specimenType:'Sputum',
        afbSamples:[{result:'Scanty',scantyCount:'1-9/100F'},{result:'Neg',scantyCount:''}],
        result:'Scanty',scantyCount:'1-9/100F',
        molecType:'',genexpert:'',mtbResult:'',rifResult:'',genexpertRif:'',
        inhResult:'',sldResults:{},igraResult:'',extraLabs:{}
      },
      {
        tp:'M5',date:'2026-05-01',specimenType:'Sputum',
        afbSamples:[{result:'Neg',scantyCount:''},{result:'Neg',scantyCount:''}],
        result:'Neg',scantyCount:'',
        molecType:'',genexpert:'',mtbResult:'',rifResult:'',genexpertRif:'',
        inhResult:'',sldResults:{},igraResult:'',extraLabs:{}
      },
    ],
    adr:{
      neuropathy:{checked:false,note:''},nausea:{checked:false,note:''},
      arthralgia:{checked:false,note:''},optic:{checked:false,note:''},rash:{checked:false,note:''},
      jaundice:{checked:false,note:''},fever:{checked:false,note:''},orange_urine:{checked:true,note:'ปกติจาก RIF'},
      alopecia:{checked:false,note:''},gi:{checked:false,note:''},neuro:{checked:false,note:''},edema:{checked:false,note:''}
    },
    visits:[
      {id:'v1-demo-arc',date:'2025-12-01',weight:52,type:'visit',
       vitals:{bp:'112/72',hr:'76',rr:'16',temp:'36.8',o2:'99'},
       drugDoses:'H200 R450 Z1000 E800',
       note:'S: ไอมีเสมหะ เหนื่อยเล็กน้อย\nO: BW 52kg CXR: RUL infiltration\n>>> Sputum AFB 2+/1+ | GeneXpert: MTB Detected, RIF Susceptible\nA: Pulmonary TB, New Case\nP: เริ่ม 2HRZE/4HR ตามมาตรฐาน',
       consult:{type:'',note:''},drp:[],adrNoted:[],labData:{},sputumQuick:{}},
      {id:'v2-demo-arc',date:'2026-05-01',weight:55,type:'visit',
       vitals:{bp:'110/70',hr:'74',rr:'16',temp:'36.7',o2:'99'},
       drugDoses:'H200 R450',
       note:'S: ไม่มีอาการ หายดีแล้ว น้ำหนักเพิ่มขึ้น 3 kg\nO: BW 55kg Sputum AFB Neg x2 ที่ M2 และ M5\nA: Pulmonary TB ครบการรักษา 6 เดือน — Sputum Neg\nP: บันทึก Outcome: รักษาหาย (Cured)',
       consult:{type:'',note:''},drp:[],adrNoted:[],labData:{},sputumQuick:{},
       outcome:{type:'Cured',date:'2026-05-01',note:'Sputum conversion ที่ M2, ครบการรักษา 6 เดือน'}}
    ],
    dot:{
      '2026-04-20':true,'2026-04-21':true,'2026-04-22':true,
      '2026-04-23':true,'2026-04-24':true,'2026-04-25':true,
      '2026-04-26':true,'2026-04-27':true,'2026-04-28':true,
      '2026-04-29':true,'2026-04-30':true,'2026-05-01':true
    },
    customDoses:null,
    outcome:{type:'Cured',date:'2026-05-01',endDate:'2026-05-01',note:'Delayed conversion ที่ M2 (Scanty) แต่ M5 Neg, ครบการรักษา 6 เดือน'},
    archived:true
  }
];

// ========== SUPABASE ==========
const _SUPA_URL = 'https://cioswzdbonnbhbyynrhh.supabase.co';
const _SUPA_KEY = 'sb_publishable_SuzwNfnSbCFCdNmDsMhydA_Yd8Nl0Yc';
window._sb = window.supabase.createClient(_SUPA_URL, _SUPA_KEY);

// ดึง session จาก Next.js (ชั้นนอก) แล้วบอก _sb ว่า "user คนนี้ login อยู่"
// ต้องเรียกก่อน loadPatients() เพื่อให้ RLS รู้ว่าใครเป็นคน query
window._sbReady = (async () => {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) { console.warn('No session found'); return; }
    const { session } = await res.json();
    if (session?.access_token && session?.refresh_token) {
      await window._sb.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  } catch (e) { console.error('Session bridge error:', e); }
})();

window.dbToPatient = r => ({
  id:r.id, hn:r.hn, prefix:r.prefix, firstName:r.first_name, lastName:r.last_name,
  name:r.name, age:r.age, gender:r.gender, weight:r.weight, regimen:r.regimen,
  regimenHistory:r.regimen_history||[], phase:r.phase, month:r.month, day:r.day,
  status:r.status, adherence:r.adherence, patientType:r.patient_type,
  diseaseLocation:r.disease_location, extraPulmonaryType:r.extra_pulmonary_type,
  subdistrict:r.subdistrict, comorbidities:r.comorbidities||[],
  concomitantDrugs:r.concomitant_drugs||[], hivStatus:r.hiv_status, hivNote:r.hiv_note,
  nextAppt:r.next_appt, daysUntil:r.days_until, startDate:r.start_date,
  labs:r.labs||[], sputum:r.sputum||[], adr:r.adr||{}, visits:r.visits||[],
  dot:r.dot||{}, customDoses:r.custom_doses||null,
  drugStrengths:r.drug_strengths||null, extraTbDrugs:r.extra_tb_drugs||[],
  outcome:r.outcome||null, archived:r.archived||false,
});

window.patientToDb = p => ({
  id:p.id, hn:p.hn, prefix:p.prefix, first_name:p.firstName, last_name:p.lastName,
  name:p.name, age:p.age, gender:p.gender, weight:p.weight, regimen:p.regimen,
  regimen_history:p.regimenHistory||[], phase:p.phase, month:p.month, day:p.day,
  status:p.status, adherence:p.adherence, patient_type:p.patientType,
  disease_location:p.diseaseLocation, extra_pulmonary_type:p.extraPulmonaryType,
  subdistrict:p.subdistrict, comorbidities:p.comorbidities||[],
  concomitant_drugs:p.concomitantDrugs||[], hiv_status:p.hivStatus, hiv_note:p.hivNote,
  next_appt:p.nextAppt, days_until:p.daysUntil, start_date:p.startDate,
  labs:p.labs||[], sputum:p.sputum||[], adr:p.adr||{}, visits:p.visits||[],
  dot:p.dot||{}, custom_doses:p.customDoses||null,
  drug_strengths:p.drugStrengths||null, extra_tb_drugs:p.extraTbDrugs||[],
  outcome:p.outcome||null, archived:p.archived||false,
  updated_at: new Date().toISOString(),
});

window.loadPatients = async () => {
  // กรองออกคนที่อยู่ในถังขยะ (deleted_at != null) — หน้าหลักไม่ต้องเห็น
  const { data, error } = await window._sb.from('tb_patients').select('*').is('deleted_at', null).order('created_at');
  if (error) { console.error('Supabase load error:', error); return []; }
  return (data||[]).map(window.dbToPatient);
};

// โหลดคนในถังขยะ (สำหรับหน้าถังขยะ)
window.loadTrashedPatients = async () => {
  const { data, error } = await window._sb.from('tb_patients').select('*').not('deleted_at','is',null).order('deleted_at',{ascending:false});
  if (error) { console.error('Supabase load trash error:', error); return []; }
  const patients = (data||[]).map(r => ({ ...window.dbToPatient(r), deletedAt: r.deleted_at, deletedBy: r.deleted_by, deleteReason: r.delete_reason, requestedBy: null }));
  // โหลด requestedBy จาก delete_requests สำหรับส่งเมลแจ้ง user เมื่อกู้คืน/ลบถาวร
  const ids = patients.map(p => p.id);
  if (ids.length > 0) {
    const { data: reqs } = await window._sb.from('tb_delete_requests').select('patient_id, requested_by').in('patient_id', ids).in('status', ['approved','pending']);
    const reqMap = {};
    (reqs||[]).forEach(r => { reqMap[r.patient_id] = r.requested_by; });
    patients.forEach(p => { p.requestedBy = reqMap[p.id] || null; });
  }
  return patients;
};

window.savePatient = async p => {
  const { error } = await window._sb.from('tb_patients').upsert(window.patientToDb(p));
  if (error) console.error('Supabase save error:', error);
};

window.removePatient = async id => {
  const { error } = await window._sb.from('tb_patients').delete().eq('id', id);
  if (error) console.error('Supabase delete error:', error);
};

// soft delete — ย้ายเข้าถังขยะ 60 วัน
window.softDeletePatient = async (id, deletedBy, reason) => {
  const { error } = await window._sb.from('tb_patients').update({
    deleted_at: new Date().toISOString(),
    deleted_by: deletedBy,
    delete_reason: reason,
  }).eq('id', id);
  if (error) { console.error('Soft delete error:', error); return false; }
  return true;
};

// restore — เอากลับมาจากถังขยะ
window.restorePatient = async id => {
  const { error } = await window._sb.from('tb_patients').update({
    deleted_at: null, deleted_by: null, delete_reason: null,
  }).eq('id', id);
  if (error) { console.error('Restore error:', error); return false; }
  return true;
};

// hard delete — ลบถาวรจาก DB (trigger จะ log อัตโนมัติ)
window.hardDeletePatient = async id => {
  // ดึง requestedBy ก่อนลบ (เพื่อส่งเมลแจ้ง user)
  const { data: req } = await window._sb.from('tb_delete_requests').select('requested_by').eq('patient_id', id).maybeSingle();
  // ลบ delete_requests ก่อน (FK constraint)
  await window._sb.from('tb_delete_requests').delete().eq('patient_id', id);
  // ลบผู้ป่วย
  const { error } = await window._sb.from('tb_patients').delete().eq('id', id);
  if (error) { console.error('Hard delete error:', error); return { ok: false, requestedBy: null }; }
  return { ok: true, requestedBy: req?.requested_by || null };
};

// ── Delete Request (คำขอลบจาก user ทั่วไป) ──────────────────────────────────

window.submitDeleteRequest = async (patientId, requestedBy, reason) => {
  const { error } = await window._sb.from('tb_delete_requests').insert({
    patient_id: patientId,
    requested_by: requestedBy,
    reason: reason,
    status: 'pending',
  });
  if (error) { console.error('Submit delete request error:', error); return false; }
  return true;
};

window.loadPendingDeleteRequests = async () => {
  const { data, error } = await window._sb.from('tb_delete_requests')
    .select('*, patient:tb_patients(hn, name), requester:profiles!requested_by(first_name, last_name, profession)')
    .eq('status','pending').order('requested_at',{ascending:false});
  if (error) { console.error('Load delete requests error:', error); return []; }
  return data || [];
};

window.loadMyPendingDeleteRequests = async (userId) => {
  const { data } = await window._sb.from('tb_delete_requests')
    .select('id, patient_id, status, requested_by')
    .eq('requested_by', userId)
    .in('status', ['pending', 'approved']);
  return data || [];
};

window.loadCancelledDeleteCount = async () => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await window._sb.from('tb_delete_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'cancelled')
    .is('acknowledged_at', null)
    .gte('requested_at', since);
  return count || 0;
};

window.acknowledgeCancelledRequests = async () => {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await window._sb.from('tb_delete_requests')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('status', 'cancelled')
    .is('acknowledged_at', null)
    .gte('requested_at', since);
  return !error;
};

window.cancelDeleteRequest = async (patientId, userId) => {
  const { error } = await window._sb.from('tb_delete_requests')
    .update({ status: 'cancelled' })
    .eq('patient_id', patientId)
    .eq('requested_by', userId)
    .eq('status', 'pending');
  if (error) { console.error('Cancel delete request error:', error); return false; }
  return true;
};

window.approveDeleteRequest = async (requestId, patientId, reviewedBy, reason) => {
  const ok = await window.softDeletePatient(patientId, reviewedBy, reason);
  if (!ok) return false;
  await window._sb.from('tb_delete_requests').update({
    status: 'approved', reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(),
  }).eq('id', requestId);
  return true;
};

window.rejectDeleteRequest = async (requestId, reviewedBy, note) => {
  const { error } = await window._sb.from('tb_delete_requests').update({
    status: 'rejected', reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), review_note: note || null,
  }).eq('id', requestId);
  return !error;
};

window.loadUserNotifications = async () => {
  const { data } = await window._sb
    .from('tb_notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  return data || [];
};

window.markUserNotificationRead = async (id) => {
  await window._sb
    .from('tb_notifications')
    .update({ is_read: true })
    .eq('id', id);
};
