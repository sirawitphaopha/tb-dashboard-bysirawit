'use client'
/** patient-modal/meds.jsx — MedsTab (ยา) + HOSP_STRENGTHS + dead DrugInteractionPanel (แยกรอบ 3) */
import * as React from 'react'
const { useState } = React
import { FormSection, FieldError, RangeStatus, Badge } from '../shared'
import { calcDoses, DRUG_RANGES, DEFAULT_DRUGS } from '../globals'

const HOSP_STRENGTHS = {
  R:  [{label:'R300',value:300},{label:'R450',value:450}],
  H:  [{label:'I100',value:100},{label:'Iso Syrup 50mg/ml',value:'syrup'}],
  Z:  [{label:'Z500',value:500}],
  E:  [{label:'E400',value:400},{label:'E500',value:500}],
  Lfx:[{label:'Lfx 250',value:250},{label:'Lfx 500',value:500},{label:'Lfx 750',value:750}],
  Am: [{label:'Am 250',value:250},{label:'Am 500',value:500}],
};

// FormSection, FieldError, RangeStatus, Badge ย้ายไป parts/shared.jsx (เฟส 1b)


function DrugInteractionPanel({patient}){
  const ix=[];const c=(patient.comorbidities||[]).join(' ');
  const drugs=(patient.concomitantDrugs||[]).join(' ');
  if(c.includes('HIV'))ix.push({s:'high',drug:'Rifampicin + ARV',effect:'Rifampicin เหนี่ยวนำ CYP3A4 ลดระดับ ARV',rec:'ปรึกษา HIV specialist — พิจารณา Efavirenz-based regimen'});
  if(c.includes('DM'))ix.push({s:'medium',drug:'Isoniazid + OHA/Insulin',effect:'INH รบกวนควบคุมน้ำตาล + เพิ่มเสี่ยง Neuropathy',rec:'Monitor FBS ทุกเดือน เสริม B6 50mg/day'});
  if(c.includes('HT'))ix.push({s:'medium',drug:'Rifampicin + CCB',effect:'Rifampicin ลดระดับ CCB อย่างมีนัยสำคัญ',rec:'Monitor BP ใกล้ชิด อาจต้องเพิ่มขนาด CCB'});
  if(c.includes('CKD'))ix.push({s:'high',drug:'Ethambutol + CKD',effect:'EMB สะสมในไต เพิ่มเสี่ยง Optic Neuritis',rec:'ปรับขนาด EMB ตาม eGFR หรือตัดออกถ้า <30'});
  if(c.includes('ตับแข็ง')||c.includes('Cirrhosis'))ix.push({s:'high',drug:'INH/RIF + Cirrhosis',effect:'เสี่ยง Hepatotoxicity สูงมาก',rec:'Monitor LFT ทุก 2 สัปดาห์ ปรึกษา ID'});
  if(drugs.includes('Warfarin'))ix.push({s:'high',drug:'Rifampicin + Warfarin',effect:'Rifampicin เหนี่ยวนำ CYP2C9 ลด INR อย่างมาก เสี่ยงลิ่มเลือด',rec:'Monitor INR ทุกสัปดาห์ อาจต้องเพิ่มขนาด Warfarin 2-5 เท่า'});
  if(drugs.includes('Phenytoin'))ix.push({s:'high',drug:'Rifampicin + Phenytoin',effect:'Rifampicin ลดระดับ Phenytoin อย่างมีนัยสำคัญ',rec:'Monitor ระดับยา Phenytoin และอาการชัก'});
  if(drugs.includes('Methadone'))ix.push({s:'high',drug:'Rifampicin + Methadone',effect:'Rifampicin ลดระดับ Methadone — เสี่ยง withdrawal',rec:'พิจารณาเพิ่มขนาด Methadone ปรึกษาแพทย์'});
  if(ix.length===0)return<div className="bg-green-50 border border-green-200 p-4 rounded-2xl"><p className="text-green-700 font-bold text-sm"><i className="fa-solid fa-check-circle mr-2"></i>ไม่พบ Drug Interaction ที่มีนัยสำคัญ</p></div>;
  const co={high:'bg-red-50 border-red-200 text-red-700',medium:'bg-amber-50 border-amber-200 text-amber-700'};
  return<div className="space-y-3">{ix.map((item,i)=><div key={i} className={'p-4 rounded-xl border '+co[item.s]}><p className="font-bold text-sm mb-1"><i className={'fa-solid '+(item.s==='high'?'fa-triangle-exclamation':'fa-circle-exclamation')+' mr-2'}></i>{item.drug}</p><p className="text-xs text-gray-600 mb-1">{item.effect}</p><p className="text-xs font-semibold text-gray-700">💊 {item.rec}</p></div>)}</div>;
}


function MedsTab({patient,onUpdate,settings,locked}){
  const [editDoses,setEditDoses]=useState(false);
  const [customDoses,setCustomDoses]=useState(patient.customDoses||{});
  const [customStrengths,setCustomStrengths]=useState(patient.drugStrengths||{});
  const [extraTbDrugs,setExtraTbDrugs]=useState(patient.extraTbDrugs||[]);
  const [newExtraKey,setNewExtraKey]=useState('Lfx');
  const [newDrugName,setNewDrugName]=useState('');
  const [newDrugDose,setNewDrugDose]=useState('');
  const [newDrugRoute,setNewDrugRoute]=useState('');
  const drugList=(settings?.drugs)||DEFAULT_DRUGS||[];

  // Dose history from visits
  const doseHistory=(patient.visits||[]).filter(v=>v.drugDoses).map(v=>({date:v.date,doses:v.drugDoses})).sort((a,b)=>b.date.localeCompare(a.date));
  const doses=calcDoses(patient.weight,patient.regimen,editDoses?customDoses:patient.customDoses,editDoses?customStrengths:patient.drugStrengths);

  const saveDoses=()=>{
    onUpdate({...patient,customDoses,drugStrengths:customStrengths,extraTbDrugs});setEditDoses(false);
  };
  const resetDoses=()=>{setCustomDoses({});setCustomStrengths({});setExtraTbDrugs([]);onUpdate({...patient,customDoses:null,drugStrengths:null,extraTbDrugs:[]});setEditDoses(false);};
  const addExtraDrug=()=>{
    const d=DRUG_RANGES[newExtraKey];if(!d)return;
    const str=(HOSP_STRENGTHS[newExtraKey]||[])[0]?.value||d.strength;
    setExtraTbDrugs(prev=>[...prev,{key:newExtraKey,tabs:1,strength:str}]);
  };
  const removeExtraDrug=i=>setExtraTbDrugs(prev=>prev.filter((_,idx)=>idx!==i));

  const addDrug=()=>{
    if(!newDrugName.trim())return;
    const entry=newDrugName+(newDrugDose?' '+newDrugDose:'')+(newDrugRoute?' '+newDrugRoute:'');
    onUpdate({...patient,concomitantDrugs:[...(patient.concomitantDrugs||[]),entry]});
    setNewDrugName('');setNewDrugDose('');setNewDrugRoute('');
  };

  // Drug interactions — only show if patient has comorbidities OR concomitant drugs
  const hasConcomitant = (patient.concomitantDrugs||[]).length > 0;
  const hasComorbidity = (patient.comorbidities||[]).length > 0;
  const c=(patient.comorbidities||[]).join(' ');
  const ix=[];
  if(hasComorbidity || hasConcomitant) {
    if(c.includes('HIV'))   ix.push({s:'high',  drug:'Rifampicin + ARV',         effect:'CYP3A4 induction — ลดระดับ ARV',            rec:'ปรึกษา HIV specialist, พิจารณา Efavirenz'});
    if(c.includes('DM'))    ix.push({s:'medium', drug:'Isoniazid + OHA/Insulin',  effect:'INH รบกวนน้ำตาล + เพิ่มเสี่ยง Neuropathy', rec:'Monitor FBS เสริม B6 50mg/day'});
    if(c.includes('HT'))    ix.push({s:'medium', drug:'Rifampicin + CCB',          effect:'ลดระดับ CCB',                               rec:'Monitor BP อาจต้องเพิ่มขนาด'});
    if(c.includes('CKD'))   ix.push({s:'high',   drug:'Ethambutol + CKD',          effect:'EMB สะสม เสี่ยง Optic Neuritis',           rec:'ปรับขนาดตาม eGFR'});
    if(c.includes('ตับแข็ง')||c.includes('Cirrhosis'))ix.push({s:'high',drug:'INH/RIF + Cirrhosis',effect:'เสี่ยง Hepatotoxicity สูง',rec:'Monitor LFT ทุก 2 สัปดาห์'});
    if(c.includes('RA')||c.includes('รูมาตอยด์'))ix.push({s:'medium',drug:'Rifampicin + Methotrexate/Leflunomide',effect:'Rifampicin เหนี่ยวนำ metabolism ลดระดับยา',rec:'ติดตามความเข้มข้นยา RA'});
    if(c.includes('มะเร็ง')||c.includes('Cancer'))ix.push({s:'high',drug:'Rifampicin + Chemotherapy',effect:'Rifampicin ลดระดับยา chemo หลายตัว',rec:'ปรึกษาอายุรแพทย์มะเร็ง'});
    if(c.includes('ยากดภูมิ')||c.includes('Immunosuppressive'))ix.push({s:'high',drug:'Rifampicin + Immunosuppressants',effect:'ลดระดับ Tacrolimus, Cyclosporine, Steroid',rec:'Monitor drug level ใกล้ชิด'});
    (patient.concomitantDrugs||[]).forEach(d=>{
      if(/warfarin/i.test(d)) ix.push({s:'high',drug:'Rifampicin + Warfarin',effect:'ลด INR อย่างมาก — เสี่ยง thrombosis',rec:'Monitor INR ใกล้ชิด ปรับขนาด Warfarin'});
      if(/phenytoin/i.test(d))ix.push({s:'high',drug:'Rifampicin + Phenytoin',effect:'ลดระดับ Phenytoin — เสี่ยง seizure',rec:'Monitor drug level'});
      if(/fluconazole|itraconazole|voriconazole/i.test(d))ix.push({s:'high',drug:'Rifampicin + Azole antifungal',effect:'ลดระดับ Azole อย่างมาก',rec:'หลีกเลี่ยงการใช้ร่วม หรือเพิ่มขนาด Azole'});
      if(/methadone/i.test(d))ix.push({s:'high',drug:'Rifampicin + Methadone',effect:'ลดระดับ Methadone — เสี่ยง withdrawal',rec:'เพิ่มขนาด Methadone ติดตามอาการ'});
      if(/oral contraceptive|ยาเม็ดคุมกำเนิด/i.test(d))ix.push({s:'medium',drug:'Rifampicin + OCP',effect:'ลดประสิทธิภาพยาคุมกำเนิด',rec:'ใช้การคุมกำเนิดวิธีอื่นร่วมด้วย'});
    });
    // Custom interactions from settings
    (settings?.customDrugInteractions||[]).forEach(ci=>{
      const matchComorbidity = ci.triggerComorbidity && c.toLowerCase().includes(ci.triggerComorbidity.toLowerCase());
      const matchDrug = ci.triggerDrug && (patient.concomitantDrugs||[]).some(d=>d.toLowerCase().includes(ci.triggerDrug.toLowerCase()));
      if (matchComorbidity || matchDrug || (!ci.triggerComorbidity && !ci.triggerDrug)) {
        ix.push({s:ci.severity||'medium', drug:ci.drug, effect:ci.effect, rec:ci.rec});
      }
    });
  }

  return(
    <div className="space-y-5 tb-fade">
      {/* Interaction alert */}
      {(!hasComorbidity && !hasConcomitant) ? (
        <div className="bg-slate-50 border border-gray-200 p-3 rounded-2xl text-xs text-gray-400 flex items-center gap-2">
          <i className="fa-solid fa-circle-info text-gray-300"></i>
          <span>ยังไม่มีรายการยาโรคร่วม — เพิ่มยาโรคร่วมด้านล่างเพื่อตรวจสอบ Drug Interaction</span>
        </div>
      ) : ix.length>0?(
        <div className={'p-4 rounded-2xl border-2 '+(ix.some(i=>i.s==='high')?'border-red-300 bg-red-50':'border-amber-300 bg-amber-50')}>
          <p className={'font-bold text-sm mb-2 '+(ix.some(i=>i.s==='high')?'text-red-800':'text-amber-800')}><i className="fa-solid fa-triangle-exclamation mr-2"></i>Drug Interaction ({ix.length})</p>
          <div className="space-y-2">{ix.map((item,i)=>(
            <div key={i} className={'p-3 rounded-xl border '+(item.s==='high'?'bg-red-50 border-red-200':'bg-amber-50 border-amber-200')}>
              <p className={'font-bold text-xs mb-0.5 '+(item.s==='high'?'text-red-700':'text-amber-700')}>{item.drug}</p>
              <p className="text-xs text-gray-600">{item.effect}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">💊 {item.rec}</p>
            </div>
          ))}</div>
        </div>
      ) : <div className="bg-green-50 border border-green-200 p-3 rounded-2xl text-xs text-green-700 font-semibold"><i className="fa-solid fa-check-circle mr-2"></i>ไม่พบ Drug Interaction ที่มีนัยสำคัญ</div>}

      {/* TB Drug table + inline edit */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-prescription-bottle-medical mr-2 text-teal-600"></i>ยา TB ปัจจุบัน</h3>
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 px-3 py-1 text-xs font-mono rounded">{patient.regimen}</span>
            {editDoses?(
              <div className="flex gap-1.5">
                <button type="button" onClick={resetDoses} className="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">รีเซ็ต</button>
                <button type="button" onClick={saveDoses} className="text-xs px-2.5 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold">บันทึก</button>
              </div>
            ):(
              <button type="button" onClick={()=>{if(!locked){setCustomDoses(patient.customDoses||{});setEditDoses(true);}}} disabled={locked} className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${locked?'border border-gray-200 text-gray-300 cursor-not-allowed':'border border-gray-200 text-teal-600 hover:bg-teal-50'}`}><i className="fa-solid fa-pen mr-1"></i>แก้ไขโดส</button>
            )}
          </div>
        </div>
        <div className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-100/60 border-b text-xs text-gray-500 uppercase"><tr><th className="p-3 pl-4 text-left">ยา</th><th className="p-3 text-left">mg/kg</th><th className="p-3 text-left">จำนวน</th><th className="p-3 text-left">/เดือน</th><th className="p-3 text-left">สถานะ</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{doses.map(d=>{
            const mgkgCls='p-3 font-bold '+(d.status==='ok'?'text-green-700':d.status==='high'?'text-red-600':'text-amber-600');
            const badge=d.status==='ok'?<Badge label="เหมาะสม" color="bg-green-100 text-green-700"/>:d.status==='high'?<Badge label="สูง" color="bg-red-100 text-red-700"/>:<Badge label="ต่ำ" color="bg-amber-100 text-amber-700"/>;
            const opts=(HOSP_STRENGTHS[d.key]||[]);
            return<tr key={d.key}>
              <td className="p-3 pl-4 font-bold">
                {d.name}
                {editDoses&&opts.length>1?(
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {opts.map(o=><button key={String(o.value)} type="button" onClick={()=>setCustomStrengths(s=>({...s,[d.key]:o.value}))} className={'text-xs px-2 py-0.5 rounded-lg border font-bold transition-all '+((customStrengths[d.key]??d.strength)===o.value?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-400 hover:border-teal-300')}>{o.label}</button>)}
                  </div>
                ):<span className="text-gray-400 font-normal text-xs ml-1">({d.strength}mg)</span>}
              </td>
              <td className={mgkgCls}>{d.mgkg}</td>
              <td className="p-3">
                {editDoses?(
                  <div className="flex items-center gap-1">
                    <input type="number" min={0.5} max={12} step={0.5} value={customDoses[d.key]??d.tabs}
                      onChange={e=>setCustomDoses(c=>({...c,[d.key]:Math.max(0.5,parseFloat(e.target.value)||0.5)}))}
                      className="w-14 p-1 border-2 border-teal-300 rounded-lg text-center font-bold text-sm outline-none"/>
                    <span className="text-xs text-gray-400">tab</span>
                  </div>
                ):<span className="font-semibold">{d.tabs} tab OD ac</span>}
              </td>
              <td className="p-3 font-mono font-bold text-teal-700">{(d.tabs*30).toFixed(d.tabs%1?1:0)} tab</td>
              <td className="p-3">{badge}</td>
            </tr>;
          })}</tbody></table>
        </div>
        {patient.status==='critical'&&<div className="mt-2 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-2xl"><p className="font-bold text-red-700 text-sm"><i className="fa-solid fa-hand mr-2"></i>HOLD ยาทุกตัว — ALT &gt; 3× ULN</p></div>}

        {/* Extra TB drugs (Lfx, Am etc.) */}
        {(extraTbDrugs.length>0||editDoses)&&(
          <div className="mt-3">
            {extraTbDrugs.length>0&&(
              <table className="w-full text-sm mt-2 border border-dashed border-teal-200 rounded-xl overflow-hidden">
                <thead className="bg-teal-50 text-xs text-teal-600 uppercase"><tr><th className="p-2 pl-3 text-left">ยาเสริม</th><th className="p-2 text-left">ความแรง</th><th className="p-2 text-left">จำนวน</th><th className="p-2 text-left">/เดือน</th><th className="p-2"></th></tr></thead>
                <tbody className="divide-y divide-teal-100">{extraTbDrugs.map((ex,i)=>{
                  const d=DRUG_RANGES[ex.key]||{};
                  const w=parseFloat(patient.weight);
                  const mgkg=w>0?+((ex.tabs*ex.strength)/w).toFixed(1):'-';
                  const unit=d.unit||'tab';
                  return<tr key={i}>
                    <td className="p-2 pl-3 font-bold text-teal-700">{d.name||ex.key}</td>
                    <td className="p-2">
                      {editDoses?(
                        <div className="flex gap-1 flex-wrap">
                          {(HOSP_STRENGTHS[ex.key]||[]).map(o=><button key={String(o.value)} type="button" onClick={()=>setExtraTbDrugs(prev=>prev.map((e,j)=>j===i?{...e,strength:o.value}:e))} className={'text-xs px-2 py-0.5 rounded border font-bold '+(ex.strength===o.value?'bg-teal-600 text-white border-teal-600':'border-gray-200 text-gray-400')}>{o.label}</button>)}
                        </div>
                      ):<span className="text-xs text-gray-500">{ex.strength}mg</span>}
                    </td>
                    <td className="p-2">
                      {editDoses?(
                        <div className="flex items-center gap-1">
                          <input type="number" min={0.5} max={12} step={0.5} value={ex.tabs}
                            onChange={e=>setExtraTbDrugs(prev=>prev.map((x,j)=>j===i?{...x,tabs:Math.max(0.5,parseFloat(e.target.value)||0.5)}:x))}
                            className="w-14 p-1 border-2 border-teal-300 rounded-lg text-center font-bold text-sm outline-none"/>
                          <span className="text-xs text-gray-400">{unit}</span>
                        </div>
                      ):<span className="font-semibold text-sm">{ex.tabs} {unit} · {mgkg} mg/kg</span>}
                    </td>
                    <td className="p-2 text-xs text-teal-700 font-mono font-bold">{(ex.tabs*30).toFixed(ex.tabs%1?1:0)} {unit}</td>
                    <td className="p-2 text-right">{editDoses&&<button type="button" onClick={()=>removeExtraDrug(i)} className="text-red-400 hover:text-red-600"><i className="fa-solid fa-xmark text-xs"></i></button>}</td>
                  </tr>;
                })}</tbody>
              </table>
            )}
            {editDoses&&(
              <div className="flex items-center gap-2 mt-2">
                <select value={newExtraKey} onChange={e=>setNewExtraKey(e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                  {['Lfx','Am'].map(k=><option key={k} value={k}>{DRUG_RANGES[k]?.name||k}</option>)}
                </select>
                <button type="button" onClick={()=>{if(!locked)addExtraDrug();}} disabled={locked} className={`px-3 py-2 rounded-lg text-sm font-bold ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}><i className="fa-solid fa-plus mr-1"></i>เพิ่มยาเสริม</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dose history mini-timeline */}
      {doseHistory.length>0&&(
        <div>
          <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-clock-rotate-left mr-2 text-gray-400"></i>ประวัติขนาดยาจาก Visit</h4>
          <div className="relative space-y-2">
            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gray-200 pointer-events-none"></div>
            {doseHistory.map((h,i)=>(
              <div key={i} className="flex gap-3 items-start">
                <div className={'w-5 h-5 rounded-full flex-shrink-0 z-10 mt-0.5 flex items-center justify-center '+(i===0?'bg-teal-500':'bg-gray-300')}>
                  <i className={'fa-solid fa-pills text-white '} style={{fontSize:'7px'}}></i>
                </div>
                <div className={'flex-1 px-3 py-2 rounded-xl border text-xs '+(i===0?'bg-teal-50 border-teal-200 font-semibold':'bg-gray-50 border-gray-200')}>
                  <span className="text-gray-400 font-mono mr-2">{h.date}</span>
                  <span className={'font-mono '+(i===0?'text-teal-800':'text-gray-600')}>{h.doses}</span>
                  {i===0&&<span className="ml-2 bg-teal-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">ล่าสุด</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Concomitant drugs */}
      <div>
        <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-capsules mr-2 text-gray-400"></i>ยาโรคร่วม</h4>
        <div className="flex flex-wrap gap-2 mb-3 min-h-8">
          {(patient.concomitantDrugs||[]).length===0?<p className="text-xs text-gray-400 py-1">ยังไม่มีรายการ</p>:
          (patient.concomitantDrugs||[]).map((d,i)=>(
            <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
              {d}<button type="button" onClick={()=>onUpdate({...patient,concomitantDrugs:(patient.concomitantDrugs||[]).filter((_,j)=>j!==i)})} className="text-blue-400 hover:text-red-500 transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </span>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="grid grid-cols-[1fr_80px_90px_36px] gap-2 items-end">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">ชื่อยา</label>
              <select value={newDrugName} onChange={e=>setNewDrugName(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-blue-300">
                <option value="">-- เลือกยา --</option>
                {drugList.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">ขนาด</label><input value={newDrugDose} onChange={e=>setNewDrugDose(e.target.value)} placeholder="500mg" className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"/></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">วิธีใช้</label>
              <select value={newDrugRoute} onChange={e=>setNewDrugRoute(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-xs bg-white outline-none">
                <option value="">-</option><option>OD</option><option>BID</option><option>TID</option><option>QID</option><option>PRN</option><option>IM</option><option>SC</option><option>IV</option>
              </select>
            </div>
            <div className="flex items-end"><button type="button" onClick={addDrug} className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center transition-colors"><i className="fa-solid fa-plus text-sm"></i></button></div>
          </div>
        </div>
      </div>
    </div>
  );
}



export { MedsTab, HOSP_STRENGTHS }
