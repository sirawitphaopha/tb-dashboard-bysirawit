'use client'
/** patient-modal/dose-calculator.jsx — DoseCalculator (ใช้ใน AddPatientPage) (แยกรอบ 3) */
import * as React from 'react'
import { RangeStatus } from '../shared'
import { calcDoses, DRUG_RANGES } from '../globals'
import { HOSP_STRENGTHS } from './meds'

function DoseCalculator({weight,regimen,manualMode,manualDoses,onToggle,onManualChange,strengths,onStrChange}){
  const w=parseFloat(weight);
  const base=calcDoses(weight,regimen,null);
  const autoTabs=(key,str)=>{if(!w||str==='syrup')return 1;const d=DRUG_RANGES[key];return Math.max(1,Math.round(Math.min(w*(d.min+d.max)/2,d.absMax)/str));};
  const getDose=d=>{
    const str=(strengths&&strengths[d.key]!=null)?strengths[d.key]:d.strength;
    if(str==='syrup'){const ml=w>0?+(w*5/50).toFixed(1):0;return{...d,strength:str,isSyrup:true,ml,mlMonth:+(ml*30).toFixed(0),bottles:Math.ceil(ml*30/30),mgkg:5,status:'ok'};}
    const tabs=manualMode?(manualDoses[d.key]??autoTabs(d.key,str)):autoTabs(d.key,str);
    const dose=tabs*str;const mgkg=w>0?+(dose/w).toFixed(1):0;
    return{...d,strength:str,tabs,dose,mgkg,status:(dose>d.absMax||mgkg>d.max)?'high':mgkg<d.min?'low':'ok',isSyrup:false};
  };
  const doses=base.map(getDose);
  return(
    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-teal-800"><i className="fa-solid fa-calculator mr-2"></i>คำนวณขนาดยา{w?` (${w} kg)`:''}</h4>
        <button type="button" onClick={onToggle} className="text-xs bg-white border border-teal-200 px-3 py-1.5 rounded-lg font-bold text-teal-700 hover:bg-teal-100 transition-colors">{manualMode?<><i className="fa-solid fa-rotate-left mr-1"></i>อัตโนมัติ</>:<><i className="fa-solid fa-pen mr-1"></i>Manual</>}</button>
      </div>
      {!w?<p className="text-sm text-teal-400 text-center py-2">กรอกน้ำหนักเพื่อคำนวณ</p>:doses.length===0?<p className="text-sm text-teal-400 text-center py-2">เลือกสูตรยา</p>:(
        <div className="space-y-2">
          {doses.map(d=>{
            const opts=HOSP_STRENGTHS[d.key]||[];
            const curTabs=manualMode?(manualDoses[d.key]??d.tabs):d.tabs;
            const curMgkg=d.isSyrup?5:w>0?+((curTabs*d.strength)/w).toFixed(1):0;
            const curSt=d.isSyrup?'ok':(curTabs*d.strength>d.absMax||curMgkg>d.max)?'high':curMgkg<d.min?'low':'ok';
            return(
              <div key={d.key} className="bg-white rounded-xl border border-teal-100 overflow-hidden">
                <div className="flex items-center gap-2 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap mb-0.5">
                      <span className="font-black text-sm text-teal-700 w-5">{d.key}</span>
                      {opts.map(o=><button key={String(o.value)} type="button" onClick={()=>onStrChange&&onStrChange(d.key,o.value)} className={'text-xs px-2 py-0.5 rounded-lg font-bold border transition-all '+(((strengths&&strengths[d.key]!=null)?strengths[d.key]:d.strength)===o.value?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-500 hover:border-teal-300')}>{o.label}</button>)}
                    </div>
                    <p className="text-xs text-gray-400">{d.min}–{d.max} mg/kg · max {d.absMax}mg</p>
                  </div>
                  {d.isSyrup?<div className="text-right mr-2 flex-shrink-0"><p className="font-bold text-teal-700 text-sm">{d.ml} ml OD</p><p className="text-xs text-gray-400">{d.bottles} ขวด/เดือน</p></div>
                  :manualMode?<div className="flex items-center gap-1 flex-shrink-0"><input type="number" min={0.5} max={12} step={0.5} value={curTabs} onChange={e=>onManualChange(d.key,Math.max(0.5,parseFloat(e.target.value)||0.5))} className="w-14 p-1.5 border-2 border-teal-300 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-teal-400"/><span className="text-xs text-gray-500">tab</span></div>
                  :<span className="bg-teal-600 text-white px-3 py-1.5 rounded-lg font-mono font-bold text-sm flex-shrink-0">{d.tabs} tab</span>}
                  {d.isSyrup?<div className="text-right flex-shrink-0"><p className="font-bold text-sm text-green-700">5 mg/kg</p><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">เหมาะสม</span></div>:<RangeStatus status={curSt} mgkg={curMgkg}/>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export { DoseCalculator }
