'use client';

import { useState } from 'react';
import {
  X,
  User,
  Calendar,
  Pill,
  FileText,
  Activity,
  AlertTriangle,
  ChevronRight,
  Beaker,
  Heart,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/data';
import { calcDoses, calcCrCl, crClStage, ADR_LIST } from '@/lib/data';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdate: (patient: Patient) => void;
}

type TabType = 'overview' | 'labs' | 'visits' | 'adr' | 'doses';

export function PatientDetailModal({
  patient,
  onClose,
  onUpdate,
}: PatientDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const doses = calcDoses(patient.weight, patient.regimen, patient.customDoses || undefined);
  const lastLab = patient.labs[patient.labs.length - 1];
  const crcl = lastLab?.scr
    ? calcCrCl(patient.age, patient.weight, lastLab.scr, patient.gender)
    : null;
  const crclInfo = crClStage(crcl);

  const tabs = [
    { id: 'overview', label: 'ข้อมูลทั่วไป', icon: User },
    { id: 'doses', label: 'ขนาดยา', icon: Pill },
    { id: 'labs', label: 'ผล Lab', icon: Beaker },
    { id: 'adr', label: 'ADR', icon: AlertTriangle },
    { id: 'visits', label: 'บันทึกการพบ', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {patient.firstName.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{patient.name}</h2>
                <p className="text-white/80 mt-1">
                  HN: {patient.hn} | {patient.age} ปี | {patient.gender === 'M' ? 'ชาย' : 'หญิง'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {patient.phase}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {patient.regimen}
                  </span>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm',
                    patient.status === 'critical' ? 'bg-red-500' :
                    patient.status === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                  )}>
                    {patient.status === 'critical' ? 'วิกฤต' :
                     patient.status === 'warning' ? 'เฝ้าระวัง' : 'ปกติ'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 px-8">
          <div className="flex gap-2 -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <OverviewTab patient={patient} crclInfo={crclInfo} />
          )}
          {activeTab === 'doses' && (
            <DosesTab patient={patient} doses={doses} />
          )}
          {activeTab === 'labs' && <LabsTab patient={patient} />}
          {activeTab === 'adr' && <ADRTab patient={patient} />}
          {activeTab === 'visits' && <VisitsTab patient={patient} />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ patient, crclInfo }: { patient: Patient; crclInfo: { label: string; color: string } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoCard title="ข้อมูลพื้นฐาน" icon={User}>
        <InfoRow label="ประเภทผู้ป่วย" value={patient.patientType} />
        <InfoRow label="ตำแหน่งโรค" value={patient.diseaseLocation} />
        {patient.extraPulmonaryType && (
          <InfoRow label="ชนิด Extra-pulmonary" value={patient.extraPulmonaryType} />
        )}
        <InfoRow label="น้ำหนัก" value={`${patient.weight} kg`} />
        <InfoRow label="ตำบล" value={patient.subdistrict} />
        <InfoRow label="วันเริ่มรักษา" value={patient.startDate} />
      </InfoCard>

      <InfoCard title="การรักษา" icon={Pill}>
        <InfoRow label="สูตรยา" value={patient.regimen} />
        <InfoRow label="เดือนที่" value={`${patient.month}`} />
        <InfoRow label="วันที่" value={`${patient.day}`} />
        <InfoRow label="Adherence" value={`${patient.adherence}%`} />
        <InfoRow label="นัดถัดไป" value={patient.nextAppt} />
      </InfoCard>

      <InfoCard title="โรคร่วม" icon={Heart}>
        {patient.comorbidities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {patient.comorbidities.map((c, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm"
              >
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">ไม่มีโรคร่วม</p>
        )}
      </InfoCard>

      <InfoCard title="ค่าไต (CrCl)" icon={Activity}>
        <p className={cn('text-lg font-semibold', crclInfo.color)}>{crclInfo.label}</p>
        {patient.hivStatus && (
          <div className="mt-3 p-3 bg-red-50 rounded-xl">
            <p className="text-sm font-medium text-red-700">
              HIV: {patient.hivStatus}
            </p>
            {patient.hivNote && (
              <p className="text-sm text-red-600 mt-1">{patient.hivNote}</p>
            )}
          </div>
        )}
      </InfoCard>
    </div>
  );
}

// Doses Tab
function DosesTab({
  patient,
  doses,
}: {
  patient: Patient;
  doses: ReturnType<typeof calcDoses>;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-2xl p-4">
        <p className="text-sm text-slate-500">
          น้ำหนัก: <span className="font-semibold text-slate-700">{patient.weight} kg</span> |
          สูตรยา: <span className="font-semibold text-slate-700">{patient.regimen}</span>
        </p>
      </div>

      <div className="grid gap-4">
        {doses.map((d) => (
          <div
            key={d.key}
            className={cn(
              'p-5 rounded-2xl border-2 transition-all',
              d.status === 'ok'
                ? 'border-green-200 bg-green-50'
                : d.status === 'high'
                ? 'border-red-200 bg-red-50'
                : 'border-amber-200 bg-amber-50'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{d.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {d.strength} mg x {d.tabs} เม็ด = {d.dose} mg
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-2xl font-bold',
                    d.status === 'ok'
                      ? 'text-green-600'
                      : d.status === 'high'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  )}
                >
                  {d.mgkg} mg/kg
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  เกณฑ์: {d.min}-{d.max} mg/kg
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Labs Tab
function LabsTab({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      {patient.labs.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Beaker className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>ยังไม่มีผล Lab</p>
        </div>
      ) : (
        patient.labs.map((lab, index) => (
          <div
            key={index}
            className="p-5 bg-slate-50 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {lab.tp}
              </span>
              <span className="text-sm text-slate-500">{lab.date}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {lab.alt !== undefined && (
                <LabValue label="ALT" value={lab.alt} unit="U/L" high={lab.alt > 40} critical={lab.alt > 120} />
              )}
              {lab.ast !== undefined && (
                <LabValue label="AST" value={lab.ast} unit="U/L" high={lab.ast > 40} critical={lab.ast > 120} />
              )}
              {lab.scr !== undefined && (
                <LabValue label="Scr" value={lab.scr} unit="mg/dL" high={lab.scr > 1.2} />
              )}
              {lab.ua !== undefined && (
                <LabValue label="UA" value={lab.ua} unit="mg/dL" high={lab.ua > 7.2} critical={lab.ua > 10} />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ADR Tab
function ADRTab({ patient }: { patient: Patient }) {
  const activeADRs = ADR_LIST.filter((a) => patient.adr[a.key]?.checked);

  return (
    <div className="space-y-4">
      {activeADRs.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>ไม่พบอาการไม่พึงประสงค์</p>
        </div>
      ) : (
        activeADRs.map((adr) => {
          const data = patient.adr[adr.key];
          return (
            <div
              key={adr.key}
              className="p-5 bg-amber-50 border border-amber-200 rounded-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{adr.label}</p>
                  <p className="text-sm text-slate-500">{adr.sub}</p>
                  {data.note && (
                    <p className="text-sm text-slate-600 mt-2 p-3 bg-white rounded-xl">
                      {data.note}
                    </p>
                  )}
                </div>
                <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-xs font-medium">
                  {adr.drug}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// Visits Tab
function VisitsTab({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-4">
      {patient.visits.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>ยังไม่มีบันทึกการพบ</p>
        </div>
      ) : (
        patient.visits.map((visit) => (
          <div
            key={visit.id}
            className="p-5 bg-slate-50 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-primary-600">{visit.date}</span>
              <span className="text-sm text-slate-500">น้ำหนัก: {visit.weight} kg</span>
            </div>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-white p-4 rounded-xl">
              {visit.note}
            </pre>
          </div>
        ))
      )}
    </div>
  );
}

// Helper Components
function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary-500" />
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function LabValue({
  label,
  value,
  unit,
  high,
  critical,
}: {
  label: string;
  value: number;
  unit: string;
  high?: boolean;
  critical?: boolean;
}) {
  return (
    <div className="text-center p-3 bg-white rounded-xl">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={cn(
          'text-lg font-bold',
          critical ? 'text-red-600' : high ? 'text-amber-600' : 'text-green-600'
        )}
      >
        {value}
      </p>
      <p className="text-xs text-slate-400">{unit}</p>
    </div>
  );
}
