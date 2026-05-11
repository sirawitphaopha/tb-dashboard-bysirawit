
// tb-app.jsx — App shell, pages, AdminSettings
const { useState, useEffect, useRef } = React;

// ===================== STATUS BADGE =====================
function StatusBadge({ status }) {
  if (status === 'critical') return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit animate-pulse"><i className="fa-solid fa-triangle-exclamation"></i>Lab ผิดปกติ</span>;
  if (status === 'warning') return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">⚠ ติดตาม</span>;
  return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">✓ ปกติ</span>;
}

// ===================== DASHBOARD =====================
function Dashboard({ patients }) {
  const barRef = useRef(null); const pieRef = useRef(null);
  const active = patients.filter(p => p.status !== 'done');
  const criticals = patients.filter(p => p.status === 'critical');
  const intensive = patients.filter(p => p.phase === 'Intensive').length;
  const cont = patients.filter(p => p.phase === 'Continuation').length;

  useEffect(() => {
    if (!barRef.current) return;
    const c = new Chart(barRef.current, {
      type: 'bar',
      data: { labels:['พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.'], datasets:[{ label:'รายใหม่', data:[15,20,18,25,22,patients.length], backgroundColor:'#0d9488', borderRadius:6, hoverBackgroundColor:'#0f766e' }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11}}},x:{ticks:{font:{size:11}}}} }
    });
    return () => c.destroy();
  }, [patients.length]);

  useEffect(() => {
    if (!pieRef.current) return;
    const c = new Chart(pieRef.current, {
      type: 'doughnut',
      data: { labels:['Intensive','Continuation','MDR-TB'], datasets:[{ data:[intensive,cont,0], backgroundColor:['#f59e0b','#10b981','#ef4444'], borderWidth:0, hoverOffset:4 }] },
      options: { responsive:true, maintainAspectRatio:false, cutout:'72%', plugins:{legend:{position:'right',labels:{font:{size:11},boxWidth:10,padding:8}}} }
    });
    return () => c.destroy();
  }, [intensive, cont]);

  const kpis = [
    { label:'ขึ้นทะเบียนทั้งหมด', value:(2538+patients.length).toLocaleString(), icon:'fa-users', color:'bg-blue-50 text-blue-600' },
    { label:'กำลังรักษา (Active)', value:active.length, icon:'fa-lungs', color:'bg-teal-50 text-teal-600' },
    { label:'รักษาหาย (Success)', value:'2,310', icon:'fa-check-double', color:'bg-green-50 text-green-600' },
    { label:'Lab ผิดปกติ / ADR', value:criticals.length, icon:'fa-flask-vial', color:'bg-red-50 text-red-600', alert:criticals.length>0 },
  ];

  return (
    <div className="space-y-6 tb-fade">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map(k => (
          <div key={k.label} className={`bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow border ${k.alert?'border-red-200':'border-gray-100'}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${k.color}`}><i className={`fa-solid ${k.icon}`}></i></div>
            <div><p className="text-xs text-gray-500 font-medium leading-tight">{k.label}</p><p className={`text-3xl font-bold mt-0.5 ${k.alert?'text-red-600':'text-gray-900'}`}>{k.value}</p></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <h2 className="text-sm font-bold text-gray-800 mb-4">แนวโน้มผู้ป่วยใหม่ (รายเดือน)</h2>
          <div className="h-52"><canvas ref={barRef}></canvas></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 mb-4">สัดส่วนตามระยะ (Phase)</h2>
          <div className="h-52"><canvas ref={pieRef}></canvas></div>
        </div>
      </div>
      {criticals.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl">
          <h3 className="font-bold text-red-700 text-sm mb-3"><i className="fa-solid fa-triangle-exclamation mr-2"></i>เคสที่ต้องดูแลด่วน ({criticals.length} ราย)</h3>
          <div className="space-y-2">
            {criticals.map(p => { const last = p.labs[p.labs.length-1]; return (
              <div key={p.id} className="bg-white border border-red-100 p-3 rounded-xl flex justify-between items-center">
                <div><p className="font-bold text-gray-800 text-sm">{p.name}</p><p className="text-xs text-red-600 mt-0.5">ALT {last?.alt} U/L · นัด {p.nextAppt}</p></div>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">ด่วน</span>
              </div>
            );})}
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== PATIENT LIST =====================
function PatientList({ patients, onAdd, onOpen, settings }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const ok = !q || p.name.toLowerCase().includes(q) || p.hn.includes(q) || (p.armyId||'').includes(q) || (p.subdistrict||'').includes(q);
    const fs = filter==='all' || (filter==='intensive'&&p.phase==='Intensive') || (filter==='continuation'&&p.phase==='Continuation') || (filter==='critical'&&p.status==='critical');
    return ok && fs;
  });

  return (
    <div className="space-y-5 tb-fade">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-3 flex-1 mr-4">
          <div className="relative flex-1 max-w-sm">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา HN, ชื่อ, เลขกองทัพ, ตำบล..." className="w-full p-2.5 pl-9 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-teal-200 outline-none text-sm"/>
            <i className="fa-solid fa-search absolute left-3 top-3 text-gray-400 text-xs"></i>
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 outline-none text-sm">
            <option value="all">สถานะทั้งหมด</option>
            <option value="intensive">Intensive Phase</option>
            <option value="continuation">Continuation Phase</option>
            <option value="critical">Lab ผิดปกติ</option>
          </select>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-teal-200 transition-all text-sm whitespace-nowrap">
          <i className="fa-solid fa-user-plus mr-2"></i>ลงทะเบียนผู้ป่วยใหม่
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold">HN / ID</th>
              <th className="p-4 font-semibold">ชื่อ-นามสกุล</th>
              <th className="p-4 font-semibold">อายุ / ตำบล</th>
              <th className="p-4 font-semibold">สูตรยา / ระยะ</th>
              <th className="p-4 font-semibold">น้ำหนัก</th>
              <th className="p-4 font-semibold">Adherence</th>
              <th className="p-4 font-semibold">สถานะ</th>
              <th className="p-4 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-10 text-center text-gray-400"><i className="fa-solid fa-user-slash text-2xl mb-2 block text-gray-300"></i>ไม่พบผู้ป่วยที่ค้นหา</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} onClick={() => onOpen(p)} className={`hover:bg-teal-50/40 transition-colors cursor-pointer group ${p.status==='critical'?'hover:bg-red-50/40':''}`}>
                <td className="p-4 font-mono text-gray-500 text-xs">{p.hn}<br/><span className="text-gray-400">{p.armyId}</span></td>
                <td className="p-4">
                  <p className="font-bold text-gray-800 group-hover:text-teal-700">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.patientType||'New'} · {p.diseaseLocation||'Pulmonary'}</p>
                </td>
                <td className="p-4 text-xs text-gray-500">
                  {p.age ? <p>{p.age} ปี · {p.gender==='M'?'ชาย':'หญิง'}</p> : null}
                  {p.subdistrict ? <p className="text-teal-600 font-medium">ต.{p.subdistrict}</p> : null}
                </td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-xs">{p.regimen}</span>
                  <br/><span className="text-xs text-teal-600 mt-0.5 inline-block">{p.phase} M{p.month}</span>
                </td>
                <td className="p-4">{p.weight} kg</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-14 overflow-hidden">
                      <div className={`h-1.5 rounded-full ${p.adherence>=90?'bg-green-500':p.adherence>=70?'bg-amber-500':'bg-red-500'}`} style={{width:`${p.adherence}%`}}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-8">{p.adherence}%</span>
                  </div>
                </td>
                <td className="p-4"><StatusBadge status={p.status}/></td>
                <td className="p-4 text-center">
                  <button onClick={e => { e.stopPropagation(); onOpen(p); }} className="text-teal-400 hover:text-teal-700 transition-colors p-1"><i className="fa-solid fa-file-medical"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-slate-50/50 border-t border-gray-100 text-xs text-gray-400 text-right">แสดง {filtered.length} จาก {patients.length} ราย</div>
      </div>

      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)} onAdd={onAdd} settings={settings}/>}
    </div>
  );
}

