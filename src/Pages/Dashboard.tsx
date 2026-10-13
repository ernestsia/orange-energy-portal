import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Calendar, FileText, RefreshCw, MapPin, Building2, ExternalLink 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../Lib/supabase';

// Fix default Leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export const Dashboard: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    projectedMonth: 0,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allContracts = data || [];
      setContracts(allContracts);

      // Calculate stats
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const todayCount = allContracts.filter(c => c.created_at?.startsWith(todayStr) || c.agreement_date === todayStr).length;
      
      setStats({
        total: allContracts.length,
        today: todayCount,
        thisWeek: allContracts.length, // or compute weekly delta
        projectedMonth: Math.round(allContracts.length * 2.4),
      });
    } catch (err) {
      console.error('Error fetching dashboard contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter contracts with valid GPS coordinates (lat, lng)
  const mappedContracts = contracts.filter((c) => {
    if (!c.gps_coordinates || !c.gps_coordinates.includes(',')) return false;
    const parts = c.gps_coordinates.split(',');
    return !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
  });

  // Default center: Monrovia, Liberia
  const defaultCenter: [number, number] = [6.3156, -10.8074];

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Header & Refresh */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <span className="font-bold text-slate-800">{currentUser?.fullName || 'Administrator'}</span>.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Total Subscriptions</span>
            <h2 className="text-3xl font-black text-slate-900">{stats.total}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Today's Contracts</span>
            <h2 className="text-3xl font-black text-slate-900">{stats.today}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Active Installations</span>
            <h2 className="text-3xl font-black text-slate-900">{mappedContracts.length}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Month Forecast</span>
            <h2 className="text-3xl font-black text-orange-600">{stats.projectedMonth}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Interactive Map Section (Fulfilling User Request) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider">Live Subscriber Installation Map (Liberia)</h2>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-orange-400 px-3 py-1 rounded-full border border-slate-700">
            {mappedContracts.length} Geotagged Locations Pinned
          </span>
        </div>

        <div className="h-[480px] w-full relative z-0">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-bold gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-orange-500" /> Loading map data...
            </div>
          ) : (
            <MapContainer 
              center={defaultCenter} 
              zoom={11} 
              scrollWheelZoom={true} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mappedContracts.map((contract) => {
                const [lat, lng] = contract.gps_coordinates.split(',').map((coord: string) => parseFloat(coord.trim()));
                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                  <Marker key={contract.id} position={[lat, lng]}>
                    <Popup>
                      <div className="p-2 space-y-1.5 font-sans min-w-[200px]">
                        <h3 className="font-bold text-slate-900 text-sm">{contract.customer_name}</h3>
                        <p className="text-xs text-orange-600 font-semibold uppercase">{contract.selected_offer?.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-slate-600"><strong>Community:</strong> {contract.community || 'N/A'}</p>
                        <p className="text-[11px] text-slate-600 font-mono"><strong>Phone:</strong> {contract.phone_number}</p>
                        <p className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">GPS: {lat.toFixed(4)}, {lng.toFixed(4)}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;