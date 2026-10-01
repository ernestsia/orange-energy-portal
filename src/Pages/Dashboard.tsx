import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, CheckCircle2, XCircle, TrendingUp, Calendar, 
  RefreshCw, BarChart3, Clock, AlertCircle 
} from 'lucide-react';
import { supabase } from '../Lib/supabase';

interface Metrics {
  totalSubmissions: number;
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
  todayCount: number;
  yesterdayCount: number;
  dodGrowth: number;
  thisMonthCount: number;
  lastMonthCount: number;
  momGrowth: number;
  dailyRunRate: number;
  forecastMonthEnd: number;
}

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<Metrics>({
    totalSubmissions: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalPending: 0,
    todayCount: 0,
    yesterdayCount: 0,
    dodGrowth: 0,
    thisMonthCount: 0,
    lastMonthCount: 0,
    momGrowth: 0,
    dailyRunRate: 0,
    forecastMonthEnd: 0,
  });

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      // 1. Fetch all contract records
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('id, status, created_at');

      if (error) throw error;

      const records = contracts || [];
      const now = new Date();

      // Date boundaries
      const todayStr = now.toISOString().split('T')[0];
      
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const currentDayOfMonth = now.getDate();

      // Status Counts
      const totalSubmissions = records.length;
      const totalApproved = records.filter(r => r.status?.toLowerCase() === 'approved').length;
      const totalRejected = records.filter(r => r.status?.toLowerCase() === 'rejected').length;
      const totalPending = records.filter(r => !r.status || r.status?.toLowerCase() === 'pending').length;

      // DoD Calculations
      const todayCount = records.filter(r => r.created_at && r.created_at.startsWith(todayStr)).length;
      const yesterdayCount = records.filter(r => r.created_at && r.created_at.startsWith(yesterdayStr)).length;
      
      let dodGrowth = 0;
      if (yesterdayCount > 0) {
        dodGrowth = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
      } else if (todayCount > 0) {
        dodGrowth = 100;
      }

      // MoM Calculations
      const thisMonthCount = records.filter(r => {
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }).length;

      const lastMonthCount = records.filter(r => {
        if (!r.created_at) return false;
        const d = new Date(r.created_at);
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
      }).length;

      let momGrowth = 0;
      if (lastMonthCount > 0) {
        momGrowth = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
      } else if (thisMonthCount > 0) {
        momGrowth = 100;
      }

      // Daily Run Rate (R/O) & Daily Forecast
      const dailyRunRate = currentDayOfMonth > 0 ? Number((thisMonthCount / currentDayOfMonth).toFixed(1)) : 0;
      const forecastMonthEnd = Math.round(dailyRunRate * daysInMonth);

      setMetrics({
        totalSubmissions,
        totalApproved,
        totalRejected,
        totalPending,
        todayCount,
        yesterdayCount,
        dodGrowth: Number(dodGrowth.toFixed(1)),
        thisMonthCount,
        lastMonthCount,
        momGrowth: Number(momGrowth.toFixed(1)),
        dailyRunRate,
        forecastMonthEnd,
      });

    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time contract processing metrics and operational forecasts.</p>
        </div>
        <button
          onClick={fetchDashboardMetrics}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Primary Status KPIs (1 - 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.totalSubmissions}</div>
          <p className="text-[11px] font-medium text-slate-500">Cumulative submissions logged</p>
        </div>

        {/* Total Approved */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Approved</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{metrics.totalApproved}</div>
          <p className="text-[11px] font-medium text-slate-500">Verified & active contracts</p>
        </div>

        {/* Total Rejected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rejected</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">{metrics.totalRejected}</div>
          <p className="text-[11px] font-medium text-slate-500">Declined / invalid submissions</p>
        </div>

        {/* Pending Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">{metrics.totalPending}</div>
          <p className="text-[11px] font-medium text-slate-500">Awaiting supervisor action</p>
        </div>
      </div>

      {/* Advanced Performance Metrics (4: DoD, MoM, R/O, Forecast) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DoD Comparison */}
        <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Day-on-Day (DoD)</span>
            <Calendar className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-black">{metrics.todayCount} <span className="text-xs font-normal text-slate-400">today</span></div>
            <div className="text-xs text-slate-400 mt-0.5">vs {metrics.yesterdayCount} yesterday</div>
          </div>
          <div className={`text-xs font-bold inline-flex items-center gap-1 ${metrics.dodGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <TrendingUp className={`w-3.5 h-3.5 ${metrics.dodGrowth < 0 ? 'rotate-180' : ''}`} />
            <span>{metrics.dodGrowth > 0 ? `+${metrics.dodGrowth}%` : `${metrics.dodGrowth}%`} vs yesterday</span>
          </div>
        </div>

        {/* MoM Comparison */}
        <div className="bg-slate-900 text-white p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Month-on-Month (MoM)</span>
            <BarChart3 className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-2xl font-black">{metrics.thisMonthCount} <span className="text-xs font-normal text-slate-400">this month</span></div>
            <div className="text-xs text-slate-400 mt-0.5">vs {metrics.lastMonthCount} last month</div>
          </div>
          <div className={`text-xs font-bold inline-flex items-center gap-1 ${metrics.momGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <TrendingUp className={`w-3.5 h-3.5 ${metrics.momGrowth < 0 ? 'rotate-180' : ''}`} />
            <span>{metrics.momGrowth > 0 ? `+${metrics.momGrowth}%` : `${metrics.momGrowth}%`} vs last month</span>
          </div>
        </div>

        {/* Daily Run Rate (R/O) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Run Rate (R/O)</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{metrics.dailyRunRate}</div>
            <div className="text-xs text-slate-500 mt-0.5">Avg subscriptions per day</div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Pace based on current month activity</p>
        </div>

        {/* Daily Forecast */}
        <div className="bg-orange-500 text-white p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-orange-100 uppercase tracking-wider">Month-End Forecast</span>
            <TrendingUp className="w-4 h-4 text-orange-100" />
          </div>
          <div>
            <div className="text-3xl font-black">{metrics.forecastMonthEnd}</div>
            <div className="text-xs text-orange-100 mt-0.5">Projected total by month end</div>
          </div>
          <p className="text-[11px] text-orange-100 font-medium">Estimated output at current run rate</p>
        </div>
      </div>
    </div>
  );
};