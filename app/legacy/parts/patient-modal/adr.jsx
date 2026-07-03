'use client'
/** patient-modal/adr.jsx — ADRTab (อาการไม่พึงประสงค์) (แยกรอบ 3) */
import * as React from 'react'
import { Badge } from '../shared'
import { ADR_LIST, migrateAdr } from '../globals'

function ADRTab({patient,onUpdate,locked}){
  const safeAdr=migrateAdr(patient.adr);

  // Build ADR events from visits + adr tab, grouped by date
  const adrEvents = {};
  // From ADR tab direct checks (no visit date) -> use 'recorded' bucket
  ADR_LIST.forEach(a=>{
    const v=safeAdr[a.key];
    if(v?.checked){
      // Find earliest visit that noted this ADR
      const mentionedVisit=(patient.visits||[]).filter(vis=>(vis.adrNoted||[]).includes(a.key)).sort((x,y)=>x.date.localeCompare(y.date))[0];
      const date=mentionedVisit?.date||'manual';
      if(!adrEvents[date])adrEvents[date]=[];
      adrEvents[date].push({...a,note:v.note||''});
    }
  });
  // From visits
  (patient.visits||[]).forEach(vis=>{
    (vis.adrNoted||[]).forEach(k=>{
      const a=ADR_LIST.find(x=>x.key===k);if(!a)return;
      const date=vis.date;
      if(!adrEvents[date])adrEvents[date]=[];
      if(!adrEvents[date].find(x=>x.key===k))
        adrEvents[date].push({...a,note:''});
    });
  });

  const setAdr=(key,field,val)=>{
    if(locked)return;
    const updated={...safeAdr,[key]:{...safeAdr[key],[field]:val}};
    onUpdate({...patient,adr:updated});
  };

  const hasAny=ADR_LIST.some(a=>safeAdr[a.key]?.checked);
  const adrDates=Object.keys(adrEvents).sort().reverse();

  return(
    <div className="space-y-5 tb-fade">
      {/* Checklist */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-heart-pulse mr-2 text-red-500"></i>ADR Checklist</h3>
        {hasAny&&<Badge label={'พบ '+ADR_LIST.filter(a=>safeAdr[a.key]?.checked).length+' รายการ'} color="bg-red-100 text-red-700"/>}
      </div>
      <div className="space-y-2">
        {ADR_LIST.map(a=>{
          const v=safeAdr[a.key]||{checked:false,note:''};
          return(
            <div key={a.key} className={'rounded-2xl border transition-all overflow-hidden '+(v.checked?'border-red-200 bg-red-50':'border-gray-200 bg-white')}>
              <div className="flex items-center gap-3 p-3">
                <div onClick={()=>setAdr(a.key,'checked',!v.checked)}
                  className={'w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all cursor-pointer '+(v.checked?'bg-red-500 border-red-500':'border-gray-300 hover:border-red-300')}>
                  {v.checked&&<i className="fa-solid fa-check text-white" style={{fontSize:'9px'}}></i>}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setAdr(a.key,'checked',!v.checked)}>
                  <p className={'font-bold text-sm '+(v.checked?'text-red-800':'text-gray-700')}>{a.label}</p>
                  <p className="text-xs text-gray-400">{a.sub} · <span className="font-mono text-teal-600">{a.drug}</span></p>
                </div>
                {v.checked&&<input value={v.note} onChange={e=>setAdr(a.key,'note',e.target.value)} onClick={e=>e.stopPropagation()}
                  placeholder="หมายเหตุ..." className="flex-1 p-2 border border-red-200 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-red-300 max-w-xs"/>}
              </div>
              {v.checked&&v.note&&<div className="px-4 pb-2.5"><p className="text-xs text-red-600 bg-red-100 px-3 py-1.5 rounded-lg"><i className="fa-solid fa-note-sticky mr-1"></i>{v.note}</p></div>}
            </div>
          );
        })}
      </div>

      {/* ADR mini-timeline — grouped by date */}
      {adrDates.length>0&&(
        <div>
          <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-timeline mr-2 text-red-400"></i>Timeline ADR (รวมกลุ่มตามวันที่)</h4>
          <div className="relative space-y-3">
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-red-100 pointer-events-none"></div>
            {adrDates.map(date=>(
              <div key={date} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 z-10 mt-1">
                  <i className="fa-solid fa-heart-pulse text-white" style={{fontSize:'8px'}}></i>
                </div>
                <div className="flex-1 bg-white border border-red-100 rounded-2xl p-3 shadow-sm">
                  <p className="text-xs text-gray-400 font-mono mb-2">{date==='manual'?'บันทึกจาก ADR tab':date}</p>
                  <div className="flex flex-wrap gap-2">
                    {adrEvents[date].map(a=>(
                      <div key={a.key} className="bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl">
                        <p className="font-bold text-xs text-red-700">{a.label}</p>
                        <p className="text-xs text-gray-400">{a.sub}</p>
                        {a.note&&<p className="text-xs text-red-500 mt-0.5 italic">{a.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── TIMELINE HELPERS ────────────────────────────────────────────────────────


export { ADRTab }
