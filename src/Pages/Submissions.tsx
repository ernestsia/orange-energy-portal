import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, 
  Eye, MapPin, User, FileText
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
  customer_signature?: string;
  agent_signature?: string;
  created_at: string;
}

export const SubmissionsView: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [submissions, setSubmissions] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);

  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  // Fetch submissions from Supabase
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

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
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentUser]);

  // Filtered list based on search term
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone_number?.includes(searchTerm) ||
      sub.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.community?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Helper variables to safely grab customer and agent signatures from any potential DB column name
  const custSig = selectedContract 
    ? selectedContract.customer_signature || 
      (selectedContract as any).signature_url || 
      (selectedContract as any).customer_sig || 
      (selectedContract as any).signature
    : null;

  const agentSig = selectedContract 
    ? selectedContract.agent_signature || 
      (selectedContract as any).installer_signature || 
      (selectedContract as any).agent_sig ||
      (selectedContract as any).installer_sig
    : null;

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contract Submissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View and manage contracts submitted by field agents.
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

      {/* Search Bar */}
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
            No contract records match your search.
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
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
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

      {/* Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Contract Verification</h2>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedContract.id}</p>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Customer Details */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Customer Name</span>
                    <p className="text-slate-900 font-bold mt-0.5">{selectedContract.customer_name}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Primary Phone</span>
                    <p className="text-slate-900 font-bold font-mono mt-0.5">{selectedContract.phone_number}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Secondary Phone</span>
                    <p className="text-slate-900 font-mono mt-0.5">{selectedContract.phone_number_2 || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">ID Type & Number</span>
                    <p className="text-slate-900 font-medium mt-0.5">
                      <span className="capitalize">{selectedContract.id_type?.replace(/_/g, ' ')}</span>: {selectedContract.id_number}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Email Address</span>
                    <p className="text-slate-900 mt-0.5">{selectedContract.email_address || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Number of Kits</span>
                    <p className="text-slate-900 font-bold mt-0.5">{selectedContract.number_of_kits}</p>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Address & Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Community</span>
                    <p className="text-slate-900 font-medium mt-0.5">{selectedContract.community}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Street Address</span>
                    <p className="text-slate-900 mt-0.5">{selectedContract.address}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">GPS Coordinates</span>
                    <p className="text-slate-900 font-mono mt-0.5">{selectedContract.gps_coordinates || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Offer & Agent Details */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Offer & Administrative Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Selected Offer</span>
                    <p className="text-slate-900 font-bold mt-0.5 capitalize">
                      {selectedContract.selected_offer?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Agent Name & Contact</span>
                    <p className="text-slate-900 font-medium mt-0.5">
                      {selectedContract.agent_name} ({selectedContract.agent_contact})
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block">Orange Shop & File No.</span>
                    <p className="text-slate-900 mt-0.5">
                      {selectedContract.orange_shop} {selectedContract.file_number ? `(${selectedContract.file_number})` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              {(custSig || agentSig) && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    Digital Signatures
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {custSig ? (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <span className="font-bold text-slate-500 uppercase text-[10px] block mb-2">
                          Customer Signature
                        </span>
                        <img
                          src={custSig}
                          alt="Customer Signature"
                          className="max-h-24 mx-auto object-contain bg-white rounded border border-slate-200 p-1"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center flex items-center justify-center text-slate-400 italic text-[11px]">
                        No customer signature captured
                      </div>
                    )}
                    {agentSig ? (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <span className="font-bold text-slate-500 uppercase text-[10px] block mb-2">
                          Agent Signature
                        </span>
                        <img
                          src={agentSig}
                          alt="Agent Signature"
                          className="max-h-24 mx-auto object-contain bg-white rounded border border-slate-200 p-1"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center flex items-center justify-center text-slate-400 italic text-[11px]">
                        No agent signature captured
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-end">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionsView;