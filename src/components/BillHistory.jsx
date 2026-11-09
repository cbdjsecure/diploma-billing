import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  Edit3,
  Download,
  Share2,
  X,
  Check,
  ExternalLink,
  MessageSquare,
  Copy,
  Camera,
  Receipt,
  Upload,
  AlertCircle
} from 'lucide-react';

const DISC_TITLES = {
  indian: { title: 'Indian Classical & Traditional Part', emoji: '🎻', bg: 'bg-amber-50 text-amber-900 border-amber-200' },
  western: { title: 'Western Music & Dance Part', emoji: '🎹', bg: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  yoga: { title: 'Universal Yoga Part', emoji: '🧘', bg: 'bg-emerald-50 text-emerald-900 border-emerald-200' }
};

export default function BillHistory({ onEditBill, isHelplineOnly = false }) {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeModalBill, setActiveModalBill] = useState(null);
  const [sharingBillId, setSharingBillId] = useState(null);
  const [historyWhatsAppModal, setHistoryWhatsAppModal] = useState({ isOpen: false, images: [], bill: null });
  const [historyToast, setHistoryToast] = useState('');
  const [helplinePhone, setHelplinePhone] = useState(() => localStorage.getItem('kendra_helpline_phone') || '');
  const [copiedSteps, setCopiedSteps] = useState({});
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    bill: null,
    file: null,
    previewUrl: '',
    notes: '',
    uploading: false
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.helpline_whatsapp && !localStorage.getItem('kendra_helpline_phone')) {
          setHelplinePhone(data.settings.helpline_whatsapp);
        }
      })
      .catch(() => {});
  }, []);

  const base64ToBlob = (base64Str) => {
    const parts = base64Str.split(';base64,');
    const contentType = (parts[0].replace('data:', '')) || 'image/png';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  const formatWhatsAppNumber = (rawPhone) => {
    if (!rawPhone) return '';
    let num = String(rawPhone).replace(/[^0-9]/g, '');
    if (num.startsWith('0')) {
      num = num.substring(1);
    }
    if (num.length === 10) {
      num = '91' + num;
    }
    return num;
  };

  const getWhatsAppUrls = (caption, rawPhone) => {
    const num = formatWhatsAppNumber(rawPhone);
    const textParam = encodeURIComponent(caption);
    const webUrl = num
      ? `https://web.whatsapp.com/send?phone=${num}&text=${textParam}`
      : `https://web.whatsapp.com/send?text=${textParam}`;
    const appUrl = num
      ? `whatsapp://send?phone=${num}&text=${textParam}`
      : `whatsapp://send?text=${textParam}`;
    return { webUrl, appUrl, num };
  };

  const formatCentreCaption = (code) => {
    let s = String(code || '1011').trim();
    if (s.toUpperCase().startsWith('C-')) return s.toUpperCase();
    if (s.toUpperCase().startsWith('C')) return `C-${s.substring(1)}`;
    return `C-${s}`;
  };

  const handleCopyImageToClipboard = async (imgObj, showToast = true) => {
    try {
      const blob = base64ToBlob(imgObj.base64);
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      if (imgObj.key) {
        setCopiedSteps((prev) => ({ ...prev, [imgObj.key]: true }));
      }
      if (showToast) {
        setHistoryToast(`📋 Image for ${imgObj.caption} copied to clipboard! Paste with Ctrl+V into WhatsApp.`);
        setTimeout(() => setHistoryToast(''), 6000);
      }
      return true;
    } catch (err) {
      console.warn('Clipboard write error:', err);
      if (showToast) {
        setHistoryToast('⚠️ Could not copy image directly to clipboard.');
        setTimeout(() => setHistoryToast(''), 5000);
      }
      return false;
    }
  };

  const handleDownloadImage = (imgObj) => {
    const blob = base64ToBlob(imgObj.base64);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = imgObj.filename || `${imgObj.caption}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    setHistoryToast(`⬇️ Downloaded ${imgObj.filename || imgObj.caption + '.png'}`);
    setTimeout(() => setHistoryToast(''), 4000);
  };

  // Open WhatsApp Web or Desktop App directly (synchronous user click => NEVER blocked by popup blocker!)
  const handleOpenWhatsApp = async (imgObj, mode = 'web') => {
    // 1. Auto-copy image so it's ready in clipboard
    await handleCopyImageToClipboard(imgObj, false);

    // Track step completion
    if (imgObj.key) {
      setCopiedSteps((prev) => ({ ...prev, [imgObj.key]: true }));
    }

    // In Helpline Bill Desk: routes to recipient/teacher phone (bill?.phone) or opens chat with caption
    // In standard Bill History: routes to helplinePhone
    const caption = imgObj.caption;
    const targetPhone = isHelplineOnly ? (historyWhatsAppModal.bill?.phone || '') : helplinePhone;
    const { webUrl, appUrl } = getWhatsAppUrls(caption, targetPhone);

    const destLabel = isHelplineOnly ? '' : ' with Helpline';
    if (mode === 'app') {
      window.location.href = appUrl;
      setHistoryToast(`💬 Opening WhatsApp Desktop App to share ${caption}${destLabel}! Press Ctrl+V in the chat to paste.`);
    } else {
      window.open(webUrl, '_blank');
      setHistoryToast(`🌐 Opening WhatsApp Web to share ${caption}${destLabel}! Press Ctrl+V in the chat to paste.`);
    }
    setTimeout(() => setHistoryToast(''), 8000);
  };

  const handleShareWhatsApp = async (billId, bill) => {
    setSharingBillId(billId);
    setHistoryToast('Rendering Excel template image(s)...');
    try {
      const res = await fetch('/api/export/whatsapp-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      if (!data.images || data.images.length === 0) {
        throw new Error('No template images generated');
      }

      setCopiedSteps({});
      if (data.images.length > 0) {
        await handleCopyImageToClipboard(data.images[0], false);
      }

      // Always open modal with 1-by-1 workflow
      setHistoryWhatsAppModal({ isOpen: true, images: data.images, bill });
      setHistoryToast(
        data.images.length > 1
          ? `Rendered ${data.images.length} joint bill images! Share each part one by one.`
          : 'Bill image rendered & copied to clipboard! Choose WhatsApp Web or WhatsApp Desktop App below.'
      );
      setTimeout(() => setHistoryToast(''), 5000);
    } catch (err) {
      alert('WhatsApp share error: ' + err.message);
    } finally {
      setSharingBillId(null);
    }
  };

  const loadBills = (q = '') => {
    setLoading(true);
    fetch(`/api/bills?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        setBills(data.bills || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setBills([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBills(search);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill record?')) return;
    try {
      await fetch(`/api/bills/${id}`, { method: 'DELETE' });
      setBills(bills.filter((b) => b.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDownloadExcel = (billId) => {
    window.open(`/api/export/excel/${billId}`, '_blank');
  };

  const handleViewBill = async (id) => {
    try {
      const res = await fetch(`/api/bills/${id}`);
      const fullBill = await res.json();
      setActiveModalBill(fullBill);
    } catch (err) {
      alert('Failed to load bill details: ' + err.message);
    }
  };

  const handleOpenPaymentModal = (bill) => {
    setPaymentModal({
      isOpen: true,
      bill,
      file: null,
      previewUrl: bill.payment_screenshot || '',
      notes: bill.payment_notes || '',
      uploading: false
    });
  };

  const handleClosePaymentModal = () => {
    if (paymentModal.file && paymentModal.previewUrl && !paymentModal.previewUrl.startsWith('/uploads')) {
      try { URL.revokeObjectURL(paymentModal.previewUrl); } catch (e) {}
    }
    setPaymentModal({
      isOpen: false,
      bill: null,
      file: null,
      previewUrl: '',
      notes: '',
      uploading: false
    });
  };

  const handlePaymentFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPaymentModal((prev) => ({
        ...prev,
        file,
        previewUrl: localUrl
      }));
    }
  };

  const handleSavePaymentScreenshot = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!paymentModal.bill) return;

    if (!paymentModal.file && !paymentModal.bill.payment_screenshot) {
      alert('Please select an image file to upload as payment proof.');
      return;
    }

    setPaymentModal((prev) => ({ ...prev, uploading: true }));
    try {
      const formData = new FormData();
      if (paymentModal.file) {
        formData.append('screenshot', paymentModal.file);
      }
      formData.append('notes', paymentModal.notes || '');

      const res = await fetch(`/api/bills/${paymentModal.bill.id}/payment-screenshot`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setHistoryToast('✅ Payment screenshot attached successfully!');
      setTimeout(() => setHistoryToast(''), 5000);

      // Update in table list
      setBills((prev) =>
        prev.map((b) =>
          b.id === paymentModal.bill.id
            ? {
                ...b,
                payment_screenshot: data.payment_screenshot,
                payment_notes: data.payment_notes,
                payment_uploaded_at: data.payment_uploaded_at
              }
            : b
        )
      );

      // Update in view modal if active
      if (activeModalBill && activeModalBill.id === paymentModal.bill.id) {
        setActiveModalBill((prev) => ({
          ...prev,
          payment_screenshot: data.payment_screenshot,
          payment_notes: data.payment_notes,
          payment_uploaded_at: data.payment_uploaded_at
        }));
      }

      handleClosePaymentModal();
    } catch (err) {
      alert('Upload failed: ' + err.message);
      setPaymentModal((prev) => ({ ...prev, uploading: false }));
    }
  };

  const handleDeletePaymentScreenshot = async () => {
    if (!paymentModal.bill?.id) return;
    if (!window.confirm('Are you sure you want to remove this payment screenshot?')) return;

    setPaymentModal((prev) => ({ ...prev, uploading: true }));
    try {
      const res = await fetch(`/api/bills/${paymentModal.bill.id}/payment-screenshot`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete screenshot');

      setHistoryToast('🗑️ Payment screenshot removed.');
      setTimeout(() => setHistoryToast(''), 4000);

      // Update in table list
      setBills((prev) =>
        prev.map((b) =>
          b.id === paymentModal.bill.id
            ? {
                ...b,
                payment_screenshot: null,
                payment_notes: null,
                payment_uploaded_at: null
              }
            : b
        )
      );

      // Update in view modal if active
      if (activeModalBill && activeModalBill.id === paymentModal.bill.id) {
        setActiveModalBill((prev) => ({
          ...prev,
          payment_screenshot: null,
          payment_notes: null,
          payment_uploaded_at: null
        }));
      }

      handleClosePaymentModal();
    } catch (err) {
      alert('Remove failed: ' + err.message);
      setPaymentModal((prev) => ({ ...prev, uploading: false }));
    }
  };

  // Helper to parse joint data
  const getParsedJointData = (bill) => {
    if (!bill || !bill.joint_data) return null;
    try {
      return typeof bill.joint_data === 'string' ? JSON.parse(bill.joint_data) : bill.joint_data;
    } catch (e) {
      return null;
    }
  };

  const jointData = activeModalBill ? getParsedJointData(activeModalBill) : null;
  const isJoint = Boolean(activeModalBill?.is_joint) || activeModalBill?.category === 'joint' || Boolean(jointData);

  return (
    <div className="space-y-6">
      {/* Top Search & Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isHelplineOnly ? 'Helpline Bill Desk' : 'Bill History & Records'}
          </h2>
          <p className="text-sm text-slate-500">
            {isHelplineOnly
              ? 'Kendra Helpline Bills & Shared Ledger • Ready for 1-Click WhatsApp delivery with caption'
              : <>Records are named strictly by Short Code (e.g. <code>1011</code>). Click the Edit pencil icon to reload and modify any bill.</>}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Short Code or Name..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Short Code / Date</th>
                <th className="py-3 px-4">Centre / Institute</th>
                <th className="py-3 px-3 text-center">Examinees</th>
                <th className="py-3 px-4 text-right">Gross (₹)</th>
                <th className="py-3 px-4 text-right">Payable (₹)</th>
                <th className="py-3 px-4 font-semibold text-center">{isHelplineOnly ? 'Payment & Share' : 'Payment & Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">Loading bills...</td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No bills found. Create a new bill from the New Bill Desk tab.
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 font-mono text-sm">{b.bill_number}</span>
                        {b.is_joint ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                            JOINT BILL
                          </span>
                        ) : (
                          b.category && b.category !== 'indian' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              {b.category.toUpperCase()}
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{b.bill_date} • Session: {b.session}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{b.centre_name}</div>
                      <div className="text-xs text-slate-500">
                        {b.principal || 'No principal'} • {b.address}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-slate-700">{b.total_examinees}</span>
                      <span className="text-[11px] text-slate-400 block">
                        ({b.total_old} old, {b.total_new} new)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      ₹{b.gross_fees?.toFixed(0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 text-sm">
                      ₹{b.total_payable?.toFixed(1)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Payment Proof Button - Helpline & Admin */}
                        <button
                          onClick={() => handleOpenPaymentModal(b)}
                          title={b.payment_screenshot ? 'Payment Screenshot Attached (Click to view/manage)' : 'Attach Payment Screenshot'}
                          className={
                            b.payment_screenshot
                              ? "px-2 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                              : "px-2 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          }
                        >
                          {b.payment_screenshot ? (
                            <>
                              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[11px]">Paid Proof</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px]">Attach Proof</span>
                            </>
                          )}
                        </button>

                        {/* Edit Button - Hidden in Helpline mode */}
                        {!isHelplineOnly && onEditBill && (
                          <button
                            onClick={() => onEditBill(b.id)}
                            title="Load and Edit Bill"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-xs font-semibold"
                          >
                            <Edit3 className="w-4 h-4" /> Edit
                          </button>
                        )}

                        {/* View Modal */}
                        <button
                          onClick={() => handleViewBill(b.id)}
                          title="View Bill Details"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1 text-xs font-semibold"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>

                        {/* WhatsApp Share Excel Template Image - Always available */}
                        <button
                          onClick={() => handleShareWhatsApp(b.id, b)}
                          disabled={sharingBillId === b.id}
                          title="Share Excel Template Image to WhatsApp Helpline"
                          className={isHelplineOnly 
                            ? "px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                            : "p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg disabled:opacity-50 cursor-pointer"}
                        >
                          <Share2 className="w-4 h-4 text-green-600" /> {isHelplineOnly && 'WhatsApp'}
                        </button>

                        {/* Excel Export - Hidden in Helpline mode */}
                        {!isHelplineOnly && (
                          <button
                            onClick={() => handleDownloadExcel(b.id)}
                            title={b.is_joint ? `Export ${b.bill_number}.zip` : `Export ${b.bill_number}.xlsx`}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete - Hidden in Helpline mode */}
                        {!isHelplineOnly && (
                          <button
                            onClick={() => handleDelete(b.id)}
                            title="Delete Bill Record"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill View Modal */}
      {activeModalBill && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{activeModalBill.centre_name}</h3>
                  {isJoint && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                      JOINT BILL ({jointData?.slab_name || 'SLAB'})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Record: <b>{activeModalBill.bill_number}</b> • Date: {activeModalBill.bill_date} • Session: {activeModalBill.session}
                </p>
                <p className="text-xs text-slate-400 truncate max-w-lg mt-0.5">
                  {activeModalBill.address} (Ph: {activeModalBill.phone || 'N/A'})
                </p>
              </div>
              <button
                onClick={() => setActiveModalBill(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Consolidated Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">Total Examinees</span>
                <span className="font-bold text-slate-800 text-sm">{activeModalBill.total_examinees}</span>
                <span className="text-[10px] text-slate-400 block">({activeModalBill.total_old} Old, {activeModalBill.total_new} New)</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Gross Fees</span>
                <span className="font-bold text-slate-800 text-sm font-mono">₹{activeModalBill.gross_fees}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Concession</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {activeModalBill.total_discount_percent}% 
                  {activeModalBill.discount_amount > 0 && <span className="text-[10px] ml-1 text-slate-500 font-mono">(-₹{activeModalBill.discount_amount.toFixed(0)})</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Payable</span>
                <span className="font-bold text-rose-700 text-sm font-mono">₹{activeModalBill.total_payable}</span>
              </div>
            </div>

            {/* Payment Proof Card in Bill View Modal */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Payment Verification</span>
                  {activeModalBill.payment_screenshot ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Proof Attached
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                      Pending Proof
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal(activeModalBill)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-white border border-rose-200 hover:border-rose-300 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {activeModalBill.payment_screenshot ? 'Update / View Proof' : 'Attach Proof'}
                </button>
              </div>

              {activeModalBill.payment_screenshot && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t border-slate-200/60">
                  <a
                    href={activeModalBill.payment_screenshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block w-24 h-24 rounded-lg overflow-hidden border border-slate-300 shadow-xs hover:ring-2 hover:ring-rose-500 shrink-0 bg-white"
                  >
                    <img
                      src={activeModalBill.payment_screenshot}
                      alt="Payment Receipt"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                      Click Enlarge
                    </div>
                  </a>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700">Uploaded:</span> {activeModalBill.payment_uploaded_at || 'Recorded'}
                    </div>
                    {activeModalBill.payment_notes && (
                      <div>
                        <span className="font-semibold text-slate-700">Notes / UTR:</span> {activeModalBill.payment_notes}
                      </div>
                    )}
                    <div className="pt-1">
                      <a
                        href={activeModalBill.payment_screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-medium"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Full Image in New Tab
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* JOINT BILL VIEW: Render Indian, Western, and Yoga ONE BELOW ANOTHER (NOT MIXED) */}
            {isJoint && jointData?.disciplines ? (
              <div className="space-y-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Disciplines Breakdown (Viewed One Below Another)
                </div>

                {['indian', 'western', 'yoga'].map((discKey) => {
                  const disc = jointData.disciplines[discKey];
                  if (!disc || !disc.active || !disc.items || disc.items.length === 0) return null;

                  const meta = DISC_TITLES[discKey] || { title: discKey.toUpperCase(), emoji: '📄', bg: 'bg-slate-50 text-slate-800 border-slate-200' };

                  // Calculate subtotal for this discipline
                  let discGross = 0;
                  let discOld = 0;
                  let discNew = 0;
                  disc.items.forEach((it) => {
                    const oldC = parseInt(it.old_count) || 0;
                    const newC = parseInt(it.new_count) || 0;
                    const fee = parseFloat(it.exam_fee) || 0;
                    discOld += oldC;
                    discNew += newC;
                    discGross += (oldC + newC) * fee;
                  });

                  const discAmt = (discGross * (activeModalBill.total_discount_percent || 0)) / 100;
                  const afterDisc = discGross - discAmt;
                  const regFees = discNew * 23;
                  const exAmt = parseFloat(disc.examinerFeeAmount) || 0;
                  const exSchools = disc.examinerSchoolCount || '2';
                  const discTotalPayable = afterDisc + regFees - exAmt;

                  return (
                    <div key={discKey} className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      {/* Section Title */}
                      <div className={`px-3.5 py-2.5 font-bold text-xs flex items-center justify-between border-b ${meta.bg}`}>
                        <div className="flex items-center gap-1.5">
                          <span>{meta.emoji}</span>
                          <span>{meta.title}</span>
                        </div>
                        <div className="font-mono text-[11px] font-bold">
                          Examinees: {discOld + discNew} • Subtotal: ₹{discGross}
                        </div>
                      </div>

                      {/* Discipline Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3 text-center">Level / Year</th>
                              <th className="py-2 px-2 text-right">Fee (₹)</th>
                              <th className="py-2 px-2 text-center">Old</th>
                              <th className="py-2 px-2 text-center">New</th>
                              <th className="py-2 px-3 text-right">Total (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {disc.items.map((it, idx) => {
                              const o = parseInt(it.old_count) || 0;
                              const n = parseInt(it.new_count) || 0;
                              const lineTot = (o + n) * (parseFloat(it.exam_fee) || 0);
                              return (
                                <tr key={it.id || idx} className="hover:bg-slate-50/50">
                                  <td className="py-1.5 px-3 text-center font-medium text-slate-800">
                                    {it.level_name?.includes('Churamoni') ? (
                                      <div className="leading-tight">
                                        <div>All India Churamoni</div>
                                        <div>Examination</div>
                                      </div>
                                    ) : (
                                      it.level_name
                                    )}
                                  </td>
                                  <td className="py-1.5 px-2 text-right text-slate-600 font-mono">{it.exam_fee}</td>
                                  <td className="py-1.5 px-2 text-center font-mono">{o || '-'}</td>
                                  <td className="py-1.5 px-2 text-center font-mono">{n || '-'}</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800">
                                    {lineTot > 0 ? `₹${lineTot}` : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {/* Discipline Calculation Footer */}
                          <tfoot className="bg-slate-50 text-xs font-semibold border-t border-slate-200 divide-y divide-slate-200/60">
                            <tr>
                              <td colSpan="4" className="py-1.5 px-3 text-right text-slate-700">Gross Total:</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">₹{discGross}</td>
                            </tr>
                            {activeModalBill.total_discount_percent > 0 && (
                              <>
                                <tr>
                                  <td colSpan="4" className="py-1 px-3 text-right text-emerald-700">
                                    Special Less ({activeModalBill.total_discount_percent}%):
                                  </td>
                                  <td className="py-1 px-3 text-right font-mono text-emerald-700 font-bold">
                                    -₹{discAmt.toFixed(1)}
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan="4" className="py-1 px-3 text-right text-slate-700">Fees After Deduction:</td>
                                  <td className="py-1 px-3 text-right font-mono font-bold text-slate-800">
                                    ₹{afterDisc.toFixed(1)}
                                  </td>
                                </tr>
                              </>
                            )}
                            {regFees > 0 && (
                              <tr>
                                <td colSpan="4" className="py-1 px-3 text-right text-slate-700">Registration Fees (New × ₹23):</td>
                                <td className="py-1 px-3 text-right font-mono font-bold text-slate-800">₹{regFees}</td>
                              </tr>
                            )}
                            {exAmt > 0 && (
                              <tr>
                                <td colSpan="4" className="py-1 px-3 text-right text-rose-700">
                                  Examiner fees for {exSchools} school:
                                </td>
                                <td className="py-1 px-3 text-right font-mono text-rose-700 font-bold">
                                  -₹{exAmt}
                                </td>
                              </tr>
                            )}
                            <tr className="bg-slate-100 font-bold text-slate-900">
                              <td colSpan="4" className="py-2 px-3 text-right">
                                {meta.title} Payable Total:
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-rose-700 text-sm">
                                ₹{discTotalPayable.toFixed(1)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* SINGLE BILL ITEMS TABLE */
              <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3 text-center">Level / Year</th>
                      <th className="py-2 px-2 text-right">Exam Fee</th>
                      <th className="py-2 px-2 text-center">Old</th>
                      <th className="py-2 px-2 text-center">New</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeModalBill.items || []).map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50/60">
                        <td className="py-1.5 px-3 text-center font-medium text-slate-800">
                          {it.level_name?.includes('Churamoni') ? (
                            <div className="leading-tight">
                              <div>All India Churamoni</div>
                              <div>Examination</div>
                            </div>
                          ) : (
                            it.level_name
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono">₹{it.exam_fee}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{it.old_count || '-'}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{it.new_count || '-'}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">₹{it.line_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveModalBill(null)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>

              {/* Edit in Billing Desk - Hidden in Helpline mode */}
              {!isHelplineOnly && onEditBill && (
                <button
                  onClick={() => {
                    const targetId = activeModalBill.id;
                    setActiveModalBill(null);
                    onEditBill(targetId);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit in Billing Desk
                </button>
              )}

              {/* Export ZIP / Excel - Hidden in Helpline mode */}
              {!isHelplineOnly && (
                <button
                  onClick={() => handleDownloadExcel(activeModalBill.id)}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> {isJoint ? 'Export ZIP' : 'Export Excel'}
                </button>
              )}

              {/* WhatsApp Share - Always available */}
              <button
                onClick={() => handleShareWhatsApp(activeModalBill.id, activeModalBill)}
                disabled={sharingBillId === activeModalBill.id}
                className="px-3.5 py-1.5 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP SHARING MODAL IN BILL HISTORY - HELPLINE ROUTING & ONE-BY-ONE */}
      {historyWhatsAppModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-green-600" /> {isHelplineOnly ? 'Share Bill to WhatsApp' : 'Share Bill to Helpline'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rendered from Excel template for <b>{formatCentreCaption(historyWhatsAppModal.bill?.bill_number || historyWhatsAppModal.bill?.centre_short_code)}</b>
                  {isHelplineOnly && historyWhatsAppModal.bill?.centre_name && ` — ${historyWhatsAppModal.bill.centre_name}`}
                </p>
              </div>
              <button
                onClick={() => setHistoryWhatsAppModal({ isOpen: false, images: [], bill: null })}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Helpline WhatsApp Number Bar - Only shown in normal Bill History, HIDDEN in Helpline Bill Desk */}
            {!isHelplineOnly && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <span>Kendra Helpline WhatsApp No:</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={helplinePhone}
                      onChange={(e) => {
                        setHelplinePhone(e.target.value);
                        localStorage.setItem('kendra_helpline_phone', e.target.value);
                      }}
                      placeholder="e.g. 9830012345 (Helpline)"
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 w-full sm:w-52 focus:outline-hidden focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  🔒 Teacher phone numbers are never contacted directly. Images are dispatched only to our Kendra Helpline.
                </p>
              </div>
            )}

            {/* Instructions Banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 flex items-start gap-2.5">
              <span className="text-base">📋</span>
              <div>
                <span className="font-bold">
                  {historyWhatsAppModal.images.length > 1
                    ? `Joint Bill with ${historyWhatsAppModal.images.length} Parts — Send One by One`
                    : 'Bill image automatically copied to clipboard!'}
                </span>
                <p className="text-[11px] text-green-700 mt-0.5">
                  {historyWhatsAppModal.images.length > 1
                    ? 'Click WhatsApp Web or WhatsApp App on Step 1, press Ctrl + V in chat and send. Then proceed to Step 2.'
                    : 'Click WhatsApp Web or WhatsApp App below to open the chat with caption, then press Ctrl + V to paste and send.'}
                </p>
              </div>
            </div>

            {/* ONE-BY-ONE STEP-BY-STEP SEQUENTIAL SHARING */}
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {historyWhatsAppModal.images.length > 1 && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>👣</span>
                    <span>Send Each Part One by One (1 by 1)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {Object.values(copiedSteps).filter(Boolean).length} of {historyWhatsAppModal.images.length} steps sent
                  </span>
                </div>
              )}

              {historyWhatsAppModal.images.map((imgObj, idx) => {
                const discKey = imgObj.key;
                const label = imgObj.label || (discKey === 'indian' ? 'Indian' : (discKey === 'western' ? 'Western' : (discKey === 'yoga' ? 'Yoga' : 'Bill')));
                const emoji = discKey === 'indian' ? '🎻' : (discKey === 'western' ? '🎹' : (discKey === 'yoga' ? '🧘' : '📄'));
                const caption = imgObj.caption;
                const isCopied = Boolean(copiedSteps[discKey]);
                const isCurrent = !isCopied && (idx === 0 || Boolean(copiedSteps[historyWhatsAppModal.images[idx - 1]?.key]));

                return (
                  <div
                    key={discKey || caption}
                    className={`p-3 rounded-xl space-y-3 transition-all border ${
                      isCopied
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : isCurrent && historyWhatsAppModal.images.length > 1
                        ? 'bg-white border-blue-400 shadow-sm ring-2 ring-blue-100'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {historyWhatsAppModal.images.length > 1 ? `Step ${idx + 1}: ${label} Part` : `${label} Part`}
                            </span>
                            {isCopied && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                <Check className="w-3 h-3" /> Sent
                              </span>
                            )}
                            {isCurrent && !isCopied && historyWhatsAppModal.images.length > 1 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300 animate-pulse">
                                👉 Next to Send
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-md border border-green-300 inline-block mt-0.5">
                            Caption: {caption}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* WhatsApp Web Button */}
                        <button
                          onClick={() => handleOpenWhatsApp(imgObj, 'web')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title={`Copy ${label} image & open WhatsApp Web with caption ${caption}`}
                        >
                          <ExternalLink className="w-3 h-3" /> WhatsApp Web
                        </button>

                        {/* WhatsApp Desktop App Button */}
                        <button
                          onClick={() => handleOpenWhatsApp(imgObj, 'app')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title={`Copy ${label} image & open WhatsApp Desktop App with caption ${caption}`}
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp App
                        </button>

                        {/* Copy Image Button */}
                        <button
                          onClick={() => handleCopyImageToClipboard(imgObj)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-all shadow-xs cursor-pointer"
                          title="Copy image to clipboard"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>

                        {/* Download Image Button */}
                        <button
                          onClick={() => handleDownloadImage(imgObj)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-all shadow-xs cursor-pointer"
                          title="Download PNG file"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {imgObj.base64 && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto shadow-inner">
                        <img
                          src={imgObj.base64}
                          alt={caption}
                          className="w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT PROOF UPLOAD / VIEW MODAL */}
      {paymentModal.isOpen && paymentModal.bill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Payment Screenshot & Proof
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bill <b>{paymentModal.bill.bill_number}</b> • {paymentModal.bill.centre_name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePaymentModal}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Payable reminder card */}
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Bill Payable Amount:</span>
                  <span className="text-lg font-bold font-mono text-rose-700">₹{paymentModal.bill.total_payable}</span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <span>Date: {paymentModal.bill.bill_date}</span>
                  <span className="block font-mono">Total Candidates: {paymentModal.bill.total_examinees}</span>
                </div>
              </div>

              {/* Existing Screenshot Preview or New Selection */}
              {paymentModal.previewUrl ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                    <span>Attached Screenshot / Receipt:</span>
                    {paymentModal.bill.payment_screenshot && (
                      <button
                        type="button"
                        onClick={handleDeletePaymentScreenshot}
                        disabled={paymentModal.uploading}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Screenshot
                      </button>
                    )}
                  </div>
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 max-h-64 flex items-center justify-center p-2 group">
                    <img
                      src={paymentModal.previewUrl}
                      alt="Payment proof"
                      className="max-h-60 max-w-full object-contain rounded-lg shadow-xs"
                    />
                    <a
                      href={paymentModal.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-xs transition-opacity shadow-md"
                    >
                      <ExternalLink className="w-3 h-3" /> Full Size
                    </a>
                  </div>
                  {paymentModal.bill.payment_uploaded_at && (
                    <p className="text-[11px] text-slate-400">
                      Uploaded on: {paymentModal.bill.payment_uploaded_at}
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-2 hover:border-rose-400 transition-colors bg-slate-50/50">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Select payment receipt or screenshot
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Upload UPI screenshot, bank receipt, NEFT advice, or cheque photo
                  </p>
                </div>
              )}

              {/* File upload input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {paymentModal.previewUrl ? 'Change / Replace Screenshot Image:' : 'Upload Screenshot Image:'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentFileSelect}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer border border-slate-200 rounded-xl p-1 bg-white"
                />
              </div>

              {/* Payment Notes / UTR */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Payment Reference / UTR / Remarks (Optional):
                </label>
                <input
                  type="text"
                  value={paymentModal.notes}
                  onChange={(e) => setPaymentModal((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. UTR: 412356789012, Google Pay, SBI Cheque #123456"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 font-sans"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClosePaymentModal}
                disabled={paymentModal.uploading}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePaymentScreenshot}
                disabled={paymentModal.uploading || (!paymentModal.file && !paymentModal.bill.payment_screenshot && !paymentModal.notes)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {paymentModal.uploading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Payment Proof</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {historyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <Share2 className="w-4 h-4 text-green-400" />
          <span>{historyToast}</span>
        </div>
      )}
    </div>
  );
}
