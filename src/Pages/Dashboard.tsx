import React, { useEffect, useState } from 'react';
import { supabase } from '../Lib/supabase';
import { 
  FileText, CheckCircle2, XCircle, RefreshCw, Search, 
  MapPin, Loader2, BarChart3, Zap 
} from 'lucide-react';

export default function Dashboard({ currentUser }: { currentUser: any }) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLiveContracts = async () => {
    setFetchingData(true);
    try {
      let query = supabase.from('contracts').select('*').order('created_at', { ascending: false });

      const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

      if (!isAdmin) {
        const userName = currentUser?.fullName || currentUser?.username || '';
        if (currentUser?.id && userName) {
          query = query.or(`created_by.eq.${currentUser.id},agent_name.ilike.%${userName}%`);
        } else if (currentUser?.id) {
          query = query.eq('created_by', currentUser.id);
        } else if (userName) {
          query = query.ilike('agent_name', `%${userName}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchLiveContracts();

      // Real-time subscription listener for contract database updates
      const channel = supabase
        .channel('public:contracts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contracts' },
          () => {
            fetchLiveContracts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  // Analytics & Date Calculations
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const getDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  // Helper to filter contracts by date range
  const filterByDateRange = (startDate: Date, endDate: Date) => {
    return contracts.filter(c => {
      if (!c.created_at) return false;
      const cDate = new Date(c.created_at);
      return cDate >= startDate && cDate <= endDate;
    });
  };

  // 1. Day-over-Day (DoD)
  const todayContracts = contracts.filter(c => c.created_at && c.created_at.startsWith(todayStr)).length;
  const yesterdayStr = getDaysAgo(1).toISOString().split('T')[0];
  const yesterdayContracts = contracts.filter(c => c.created_at && c.created_at.startsWith(yesterdayStr)).length;
  const dodChange = yesterdayContracts === 0 
    ? (todayContracts > 0 ? 100 : 0) 
    : Math.round(((todayContracts - yesterdayContracts) / yesterdayContracts) * 100);

  // 2. Week-over-Week (WoW)
  const last7Days = filterByDateRange(getDaysAgo(7), now).length;
  const prev7Days = filterByDateRange(getDaysAgo(14), getDaysAgo(7)).length;
  const wowChange = prev7Days === 0 
    ? (last7Days > 0 ? 100 : 0) 
    : Math.round(((last7Days - prev7Days) / prev7Days) * 100);

  // 3. Month-over-Month (MoM)
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthContracts = contracts.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthContracts = contracts.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  }).length;
  
  const momChange = lastMonthContracts === 0 
    ? (thisMonthContracts > 0 ? 100 : 0) 
    : Math.round(((thisMonthContracts - lastMonthContracts) / lastMonthContracts) * 100);

  // 4. Year-over-Year (YoY)
  const thisYearContracts = contracts.filter(c => {
    if (!c.created_at) return false;
    return new Date(c.created_at).getFullYear() === currentYear;
  }).length;

  const lastYearContracts = contracts.filter(c => {
    if (!c.created_at) return false;
    return new Date(c.created_at).getFullYear() === currentYear - 1;
  }).length;

  const yoyChange = lastYearContracts === 0 
    ? (thisYearContracts > 0 ? 100 : 0) 
    : Math.round(((thisYearContracts - lastYearContracts) / lastYearContracts) * 100);

  // 5. Monthly Forecast (Run-Rate / R/O)
  const currentDayOfMonth = now.getDate();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const avgDailyRate = currentDayOfMonth > 0 ? thisMonthContracts / currentDayOfMonth : 0;
  const forecastMonthEnd = Math.round(avgDailyRate * totalDaysInMonth);

  // General Status Counts
  const totalCount = contracts.length;
  const approvedCount = contracts.filter(c => c.status?.toLowerCase() === 'approved' || c.status?.toLowerCase() === 'completed').length;
  const rejectedCount = contracts.filter(c => c.status?.toLowerCase() === 'rejected').length;

  const filteredContracts = contracts.filter((item) =>
    (item.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.community || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {currentUser?.role?.toUpperCase() === 'ADMIN' ? 'Admin Operations Dashboard' : 'Installer Field Portal'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <span className="font-bold text-slate-700">{currentUser?.fullName || currentUser?.username}</span>.
          </p>
        </div>

        <button 
          onClick={fetchLiveContracts}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${fetchingData ? 'animate-spin' : ''}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Primary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Total Subscriptions</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Approved Contracts</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Rejected Contracts</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{rejectedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-5 rounded-2xl text-white shadow-md flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-orange-100">Forecast R/O (Month-End)</div>
            <div className="text-2xl font-black mt-1">{forecastMonthEnd} <span className="text-xs font-semibold text-orange-100">units</span></div>
            <span className="text-[10px] text-orange-100/90 block mt-0.5">Paced at ~{avgDailyRate.toFixed(1)} subs/day</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytical Growth Indicators: DoD, WoW, MoM, YoY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Performance & Velocity Metrics</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* DoD */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Day-over-Day (DoD)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900">{todayContracts}</span>
              <span className={`text-xs font-bold ${dodChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {dodChange >= 0 ? `+${dodChange}%` : `${dodChange}%`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Vs. Yesterday ({yesterdayContracts})</span>
          </div>

          {/* WoW */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Week-over-Week (WoW)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900">{last7Days}</span>
              <span className={`text-xs font-bold ${wowChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {wowChange >= 0 ? `+${wowChange}%` : `${wowChange}%`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Vs. Prior 7 Days ({prev7Days})</span>
          </div>

          {/* MoM */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Month-over-Month (MoM)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900">{thisMonthContracts}</span>
              <span className={`text-xs font-bold ${momChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {momChange >= 0 ? `+${momChange}%` : `${momChange}%`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Vs. Last Month ({lastMonthContracts})</span>
          </div>

          {/* YoY */}
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Year-over-Year (YoY)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-black text-slate-900">{thisYearContracts}</span>
              <span className={`text-xs font-bold ${yoyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {yoyChange >= 0 ? `+${yoyChange}%` : `${yoyChange}%`}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Vs. Last Year ({lastYearContracts})</span>
          </div>
        </div>
      </div>

      {/* Submissions Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-black text-slate-800">Live Customer Subscriptions</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search database..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {fetchingData ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span className="text-xs font-bold">Querying Supabase database...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Contract ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredContracts.map((item) => {
                  const statusLower = (item.status || '').toLowerCase();
                  const locationDisplay = item.community || item.address || item.location || 'N/A';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-black text-slate-900 font-mono text-[11px]">{item.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.customer_name || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{locationDisplay}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          statusLower === 'approved' || statusLower === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : statusLower === 'rejected'
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-semibold">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}