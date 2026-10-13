import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, 
  Eye, Wrench, X, Printer, ShieldCheck, FileText, User, MapPin, Download, Filter 
} from 'lucide-react';
import { supabase } from '../Lib/supabase';

export interface ContractRecord {
  id: string;
  customer_name: string;
  address: string;
  community: string;
  gps_coordinates?: string;
  phone_number: string;
  phone_number_2?: string;
  id_type: string;
  id_number: string;
  email_address?: string;
  number_of_kits: number;
  selected_offer: string;
  receive_info: string;
  electronic_invoice: string;
  file_number?: string;
  agreement_date: string;
  orange_shop: string;
  agent_name: string;
  agent_contact: string;
  assigned_installer?: string;
  installer_contact?: string;
  customer_signature?: string;
  agent_signature?: string;
  thumbprint_photo?: string;
  created_at: string;
}

interface ContractsViewProps {
  currentUser?: any;
}

export const ContractsView: React.FC<ContractsViewProps> = ({ currentUser }) => {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInstaller, setSelectedInstaller] = useState<string>('ALL');
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();

    const channel = supabase
      .channel('public:contracts_view')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contracts' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setContracts((prev) =>
              prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item))
            );
            if (selectedContract && selectedContract.id === payload.new.id) {
              setSelectedContract((prev) => (prev ? { ...prev, ...payload.new } : null));
            }
          } else {
            fetchContracts();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Extract unique list of installers for the filter dropdown
  const uniqueInstallers = Array.from(
    new Set(contracts.map((c) => c.agent_name || c.assigned_installer).filter(Boolean))
  );

  const filteredContracts = contracts.filter((item) => {
    const installerName = item.agent_name || item.assigned_installer || 'Unassigned';
    const matchesInstaller = selectedInstaller === 'ALL' || installerName === selectedInstaller;

    const matchesSearch =
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone_number?.includes(searchTerm) ||
      item.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assigned_installer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.community?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesInstaller && matchesSearch;
  });

  // Export all submitted contracts as CSV
  const handleExportCSV = () => {
    if (contracts.length === 0) return;

    const headers = [
      'ID', 'Customer Name', 'Community', 'Address', 'GPS', 'Phone', 'Phone 2',
      'ID Type', 'ID Number', 'Offer', 'Kits', 'Agreement Date', 'Orange Shop', 'Agent Name', 'Agent Contact'
    ];

    const rows = contracts.map((c) => [
      c.id,
      `"${c.customer_name || ''}"`,
      `"${c.community || ''}"`,
      `"${c.address || ''}"`,
      `"${c.gps_coordinates || ''}"`,
      c.phone_number,
      c.phone_number_2 || '',
      c.id_type,
      c.id_number,
      c.selected_offer,
      c.number_of_kits,
      c.agreement_date,
      `"${c.orange_shop || ''}"`,
      `"${c.agent_name || c.assigned_installer || ''}"`,
      c.agent_contact || c.installer_contact || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Orange_Energy_Contracts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isValidSignature = (sig: any): boolean => {
    if (!sig || typeof sig !== 'string') return false;
    const trimmed = sig.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
    if (trimmed.startsWith('data:image') || trimmed.startsWith('http')) {
      return trimmed.length > 1500; 
    }
    return trimmed.length > 100;
  };

  const formatSignatureSrc = (sig: string): string => {
    if (!sig) return '';
    if (sig.startsWith('data:image') || sig.startsWith('http')) return sig;
    return `data:image/png;base64,${sig}`;
  };

  const rawCustomerSig = selectedContract 
    ? (selectedContract as any).customer_signature || 
      (selectedContract as any).customerSignature || 
      (selectedContract as any).signature_url || 
      (selectedContract as any).customer_sig || 
      (selectedContract as any).signature
    : null;

  const rawAgentSig = selectedContract 
    ? (selectedContract as any).agent_signature || 
      (selectedContract as any).agentSignature || 
      (selectedContract as any).installer_signature || 
      (selectedContract as any).agent_sig || 
      (selectedContract as any).installer_sig
    : null;

  const custSig = isValidSignature(rawCustomerSig) ? formatSignatureSrc(rawCustomerSig) : null;
  const agentSig = isValidSignature(rawAgentSig) ? formatSignatureSrc(rawAgentSig) : null;

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Header & Actions */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Contracts</h1>
          <p className="text-xs text-slate-500 mt-1">Showing all customer contracts across Liberia</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchContracts}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Installer Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer, phone, installer, or community..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Installer Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedInstaller}
            onChange={(e) => setSelectedInstaller(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All Installers ({contracts.length})</option>
            {uniqueInstallers.map((installer: any) => (
              <option key={installer} value={installer}>
                {installer}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading contracts data...</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No contracts found matching your search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">Assigned / OE Installer</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredContracts.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedContract(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.customer_name}
                      <span className="block text-[11px] text-slate-400 font-normal">{item.community || 'Liberia'}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">{item.phone_number}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Wrench className="w-3.5 h-3.5 text-orange-500" />
                        {item.assigned_installer || item.agent_name || 'Unassigned'}
                      </div>
                      {item.installer_contact && (
                        <span className="text-[10px] text-slate-400 font-mono block">{item.installer_contact}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at || item.agreement_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedContract(item)}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Contract
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Contract View Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-extrabold text-slate-900">Orange Energy Subscriber Contract</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Contract Reference ID: {selectedContract.id} | Agreement Date: {selectedContract.agreement_date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  title="Print Contract"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contract Body Details */}
            <div className="space-y-6 text-xs">
              {/* Customer Details */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-orange-500" /> Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Full Name</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedContract.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Primary Phone</span>
                    <span className="font-mono font-medium text-slate-800">{selectedContract.phone_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Secondary Phone</span>
                    <span className="font-mono text-slate-800">{selectedContract.phone_number_2 || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Community / Address</span>
                    <span className="text-slate-800">{selectedContract.community}, {selectedContract.address}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">ID Type & Number</span>
                    <span className="text-slate-800 uppercase font-mono">{selectedContract.id_type}: {selectedContract.id_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">GPS Location</span>
                    <span className="font-mono text-slate-800">{selectedContract.gps_coordinates || 'Not captured'}</span>
                  </div>
                </div>

                {/* Live OpenStreetMap Preview inside Modal */}
                {selectedContract.gps_coordinates && selectedContract.gps_coordinates.includes(',') && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <iframe
                      title="Contract Location Map"
                      width="100%"
                      height="200"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        parseFloat(selectedContract.gps_coordinates.split(',')[1]) - 0.01
                      },${parseFloat(selectedContract.gps_coordinates.split(',')[0]) - 0.01},${
                        parseFloat(selectedContract.gps_coordinates.split(',')[1]) + 0.01
                      },${
                        parseFloat(selectedContract.gps_coordinates.split(',')[0]) + 0.01
                      }&layer=mapnik&marker=${selectedContract.gps_coordinates.replace(/\s+/g, '')}`}
                      className="w-full"
                    />
                    <div className="bg-white px-3 py-1.5 text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-200">
                      <span>Coordinates: {selectedContract.gps_coordinates}</span>
                      <span className="text-orange-600 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> OpenStreetMap Location Pin
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Offer & Subscription Package */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-orange-500" /> Offer & Preferences
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Selected Offer</span>
                    <span className="font-bold text-orange-600 uppercase">{selectedContract.selected_offer?.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Number of Kits</span>
                    <span className="font-bold text-slate-800">{selectedContract.number_of_kits}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Electronic Invoice</span>
                    <span className="font-bold text-slate-800">{selectedContract.electronic_invoice}</span>
                  </div>
                </div>
              </div>

              {/* Agent & Admin Info */}
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Wrench className="w-4 h-4 text-orange-500" /> Agent & Shop Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Agent / Installer Name</span>
                    <span className="font-bold text-slate-800">{selectedContract.agent_name || selectedContract.assigned_installer}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Agent Contact</span>
                    <span className="font-mono text-slate-800">{selectedContract.agent_contact || selectedContract.installer_contact || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Orange Shop</span>
                    <span className="font-bold text-slate-800">{selectedContract.orange_shop || 'Liberia Main'}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Section */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-200 pb-2">
                  Terms and Conditions of Sale Summary
                </h3>
                <div className="text-[11px] text-slate-600 space-y-2 max-h-48 overflow-y-auto leading-relaxed pr-2 font-sans">
                  <p><strong>Article 1 & 2: Object & Definitions</strong> — These general conditions define the framework under which Orange Liberia provides Orange Energy Services. Equipment includes solar central unit, solar panel, bulbs, and cables.</p>
                  <p><strong>Article 3: Access Options</strong> — Option 1 (Rental/Sales): Customer rents equipment with monthly payments over 24 months; ownership transfers after full payment. Option 2 (Cash Purchase): Immediate ownership upon full upfront payment.</p>
                  <p><strong>Article 5: Service Operation</strong> — Active Orange SIM and Orange Money account required. Orange sends service updates to subscriber line.</p>
                  <p><strong>Article 7: Warranty & Maintenance</strong> — Repair/replacement guaranteed for defective equipment during warranty period, excluding customer-induced damage.</p>
                  <p><strong>Article 9: Termination</strong> — Failure to meet agreed monthly payments results in suspension. Repossession occurs after 60 days of unpaid suspension.</p>
                  <p><strong>Article 13 & 20: CSR & Rules</strong> — Subscribers and Orange comply with Liberian laws, CSR policies, and environmental standards.</p>
                </div>
              </div>

              {/* Digital Signatures Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Customer Signature Box */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">
                    Customer Signature
                  </span>
                  {custSig ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-center min-h-[96px]">
                      <img
                        src={custSig}
                        alt="Customer Signature"
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg border border-slate-200">
                      No customer signature captured
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 block mt-2">{selectedContract.customer_name}</span>
                </div>

                {/* OE Installer Signature Box */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white text-center">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">
                    OE Installer / Agent Signature
                  </span>
                  {agentSig ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-center min-h-[96px]">
                      <img
                        src={agentSig}
                        alt="Agent Signature"
                        className="max-h-24 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg border border-slate-200">
                      No agent signature captured
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 block mt-2">
                    {selectedContract.agent_name || selectedContract.assigned_installer}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-8 border-t border-slate-100 pt-4 flex items-center justify-end">
              <button
                onClick={() => setSelectedContract(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Close Contract View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsView;