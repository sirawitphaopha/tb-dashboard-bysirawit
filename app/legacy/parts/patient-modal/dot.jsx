'use client'
/** patient-modal/dot.jsx — DOTCalendar (ปฏิทินกินยา DOT) (แยกรอบ 3) */
import * as React from 'react'

function DOTCalendar({patient,onUpdate,locked}){
  const today=new Date();const yr=today.getFullYear();const mo=today.getMonth();
  const dim=new Date(yr,mo+1,0).getDate();const fd=new Date(yr,mo,1).getDay();const td=today.getDate();
  const gk=d=>`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const cells=[...Array(fd).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
  const mks=Object.keys(patient.dot).filter(k=>k.startsWith(`${yr}-${String(mo+1).padStart(2,'0')}`));
  const taken=mks.filter(k=>patient.dot[k]).length;
  const pct=mks.length>0?Math.round((taken/mks.length)*100):0;
  const toggle=day=>{if(day>td||locked)return;const k=gk(day);onUpdate({...patient,dot:{...patient.dot,[k]:!patient.dot[k]}});};
  return(
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-calendar-check mr-2 text-teal-600"></i>DOT Calendar</h4><span className={'text-sm font-bold '+(pct>=90?'text-green-600':pct>=70?'text-amber-600':'text-red-600')}>เดือนนี้: {pct}%</span></div>
      <div className="grid grid-cols-7 gap-1 mb-1">{['อา','จ','อ','พ','พฤ','ศ','ส'].map(d=><div key={d} className="text-center text-xs text-gray-400 font-bold py-0.5">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">{cells.map((day,i)=>{if(!day)return<div key={'e'+i}/>;const tk=patient.dot[gk(day)];const fut=day>td;const isTd=day===td;const btnCls='aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all '+(isTd?'ring-2 ring-teal-400 ':' ')+(fut?'text-gray-200 cursor-not-allowed bg-gray-50':tk?'bg-teal-500 text-white hover:bg-teal-600':'bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer');
          return<button key={day} onClick={()=>toggle(day)} disabled={fut} className={btnCls}>{day}</button>;})}</div>
      <div className="mt-3 flex gap-4 text-xs text-gray-500"><span className="flex items-center gap-1"><span className="w-3 h-3 bg-teal-500 rounded"></span>กินยาแล้ว</span><span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-200 rounded"></span>ไม่ได้กิน</span></div>
    </div>
  );
}


export { DOTCalendar }
