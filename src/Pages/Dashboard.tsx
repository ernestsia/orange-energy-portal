import React from 'react';
import { FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export function DashboardView() {
  const stats = [
    { label: 'Total Submissions', count: 4, desc: 'Cumulative submissions logged', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
    { label: 'Total Approved', count: 3, desc: 'Verified & active contracts', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Pending Review', count: 1, desc: 'Awaiting field supervisor sign-off', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
    { label: 'Flagged Contracts', count: 0, desc: 'Requires correction or re-upload', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
          Admin Operations Dashboard
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Real-time contract processing metrics and operational forecasts.
        </p>
      </div>

      {/* Stats Cards Grid - Fixes horizontal squishing on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-xl ${stat.bg} border`}>
                  <Icon size={18} className={stat.color} />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-slate-900 leading-none">
                  {stat.count}
                </span>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {stat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}