'use client'
/** patient-modal/timeline.jsx — TimelineTab + VisitForm + buildGroupedTimeline ฯลฯ (แยกรอบ 3) */
import * as React from 'react'
const { useState, useRef } = React
import { ConfirmModal } from '../shared'
import { calcDoses, CONSULT_TYPES, DRP_TYPES, LAB_GROUPS, getLabStatus, LAB_STATUS_STYLE, ADR_LIST, migrateAdr } from '../globals'
import { hasResistance, afbCombined, isAfbPositive, getSputumConversion, isDelayedConversion } from './sputum-utils'

function detectDotMisses(dot) {
  const sorted = Object.entries(dot).sort((a,b)=>a[0].localeCompare(b[0]));
  const misses = [];
  let streak = 0; let streakStart = null;
  sorted.forEach(([date, taken]) => {
    if (!taken) { streak++; if (!streakStart) streakStart = date; }
    else {
      if (streak >= 2) misses.push({ date: streakStart, streak });
      streak = 0; streakStart = null;
    }
  });
  if (streak >= 2) misses.push({ date: streakStart, streak });
  return misses;
}

function buildGroupedTimeline(patient) {
  const raw = [];

  // start
  if (patient.startDate) raw.push({ type:'start', date:patient.startDate, label:'เริ่มต้นการรักษา', detail:'สูตรยา: '+(patient.regimenHistory?.[0]?.regimen||patient.regimen) });

  // regimen changes
  (patient.regimenHistory||[]).forEach((r,i) => {
    if (i > 0 || r.startDate !== patient.startDate)
      raw.push({ type:'regimen', date:r.startDate, label:'เปลี่ยนสูตรยา → '+r.regimen, detail:r.reason });
  });

  // labs + auto-alerts
  (patient.labs||[]).forEach(l => {
    if (!l.date) return;
    raw.push({ type:'lab', date:l.date, label:'ผล Lab '+l.tp, detail:'ALT '+l.alt+' | AST '+(l.ast||'-')+' | UA '+l.ua+' | Scr '+l.scr+(l.hbsag?' | HBsAg '+l.hbsag:'')+(l.hcv?' | Anti-HCV '+l.hcv:'') });
    if (l.alt > 120) raw.push({ type:'alert-high', date:l.date, label:'⚠ Hepatotoxicity (ALT '+l.alt+')', detail:'ALT > 3×ULN — พิจารณาหยุดยา' });
    else if (l.alt > 40) raw.push({ type:'alert-warn', date:l.date, label:'⚡ ALT สูงเล็กน้อย ('+l.alt+')', detail:'ติดตาม LFT ซ้ำ' });
    if (l.ua > 9) raw.push({ type:'alert-warn', date:l.date, label:'⚡ Hyperuricemia (UA '+l.ua+')', detail:'UA > 9 mg/dL — พิจารณาลด PZA' });
  });

  // sputum / diagnosis
  const sputumSorted = [...(patient.sputum||[])].sort((a,b)=>{
    const na=a.tp==='M0'?0:parseInt((a.tp||'').replace('M',''))||99;
    const nb=b.tp==='M0'?0:parseInt((b.tp||'').replace('M',''))||99;
    return na-nb;
  });
  const convInfo = getSputumConversion ? getSputumConversion(patient.sputum||[]) : {converted:false};
  const delayedConv = isDelayedConversion ? isDelayedConversion(patient.sputum||[]) : false;

  sputumSorted.forEach(s => {
    if (!s.date) return;
    const combined = afbCombined ? afbCombined(s) : (s.result||'-');
    const molecLabel = s.molecType || (s.genexpert ? 'GeneXpert' : '');
    const isTBConfirmed = s.mtbResult==='Detected' || s.mtbResult==='Detected very low' || (combined && combined!=='-' && combined!=='Neg');
    let detail = 'AFB: '+combined;
    if (molecLabel) detail += ' | '+molecLabel+': '+(s.mtbResult||s.genexpert||'-');
    if (s.rifResult) detail += ' | RIF: '+s.rifResult;
    if (s.inhResult) detail += ' | INH: '+s.inhResult;
    if (s.igraResult) detail += ' | IGRA: '+s.igraResult+(s.igraNote?' ('+s.igraNote+')':'');
    raw.push({ type:'sputum', date:s.date, label:'Diagnosis '+s.tp, detail, tbConfirmed: isTBConfirmed });

    // IGRA event if present
    if (s.igraResult) {
      const igraType = s.igraResult==='Positive'?'alert-high':s.igraResult==='Negative'?'alert-good':'alert-warn';
      raw.push({ type:igraType, date:s.date, label:'IGRA: '+s.igraResult, detail:(s.igraNote||'')+(s.igraDate?' วันที่ '+s.igraDate:'') });
    }

    // Extra labs per specimen
    if (s.extraLabsPerSpecimen) {
      Object.entries(s.extraLabsPerSpecimen).forEach(([specType, labs])=>{
        const hasData = labs && Object.values(labs).some(v=>v!==undefined&&v!=='');
        if (!hasData) return;
        const labStr = Object.entries(labs).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>k+': '+v).join(' | ');
        raw.push({ type:'lab', date:s.date, label:'Lab '+specType+' ('+s.tp+')', detail:labStr });
      });
    }

    // Resistance alert
    const isRes = hasResistance && hasResistance([s]);
    if (isRes) raw.push({ type:'alert-high', date:s.date, label:'⚠ พบเชื้อดื้อยา — '+[s.rifResult==='RIF resistant'?'RIF resistant':'',s.inhResult==='INH resistant'?'INH resistant':''].filter(Boolean).join(', '), detail:'ตรวจสอบสูตรยาและปรึกษาผู้เชี่ยวช��ญ MDR-TB' });

    // Delayed conversion
    if (delayedConv && s.tp === 'M2') raw.push({ type:'alert-warn', date:s.date, label:'⚡ Delayed Sputum Conversion (M2 ยังบวก)', detail:'ประเมิน adherence และพิจารณาทบทวนสูตรยา' });

    // Successful conversion
    if (!isAfbPositive(s) && s.tp !== 'M0') {
      if (convInfo.converted && convInfo.tp === s.tp)
        raw.push({ type:'alert-good', date:s.date, label:'✓ Sputum Conversion ('+s.tp+')', detail:'ผลเสมหะกลับมาเป็นลบ' });
    }
  });

  // DOT missed
  detectDotMisses(patient.dot||{}).forEach(m => {
    raw.push({ type:'alert-miss', date:m.date, label:'❌ ขาดยา '+m.streak+' วันติดต่อกัน', detail:'ตรวจสอบสาเหตุ — เริ่มจากวันที่ '+m.date });
  });

  // visits
  (patient.visits||[]).forEach(v => raw.push({ type:'visit', date:v.date, id:v.id, label:'Visit', vitals:v.vitals, weight:v.weight, note:v.note, adrNoted:v.adrNoted||[], labQuick:v.labQuick }));

  // group by date (newest first)
  const groups = {};
  raw.forEach(e => { if (!groups[e.date]) groups[e.date] = []; groups[e.date].push(e); });
  return Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]));
}

