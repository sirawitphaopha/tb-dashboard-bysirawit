'use client';

import { useState } from 'react';
import {
  X, User, Pill, FileText, AlertTriangle, Beaker,
  Calendar, Edit3, Check, RefreshCw, Heart, Activity,
  MessageSquare, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/data';
import {
  calcDoses, calcCrCl, crClStage,
  ADR_LIST, LAB_GROUPS, DRP_TYPES, CONSULT_TYPES,
  DRUG_RANGES, getLabStatus, LAB_STATUS_STYLE,
} from '@/lib/data';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdate: (patient: Patient) => void;
}

type TabType = 'overview' | 'doses' | 'labs' | 'adr' | 'visits' | 'drp' | 'dot';

export function PatientDetailModal({ patient, onClose, onUpdate }: PatientDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingDoses, setEditingDoses] = useState(false);
  const [customTabs, setCustomTabs] = useState<Record<string, number>>(patient.customDoses || {});

  const doses = calcDoses(patient.weight, patient.regimen, Object.keys(customTabs).length ? customTabs : undefined);
  const lastLab = patient.labs[patient.labs.length - 1];
  const crcl = lastLab?.scr ? calcCrCl(patient.age, patient.weight, lastLab.scr, patient.gender) : null;
  const crclInfo = crClStage(crcl);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'ข้อมูลทั่วไป', icon: User },
    { id: 'doses',    label: 'ขนาดยา',       icon: Pill },
    { id: 'labs',     label: 'ผล Lab',        icon: Beaker },
    { id: 'adr',      label: 'ADR',           icon: AlertTriangle },
    { id: 'visits',   label: 'บันทึกการพบ',   icon: FileText },
    { id: 'drp',      label: 'DRP / Consult', icon: MessageSquare },
    { id: 'dot',      label: 'DOT',           icon: Calendar },
  ];

  const activeADRCount = ADR_LIST.filter((a) => patient.adr?.[a.key]?.checked).length;

  const handleSaveDoses = () => {
    onUpdate({ ...patient, customDoses: customTabs });
    setEditingDoses(false);
  };

  const handleResetDoses = () => {
    setCustomTabs({});
    onUpdate({ ...patient, customDoses: null });
    setEditingDoses(false);
  };

  const statusBg =
    patient.status === 'critical' ? 'bg-red-500' :
    patient.status === 'warning'  ? 'bg-amber-500' : 'bg-emerald-500';
  const statusLabel =
    patient.status === 'critical' ? 'วิกฤต' :
    patient.status === 'warning'  ? 'เฝ้าระวัง' : 'ปกติ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {patient.firstName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight">{patient.name}</h2>
                <p className="text-white/80 text-sm mt-0.5">
                  HN: {patient.hn} | {patient.age} ปี | {patient.gender === 'M' ? 'ชาย' : 'หญิง'} | {patient.weight} kg
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs">{patient.phase}</span>
                  <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs">{patient.regimen}</span>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', statusBg)}>{statusLabel}</span>
                  {patient.hivStatus === 'Positive' && (
                    <span className="px-2.5 py-0.5 bg-red-500/80 rounded-full text-xs">HIV+</span>
                  )}
                  {activeADRCount > 0 && (
                    <span className="px-2.5 py-0.5 bg-amber-400/80 rounded-full text-xs">{activeADRCount} ADR</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-slate-100 px-4 flex-shrink-0 bg-white overflow-x-auto">
          <div className="flex gap-0.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ════════════════ OVERVIEW ════════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'ตำบล', value: patient.subdistrict },
                  { label: 'ประเภทผู้ป่วย', value: patient.patientType },
                  { label: 'ตำแหน่งโรค', value: patient.diseaseLocation + (patient.extraPulmonaryType ? ` — ${patient.extraPulmonaryType}` : '') },
                  { label: 'เดือน / วันที่รักษา', value: `เดือน ${patient.month} (วันที่ ${patient.day})` },
                  { label: 'วันเริ่มรักษา', value: patient.startDate },
                  { label: 'นัดครั้งต่อไป', value: `${patient.nextAppt}  (อีก ${patient.daysUntil} วัน)` },
                  { label: 'Adherence', value: `${patient.adherence}%` },
                  { label: 'CrCl (ไต)', value: crcl ? `${crcl} mL/min` : '-' },
                  { label: 'HIV Status', value: patient.hivStatus || 'ไม่ระบุ' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3.5">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* CrCl badge */}
              {crcl !== null && (
                <div className={cn('rounded-xl p-3.5 text-sm font-medium flex items-center gap-2',
                  crcl < 30 ? 'bg-red-50 text-red-700 border border-red-200' :
                  crcl < 60 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                )}>
                  <Activity className="h-4 w-4 flex-shrink-0" />
                  {crclInfo.label}
                  {crcl < 30 && ' — พิจารณา HOLD Ethambutol / ปรับ Dosing Interval'}
                </div>
              )}

              {/* Comorbidities */}
              {patient.comorbidities.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4" /> โรคร่วม
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {patient.comorbidities.map((c) => (
                      <span key={c} className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Concomitant Drugs */}
              {patient.concomitantDrugs.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Pill className="h-4 w-4" /> ยาที่ใช้ร่วม
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {patient.concomitantDrugs.map((d) => (
                      <span key={d} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Regimen History */}
              {patient.regimenHistory && patient.regimenHistory.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary-500" /> ประวัติสูตรยา
                  </p>
                  <div className="space-y-2">
                    {patient.regimenHistory.map((r, i) => (
                      <div key={i} className={cn('flex items-start gap-3 p-3 rounded-lg', r.isCurrent ? 'bg-primary-50' : 'bg-slate-50')}>
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', r.isCurrent ? 'bg-primary-500' : 'bg-slate-300')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{r.regimen}</p>
                          <p className="text-xs text-slate-500">{r.startDate}{r.endDate ? ` — ${r.endDate}` : ''}</p>
                          {r.reason && <p className="text-xs text-amber-600 mt-0.5">{r.reason}</p>}
                        </div>
                        {r.isCurrent && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full whitespace-nowrap">ปัจจุบัน</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sputum */}
              {patient.sputum.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary-500" /> ผลเสมหะ
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {patient.sputum.map((s, i) => (
                      <div key={i} className="bg-slate-50 rounded-xl px-4 py-3 text-center min-w-[80px]">
                        <p className="text-xs text-slate-500 font-medium">{s.tp}</p>
                        <p className={cn('text-sm font-bold mt-1',
                          s.result === 'Neg' ? 'text-emerald-600' :
                          s.result?.includes('+') ? 'text-red-600' : 'text-slate-700'
                        )}>{s.result}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{s.date}</p>
                        {s.genexpert && <p className="text-xs text-blue-600 mt-0.5">GX: {s.genexpert}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════ DOSES ════════════════ */}
          {activeTab === 'doses' && (
            <>
              {crcl !== null && crcl < 30 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">ต้องปรับขนาดยา — CrCl = {crcl} mL/min</p>
                    <p className="text-xs text-red-600 mt-1">พิจารณา HOLD Ethambutol หรือปรับ Dosing Interval</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doses.map((d) => {
                  const range = DRUG_RANGES[d.key as keyof typeof DRUG_RANGES];
                  const isOk = d.status === 'ok';
                  const isHigh = d.status === 'high';
                  return (
                    <div key={d.key} className={cn('rounded-xl border-2 p-5',
                      isHigh ? 'border-red-200 bg-red-50' :
                      !isOk  ? 'border-amber-200 bg-amber-50' :
                      'border-slate-200 bg-white'
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-slate-800">{range?.name}</p>
                        <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                          isHigh ? 'bg-red-100 text-red-700' :
                          !isOk  ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        )}>
                          {d.mgkg} mg/kg
                        </span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">จำนวนเม็ด</span>
                          <span className="font-bold text-primary-600 text-base">{d.tabs} เม็ด</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ขนาดรวม</span>
                          <span className="font-medium">{d.dose} mg/day</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                          <span>ช่วง: {d.min}–{d.max} mg/kg</span>
                          <span>{range?.strength} mg/เม็ด</span>
                        </div>
                        {editingDoses && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <label className="text-xs text-slate-500 mb-1 block">ปรับจำนวนเม็ด</label>
                            <input
                              type="number"
                              min={1} max={10}
                              value={customTabs[d.key] ?? d.tabs}
                              onChange={(e) => setCustomTabs({ ...customTabs, [d.key]: parseInt(e.target.value) || d.tabs })}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                {editingDoses ? (
                  <>
                    <button onClick={handleSaveDoses} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm hover:bg-primary-600 transition-colors">
                      <Check className="h-4 w-4" /> บันทึก
                    </button>
                    <button onClick={handleResetDoses} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200 transition-colors">
                      <RefreshCw className="h-4 w-4" /> รีเซ็ตเป็นค่าอัตโนมัติ
                    </button>
                    <button onClick={() => setEditingDoses(false)} className="px-4 py-2 text-slate-500 text-sm hover:text-slate-700">
                      ยกเลิก
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditingDoses(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200 transition-colors">
                    <Edit3 className="h-4 w-4" /> ปรับขนาดยาเอง
                  </button>
                )}
              </div>
            </>
          )}

          {/* ════════════════ LABS ════════════════ */}
          {activeTab === 'labs' && (
            <>
              {patient.labs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Beaker className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>ยังไม่มีผล Lab</p>
                </div>
              ) : (
                <>
                  {LAB_GROUPS.map((group) => (
                    <div key={group.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className={cn('px-5 py-3 text-sm font-semibold',
                        group.color === 'amber'  ? 'bg-amber-50 text-amber-800 border-b border-amber-100' :
                        group.color === 'blue'   ? 'bg-blue-50 text-blue-800 border-b border-blue-100' :
                        'bg-slate-50 text-slate-800 border-b border-slate-100'
                      )}>
                        {group.label}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th className="text-left px-5 py-2 text-slate-500 font-medium">รายการ</th>
                              <th className="text-left px-3 py-2 text-slate-400 font-normal text-xs">หน่วย</th>
                              <th className="text-left px-3 py-2 text-slate-400 font-normal text-xs">ปกติ</th>
                              {patient.labs.map((lab, i) => (
                                <th key={i} className="text-center px-3 py-2 text-slate-600 font-semibold whitespace-nowrap">
                                  {lab.tp}
                                  <br />
                                  <span className="text-xs font-normal text-slate-400">{lab.date}</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.fields.map((field) => (
                              <tr key={field.key} className="border-t border-slate-50 hover:bg-slate-50/50">
                                <td className="px-5 py-2 font-medium text-slate-700">{field.label}</td>
                                <td className="px-3 py-2 text-xs text-slate-400">{field.unit}</td>
                                <td className="px-3 py-2 text-xs text-slate-400">{field.lo}–{field.hi}</td>
                                {patient.labs.map((lab, i) => {
                                  const rawVal = (lab as Record<string, unknown>)[field.key];
                                  const val = rawVal !== undefined && rawVal !== '' ? rawVal : null;
                                  if (val === null) {
                                    return <td key={i} className="px-3 py-2 text-center text-slate-300 text-xs">—</td>;
                                  }
                                  const status = getLabStatus(val, field);
                                  const styleClass = LAB_STATUS_STYLE[status] || 'text-slate-700';
                                  return (
                                    <td key={i} className="px-3 py-2 text-center">
                                      <span className={cn('px-2 py-0.5 rounded-md text-xs', styleClass)}>
                                        {String(val)}
                                        {status === 'high' || status === 'critical' ? ' ↑' : status === 'low' || status === 'low-bad' ? ' ↓' : ''}
                                      </span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Microbiology */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 text-sm font-semibold bg-purple-50 text-purple-800 border-b border-purple-100">
                      Microbiology (HBsAg / Anti-HCV)
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50/50">
                            <th className="text-left px-5 py-2 text-slate-500 font-medium">รายการ</th>
                            {patient.labs.map((lab, i) => (
                              <th key={i} className="text-center px-3 py-2 text-slate-600 font-semibold">{lab.tp}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: 'HBsAg', key: 'hbsag' },
                            { label: 'Anti-HCV', key: 'hcv' },
                          ].map((row) => (
                            <tr key={row.key} className="border-t border-slate-50">
                              <td className="px-5 py-2 font-medium text-slate-700">{row.label}</td>
                              {patient.labs.map((lab, i) => {
                                const v = (lab as Record<string, unknown>)[row.key] as string | undefined;
                                return (
                                  <td key={i} className="px-3 py-2 text-center">
                                    {v ? (
                                      <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium',
                                        v === 'Positive' ? 'bg-red-100 text-red-700' :
                                        v === 'Negative' ? 'bg-emerald-100 text-emerald-700' :
                                        'text-slate-500'
                                      )}>{v}</span>
                                    ) : (
                                      <span className="text-slate-300 text-xs">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ════════════════ ADR ════════════════ */}
          {activeTab === 'adr' && (
            <>
              {activeADRCount === 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 text-center">
                  ไม่พบรายงานอาการไม่พึงประสงค์
                </div>
              )}
              <div className="space-y-2">
                {ADR_LIST.map((adr) => {
                  const val = patient.adr?.[adr.key];
                  const isChecked = val?.checked;
                  return (
                    <div key={adr.key} className={cn('border rounded-xl p-4',
                      isChecked ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn('w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center',
                          isChecked ? 'bg-red-500' : 'bg-slate-200'
                        )}>
                          {isChecked && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn('text-sm font-medium', isChecked ? 'text-red-800' : 'text-slate-500')}>
                              {adr.label}
                            </p>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{adr.sub}</span>
                            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{adr.drug}</span>
                          </div>
                          {isChecked && val?.note && (
                            <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded-lg px-3 py-2">{val.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ════════════════ VISITS ════════════════ */}
          {activeTab === 'visits' && (
            <>
              {patient.visits.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>ยังไม่มีบันทึกการพบ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patient.visits.slice().reverse().map((visit) => (
                    <div key={visit.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-primary-500" />
                          <span className="font-semibold text-slate-800">{visit.date}</span>
                        </div>
                        <span className="text-sm text-slate-500">น้ำหนัก: {visit.weight} kg</span>
                      </div>
                      <pre className="p-5 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {visit.note}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ════════════════ DRP / CONSULT ════════════════ */}
          {activeTab === 'drp' && (
            <div className="space-y-6">
              {/* DRP */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
                  <p className="font-semibold text-orange-800 text-sm">Drug-Related Problems (DRP)</p>
                  <p className="text-xs text-orange-600 mt-0.5">ปัญหาที่เกี่ยวข้องกับการใช้ยา</p>
                </div>
                <div className="p-4">
                  {(patient as Patient & { drp?: Array<{ code: string; date: string; detail: string; intervention?: string }> }).drp?.length ? (
                    <div className="space-y-3">
                      {(patient as Patient & { drp?: Array<{ code: string; date: string; detail: string; intervention?: string }> }).drp!.map((d, i) => (
                        <div key={i} className="bg-orange-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">{d.code}</span>
                            <span className="text-xs text-slate-500">{d.date}</span>
                          </div>
                          <p className="text-sm text-slate-700">{d.detail}</p>
                          {d.intervention && (
                            <p className="text-xs text-emerald-600 mt-2 bg-emerald-50 rounded-lg px-3 py-2">
                              การแก้ไข: {d.intervention}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-8">ไม่มีข้อมูล DRP</p>
                  )}
                </div>
              </div>

              {/* Consult */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-secondary-50 border-b border-secondary-100">
                  <p className="font-semibold text-secondary-800 text-sm">บันทึก Consultation</p>
                  <p className="text-xs text-secondary-600 mt-0.5">การปรึกษาและให้คำแนะนำ</p>
                </div>
                <div className="p-4">
                  {(patient as Patient & { consults?: Array<{ type: string; date: string; note: string }> }).consults?.length ? (
                    <div className="space-y-3">
                      {(patient as Patient & { consults?: Array<{ type: string; date: string; note: string }> }).consults!.map((c, i) => (
                        <div key={i} className="bg-secondary-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-secondary-200 text-secondary-800 px-2 py-0.5 rounded-full font-medium">{c.type}</span>
                            <span className="text-xs text-slate-500">{c.date}</span>
                          </div>
                          <p className="text-sm text-slate-700">{c.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-8">ไม่มีบันทึก Consult</p>
                  )}
                </div>
              </div>

              {/* DRP Type Reference */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="font-semibold text-slate-700 text-sm">ตารางอ้างอิง DRP Classification</p>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {DRP_TYPES.map((t) => (
                    <div key={t.code} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-bold text-primary-600 w-8 flex-shrink-0">{t.code}</span>
                      <span>{t.label.replace(`${t.code} — `, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ DOT CALENDAR ════════════════ */}
          {activeTab === 'dot' && (
            <>
              {(!patient.dot || Object.keys(patient.dot).length === 0) ? (
                <div className="text-center py-16 text-slate-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>ยังไม่มีข้อมูล DOT</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'กินยา', value: Object.values(patient.dot).filter(Boolean).length, color: 'text-emerald-600 bg-emerald-50' },
                      { label: 'ไม่กิน', value: Object.values(patient.dot).filter((v) => !v).length, color: 'text-red-500 bg-red-50' },
                      { label: 'Adherence', value: `${Math.round((Object.values(patient.dot).filter(Boolean).length / Object.keys(patient.dot).length) * 100)}%`, color: 'text-primary-600 bg-primary-50' },
                    ].map((s) => (
                      <div key={s.label} className={cn('rounded-xl p-4 text-center', s.color.split(' ')[1])}>
                        <p className={cn('text-2xl font-bold', s.color.split(' ')[0])}>{s.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded" /> กินยา</div>
                    <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-red-100 border border-red-300 rounded" /> ไม่กิน</div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="border border-slate-200 rounded-xl p-5">
                    <div className="grid grid-cols-7 gap-1.5 mb-2">
                      {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
                        <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {(() => {
                        const entries = Object.entries(patient.dot).sort(([a], [b]) => a.localeCompare(b));
                        const firstDate = new Date(entries[0][0]);
                        const startDay = firstDate.getDay();
                        const result = [];
                        for (let i = 0; i < startDay; i++) {
                          result.push(<div key={`pad-${i}`} className="aspect-square" />);
                        }
                        entries.forEach(([date, taken]) => {
                          const d = new Date(date);
                          result.push(
                            <div
                              key={date}
                              title={`${date}: ${taken ? 'กินยา' : 'ไม่กิน'}`}
                              className={cn(
                                'aspect-square rounded-lg flex items-center justify-center text-xs font-medium',
                                taken
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-100 text-red-500 border border-red-200'
                              )}
                            >
                              {d.getDate()}
                            </div>
                          );
                        });
                        return result;
                      })()}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
