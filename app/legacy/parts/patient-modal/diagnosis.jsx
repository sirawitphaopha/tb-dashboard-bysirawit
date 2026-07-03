'use client'
/** patient-modal/diagnosis.jsx — DiagnosisTab (วินิจฉัย/เสมหะ/ดื้อยา) + consts (แยกรอบ 3) */
import * as React from 'react'
const { useState } = React
import { hasResistance, afbCombined, isAfbPositive, getSputumConversion, isDelayedConversion } from './sputum-utils'

// ── consts เสมหะ/วินิจฉัย ──
const TP_OPTIONS = [
  {value:'M0',label:'เดือนที่ 0 (วินิจฉัย)'},
  ...Array.from({length:18},(_,i)=>({value:'M'+(i+1),label:'เดือนที่ '+(i+1)}))
];

// Specimen types
const SPECIMEN_TYPES = ['Sputum','Pus','Stool','Bronchoalveolar Lavage (BAL)','Biopsy','CSF (น้ำไขสันหลัง)','Pleural fluid (น้ำในช่องเยื่อหุ้มปอด)','Urine','อื่นๆ'];

// Molecular test types
const MOLEC_TYPES = [
  'TB-PCR (Conventional PCR)',
  'GeneXpert MTB/RIF',
  'GeneXpert MTB/RIF Ultra',
  'Truenat MTB',
  'LPA (FL-LPA — First-Line)',
  'LPA (SL-LPA — Second-Line)',
  'TB Culture (Solid — LJ)',
  'TB Culture (Liquid — MGIT)',
  'TB Culture (อื่นๆ)',
  'อื่นๆ',
];

// AFB result options
const AFB_RESULTS = ['Neg','Scanty','1+','2+','3+'];

// Resistance result options
const RIF_RESULTS   = ['RIF susceptible','RIF resistant','RIF indeterminate','Invalid'];
const INH_RESULTS   = ['INH susceptible','INH resistant','INH indeterminate','Invalid'];
const SLD_DRUGS     = [
  {key:'flqs', label:'FLQS*', expand:'Fluoroquinolones', sub:['Levofloxacin','Ofloxacin','Moxifloxacin']},
  {key:'agcp',  label:'AG/CP*', expand:'Aminoglycoside/Cyclic peptide', sub:['Amikacin','Kanamycin','Capreomycin','Viomycin']},
  {key:'eto',   label:'ETO', expand:'Ethionamide', sub:[]},
];
const SLD_RES_OPTIONS = ['Susceptible','Resistant','Indeterminate','Not tested'];

// Check if any sputum record has resistance

const EMPTY_DX = () => ({
  tp: 'M0',
  date: new Date().toISOString().split('T')[0],
  // Each specimen has its own type + AFB samples
  specimens: [{type:'Sputum', otherLabel:'', afbSamples:[{result:'',scantyCount:''}]}],
  molecType: '',
  molecOther: '',
  mtbResult: '',
  rifResult: '',
  inhResult: '',
  showSld: false,
  sldResults: {flqs:'',agcp:'',eto:''},
  igraResult: '',
  igraDate: '',
  igraNote: '',
  extraLabsPerSpecimen: {}, // keyed by specimen type
  showExtraLabsPerSpecimen: {}, // keyed by specimen type
});

// Visible columns state
const DEFAULT_COLS = {tp:true, date:true, afb:true, molec:true, rif:true, inh:false, sld:false, igra:false};

// Helper: format date to DD/MM/YYYY
function fmtDate(d) {
  if (!d) return '-';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return parts[2]+'/'+parts[1]+'/'+parts[0];
}

// Specimen-specific lab fields
const SPECIMEN_LAB_FIELDS = {
  'Bronchoalveolar Lavage (BAL)': [
    {k:'balWbc',    label:'WBC (cells/μL)'},
    {k:'balLymph',  label:'Lymphocyte (%)'},
    {k:'balMacro',  label:'Macrophage (%)'},
    {k:'balNeutro', label:'Neutrophil (%)'},
    {k:'balProtein',label:'Protein (mg/dL)'},
    {k:'balGlucose',label:'Glucose (mg/dL)'},
    {k:'balLdh',    label:'LDH (U/L)'},
  ],
  'CSF (น้ำไขสันหลัง)': [
    {k:'csfAppear',  label:'ลักษณะ', type:'text', placeholder:'clear/turbid/xanthochromic'},
    {k:'csfProtein', label:'Protein (mg/dL)'},
    {k:'csfGlucose', label:'Glucose (mg/dL)'},
    {k:'csfSerum',   label:'Serum Glucose (mg/dL)'},
    {k:'csfWbc',     label:'WBC (cells/μL)'},
    {k:'csfLymph',   label:'Lymphocyte (%)'},
    {k:'csfPmn',     label:'PMN (%)'},
    {k:'csfRbc',     label:'RBC (cells/μL)'},
    {k:'csfCl',      label:'Chloride (mEq/L)'},
    {k:'csfAda',     label:'ADA (U/L)'},
    {k:'csfCrypto',  label:'Crypto Ag', tp:'select', opts:['','Positive','Negative','Not done']},
    {k:'csfGram',    label:'Gram stain', type:'text', placeholder:'no organism/...'},
    {k:'csfIndia',   label:'India ink', tp:'select', opts:['','Positive','Negative','Not done']},
  ],
  'Pleural fluid (น้ำในช่องเยื่อหุ้มปอด)': [
    {k:'pfAppear',   label:'ลักษณะ', type:'text', placeholder:'clear/turbid/bloody/chylous'},
    {k:'pfProtein',  label:'Protein fluid (g/dL)'},
    {k:'pfSerum',    label:'Protein serum (g/dL)'},
    {k:'pfLdh',      label:'LDH fluid (U/L)'},
    {k:'pfLdhSerum', label:'LDH serum (U/L)'},
    {k:'pfGlucose',  label:'Glucose (mg/dL)'},
    {k:'pfWbc',      label:'WBC (cells/μL)'},
    {k:'pfLymph',    label:'Lymphocyte (%)'},
    {k:'pfPmn',      label:'PMN (%)'},
    {k:'pfAda',      label:'ADA (U/L)'},
    {k:'pfPh',       label:'pH'},
    {k:'pfTrigly',   label:'Triglyceride (mg/dL)'},
    {k:'pfGram',     label:'Gram stain', type:'text', placeholder:'no organism/...'},
  ],
};

function DiagnosisTab({patient, onUpdate, locked}) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_DX());
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [editIdx, setEditIdx] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const sf = (k,v) => setForm(f=>({...f,[k]:v}));
  // Specimen handlers
  const addSpecimen = () => setForm(f=>({...f,specimens:[...f.specimens,{type:'Sputum',otherLabel:'',afbSamples:[{result:'',scantyCount:''}]}]}));
  const rmSpecimen = (si) => setForm(f=>({...f,specimens:f.specimens.filter((_,i)=>i!==si)}));
  const setSpecimenType = (si,t) => setForm(f=>{const arr=[...f.specimens];arr[si]={...arr[si],type:t};return {...f,specimens:arr};});
  const setSpecimenOther = (si,v) => setForm(f=>{const arr=[...f.specimens];arr[si]={...arr[si],otherLabel:v};return {...f,specimens:arr};});
  const setSample = (si,ai,k,v) => setForm(f=>{
    const specs=[...f.specimens];
    const afb=[...specs[si].afbSamples];
    afb[ai]={...afb[ai],[k]:v};
    specs[si]={...specs[si],afbSamples:afb};
    return {...f,specimens:specs};
  });
  const addSample = (si) => setForm(f=>{
    const specs=[...f.specimens];
    if(specs[si].afbSamples.length>=3) return f;
    specs[si]={...specs[si],afbSamples:[...specs[si].afbSamples,{result:'',scantyCount:''}]};
    return {...f,specimens:specs};
  });
  const rmSample = (si,ai) => setForm(f=>{
    const specs=[...f.specimens];
    specs[si]={...specs[si],afbSamples:specs[si].afbSamples.filter((_,i)=>i!==ai)};
    return {...f,specimens:specs};
  });
  const setSld = (k,v) => setForm(f=>({...f,sldResults:{...f.sldResults,[k]:v}}));
  const setExtraLab = (specType,k,v) => sf('extraLabsPerSpecimen',{...form.extraLabsPerSpecimen,[specType]:{...(form.extraLabsPerSpecimen[specType]||{}),[k]:v}});
  const toggleExtraLabs = (specType) => sf('showExtraLabsPerSpecimen',{...form.showExtraLabsPerSpecimen,[specType]:!form.showExtraLabsPerSpecimen[specType]});

  const openAdd = () => { setForm(EMPTY_DX()); setEditIdx(null); setShowAdd(true); setConflictData(null); };
  const openEdit = (idx) => {
    const s = patient.sputum[idx];
    // Build specimens array from legacy or new format
    let specimens;
    if (s.specimens && s.specimens.length>0) {
      specimens = s.specimens;
    } else {
      const afb = s.afbSamples&&s.afbSamples.length>0 ? s.afbSamples : [{result:s.result||'',scantyCount:s.scantyCount||''}];
      specimens = [{type:s.specimenType||'Sputum', otherLabel:s.specimenOther||'', afbSamples:afb}];
    }
    setForm({
      tp: s.tp||'M0', date: s.date||new Date().toISOString().split('T')[0],
      specimens,
      molecType: s.molecType||'', molecOther: s.molecOther||'',
      mtbResult: s.mtbResult||s.genexpert||'',
      rifResult: s.rifResult||(s.genexpertRif==='Sensitive'?'RIF susceptible':s.genexpertRif==='Resistant'?'RIF resistant':s.genexpertRif==='Indeterminate'?'RIF indeterminate':'')||'',
      inhResult: s.inhResult||'',
      showSld: !!(s.sldResults&&Object.values(s.sldResults).some(v=>v)),
      sldResults: s.sldResults||{flqs:'',agcp:'',eto:''},
      igraResult: s.igraResult||'',
      igraDate: s.igraDate||'',
      igraNote: s.igraNote||'',
      extraLabsPerSpecimen: s.extraLabsPerSpecimen||{},
      showExtraLabsPerSpecimen: s.showExtraLabsPerSpecimen||{},
    });
    setEditIdx(idx); setShowAdd(true); setConflictData(null);
  };

  const mergeEntries = (existing, newE) => {
    // Merge specimens arrays (combine by type)
    const mergedSpecs = [...(existing.specimens||[])];
    (newE.specimens||[]).forEach(ns => {
      const ei = mergedSpecs.findIndex(es=>es.type===ns.type);
      if (ei>=0) { if(ns.afbSamples?.some(s=>s.result)) mergedSpecs[ei]={...mergedSpecs[ei],afbSamples:ns.afbSamples}; }
      else mergedSpecs.push(ns);
    });
    return {
      ...existing, specimens: mergedSpecs,
      molecType: newE.molecType||existing.molecType,
      molecOther: newE.molecOther||existing.molecOther,
      mtbResult: newE.mtbResult||existing.mtbResult,
      genexpert: newE.genexpert||existing.genexpert,
      rifResult: newE.rifResult||existing.rifResult,
      genexpertRif: newE.genexpertRif||existing.genexpertRif,
      inhResult: newE.inhResult||existing.inhResult,
      sldResults: {...(existing.sldResults||{}), ...(newE.sldResults||{})},
      igraResult: newE.igraResult||existing.igraResult,
      extraLabs: {...(existing.extraLabs||{}), ...(newE.extraLabs||{})},
    };
  };

  const buildEntry = () => {
    const specs = form.specimens||[];
    // Legacy compat: first specimen
    const firstSpec = specs[0]||{type:'Sputum',afbSamples:[]};
    const firstAfb = (firstSpec.afbSamples||[]).filter(s=>s.result);
    return {
      tp:form.tp, date:form.date,
      specimens: specs.map(sp=>({...sp, afbSamples:(sp.afbSamples||[]).filter(s=>s.result)})),
      // legacy fields
      specimenType: firstSpec.type,
      specimenOther: firstSpec.otherLabel||'',
      result: firstAfb[0]?.result||'',
      scantyCount: firstAfb[0]?.scantyCount||'',
      afbSamples: firstAfb,
      molecType:form.molecType, molecOther:form.molecOther,
      genexpert:form.mtbResult, mtbResult:form.mtbResult,
      genexpertRif:form.rifResult==='RIF resistant'?'Resistant':form.rifResult==='RIF susceptible'?'Sensitive':form.rifResult==='RIF indeterminate'?'Indeterminate':form.rifResult,
      rifResult:form.rifResult, inhResult:form.inhResult,
      sldResults:form.showSld?form.sldResults:{},
      igraResult:form.igraResult,
      igraDate:form.igraDate||'',
      igraNote:form.igraNote||'',
      extraLabsPerSpecimen:form.extraLabsPerSpecimen||{},
      showExtraLabsPerSpecimen:form.showExtraLabsPerSpecimen||{},
    };
  };

  const isEntryConflict = (existing, newE) => {
    if (existing.tp !== newE.tp || existing.date !== newE.date) return false;
    const existSpecs = existing.specimens||[];
    const newSpecs = newE.specimens||[];
    const hasBothAfb = newSpecs.some(ns=>{
      const es = existSpecs.find(s=>s.type===ns.type);
      return es && es.afbSamples?.some(s=>s.result) && ns.afbSamples?.some(s=>s.result);
    });
    const hasBothMolec = existing.mtbResult && newE.mtbResult && existing.mtbResult!==newE.mtbResult;
    return hasBothAfb || hasBothMolec;
  };

  const save = (forceNew=false, forceOld=false) => {
    const entry = buildEntry();
    const isRes = entry.rifResult==='RIF resistant'||entry.inhResult==='INH resistant'||(entry.sldResults&&Object.values(entry.sldResults).some(v=>v==='Resistant'));
    let sputum = [...(patient.sputum||[])];
    if (editIdx!==null) {
      sputum[editIdx] = entry;
    } else {
      const existingIdx = sputum.findIndex(s=>s.tp===entry.tp && s.date===entry.date);
      if (existingIdx>=0) {
        if (forceNew) { sputum[existingIdx] = entry; }
        else if (forceOld) { setShowAdd(false); setEditIdx(null); setConflictData(null); return; }
        else if (isEntryConflict(sputum[existingIdx], entry)) { setConflictData({existingIdx, newEntry:entry}); return; }
        else { sputum[existingIdx] = mergeEntries(sputum[existingIdx], entry); }
      } else { sputum.push(entry); }
    }
    onUpdate({...patient,sputum,status:isRes?'critical':patient.status,hasResistance:isRes||!!patient.hasResistance});
    setShowAdd(false); setEditIdx(null); setConflictData(null);
  };

  const del = (idx) => { onUpdate({...patient,sputum:(patient.sputum||[]).filter((_,i)=>i!==idx)}); };

  const sorted = [...(patient.sputum||[])].sort((a,b)=>{
    const na=a.tp==='M0'?0:parseInt((a.tp||'').replace('M',''))||99;
    const nb=b.tp==='M0'?0:parseInt((b.tp||'').replace('M',''))||99;
    if(na!==nb) return na-nb;
    return (a.date||'').localeCompare(b.date||'');
  });

  const conversion = getSputumConversion(patient.sputum||[]);
  const delayed = isDelayedConversion(patient.sputum||[]);
  const resistant = hasResistance(patient.sputum||[]);
  const allTps = [...new Set(sorted.map(s=>s.tp))];
  const toggleCol = k => setCols(c=>({...c,[k]:!c[k]}));
  const inp = 'w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:ring-1 focus:ring-teal-400';
  const isLTBI = patient.diseaseLocation==='LTBI';
  // specimen fields = union of all specimen types in form
  const specimenFields = (form.specimens||[]).reduce((acc,sp)=>{
    const f = SPECIMEN_LAB_FIELDS[sp.type];
    if (f) f.forEach(fi=>{ if (!acc.find(a=>a.k===fi.k)) acc.push(fi); });
    return acc;
  },[]);

  return (
    <div className="space-y-5 tb-fade">

      {resistant && (
        <div className="bg-red-600 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <i className="fa-solid fa-biohazard text-2xl flex-shrink-0"></i>
          <div>
            <p className="font-black text-base">⚠ พบเชื้อดื้อยา — ต้องประเมินสูตร MDR/XDR</p>
            <p className="text-red-100 text-xs mt-0.5">ตรวจสอบผล RIF / INH / SLD ด้านล่าง และปรึกษาผู้เชี่ยวชาญ</p>
          </div>
        </div>
      )}

      {/* Sputum conversion status */}
      {delayed && (
        <div className="bg-red-50 border-2 border-red-400 p-3 rounded-2xl flex items-center gap-3">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-xl"></i>
          <div><p className="font-bold text-red-700 text-sm">Delayed Sputum Conversion</p><p className="text-xs text-red-600">เดือนที่ 2 ยังพบเชื้อ — ต้องประเมินการรักษาและ adherence</p></div>
        </div>
      )}
      {!delayed && conversion.converted && (
        <div className="bg-green-50 border border-green-300 p-3 rounded-2xl flex items-center gap-3">
          <i className="fa-solid fa-check-circle text-green-500 text-xl"></i>
          <div><p className="font-bold text-green-700 text-sm">Sputum Conversion สำเร็จ ({conversion.tp})</p><p className="text-xs text-green-600">{fmtDate(conversion.date)}</p></div>
        </div>
      )}

      {/* IGRA — LTBI */}


      {/* Header row */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-microscope mr-2 text-teal-600"></i>ผลการวินิจฉัย (Diagnosis)</h3>
        <button type="button" onClick={()=>{if(!locked)openAdd();}} disabled={locked} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}><i className="fa-solid fa-plus mr-1"></i>เพิ่มผล</button>
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <div className="bg-teal-50 border-2 border-teal-300 p-4 rounded-2xl tb-fade space-y-4">
          <p className="font-bold text-teal-800 text-sm">{editIdx!==null?'แก้ไขผล':'เพิ่มผลการวินิจฉัย'}</p>

          {/* Row 1: เดือนที่ + วันที่ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">เดือนที่</label>
              <select value={form.tp} onChange={e=>sf('tp',e.target.value)} className={inp}>
                {TP_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">วันที่</label>
              <input type="date" value={form.date} onChange={e=>sf('date',e.target.value)} className={inp}/>
            </div>
          </div>

          {/* Specimens — each has own type + AFB */}
          <div className="space-y-3">
            {(form.specimens||[]).map((sp,si)=>(
              <div key={si} className="bg-white border border-gray-200 rounded-xl p-3">
                {/* Specimen header */}
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-vial text-amber-400 text-xs flex-shrink-0"></i>
                  <select value={sp.type} onChange={e=>setSpecimenType(si,e.target.value)} className="flex-1 p-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-1 focus:ring-teal-300">
                    {SPECIMEN_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                  {sp.type==='อื่นๆ' && <input value={sp.otherLabel||''} onChange={e=>setSpecimenOther(si,e.target.value)} placeholder="ระบุ..." className="flex-1 p-1.5 border border-teal-200 rounded-lg text-xs outline-none bg-white"/>}
                  {(form.specimens||[]).length>1 && <button type="button" onClick={()=>rmSpecimen(si)} className="text-gray-300 hover:text-red-400 ml-1 flex-shrink-0"><i className="fa-solid fa-xmark"></i></button>}
                </div>
                {/* AFB smear for this specimen */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-600"><i className="fa-solid fa-bacteria mr-1 text-amber-500"></i>AFB smear</p>
                    {sp.type==='Sputum' && (sp.afbSamples||[]).length < 3 &&
                      <button type="button" onClick={()=>addSample(si)} className="text-xs text-teal-600 hover:text-teal-800 font-semibold"><i className="fa-solid fa-plus mr-1"></i>เพิ่มครั้งที่ {(sp.afbSamples||[]).length+1}</button>}
                  </div>
                  {(sp.afbSamples||[]).map((sa,ai)=>(
                    <div key={ai} className="flex items-center gap-2">
                      {sp.type==='Sputum' && <span className="text-xs text-gray-400 font-mono w-12 flex-shrink-0">ครั้งที่ {ai+1}</span>}
                      <select value={sa.result} onChange={e=>setSample(si,ai,'result',e.target.value)} className="flex-1 p-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-gray-50 focus:ring-1 focus:ring-teal-300">
                        <option value="">-- ผล AFB --</option>
                        {AFB_RESULTS.map(r=><option key={r}>{r}</option>)}
                      </select>
                      {sa.result==='Scanty' && (
                        <input value={sa.scantyCount||''} onChange={e=>setSample(si,ai,'scantyCount',e.target.value)} placeholder="จำนวน cells เช่น 3" className="flex-1 p-1.5 border border-amber-200 rounded-lg text-xs font-mono outline-none bg-white focus:ring-1 focus:ring-amber-300"/>
                      )}
                      {(sp.afbSamples||[]).length>1 && <button type="button" onClick={()=>rmSample(si,ai)} className="text-gray-300 hover:text-red-400"><i className="fa-solid fa-xmark text-xs"></i></button>}
                    </div>
                  ))}
                  {(sp.afbSamples||[]).some(s=>s.result) && (
                    <p className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-1 rounded-lg mt-1">
                      <i className="fa-solid fa-eye mr-1"></i>{(sp.afbSamples||[]).filter(s=>s.result).map(s=>s.result==='Scanty'&&s.scantyCount?'Scanty '+s.scantyCount+' cells':s.result).join(' / ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {/* Add specimen button */}
            <button type="button" onClick={addSpecimen} className="w-full py-2 border-2 border-dashed border-teal-300 rounded-xl text-xs font-semibold text-teal-600 hover:bg-teal-50 transition-colors">
              <i className="fa-solid fa-plus mr-1"></i>เพิ่มสิ่งส่งตรวจชนิดอื่น
            </button>
          </div>

          {/* Specimen-specific lab fields — one section per specimen type that has fields */}
          {(form.specimens||[]).filter(sp=>SPECIMEN_LAB_FIELDS[sp.type]).map(sp=>{
            const fields = SPECIMEN_LAB_FIELDS[sp.type]||[];
            const isOpen = form.showExtraLabsPerSpecimen[sp.type];
            return (
              <div key={sp.type} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 tb-fade">
                <label className="flex items-center gap-2 text-xs text-indigo-700 font-bold cursor-pointer">
                  <input type="checkbox" checked={!!isOpen} onChange={()=>toggleExtraLabs(sp.type)} className="accent-indigo-600"/>
                  ผล Lab เฉพาะ {sp.type}
                </label>
                {isOpen && (
                  <div className="grid grid-cols-4 gap-2 mt-2 tb-fade">
                    {fields.map(f=>(
                      <div key={f.k}>
                        <label className="text-xs text-gray-500 block mb-0.5">{f.label}</label>
                        {f.tp==='select' ? (
                          <select value={((form.extraLabsPerSpecimen||{})[sp.type]||{})[f.k]||''} onChange={e=>setExtraLab(sp.type,f.k,e.target.value)} className="w-full p-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:ring-1 focus:ring-indigo-300">
                            {(f.opts||[]).map(o=><option key={o} value={o}>{o||'--'}</option>)}
                          </select>
                        ) : f.type==='text' ? (
                          <input type="text" value={((form.extraLabsPerSpecimen||{})[sp.type]||{})[f.k]||''} onChange={e=>setExtraLab(sp.type,f.k,e.target.value)} placeholder={f.placeholder||''} className="w-full p-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:ring-1 focus:ring-indigo-300"/>
                        ) : (
                          <input type="number" step="0.01" value={((form.extraLabsPerSpecimen||{})[sp.type]||{})[f.k]||''} onChange={e=>setExtraLab(sp.type,f.k,e.target.value)} className="w-full p-1.5 border border-gray-200 rounded-lg text-xs text-center outline-none bg-white focus:ring-1 focus:ring-indigo-300"/>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Molecular — must select type first */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-gray-700"><i className="fa-solid fa-dna mr-1 text-purple-500"></i>Molecular / Culture</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">ชนิดการตรวจ <span className="text-gray-300">(เลือกก่อน)</span></label>
                <select value={form.molecType} onChange={e=>{sf('molecType',e.target.value); if(!e.target.value) sf('mtbResult','');}} className={inp}>
                  <option value="">-- ไม่ได้ตรวจ --</option>
                  {MOLEC_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
                {form.molecType==='อื่นๆ' && <input value={form.molecOther} onChange={e=>sf('molecOther',e.target.value)} placeholder="ระบุ..." className={inp+' mt-1'}/>}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">
                  ผล MTB {!form.molecType && <span className="text-gray-300">(เลือกชนิดการตรวจก่อน)</span>}
                </label>
                <select value={form.mtbResult} onChange={e=>sf('mtbResult',e.target.value)} disabled={!form.molecType} className={inp+((!form.molecType)?' opacity-40 cursor-not-allowed':'')}>
                  <option value="">--</option>
                  <option value="Detected">MTB Detected</option>
                  <option value="Detected very low">MTB Detected (Very Low)</option>
                  <option value="Not Detected">MTB Not Detected</option>
                  <option value="Invalid">Invalid</option>
                  <option value="Error">Error</option>
                </select>
              </div>
            </div>

            {form.molecType && form.mtbResult==='Detected' && (
              <div className="space-y-2 tb-fade">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-0.5">RIF Resistance <span className="text-gray-300 font-normal">(Rifampicin)</span></label>
                    <select value={form.rifResult} onChange={e=>sf('rifResult',e.target.value)} className={inp+(form.rifResult==='RIF resistant'?' border-red-400 bg-red-50 font-bold text-red-700':'')}>
                      <option value="">--</option>
                      {RIF_RESULTS.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-0.5">INH Resistance <span className="text-gray-300 font-normal">(Isoniazid)</span></label>
                    <select value={form.inhResult} onChange={e=>sf('inhResult',e.target.value)} className={inp+(form.inhResult==='INH resistant'?' border-red-400 bg-red-50 font-bold text-red-700':'')}>
                      <option value="">--</option>
                      {INH_RESULTS.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {(form.rifResult==='RIF resistant'||form.inhResult==='INH resistant') && (
                  <div className="tb-fade">
                    <label className="flex items-center gap-2 text-xs text-red-700 font-bold cursor-pointer">
                      <input type="checkbox" checked={form.showSld} onChange={e=>sf('showSld',e.target.checked)} className="accent-red-600"/>
                      เพิ่มผล SLD (Second-Line Drug Susceptibility Testing)
                    </label>
                    {form.showSld && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2 space-y-2 tb-fade">
                        <p className="text-xs text-red-700 font-bold mb-1">Drug Susceptibility Testing — Second-Line Drugs (SLD)</p>
                        {SLD_DRUGS.map(d=>(
                          <div key={d.key} className="flex items-center gap-3">
                            <div className="w-36 flex-shrink-0">
                              <p className="text-xs font-bold text-gray-700">{d.label}</p>
                              <p className="text-xs text-gray-500">{d.expand}</p>
                              {d.sub.length>0 && <p className="text-xs text-gray-300 leading-tight">{d.sub.join(', ')}</p>}
                            </div>
                            <select value={form.sldResults[d.key]||''} onChange={e=>setSld(d.key,e.target.value)} className={'flex-1 p-1.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-300 '+(form.sldResults[d.key]==='Resistant'?'border-red-400 bg-red-50 font-bold text-red-700':'border-gray-200 bg-white')}>
                              <option value="">-- ยังไม่มีผล --</option>
                              {SLD_RES_OPTIONS.map(o=><option key={o}>{o}</option>)}
                            </select>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-red-100 text-xs text-gray-400 space-y-0.5">
                          <p><strong>FLQS</strong> = Fluoroquinolones: Levofloxacin, Ofloxacin, Moxifloxacin</p>
                          <p><strong>AG/CP</strong> = Aminoglycoside/Cyclic peptide: Amikacin, Kanamycin, Capreomycin, Viomycin</p>
                          <p><strong>ETO</strong> = Ethionamide &nbsp;·&nbsp; <strong>SLD</strong> = Second-Line Drugs</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IGRA */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
            <p className="text-xs font-bold text-indigo-700 mb-2"><i className="fa-solid fa-vial mr-1"></i>IGRA (Interferon-Gamma Release Assay)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">ผล IGRA</label>
                <select value={form.igraResult||''} onChange={e=>sf('igraResult',e.target.value)} className={inp}>
                  <option value="">-- ไม่ได้ตรวจ --</option>
                  <option>Positive</option><option>Negative</option><option>Indeterminate</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">วันที่ตรวจ IGRA</label>
                <input type="date" value={form.igraDate||''} onChange={e=>sf('igraDate',e.target.value)} className={inp}/>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-0.5">หมายเหตุ / ค่า IFN-γ</label>
                <input value={form.igraNote||''} onChange={e=>sf('igraNote',e.target.value)} placeholder="เช่น IFN-γ = 1.2 IU/mL" className={inp}/>
              </div>
            </div>
            {form.igraResult==='Positive' && <p className="text-xs text-indigo-700 font-semibold mt-1.5"><i className="fa-solid fa-circle-info mr-1"></i>IGRA Positive → พิจารณา LTBI treatment</p>}
          </div>

          {/* Conflict dialog */}
          {conflictData && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 tb-fade">
              <p className="font-bold text-amber-800 text-sm mb-1"><i className="fa-solid fa-triangle-exclamation mr-2"></i>พบข้อมูลซ้ำ — {conflictData.newEntry.tp} วันที่ {fmtDate(conflictData.newEntry.date)}</p>
              <p className="text-xs text-amber-700 mb-3">มีข้อมูลในวันนี้อยู่แล้ว และมีข้อมูล AFB/Molecular ที่ขัดแย้งกัน — จะใช้ข้อมูลใด?</p>
              <div className="flex gap-2">
                <button type="button" onClick={()=>save(false,true)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">เก็บข้อมูลเดิม</button>
                <button type="button" onClick={()=>save(true,false)} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold">ใช้ข้อมูลใหม่แทน</button>
                <button type="button" onClick={()=>setConflictData(null)} className="px-3 py-2 text-gray-400 hover:text-gray-600 text-xs">ยกเลิก</button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>{setShowAdd(false);setEditIdx(null);setConflictData(null);}} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">ยกเลิก</button>
            <button type="button" onClick={()=>save()} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold"><i className="fa-solid fa-save mr-1"></i>บันทึก</button>
          </div>
        </div>
      )}

      {/* Dynamic month cards */}
      {allTps.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {allTps.map(tpKey=>{
            const entries = sorted.filter(x=>x.tp===tpKey);
            const pos = entries.some(s=>isAfbPositive(s));
            const isConvTp = conversion.converted && conversion.tp===tpKey;
            const isDelTp = delayed && tpKey==='M2';
            const isRes = entries.some(s=>hasResistance([s]));
            let cardCls = 'min-w-[120px] p-3 rounded-2xl border-2 text-center flex-shrink-0 relative ';
            if (isRes) cardCls += 'bg-red-100 border-red-500';
            else if (isDelTp) cardCls += 'bg-red-50 border-red-400';
            else if (isConvTp) cardCls += 'bg-green-50 border-green-400';
            else if (!pos) cardCls += 'bg-green-50 border-green-300';
            else cardCls += 'bg-amber-50 border-amber-300';
            const tpLabel = tpKey==='M0'?'วินิจฉัย':tpKey;
            return (
              <div key={tpKey} className={cardCls}>
                {isDelTp && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">Delayed</span>}
                {isConvTp && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap">Converted</span>}
                <p className="text-xs font-bold text-gray-500 mb-1">{tpLabel}</p>
                {entries.length>0 ? entries.map((s,si)=>(
                  <div key={si} className={si>0?'mt-2 pt-2 border-t border-gray-200':''}>
                    {entries.length>1 && <p className="text-xs text-gray-400 mb-0.5">{(s.specimens&&s.specimens.length>0?s.specimens.map(sp=>sp.type.split(' ')[0]):[s.specimenType||'Sputum']).join('/')}</p>}
                    <p className={`text-sm font-black leading-tight ${isRes?'text-red-700':isAfbPositive(s)?'text-red-600':'text-green-600'}`}>{afbCombined(s)}</p>
                    {s.mtbResult==='Detected' && <p className="text-xs mt-0.5 font-semibold text-red-600">MTB Detected</p>}
                    {s.mtbResult==='Not Detected' && <p className="text-xs mt-0.5 font-semibold text-green-600">MTB Not Detected</p>}
                    {s.rifResult && <p className={`text-xs font-bold ${s.rifResult==='RIF resistant'?'text-red-700':s.rifResult==='RIF susceptible'?'text-green-600':'text-gray-400'}`}>RIF: {s.rifResult==='RIF resistant'?'Resistant':s.rifResult==='RIF susceptible'?'Susceptible':'?'}</p>}
                    {s.inhResult && <p className={`text-xs font-bold ${s.inhResult==='INH resistant'?'text-red-700':s.inhResult==='INH susceptible'?'text-green-600':'text-gray-400'}`}>INH: {s.inhResult==='INH resistant'?'Resistant':s.inhResult==='INH susceptible'?'Susceptible':'?'}</p>}
                  </div>
                )) : <p className="text-gray-300 text-xs mt-1">รอผล</p>}
                {entries.length>0 && <p className="text-xs text-gray-400 mt-1.5">{fmtDate(entries[0].date)}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Column selector */}
      {sorted.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-bold">แสดงคอลัมน์:</span>
          {[['tp','เดือนที่'],['date','วันที่'],['afb','AFB'],['molec','Molecular / Culture'],['rif','RIF'],['inh','INH'],['sld','SLD'],['igra','IGRA']].map(([k,lbl])=>(
            <button key={k} type="button" onClick={()=>toggleCol(k)} className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${cols[k]?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-400 hover:border-teal-300'}`}>{lbl}</button>
          ))}
        </div>
      )}

      {/* Results table */}
      {sorted.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  {cols.tp    && <th className="p-3 pl-4 text-left font-semibold">เดือนที่</th>}
                  {cols.date  && <th className="p-3 text-left font-semibold">วันที่</th>}
                  <th className="p-3 text-left font-semibold text-gray-400">Specimen</th>
                  {cols.afb   && <th className="p-3 text-left font-semibold">AFB</th>}
                  {cols.molec && <th className="p-3 text-left font-semibold">Molecular / Culture</th>}
                  {cols.rif   && <th className="p-3 text-left font-semibold">RIF (Rifampicin)</th>}
                  {cols.inh   && <th className="p-3 text-left font-semibold">INH (Isoniazid)</th>}
                  {cols.sld   && <th className="p-3 text-left font-semibold">SLD</th>}
                  {cols.igra  && <th className="p-3 text-left font-semibold">IGRA</th>}
                  <th className="p-3 text-left font-semibold">Conversion</th>
                  <th className="p-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((s,i)=>{
                  const pos = isAfbPositive(s);
                  const isRes = hasResistance([s]);
                  const isConvRow = conversion.converted && conversion.tp===s.tp && !pos;
                  const isDelRow = delayed && s.tp==='M2' && pos;
                  const monthNum = s.tp==='M0'?0:parseInt((s.tp||'').replace('M',''))||0;
                  const showConvCol = monthNum >= 2;
                  const molecShort = s.molecType
                    ? s.molecType.replace('TB-PCR (Conventional PCR)','TB-PCR').replace('GeneXpert MTB/RIF Ultra','GX-Ultra').replace('GeneXpert MTB/RIF','GeneXpert').replace('LPA (FL-LPA — First-Line)','LPA FL').replace('LPA (SL-LPA — Second-Line)','LPA SL')
                    : (s.genexpert?'GeneXpert':'');
                  const sldStr = s.sldResults && Object.values(s.sldResults).some(v=>v&&v!=='Not tested')
                    ? SLD_DRUGS.filter(d=>s.sldResults[d.key]&&s.sldResults[d.key]!=='Not tested').map(d=>d.label+': '+s.sldResults[d.key]).join(', ')
                    : '-';
                  return (
                    <React.Fragment key={i}>
                    <tr className={isRes?'bg-red-50':isDelRow?'bg-red-50/60':isConvRow?'bg-green-50/60':''}>
                      {cols.tp   && <td className="p-3 pl-4 font-mono font-bold">{s.tp==='M0'?'วินิจฉัย':s.tp}</td>}
                      {cols.date && <td className="p-3 text-gray-500">{fmtDate(s.date)}</td>}
                      <td className="p-3 text-gray-400 max-w-[120px]" title={(s.specimens||[]).map(sp=>sp.type).join(', ')||s.specimenType||'Sputum'}>{(s.specimens&&s.specimens.length>0?s.specimens.map(sp=>sp.type.split(' ')[0]):[s.specimenType||'Sputum']).join(', ')}</td>
                      {cols.afb  && <td className={'p-3 font-bold '+(isRes?'text-red-700':pos?'text-red-600':'text-green-600')}>{afbCombined(s)}</td>}
                      {cols.molec && (
                        <td className={'p-3 font-semibold '+(s.mtbResult==='Detected'?'text-red-600':s.mtbResult==='Not Detected'?'text-green-600':'text-gray-400')}>
                          {molecShort && <span className="text-gray-400 mr-1 font-normal text-xs">[{molecShort}]</span>}
                          {s.mtbResult==='Detected'?'MTB Detected':s.mtbResult==='Not Detected'?'MTB Not Detected':s.mtbResult||'-'}
                        </td>
                      )}
                      {cols.rif  && <td className={'p-3 font-semibold '+(s.rifResult==='RIF resistant'?'text-red-700 font-black':s.rifResult==='RIF susceptible'?'text-green-600':'text-gray-400')}>{s.rifResult||'-'}</td>}
                      {cols.inh  && <td className={'p-3 font-semibold '+(s.inhResult==='INH resistant'?'text-red-700 font-black':s.inhResult==='INH susceptible'?'text-green-600':'text-gray-400')}>{s.inhResult||'-'}</td>}
                      {cols.sld  && <td className="p-3 text-gray-500 max-w-xs">{sldStr}</td>}
                      {cols.igra && <td className={'p-3 font-semibold '+(s.igraResult==='Positive'?'text-red-600':s.igraResult==='Negative'?'text-green-600':s.igraResult?'text-amber-600':'text-gray-300')}>{s.igraResult||'-'}{s.igraNote?' ('+s.igraNote+')':''}</td>}
                      <td className="p-3">
                        {showConvCol ? (
                          isDelRow   ? <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">Delayed conversion</span>
                          : isConvRow? <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">Converted ✓</span>
                          : !pos     ? <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full">Neg ✓</span>
                                     : <span className="bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full">Pos</span>
                        ) : <span className="text-gray-300 text-xs">-</span>}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {s.extraLabsPerSpecimen && Object.keys(s.extraLabsPerSpecimen).some(k=>Object.keys(s.extraLabsPerSpecimen[k]||{}).length>0) && (
                          <button type="button" onClick={()=>setExpandedRow(expandedRow===i?null:i)}
                            className={'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all mr-1 '+(expandedRow===i?'bg-indigo-100 text-indigo-700':'bg-indigo-50 text-indigo-500 hover:bg-indigo-100')}>
                            <i className={'fa-solid '+(expandedRow===i?'fa-chevron-up':'fa-chevron-down')+' text-xs'}></i>
                            ผล Lab
                          </button>
                        )}
                        <button type="button" onClick={()=>openEdit(i)} className="text-gray-300 hover:text-teal-500 mr-2 transition-colors"><i className="fa-solid fa-pen text-xs"></i></button>
                        <button type="button" onClick={()=>del(i)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash text-xs"></i></button>
                      </td>
                    </tr>
                    {expandedRow===i && s.extraLabsPerSpecimen && Object.entries(s.extraLabsPerSpecimen).map(([specType, labs])=>{
                      const fields = SPECIMEN_LAB_FIELDS[specType]||[];
                      const filled = fields.filter(f=>labs[f.k]!==undefined && labs[f.k]!=='');
                      if (filled.length===0) return null;
                      return (
                        <tr key={'exp-'+specType} className="bg-indigo-50/40">
                          <td colSpan={99} className="px-4 py-2">
                            <p className="text-xs font-bold text-indigo-700 mb-1"><i className="fa-solid fa-flask-vial mr-1"></i>ผล Lab {specType}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                              {filled.map(f=>(
                                <span key={f.k} className="text-xs text-gray-600"><span className="font-semibold text-gray-700">{f.label}:</span> {labs[f.k]}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Glossary */}
      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500">
        <p className="font-bold text-gray-700 mb-2"><i className="fa-solid fa-book-open mr-1 text-teal-500"></i>คำย่อและคำอธิบาย (Abbreviations)</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
          <p><strong className="text-gray-700">AFB</strong> = Acid-Fast Bacilli (เชื้อวัณโรคย้อมติดสีกรด)</p>
          <p><strong className="text-gray-700">MTB</strong> = Mycobacterium tuberculosis</p>
          <p><strong className="text-gray-700">TB-PCR</strong> = Conventional PCR สำหรับตรวจ MTB</p>
          <p><strong className="text-gray-700">GeneXpert MTB/RIF</strong> = Cartridge-based real-time PCR</p>
          <p><strong className="text-gray-700">LPA FL</strong> = Line Probe Assay First-Line drugs (H, R)</p>
          <p><strong className="text-gray-700">LPA SL</strong> = Line Probe Assay Second-Line drugs</p>
          <p><strong className="text-gray-700">RIF</strong> = Rifampicin (R) — ยาหลัก TB</p>
          <p><strong className="text-gray-700">INH</strong> = Isoniazid (H) — ยาหลัก TB</p>
          <p><strong className="text-gray-700">SLD</strong> = Second-Line Drugs (ยาสายที่สอง)</p>
          <p><strong className="text-gray-700">FLQS</strong> = Fluoroquinolones: Levofloxacin, Ofloxacin, Moxifloxacin</p>
          <p><strong className="text-gray-700">AG/CP</strong> = Aminoglycoside/Cyclic peptide: Amikacin, Kanamycin, Capreomycin, Viomycin</p>
          <p><strong className="text-gray-700">ETO</strong> = Ethionamide (Prothionamide)</p>
          <p><strong className="text-gray-700">BAL</strong> = Bronchoalveolar Lavage (การล้างหลอดลมเล็กผ่านกล้อง)</p>
          <p><strong className="text-gray-700">CSF</strong> = Cerebrospinal Fluid (น้ำไขสันหลัง)</p>
          <p><strong className="text-gray-700">ADA</strong> = Adenosine Deaminase (ช่วยวินิจฉัย TB นอกปอด)</p>
          <p><strong className="text-gray-700">IGRA</strong> = Interferon-Gamma Release Assay (ตรวจ LTBI)</p>
          <p><strong className="text-gray-700">LTBI</strong> = Latent TB Infection (วัณโรคแฝง)</p>
          <p><strong className="text-gray-700">MDR-TB</strong> = Multi-Drug Resistant TB (ดื้อ H+R)</p>
          <p><strong className="text-gray-700">XDR-TB</strong> = Extensively Drug Resistant TB</p>
          <p><strong className="text-gray-700">Scanty</strong> = พบเชื้อน้อยมาก (&lt;1/ลาน 100×)</p>
          <p><strong className="text-gray-700">1+/2+/3+</strong> = ระดับความหนาแน่นเชื้อ AFB (WHO scale)</p>
        </div>
      </div>

      {sorted.length === 0 && !showAdd && (
        <div className="text-center py-10 text-gray-300">
          <i className="fa-solid fa-microscope text-4xl mb-3 block"></i>
          <p className="text-sm">ยังไม่มีผลการวินิจฉัย — กดเพิ่มผลด้านบน</p>
        </div>
      )}
    </div>
  );
}



export { DiagnosisTab }
