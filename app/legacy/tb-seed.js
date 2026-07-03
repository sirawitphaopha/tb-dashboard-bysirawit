// tb-seed.js — window.INITIAL_PATIENTS (seed/demo data, static) แยกจาก tb-data.js รอบ 3
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

