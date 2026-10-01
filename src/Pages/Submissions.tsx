import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, CheckCircle2, Clock, XCircle, 
  Eye, Filter, Check, X
} from 'lucide-react';
import { supabase } from '../Lib/supabase';

interface ContractRecord {
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
  customer_signature?: string;
  agent_signature?: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  created_at: string;
}

export const SubmissionsView: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);

  // Fetch submissions from Supabase
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Update Contract Status in Supabase
  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update state locally
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
      );

      if (selectedContract?.id === id) {
        setSelectedContract((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error(`Failed to update status to ${newStatus}:`, err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered list based on search term and status
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone_number?.includes(searchTerm) ||
      sub.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.community?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || sub.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contract Submissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review and manage contracts submitted by field agents.
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 self-start md:self-auto transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, phone, agent, or community..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-600">Loading submissions from database...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            No contract records match your search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase font-extrabold text-slate-500 tracking-wider">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Offer</th>
                  <th className="px-6 py-3.5">Agent</th>
                  <th className="px-6 py-3.5">Submitted On</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSubmissions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div>{item.customer_name}</div>
                      <div className="text-[11px] font-normal text-slate-500">{item.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{item.community}</div>
                      <div className="text-[11px] text-slate-400">{item.address}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 capitalize">
                      {item.selected_offer?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{item.agent_name}</div>
                      <div className="text-[11px] text-slate-400">{item.orange_shop}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Approve/Reject for pending submissions */}
                        {item.status?.toLowerCase() === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'approved')}
                              disabled={updatingId === item.id}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200"
                              title="Approve Contract"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'rejected')}
                              disabled={updatingId === item.id}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors border border-rose-200"
                              title="Reject Contract"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedContract(item)}
                          className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Review Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Contract Verification</h2>
                <p className="text-xs text-slate-500">ID: {selectedContract.id}</p>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Customer Name</span>
                <p className="text-slate-900 font-bold mt-0.5">{selectedContract.customer_name}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Phone Number</span>
                <p className="text-slate-900 font-bold mt-0.5">{selectedContract.phone_number}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="font-bold text-slate-500 uppercase text-[10px]">ID Type & Number</span>
                <p className="text-slate-900 font-medium mt-0.5">
                  {selectedContract.id_type} - {selectedContract.id_number}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Selected Offer</span>
                <p className="text-slate-900 font-medium mt-0.5 capitalize">
                  {selectedContract.selected_offer?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* Modal Admin Decision Bar */}
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
              <div>{getStatusBadge(selectedContract.status)}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedContract.id, 'rejected')}
                  disabled={updatingId === selectedContract.id}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-lg transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedContract.id, 'approved')}
                  disabled={updatingId === selectedContract.id}
                  className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};