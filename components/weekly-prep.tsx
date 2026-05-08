'use client';

import { useMemo } from 'react';
import { Calendar, Pill, User, Clock, AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/data';
import { calcDoses } from '@/lib/data';

interface WeeklyPrepProps {
  patients: Patient[];
}

export function WeeklyPrep({ patients }: WeeklyPrepProps) {
  const weeklyQueue = useMemo(() => {
    const today = new Date();
    const days: { date: Date; label: string; patients: Patient[] }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayPatients = patients.filter((p) => p.daysUntil === i);
      
      const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      
      const label = i === 0
        ? 'วันนี้'
        : i === 1
        ? 'พรุ่งนี้'
        : `${thaiDays[date.getDay()]} ${date.getDate()} ${thaiMonths[date.getMonth()]}`;

      days.push({ date, label, patients: dayPatients });
    }

    return days;
  }, [patients]);

  const totalPatients = weeklyQueue.reduce((sum, day) => sum + day.patients.length, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">คิวเตรียมยา 7 วัน</h2>
              <p className="text-white/80 mt-1">
                มี {totalPatients} นัดที่ต้องเตรียมยา
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
            <Printer className="h-5 w-5" />
            <span>พิมพ์รายการ</span>
          </button>
        </div>
      </div>

      {/* Queue by Day */}
      <div className="space-y-4">
        {weeklyQueue.map((day, index) => (
          <div
            key={index}
            className={cn(
              'bg-white rounded-2xl shadow-card overflow-hidden transition-all',
              day.patients.length === 0 && 'opacity-60'
            )}
          >
            {/* Day Header */}
            <div
              className={cn(
                'px-6 py-4 border-b border-slate-100 flex items-center justify-between',
                index === 0 && 'bg-primary-50',
                index === 1 && 'bg-amber-50'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-bold',
                    index === 0
                      ? 'bg-primary-500 text-white'
                      : index === 1
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {day.date.getDate()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{day.label}</p>
                  <p className="text-sm text-slate-500">
                    {day.patients.length > 0
                      ? `${day.patients.length} คนที่ต้องเตรียมยา`
                      : 'ไม่มีนัด'}
                  </p>
                </div>
              </div>
              {day.patients.length > 0 && (
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    index === 0
                      ? 'bg-primary-100 text-primary-700'
                      : index === 1
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {day.patients.length} ราย
                </span>
              )}
            </div>

            {/* Patients for this day */}
            {day.patients.length > 0 && (
              <div className="divide-y divide-slate-50">
                {day.patients.map((patient) => (
                  <PatientPrepCard key={patient.id} patient={patient} isToday={index === 0} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Patient Prep Card
function PatientPrepCard({ patient, isToday }: { patient: Patient; isToday: boolean }) {
  const doses = calcDoses(patient.weight, patient.regimen, patient.customDoses || undefined);
  const hasWarning = patient.status !== 'normal';

  return (
    <div className={cn('p-6', isToday && 'bg-primary-50/30')}>
      <div className="flex items-start justify-between gap-6">
        {/* Patient Info */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-white font-medium',
              patient.status === 'critical'
                ? 'bg-red-500'
                : patient.status === 'warning'
                ? 'bg-amber-500'
                : 'bg-primary-500'
            )}
          >
            {patient.firstName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800">{patient.name}</p>
              {hasWarning && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  {patient.status === 'critical' ? 'วิกฤต' : 'เฝ้าระวัง'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              HN: {patient.hn} | {patient.weight} kg | {patient.regimen}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Phase: {patient.phase} | เดือนที่ {patient.month} | วันที่ {patient.day}
            </p>
          </div>
        </div>

        {/* Doses */}
        <div className="flex-shrink-0">
          <p className="text-xs text-slate-500 mb-2 text-right">ขนาดยาที่ต้องเตรียม</p>
          <div className="flex gap-2">
            {doses.map((d) => (
              <div
                key={d.key}
                className={cn(
                  'px-3 py-2 rounded-xl text-center min-w-16',
                  d.status === 'ok'
                    ? 'bg-green-50 border border-green-200'
                    : d.status === 'high'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-amber-50 border border-amber-200'
                )}
              >
                <p className="text-xs text-slate-500">{d.key}</p>
                <p
                  className={cn(
                    'font-bold text-lg',
                    d.status === 'ok'
                      ? 'text-green-600'
                      : d.status === 'high'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  )}
                >
                  {d.tabs}
                </p>
                <p className="text-xs text-slate-400">{d.dose}mg</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drug Warnings */}
      {(patient.comorbidities.some((c) => c.includes('HIV')) ||
        patient.comorbidities.some((c) => c.includes('CKD'))) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">ข้อควรระวัง</p>
              {patient.comorbidities.some((c) => c.includes('HIV')) && (
                <p className="text-amber-700">Rifampicin + ARV: ตรวจสอบ Drug Interaction</p>
              )}
              {patient.comorbidities.some((c) => c.includes('CKD')) && (
                <p className="text-amber-700">CKD: พิจารณาปรับขนาดยา</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
