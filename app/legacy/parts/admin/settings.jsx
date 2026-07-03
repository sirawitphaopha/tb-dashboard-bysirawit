'use client'
/**
 * parts/admin/settings.jsx — ตั้งค่าระบบ (admin) : regimens, drugs, พื้นที่จัดเก็บ ฯลฯ
 * ย้ายจาก parts/admin.jsx (แยกรอบ 2) — โค้ดเดิม ไม่แก้ logic
 */
import * as React from 'react'
const { useState } = React
import { Field } from '../shared'
import { LAB_GROUPS, DRUG_RANGES, DRP_TYPES, CONSULT_TYPES } from '../globals'
import { StorageDetail } from '../storage'

// ===== AdminSettings =====
function AdminSettings({ settings, setSettings, setNav, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [newComorbidity, setNewComorbidity] = useState({ name: '', abbr: '' });
  const [newDrug, setNewDrug] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newLabField, setNewLabField] = useState({ label:'', key:'', unit:'', lo:'', hi:'', group:'lft' });
  const [activeTab, setActiveTab] = useState(() => { const w = (typeof window!=='undefined')?window._settingsWantTab:null; if(typeof window!=='undefined') window._settingsWantTab = null; return (w && (w!=='storage' || isAdmin)) ? w : 'comorbidity'; });


  const addComorbidity = () => {
    const name = newComorbidity.name.trim();
    const abbr = newComorbidity.abbr.trim().toUpperCase();
    if (!name || !abbr || settings.comorbidities.some(c => c.abbr === abbr)) return;
    setSettings(s => ({ ...s, comorbidities: [...s.comorbidities, { name, abbr }] }));
    setNewComorbidity({ name: '', abbr: '' });
  };
  const removeComorbidity = abbr => setSettings(s => ({ ...s, comorbidities: s.comorbidities.filter(c => c.abbr !== abbr) }));
  const addReason = () => {
    const v = newReason.trim();
    if (!v || (settings.restartReasons||[]).includes(v)) return;
    setSettings(s => ({ ...s, restartReasons: [...(s.restartReasons||[]), v] }));
    setNewReason('');
  };
  const removeReason = r => setSettings(s => ({ ...s, restartReasons: (s.restartReasons||[]).filter(x => x !== r) }));
  const [newRegimen, setNewRegimen] = useState('');
  const addRegimen = () => {
    const v = newRegimen.trim().toUpperCase();
    if (!v || (settings.regimens||[]).includes(v)) return;
    setSettings(s => ({ ...s, regimens: [...(s.regimens||[]), v] }));
    setNewRegimen('');
  };
  const removeRegimen = r => setSettings(s => ({ ...s, regimens: (s.regimens||[]).filter(x => x !== r) }));

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
    ...(isAdmin ? [{ id:'storage', label:'พื้นที่จัดเก็บ', icon:'fa-hard-drive' }] : []),
    { id:'comorbidity', label:'โรคประจำตัว', icon:'fa-heart-pulse' },
    { id:'drugs', label:'ยาโรคร่วม', icon:'fa-capsules' },
    { id:'tb-drugs', label:'ยาวัณโรค', icon:'fa-prescription-bottle-medical' },
    { id:'lab', label:'ค่า Lab', icon:'fa-flask' },
    { id:'regimen', label:'สูตรยา', icon:'fa-pills' },
    { id:'restart', label:'เหตุผลเริ่มยาใหม่', icon:'fa-rotate-right' },
    { id:'interaction', label:'Drug Interaction', icon:'fa-triangle-exclamation' },
    { id:'consult', label:'Consult / DRP', icon:'fa-comments' },
  ];

  const effectiveLabGroups = settings.labGroups || LAB_GROUPS;

  return (
    <div className="space-y-5 tb-fade">
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
      {activeTab==='storage'&&<StorageDetail/>}
      {activeTab==='comorbidity'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-heart-pulse"></i></div>
            <div><h3 className="font-bold text-gray-800">โรคประจำตัว</h3><p className="text-xs text-gray-400">{settings.comorbidities.length} รายการ</p></div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-20 bg-slate-50 p-3 rounded-xl mb-4">
            {settings.comorbidities.map(c => <TagPill key={c.abbr} label={`${c.name} (${c.abbr})`} onRemove={() => removeComorbidity(c.abbr)}/>)}
          </div>
          <p className="text-xs text-gray-400 mb-2"><i className="fa-solid fa-circle-info mr-1"></i>ชื่อเต็มแสดงใน Profile ผู้ป่วย · ชื่อย่อแสดงเป็น badge ในตาราง</p>
          <div className="grid grid-cols-[1fr_120px_auto] gap-2">
            <input value={newComorbidity.name} onChange={e => setNewComorbidity(n => ({...n, name: e.target.value}))} onKeyDown={e => e.key==='Enter'&&addComorbidity()} placeholder="ชื่อเต็ม เช่น โรคเกาต์" className="p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-300"/>
            <input value={newComorbidity.abbr} onChange={e => setNewComorbidity(n => ({...n, abbr: e.target.value}))} onKeyDown={e => e.key==='Enter'&&addComorbidity()} placeholder="ย่อ เช่น Gout" className="p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-300 font-mono text-center"/>
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

          {/* แผนพัฒนา — note ไว้กันลืม (โชว์ในเว็บ) */}
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-bold text-amber-800 mb-2"><i className="fa-solid fa-lightbulb mr-2"></i>แผนพัฒนาระบบยา (ยังพัฒนาไม่เสร็จ)</p>
            <ul className="text-xs text-amber-800 leading-relaxed list-disc pl-5 space-y-1">
              <li>เพิ่มรายการยาให้ครบ 100+ รายการ (ครอบคลุมยาที่พบบ่อยในเวชปฏิบัติ)</li>
              <li>จัดกลุ่มยาตามหมวด เช่น เบาหวาน / ความดัน-หัวใจ / ยาต้านไวรัส HIV / ระบบทางเดินอาหาร ฯลฯ</li>
              <li>เชื่อมรายการยานี้กับประวัติผู้ป่วย — เลือกยาโรคร่วมตอนสร้าง/แก้ไขเคสได้โดยตรง</li>
              <li>เชื่อมกับระบบตรวจปฏิกิริยาระหว่างยา (Drug Interaction) อัตโนมัติ</li>
              <li>ผู้ใช้เพิ่มยาที่ไม่มีในระบบเองได้ <span className="text-green-700 font-semibold">(ทำแล้ว — ช่องด้านบน)</span></li>
            </ul>
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
            <div><h3 className="font-bold text-gray-800">สูตรยามาตรฐาน</h3><p className="text-xs text-gray-400">สูตรยาที่แสดงใน dropdown หน้าลงทะเบียน — {(settings.regimens||[]).length} สูตร</p></div>
          </div>
          <div className="flex flex-wrap gap-2 min-h-16 bg-slate-50 p-3 rounded-xl mb-4">
            {(settings.regimens||[]).map(r => (
              <span key={r} className="flex items-center gap-1.5 bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full text-sm font-mono font-bold hover:border-red-300 group transition-colors">
                {r}
                <button onClick={() => removeRegimen(r)} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400"><i className="fa-solid fa-xmark text-xs"></i></button>
              </span>
            ))}
            <span className="bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full text-sm font-semibold">+ อื่นๆ (กรอกเอง)</span>
          </div>
          <div className="flex gap-2">
            <input value={newRegimen} onChange={e => setNewRegimen(e.target.value)} onKeyDown={e => e.key==='Enter'&&addRegimen()} placeholder="เช่น 4RH หรือ BPaLM" className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-purple-300 font-mono"/>
            <button onClick={addRegimen} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
          </div>
        </div>
      )}

      {/* Restart Reasons */}
      {activeTab==='restart'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-rotate-right"></i></div>
            <div><h3 className="font-bold text-gray-800">เหตุผลที่เริ่มยาใหม่</h3><p className="text-xs text-gray-400">ใช้เป็น dropdown ในแถบ "ประวัติสูตรยา" ของผู้ป่วย — {(settings.restartReasons||[]).length} รายการ</p></div>
          </div>
          <div className="flex flex-col gap-2 min-h-24 bg-slate-50 p-3 rounded-xl mb-4">
            {(settings.restartReasons||[]).map((r,i) => (
              <div key={`${i}-${r}`} className="flex items-center justify-between bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:border-red-200 group transition-colors">
                <span><span className="text-gray-400 font-mono text-xs mr-2">{i+1}.</span>{r}</span>
                <button onClick={() => removeReason(r)} className="text-gray-300 hover:text-red-500 transition-colors group-hover:text-red-400 ml-2 flex-shrink-0"><i className="fa-solid fa-xmark text-xs"></i></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newReason} onChange={e => setNewReason(e.target.value)} onKeyDown={e => e.key==='Enter'&&addReason()} placeholder="เช่น เริ่มใหม่หลัง MDR-TB confirmed" className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-orange-300"/>
            <button onClick={addReason} className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors"><i className="fa-solid fa-plus"></i></button>
          </div>
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
                <div key={ci.id || `${i}-${ci.drug||''}`} className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
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
      {activeTab==='tb-drugs'&&(
        <div className="bg-white p-6 rounded-2xl border border-gray-200 tb-fade">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-prescription-bottle-medical"></i></div>
            <div>
              <h3 className="font-bold text-gray-800">ยาวัณโรคในระบบ</h3>
              <p className="text-xs text-gray-400">รายการยา TB ที่ระบบรู้จัก พร้อมความแรงและช่วงขนาดยา</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="p-3 text-left rounded-l-xl">ตัวยา</th>
                <th className="p-3 text-left">ชื่อ</th>
                <th className="p-3 text-left">ความแรงที่มี</th>
                <th className="p-3 text-left">ช่วง mg/kg</th>
                <th className="p-3 text-left rounded-r-xl">โดสสูงสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(DRUG_RANGES).map(([key, d]) => {
                const strengths = (window.HOSP_STRENGTHS||{})[key] || [{label:`${key}${d.strength}`, value:d.strength}];
                return (
                  <tr key={key}>
                    <td className="p-3 pl-4 font-black text-teal-700 text-base">{key}</td>
                    <td className="p-3 text-gray-700 font-medium">{d.name}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {strengths.map(s => (
                          <span key={String(s.value)} className="bg-teal-50 border border-teal-200 text-teal-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-gray-600 font-mono text-xs">{d.min}–{d.max} mg/kg</td>
                    <td className="p-3 text-gray-600 font-mono text-xs">{d.absMax} mg</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-gray-400"><i className="fa-solid fa-circle-info mr-1"></i>อนาคต: จะเพิ่มยา MDR-TB เช่น Bedaquiline, Linezolid, Clofazimine ที่นี่</p>
        </div>
      )}

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


export { AdminSettings }
