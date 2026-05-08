'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Dashboard } from '@/components/dashboard';
import { PatientRegistry } from '@/components/patient-registry';
import { WeeklyPrep } from '@/components/weekly-prep';
import { Reports } from '@/components/reports';
import { INITIAL_PATIENTS } from '@/lib/patients';
import { generateAlerts, type Patient } from '@/lib/data';

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'ภาพรวมการดูแลผู้ป่วยวัณโรค' },
  patients: { title: 'ทะเบียนผู้ป่วย', subtitle: 'จัดการข้อมูลผู้ป่วยทั้งหมด' },
  weekly: { title: 'คิวเตรียมยา', subtitle: 'รายการนัดหมายใน 7 วัน' },
  reports: { title: 'รายงาน', subtitle: 'สรุปข้อมูลและส่งออกรายงาน' },
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const alerts = generateAlerts(patients);
  const config = pageConfig[currentPage];

  const handleAddPatient = (newPatient: Patient) => {
    setPatients([...patients, newPatient]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            patients={patients}
            alerts={alerts}
            onViewPatient={(id) => {
              setCurrentPage('patients');
            }}
          />
        );
      case 'patients':
        return (
          <PatientRegistry
            patients={patients}
            onAddPatient={handleAddPatient}
            onUpdatePatient={handleUpdatePatient}
          />
        );
      case 'weekly':
        return <WeeklyPrep patients={patients} />;
      case 'reports':
        return <Reports patients={patients} />;
      default:
        return <Dashboard patients={patients} alerts={alerts} onViewPatient={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Header
          title={config.title}
          subtitle={config.subtitle}
          alerts={alerts}
        />
        <div className="p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
