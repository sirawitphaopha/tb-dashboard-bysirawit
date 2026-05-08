'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  Eye,
  MoreHorizontal,
  UserPlus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/data';
import { TAMBONS, REGIMENS, PATIENT_TYPES, DISEASE_LOCATIONS } from '@/lib/data';
import { PatientDetailModal } from './patient-detail-modal';
import { AddPatientModal } from './add-patient-modal';

interface PatientRegistryProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
}

export function PatientRegistry({
  patients,
  onAddPatient,
  onUpdatePatient,
}: PatientRegistryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSubdistrict, setFilterSubdistrict] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.hn.includes(searchTerm);
      const matchPhase = filterPhase === 'all' || p.phase === filterPhase;
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchSubdistrict =
        filterSubdistrict === 'all' || p.subdistrict === filterSubdistrict;
      return matchSearch && matchPhase && matchStatus && matchSubdistrict;
    });
  }, [patients, searchTerm, filterPhase, filterStatus, filterSubdistrict]);

  const clearFilters = () => {
    setFilterPhase('all');
    setFilterStatus('all');
    setFilterSubdistrict('all');
  };

  const hasActiveFilters =
    filterPhase !== 'all' || filterStatus !== 'all' || filterSubdistrict !== 'all';

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ หรือ HN..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all',
              showFilters || hasActiveFilters
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">ตัวกรอง</span>
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                {[filterPhase, filterStatus, filterSubdistrict].filter(
                  (f) => f !== 'all'
                ).length}
              </span>
            )}
          </button>
        </div>

        {/* Add Patient Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium"
        >
          <UserPlus className="h-5 w-5" />
          <span>ลงทะเบียนผู้ป่วยใหม่</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">ตัวกรองข้อมูล</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                ล้างตัวกรอง
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FilterSelect
              label="ระยะการรักษา"
              value={filterPhase}
              onChange={setFilterPhase}
              options={[
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'Intensive', label: 'Intensive Phase' },
                { value: 'Continuation', label: 'Continuation Phase' },
              ]}
            />
            <FilterSelect
              label="สถานะ"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'normal', label: 'ปกติ' },
                { value: 'warning', label: 'เฝ้าระวัง' },
                { value: 'critical', label: 'วิกฤต' },
              ]}
            />
            <FilterSelect
              label="ตำบล"
              value={filterSubdistrict}
              onChange={setFilterSubdistrict}
              options={[
                { value: 'all', label: 'ทั้งหมด' },
                ...TAMBONS.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          แสดง {filteredPatients.length} จาก {patients.length} ราย
        </span>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  ผู้ป่วย
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  HN
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  ระยะ
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  สูตรยา
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  Adherence
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  นัดถัดไป
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                  สถานะ
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, index) => (
                <tr
                  key={patient.id}
                  className={cn(
                    'border-b border-slate-50 hover:bg-slate-50 transition-colors',
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium',
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
                        <p className="font-medium text-slate-800">{patient.name}</p>
                        <p className="text-sm text-slate-500">
                          {patient.age} ปี | {patient.subdistrict}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700 font-mono">{patient.hn}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex px-3 py-1 rounded-full text-xs font-medium',
                        patient.phase === 'Intensive'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-secondary-100 text-secondary-700'
                      )}
                    >
                      {patient.phase}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 text-sm">{patient.regimen}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            patient.adherence >= 90
                              ? 'bg-green-500'
                              : patient.adherence >= 80
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          )}
                          style={{ width: `${patient.adherence}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600">{patient.adherence}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-700">{patient.nextAppt}</p>
                      {patient.daysUntil <= 1 && (
                        <p className="text-xs text-red-500 font-medium">พรุ่งนี้!</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={patient.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="p-2 hover:bg-primary-50 rounded-lg text-slate-500 hover:text-primary-600 transition-colors"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">ไม่พบผู้ป่วย</p>
            <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือตัวกรอง</p>
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onUpdate={onUpdatePatient}
        />
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddPatient}
        />
      )}
    </div>
  );
}

// Filter Select Component
interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = {
    normal: { label: 'ปกติ', class: 'bg-green-100 text-green-700' },
    warning: { label: 'เฝ้าระวัง', class: 'bg-amber-100 text-amber-700' },
    critical: { label: 'วิกฤต', class: 'bg-red-100 text-red-700' },
  };
  const { label, class: className } = config[status as keyof typeof config] || config.normal;

  return (
    <span className={cn('inline-flex px-3 py-1 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  );
}
