'use client';

import { Bell, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  alerts?: Array<{ id: string; type: string; patient: string; msg: string }>;
}

export function Header({ title, subtitle, alerts = [] }: HeaderProps) {
  const criticalAlerts = alerts.filter((a) => a.type === 'critical');
  const hasAlerts = criticalAlerts.length > 0;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาผู้ป่วย..."
              className="w-64 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Notifications */}
          <button
            className={cn(
              'relative p-2.5 rounded-xl transition-all',
              hasAlerts
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            )}
          >
            <Bell className="h-5 w-5" />
            {hasAlerts && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                {criticalAlerts.length}
              </span>
            )}
          </button>

          {/* User Menu */}
          <button className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">เภสัชกร</p>
              <p className="text-xs text-slate-400">โรงพยาบาลพิมาย</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