// ─── CONFIRM MODAL ───────────────────────────────────────────────────────────
// ConfirmModal ย้ายไป parts/shared.jsx (เฟส 1c)

// ─── VISIT FORM ───────────────────────────────────────────────────────────────
const EMPTY_VISIT = () => ({
  date: new Date().toISOString().split('T')[0],
  weight: '', vitals: {bp:'',hr:'',rr:'',temp:'',o2:''},
  drugDoses: '', note: '',
  consult: {type:'', note:''}, drp: [], adrNoted: [],
  addLab: false,
  labData: { lft:{}, cbc:{}, renal:{} },
  addSputum: false,
  sputumQuick: {tp:'', result:'', scantyCount:'', genexpert:'', genexpertRif:''},
  outcomeType: '', outcomeEndDate: '', outcomeNote: '',
});

// Helper: lab value color class

function VisitForm({ initial, onSave, onCancel, patient }) {
  const [v, setV] = useState(initial || EMPTY_VISIT());
  const effectiveLAB_GROUPS = (patient?._labGroups) || LAB_GROUPS || [];
  const sf = (k,val) => setV(f=>({...f,[k]:val}));
  const sv = (k,val) => setV(f=>({...f,vitals:{...f.vitals,[k]:val}}));
  const sLab = (grp,k,val) => setV(f=>({...f,labData:{...f.labData,[grp]:{...(f.labData[grp]||{}),[k]:val}}}));
  const sSp = (k,val) => setV(f=>({...f,sputumQuick:{...(f.sputumQuick||{}),[k]:val}}));
  const sCo = (k,val) => setV(f=>({...f,consult:{...f.consult,[k]:val}}));
  const addDrp = () => setV(f=>({...f,drp:[...(f.drp||[]),{type:'',note:''}]}));
  const setDrp = (i,k,val) => setV(f=>{const d=[...(f.drp||[])];d[i]={...d[i],[k]:val};return{...f,drp:d};});
  const rmDrp = i => setV(f=>({...f,drp:(f.drp||[]).filter((_,j)=>j!==i)}));
  const toggleAdr = k => setV(f=>({...f,adrNoted:f.adrNoted.includes(k)?f.adrNoted.filter(x=>x!==k):[...f.adrNoted,k]}));
  const [labTab, setLabTab] = useState('lft');

  const autoFillDoses = () => {
    // Try to get latest drug doses from previous visits first
    const visitDoses = (patient.visits||[]).filter(v=>v.drugDoses).sort((a,b)=>b.date.localeCompare(a.date));
    if(visitDoses.length > 0) {
      sf('drugDoses', visitDoses[0].drugDoses);
    } else {
      // Fallback: calculate from weight
      const doses = calcDoses(patient.weight, patient.regimen, patient.customDoses);
      sf('drugDoses', doses.map(d=>d.key+(d.tabs*d.strength)).join(' ')+((patient.comorbidities||[]).join(' ').includes('DM')?' B6-50':''));
    }
  };

  const inp = 'w-full p-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-teal-300 bg-white';

  return (
    <div className="bg-white border-2 border-teal-300 rounded-2xl overflow-hidden tb-fade">
      <div className="bg-teal-700 px-4 py-2.5 flex justify-between items-center">
        <h4 className="font-bold text-white text-sm"><i className="fa-solid fa-pen-to-square mr-2"></i>บันทึก Visit</h4>
        <button type="button" onClick={onCancel} className="text-teal-200 hover:text-white text-lg"><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">

        {/* Row: Date + BW + Vitals */}
        <div className="bg-slate-50 border border-gray-100 rounded-xl p-3">
          <div className="grid grid-cols-[120px_70px_1fr] gap-3 items-end">
            <div><label className="text-xs text-gray-500 font-bold block mb-1">วันที่</label><input type="date" value={v.date} onChange={e=>sf('date',e.target.value)} className={inp+' text-left px-2'}/></div>
            <div><label className="text-xs text-gray-500 font-bold block mb-1 text-center">BW (kg)</label><input type="number" value={v.weight} onChange={e=>sf('weight',e.target.value)} className={inp+' text-center font-bold'}/></div>
            <div>
              <label className="text-xs text-gray-500 font-bold block mb-1">Vital Signs</label>
              <div className="grid grid-cols-5 gap-1">
                {[['bp','BP'],['hr','HR'],['rr','RR'],['temp','T°C'],['o2','O2%']].map(([k,l])=>(
                  <div key={k}><p className="text-xs text-gray-400 text-center mb-0.5">{l}</p><input value={v.vitals[k]} onChange={e=>sv(k,e.target.value)} className={inp+' text-center'}/></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drug doses */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-gray-600">ขนาดยา TB</label>
            <button type="button" onClick={autoFillDoses} className="text-xs text-teal-600 hover:text-teal-800 font-bold"><i className="fa-solid fa-wand-magic-sparkles mr-1"></i>Auto-fill</button>
          </div>
          <input value={v.drugDoses} onChange={e=>sf('drugDoses',e.target.value)} placeholder="H300 R450 Z1000 E800 B6-50" className={inp+' font-mono text-sm'}/>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">SOAP / Note</label>
          <textarea value={v.note} onChange={e=>sf('note',e.target.value)} rows={5}
            placeholder={"S: อาการ...\nO: ผลตรวจ...\n>>> CXR: ...\nA: การประเมิน...\nP: แผน..."}
            className="w-full p-3 border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-teal-300 resize-none bg-white leading-relaxed font-mono"/>
        </div>

        {/* Consult */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <label className="text-xs font-bold text-amber-800 block mb-2"><i className="fa-solid fa-comments mr-1"></i>Consultation</label>
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <select value={v.consult.type} onChange={e=>sCo('type',e.target.value)} className={inp.replace('border-gray-200','border-amber-200')}>
              <option value="">-- ไม่มี --</option>
              {(CONSULT_TYPES||[]).map(t=><option key={t}>{t}</option>)}
            </select>
            <input value={v.consult.note} onChange={e=>sCo('note',e.target.value)} placeholder="รายละเอียด..." className={inp.replace('border-gray-200','border-amber-200')}/>
          </div>
        </div>

        {/* DRP */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-red-800"><i className="fa-solid fa-exclamation-circle mr-1"></i>DRP</label>
            <button type="button" onClick={addDrp} className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-red-700"><i className="fa-solid fa-plus mr-1"></i>เพิ่ม</button>
          </div>
          {(v.drp||[]).length===0?<p className="text-xs text-red-300 text-center py-1">ไม่มี DRP</p>:(
            <div className="space-y-1.5">{(v.drp||[]).map((d,i)=>(
              <div key={i} className="grid grid-cols-[1fr_2fr_20px] gap-1.5 items-center">
                <select value={d.type} onChange={e=>setDrp(i,'type',e.target.value)} className={inp}><option value="">-- Code --</option>{(DRP_TYPES||[]).map(t=><option key={t.code} value={t.code}>{t.label}</option>)}</select>
                <input value={d.note} onChange={e=>setDrp(i,'note',e.target.value)} placeholder="รายละเอียด..." className={inp}/>
                <button type="button" onClick={()=>rmDrp(i)} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-xmark"></i></button>
              </div>
            ))}</div>
          )}
        </div>

        {/* Lab */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-bold text-gray-600">ผล Lab</label>
            <label className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer">
              <input type="checkbox" checked={v.addLab} onChange={e=>sf('addLab',e.target.checked)} className="accent-blue-600"/>เพิ่มผล Lab
            </label>
          </div>
          {v.addLab&&(
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 tb-fade">
              <div className="flex gap-1 mb-3">
                {(effectiveLAB_GROUPS).map(g=>(
                  <button key={g.id} type="button" onClick={()=>setLabTab(g.id)}
                    className={'px-3 py-1 rounded-lg text-xs font-bold transition-all '+(labTab===g.id?'bg-blue-600 text-white':'bg-white text-gray-500 hover:bg-blue-100')}>
                    {g.label}
                  </button>
                ))}
              </div>
              {(effectiveLAB_GROUPS).filter(g=>g.id===labTab).map(grp=>(
                <div key={grp.id} className="grid grid-cols-4 gap-2">
                  {grp.fields.map(f=>{
                    const val=(v.labData[grp.id]||{})[f.key]||'';
                    const st=val?getLabStatus(val,f):'empty';
                    const stCls=LAB_STATUS_STYLE[st]||'';
                    const bdrColor=st==='critical'||st==='low-bad'?'#fca5a5':st==='high'?'#fcd34d':st==='normal'?'#86efac':'#e5e7eb';
                    return(
                      <div key={f.key}>
                        <label className="text-xs text-gray-500 block mb-0.5 text-center">{f.label}</label>
                        <input type="number" step="0.01" value={val} onChange={e=>sLab(grp.id,f.key,e.target.value)}
                          className={'w-full p-1.5 border rounded-lg text-xs text-center outline-none focus:ring-1 focus:ring-blue-300 bg-white '+stCls}
                          style={{borderColor:bdrColor}}/>
                        <p className="text-xs text-gray-300 text-center mt-0.5">{f.lo}–{f.hi} {f.unit}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sputum */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs font-bold text-gray-600">ผลเสมหะ</label>
            <label className="flex items-center gap-1 text-xs text-cyan-600 cursor-pointer">
              <input type="checkbox" checked={v.addSputum||false} onChange={e=>sf('addSputum',e.target.checked)} className="accent-cyan-600"/>เพิ่มผลเสมหะ
            </label>
          </div>
          {v.addSputum&&(
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 tb-fade space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs text-gray-500 block mb-0.5">Timepoint</label><input value={(v.sputumQuick||{}).tp||''} onChange={e=>sSp('tp',e.target.value)} placeholder="M2" className={inp}/></div>
                <div><label className="text-xs text-gray-500 block mb-0.5">AFB Result</label>
                  <select value={(v.sputumQuick||{}).result||''} onChange={e=>sSp('result',e.target.value)} className={inp}>
                    <option value="">--</option><option>Neg</option><option>Scanty</option><option>1+</option><option>2+</option><option>3+</option>
                  </select>
                </div>
                {(v.sputumQuick||{}).result==='Scanty'&&<div className="tb-fade"><label className="text-xs text-gray-500 block mb-0.5">Scanty count</label><input value={(v.sputumQuick||{}).scantyCount||''} onChange={e=>sSp('scantyCount',e.target.value)} placeholder="1-2/100F" className={inp+' font-mono'}/></div>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-gray-500 block mb-0.5">GeneXpert / PCR-MTB</label>
                  <select value={(v.sputumQuick||{}).genexpert||''} onChange={e=>sSp('genexpert',e.target.value)} className={inp}>
                    <option value="">-- ไม่ได้ตรวจ --</option><option value="Detected">MTB Detected</option><option value="Not Detected">MTB Not Detected</option><option value="Invalid">Invalid</option><option value="Error">Error</option>
                  </select>
                </div>
                {(v.sputumQuick||{}).genexpert==='Detected'&&<div className="tb-fade"><label className="text-xs text-gray-500 block mb-0.5">RIF Resistance</label>
                  <select value={(v.sputumQuick||{}).genexpertRif||''} onChange={e=>sSp('genexpertRif',e.target.value)} className={inp}>
                    <option value="">--</option><option value="Sensitive">RIF Sensitive</option><option value="Resistant">RIF Resistant</option><option value="Indeterminate">Indeterminate</option>
                  </select>
                </div>}
              </div>
            </div>
          )}
        </div>

        {/* ADR */}
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1.5">ADR ใน Visit นี้</label>
          <div className="flex flex-wrap gap-1.5">
            {ADR_LIST.map(a=>(
              <button key={a.key} type="button" onClick={()=>toggleAdr(a.key)}
                className={'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all '+(v.adrNoted.includes(a.key)?'bg-red-500 border-red-500 text-white':'border-gray-200 text-gray-500 hover:border-red-300')}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Treatment Outcome */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
          <label className="text-xs font-bold text-teal-700 block mb-1"><i className="fa-solid fa-flag-checkered mr-1.5"></i>ผลการรักษา (Treatment Outcome)</label>
          <p className="text-xs text-teal-600/70 mb-2">บันทึกเมื่อพร้อมปิดเคส — หากยังไม่มีผลให้ว่างไว้</p>
          <select value={v.outcomeType||''} onChange={e=>sf('outcomeType',e.target.value)} className={inp+' mb-2'}>
            <option value="">— ยังไม่ระบุผลการรักษา —</option>
            {(window.OUTCOME_TYPES||[]).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {v.outcomeType && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                <label className="text-xs text-teal-600 font-semibold whitespace-nowrap">วันที่ครบ:</label>
                <input type="date" value={v.outcomeEndDate||''} onChange={e=>sf('outcomeEndDate',e.target.value)} className={inp}/>
              </div>
              <input placeholder="หมายเหตุ (ไม่บังคับ)" value={v.outcomeNote||''} onChange={e=>sf('outcomeNote',e.target.value)} className={inp}/>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">ยกเลิก</button>
        <button type="button" onClick={()=>onSave(v)} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold"><i className="fa-solid fa-save mr-2"></i>บันทึก Visit</button>
      </div>
    </div>
  );
}


const TL_ICONS = { start:'fa-flag', regimen:'fa-pills', lab:'fa-flask', sputum:'fa-microscope', visit:'fa-user-doctor', 'alert-high':'fa-triangle-exclamation', 'alert-warn':'fa-circle-exclamation', 'alert-good':'fa-check-circle', 'alert-miss':'fa-calendar-xmark' };
const TL_COLORS = { start:'bg-teal-500', regimen:'bg-purple-500', lab:'bg-blue-500', sputum:'bg-cyan-500', visit:'bg-slate-500', 'alert-high':'bg-red-500', 'alert-warn':'bg-amber-500', 'alert-good':'bg-green-500', 'alert-miss':'bg-orange-500' };
const TL_BORDER = { start:'border-teal-200 bg-teal-50', regimen:'border-purple-200 bg-purple-50', lab:'border-blue-200 bg-blue-50', sputum:'border-cyan-200 bg-cyan-50', visit:'border-gray-200 bg-white', 'alert-high':'border-red-200 bg-red-50', 'alert-warn':'border-amber-200 bg-amber-50', 'alert-good':'border-green-200 bg-green-50', 'alert-miss':'border-orange-200 bg-orange-50' };

function TimelineTab({ patient, onUpdate, settings, locked }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null); // visitId to delete

  const groups = buildGroupedTimeline(patient);

  const filteredGroups = groups.map(([date, events]) => [date, events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'visit') return e.type === 'visit';
    if (filter === 'lab') return e.type === 'lab' || e.type.startsWith('alert');
    if (filter === 'alert') return e.type.startsWith('alert');
    if (filter === 'sputum') return e.type === 'sputum';
    if (filter === 'regimen') return e.type === 'regimen' || e.type === 'start';
    return true;
  })]).filter(([,evs]) => evs.length > 0);

  const saveVisit = (v) => {
    const newVisit = {
      id: editId || ('v' + Date.now()),
      date: v.date, weight: +v.weight || patient.weight,
      vitals: v.vitals || {}, note: v.note,
      drugDoses: v.drugDoses || '',
      consult: v.consult, drp: v.drp || [],
      adrNoted: v.adrNoted || [],
      labData: v.labData || {}, sputumQuick: v.sputumQuick || {},
      type: 'visit'
    };
    let visits = [...(patient.visits || [])];
    if (editId) { visits = visits.map(x => x.id === editId ? newVisit : x); }
    else { visits = [...visits, newVisit]; }

    // Sync → Labs tab (from labData)
    let labs = [...patient.labs];
    if (v.addLab && v.labData) {
      const tp = 'V-' + v.date.substring(5);
      const existing = labs.findIndex(l => l.date === v.date && l.tp === tp);
      const lft = v.labData.lft || {}; const renal = v.labData.renal || {};
      const entry = {
        tp, date: v.date,
        alt: +lft.alt||0, ast: +lft.ast||0, alp: +lft.alp||0,
        tbili: +lft.tbili||0, dbili: +lft.dbili||0, alb: +lft.alb||0,
        scr: +renal.scr||0, bun: +renal.bun||0, ua: +renal.ua||0,
        hbsag: '', hcv: '',
        cbc: v.labData.cbc || {}
      };
      if (existing >= 0) labs[existing] = entry; else labs = [...labs, entry];
    }

    // Sync → Sputum tab
    let sputum = [...patient.sputum];
    if (v.addSputum && v.sputumQuick?.tp && v.sputumQuick?.result) {
      const sq = v.sputumQuick;
      const existing = sputum.findIndex(s => s.tp === sq.tp);
      const entry = { tp: sq.tp, result: sq.result, date: v.date,
        scantyCount: sq.scantyCount || '', genexpert: sq.genexpert || '', genexpertRif: sq.genexpertRif || '' };
      if (existing >= 0) sputum[existing] = entry; else sputum = [...sputum, entry];
    }

    // Sync → ADR tab
    let adr = migrateAdr(patient.adr);
    (v.adrNoted || []).forEach(k => {
      if (!adr[k]) adr[k] = { checked: true, note: 'บันทึก ' + v.date };
      else adr[k] = { ...adr[k], checked: true };
    });

    const newStatus = labs.some(l => l.alt > 120) ? 'critical' : patient.status;
    const outcome = v.outcomeType
      ? { type: v.outcomeType, date: v.date, endDate: v.outcomeEndDate || '', note: v.outcomeNote || '' }
      : (patient.outcome || null);
    onUpdate({ ...patient, visits, labs, sputum, adr, status: newStatus, weight: +v.weight || patient.weight, outcome });
    setShowForm(false); setEditId(null);
  };

  const deleteVisit = (id) => { onUpdate({ ...patient, visits: (patient.visits||[]).filter(v => v.id !== id) }); setConfirmDelete(null); };

  const formRef = useRef(null);
  const editVisit = (v) => {
    setEditId(v.id); setShowForm(true);
    // scroll to form after render
    setTimeout(()=>{ if(formRef.current) formRef.current.scrollIntoView({block:'nearest',behavior:'smooth'}); },100);
  };
  const editInitial = editId ? (patient.visits||[]).find(v => v.id === editId) : null;
  const editInitialForm = editInitial ? {
    date: editInitial.date || new Date().toISOString().split('T')[0],
    weight: editInitial.weight || '',
    vitals: editInitial.vitals || {bp:'',hr:'',rr:'',temp:'',o2:''},
    drugDoses: editInitial.drugDoses || '',
    note: editInitial.note || '',
    consult: editInitial.consult || {type:'',note:''},
    drp: editInitial.drp || [],
    adrNoted: editInitial.adrNoted || [],
    labData: editInitial.labData || {lft:{},cbc:{},renal:{}},
    sputumQuick: editInitial.sputumQuick || {tp:'',result:'',scantyCount:'',genexpert:'',genexpertRif:''},
    addLab: false,
    addSputum: false,
    outcomeType: editInitial.outcome?.type || '',
    outcomeEndDate: editInitial.outcome?.endDate || '',
    outcomeNote: editInitial.outcome?.note || '',
  } : null;

  const FILTERS = [['all','ทั้งหมด'],['visit','Visit'],['lab','Lab'],['sputum','เสมหะ'],['alert','Alert'],['regimen','สูตรยา']];

  return (
    <div className="space-y-4 tb-fade">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-timeline mr-2 text-teal-600"></i>Timeline การรักษา</h3>
        <button type="button" onClick={() => { if(!locked){setEditId(null); setShowForm(!showForm);} }}
          disabled={locked}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}>
          <i className="fa-solid fa-plus mr-1"></i>บันทึก Visit
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(([val, lbl]) => (
          <button key={val} type="button" onClick={() => setFilter(val)}
            className={'px-3 py-1.5 rounded-full text-xs font-bold border transition-all '+(filter===val?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-500 hover:border-teal-300')}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && <ConfirmModal message="ยืนยันการลบ Visit นี้" onConfirm={()=>deleteVisit(confirmDelete)} onCancel={()=>setConfirmDelete(null)}/>}
      <div ref={formRef}>{showForm && !locked && <VisitForm key={editId||'new'} initial={editInitialForm} onSave={saveVisit} onCancel={() => { setShowForm(false); setEditId(null); }} patient={{...patient,_labGroups:(settings?.labGroups)||LAB_GROUPS}}/>}</div>

      {/* Timeline */}
      {filteredGroups.length === 0 ? (
        <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="relative space-y-4">
          {/* vertical line */}
          <div className="absolute left-[88px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-300 via-gray-200 to-transparent pointer-events-none"></div>
          {filteredGroups.map(([date, events]) => (
            <div key={date} className="flex gap-4 relative">
              {/* Date badge (left) */}
              <div className="flex-shrink-0 w-24 text-right pt-3">
                <div className="bg-teal-700 text-white rounded-xl px-2 py-1.5 inline-block text-center shadow-sm">
                  <p className="text-xs font-bold leading-none">{date.substring(5).replace('-','/')}</p>
                  <p className="text-xs opacity-70 mt-0.5">{date.substring(0,4)}</p>
                </div>
              </div>

              {/* Events card */}
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {events.map((e, ei) => {
                  const isTBConfirmed = e.type==='sputum' && e.tbConfirmed;
                  return (
                  <div key={ei} className={'border-b border-gray-100 last:border-b-0 px-4 py-3 '+(isTBConfirmed?'bg-red-50 border-l-4 border-l-red-500':e.type.startsWith('alert-high')?'bg-red-50':e.type.startsWith('alert-warn')?'bg-amber-50/50':e.type.startsWith('alert-good')?'bg-green-50/50':e.type.startsWith('alert-miss')?'bg-orange-50/50':'')}>
                    <div className="flex items-start gap-3">
                      <div className={'rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-0.5 '+(isTBConfirmed?'w-9 h-9 text-sm bg-red-600':'w-7 h-7 text-xs '+(TL_COLORS[e.type]||'bg-gray-400'))}>
                        <i className={'fa-solid '+(TL_ICONS[e.type]||'fa-circle')}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={isTBConfirmed?'font-black text-base text-red-700':'font-bold text-sm text-gray-800'}>{e.label}{isTBConfirmed&&<span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">TB Confirmed</span>}</p>
                          {e.type === 'visit' && (
                            <div className="flex gap-1 flex-shrink-0">
                              <button type="button" onClick={() => editVisit(e)} className="text-gray-400 hover:text-teal-600 text-xs p-1 transition-colors" title="แก้ไข"><i className="fa-solid fa-pen"></i></button>
                              <button type="button" onClick={() => setConfirmDelete(e.id)} className="text-gray-400 hover:text-red-500 text-xs p-1 transition-colors" title="ลบ"><i className="fa-solid fa-trash"></i></button>
                            </div>
                          )}
                        </div>
                        {/* Vitals row */}
                        {e.vitals && Object.values(e.vitals).some(v=>v) && (
                          <div className="flex gap-3 mt-1 flex-wrap">
                            {e.vitals.bp&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">BP {e.vitals.bp}</span>}
                            {e.vitals.hr&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">HR {e.vitals.hr}</span>}
                            {e.vitals.rr&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">RR {e.vitals.rr}</span>}
                            {e.vitals.temp&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">T {e.vitals.temp}°C</span>}
                            {e.vitals.o2&&<span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">O2 {e.vitals.o2}%</span>}
                            {e.weight&&<span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded font-mono font-bold">BW {e.weight} kg</span>}
                          </div>
                        )}
                        {/* Note */}
                        {e.note && <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed mt-1.5 font-mono">{e.note}</p>}
                        {/* Drug doses */}
                        {e.drugDoses && <p className="text-xs mt-1.5 font-mono bg-teal-50 text-teal-800 px-2 py-1 rounded-lg inline-block"><i className="fa-solid fa-pills mr-1"></i>{e.drugDoses}</p>}
                        {/* Consult */}
                        {e.consult?.type && <div className="mt-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg"><p className="text-xs font-bold text-amber-700"><i className="fa-solid fa-comments mr-1"></i>Consult: {e.consult.type}</p>{e.consult.note&&<p className="text-xs text-amber-600 mt-0.5">{e.consult.note}</p>}</div>}
                        {/* DRP */}
                        {e.drp&&e.drp.length>0&&<div className="mt-1.5 space-y-1">{e.drp.map((d,di)=><div key={di} className="bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg"><p className="text-xs font-bold text-red-700"><i className="fa-solid fa-circle-exclamation mr-1"></i>DRP {d.type}: {d.note}</p></div>)}</div>}
                        {/* Detail (non-visit) */}
                        {!e.note && e.detail && <p className="text-xs text-gray-600 mt-0.5">{e.detail}</p>}
                        {/* ADR noted */}
                        {e.adrNoted && e.adrNoted.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {e.adrNoted.map(k => { const a = ADR_LIST.find(x=>x.key===k); return a ? <span key={k} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-semibold">{a.label}</span> : null; })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DIAGNOSIS (SPUTUM) TAB ───────────────────────────────────────────────────

// Timepoint options: Diag(M0), M1-M18

export { TimelineTab }