// ===================== WEEKLY PREP =====================
function WeeklyPrep({ patients, onOpen }) {
  const upcoming = patients.filter(p => p.daysUntil <= 7).sort((a, b) => a.daysUntil - b.daysUntil);
  const [printed, setPrinted] = useState(false);
  return (
    <div className="space-y-5 tb-fade">
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 p-6 rounded-2xl text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-1">คิวเตรียมยา: สัปดาห์นี้</h2>
          <p className="text-teal-100 text-sm"><i className="fa-solid fa-circle-info mr-1"></i>ดึงผู้ป่วยนัดล่วงหน้า 7 วันอัตโนมัติ — {upcoming.length} ราย</p>
        </div>
        <button onClick={() => { setPrinted(true); setTimeout(() => setPrinted(false),2000); }}
          className={`px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors text-sm ${printed?'bg-teal-900 text-teal-300':'bg-white text-teal-800 hover:bg-teal-50'}`}>
          {printed ? <><i className="fa-solid fa-check mr-2"></i>ส่งไปยังเครื่องพิมพ์</> : <><i className="fa-solid fa-print mr-2"></i>พิมพ์ใบจัดยา</>}
        </button>
      </div>
      {upcoming.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center text-gray-400 border border-gray-100"><i className="fa-solid fa-calendar-check text-4xl mb-3 block text-gray-300"></i>ไม่มีนัดในสัปดาห์นี้</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {upcoming.map(p => {
            const doses = calcDoses(p.weight, p.regimen, p.customDoses);
            const last = p.labs[p.labs.length-1];
            const isCrit = p.status === 'critical';
            return (
              <div key={p.id} className={`bg-white p-5 rounded-2xl shadow-sm border space-y-4 relative overflow-hidden ${isCrit?'border-red-200':'border-gray-200'}`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${isCrit?'bg-red-500':p.daysUntil<=2?'bg-amber-400':'bg-green-500'}`}></div>
                <div className="pl-2 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">HN: {p.hn} · {p.weight}kg · {p.regimen}</p>
                    {p.subdistrict && <p className="text-xs text-teal-600 font-medium mt-0.5">ต.{p.subdistrict}</p>}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-sm font-bold ${p.daysUntil<=1?'text-red-600':'text-teal-700'}`}>นัด {p.nextAppt}</p>
                    <p className="text-xs text-gray-400">{p.daysUntil<=1?'🔴 พรุ่งนี้!':p.daysUntil<=3?`⚠ อีก ${p.daysUntil} วัน`:`อีก ${p.daysUntil} วัน`}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-xs grid grid-cols-2 gap-1.5">
                  {doses.map(d => (
                    <div key={d.key} className="flex justify-between items-center">
                      <span className="text-gray-500">{d.name.split('(')[0].trim()}</span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded ${d.status==='ok'?'bg-green-100 text-green-700':d.status==='high'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{d.tabs} tab ×30</span>
                    </div>
                  ))}
                </div>
                {isCrit && last && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-800 mb-1"><i className="fa-solid fa-triangle-exclamation mr-1"></i>Critical Alert:</p>
                    <p className="text-sm text-red-700 font-semibold">ALT = {last.alt} U/L — HOLD ยาทั้งหมด</p>
                  </div>
                )}
                <button onClick={() => onOpen(p)} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${isCrit?'bg-red-600 hover:bg-red-700 text-white':'bg-gray-50 hover:bg-teal-50 text-teal-700 border border-gray-200'}`}>
                  เตรียมเคส / ดูประวัติ <i className="fa-solid fa-arrow-right ml-1"></i>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== REPORTS =====================
function Reports({ patients }) {
  const [fb, setFb] = useState(null);
  const sim = t => { setFb(t); setTimeout(() => setFb(null), 2000); };
  const avgAdh = patients.length ? Math.round(patients.reduce((s,p) => s+p.adherence, 0) / patients.length) : 0;

  const allConsults = patients.flatMap(p => (p.visits||[]).filter(v=>v.consult?.type).map(v=>({...v, patientName:p.name, hn:p.hn})));
  const allDrps = patients.flatMap(p => (p.visits||[]).flatMap(v=>(v.drp||[]).map(d=>({...d, date:v.date, patientName:p.name, hn:p.hn}))));

  const exportAllDRP = () => {
    const rows = [['HN','ชื่อผู้ป่วย','วันที่','DRP Code','รายละเอียด DRP']];
    allDrps.forEach(d => rows.push([d.hn, d.patientName, d.date, d.type||'', d.note||'']));
    const csv = rows.map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='DRP_all_cases.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportDiagnosis = () => {
    const rows = [['HN','ชื่อผู้ป่วย','เดือนที่','วันที่','Specimen','AFB','Molecular Type','MTB Result','RIF','INH','SLD FLQS','SLD AG/CP','SLD ETO']];
    patients.forEach(p => {
      (p.sputum||[]).forEach(s => {
        const afb = (s.afbSamples&&s.afbSamples.length>0)
          ? s.afbSamples.filter(x=>x.result).map(x=>x.result==='Scanty'&&x.scantyCount?'Scanty '+x.scantyCount+' cells':x.result).join(' / ')
          : (s.result||'-');
        rows.push([
          p.hn, p.name,
          s.tp==='M0'?'วินิจฉัย':s.tp,
          s.date||'',
          s.specimenType||'Sputum',
          afb,
          s.molecType||'',
          s.mtbResult||s.genexpert||'',
          s.rifResult||'',
          s.inhResult||'',
          s.sldResults?.flqs||'',
          s.sldResults?.agcp||'',
          s.sldResults?.eto||'',
        ]);
      });
    });
    const csv = rows.map(r=>r.map(c=>'"'+(String(c||'')).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='Diagnosis_all_cases.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllConsult = () => {
    const rows = [['HN','ชื่อผู้ป่วย','วันที่','ประเภท Consult','รายละเอียด']];
    allConsults.forEach(v => rows.push([v.hn, v.patientName, v.date, v.consult?.type||'', v.consult?.note||'']));
    const csv = rows.map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='Consult_all_cases.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 tb-fade">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-file-excel"></i></div>
            <h3 className="font-bold text-gray-800">รายงาน Adherence & ทะเบียนผู้ป่วย</h3>
            <p className="text-sm text-gray-500 mt-2">สรุปรายชื่อผู้ป่วยทั้งหมด พร้อม Pill Count และประวัติขาดนัด</p>
            <div className="mt-3 bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">ผู้ป่วยทั้งหมด: <strong>{patients.length}</strong></div>
              <div className="text-gray-500">Adherence เฉลี่ย: <strong className={avgAdh>=90?'text-green-600':'text-amber-600'}>{avgAdh}%</strong></div>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <select className="p-2 border border-gray-200 rounded-lg text-sm flex-1 bg-gray-50"><option>ตุลาคม 2567</option><option>กันยายน 2567</option></select>
            <button onClick={() => sim('excel')} className={'px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors '+(fb==='excel'?'bg-green-700':'bg-green-600 hover:bg-green-700')}>
              {fb==='excel' ? <><i className="fa-solid fa-check mr-1"></i>ส่งออกแล้ว!</> : 'Export Excel'}
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-file-pdf"></i></div>
            <h3 className="font-bold text-gray-800">รายงานผลข้างเคียง (ADR & Lab)</h3>
            <p className="text-sm text-gray-500 mt-2">สรุปเคส Drug-Induced Hepatitis, Hyperuricemia, Visual loss</p>
            <div className="mt-3 bg-slate-50 p-3 rounded-xl text-sm">
              <span className="text-gray-500">เคส ADR: <strong className="text-red-600">{patients.filter(p=>p.status==='critical').length} ราย</strong></span>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <select className="p-2 border border-gray-200 rounded-lg text-sm flex-1 bg-gray-50"><option>ไตรมาส 3/2567</option></select>
            <button onClick={() => sim('pdf')} className={'px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors '+(fb==='pdf'?'bg-red-700':'bg-red-600 hover:bg-red-700')}>
              {fb==='pdf' ? <><i className="fa-solid fa-check mr-1"></i>ส่งออกแล้ว!</> : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Diagnosis Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-teal-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-microscope"></i></div>
            <h3 className="font-bold text-gray-800">ส่งออกผล Diagnosis ทุกเคส</h3>
            <p className="text-sm text-gray-500 mt-2">AFB, GeneXpert-PCR, RIF/INH Resistance, SLD ทุกผู้ป่วย</p>
            <div className="mt-3 bg-teal-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">ผู้ป่วยที่มีผล Dx: <strong className="text-teal-700">{patients.filter(p=>(p.sputum||[]).length>0).length} ราย</strong></div>
              <div className="text-gray-500">รายการทั้งหมด: <strong className="text-teal-700">{patients.reduce((s,p)=>s+(p.sputum||[]).length,0)} รายการ</strong></div>
            </div>
          </div>
          <button type="button" onClick={exportDiagnosis} className="mt-5 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors">
            <i className="fa-solid fa-file-csv mr-2"></i>Export Diagnosis ทุกเคส (.csv)
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-red-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-biohazard"></i></div>
            <h3 className="font-bold text-gray-800">เคสดื้อยา (Drug Resistant TB)</h3>
            <p className="text-sm text-gray-500 mt-2">รายชื่อผู้ป่วยที่พบ RIF / INH / SLD resistant</p>
            <div className="mt-3 bg-red-50 p-3 rounded-xl text-sm">
              <span className="text-gray-500">เคส Resistant: <strong className="text-red-600">{patients.filter(p=>p.hasResistance||(p.sputum||[]).some(s=>s.rifResult==='RIF resistant'||s.inhResult==='INH resistant')).length} ราย</strong></span>
            </div>
          </div>
          <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
            {patients.filter(p=>p.hasResistance||(p.sputum||[]).some(s=>s.rifResult==='RIF resistant'||s.inhResult==='INH resistant')).map(p=>(
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700">{p.name}</span>
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  {(p.sputum||[]).some(s=>s.rifResult==='RIF resistant')?'RIF-R':''}{(p.sputum||[]).some(s=>s.inhResult==='INH resistant')?' INH-R':''}
                </span>
              </div>
            ))}
            {patients.filter(p=>p.hasResistance||(p.sputum||[]).some(s=>s.rifResult==='RIF resistant'||s.inhResult==='INH resistant')).length===0&&<p className="text-xs text-gray-400 text-center">ไม่พบเคสดื้อยา</p>}
          </div>
        </div>
      </div>

      {/* DRP + Consult System-wide Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-amber-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-comments"></i></div>
            <h3 className="font-bold text-gray-800">สรุป Consultation ทุกเคส</h3>
            <p className="text-sm text-gray-500 mt-2">รวม Consult ทุก Visit ของทุกผู้ป่วย แยกประเภท</p>
            <div className="mt-3 bg-amber-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Consult ทั้งหมด: <strong className="text-amber-700">{allConsults.length} รายการ</strong></div>
              <div className="text-gray-500">ผู้ป่วยที่มี: <strong>{new Set(allConsults.map(c=>c.hn)).size} ราย</strong></div>
            </div>
          </div>
          <button type="button" onClick={exportAllConsult} className="mt-5 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-colors">
            <i className="fa-solid fa-file-csv mr-2"></i>Export Consult ทุกเคส (.csv)
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-red-200 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-xl mb-4"><i className="fa-solid fa-circle-exclamation"></i></div>
            <h3 className="font-bold text-gray-800">สรุป DRP ทุกเคส</h3>
            <p className="text-sm text-gray-500 mt-2">Drug Related Problems ทุก Visit ทุกผู้ป่วย แยก C-code</p>
            <div className="mt-3 bg-red-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">DRP ทั้งหมด: <strong className="text-red-700">{allDrps.length} รายการ</strong></div>
              <div className="text-gray-500">ผู้ป่วยที่มี: <strong>{new Set(allDrps.map(d=>d.hn)).size} ราย</strong></div>
            </div>
          </div>
          <button type="button" onClick={exportAllDRP} className="mt-5 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors">
            <i className="fa-solid fa-file-csv mr-2"></i>Export DRP ทุกเคส (.csv)
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200">
        <h3 className="font-bold text-gray-800 text-sm mb-4"><i className="fa-solid fa-chart-bar mr-2 text-teal-600"></i>Adherence รายผู้ป่วย</h3>
        <div className="space-y-3">
          {patients.map(p => (
            <div key={p.id} className="flex items-center gap-4">
              <div className="w-44 text-sm font-medium text-gray-700 truncate flex-shrink-0">{p.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                <div className={'h-5 rounded-full flex items-center justify-end pr-2 '+(p.adherence>=90?'bg-green-500':p.adherence>=70?'bg-amber-400':'bg-red-400')} style={{width:p.adherence+'%',transition:'width 0.7s ease'}}>
                  <span className="text-white text-xs font-bold">{p.adherence}%</span>
                </div>
              </div>
              <StatusBadge status={p.status}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== ADMIN SETTINGS =====================
function AdminSettings({ settings, setSettings }) {
  const [newComorbidity, setNewComorbidity] = useState('');
  const [newDrug, setNewDrug] = useState('');
  const [newLabField, setNewLabField] = useState({ label:'', key:'', unit:'', lo:'', hi:'', group:'lft' });
  const [activeTab, setActiveTab] = useState('comorbidity');

  const addComorbidity = () => {
    const v = newComorbidity.trim();
    if (!v || settings.comorbidities.includes(v)) return;
    setSettings(s => ({ ...s, comorbidities: [...s.comorbidities, v] }));
    setNewComorbidity('');
  };
  const removeComorbidity = c => setSettings(s => ({ ...s, comorbidities: s.comorbidities.filter(x => x !== c) }));

  const addDrug = () => {
    const v = newDrug.trim();
    if (!v || settings.drugs.includes(v)) return;
    setSettings(s => ({ ...s, drugs: [...s.drugs, v] }));
    setNewDrug('');
  };
  const removeDrug = d => setSettings(s => ({ ...s, drugs: s.drugs.filter(x => x !== d) }));

  const addLabField = () => {
    if (!newLabField.label.trim() || !newLabField.key.trim()) return;
    const key = newLabField.key.trim().toLowerCase().replace(/\s/g,'_');
    const field = { key, label: newLabField.label, unit: newLabField.unit, lo: +newLabField.lo||0, hi: +newLabField.hi||999, critical: null };
    setSettings(s => {
      const labs = s.labGroups ? s.labGroups.map(g => g.id === newLabField.group ? {...g, fields:[...g.fields, field]} : g) : LAB_GROUPS.map(g => g.id === newLabField.group ? {...g, fields:[...g.fields, field]} : g);
      return { ...s, labGroups: labs };
    });
    setNewLabField({ label:'', key:'', unit:'', lo:'', hi:'', group:'lft' });
  };
  const removeLabField = (groupId, fieldKey) => {
    setSettings(s => {
      const base = s.labGroups || LAB_GROUPS;
      return { ...s, labGroups: base.map(g => g.id === groupId ? {...g, fields: g.fields.filter(f => f.key !== fieldKey)} : g) };
    });
  };

  const TagPill = ({ label, onRemove }) => (
    <span className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:border-red-300 group transition-colors">
      {label}
      <button onClick={onRemove} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400"><i className="fa-solid fa-xmark text-xs"></i></button>
    </span>
  );

  const adminTabs = [
    { id:'comorbidity', label:'โรคประจำตัว', icon:'fa-heart-pulse' },
    { id:'drugs', label:'ยาโรคร่วม', icon:'fa-capsules' },
    { id:'lab', label:'ค่า Lab', icon:'fa-flask' },
    { id:'regimen', label:'สูตรยา', icon:'fa-pills' },
    { id:'interaction', label:'Drug Interaction', icon:'fa-triangle-exclamation' },
    { id:'consult', label:'Consult / DRP', icon:'fa-comments' },
  ];

  const effectiveLabGroups = settings.labGroups || LAB_GROUPS;

  return (
    <div className="space-y-5 tb-fade">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
        <i className="fa-solid fa-shield-halved text-amber-500 text-xl"></i>
        <div><p className="font-bold text-amber-800 text-sm">Admin Settings</p><p className="text-xs text-amber-600">การเปลี่ยนแปลงมีผลทันที — มองเห็นเฉพาะ Admin</p></div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {adminTabs.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={'px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 '+(activeTab===t.id?'bg-teal-700 text-white shadow':'bg-white text-gray-600 border border-gray-200 hover:bg-teal-50')}>
            <i className={'fa-solid '+t.icon}></i>{t.label}
          </button>
        ))}
      </div>

      {/* Comorbidity */}
      {activeTab==='comorbidity'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-heart-pulse"></i></div>
            <div><h3 className="font-bold text-gray-800">โรคประจำตัว</h3><p className="text-xs text-gray-400">{settings.comorbidities.length} รายการ</p></div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-20 bg-slate-50 p-3 rounded-xl mb-4">
            {settings.comorbidities.map(c => <TagPill key={c} label={c} onRemove={() => removeComorbidity(c)}/>)}
          </div>
          <div className="flex gap-2">
            <input value={newComorbidity} onChange={e => setNewComorbidity(e.target.value)} onKeyDown={e => e.key==='Enter'&&addComorbidity()} placeholder="เพิ่มโรคประจำตัว เช่น โรคเกาต์" className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-300"/>
            <button onClick={addComorbidity} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
          </div>
        </div>
      )}

      {/* Drugs */}
      {activeTab==='drugs'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-capsules"></i></div>
            <div><h3 className="font-bold text-gray-800">รายการยาโรคร่วม</h3><p className="text-xs text-gray-400">{settings.drugs.length} รายการ</p></div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-20 bg-slate-50 p-3 rounded-xl mb-4">
            {settings.drugs.map(d => <TagPill key={d} label={d} onRemove={() => removeDrug(d)}/>)}
          </div>
          <div className="flex gap-2">
            <input value={newDrug} onChange={e => setNewDrug(e.target.value)} onKeyDown={e => e.key==='Enter'&&addDrug()} placeholder="เพิ่มยา เช่น Omeprazole 20mg" className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-300"/>
            <button onClick={addDrug} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
          </div>
        </div>
      )}

      {/* Lab fields */}
      {activeTab==='lab'&&(
        <div className="space-y-4 tb-fade">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
            <h3 className="font-bold text-blue-800 text-sm mb-3"><i className="fa-solid fa-flask mr-2"></i>เพิ่มค่า Lab ใหม่</h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div><label className="text-xs font-bold text-gray-600 block mb-1">กลุ่ม</label>
                <select value={newLabField.group} onChange={e=>setNewLabField(f=>({...f,group:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                  {effectiveLabGroups.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">ชื่อแสดง</label><input value={newLabField.label} onChange={e=>setNewLabField(f=>({...f,label:e.target.value}))} placeholder="เช่น GGT" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"/></div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">Key (code)</label><input value={newLabField.key} onChange={e=>setNewLabField(f=>({...f,key:e.target.value}))} placeholder="เช่น ggt" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white font-mono outline-none"/></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div><label className="text-xs font-bold text-gray-600 block mb-1">หน่วย</label><input value={newLabField.unit} onChange={e=>setNewLabField(f=>({...f,unit:e.target.value}))} placeholder="U/L" className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"/></div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">ค่าต่ำสุด (normal)</label><input type="number" value={newLabField.lo} onChange={e=>setNewLabField(f=>({...f,lo:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"/></div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">ค่าสูงสุด (normal)</label><input type="number" value={newLabField.hi} onChange={e=>setNewLabField(f=>({...f,hi:e.target.value}))} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white outline-none"/></div>
            </div>
            <div className="flex justify-end">
              <button onClick={addLabField} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus mr-1"></i>เพิ่ม Lab Field</button>
            </div>
          </div>
          {effectiveLabGroups.map(g => (
            <div key={g.id} className="bg-white p-5 rounded-2xl border border-gray-200">
              <h4 className="font-bold text-gray-700 text-sm mb-3">{g.label}</h4>
              <div className="flex flex-wrap gap-2">
                {g.fields.map(f => (
                  <span key={f.key} className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium group hover:border-red-300 transition-colors">
                    <span className="font-bold text-gray-700">{f.label}</span>
                    <span className="text-gray-400">{f.lo}–{f.hi} {f.unit}</span>
                    <button onClick={() => removeLabField(g.id, f.key)} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400"><i className="fa-solid fa-xmark text-xs"></i></button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regimen */}
      {activeTab==='regimen'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-pills"></i></div>
            <div><h3 className="font-bold text-gray-800">สูตรยามาตรฐาน</h3><p className="text-xs text-gray-400">สูตรยาที่แสดงในหน้าลงทะเบียน</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {REGIMENS.map(r => <span key={r} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full text-sm font-mono font-bold">{r}</span>)}
            <span className="bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold">+ อื่นๆ (กรอกเอง)</span>
          </div>
          <p className="text-xs text-gray-400 mt-4"><i className="fa-solid fa-circle-info mr-1"></i>ในรุ่นนี้สูตรยามาตรฐานถูกกำหนดในระบบ ติดต่อผู้ดูแลระบบเพื่อเพิ่มสูตร</p>
        </div>
      )}

      {/* Drug Interaction admin */}
      {activeTab==='interaction'&&(
        <div className="space-y-4 tb-fade">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
            <p className="font-bold text-amber-800 text-sm mb-1"><i className="fa-solid fa-triangle-exclamation mr-2"></i>Custom Drug Interactions</p>
            <p className="text-xs text-amber-600">เพิ่มคู่ยาที่ต้องการแจ้งเตือนเพิ่มเติม นอกเหนือจากที่ระบบมีอยู่แล้ว</p>
          </div>

          {/* Built-in interactions (read-only display) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-lock mr-1 text-gray-400"></i>Built-in Drug Interactions (ระบบ)</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {[
                {s:'high',  drug:'Rifampicin + ARV',         effect:'CYP3A4 induction — ลดระดับ ARV',           trigger:'HIV'},
                {s:'medium',drug:'Isoniazid + OHA/Insulin',  effect:'INH รบกวนน้ำตาล + เพิ่มเสี่ยง Neuropathy',trigger:'DM'},
                {s:'medium',drug:'Rifampicin + CCB',          effect:'ลดระดับ CCB อย่างมีนัยสำคัญ',             trigger:'HT'},
                {s:'high',  drug:'Ethambutol + CKD',          effect:'EMB สะสมในไต เสี่ยง Optic Neuritis',      trigger:'CKD'},
                {s:'high',  drug:'INH/RIF + Cirrhosis',       effect:'เสี่ยง Hepatotoxicity สูง',               trigger:'ตับแข็ง'},
                {s:'high',  drug:'Rifampicin + Warfarin',     effect:'ลด INR อย่างมาก',                         trigger:'Warfarin'},
                {s:'high',  drug:'Rifampicin + Phenytoin',    effect:'ลดระดับ Phenytoin',                       trigger:'Phenytoin'},
                {s:'high',  drug:'Rifampicin + Azole',        effect:'ลดระดับ Azole antifungal',                trigger:'Fluconazole'},
                {s:'high',  drug:'Rifampicin + Methadone',    effect:'ลดระดับ Methadone',                       trigger:'Methadone'},
                {s:'medium',drug:'Rifampicin + OCP',          effect:'ลดประสิทธิภาพยาคุมกำเนิด',               trigger:'OCP'},
              ].map((item,i)=>(
                <div key={i} className={'flex items-start gap-3 p-2 rounded-lg '+(item.s==='high'?'bg-red-50':'bg-amber-50')}>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${item.s==='high'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{item.s==='high'?'High':'Med'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700">{item.drug}</p>
                    <p className="text-xs text-gray-500">{item.effect}</p>
                    <p className="text-xs text-gray-400">Trigger: {item.trigger}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom interactions */}
          <div className="bg-white p-5 rounded-2xl border border-red-200">
            <h4 className="font-bold text-gray-700 text-sm mb-3"><i className="fa-solid fa-plus mr-1 text-red-500"></i>เพิ่ม Drug Interaction (Custom)</h4>
            <div className="space-y-3">
              {(settings.customDrugInteractions||[]).map((ci,i)=>(
                <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-[80px_1fr_1fr_24px] gap-2 items-start">
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">ระดับ</label>
                      <select value={ci.severity||'medium'} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],severity:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none">
                        <option value="high">High</option><option value="medium">Medium</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">คู่ยา</label>
                      <input value={ci.drug||''} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],drug:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} placeholder="เช่น Rifampicin + Statin" className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"/>
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={()=>setSettings(s=>({...s,customDrugInteractions:(s.customDrugInteractions||[]).filter((_,j)=>j!==i)}))} className="p-1.5 text-red-400 hover:text-red-600 transition-colors"><i className="fa-solid fa-trash text-xs"></i></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-0.5">ผลกระทบ (Effect)</label>
                    <input value={ci.effect||''} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],effect:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} placeholder="อธิบายผลกระทบ" className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"/>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">คำแนะนำ (Rec)</label>
                      <input value={ci.rec||''} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],rec:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} placeholder="คำแนะนำ" className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">Trigger (โรค/ยา)</label>
                      <input value={ci.triggerComorbidity||''} onChange={e=>{const arr=[...(settings.customDrugInteractions||[])];arr[i]={...arr[i],triggerComorbidity:e.target.value};setSettings(s=>({...s,customDrugInteractions:arr}));}} placeholder="เช่น HIV หรือ Statin" className="w-full p-1.5 border border-gray-200 rounded-lg text-xs bg-white outline-none"/>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={()=>setSettings(s=>({...s,customDrugInteractions:[...(s.customDrugInteractions||[]),{severity:'medium',drug:'',effect:'',rec:'',triggerComorbidity:'',triggerDrug:''}]}))} className="w-full py-2 border-2 border-dashed border-red-300 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                <i className="fa-solid fa-plus mr-1"></i>เพิ่ม Drug Interaction ใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consult / DRP types */}
      {activeTab==='consult'&&(
        <div className="grid grid-cols-2 gap-5 tb-fade">
          <div className="bg-white p-5 rounded-2xl border border-amber-200">
            <h3 className="font-bold text-amber-800 text-sm mb-3"><i className="fa-solid fa-comments mr-1"></i>ประเภท Consultation</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {CONSULT_TYPES.map((t,i) => <div key={i} className="flex items-center justify-between bg-amber-50 px-3 py-2 rounded-lg text-xs text-amber-800 font-medium"><span>{t}</span></div>)}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-red-200">
            <h3 className="font-bold text-red-800 text-sm mb-3"><i className="fa-solid fa-exclamation-circle mr-1"></i>DRP Classification (C1–C8)</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {DRP_TYPES.map(t => <div key={t.code} className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg text-xs"><span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold font-mono">{t.code}</span><span className="text-red-700">{t.label}</span></div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== APP =====================
function App() {
  const [page, setPage] = useState('login');
  const [nav, setNav] = useState('dashboard');
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [clinical, setClinical] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [settings, setSettings] = useState({ comorbidities: DEFAULT_COMORBIDITIES, drugs: DEFAULT_DRUGS, labGroups: null, customDrugInteractions: [] });
  const alerts = generateAlerts(patients);

  const login = e => { e.preventDefault(); setLoggingIn(true); setTimeout(() => { setPage('app'); setLoggingIn(false); }, 700); };
  const addPatient = p => setPatients(ps => [...ps, p]);
  const updatePatient = updated => {
    setPatients(ps => ps.map(p => p.id===updated.id ? updated : p));
    if (clinical?.id === updated.id) setClinical(updated);
  };

  const navItems = [
    { id:'dashboard', icon:'fa-chart-pie', label:'ภาพรวมระบบ' },
    { id:'patient-list', icon:'fa-users', label:'ทะเบียนผู้ป่วย' },
    { id:'weekly-prep', icon:'fa-calendar-check', label:'เตรียมยาสัปดาห์' },
    { id:'reports', icon:'fa-file-contract', label:'รายงาน & สถิติ' },
    { id:'settings', icon:'fa-gear', label:'ตั้งค่าระบบ (Admin)', divider:true },
  ];
  const titles = { dashboard:'ภาพรวมระบบ', 'patient-list':'ทะเบียนผู้ป่วย', 'weekly-prep':'เตรียมยาประจำสัปดาห์', reports:'รายงาน และ สถิติ', settings:'ตั้งค่าระบบ (Admin)' };

  if (page === 'login') return (
    <div className="w-full h-screen bg-gradient-to-br from-teal-900 to-teal-700 flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center tb-fade">
        <div className="mb-6"><i className="fa-solid fa-lungs-virus text-6xl text-teal-600"></i></div>
        <h1 className="text-4xl font-bold text-teal-800 mb-1">TB-CARE LINK</h1>
        <p className="text-gray-400 mb-8 text-sm">รพ.ปรางค์กู่ · กลุ่มงานเภสัชกรรม</p>
        <form onSubmit={login} className="space-y-4 text-left">
          <div><label className="text-sm font-medium text-gray-600 block mb-1">Username</label><input type="text" defaultValue="sirawit.p" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-teal-400 outline-none" required/></div>
          <div><label className="text-sm font-medium text-gray-600 block mb-1">รหัสผ่าน</label><input type="password" defaultValue="password" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-teal-400 outline-none" required/></div>
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white p-3.5 rounded-xl font-bold shadow-lg transition-all mt-2 flex items-center justify-center gap-2">
            {loggingIn ? <><i className="fa-solid fa-spinner fa-spin"></i>กำลังเข้าสู่ระบบ...</> : <><i className="fa-solid fa-right-to-bracket"></i>เข้าสู่ระบบ</>}
          </button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">พัฒนาโดย เภสัชกร สิรวิชญ์ เผ่าผา</p>
          <p className="text-xs text-gray-400">โรงพยาบาลปรางค์กู่</p>
          <p className="text-xs text-gray-300 mt-1">Version 0.5.0 · <span className="text-amber-400 font-medium">ยังไม่เผยแพร่</span></p>
        </div>
      </div>
    </div>
  );

  // Clinical view กินทั้งจอ — ซ่อน sidebar + header ทั้งหมด
  if (clinical) {
    return (
      <div className="flex h-screen bg-white overflow-hidden">
        <ClinicalModal patient={clinical} onClose={() => setClinical(null)} onUpdate={updatePatient} settings={settings}/>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside style={{width:sidebarOpen?'240px':'72px',transition:'width 0.2s ease',overflow:'hidden',flexShrink:0,display:'flex',flexDirection:'column',background:'#fff',borderRight:'1px solid #f1f5f9',boxShadow:'1px 0 4px rgba(0,0,0,0.04)'}}>

        {/* Header: icon คงที่ + label fade + ปุ่ม toggle */}
        <div style={{display:'flex',alignItems:'center',height:'60px',padding:'0 10px',borderBottom:'1px solid #f1f5f9',flexShrink:0}}>
          <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className="fa-solid fa-lungs-virus" style={{color:'#0f766e',fontSize:'18px'}}></i>
          </span>
          <span style={{overflow:'hidden',whiteSpace:'nowrap',fontWeight:700,fontSize:'15px',color:'#0f766e',flex:1,maxWidth:sidebarOpen?'140px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease'}}>TB-CARE LINK</span>
          <button
            onClick={()=>setSidebarOpen(o=>!o)}
            title={sidebarOpen?'ซ่อนเมนู':'แสดงเมนู'}
            style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#9ca3af',transition:'color 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.color='#0f766e'}
            onMouseLeave={e=>e.currentTarget.style.color='#9ca3af'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav style={{flex:1,overflowY:'auto',padding:'10px 8px'}}>
          {navItems.map(n => (
            <div key={n.id}>
              {n.divider && <div style={{margin:'6px 0',borderTop:'1px solid #f1f5f9'}}></div>}
              <button
                onClick={()=>setNav(n.id)}
                title={!sidebarOpen?n.label:undefined}
                style={{display:'flex',width:'100%',alignItems:'center',padding:'9px 8px',borderRadius:'8px',border:'none',cursor:'pointer',marginBottom:'2px',transition:'background 0.15s',background:nav===n.id?'#ccfbf1':'transparent',fontWeight:nav===n.id?700:500,fontSize:'14px',color:nav===n.id?'#0f766e':'#374151'}}
                onMouseEnter={e=>{if(nav!==n.id){e.currentTarget.style.background='#f0fdfa';e.currentTarget.style.color='#0f766e';}}}
                onMouseLeave={e=>{if(nav!==n.id){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#374151';}}}
              >
                {/* icon คงที่ 36px ไม่ขยับ */}
                <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <i className={`fa-solid ${n.icon}`} style={{fontSize:'17px',color:'#0f766e'}}></i>
                </span>
                {/* label fade */}
                <span style={{overflow:'hidden',whiteSpace:'nowrap',maxWidth:sidebarOpen?'160px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease'}}>{n.label}</span>
              </button>
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div style={{borderTop:'1px solid #f1f5f9',padding:'10px 8px',flexShrink:0}}>
          <button onClick={()=>setShowProfile(true)} style={{width:'100%',display:'flex',alignItems:'center',padding:'8px',borderRadius:'10px',cursor:'pointer',transition:'background 0.15s',border:'none',background:'transparent',textAlign:'left'}}
            onMouseEnter={e=>e.currentTarget.style.background='#f0fdfa'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <span style={{width:'36px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#0f766e',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'11px'}}>ภก</div>
            </span>
            <div style={{overflow:'hidden',maxWidth:sidebarOpen?'160px':'0px',opacity:sidebarOpen?1:0,transition:'max-width 0.2s ease,opacity 0.15s ease',whiteSpace:'nowrap'}}>
              <p style={{fontWeight:700,fontSize:'12px',color:'#1f2937',margin:0}}>ภก.สิรวิชญ์ เผ่าผา</p>
              <p style={{fontSize:'11px',color:'#0f766e',margin:0}}>Pharmacist</p>
            </div>
          </button>
        </div>

        {/* Version info */}
        <div style={{padding:'8px 12px',borderTop:'1px solid #f1f5f9',flexShrink:0,overflow:'hidden'}}>
          {sidebarOpen ? (
            <div>
              <p style={{fontSize:'10px',color:'#9ca3af',margin:0,whiteSpace:'nowrap'}}>พัฒนาโดย เภสัชกร สิรวิชญ์ เผ่าผา</p>
              <p style={{fontSize:'10px',color:'#9ca3af',margin:'1px 0 0 0',whiteSpace:'nowrap'}}>โรงพยาบาลปรางค์กู่</p>
              <p style={{fontSize:'10px',color:'#d1d5db',margin:'2px 0 0 0',whiteSpace:'nowrap'}}>v0.5.0 · <span style={{color:'#fbbf24'}}>ยังไม่เผยแพร่</span></p>
            </div>
          ) : (
            <div style={{display:'flex',justifyContent:'center'}}>
              <span style={{fontSize:'9px',color:'#d1d5db',fontWeight:700}}>0.5</span>
            </div>
          )}
        </div>

      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-between px-6 z-10 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-800 truncate">{titles[nav]}</h1>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative hidden md:block">
              <input type="text" placeholder="ค้นหาด่วน..." className="w-48 p-2 pl-9 bg-gray-100 rounded-full text-sm focus:ring-2 focus:ring-teal-200 outline-none"/>
              <i className="fa-solid fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
            </div>
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-gray-400 hover:text-teal-600 transition-colors">
                <i className="fa-regular fa-bell text-xl"></i>
                {alerts.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>}
              </button>
              {showNotifs && <NotificationPanel alerts={alerts} onClose={() => setShowNotifs(false)}/>}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {nav==='dashboard'     && <Dashboard patients={patients}/>}
          {nav==='patient-list'  && <PatientList patients={patients} onAdd={addPatient} onOpen={setClinical} settings={settings}/>}
          {nav==='weekly-prep'   && <WeeklyPrep patients={patients} onOpen={setClinical}/>}
          {nav==='reports'       && <Reports patients={patients}/>}
          {nav==='settings'      && <AdminSettings settings={settings} setSettings={setSettings}/>}
        </div>
      </main>

      {/* User Profile Modal */}
      {showProfile && <UserProfileModal onClose={()=>setShowProfile(false)}/>}
    </div>
  );
}

const DEMO_USER = {
  name: 'ภก.สิรวิชญ์ เผ่าผา',
  nameEn: 'Sirawit Phaophan',
  position: 'เภสัชกร (Pharmacist)',
  hospital: 'โรงพยาบาลปรางค์กู่',
  department: 'กลุ่มงานเภสัชกรรม',
  licenseNo: 'ภก. 12345',
  username: 'sirawit.p',
  email: 'sirawit.p@pranggku.go.th',
  phone: '045-691-234 ต่อ 201',
  role: 'Admin',
  since: '1 ต.ค. 2567',
};

function UserProfileModal({ onClose }) {
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({...DEMO_USER});
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const editableFields = [
    {icon:'fa-hospital', label:'โรงพยาบาล',             key:'hospital'},
    {icon:'fa-pills',    label:'แผนก',                  key:'department'},
    {icon:'fa-id-card',  label:'เลขใบประกอบวิชาชีพ',    key:'licenseNo'},
    {icon:'fa-user',     label:'ชื่อผู้ใช้',             key:'username'},
    {icon:'fa-envelope', label:'อีเมล',                  key:'email'},
    {icon:'fa-phone',    label:'โทรศัพท์',               key:'phone'},
    {icon:'fa-calendar', label:'ใช้งานระบบตั้งแต่',      key:'since'},
  ];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(2px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'480px',maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,0.15)',overflow:'hidden'}}>

        {/* Header — fixed */}
        <div style={{background:'linear-gradient(135deg,#0f766e,#14b8a6)',padding:'24px 24px 20px',textAlign:'center',position:'relative',flexShrink:0}}>
          <button onClick={onClose} style={{position:'absolute',top:'14px',right:'14px',width:'28px',height:'28px',borderRadius:'8px',border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px'}}>
            <i className="fa-solid fa-xmark"></i>
          </button>
          <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'18px',margin:'0 auto 10px'}}>ภก</div>
          <p style={{fontWeight:800,fontSize:'17px',color:'#fff',margin:0}}>{form.name}</p>
          <p style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',margin:'3px 0 0'}}>{form.position}</p>
          <span style={{display:'inline-block',marginTop:'7px',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:'11px',fontWeight:700,padding:'3px 10px',borderRadius:'20px'}}>
            <i className="fa-solid fa-shield-halved" style={{marginRight:'4px'}}></i>{form.role}
          </span>
        </div>

        {/* Info rows — scrollable */}
        <div style={{overflowY:'auto',flex:1,padding:'16px 24px'}}>
          {editableFields.map(row=>(
            <div key={row.key} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}>
              <span style={{width:'32px',height:'32px',borderRadius:'8px',background:'#f0fdfa',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className={`fa-solid ${row.icon}`} style={{color:'#0f766e',fontSize:'13px'}}></i>
              </span>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:'10px',color:'#9ca3af',margin:0}}>{row.label}</p>
                {editing
                  ? <input value={form[row.key]} onChange={set(row.key)}
                      style={{width:'100%',fontSize:'13px',fontWeight:600,color:'#1f2937',border:'none',borderBottom:'1.5px solid #14b8a6',outline:'none',background:'transparent',padding:'2px 0'}}/>
                  : <p style={{fontSize:'13px',fontWeight:600,color:'#1f2937',margin:0}}>{form[row.key]}</p>
                }
              </div>
            </div>
          ))}
        </div>

        {/* Footer — fixed */}
        <div style={{padding:'12px 24px 18px',display:'flex',gap:'8px',borderTop:'1px solid #f1f5f9',flexShrink:0}}>
          {editing ? <>
            <button onClick={()=>setEditing(false)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
              ยกเลิก
            </button>
            <button onClick={()=>setEditing(false)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',background:'#0f766e',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
              <i className="fa-solid fa-check" style={{marginRight:'6px'}}></i>บันทึก
            </button>
          </> : <>
            <button onClick={()=>setEditing(true)} style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
              <i className="fa-solid fa-pen" style={{marginRight:'6px'}}></i>แก้ไขข้อมูล
            </button>
            <button style={{flex:1,padding:'10px',borderRadius:'10px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontWeight:600,fontSize:'13px',cursor:'pointer'}}>
              <i className="fa-solid fa-key" style={{marginRight:'6px'}}></i>เปลี่ยนรหัสผ่าน
            </button>
            <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:'10px',border:'none',background:'#0f766e',color:'#fff',fontWeight:700,fontSize:'13px',cursor:'pointer'}}>
              ปิด
            </button>
          </>}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
