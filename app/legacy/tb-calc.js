// tb-calc.js — dose/CrCl/alert calculators + lab-reference (getLabStatus/LAB_GROUPS/LAB_STATUS_STYLE)
// pure functions (assign window.*) — เรียกตอน runtime เท่านั้น ไม่ execute ตอน load
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

