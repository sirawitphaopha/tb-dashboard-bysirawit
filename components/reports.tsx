'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  AlertTriangle,
  Pill,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/data';
import { ADR_LIST, DRP_TYPES } from '@/lib/data';

interface ReportsProps {
  patients: Patient[];
}

type ReportType = 'adherence' | 'adr' | 'drp' | 'consult' | 'summary';

export function Reports({ patients }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('summary');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const reports = [
    {
      id: 'summary',
      title: 'รายงานสรุปภาพรวม',
      description: 'สรุปข้อมูลผู้ป่วยทั้งหมด',
      icon: TrendingUp,
      color: 'primary',
    },
    {
      id: 'adherence',
      title: 'รายงาน Adherence',
      description: 'การกินยาต่อเนื่องของผู้ป่วย',
      icon: CheckCircle,
      color: 'green',
    },
    {
      id: 'adr',
      title: 'รายงาน ADR',
      description: 'อาการไม่พึงประสงค์จากยา',
      icon: AlertTriangle,
      color: 'amber',
    },
    {
      id: 'drp',
      title: 'รายงาน DRP',
      description: 'Drug Related Problems',
      icon: Pill,
      color: 'red',
    },
    {
      id: 'consult',
      title: 'รายงานการ Consult',
      description: 'สรุปการปรึกษาเภสัชกร',
      icon: FileText,
      color: 'blue',
    },
  ];

  const handleExport = (format: 'excel' | 'csv') => {
    // Export logic would go here
    alert(`กำลังส่งออกรายงานเป็น ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          const isSelected = selectedReport === report.id;
          const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
            primary: { bg: 'bg-primary-50', icon: 'text-primary-500', border: 'border-primary-500' },
            green: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-500' },
            amber: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-500' },
            red: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-500' },
            blue: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-500' },
          };
          const colors = colorClasses[report.color];

          return (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id as ReportType)}
              className={cn(
                'p-4 rounded-2xl border-2 text-left transition-all',
                isSelected
                  ? `${colors.bg} ${colors.border}`
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              )}
            >
              <Icon className={cn('h-6 w-6 mb-3', isSelected ? colors.icon : 'text-slate-400')} />
              <p className={cn('font-semibold', isSelected ? 'text-slate-800' : 'text-slate-600')}>
                {report.title}
              </p>
              <p className="text-xs text-slate-500 mt-1">{report.description}</p>
            </button>
          );
        })}
      </div>

      {/* Filters & Export */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
          {/* Date Range */}
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">จากวันที่</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">ถึงวันที่</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-md"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-500 text-white rounded-xl hover:bg-slate-600 transition-colors shadow-md"
            >
              <Download className="h-5 w-5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {selectedReport === 'summary' && <SummaryReport patients={patients} />}
        {selectedReport === 'adherence' && <AdherenceReport patients={patients} />}
        {selectedReport === 'adr' && <ADRReport patients={patients} />}
        {selectedReport === 'drp' && <DRPReport patients={patients} />}
        {selectedReport === 'consult' && <ConsultReport patients={patients} />}
      </div>
    </div>
  );
}

// Summary Report
function SummaryReport({ patients }: { patients: Patient[] }) {
  const stats = {
    total: patients.length,
    intensive: patients.filter((p) => p.phase === 'Intensive').length,
    continuation: patients.filter((p) => p.phase === 'Continuation').length,
    avgAdherence: Math.round(patients.reduce((sum, p) => sum + p.adherence, 0) / patients.length),
    critical: patients.filter((p) => p.status === 'critical').length,
    withHIV: patients.filter((p) => p.hivStatus === 'Positive').length,
    withDM: patients.filter((p) => p.comorbidities.some((c) => c.includes('DM'))).length,
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">สรุปภาพรวมผู้ป่วย</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="ผู้ป่วยทั้งหมด" value={stats.total} color="primary" />
        <StatCard label="Intensive Phase" value={stats.intensive} color="green" />
        <StatCard label="Continuation Phase" value={stats.continuation} color="blue" />
        <StatCard label="Adherence เฉลี่ย" value={`${stats.avgAdherence}%`} color="emerald" />
        <StatCard label="เคสวิกฤต" value={stats.critical} color="red" />
        <StatCard label="HIV Co-infection" value={stats.withHIV} color="amber" />
        <StatCard label="มีเบาหวาน" value={stats.withDM} color="orange" />
      </div>
    </div>
  );
}

// Adherence Report
function AdherenceReport({ patients }: { patients: Patient[] }) {
  const sorted = [...patients].sort((a, b) => a.adherence - b.adherence);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">ชื่อผู้ป่วย</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">HN</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Phase</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Adherence</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
              <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
              <td className="px-6 py-4 text-slate-600 font-mono">{p.hn}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  p.phase === 'Intensive' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'
                )}>
                  {p.phase}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        p.adherence >= 90 ? 'bg-green-500' : p.adherence >= 80 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${p.adherence}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{p.adherence}%</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  p.adherence >= 90 ? 'bg-green-100 text-green-700' : p.adherence >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                )}>
                  {p.adherence >= 90 ? 'ดีมาก' : p.adherence >= 80 ? 'พอใช้' : 'ต้องปรับปรุง'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ADR Report
function ADRReport({ patients }: { patients: Patient[] }) {
  const adrSummary = ADR_LIST.map((adr) => ({
    ...adr,
    count: patients.filter((p) => p.adr[adr.key]?.checked).length,
    patients: patients.filter((p) => p.adr[adr.key]?.checked),
  })).filter((a) => a.count > 0);

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">สรุปอาการไม่พึงประสงค์จากยา</h3>
      {adrSummary.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>ไม่พบรายงาน ADR</p>
        </div>
      ) : (
        <div className="space-y-3">
          {adrSummary.map((adr) => (
            <div key={adr.key} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{adr.label}</p>
                  <p className="text-sm text-slate-500">{adr.sub} | ยาที่สัมพันธ์: {adr.drug}</p>
                </div>
                <span className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold">
                  {adr.count} ราย
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {adr.patients.map((p) => (
                  <span key={p.id} className="px-3 py-1 bg-white rounded-lg text-sm text-slate-600">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// DRP Report
function DRPReport({ patients }: { patients: Patient[] }) {
  const allDRPs = patients.flatMap((p) =>
    p.visits.flatMap((v) =>
      (v.drp || []).map((d) => ({
        patient: p.name,
        hn: p.hn,
        date: v.date,
        ...d,
      }))
    )
  );

  return (
    <div className="overflow-x-auto">
      {allDRPs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>ไม่พบรายงาน DRP</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">ผู้ป่วย</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">วันที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">ประเภท DRP</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {allDRPs.map((drp, index) => (
              <tr key={index} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-800">{drp.patient}</p>
                  <p className="text-sm text-slate-500">{drp.hn}</p>
                </td>
                <td className="px-6 py-4 text-slate-600">{drp.date}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {drp.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{drp.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Consult Report
function ConsultReport({ patients }: { patients: Patient[] }) {
  const allConsults = patients.flatMap((p) =>
    p.visits
      .filter((v) => v.consult?.type)
      .map((v) => ({
        patient: p.name,
        hn: p.hn,
        date: v.date,
        ...v.consult!,
      }))
  );

  return (
    <div className="overflow-x-auto">
      {allConsults.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>ไม่พบรายงาน Consult</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">ผู้ป่วย</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">วันที่</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">ประเภท</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {allConsults.map((consult, index) => (
              <tr key={index} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-800">{consult.patient}</p>
                  <p className="text-sm text-slate-500">{consult.hn}</p>
                </td>
                <td className="px-6 py-4 text-slate-600">{consult.date}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {consult.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{consult.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    primary: 'bg-primary-50',
    green: 'bg-green-50',
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    red: 'bg-red-50',
    amber: 'bg-amber-50',
    orange: 'bg-orange-50',
  };

  const textColors: Record<string, string> = {
    primary: 'text-primary-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    orange: 'text-orange-600',
  };

  return (
    <div className={cn('p-4 rounded-xl', bgColors[color])}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', textColors[color])}>{value}</p>
    </div>
  );
}
