import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, CheckCircle2, Clock, XCircle, 
  Eye, Filter, Wrench, X, Printer, ShieldCheck, FileText, User, Loader2
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
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
}

interface ContractsViewProps {
  currentUser?: any;
}

export const ContractsView: React.FC<ContractsViewProps> = ({ currentUser }) => {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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

    // Subscribe to real-time contract table changes
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

  const handleUpdateStatus = async (contractId: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', contractId);

      if (error) throw error;

      // Local optimistic state updates
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, status: newStatus } : c))
      );

      if (selectedContract && selectedContract.id === contractId) {
        setSelectedContract({ ...selectedContract, status: newStatus });
      }
    } catch (err: any) {
      console.error('Failed to update status:', err.message);
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredContracts = contracts.filter((item) => {
    const matchesSearch =
      item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone_number?.includes(searchTerm) ||
      item.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assigned_installer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.community?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || item.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            APPROVED
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Contracts</h1>
          <p className="text-xs text-slate-500 mt-1">Showing all customer contracts across Liberia</p>
        </div>
        <button
          onClick={fetchContracts}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 self-start md:self-auto transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
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
            No contracts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">Assigned / OE Installer</th>
                  <th className="px-6 py-3.5">Status</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
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
              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-700 uppercase tracking-wider">Contract Status</span>
                {getStatusBadge(selectedContract.status)}
              </div>

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
                  {selectedContract.customer_signature ? (
                    <img
                      src={selectedContract.customer_signature}
                      alt="Customer Signature"
                      className="max-h-24 mx-auto object-contain border-b border-slate-100 pb-2"
                    />
                  ) : (
                    <div className="h-24 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg">
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
                  {selectedContract.agent_signature ? (
                    <img
                      src={selectedContract.agent_signature}
                      alt="Agent Signature"
                      className="max-h-24 mx-auto object-contain border-b border-slate-100 pb-2"
                    />
                  ) : (
                    <div className="h-24 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg">
                      No agent signature captured
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 block mt-2">
                    {selectedContract.agent_name || selectedContract.assigned_installer}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer with Status Actions */}
            <div className="mt-8 border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleUpdateStatus(selectedContract.id, 'approved')}
                  disabled={updatingStatus || selectedContract.status?.toLowerCase() === 'approved'}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Approve Contract
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedContract.id, 'rejected')}
                  disabled={updatingStatus || selectedContract.status?.toLowerCase() === 'rejected'}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject Contract
                </button>
              </div>

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