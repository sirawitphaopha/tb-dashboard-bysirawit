
// tb-modals.jsx
const { useState, useEffect, useRef } = React;

// pull window globals into Babel scope
const { ADR_LIST, migrateAdr, calcDoses, calcCrCl, crClStage,
        DRUG_RANGES, REGIMENS, PREFIXES, PATIENT_TYPES, DISEASE_LOCATIONS,
        EXTRA_PULMONARY_TYPES, TAMBONS, DEFAULT_COMORBIDITIES,
        CONSULT_TYPES, DRP_TYPES, LAB_GROUPS, getLabStatus, LAB_STATUS_STYLE } = window;
const INP = `w-full p-2.5 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 text-sm`;
const HOSP_STRENGTHS = {
  R:[{label:'R300',value:300},{label:'R450',value:450}],
  H:[{label:'I100',value:100},{label:'Iso Syrup 50mg/ml',value:'syrup'}],
  Z:[{label:'Z500',value:500}],
  E:[{label:'E400',value:400},{label:'E500',value:500}],
};

function FormSection({icon,title,children}){return(<div><div className="flex items-center gap-2 mb-4"><div className="w-7 h-7 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center text-xs"><i className={`fa-solid ${icon}`}></i></div><h3 className="font-bold text-gray-800 text-sm">{title}</h3></div>{children}</div>);}
function FieldError({msg}){return msg?<p className="text-red-500 text-xs mt-1">{msg}</p>:null;}
function RangeStatus({status,mgkg}){const c={ok:{bg:'bg-green-100',t:'text-green-700',l:'เหมาะสม'},low:{bg:'bg-amber-100',t:'text-amber-700',l:'ต่ำ'},high:{bg:'bg-red-100',t:'text-red-700',l:'สูง'}}[status]||{bg:'bg-gray-100',t:'text-gray-500',l:'-'};return<div className="text-right flex-shrink-0"><p className={'font-bold text-sm '+c.t}>{mgkg}</p><span className={'text-xs px-2 py-0.5 rounded-full font-bold '+c.bg+' '+c.t}>{c.l}</span></div>;}
function Badge({label,color='bg-gray-100 text-gray-600'}){return<span className={'px-2.5 py-0.5 rounded-full text-xs font-bold '+color}>{label}</span>;}

