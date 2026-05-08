'use client';

import { useState } from 'react';
import { X, UserPlus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/data';
import {
  PREFIXES,
  TAMBONS,
  REGIMENS,
  PATIENT_TYPES,
  DISEASE_LOCATIONS,
  EXTRA_PULMONARY_TYPES,
  DEFAULT_COMORBIDITIES,
} from '@/lib/data';

interface AddPatientModalProps {
  onClose: () => void;
  onAdd: (patient: Patient) => void;
}

export function AddPatientModal({ onClose, onAdd }: AddPatientModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    prefix: 'นาย',
    firstName: '',
    lastName: '',
    hn: '',
    age: '',
    gender: 'M',
    weight: '',
    subdistrict: TAMBONS[0],
    patientType: 'New',
    diseaseLocation: 'Pulmonary',
    extraPulmonaryType: '',
    regimen: '2HRZE/4HR',
    comorbidities: [] as string[],
    hivStatus: '',
    hivNote: '',
    startDate: new Date().toISOString().split('T')[0],
    nextAppt: '',
  });

  const handleChange = (field: string, value: string | string[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleComorbidity = (c: string) => {
    const current = formData.comorbidities;
    if (current.includes(c)) {
      handleChange('comorbidities', current.filter((x) => x !== c));
    } else {
      handleChange('comorbidities', [...current, c]);
    }
  };

  const handleSubmit = () => {
    const newId = `P${Date.now()}`;
    const newPatient: Patient = {
      id: newId,
      hn: formData.hn,
      prefix: formData.prefix,
      firstName: formData.firstName,
      lastName: formData.lastName,
      name: `${formData.prefix} ${formData.firstName} ${formData.lastName}`,
      age: parseInt(formData.age),
      gender: formData.gender as 'M' | 'F',
      patientType: formData.patientType,
      diseaseLocation: formData.diseaseLocation,
      extraPulmonaryType: formData.extraPulmonaryType,
      subdistrict: formData.subdistrict,
      weight: parseFloat(formData.weight),
      regimen: formData.regimen,
      regimenHistory: [
        {
          regimen: formData.regimen,
          startDate: formData.startDate,
          reason: 'เริ่มรักษาครั้งแรก',
          isCurrent: true,
        },
      ],
      phase: 'Intensive',
      month: 1,
      day: 1,
      status: 'normal',
      adherence: 100,
      comorbidities: formData.comorbidities,
      concomitantDrugs: [],
      hivStatus: formData.hivStatus || null,
      hivNote: formData.hivNote,
      nextAppt: formData.nextAppt,
      daysUntil: 30,
      startDate: formData.startDate,
      labs: [],
      sputum: [],
      adr: {},
      visits: [],
      dot: {},
      customDoses: null,
    };
    onAdd(newPatient);
    onClose();
  };

  const isStep1Valid =
    formData.firstName && formData.lastName && formData.hn && formData.age && formData.weight;
  const isStep2Valid = formData.regimen && formData.startDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">ลงทะเบียนผู้ป่วยใหม่</h2>
                <p className="text-white/80 text-sm mt-1">ขั้นตอนที่ {step} / 3</p>
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

        {/* Progress */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'flex-1 h-2 rounded-full transition-all',
                  s <= step ? 'bg-primary-500' : 'bg-slate-200'
                )}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>ข้อมูลส่วนตัว</span>
            <span>ข้อมูลการรักษา</span>
            <span>โรคร่วม</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 max-h-[50vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800">ข้อมูลส่วนตัว</h3>

              <div className="grid grid-cols-4 gap-4">
                <FormSelect
                  label="คำนำหน้า"
                  value={formData.prefix}
                  onChange={(v) => handleChange('prefix', v)}
                  options={PREFIXES.map((p) => ({ value: p, label: p }))}
                />
                <div className="col-span-3 grid grid-cols-2 gap-4">
                  <FormInput
                    label="ชื่อ"
                    value={formData.firstName}
                    onChange={(v) => handleChange('firstName', v)}
                    placeholder="ชื่อจริง"
                  />
                  <FormInput
                    label="นามสกุล"
                    value={formData.lastName}
                    onChange={(v) => handleChange('lastName', v)}
                    placeholder="นามสกุล"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="HN"
                  value={formData.hn}
                  onChange={(v) => handleChange('hn', v)}
                  placeholder="เช่น 12345/67"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="อายุ"
                    value={formData.age}
                    onChange={(v) => handleChange('age', v)}
                    placeholder="ปี"
                    type="number"
                  />
                  <FormSelect
                    label="เพศ"
                    value={formData.gender}
                    onChange={(v) => handleChange('gender', v)}
                    options={[
                      { value: 'M', label: 'ชาย' },
                      { value: 'F', label: 'หญิง' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="น้ำหนัก (kg)"
                  value={formData.weight}
                  onChange={(v) => handleChange('weight', v)}
                  placeholder="กิโลกรัม"
                  type="number"
                />
                <FormSelect
                  label="ตำบล"
                  value={formData.subdistrict}
                  onChange={(v) => handleChange('subdistrict', v)}
                  options={TAMBONS.map((t) => ({ value: t, label: t }))}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800">ข้อมูลการรักษา</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="ประเภทผู้ป่วย"
                  value={formData.patientType}
                  onChange={(v) => handleChange('patientType', v)}
                  options={PATIENT_TYPES.map((t) => ({ value: t, label: t }))}
                />
                <FormSelect
                  label="ตำแหน่งโรค"
                  value={formData.diseaseLocation}
                  onChange={(v) => handleChange('diseaseLocation', v)}
                  options={DISEASE_LOCATIONS.map((d) => ({ value: d, label: d }))}
                />
              </div>

              {formData.diseaseLocation === 'Extra-pulmonary' && (
                <FormSelect
                  label="ชนิด Extra-pulmonary"
                  value={formData.extraPulmonaryType}
                  onChange={(v) => handleChange('extraPulmonaryType', v)}
                  options={[
                    { value: '', label: 'เลือก...' },
                    ...EXTRA_PULMONARY_TYPES.map((t) => ({ value: t, label: t })),
                  ]}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="สูตรยา"
                  value={formData.regimen}
                  onChange={(v) => handleChange('regimen', v)}
                  options={REGIMENS.map((r) => ({ value: r, label: r }))}
                />
                <FormInput
                  label="วันที่เริ่มรักษา"
                  value={formData.startDate}
                  onChange={(v) => handleChange('startDate', v)}
                  type="date"
                />
              </div>

              <FormInput
                label="วันนัดถัดไป"
                value={formData.nextAppt}
                onChange={(v) => handleChange('nextAppt', v)}
                placeholder="เช่น 25 ต.ค. 67"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800">โรคร่วม</h3>

              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_COMORBIDITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleComorbidity(c)}
                    className={cn(
                      'text-left px-4 py-3 rounded-xl border-2 transition-all text-sm',
                      formData.comorbidities.includes(c)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <FormSelect
                  label="HIV Status"
                  value={formData.hivStatus}
                  onChange={(v) => handleChange('hivStatus', v)}
                  options={[
                    { value: '', label: 'ไม่ทราบ' },
                    { value: 'Negative', label: 'Negative' },
                    { value: 'Positive', label: 'Positive' },
                  ]}
                />
                {formData.hivStatus === 'Positive' && (
                  <FormInput
                    label="หมายเหตุ HIV"
                    value={formData.hivNote}
                    onChange={(v) => handleChange('hivNote', v)}
                    placeholder="เช่น CD4 = 350"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-6 py-2.5 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            {step > 1 ? 'ย้อนกลับ' : 'ยกเลิก'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !isStep1Valid}
              className={cn(
                'px-6 py-2.5 rounded-xl font-medium transition-all',
                (step === 1 && !isStep1Valid)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg'
              )}
            >
              ถัดไป
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 shadow-md hover:shadow-lg transition-all"
            >
              บันทึก
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Form Input Component
function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>
  );
}

// Form Select Component
function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
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
