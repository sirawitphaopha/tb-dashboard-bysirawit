'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileBarChart2,
  Settings,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'ทะเบียนผู้ป่วย', icon: Users },
  { id: 'weekly', label: 'คิวเตรียมยา', icon: CalendarClock },
  { id: 'reports', label: 'รายงาน', icon: FileBarChart2 },
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-md">
          <HeartPulse className="h-6 w-6" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-800">TB-CARE</span>
            <span className="text-xs text-primary-600 font-medium">LINK</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary-50 to-secondary-50 text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-600' : 'text-slate-400'
                )}
              />
              {!collapsed && (
                <span className={cn('font-medium', isActive && 'font-semibold')}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings & Collapse */}
      <div className="border-t border-slate-100 p-3 space-y-2">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all'
          )}
        >
          <Settings className="h-5 w-5 text-slate-400" />
          {!collapsed && <span className="font-medium">ตั้งค่า</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">ย่อเมนู</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