function DoseCalculator({weight,regimen,manualMode,manualDoses,onToggle,onManualChange}){
  const [sel,setSel]=useState({R:300,H:100,Z:500,E:400});
  const w=parseFloat(weight);
  const base=calcDoses(weight,regimen,null);
  const autoTabs=(key,str)=>{if(!w||str==='syrup')return 1;const d=DRUG_RANGES[key];return Math.max(1,Math.round(Math.min(w*(d.min+d.max)/2,d.absMax)/str));};
  const getDose=d=>{
    const str=sel[d.key]??d.strength;
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
                      {opts.map(o=><button key={String(o.value)} type="button" onClick={()=>setSel(s=>({...s,[d.key]:o.value}))} className={'text-xs px-2 py-0.5 rounded-lg font-bold border transition-all '+(sel[d.key]===o.value?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-500 hover:border-teal-300')}>{o.label}</button>)}
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

function DOTCalendar({patient,onUpdate}){
  const today=new Date();const yr=today.getFullYear();const mo=today.getMonth();
  const dim=new Date(yr,mo+1,0).getDate();const fd=new Date(yr,mo,1).getDay();const td=today.getDate();
  const gk=d=>`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const cells=[...Array(fd).fill(null),...Array.from({length:dim},(_,i)=>i+1)];
  const mks=Object.keys(patient.dot).filter(k=>k.startsWith(`${yr}-${String(mo+1).padStart(2,'0')}`));
  const taken=mks.filter(k=>patient.dot[k]).length;
  const pct=mks.length>0?Math.round((taken/mks.length)*100):0;
  const toggle=day=>{if(day>td)return;const k=gk(day);onUpdate({...patient,dot:{...patient.dot,[k]:!patient.dot[k]}});};
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

function useNotifHelpers(alerts,patients,readAlerts,onRead,onOpen,onClose,onNavTarget){
  const cols={admin:'border-l-4 border-teal-600',critical:'border-l-4 border-red-500',warning:'border-l-4 border-amber-400',info:'border-l-4 border-blue-400'};
  const unreadBg={admin:'bg-gradient-to-r from-teal-50 to-teal-100/40',critical:'bg-red-50',warning:'bg-amber-50',info:'bg-blue-50'};

  const sorted=React.useMemo(()=>{
    const order={critical:0,warning:1,info:2};
    const admins=alerts.filter(a=>a.navTarget);                          // admin → บนสุด
    const appts=alerts.filter(a=>!a.navTarget && a.id.startsWith('appt-'));
    const others=alerts.filter(a=>!a.navTarget && !a.id.startsWith('appt-'));
    const grouped=[...others];
    if(appts.length===1) grouped.unshift(appts[0]);
    else if(appts.length>1) grouped.unshift({id:'appt-group',type:'info',patient:null,patientId:null,msg:`มีนัดพรุ่งนี้ ${appts.length} ราย`,time:'วันนี้'});
    return [...admins, ...grouped.sort((a,b)=>(order[a.type]??2)-(order[b.type]??2))];
  },[alerts]);

  const handleClick=a=>{
    onRead(a.id);
    if(a.patientId&&onOpen){const p=(patients||[]).find(x=>x.id===a.patientId);if(p){onOpen(p);if(onClose)onClose();}}
    else if(a.navTarget&&onNavTarget){onNavTarget(a.navTarget);if(onClose)onClose();}
  };

  const renderItem=(a,i)=>{
    const isRead=readAlerts.has(a.id);
    const isAdmin=!!a.navTarget;
    const effectiveType=isAdmin?'admin':a.type;
    const bg=!isRead?(unreadBg[effectiveType]||'bg-blue-50'):'bg-white';
    return(
      <div key={a.id+i} onClick={()=>handleClick(a)} className={'p-4 transition-colors '+cols[effectiveType]+' '+bg+((a.patientId||a.navTarget)?' cursor-pointer':'')+' hover:bg-teal-50'}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0 flex items-start gap-2.5">
            {isAdmin && <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fa-solid fa-user-shield text-sm"></i></div>}
            <div className="flex-1 min-w-0">
              {isAdmin && <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-0.5">Admin · จัดการผู้ใช้</p>}
              {a.patient&&<p className="font-bold text-xs text-gray-700 mb-0.5">{a.patient}</p>}
              <p className={'text-sm '+(isRead?'text-gray-400':(isAdmin?'text-teal-900 font-bold':'text-gray-700 font-medium'))}>{a.msg}</p>
              <p className="text-xs text-gray-400 mt-1">{a.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {!isRead&&<button type="button" onClick={e=>{e.stopPropagation();onRead(a.id);}} className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-lg hover:bg-teal-200 transition-colors font-bold" title="รับทราบ">✓</button>}
            {(a.patientId||a.navTarget)&&<i className="fa-solid fa-chevron-right text-xs text-teal-400"></i>}
          </div>
        </div>
      </div>
    );
  };
  return {sorted,renderItem};
}

function NotificationPanel({alerts,patients,readAlerts,onRead,onReadAll,onOpen,onClose,onExpand,onNavTarget}){
  const unread=alerts.filter(a=>!readAlerts.has(a.id)).length;
  const {sorted,renderItem}=useNotifHelpers(alerts,patients,readAlerts,onRead,onOpen,onClose,onNavTarget);
  return(
    <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 tb-fade overflow-hidden" style={{width:'360px'}}>
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm">การแจ้งเตือน {unread>0&&<span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{unread}</span>}</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onExpand} className="p-1.5 text-gray-400 hover:text-teal-600 transition-colors" title="ขยายเต็มจอ"><i className="fa-solid fa-expand text-xs"></i></button>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {sorted.length===0?<p className="p-6 text-center text-gray-400 text-sm">ไม่มีการแจ้งเตือน</p>:sorted.map((a,i)=>renderItem(a,i))}
      </div>
      {alerts.length>0&&<div className="p-3 border-t border-gray-100 text-right"><button type="button" onClick={onReadAll} className="text-xs text-gray-400 hover:text-teal-600 transition-colors font-medium">ล้างการแจ้งเตือนทั้งหมด</button></div>}
    </div>
  );
}

function NotificationFullModal({alerts,patients,readAlerts,onRead,onReadAll,onOpen,onClose,onNavTarget}){
  const unread=alerts.filter(a=>!readAlerts.has(a.id)).length;
  const {sorted,renderItem}=useNotifHelpers(alerts,patients,readAlerts,onRead,onOpen,()=>onClose&&onClose(),onNavTarget);
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.45)'}}>
      <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden notif-modal" style={{width:'min(90vw,920px)',maxHeight:'82vh'}}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800">การแจ้งเตือนทั้งหมด</h2>
            <p className="text-xs text-gray-400 mt-0.5">ยังไม่อ่าน {unread} รายการ &nbsp;·&nbsp; ทั้งหมด {alerts.length} รายการ</p>
          </div>
          <div className="flex items-center gap-3">
            {alerts.length>0&&<button type="button" onClick={onReadAll} className="text-sm text-gray-400 hover:text-teal-600 transition-colors font-medium"><i className="fa-solid fa-check-double mr-1"></i>ล้างทั้งหมด</button>}
            <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {sorted.length===0
            ?<p className="p-10 text-center text-gray-400">ไม่มีการแจ้งเตือน</p>
            :<div className="grid grid-cols-2 gap-3" style={{gridAutoRows:'max-content'}}>
              {sorted.map((a,i)=>(
                <div key={a.id} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {renderItem(a,i)}
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

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

function RegimenHistoryTab({patient,onUpdate,settings}){
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
      <div className="flex justify-between items-center"><h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-clock-rotate-left mr-2 text-teal-600"></i>ประวัติสูตรยา</h3><button type="button" onClick={()=>setShowForm(!showForm)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"><i className="fa-solid fa-plus mr-1"></i>เปลี่ยนสูตร</button></div>
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

function LabTab({patient,onUpdate,settings}){
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
        <button type="button" onClick={()=>setShowAdd(!showAdd)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"><i className="fa-solid fa-plus mr-1"></i>เพิ่มผล Lab</button>
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


function ADRTab({patient,onUpdate}){
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
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 tb-fade text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
        </div>
        <p className="font-bold text-gray-800 text-base mb-2">{message}</p>
        <p className="text-sm text-gray-400 mb-6">การกระทำนี้ไม่สามารถยกเลิกได้</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">ยกเลิก</button>
          <button type="button" onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors">ยืนยันลบ</button>
        </div>
      </div>
    </div>
  );
}

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

function TimelineTab({ patient, onUpdate, settings }) {
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
        <button type="button" onClick={() => { setEditId(null); setShowForm(!showForm); }}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
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
      {confirmDelete && <ConfirmModal message="ต้องการลบ Visit นี้ใช่ไหม?" onConfirm={()=>deleteVisit(confirmDelete)} onCancel={()=>setConfirmDelete(null)}/>}
      <div ref={formRef}>{showForm && <VisitForm key={editId||'new'} initial={editInitialForm} onSave={saveVisit} onCancel={() => { setShowForm(false); setEditId(null); }} patient={{...patient,_labGroups:(settings?.labGroups)||LAB_GROUPS}}/>}</div>

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
function hasResistance(sputum) {
  return (sputum||[]).some(s => s.rifResult==='RIF resistant' || s.inhResult==='INH resistant' || (s.sldResults && Object.values(s.sldResults).some(v=>v==='Resistant')));
}

// Compute AFB combined display string for a sputum record
function afbCombined(s) {
  if (!s) return '-';
  // New format: specimens array
  if (s.specimens && s.specimens.length > 0) {
    const parts = s.specimens.map(sp => {
      const afb = (sp.afbSamples||[]).filter(a=>a.result);
      if (afb.length === 0) return null;
      const label = sp.type && sp.type!=='Sputum' ? '['+sp.type.split(' ')[0]+'] ' : '';
      const results = afb.map(a=>a.result==='Scanty'&&a.scantyCount?'Scanty '+a.scantyCount+' cells':a.result).join(' / ');
      return label + results;
    }).filter(Boolean);
    return parts.length > 0 ? parts.join(' | ') : '-';
  }
  // Legacy: afbSamples array
  if (s.afbSamples && s.afbSamples.length > 0) {
    const parts = s.afbSamples.map(sa => {
      if (!sa.result) return null;
      if (sa.result === 'Scanty' && sa.scantyCount) return 'Scanty '+sa.scantyCount+' cells';
      return sa.result;
    }).filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : '-';
  }
  // Legacy single result
  if (!s.result) return '-';
  if (s.result === 'Scanty' && s.scantyCount) return 'Scanty '+s.scantyCount+' cells';
  return s.result;
}

// Is positive (for conversion logic)
function isAfbPositive(s) {
  const combined = afbCombined(s);
  if (!combined || combined === '-' || combined === 'Neg') return false;
  // all parts Neg → negative
  const parts = combined.split(' / ');
  return parts.some(p => p !== 'Neg');
}

// Check sputum conversion — first month where NOT positive after M0
function getSputumConversion(sputumList) {
  const sorted = [...(sputumList||[])].sort((a,b) => {
    const na = a.tp === 'M0' ? 0 : parseInt((a.tp||'').replace('M',''))||99;
    const nb = b.tp === 'M0' ? 0 : parseInt((b.tp||'').replace('M',''))||99;
    return na - nb;
  });
  for (let i = 1; i < sorted.length; i++) {
    if (!isAfbPositive(sorted[i])) {
      return { converted: true, tp: sorted[i].tp, date: sorted[i].date };
    }
  }
  return { converted: false };
}

// Is delayed conversion: M2 still positive
function isDelayedConversion(sputumList) {
  const m2 = (sputumList||[]).find(s => s.tp === 'M2');
  if (!m2) return false;
  return isAfbPositive(m2);
}

// Empty add form state
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

function DiagnosisTab({patient, onUpdate}) {
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
        <button type="button" onClick={openAdd} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"><i className="fa-solid fa-plus mr-1"></i>เพิ่มผล</button>
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


function MedsTab({patient,onUpdate,settings}){
  const [editDoses,setEditDoses]=useState(false);
  const [customDoses,setCustomDoses]=useState(patient.customDoses||{});
  const [newDrugName,setNewDrugName]=useState('');
  const [newDrugDose,setNewDrugDose]=useState('');
  const [newDrugRoute,setNewDrugRoute]=useState('');
  const drugList=(settings?.drugs)||DEFAULT_DRUGS||[];

  // Dose history from visits
  const doseHistory=(patient.visits||[]).filter(v=>v.drugDoses).map(v=>({date:v.date,doses:v.drugDoses})).sort((a,b)=>b.date.localeCompare(a.date));
  // Latest dose from visits or calcDoses
  const latestDoseStr=doseHistory.length>0?doseHistory[0].doses:'';
  const doses=calcDoses(patient.weight,patient.regimen,editDoses?customDoses:patient.customDoses);

  const saveDoses=()=>{
    onUpdate({...patient,customDoses});setEditDoses(false);
  };
  const resetDoses=()=>{setCustomDoses({});onUpdate({...patient,customDoses:null});setEditDoses(false);};

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
              <button type="button" onClick={()=>{setCustomDoses(patient.customDoses||{});setEditDoses(true);}} className="text-xs px-2.5 py-1 border border-gray-200 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold"><i className="fa-solid fa-pen mr-1"></i>แก้ไขโดส</button>
            )}
          </div>
        </div>
        <div className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-gray-100/60 border-b text-xs text-gray-500 uppercase"><tr><th className="p-3 pl-4 text-left">ยา</th><th className="p-3 text-left">mg/kg</th><th className="p-3 text-left">จำนวน</th><th className="p-3 text-left">/เดือน</th><th className="p-3 text-left">สถานะ</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{doses.map(d=>{
            const mgkgCls='p-3 font-bold '+(d.status==='ok'?'text-green-700':d.status==='high'?'text-red-600':'text-amber-600');
            const badge=d.status==='ok'?<Badge label="เหมาะสม" color="bg-green-100 text-green-700"/>:d.status==='high'?<Badge label="สูง" color="bg-red-100 text-red-700"/>:<Badge label="ต่ำ" color="bg-amber-100 text-amber-700"/>;
            return<tr key={d.key}>
              <td className="p-3 pl-4 font-bold">{d.name} <span className="text-gray-400 font-normal text-xs">({d.strength}mg)</span></td>
              <td className={mgkgCls}>{d.mgkg}</td>
              <td className="p-3">
                {editDoses?(
                  <div className="flex items-center gap-1">
                    <input type="number" min={1} max={8} value={customDoses[d.key]??d.tabs}
                      onChange={e=>setCustomDoses(c=>({...c,[d.key]:Math.max(1,parseInt(e.target.value)||1)}))}
                      className="w-12 p-1 border-2 border-teal-300 rounded-lg text-center font-bold text-sm outline-none"/>
                    <span className="text-xs text-gray-400">tab</span>
                  </div>
                ):<span className="font-semibold">{d.tabs} tab OD ac</span>}
              </td>
              <td className="p-3 font-mono font-bold text-teal-700">{d.tabs*30} tab</td>
              <td className="p-3">{badge}</td>
            </tr>;
          })}</tbody></table>
        </div>
        {patient.status==='critical'&&<div className="mt-2 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-2xl"><p className="font-bold text-red-700 text-sm"><i className="fa-solid fa-hand mr-2"></i>HOLD ยาทุกตัว — ALT &gt; 3× ULN</p></div>}
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


function InfoBar({patient,onUpdate}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState({weight:patient.weight,nextAppt:patient.nextAppt||'',hivStatus:patient.hivStatus||'',hivNote:patient.hivNote||''});
  const save=()=>{onUpdate({...patient,weight:+draft.weight||patient.weight,nextAppt:draft.nextAppt,hivStatus:draft.hivStatus||null,hivNote:draft.hivNote});setEditing(false);};
  return(
    <div className="bg-slate-50 border-b border-gray-200 px-6 py-2.5 flex-shrink-0">
      <div className="flex flex-wrap gap-x-5 gap-y-1 items-center text-sm">
        <span className="text-gray-500 text-xs">HN: <strong className="text-gray-800 font-mono">{patient.hn}</strong></span>
        {patient.age&&<span className="text-gray-500 text-xs">{patient.age} ปี · {patient.gender==='M'?'ชาย':'หญิง'}</span>}
        {patient.subdistrict&&<span className="text-gray-500 text-xs">ต.<strong>{patient.subdistrict}</strong></span>}
        {patient.patientType&&<Badge label={patient.patientType} color="bg-blue-100 text-blue-700"/>}
        {patient.diseaseLocation&&<Badge label={patient.diseaseLocation+(patient.extraPulmonaryType?' — '+patient.extraPulmonaryType:'')} color="bg-indigo-100 text-indigo-700"/>}
        {!editing?(<>
          <span className="text-gray-500 text-xs">น้ำหนัก: <strong className="text-teal-700">{patient.weight} kg</strong></span>
          {patient.nextAppt&&<span className="text-gray-500 text-xs">นัด: <strong>{patient.nextAppt}</strong></span>}
          {patient.hivStatus&&<Badge label={'HIV: '+patient.hivStatus} color={patient.hivStatus==='Positive'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}/>}
          <button type="button" onClick={()=>setEditing(true)} className="ml-auto text-teal-500 hover:text-teal-700 text-xs font-bold flex items-center gap-1"><i className="fa-solid fa-pen"></i>แก้ไข</button>
        </>):(<div className="flex items-center gap-3 flex-wrap ml-auto">
          <div className="flex items-center gap-1 text-xs"><label className="text-gray-500 font-bold">น้ำหนัก</label><input type="number" value={draft.weight} onChange={e=>setDraft(d=>({...d,weight:e.target.value}))} className="w-14 p-1 border border-teal-300 rounded-lg text-center font-bold outline-none bg-white text-xs"/><span className="text-gray-400">kg</span></div>
          <div className="flex items-center gap-1 text-xs"><label className="text-gray-500 font-bold">วันนัด</label><input value={draft.nextAppt} onChange={e=>setDraft(d=>({...d,nextAppt:e.target.value}))} className="p-1 border border-gray-200 rounded-lg outline-none bg-white text-xs w-28"/></div>
          <div className="flex items-center gap-1 text-xs"><label className="text-gray-500 font-bold">HIV</label>
            <select value={draft.hivStatus} onChange={e=>setDraft(d=>({...d,hivStatus:e.target.value}))} className="p-1 border border-gray-200 rounded-lg outline-none bg-white text-xs"><option value="">-</option><option value="Positive">Positive</option><option value="Negative">Negative</option></select>
            {draft.hivStatus==='Positive'&&<input value={draft.hivNote} onChange={e=>setDraft(d=>({...d,hivNote:e.target.value}))} placeholder="CD4..." className="p-1 border border-red-200 rounded-lg outline-none bg-white text-xs w-24"/>}
          </div>
          <div className="flex gap-2"><button type="button" onClick={()=>setEditing(false)} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded-lg">ยกเลิก</button><button type="button" onClick={save} className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold">บันทึก</button></div>
        </div>)}
      </div>
    </div>
  );
}

function ClinicalModal({patient,onClose,onUpdate,settings,onArchive,currentUser,onSoftDelete}){
  const [tab,setTab]=useState('timeline');
  const tabs=[
    {id:'timeline',icon:'fa-timeline',label:'Timeline'},
    {id:'meds',icon:'fa-pills',label:'ยา & Interaction'},
    {id:'regimen-history',icon:'fa-clock-rotate-left',label:'ประวัติสูตร'},
    {id:'labs',icon:'fa-flask',label:'Lab'},
    {id:'sputum',icon:'fa-microscope',label:'Diagnosis'},
    {id:'dot',icon:'fa-calendar-check',label:'DOT'},
    {id:'adr',icon:'fa-heart-pulse',label:'ADR'},
    {id:'summary',icon:'fa-chart-bar',label:'สรุปเภสัช'},
  ];
  const safeAdr=migrateAdr(patient.adr);
  const hasAdr=ADR_LIST.some(a=>safeAdr[a.key]?.checked);
  const last=patient.labs[patient.labs.length-1]||{};
  const crcl=calcCrCl(patient.age,patient.weight,last.scr,patient.gender);
  const isRes = hasResistance(patient.sputum||[]) || patient.hasResistance;
  const isCritical = patient.status==='critical' || isRes;
  return(
    <div className={`bg-white w-full h-full flex flex-col overflow-hidden tb-fade ${isRes?'ring-4 ring-red-500 ring-inset':''}`}>
        {/* ── 2-column compact header ── */}
        <div className={`flex items-center gap-4 px-5 border-b flex-shrink-0 ${isRes?'bg-red-50 border-red-200':'bg-white border-gray-100'}`} style={{minHeight:'80px',padding:'10px 20px'}}>

          {/* คอลัมน์ซ้าย — fit-content ไม่ stretch */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm text-white font-black flex-shrink-0 ${isCritical?'bg-red-500':'bg-teal-500'}`}>{(patient.firstName||patient.name).substring(0,2)}</div>
            <div className="flex flex-col gap-1 min-w-0">
              {/* แถว 1: ชื่อ + status badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-gray-900 text-sm leading-tight">{patient.name}</span>
                {isCritical&&<span className="animate-pulse bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"><i className="fa-solid fa-triangle-exclamation mr-1"></i>Critical</span>}
                {isRes&&<span className="animate-pulse bg-red-700 text-white text-xs px-2 py-0.5 rounded-full font-bold"><i className="fa-solid fa-biohazard mr-1"></i>Resistant</span>}
                {hasAdr&&<span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">ADR {ADR_LIST.filter(a=>safeAdr[a.key]?.checked).length} รายการ</span>}
              </div>
              {/* แถว 2: HN · อายุ/เพศ · ตำบล · โรคประจำตัว */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400 font-mono">HN: <strong className="text-gray-600">{patient.hn}</strong></span>
                {patient.age&&<span className="text-xs text-gray-400">{patient.age} ปี · {patient.gender==='M'?'ชาย':'หญิง'}</span>}
                {patient.subdistrict&&<span className="text-xs text-gray-400">ต.<strong className="text-gray-600">{patient.subdistrict}</strong></span>}
                {(patient.comorbidities||[]).map(c=><span key={c} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{c}</span>)}
              </div>
            </div>
          </div>

          {/* divider */}
          <div className="w-px bg-gray-100 flex-shrink-0" style={{alignSelf:'stretch',margin:'8px 0'}}></div>

          {/* คอลัมน์ขวา */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            {/* แถว 1: clinical */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{patient.regimen}</span>
              <span className="text-xs text-teal-600 font-semibold">{patient.phase} · M{patient.month} · Day {patient.day}</span>
              <span className="text-xs text-gray-500">Adherence: <strong className={patient.adherence>=90?'text-green-600':'text-amber-500'}>{patient.adherence}%</strong></span>
              {crcl&&<span className={'text-xs font-semibold '+crClStage(crcl).color}>CrCl: {crcl}</span>}
            </div>
            {/* แถว 2: demographic */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">น้ำหนัก: <strong className="text-teal-700">{patient.weight} kg</strong></span>
              {patient.nextAppt&&<span className="text-xs text-gray-400">นัด: <strong className="text-gray-600">{patient.nextAppt}</strong></span>}
              {patient.hivStatus&&<span className={`text-xs px-2 py-0.5 rounded-full font-bold ${patient.hivStatus==='Positive'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>HIV: {patient.hivStatus}</span>}
              {patient.patientType&&<span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">{patient.patientType}</span>}
              {patient.diseaseLocation&&<span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold">{patient.diseaseLocation}</span>}
            </div>
          </div>

          {/* ปุ่ม Archive — แสดงเมื่อมี outcome และยังไม่ archive */}
          {patient.outcome?.type && !patient.archived && onArchive && (
            <button type="button" onClick={()=>onArchive(patient)}
              className="tb-wiggle ml-auto flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-xl text-sm font-bold transition-colors flex-shrink-0 shadow-sm">
              <i className="fa-solid fa-flag-checkered"></i>ส่งเข้าทะเบียนจบ
            </button>
          )}
          {/* ปุ่มกลับ — เด่น สี teal */}
          <button type="button" onClick={onClose} className={`${patient.outcome?.type && !patient.archived && onArchive ? '' : 'ml-auto '}flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-bold transition-colors flex-shrink-0 shadow-sm`}>
            <i className="fa-solid fa-arrow-left"></i>กลับ
          </button>
        </div>
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0 overflow-x-auto">
          {tabs.map(t=><button key={t.id} type="button" onClick={()=>setTab(t.id)} className={'flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap '+(tab===t.id?'border-teal-600 text-teal-700 bg-teal-50/50':'border-transparent text-gray-500 hover:text-teal-600 hover:bg-gray-50')}><i className={'fa-solid '+t.icon}></i>{t.label}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {tab==='timeline'&&<TimelineTab patient={patient} onUpdate={onUpdate} settings={settings}/>}
          {tab==='meds'&&<MedsTab patient={patient} onUpdate={onUpdate} settings={settings}/>}
          {tab==='regimen-history'&&<RegimenHistoryTab patient={patient} onUpdate={onUpdate} settings={settings}/>}
          {tab==='labs'&&<LabTab patient={patient} onUpdate={onUpdate}/>}
          {tab==='sputum'&&<DiagnosisTab patient={patient} onUpdate={onUpdate}/>}
          {tab==='dot'&&<div className="max-w-lg"><DOTCalendar patient={patient} onUpdate={onUpdate}/></div>}
          {tab==='adr'&&<ADRTab patient={patient} onUpdate={onUpdate}/>}
          
          {tab==='summary'&&<PharmSummaryTab patient={patient} currentUser={currentUser} onSoftDelete={onSoftDelete}/>}
        </div>
    </div>
  );
}

function AddPatientPage({onBack,onAdd,settings,onDirtyChange}){
  const comorbList=settings?.comorbidities||DEFAULT_COMORBIDITIES;
  const [form,setForm]=useState({hn:'',prefix:'นาย',firstName:'',lastName:'',age:'',gender:'M',patientType:'New',diseaseLocation:'Pulmonary',extraPulmonaryType:'',weight:'',regimen:'2HRZE/4HR',customRegimen:'',subdistrict:'พิมาย',comorbidities:[],concomitantDrugs:[],startDate:new Date().toISOString().split('T')[0]});
  const [manualMode,setManualMode]=useState(false);
  const [manualDoses,setManualDoses]=useState({});
  const [errors,setErrors]=useState({});
  const [drugInput,setDrugInput]=useState('');
  const [showLeaveConfirm,setShowLeaveConfirm]=useState(false);
  const [isDirty,setIsDirty]=useState(false);
  const markDirty=()=>{ setIsDirty(true); onDirtyChange&&onDirtyChange(true); };
  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));markDirty();};
  const handleBack=()=>{ if(isDirty) setShowLeaveConfirm(true); else onBack(); };
  const setPrefix=p=>{const gMap={นาย:'M',เด็กชาย:'M',นาง:'F',นางสาว:'F',เด็กหญิง:'F'};setForm(f=>({...f,prefix:p,gender:gMap[p]||f.gender}));markDirty();};
  const toggleCo=c=>{setForm(f=>({...f,comorbidities:f.comorbidities.includes(c)?f.comorbidities.filter(x=>x!==c):[...f.comorbidities,c]}));markDirty();};
  const addDrug=()=>{if(drugInput.trim()){setForm(f=>({...f,concomitantDrugs:[...f.concomitantDrugs,drugInput.trim()]}));setDrugInput('');markDirty();}};
  const removeDrug=i=>{setForm(f=>({...f,concomitantDrugs:f.concomitantDrugs.filter((_,idx)=>idx!==i)}));markDirty();};
  const finalReg=form.regimen==='อื่นๆ'?form.customRegimen:form.regimen;
  const validate=()=>{const e={};if(!form.hn.trim())e.hn='กรุณากรอก HN';if(!form.firstName.trim())e.firstName='กรุณากรอกชื่อ';if(!form.lastName.trim())e.lastName='กรุณากรอกนามสกุล';if(!form.weight||+form.weight<10)e.weight='น้ำหนักไม่ถูกต้อง';return e;};
  const submit=()=>{const e=validate();if(Object.keys(e).length){setErrors(e);return;}onAdd({id:'P'+Date.now(),hn:form.hn,prefix:form.prefix,firstName:form.firstName,lastName:form.lastName,name:form.prefix+' '+form.firstName+' '+form.lastName,age:+form.age,gender:form.gender,patientType:form.patientType,diseaseLocation:form.diseaseLocation,extraPulmonaryType:form.extraPulmonaryType,subdistrict:form.subdistrict,weight:+form.weight,regimen:finalReg,regimenHistory:[{regimen:finalReg,startDate:form.startDate,reason:'เริ่มรักษาครั้งแรก',isCurrent:true}],phase:'Intensive',month:0,day:1,status:'normal',adherence:100,comorbidities:form.comorbidities,concomitantDrugs:form.concomitantDrugs,hivStatus:null,hivNote:'',nextAppt:'นัดครั้งแรก',daysUntil:30,startDate:form.startDate,labs:[],sputum:[],adr:{},visits:[],dot:{},customDoses:manualMode?manualDoses:null});onBack();};
  return(
    <div className="flex flex-col h-full tb-fade">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleBack} className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-colors"><i className="fa-solid fa-arrow-left text-sm"></i></button>
          <div>
            <h2 className="text-lg font-bold text-gray-800"><i className="fa-solid fa-user-plus mr-2 text-teal-600"></i>ลงทะเบียนผู้ป่วยวัณโรครายใหม่</h2>
            <p className="text-xs text-gray-400">กรอกข้อมูลให้ครบถ้วนก่อนบันทึก</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleBack} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition-colors">ยกเลิก</button>
          <button type="button" onClick={submit} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition-all"><i className="fa-solid fa-save mr-2"></i>บันทึกและสร้างเคส</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-5">
            <FormSection icon="fa-user" title="ข้อมูลผู้ป่วย">
              <div className="space-y-3">
                <div className="grid grid-cols-[96px_1fr_1fr] gap-3">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">คำนำหน้า</label><select value={form.prefix} onChange={e=>setPrefix(e.target.value)} className={`${INP} border-gray-200 font-semibold`}>{PREFIXES.map(p=><option key={p}>{p}</option>)}</select></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">ชื่อ <span className="text-red-500">*</span></label><input value={form.firstName} onChange={e=>set('firstName',e.target.value)} className={INP+' '+(errors.firstName?'border-red-400':'border-gray-200')}/><FieldError msg={errors.firstName}/></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">นามสกุล <span className="text-red-500">*</span></label><input value={form.lastName} onChange={e=>set('lastName',e.target.value)} className={INP+' '+(errors.lastName?'border-red-400':'border-gray-200')}/><FieldError msg={errors.lastName}/></div>
                </div>
                <div className="grid grid-cols-[1fr_90px_auto] gap-3 items-end">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">HN <span className="text-red-500">*</span></label><input value={form.hn} onChange={e=>set('hn',e.target.value)} placeholder="12345/67" className={INP+' font-mono '+(errors.hn?'border-red-400':'border-gray-200')}/><FieldError msg={errors.hn}/></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">อายุ (ปี)</label><input type="number" min={0} max={120} value={form.age} onChange={e=>set('age',e.target.value)} className={`${INP} border-gray-200 text-center`}/></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">เพศ</label><div className="flex gap-1.5">{[['M','fa-person','ชาย'],['F','fa-person-dress','หญิง']].map(([v,ic,lbl])=><label key={v} className={'flex items-center gap-1.5 cursor-pointer px-3 py-2.5 rounded-xl border-2 transition-all font-semibold text-sm whitespace-nowrap '+(form.gender===v?'bg-teal-50 border-teal-400 text-teal-700':'border-gray-200 text-gray-500')}><input type="radio" className="hidden" checked={form.gender===v} onChange={()=>set('gender',v)}/><i className={`fa-solid ${ic}`}></i>{lbl}</label>)}</div></div>
                </div>
              </div>
            </FormSection>
            <hr className="border-gray-100"/>
            <FormSection icon="fa-hospital" title="ข้อมูลทางคลินิก">
              <div className="space-y-3">
                <div><label className="block text-xs font-bold text-gray-600 mb-2">ประเภทผู้ป่วย</label><div className="grid grid-cols-3 gap-2">{PATIENT_TYPES.map(t=><button key={t} type="button" onClick={()=>set('patientType',t)} className={'py-2 rounded-xl border-2 text-xs font-bold transition-all '+(form.patientType===t?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-600 hover:border-teal-300')}>{t}</button>)}</div></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-2">ตำแหน่งโรค</label><div className="grid grid-cols-3 gap-2">{DISEASE_LOCATIONS.map(l=><button key={l} type="button" onClick={()=>set('diseaseLocation',l)} className={'py-2.5 rounded-xl border-2 text-sm font-semibold transition-all '+(form.diseaseLocation===l?'bg-teal-600 border-teal-600 text-white':'border-gray-200 text-gray-600 hover:border-teal-300')}>{l}</button>)}</div></div>
                {form.diseaseLocation==='Extra-pulmonary'&&<div className="tb-fade"><label className="block text-xs font-bold text-gray-600 mb-1">ระบุตำแหน่ง</label><select value={form.extraPulmonaryType} onChange={e=>set('extraPulmonaryType',e.target.value)} className={`${INP} border-teal-300 bg-teal-50`}><option value="">-- เลือก --</option>{EXTRA_PULMONARY_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>}
                <div><label className="block text-xs font-bold text-gray-600 mb-1">ตำบล</label><select value={form.subdistrict} onChange={e=>set('subdistrict',e.target.value)} className={`${INP} border-gray-200`}>{TAMBONS.map(t=><option key={t} value={t}>ต.{t}</option>)}</select></div>
              </div>
            </FormSection>
            <hr className="border-gray-100"/>
            <FormSection icon="fa-capsules" title="ยาร่วมรักษา (Concomitant Drugs)">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={drugInput} onChange={e=>setDrugInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addDrug())} placeholder="พิมพ์ชื่อยา แล้วกด Enter หรือ +" className={`${INP} border-gray-200 flex-1`}/>
                  <button type="button" onClick={addDrug} className="px-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors"><i className="fa-solid fa-plus"></i></button>
                </div>
                {form.concomitantDrugs.length>0&&<div className="flex flex-wrap gap-2 pt-1">{form.concomitantDrugs.map((d,i)=><span key={i} className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold px-3 py-1.5 rounded-full">{d}<button type="button" onClick={()=>removeDrug(i)} className="text-teal-400 hover:text-red-500 transition-colors ml-0.5"><i className="fa-solid fa-xmark"></i></button></span>)}</div>}
              </div>
            </FormSection>
          </div>
          <div className="space-y-5">
            <FormSection icon="fa-pills" title="น้ำหนักและสูตรยา">
              <div className="space-y-4">
                <div className="grid grid-cols-[110px_1fr_1fr] gap-3 items-end">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">น้ำหนัก (kg) <span className="text-red-500">*</span></label><input type="number" value={form.weight} onChange={e=>set('weight',e.target.value)} className={'w-full p-2.5 border rounded-xl bg-white text-center font-bold text-xl outline-none focus:ring-2 focus:ring-teal-400 '+(errors.weight?'border-red-400':'border-gray-200')}/><FieldError msg={errors.weight}/></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">สูตรยาเริ่มต้น</label><select value={form.regimen} onChange={e=>set('regimen',e.target.value)} className={`${INP} border-gray-200 font-mono text-teal-800 font-bold`}>{(settings?.regimens||REGIMENS).map(r=><option key={r}>{r}</option>)}<option value="อื่นๆ">อื่นๆ</option></select>{form.regimen==='อื่นๆ'&&<input value={form.customRegimen} onChange={e=>set('customRegimen',e.target.value)} placeholder="กรอกสูตรยา" className="w-full mt-2 p-2.5 border-2 border-teal-300 rounded-xl bg-teal-50 outline-none font-mono text-sm"/>}</div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">วันที่เริ่มรักษา</label><input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} className={`${INP} border-gray-200`}/></div>
                </div>
                <DoseCalculator weight={form.weight} regimen={finalReg} manualMode={manualMode} manualDoses={manualDoses} onToggle={()=>setManualMode(m=>!m)} onManualChange={(k,v)=>setManualDoses(d=>({...d,[k]:v}))}/>
              </div>
            </FormSection>
            <hr className="border-gray-100"/>
            <FormSection icon="fa-heart-pulse" title="โรคประจำตัว">
              <div className="grid grid-cols-2 gap-2">{comorbList.map(c=><button key={c.abbr} type="button" onClick={()=>toggleCo(c.abbr)} className={'flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-xs text-left '+(form.comorbidities.includes(c.abbr)?'bg-teal-50 border-teal-400 text-teal-800 font-semibold':'border-gray-200 text-gray-600 hover:border-teal-200')}><div className={'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 '+(form.comorbidities.includes(c.abbr)?'bg-teal-500':'border-2 border-gray-300')}>{form.comorbidities.includes(c.abbr)&&<i className="fa-solid fa-check text-white" style={{fontSize:'8px'}}></i>}</div><span className="truncate">{c.name} <span className="opacity-50 font-normal">({c.abbr})</span></span></button>)}</div>
            </FormSection>
          </div>
        </div>
      </div>

      {/* Leave confirmation dialog */}
      {showLeaveConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'20px',overflow:'hidden',maxWidth:'360px',width:'90%',textAlign:'center',boxShadow:'0 20px 50px rgba(0,0,0,0.2)',animation:'tbFadeIn 0.2s ease'}}>
              <div style={{padding:'32px 32px 28px'}}>
              <p style={{fontWeight:700,fontSize:'16px',color:'#1f2937',marginBottom:'8px'}}>ยืนยันการออกจากหน้านี้</p>
              <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'24px'}}>ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก</p>
              <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
                <button onClick={()=>setShowLeaveConfirm(false)} style={{padding:'10px 24px',borderRadius:'12px',border:'2px solid #0d9488',background:'#fff',fontWeight:700,fontSize:'14px',color:'#0d9488',cursor:'pointer'}}>อยู่ต่อ</button>
                <button onClick={onBack} style={{padding:'10px 24px',borderRadius:'12px',border:'none',background:'#ef4444',fontWeight:700,fontSize:'14px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}><i className="fa-solid fa-arrow-right-from-bracket"></i>ออกเลย</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── PHARM SUMMARY TAB ───────────────────────────────────────────────────────
function PharmSummaryTab({ patient, currentUser, onSoftDelete }) {
  const visits = patient.visits || [];
  const consults = visits.filter(v => v.consult?.type);
  const drps = visits.flatMap(v => (v.drp||[]).map(d => ({...d, date:v.date})));
  const safeAdr = migrateAdr(patient.adr);
  const adrFound = ADR_LIST.filter(a => safeAdr[a.key]?.checked);

  // ── ระบบลบผู้ป่วย ──
  const isAdmin = currentUser?.role === 'admin';
  const [deleteStep, setDeleteStep] = useState(0);  // 0=ปิด, 1=ใส่เหตุผล, 2=ยืนยัน60วัน
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const handleConfirmDelete = async () => {
    setDeleting(true);
    const ok = await onSoftDelete(patient.id, deleteReason.trim());
    setDeleting(false);
    if (!ok) alert('ลบไม่สำเร็จ — ลองอีกครั้งหรือเช็ค console');
  };

  const exportCSV = () => {
    const rows = [['วันที่','BW','Vitals','ขนาดยา','Consult Type','Consult Note','DRP Code','DRP Note']];
    visits.forEach(v => {
      const vitalsStr = v.vitals?Object.entries(v.vitals).filter(([,val])=>val).map(([k,val])=>k+'='+val).join(' '):'';
      const hasDrp = (v.drp||[]).length > 0;
      const drpList = hasDrp ? v.drp : [{type:'',note:''}];
      drpList.forEach((d,i) => {
        rows.push([v.date, i===0?(v.weight||''):'', i===0?vitalsStr:'', i===0?(v.drugDoses||''):'', i===0?(v.consult?.type||''):'', i===0?(v.consult?.note||''):'', d.type||'', d.note||'']);
      });
    });
    const csv = rows.map(r=>r.map(c=>'"'+(String(c||'')).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=patient.name.replace(/ /g,'_')+'_pharm.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 tb-fade">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800 text-sm"><i className="fa-solid fa-chart-bar mr-2 text-teal-600"></i>สรุปการทำงานเภสัชกร</h3>
        <button type="button" onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"><i className="fa-solid fa-file-csv mr-1"></i>Export CSV</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Visit ทั้งหมด',value:visits.length,icon:'fa-calendar-check',color:'bg-teal-50 text-teal-600'},
          {label:'Consult',value:consults.length,icon:'fa-comments',color:'bg-amber-50 text-amber-600'},
          {label:'DRP พบ',value:drps.length,icon:'fa-circle-exclamation',color:'bg-red-50 text-red-600'},
          {label:'ADR บันทึก',value:adrFound.length,icon:'fa-heart-pulse',color:'bg-pink-50 text-pink-600'},
        ].map(k=>(
          <div key={k.label} className="p-4 rounded-2xl flex items-center gap-3 border border-gray-100 bg-white shadow-sm">
            <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 '+k.color}><i className={'fa-solid '+k.icon}></i></div>
            <div><p className="text-xs text-gray-500">{k.label}</p><p className="text-2xl font-bold text-gray-800">{k.value}</p></div>
          </div>
        ))}
      </div>
      {consults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100"><p className="text-xs font-bold text-amber-800"><i className="fa-solid fa-comments mr-1"></i>รายการ Consultation</p></div>
          <table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-500 border-b"><tr><th className="p-3 pl-4 text-left">วันที่</th><th className="p-3 text-left">ประเภท</th><th className="p-3 text-left">รายละเอียด</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{consults.map((v,i)=><tr key={i}><td className="p-3 pl-4 font-mono text-xs text-gray-500">{v.date}</td><td className="p-3 font-semibold text-amber-700 text-xs">{v.consult.type}</td><td className="p-3 text-xs text-gray-600">{v.consult.note||'-'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {drps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-red-50 px-4 py-2.5 border-b border-red-100"><p className="text-xs font-bold text-red-800"><i className="fa-solid fa-circle-exclamation mr-1"></i>Drug Related Problems</p></div>
          <table className="w-full text-sm"><thead className="bg-gray-50 text-xs text-gray-500 border-b"><tr><th className="p-3 pl-4 text-left">วันที่</th><th className="p-3 text-left">Code</th><th className="p-3 text-left">รายละเอียด</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{drps.map((d,i)=>{const info=(DRP_TYPES||[]).find(t=>t.code===d.type);return<tr key={i}><td className="p-3 pl-4 font-mono text-xs text-gray-500">{d.date}</td><td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{d.type||'-'}</span></td><td className="p-3 text-xs text-gray-600">{d.note||'-'}{info&&<span className="ml-1 text-gray-400 text-xs">({info.label})</span>}</td></tr>;})}</tbody>
          </table>
        </div>
      )}
      {adrFound.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-700 mb-3"><i className="fa-solid fa-heart-pulse mr-1 text-red-500"></i>ADR ที่บันทึกไว้</p>
          <div className="flex flex-wrap gap-2">{adrFound.map(a=><div key={a.key} className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl text-xs"><p className="font-bold text-red-700">{a.label}</p>{safeAdr[a.key]?.note&&<p className="text-gray-500 mt-0.5">{safeAdr[a.key].note}</p>}</div>)}</div>
        </div>
      )}
      {visits.length === 0 && <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูล Visit</p>}

      {/* ── โซนลบผู้ป่วย (ล่างสุด — ปุ่มเล็ก ชิดขวา) ── */}
      {onSoftDelete && (
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          {isAdmin ? (
            <button type="button" onClick={()=>{ setDeleteStep(1); setDeleteReason(''); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-200 transition-colors">
              <i className="fa-solid fa-trash"></i>ลบผู้ป่วย
            </button>
          ) : (
            <button type="button" disabled
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-xs font-semibold border border-gray-200 cursor-not-allowed">
              <i className="fa-solid fa-lock"></i>ลบผู้ป่วย (Admin)
            </button>
          )}
        </div>
      )}

      {/* ── Dialog 1: ใส่เหตุผล ── */}
      {deleteStep === 1 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><i className="fa-solid fa-triangle-exclamation"></i></div>
              <h3 className="font-bold text-gray-800">ยืนยันลบ "{patient.name}"?</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">ข้อมูลทั้งหมด (Visit, Lab, ADR, DOT) จะถูกย้ายไปถังขยะ</p>
            <label className="block text-xs font-bold text-gray-700 mb-1">เหตุผลในการลบ <span className="text-red-500">*</span></label>
            <textarea value={deleteReason} onChange={e=>setDeleteReason(e.target.value)} rows={3}
              placeholder="เช่น ข้อมูลซ้ำ, ย้ายไป รพ. อื่น, ลงผิดราย"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"/>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={()=>setDeleteStep(0)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">ยกเลิก</button>
              <button type="button" onClick={()=>setDeleteStep(2)} disabled={!deleteReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold">ถัดไป</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog 2: ยืนยันสุดท้าย 60 วัน ── */}
      {deleteStep === 2 && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><i className="fa-solid fa-trash-can"></i></div>
              <h3 className="font-bold text-gray-800">ลบไปถังขยะ 60 วัน</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900">
              <p className="font-bold mb-1"><i className="fa-solid fa-circle-info mr-1"></i>ข้อมูลจะถูกเก็บในถังขยะ 60 วัน</p>
              <p>• Admin สามารถกู้คืนได้ในระยะเวลานี้</p>
              <p>• หลัง 60 วัน ระบบจะลบถาวรอัตโนมัติ</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleConfirmDelete} disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {deleting ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังลบ...</> : 'ยืนยันลบ'}
              </button>
              <button type="button" onClick={()=>setDeleteStep(1)} disabled={deleting} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold disabled:opacity-50">ย้อนกลับ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// หน้าถังขยะ — list คนที่ลบแล้ว + Restore / Hard delete
// ─────────────────────────────────────────────────────
function TrashList({ currentUser, onRestore, onHardDelete }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);     // id ที่กำลังทำงาน (loading)
  const [hardDelTarget, setHardDelTarget] = useState(null);  // patient ที่จะลบถาวร
  const [confirmHn, setConfirmHn] = useState('');
  const [confirmCheck, setConfirmCheck] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const refresh = async () => {
    setLoading(true);
    const data = await window.loadTrashedPatients();
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  // คำนวณวันที่เหลือ (60 - days since deleted_at)
  const daysLeft = (deletedAt) => {
    if (!deletedAt) return 60;
    const elapsed = Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000);
    return Math.max(0, 60 - elapsed);
  };

  const handleRestore = async (id) => {
    setActionId(id);
    const ok = await onRestore(id);
    setActionId(null);
    if (ok) { refresh(); }
    else alert('กู้คืนไม่สำเร็จ');
  };

  const handleConfirmHardDelete = async () => {
    if (!hardDelTarget) return;
    setActionId(hardDelTarget.id);
    const ok = await onHardDelete(hardDelTarget.id);
    setActionId(null);
    if (ok) {
      setHardDelTarget(null);
      setConfirmHn(''); setConfirmCheck(false);
      refresh();
    } else {
      alert('ลบถาวรไม่สำเร็จ');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-trash text-amber-600 text-xl mt-0.5"></i>
          <div>
            <p className="font-bold text-amber-800 text-sm">ถังขยะ — ผู้ป่วยที่ถูกลบ</p>
            <p className="text-xs text-amber-700 mt-0.5">เก็บไว้ 60 วัน หลังจากนั้นจะลบถาวรอัตโนมัติ · กู้คืน/ลบถาวร = Admin เท่านั้น</p>
          </div>
        </div>
      </div>

      {loading && <p className="text-center text-gray-400 py-10"><i className="fa-solid fa-spinner fa-spin mr-2"></i>กำลังโหลด...</p>}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-inbox text-5xl mb-3 block"></i>
          <p className="text-sm">ถังขยะว่าง</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map(p => {
            const left = daysLeft(p.deletedAt);
            const isBusy = actionId === p.id;
            return (
              <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold flex-shrink-0">{(p.firstName||p.name||'?').substring(0,1)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{p.name} <span className="text-xs text-gray-400 font-mono ml-2">HN: {p.hn}</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ลบเมื่อ {new Date(p.deletedAt).toLocaleDateString('th-TH',{year:'numeric',month:'short',day:'numeric'})} ·
                    เหลือ <strong className={left<=7?'text-red-600':'text-amber-700'}>{left} วัน</strong>
                  </p>
                  {p.deleteReason && <p className="text-xs text-gray-600 mt-1 italic">เหตุผล: {p.deleteReason}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button type="button" disabled={isBusy} onClick={()=>handleRestore(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold border border-teal-200 disabled:opacity-50">
                      <i className="fa-solid fa-rotate-left"></i>กู้คืน
                    </button>
                    <button type="button" disabled={isBusy} onClick={()=>{ setHardDelTarget(p); setConfirmHn(''); setConfirmCheck(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-200 disabled:opacity-50">
                      <i className="fa-solid fa-fire"></i>ลบถาวร
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog ลบถาวร: พิมพ์ HN + checkbox ── */}
      {hardDelTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600"><i className="fa-solid fa-fire"></i></div>
              <h3 className="font-bold text-gray-800">ลบถาวร "{hardDelTarget.name}"</h3>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-xs text-red-900">
              <p className="font-bold mb-1"><i className="fa-solid fa-triangle-exclamation mr-1"></i>คำเตือน — กู้คืนไม่ได้</p>
              <p>ข้อมูลทั้งหมดของผู้ป่วยจะถูกลบออกจากระบบถาวร — กู้คืนไม่ได้แล้ว</p>
              <p className="mt-1">(จะมีการบันทึก audit log: ใคร/เมื่อไหร่/HN/ชื่อ ไว้ตรวจสอบ)</p>
            </div>

            <label className="block text-xs font-bold text-gray-700 mb-1">พิมพ์ HN เพื่อยืนยัน: <span className="font-mono text-red-600">{hardDelTarget.hn}</span></label>
            <input value={confirmHn} onChange={e=>setConfirmHn(e.target.value)} placeholder="พิมพ์ HN ที่นี่"
              className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400 mb-3"/>

            <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer mb-4">
              <input type="checkbox" checked={confirmCheck} onChange={e=>setConfirmCheck(e.target.checked)} className="mt-0.5"/>
              <span>ข้าพเจ้าเข้าใจว่าข้อมูลนี้จะถูกลบถาวรและกู้คืนไม่ได้</span>
            </label>

            <div className="flex gap-2">
              <button type="button" onClick={handleConfirmHardDelete}
                disabled={confirmHn !== hardDelTarget.hn || !confirmCheck || actionId===hardDelTarget.id}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold">
                {actionId===hardDelTarget.id ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังลบ...</> : 'ลบถาวร'}
              </button>
              <button type="button" onClick={()=>setHardDelTarget(null)} disabled={actionId===hardDelTarget.id}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// AdminUsersTab — จัดการผู้ใช้ (admin เท่านั้น) — embedded ใน dashboard
// ─────────────────────────────────────────────────────
const PROFESSION_LABELS_TH = {
  doctor:'แพทย์', dentist:'ทันตแพทย์', pharmacist:'เภสัชกร', nurse:'พยาบาลวิชาชีพ',
  medtech:'นักเทคนิคการแพทย์', physio:'นักกายภาพบำบัด', radio:'นักรังสีการแพทย์',
  publichealth:'เจ้าหน้าที่สาธารณสุข', officer:'เจ้าพนักงาน', other:'อื่นๆ',
};
const STATUS_STYLE = {
  pending:  { bg:'#fef3c7', fg:'#92400e', label:'⏳ รออนุมัติ' },
  approved: { bg:'#d1fae5', fg:'#065f46', label:'✅ อนุมัติแล้ว' },
  rejected: { bg:'#fee2e2', fg:'#991b1b', label:'❌ ปฏิเสธ' },
};

function AdminUsersTab({ currentUser, onPendingChange }) {
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');  // 'list' = แถวกะทัดรัด, 'card' = การ์ดละเอียด

  const load = async () => {
    setLoading(true);
    const { data } = await window._sb.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
    setLoading(false);
    // อัปเดต badge ใน sidebar
    if (onPendingChange) onPendingChange((data||[]).filter(p => p.status === 'pending').length);
  };
  useEffect(() => { load(); }, []);

  const handleApprove = async (userId) => {
    setBusy(true);
    const res = await fetch('/api/admin/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setBusy(false);
    if (res.ok) { alert('อนุมัติเรียบร้อยค่ะ — ส่งเมลแจ้ง user แล้ว'); load(); }
    else { const e = await res.json(); alert('Error: ' + e.error); }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return alert('กรุณาระบุเหตุผล');
    setBusy(true);
    const res = await fetch('/api/admin/reject', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: rejectingId, reason: rejectReason }),
    });
    setBusy(false);
    if (res.ok) { alert('ปฏิเสธเรียบร้อย — ส่งเมลแจ้ง user แล้ว'); setRejectingId(null); setRejectReason(''); load(); }
    else { const e = await res.json(); alert('Error: ' + e.error); }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-16">
        <i className="fa-solid fa-lock text-5xl text-red-400 mb-3"></i>
        <p className="text-sm text-gray-500">เฉพาะ Admin เท่านั้น</p>
      </div>
    );
  }

  const counts = {
    pending: profiles.filter(p => p.status === 'pending').length,
    approved: profiles.filter(p => p.status === 'approved').length,
    rejected: profiles.filter(p => p.status === 'rejected').length,
  };
  const searchLower = search.trim().toLowerCase();
  const filtered = (filter === 'all' ? profiles : profiles.filter(p => p.status === filter))
    .filter(p => {
      if (!searchLower) return true;
      const hay = `${p.first_name||''} ${p.last_name||''} ${p.username||''} ${p.email||''} ${p.hospital_name||''} ${p.license_number||''}`.toLowerCase();
      return hay.includes(searchLower);
    });

  return (
    <div className="space-y-4 tb-fade">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <i className="fa-solid fa-user-shield text-2xl"></i>
          </div>
          <div>
            <h2 className="font-bold text-lg">จัดการผู้ใช้</h2>
            <p className="text-xs text-teal-100">อนุมัติหรือปฏิเสธคำขอสมัครสมาชิก · มองเห็นเฉพาะ Admin</p>
          </div>
        </div>
      </div>

      {/* Filter cards — compact, hover-state, ข้อความตรงกลาง
           Roadmap: ในอนาคตเพิ่ม view mode (list/grid/timeline) ดูที่ pending master ข้อ 30 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { key:'pending',  label:'รออนุมัติ',  count:counts.pending,  color:'#f59e0b', bg:'#fef3c7', hover:'#fde68a', icon:'fa-clock' },
          { key:'approved', label:'อนุมัติแล้ว', count:counts.approved, color:'#0d9488', bg:'#ccfbf1', hover:'#99f6e4', icon:'fa-check-circle' },
          { key:'rejected', label:'ปฏิเสธ',     count:counts.rejected, color:'#ef4444', bg:'#fee2e2', hover:'#fecaca', icon:'fa-circle-xmark' },
          { key:'all',      label:'ทั้งหมด',     count:profiles.length, color:'#0f766e', bg:'#f0fdfa', hover:'#ccfbf1', icon:'fa-layer-group' },
        ].map(c => {
          const active = filter === c.key;
          return (
            <button key={c.key} type="button" onClick={()=>setFilter(c.key)}
              className="rounded-xl px-3 py-2.5 transition-all border"
              style={{
                background: active ? c.color : '#fff',
                borderColor: active ? c.color : '#e5e7eb',
                boxShadow: active ? '0 4px 12px '+c.color+'40' : 'none',
              }}
              onMouseEnter={e=>{ if(!active) e.currentTarget.style.background = c.hover; }}
              onMouseLeave={e=>{ if(!active) e.currentTarget.style.background = '#fff'; }}>
              <div className="flex items-center justify-center gap-2">
                <i className={'fa-solid '+c.icon} style={{ fontSize:'13px', color: active ? '#fff' : c.color }}></i>
                <span className="text-sm font-bold" style={{ color: active ? '#fff' : '#374151' }}>{c.label}</span>
                <span className="text-sm font-bold px-1.5 rounded-md"
                      style={{ background: active ? 'rgba(255,255,255,0.25)' : c.bg, color: active ? '#fff' : c.color }}>
                  {c.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + view mode toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ / username / email / รพ. / เลขใบประกอบ"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-400 bg-white"/>
        </div>
        <div className="flex bg-white rounded-xl border border-gray-200 p-1">
          {[
            { key:'list', icon:'fa-list', title:'มุมมองรายการ (กะทัดรัด)' },
            { key:'card', icon:'fa-grip', title:'มุมมองการ์ด (ละเอียด)' },
          ].map(v => (
            <button key={v.key} type="button" onClick={()=>setViewMode(v.key)} title={v.title}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ background: viewMode===v.key ? '#0f766e' : 'transparent', color: viewMode===v.key ? '#fff' : '#6b7280' }}>
              <i className={'fa-solid '+v.icon}></i>
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">{filtered.length} คน</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-spinner fa-spin text-3xl mb-2 block text-teal-500"></i>
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <i className="fa-solid fa-inbox text-5xl text-gray-300 mb-3 block"></i>
          <p className="text-sm text-gray-400">{search ? 'ไม่พบผู้ใช้ตามคำค้นหา' : 'ไม่มีผู้ใช้ในหมวดนี้'}</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ── List view: แถวกะทัดรัด เหมาะกับเยอะๆ ── */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500">
            <div className="col-span-3">ชื่อ</div>
            <div className="col-span-2">วิชาชีพ</div>
            <div className="col-span-3">โรงพยาบาล / แผนก</div>
            <div className="col-span-2">สถานะ</div>
            <div className="col-span-2 text-right">การกระทำ</div>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.map(p => {
              const sc = STATUS_STYLE[p.status];
              const dept = p.department === 'อื่นๆ' ? (p.department_other || 'อื่นๆ') : p.department;
              return (
                <div key={p.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-teal-50/40 transition-colors text-sm">
                  <div className="col-span-3 min-w-0">
                    <p className="font-bold text-teal-900 truncate">{p.first_name} {p.last_name} {p.role === 'admin' && <span className="text-xs">👑</span>}</p>
                    <p className="text-xs text-gray-400 truncate">@{p.username} · {p.email || '—'}</p>
                  </div>
                  <div className="col-span-2 text-xs text-gray-600 truncate">
                    <p>{PROFESSION_LABELS_TH[p.profession] || p.profession}</p>
                    {p.license_number && <p className="text-gray-400">{p.license_number}</p>}
                  </div>
                  <div className="col-span-3 text-xs text-gray-600 truncate">
                    <p className="truncate">{p.hospital_name}</p>
                    <p className="text-gray-400 truncate">{dept}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md inline-block" style={{ background:sc.bg, color:sc.fg }}>{sc.label}</span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1.5">
                    {p.status === 'pending' && (
                      <>
                        <button type="button" onClick={()=>handleApprove(p.id)} disabled={busy}
                          className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50" title="อนุมัติ">
                          <i className="fa-solid fa-check"></i>
                        </button>
                        <button type="button" onClick={()=>{ setRejectingId(p.id); setRejectReason(''); }} disabled={busy}
                          className="px-2.5 py-1 rounded-lg font-bold text-white text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50" title="ปฏิเสธ">
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Card view: ละเอียด เหมือนเดิม ── */
        <div className="space-y-3">
          {filtered.map(p => {
            const sc = STATUS_STYLE[p.status];
            const dept = p.department === 'อื่นๆ' ? (p.department_other || 'อื่นๆ') : p.department;
            return (
              <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-bold text-teal-900">{p.first_name} {p.last_name}</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background:sc.bg, color:sc.fg }}>{sc.label}</span>
                      {p.role === 'admin' && <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">👑 Admin</span>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {PROFESSION_LABELS_TH[p.profession] || p.profession}
                      {p.license_number && ` · ${p.license_number}`}
                    </p>
                  </div>
                  {p.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button type="button" onClick={() => handleApprove(p.id)} disabled={busy}
                        className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50">
                        <i className="fa-solid fa-check mr-1"></i>อนุมัติ
                      </button>
                      <button type="button" onClick={() => { setRejectingId(p.id); setRejectReason(''); }} disabled={busy}
                        className="px-4 py-2 rounded-xl font-bold text-white text-xs bg-red-500 hover:bg-red-600 disabled:opacity-50">
                        <i className="fa-solid fa-xmark mr-1"></i>ปฏิเสธ
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs pt-3 border-t border-gray-100">
                  <Field label="โรงพยาบาล" value={p.hospital_name} />
                  <Field label="ประเภท" value={p.hospital_type} />
                  <Field label="แผนก" value={dept} />
                  <Field label="Username" value={p.username} />
                  <Field label="Email" value={p.email || '—'} />
                  <Field label="เบอร์โทร" value={p.phone || '—'} />
                </div>
                {p.status === 'rejected' && p.rejected_reason && (
                  <div className="mt-3 p-3 rounded-xl text-xs bg-red-50 text-red-800 border border-red-100">
                    <strong>เหตุผลปฏิเสธ:</strong> {p.rejected_reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-red-700 mb-2">
              <i className="fa-solid fa-circle-xmark mr-2"></i>ปฏิเสธคำขอสมัคร
            </h3>
            <p className="text-xs text-gray-500 mb-3">กรุณาระบุเหตุผล (จะแจ้งผู้สมัครทางเมล)</p>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={4}
              placeholder="เช่น ข้อมูลไม่ครบถ้วน, ไม่ใช่บุคลากรในระบบ ฯลฯ"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 bg-gray-50"/>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={()=>{ setRejectingId(null); setRejectReason(''); }} disabled={busy}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">ยกเลิก</button>
              <button type="button" onClick={submitReject} disabled={busy || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                {busy ? <><i className="fa-solid fa-spinner fa-spin mr-1"></i>กำลังส่ง...</> : 'ยืนยันปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold mt-0.5 text-gray-800">{value}</p>
    </div>
  );
}

Object.assign(window,{DoseCalculator,DOTCalendar,DrugInteractionPanel,RegimenHistoryTab,NotificationPanel,NotificationFullModal,AddPatientPage,ClinicalModal,InfoBar,LabTab,ADRTab,TimelineTab,DiagnosisTab,MedsTab,PharmSummaryTab,TrashList,AdminUsersTab,ConfirmModal,hasResistance,afbCombined,isAfbPositive,getSputumConversion,isDelayedConversion});
