'use client';

import { useMemo } from 'react';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Pill,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/data';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardProps {
  patients: Patient[];
  alerts: Array<{ id: string; type: string; patient: string; msg: string; time: string }>;
  onViewPatient: (id: string) => void;
}

const PHASE_COLORS = {
  Intensive: '#14b8a6',
  Continuation: '#0ea5e9',
};

export function Dashboard({ patients, alerts, onViewPatient }: DashboardProps) {
  const stats = useMemo(() => {
    const total = patients.length;
    const intensive = patients.filter((p) => p.phase === 'Intensive').length;
    const continuation = patients.filter((p) => p.phase === 'Continuation').length;
    const critical = patients.filter((p) => p.status === 'critical').length;
    const avgAdherence = Math.round(
      patients.reduce((sum, p) => sum + p.adherence, 0) / total
    );
    const upcomingAppts = patients.filter((p) => p.daysUntil <= 7).length;

    return { total, intensive, continuation, critical, avgAdherence, upcomingAppts };
  }, [patients]);

  const phaseData = [
    { name: 'Intensive', value: stats.intensive, color: PHASE_COLORS.Intensive },
    { name: 'Continuation', value: stats.continuation, color: PHASE_COLORS.Continuation },
  ];

  const trendData = [
    { month: 'ม.ค.', patients: 2 },
    { month: 'ก.พ.', patients: 3 },
    { month: 'มี.ค.', patients: 2 },
    { month: 'เม.ย.', patients: 4 },
    { month: 'พ.ค.', patients: 3 },
    { month: 'มิ.ย.', patients: 4 },
  ];

  const criticalCases = useMemo(() => {
    return patients
      .filter((p) => p.status === 'critical' || p.daysUntil <= 1)
      .slice(0, 5);
  }, [patients]);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="ผู้ป่วยทั้งหมด"
          value={stats.total}
          subtitle="กำลังรักษา"
          icon={Users}
          trend="+2 จากเดือนก่อน"
          color="primary"
        />
        <KPICard
          title="Adherence เฉลี่ย"
          value={`${stats.avgAdherence}%`}
          subtitle="การกินยาต่อเนื่อง"
          icon={UserCheck}
          trend="ดีมาก"
          color="green"
        />
        <KPICard
          title="เคสวิกฤต"
          value={stats.critical}
          subtitle="ต้องติดตามด่วน"
          icon={AlertTriangle}
          color="red"
        />
        <KPICard
          title="นัดใน 7 วัน"
          value={stats.upcomingAppts}
          subtitle="รอเตรียมยา"
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">แนวโน้มผู้ป่วยใหม่</h3>
              <p className="text-sm text-slate-500">รายเดือน 6 เดือนล่าสุด</p>
            </div>
            <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="patients"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPatients)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">สัดส่วนตามระยะ</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {phaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {phaseData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-600">{item.name}</span>
                <span className="text-sm font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Cases */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">เคสที่ต้องติดตาม</h3>
                <p className="text-sm text-slate-500">ผู้ป่วยสถานะวิกฤต หรือนัดพรุ่งนี้</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {criticalCases.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>ไม่มีเคสวิกฤตในขณะนี้</p>
              </div>
            ) : (
              criticalCases.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => onViewPatient(patient.id)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium',
                        patient.status === 'critical'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      )}
                    >
                      {patient.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-800">{patient.name}</p>
                      <p className="text-sm text-slate-500">
                        HN: {patient.hn} | นัด: {patient.nextAppt}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">การแจ้งเตือน</h3>
                <p className="text-sm text-slate-500">
                  {alerts.length} รายการที่ต้องดำเนินการ
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 rounded-xl border-l-4',
                    alert.type === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : alert.type === 'warning'
                      ? 'bg-amber-50 border-amber-500'
                      : 'bg-blue-50 border-blue-500'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{alert.patient}</p>
                      <p className="text-sm text-slate-600 mt-1">{alert.msg}</p>
                    </div>
                    <span className="text-xs text-slate-400">{alert.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
  color: 'primary' | 'green' | 'red' | 'blue';
}

function KPICard({ title, value, subtitle, icon: Icon, trend, color }: KPICardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-br from-primary-50 to-primary-100',
      icon: 'bg-primary-500 text-white',
      text: 'text-primary-600',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
      icon: 'bg-green-500 text-white',
      text: 'text-green-600',
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-rose-100',
      icon: 'bg-red-500 text-white',
      text: 'text-red-600',
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-sky-100',
      icon: 'bg-blue-500 text-white',
      text: 'text-blue-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={cn('rounded-2xl p-6 shadow-soft card-hover', colors.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          {trend && (
            <p className={cn('text-xs font-medium mt-2', colors.text)}>{trend}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl shadow-sm', colors.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
