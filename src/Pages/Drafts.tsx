import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Send, Clock, CheckCircle2, AlertCircle, RefreshCw, User, Phone, MapPin } from 'lucide-react';
import { supabase } from '../Lib/supabase';

interface DraftContract {
  id: string;
  createdAt: string;
  customerName: string;
  address: string;
  communityName: string;
  gpsCoordinates?: string;
  phoneNumber: string;
  phoneNumber2?: string;
  idType: string;
  idNumber: string;
  emailAddress?: string;
  numberOfKits: number;
  selectedOffer: string;
  receiveInfo: string;
  electronicInvoice: string;
  fileNumber?: string;
  agreementDate: string;
  orangeShop: string;
  agentName: string;
  agentContact: string;
  customerSignature?: string;
  agentSignature?: string;
}

export const DraftsView: React.FC = () => {
  const [drafts, setDrafts] = useState<DraftContract[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load saved drafts from localStorage
  const loadDrafts = () => {
    try {
      const storedDrafts = localStorage.getItem('oe_contract_drafts');
      if (storedDrafts) {
        setDrafts(JSON.parse(storedDrafts));
      } else {
        setDrafts([]);
      }
    } catch (err) {
      console.error('Error loading drafts:', err);
      setDrafts([]);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  // Delete a specific draft
  const handleDeleteDraft = (id: string) => {
    const updated = drafts.filter((draft) => draft.id !== id);
    localStorage.setItem('oe_contract_drafts', JSON.stringify(updated));
    setDrafts(updated);
    setMessage({ type: 'success', text: 'Draft deleted successfully.' });
  };

  // Submit draft to Supabase contracts table
  const handleSubmitDraft = async (draft: DraftContract) => {
    setSubmittingId(draft.id);
    setMessage(null);

    try {
      const { error } = await supabase.from('contracts').insert([
        {
          customer_name: draft.customerName,
          address: draft.address,
          community: draft.communityName,
          gps_coordinates: draft.gpsCoordinates || null,
          phone_number: draft.phoneNumber,
          phone_number_2: draft.phoneNumber2 || null,
          id_type: draft.idType,
          id_number: draft.idNumber,
          email_address: draft.emailAddress || null,
          number_of_kits: draft.numberOfKits || 1,
          selected_offer: draft.selectedOffer,
          receive_info: draft.receiveInfo,
          electronic_invoice: draft.electronicInvoice,
          file_number: draft.fileNumber || null,
          agreement_date: draft.agreementDate,
          orange_shop: draft.orangeShop,
          agent_name: draft.agentName,
          agent_contact: draft.agentContact,
          customer_signature: draft.customerSignature || null,
          agent_signature: draft.agentSignature || null,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      // Remove from localStorage after successful upload
      handleDeleteDraft(draft.id);
      setMessage({ type: 'success', text: `Contract for "${draft.customerName}" submitted successfully!` });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to submit draft to database.',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Local Contract Drafts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage offline subscriptions saved on this device.</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-orange-700">
          {drafts.length} {drafts.length === 1 ? 'Draft' : 'Drafts'} Available
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Drafts List */}
      {drafts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Drafts Saved</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            When you save contracts offline or as drafts from the "New Contract" form, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {draft.customerName || 'Unnamed Customer'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Saved on {new Date(draft.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-center px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full uppercase tracking-wider">
                  Draft
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block font-semibold text-slate-700">Phone</span>
                    <span>{draft.phoneNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block font-semibold text-slate-700">Community</span>
                    <span>{draft.communityName || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span className="block font-semibold text-slate-700">Selected Offer</span>
                  <span className="capitalize">{draft.selectedOffer?.replace(/_/g, ' ') || 'N/A'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteDraft(draft.id)}
                  className="px-4 py-2 border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  disabled={submittingId === draft.id}
                  onClick={() => handleSubmitDraft(draft)}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingId === draft.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{submittingId === draft.id ? 'Submitting...' : 'Submit Draft'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};