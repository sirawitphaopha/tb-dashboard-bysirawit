'use client'
/**
 * parts/notifications.jsx — domain: การแจ้งเตือน (app-level bell)
 * ย้ายจาก tb-monolith.jsx (แยกรอบ 2) — โค้ดเดิม ไม่แก้ logic
 *   useNotifHelpers (internal), NotificationPanel, NotificationFullModal
 * deps: shared (useModalAnim, AvatarCircle) · React.useMemo · รับข้อมูลผ่าน props ทั้งหมด
 */
import * as React from 'react'
import { useModalAnim, AvatarCircle, nameInitials } from './shared'

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
    else if(a.navTarget&&onNavTarget){onNavTarget(a.navTarget,a.highlightUser,a);if(onClose)onClose();}
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
            {a.actorName
              ? <AvatarCircle urlKey={a.actorAvatarUrl} updatedAt={a.actorAvatarAt} name={a.actorName} colorKey={a.actorId} fallback={nameInitials(a.actorName)} size={32} style={{marginTop:'2px'}} />
              : (isAdmin && <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fa-solid fa-user-shield text-sm"></i></div>)}
            <div className="flex-1 min-w-0">
              {isAdmin && !a.actorName && <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-0.5">Admin · จัดการผู้ใช้</p>}
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
  const {closing, close, modalCls, overlayCls} = useModalAnim(onClose);
  const {sorted,renderItem}=useNotifHelpers(alerts,patients,readAlerts,onRead,onOpen,close,onNavTarget);
  return(
    <div className={"fixed inset-0 z-50 flex items-center justify-center p-4 "+overlayCls} style={{background:'rgba(0,0,0,0.45)'}}>
      <div className={"bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden "+modalCls} style={{width:'min(90vw,920px)',maxHeight:'82vh'}}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-800">การแจ้งเตือนทั้งหมด</h2>
            <p className="text-xs text-gray-400 mt-0.5">ยังไม่อ่าน {unread} รายการ &nbsp;·&nbsp; ทั้งหมด {alerts.length} รายการ</p>
          </div>
          <div className="flex items-center gap-3">
            {alerts.length>0&&<button type="button" onClick={onReadAll} className="text-sm text-gray-400 hover:text-teal-600 transition-colors font-medium"><i className="fa-solid fa-check-double mr-1"></i>ล้างทั้งหมด</button>}
            <button type="button" onClick={close} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>
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

export { NotificationPanel, NotificationFullModal }
