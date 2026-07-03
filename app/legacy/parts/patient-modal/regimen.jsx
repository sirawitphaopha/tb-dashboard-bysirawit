'use client'
/** patient-modal/regimen.jsx — RegimenHistoryTab (แยกรอบ 3) */
import * as React from 'react'
const { useState } = React
import { REGIMENS, DEFAULT_RESTART_REASONS } from '../globals'

function RegimenHistoryTab({patient,onUpdate,settings,locked}){
  const regimenList=(settings?.regimens)||REGIMENS;
  const reasonList=(settings?.restartReasons)||DEFAULT_RESTART_REASONS;
  const [showForm,setShowForm]=useState(false);
  const [nr,setNr]=useState({regimen:REGIMENS[0],custom:'',startDate:new Date().toISOString().split('T')[0],reason:'',customReason:''});
  const save=()=>{
    const finalReason=nr.reason==='อื่นๆ'?nr.customReason.trim():nr.reason;
    if(!nr.startDate||!finalReason)return;
    const final=nr.regimen==='อื่นๆ'?nr.custom:nr.regimen;
    const hist=patient.regimenHistory.map(r=>({...r,isCurrent:false,endDate:r.endDate||nr.startDate}));
    hist.push({regimen:final,startDate:nr.startDate,reason:finalReason,isCurrent:true});
    onUpdate({...patient,regimen:final,regimenHistory:hist});setShowForm(false);
  };
  return(
    <div className="space-y-5">
      <div className="flex justify-between items-center"><h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-clock-rotate-left mr-2 text-teal-600"></i>ประวัติสูตรยา</h3><button type="button" onClick={()=>{if(!locked)setShowForm(!showForm);}} disabled={locked} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${locked?'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-teal-600 hover:bg-teal-700 text-white'}`}><i className="fa-solid fa-plus mr-1"></i>เปลี่ยนสูตร</button></div>
      <div className="relative"><div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-3">{(patient.regimenHistory||[]).map((e,i)=>(
          <div key={i} className="flex gap-4">
            <div className={'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 '+(e.isCurrent?'bg-teal-500 border-teal-500 text-white':'bg-white border-gray-300 text-gray-400')}><i className={'fa-solid '+(e.isCurrent?'fa-pills':'fa-check')+' text-sm'}></i></div>
            <div className={'flex-1 p-3.5 rounded-2xl border '+(e.isCurrent?'bg-teal-50 border-teal-200':'bg-gray-50 border-gray-200')}>
              <div className="flex justify-between flex-wrap gap-2"><div><span className={'font-mono font-bold '+(e.isCurrent?'text-teal-800':'text-gray-600')}>{e.regimen}</span>{e.isCurrent&&<span className="ml-2 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">ปัจจุบัน</span>}</div><div className="text-xs text-gray-400"><span className="font-semibold text-gray-600">เริ่ม: {e.startDate}</span>{e.endDate&&<span className="block">สิ้นสุด: {e.endDate}</span>}</div></div>
              <p className="text-xs text-gray-600 mt-1.5"><i className="fa-solid fa-note-sticky mr-1 text-gray-400"></i>{e.reason}</p>
            </div>
          </div>
        ))}</div>
      </div>
      {showForm&&(
        <div className="bg-teal-50 border-2 border-teal-200 p-4 rounded-2xl tb-fade">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className="text-xs font-bold text-gray-600 block mb-1">สูตรยาใหม่</label>
              <select value={nr.regimen} onChange={e=>setNr(n=>({...n,regimen:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg font-mono text-teal-800 text-sm outline-none bg-white">{regimenList.map(r=><option key={r}>{r}</option>)}<option value="อื่นๆ">อื่นๆ (กรอกเอง)</option></select>
              {nr.regimen==='อื่นๆ'&&<input value={nr.custom} onChange={e=>setNr(n=>({...n,custom:e.target.value}))} placeholder="กรอกสูตรยา" className="w-full mt-1 p-2 border border-teal-300 rounded-lg text-sm font-mono outline-none bg-white"/>}
            </div>
            <div><label className="text-xs font-bold text-gray-600 block mb-1">วันที่เริ่ม</label><input type="date" value={nr.startDate} onChange={e=>setNr(n=>({...n,startDate:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white"/></div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-bold text-gray-600 block mb-1">เหตุผล <span className="text-red-500">*</span></label>
            <select value={nr.reason} onChange={e=>setNr(n=>({...n,reason:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white">
              <option value="">-- เลือกเหตุผล --</option>
              {reasonList.filter(r=>!r.includes('Original')).map(r=><option key={r} value={r}>{r}</option>)}
              <option value="อื่นๆ">อื่นๆ (ระบุเอง)</option>
            </select>
            {nr.reason==='อื่นๆ'&&<input value={nr.customReason} onChange={e=>setNr(n=>({...n,customReason:e.target.value}))} placeholder="ระบุเหตุผล..." className="w-full mt-1 p-2 border border-teal-300 rounded-lg text-sm outline-none bg-white"/>}
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">ยกเลิก</button><button type="button" onClick={save} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold">บันทึก</button></div>
        </div>
      )}
    </div>
  );
}


export { RegimenHistoryTab }
