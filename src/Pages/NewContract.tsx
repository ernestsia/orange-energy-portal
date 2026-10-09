import React, { useState, useRef, useEffect } from 'react';
import { Send, Save, CheckCircle2, AlertCircle, RefreshCw, FileDown, Camera, MapPin, Eraser, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../Lib/supabase';

const OFFER_OPTIONS = [
  {
    id: 'essential_plus',
    title: 'Essential Plus Revamp',
    details: 'Subscription Fees: $2,500 LRD | Duration: 24 mos | Monthly: $1,300 LRD | Total: $33,700 LRD',
  },
  {
    id: 'comfort_plus_sunking',
    title: 'Comfort Plus Sunking',
    details: 'Subscription Fees: $5,250 LRD | Duration: 24 mos | Monthly: $6,600 LRD | Total: $163,650 LRD',
  },
  {
    id: 'comfort_sia_power',
    title: 'Comfort Sia Power',
    details: 'Subscription Fees: $10,000 LRD | Duration: 24 mos | Monthly: $6,600 LRD | Total: $163,650 LRD',
  },
  {
    id: 'comfort_premium_fridge',
    title: 'Comfort Premium - Fridge',
    details: 'Subscription Fees: $10,000 LRD | Duration: 24 mos | Monthly: $9,995 LRD | Total: $239,880 LRD',
  },
  {
    id: 'comfort_premium_freezer',
    title: 'Comfort Premium - Freezer',
    details: 'Subscription Fees: $12,745 LRD | Duration: 24 mos | Monthly: $12,745 LRD | Total: $305,880 LRD',
  },
];

export const NewContract: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    // Section 1: Customer Identification
    customerName: '',
    address: '',
    communityName: '',
    gpsCoordinates: '',
    phoneNumber: '07',
    phoneNumber2: '07',
    idType: '',
    idNumber: '',
    emailAddress: '',
    numberOfKits: 1,

    // Section 2: Offers
    selectedOffer: 'essential_plus',

    // Section 3: Preferences
    receiveInfo: 'Yes',
    electronicInvoice: 'Yes',

    // Section 4: Administrative
    fileNumber: '',
    agreementDate: new Date().toISOString().split('T')[0],
    orangeShop: '',
    agentName: currentUser?.fullName || '',
    agentContact: '07',
  });

  const [loading, setLoading] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);
  const [thumbprintImage, setThumbprintImage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File Input Ref for Thumbprint
  const thumbprintInputRef = useRef<HTMLInputElement | null>(null);

  // Canvas Refs & Tracking
  const customerSigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const agentSigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingCustomer, setIsDrawingCustomer] = useState(false);
  const [isDrawingAgent, setIsDrawingAgent] = useState(false);

  // Phone Number Formatter (Enforces starting with 07)
  const formatPhoneNumber = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (!digits.startsWith('07')) {
      digits = '07' + digits.replace(/^0+/, '');
    }
    return digits.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: formatPhoneNumber(value),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // GPS Auto-Detect Feature
  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setFormData((prev) => ({ ...prev, gpsCoordinates: coords }));
        setGettingGps(false);
      },
      (err) => {
        setMessage({ type: 'error', text: `Failed to retrieve GPS location: ${err.message}` });
        setGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Thumbprint Image Upload
  const handleThumbprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbprintImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Canvas Drawing Logic (Touch & Mouse)
  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    type: 'customer' | 'agent'
  ) => {
    const canvas = type === 'customer' ? customerSigCanvasRef.current : agentSigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (type === 'customer') setIsDrawingCustomer(true);
    else setIsDrawingAgent(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    type: 'customer' | 'agent'
  ) => {
    const isDrawing = type === 'customer' ? isDrawingCustomer : isDrawingAgent;
    if (!isDrawing) return;

    const canvas = type === 'customer' ? customerSigCanvasRef.current : agentSigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (type: 'customer' | 'agent') => {
    if (type === 'customer') setIsDrawingCustomer(false);
    else setIsDrawingAgent(false);
  };

  const clearCanvas = (type: 'customer' | 'agent') => {
    const canvas = type === 'customer' ? customerSigCanvasRef.current : agentSigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isCanvasBlank = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const pixelBuffer = new Uint32Array(
      ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    return !pixelBuffer.some((color) => color !== 0);
  };

  useEffect(() => {
    [customerSigCanvasRef.current, agentSigCanvasRef.current].forEach((canvas) => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    });
  }, []);

  const validateForm = () => {
    if (formData.phoneNumber.length !== 10) {
      setMessage({ type: 'error', text: 'Primary Phone Number must be exactly 10 digits starting with 07.' });
      return false;
    }
    if (formData.phoneNumber2 && formData.phoneNumber2.length > 2 && formData.phoneNumber2.length !== 10) {
      setMessage({ type: 'error', text: 'Secondary Phone Number must be exactly 10 digits starting with 07.' });
      return false;
    }
    if (formData.agentContact.length !== 10) {
      setMessage({ type: 'error', text: 'Agent Contact Number must be exactly 10 digits starting with 07.' });
      return false;
    }
    if (isCanvasBlank(customerSigCanvasRef.current)) {
      setMessage({ type: 'error', text: 'Customer signature is required.' });
      return false;
    }
    if (isCanvasBlank(agentSigCanvasRef.current)) {
      setMessage({ type: 'error', text: 'Agent signature is required.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) return;

    setLoading(true);

    const customerSigData = customerSigCanvasRef.current?.toDataURL();
    const agentSigData = agentSigCanvasRef.current?.toDataURL();

    try {
      const { error } = await supabase.from('contracts').insert([
        {
          customer_name: formData.customerName,
          address: formData.address,
          community: formData.communityName,
          gps_coordinates: formData.gpsCoordinates,
          phone_number: formData.phoneNumber,
          phone_number_2: formData.phoneNumber2,
          id_type: formData.idType,
          id_number: formData.idNumber,
          email_address: formData.emailAddress,
          number_of_kits: formData.numberOfKits,
          selected_offer: formData.selectedOffer,
          receive_info: formData.receiveInfo,
          electronic_invoice: formData.electronicInvoice,
          file_number: formData.fileNumber,
          agreement_date: formData.agreementDate,
          orange_shop: formData.orangeShop,
          agent_name: formData.agentName,
          agent_contact: formData.agentContact,
          customer_signature: customerSigData,
          agent_signature: agentSigData,
          thumbprint_photo: thumbprintImage,
          status: 'pending',
          user_id: currentUser?.id,
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Orange Energy Contract submitted successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to submit subscriber contract.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const existingDrafts = JSON.parse(localStorage.getItem('oe_contract_drafts') || '[]');
    const newDraft = {
      ...formData,
      id: Date.now().toString(),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('oe_contract_drafts', JSON.stringify([...existingDrafts, newDraft]));
    setMessage({ type: 'success', text: 'Contract draft saved locally!' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header Branding */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-2xl text-white shadow-sm">
            OE
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-orange-500 uppercase">Orange Energy</h1>
            <p className="text-slate-600 font-medium text-sm">Subscriber Contract Form</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs font-bold bg-orange-100 text-orange-800 px-3 py-1 rounded-full uppercase tracking-wider">
            Liberia Digital Portal
          </span>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: CUSTOMER IDENTIFICATION */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-orange-500 text-white font-bold px-6 py-3 uppercase tracking-wider text-sm">
            Customer Identification
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                required
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Community Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="communityName"
                required
                placeholder="e.g. Sinkor, Paynesville"
                value={formData.communityName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                GPS Coordinates
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="gpsCoordinates"
                  placeholder="e.g. 6.3156, -10.8074"
                  value={formData.gpsCoordinates}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleGetGps}
                  disabled={gettingGps}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 shrink-0 border border-slate-300 transition-colors"
                >
                  {gettingGps ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 text-orange-500" />}
                  <span>{gettingGps ? 'Locating...' : 'Get Location'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number (Orange Money Connected) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  required
                  maxLength={10}
                  placeholder="07XXXXXXXX"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number #2
                </label>
                <input
                  type="text"
                  name="phoneNumber2"
                  maxLength={10}
                  placeholder="07XXXXXXXX"
                  value={formData.phoneNumber2}
                  onChange={handlePhoneChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ID Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="idType"
                  required
                  value={formData.idType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                >
                  <option value="">Select ID Type</option>
                  <option value="national_id">National Identification (NIR)</option>
                  <option value="passport">Passport</option>
                  <option value="voter_id">Voter Registration Card</option>
                  <option value="driver_license">Driver's License</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  ID Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="idNumber"
                  required
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Number of Kits <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfKits"
                  min={1}
                  required
                  value={formData.numberOfKits}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ORANGE ENERGY OFFERS */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-orange-500 text-white font-bold px-6 py-3 uppercase tracking-wider text-sm">
            Orange Energy Offers
          </div>
          <div className="p-6 space-y-3">
            {OFFER_OPTIONS.map((offer) => (
              <label
                key={offer.id}
                className={`block border rounded-xl p-4 cursor-pointer transition-all ${
                  formData.selectedOffer === offer.id
                    ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="selectedOffer"
                    value={offer.id}
                    checked={formData.selectedOffer === offer.id}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="flex-1 text-center">
                    <h3 className="font-bold text-slate-900 text-base">{offer.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{offer.details}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* SECTION 3: PREFERENCES & LEGAL TERMS */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-orange-500 text-white font-bold px-6 py-3 uppercase tracking-wider text-sm">
            Preferences & Legal Terms
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Would you like to receive information from Orange Liberia?
              </label>
              <select
                name="receiveInfo"
                value={formData.receiveInfo}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Receive electronic invoice for this line and services? <span className="text-rose-500">*</span>
              </label>
              <select
                name="electronicInvoice"
                value={formData.electronicInvoice}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Terms and Conditions Summary
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 space-y-2 max-h-48 overflow-y-auto leading-relaxed">
                <p>
                  <strong>Article 1: Object</strong> - Orange Liberia provides solar energy solutions governed by these terms.
                </p>
                <p>
                  <strong>Article 3: Rental/Sale</strong> - Equipment remains property of Orange until fully paid. First 30 days payment due 15 days after installation. 14-day money-back guarantee/withdrawal.
                </p>
                <p>
                  <strong>Article 5: Activation</strong> - Customer must maintain an active Orange SIM with Orange Money.
                </p>
                <p>
                  <strong>Article 9: Termination</strong> - Failure to pay monthly fees results in suspension. Orange reserves right to repossess equipment after 60 days of unpaid suspension.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-slate-900 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              <span>Download / View Full Terms & Conditions (PDF)</span>
            </button>
          </div>
        </div>

        {/* SECTION 4: ADMINISTRATIVE DETAILS */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-orange-500 text-white font-bold px-6 py-3 uppercase tracking-wider text-sm">
            Administrative Details
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                File Number
              </label>
              <input
                type="text"
                name="fileNumber"
                value={formData.fileNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Agreement Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="agreementDate"
                required
                value={formData.agreementDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Orange Shop <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="orangeShop"
                required
                value={formData.orangeShop}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                OE Installer/Agent Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="agentName"
                required
                placeholder="Full Name"
                value={formData.agentName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                OE Installer/Agent Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="agentContact"
                required
                maxLength={10}
                placeholder="07XXXXXXXX"
                value={formData.agentContact}
                onChange={handlePhoneChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: DIGITAL SIGNATURES & BIOMETRICS */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-orange-500 text-white font-bold px-6 py-3 uppercase tracking-wider text-sm">
            Digital Signatures & Biometrics
          </div>
          <div className="p-6 space-y-6">
            {/* Customer Signature Box */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Customer Signature <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => clearCanvas('customer')}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 font-semibold"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear Signature
                </button>
              </div>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 overflow-hidden">
                <canvas
                  ref={customerSigCanvasRef}
                  width={800}
                  height={180}
                  onMouseDown={(e) => startDrawing(e, 'customer')}
                  onMouseMove={(e) => draw(e, 'customer')}
                  onMouseUp={() => stopDrawing('customer')}
                  onMouseLeave={() => stopDrawing('customer')}
                  onTouchStart={(e) => startDrawing(e, 'customer')}
                  onTouchMove={(e) => draw(e, 'customer')}
                  onTouchEnd={() => stopDrawing('customer')}
                  className="w-full h-40 bg-white cursor-crosshair touch-none"
                />
                <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 select-none pointer-events-none">
                  Sign inside box
                </div>
              </div>
            </div>

            {/* Customer Thumbprint Photo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Customer Thumbprint Photo <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                ref={thumbprintInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleThumbprintUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => thumbprintInputRef.current?.click()}
                className="w-full py-3 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4 text-slate-500" />
                <span>{thumbprintImage ? 'Change Thumbprint Photo' : 'Take / Upload Customer Thumbprint Photo'}</span>
              </button>
              
              {thumbprintImage ? (
                <div className="mt-3 relative border rounded-lg overflow-hidden max-w-xs mx-auto bg-slate-900 p-2 text-center">
                  <img src={thumbprintImage} alt="Thumbprint Preview" className="max-h-40 mx-auto rounded object-contain" />
                  <button
                    type="button"
                    onClick={() => setThumbprintImage(null)}
                    className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-medium underline"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <div className="mt-2 border border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">
                  No thumbprint captured (Optional)
                </div>
              )}
            </div>

            {/* Agent Signature Box */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  OE Installer/Agent Signature <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => clearCanvas('agent')}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 font-semibold"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear Signature
                </button>
              </div>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 overflow-hidden">
                <canvas
                  ref={agentSigCanvasRef}
                  width={800}
                  height={180}
                  onMouseDown={(e) => startDrawing(e, 'agent')}
                  onMouseMove={(e) => draw(e, 'agent')}
                  onMouseUp={() => stopDrawing('agent')}
                  onMouseLeave={() => stopDrawing('agent')}
                  onTouchStart={(e) => startDrawing(e, 'agent')}
                  onTouchMove={(e) => draw(e, 'agent')}
                  onTouchEnd={() => stopDrawing('agent')}
                  className="w-full h-40 bg-white cursor-crosshair touch-none"
                />
                <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 select-none pointer-events-none">
                  Sign inside box
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="w-full sm:w-1/2 py-3.5 px-4 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50 shadow-md shadow-orange-500/20"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{loading ? 'Submitting...' : 'Submit Contract'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};