'use client'
/** patient-modal/lab.jsx — LabTab (⚠️ Chart.js กราฟตับ/ไต/uric) + dead labColor/labFlag (แยกรอบ 3) */
import * as React from 'react'
const { useState, useEffect, useRef } = React
import { calcCrCl, crClStage, LAB_GROUPS, getLabStatus, LAB_STATUS_STYLE, Chart } from '../globals'

function LabTab({patient,onUpdate,settings,locked}){
  const effectiveLAB_GROUPS = (settings?.labGroups) || LAB_GROUPS || [];
  const [showAdd,setShowAdd]=useState(false);
  const [tp,setTp]=useState('');const [date,setDate]=useState('');
  const [labData,setLabData]=useState({lft:{},cbc:{},renal:{}});
  const [hbsag,setHbsag]=useState('');const [hcv,setHcv]=useState('');
  const [inputTab,setInputTab]=useState('lft');
  const altRef=useRef(null);const uaRef=useRef(null);const scrRef=useRef(null);
  const latest=patient.labs[patient.labs.length-1]||{};
  const crcl=calcCrCl(patient.age,patient.weight,latest.scr,patient.gender);
  const crclInfo=crClStage(crcl);

  useEffect(()=>{
    if(patient.labs.length<2)return;
    const labels=patient.labs.map(l=>l.tp);const charts=[];
    if(altRef.current)charts.push(new Chart(altRef.current,{type:'line',data:{labels,datasets:[{label:'ALT',data:patient.labs.map(l=>l.alt||0),borderColor:'#ef4444',backgroundColor:'rgba(239,68,68,0.06)',fill:true,tension:0.35,pointRadius:4,pointBackgroundColor:'#ef4444'},{label:'AST',data:patient.labs.map(l=>l.ast||null),borderColor:'#f97316',backgroundColor:'transparent',tension:0.35,pointRadius:4,borderDash:[4,2]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:8,font:{size:10}}}},scales:{y:{suggestedMax:200,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}}));
    if(uaRef.current)charts.push(new Chart(uaRef.current,{type:'line',data:{labels,datasets:[{label:'Uric Acid',data:patient.labs.map(l=>l.ua||0),borderColor:'#0d9488',backgroundColor:'rgba(13,148,136,0.06)',fill:true,tension:0.35,pointRadius:4,pointBackgroundColor:'#0d9488'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:8,font:{size:10}}}},scales:{y:{suggestedMax:12,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}}));
    if(scrRef.current)charts.push(new Chart(scrRef.current,{type:'bar',data:{labels,datasets:[{label:'Scr (mg/dL)',data:patient.labs.map(l=>l.scr||0),backgroundColor:'#6366f1',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{boxWidth:8,font:{size:10}}}},scales:{y:{suggestedMax:2,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}}));
    return()=>charts.forEach(c=>c.destroy());
  },[patient.labs]);

  const addLab=()=>{
    if(!tp)return;
    const lft=labData.lft||{};const renal=labData.renal||{};
    const entry={tp,date:date||'',alt:+lft.alt||0,ast:+lft.ast||0,alp:+lft.alp||0,tbili:+lft.tbili||0,dbili:+lft.dbili||0,alb:+lft.alb||0,scr:+renal.scr||0,bun:+renal.bun||0,ua:+renal.ua||0,hbsag,hcv,cbc:labData.cbc||{}};
    const allData={...lft,...renal,...(labData.cbc||{})};
    const allFields=effectiveLAB_GROUPS.flatMap(g=>g.fields);
    const hasCritical=allFields.some(f=>f.critical&&getLabStatus(allData[f.key],f)==='critical');
    const hasAnyInput=Object.values(allData).some(v=>+v>0);
    const newStatus=hasCritical?'critical':hasAnyInput?'normal':patient.status;
    onUpdate({...patient,labs:[...patient.labs,entry],status:newStatus});
    setTp('');setDate('');setLabData({lft:{},cbc:{},renal:{}});setHbsag('');setHcv('');setShowAdd(false);
  };

  const serology=val=>{
    if(!val)return<span className="text-gray-300 text-xs">-</span>;
    const col=val==='Positive'?'bg-red-100 text-red-700':val==='Negative'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500';
    return<span className={'text-xs px-2 py-0.5 rounded-full font-bold '+col}>{val}</span>;
  };

  const altCls=v=>{ if(!v||+v===0)return''; const st=getLabStatus(v,{lo:0,hi:40,critical:120}); return LAB_STATUS_STYLE[st]||''; };

  return(
    <div className="space-y-5 tb-fade">
      {/* CrCl */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl flex-shrink-0"><i className="fa-solid fa-kidneys"></i></div>
        <div className="flex-1"><p className="text-xs font-bold text-indigo-700 mb-0.5">CrCl — Cockcroft-Gault</p><p className={'text-2xl font-black '+crclInfo.color}>{crclInfo.label} <span className="text-sm font-normal text-gray-400">mL/min</span></p><p className="text-xs text-gray-400 mt-0.5">(140-{patient.age||'?'}) × {patient.weight}kg ÷ (72 × {latest.scr||'Scr'}){patient.gender==='F'?' × 0.85':''}</p></div>
        <div className="text-right flex-shrink-0 text-xs text-gray-500"><p>อายุ: <strong>{patient.age||'-'}</strong></p><p>BW: <strong>{patient.weight}</strong> kg</p><p>Scr: <strong>{latest.scr||'-'}</strong></p></div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-flask mr-2 text-teal-600"></i>ผล Lab</h3>
        <button type="button" onClick={()=>{if(!locked)setShowAdd(!showAdd);}} disabled={locked} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}><i className="fa-solid fa-plus mr-1"></i>เพิ่มผล Lab</button>
      </div>

      {showAdd&&(
        <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl tb-fade">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-2 mb-3">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Timepoint</label><input value={tp} onChange={e=>setTp(e.target.value)} placeholder="M3" className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"/></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">วันที่</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"/></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">HBsAg</label><select value={hbsag} onChange={e=>setHbsag(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"><option value="">-</option><option>Positive</option><option>Negative</option><option>Pending</option></select></div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">Anti-HCV</label><select value={hcv} onChange={e=>setHcv(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"><option value="">-</option><option>Positive</option><option>Negative</option><option>Pending</option></select></div>
          </div>
          {/* Lab group tabs */}
          <div className="flex gap-1 mb-3">{(effectiveLAB_GROUPS).map(g=><button key={g.id} type="button" onClick={()=>setInputTab(g.id)} className={'px-3 py-1 rounded-lg text-xs font-bold transition-all '+(inputTab===g.id?'bg-teal-600 text-white':'bg-white text-gray-500 hover:bg-teal-50')}>{g.label}</button>)}</div>
          {(effectiveLAB_GROUPS).filter(g=>g.id===inputTab).map(grp=>(
            <div key={grp.id} className="grid grid-cols-5 gap-2 mb-3">
              {grp.fields.map(f=>{
                const val=(labData[grp.id]||{})[f.key]||'';
                const st=val?getLabStatus(val,f):'empty'; const stCls=LAB_STATUS_STYLE[st]||'';
                return<div key={f.key}><label className="text-xs text-gray-500 block mb-0.5 text-center">{f.label} <span className="text-gray-300 text-xs">({f.unit})</span></label>
                  <input type="number" step="0.01" value={val} onChange={e=>setLabData(d=>({...d,[grp.id]:{...(d[grp.id]||{}),[f.key]:e.target.value}}))} className={'w-full p-1.5 border rounded-lg text-xs text-center outline-none bg-white '+stCls} style={{borderColor:st==='critical'||st==='low-bad'?'#fca5a5':st==='high'?'#fcd34d':st==='normal'?'#86efac':'#e5e7eb'}}/>
                  <p className="text-xs text-gray-300 text-center">{f.lo}–{f.hi}</p></div>;
              })}
            </div>
          ))}
          <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowAdd(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">ยกเลิก</button><button type="button" onClick={addLab} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">บันทึก</button></div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 border-b uppercase"><tr>
              <th className="p-3 pl-4 text-left">TP</th><th className="p-3 text-left">วันที่</th>
              <th className="p-3 text-left">ALT</th><th className="p-3 text-left">AST</th><th className="p-3 text-left">ALP</th><th className="p-3 text-left">T.Bili</th><th className="p-3 text-left">Alb</th>
              <th className="p-3 text-left">Scr</th><th className="p-3 text-left">UA</th>
              <th className="p-3 text-left">HBsAg</th><th className="p-3 text-left">Anti-HCV</th><th className="p-3 text-left">CrCl</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {patient.labs.length===0?<tr><td colSpan={12} className="p-6 text-center text-gray-400">ยังไม่มีผล Lab</td></tr>:
                patient.labs.map((l,i)=>{
                  const lc=calcCrCl(patient.age,patient.weight,l.scr,patient.gender);
                  const altCl=altCls(l.alt); const astCl=altCls(l.ast);
                  return<tr key={i} className={l.alt>120?'bg-red-50':''}>
                    <td className="p-3 pl-4 font-bold font-mono">{l.tp}</td>
                    <td className="p-3 text-gray-400">{l.date||'-'}</td>
                    <td className={'p-3 font-bold '+altCl}>{l.alt||'-'}</td>
                    <td className={'p-3 '+astCl}>{l.ast||'-'}</td>
                    <td className="p-3 text-gray-600">{l.alp||'-'}</td>
                    <td className="p-3 text-gray-600">{l.tbili||'-'}</td>
                    <td className={'p-3 '+(l.alb&&l.alb<3.5?'text-blue-600 font-bold':'')}>{l.alb||'-'}</td>
                    <td className="p-3 text-gray-600">{l.scr||'-'}</td>
                    <td className={'p-3 '+(l.ua>9?'text-red-600 font-bold':l.ua>7.5?'text-amber-600':'')}>{l.ua||'-'}</td>
                    <td className="p-3">{serology(l.hbsag)}</td><td className="p-3">{serology(l.hcv)}</td>
                    <td className={'p-3 font-semibold '+crClStage(lc).color}>{lc||'-'}</td>
                  </tr>;
                })}
            </tbody>
          </table>
        </div>
      </div>

      {patient.labs.length>1&&(
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-gray-700 mb-2">ALT / AST</p><div className="h-32"><canvas ref={altRef}></canvas></div></div>
          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-gray-700 mb-2">Uric Acid</p><div className="h-32"><canvas ref={uaRef}></canvas></div></div>
          <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm"><p className="text-xs font-bold text-gray-700 mb-2">Creatinine</p><div className="h-32"><canvas ref={scrRef}></canvas></div></div>
        </div>
      )}
    </div>
  );
}



function labColor(val, field) {
  if (!field) return '';
  const st = getLabStatus(val, field);
  return LAB_STATUS_STYLE[st] || '';
}
function labFlag(val, field) {
  if (!field) return null;
  const st = getLabStatus(val, field);
  if (st === 'critical') return 'C';
  if (st === 'low-bad' || st === 'high') return st === 'high' ? 'H' : 'L';
  if (st === 'low') return 'L';
  return null;
}


export { LabTab }
