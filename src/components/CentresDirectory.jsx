import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Search,
  MapPin,
  User,
  Phone,
  Mail,
  Upload,
  Check,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export default function CentresDirectory() {
  const [centres, setCentres] = useState([]);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMeta = () => {
    fetch('/api/centres/meta/count')
      .then((res) => res.json())
      .then((d) => setTotalCount(d.total || 0))
      .catch(() => setTotalCount(0));
  };

  const loadCentres = (q = '') => {
    setLoading(true);
    fetch(`/api/centres/search?q=${encodeURIComponent(q || '')}`)
      .then((res) => res.json())
      .then((data) => {
        setCentres(data || []);
        setLoading(false);
      })
      .catch(() => {
        setCentres([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMeta();
    loadCentres(search);
  }, [search]);

  // Handle Excel Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadStatus(`Uploading and parsing ${file.name}...`);

    try {
      const res = await fetch('/api/centres/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus(`Successfully loaded ${data.totalImported.toLocaleString()} centres!`);
        fetchMeta();
        loadCentres(search);
        setTimeout(() => setUploadStatus(''), 4000);
      } else {
        setUploadStatus('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setUploadStatus('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Clear / Delete Old Centres
  const handleClearCentres = async () => {
    setShowClearConfirm(false);
    setLoading(true);
    try {
      const res = await fetch('/api/centres/clear', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTotalCount(0);
        setCentres([]);
        setUploadStatus('All old centre details have been cleared.');
        setTimeout(() => setUploadStatus(''), 3500);
      }
    } catch (err) {
      alert('Failed to clear centres: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">Centres & Institute Directory</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
              {totalCount.toLocaleString()} Centres
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {totalCount > 0
              ? 'Stored centre directory. You can upload updated backups or clear existing records.'
              : 'No centre details stored. Upload your Excel backup file to load centre records.'}
          </p>
        </div>

        {/* Action Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Load Centre File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isUploading ? 'Loading File...' : 'Load Centre File'}
          </button>

          {/* Delete Old Details Button */}
          {totalCount > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Clear All Centres
            </button>
          )}

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, city..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Upload Status Alert */}
      {uploadStatus && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl px-4 py-3 text-xs font-medium flex items-center justify-between">
          <span>{uploadStatus}</span>
          <button onClick={() => setUploadStatus('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Empty State / Load Prompt */}
      {totalCount === 0 && !loading && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Centre Details Loaded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Upload your Centre Backup Excel file (<code>.xlsx</code> or <code>.xls</code>). The app will automatically parse all centres, principals, addresses, and PIN codes.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <Upload className="w-4 h-4" />
            Select & Load Centre Excel File
          </button>
        </div>
      )}

      {/* Directory Table */}
      {totalCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Short Code</th>
                  <th className="py-3 px-4">Centre Code</th>
                  <th className="py-3 px-4">Institute Name</th>
                  <th className="py-3 px-4">Principal</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">Loading centres...</td>
                  </tr>
                ) : centres.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No centres matching "{search}".
                    </td>
                  </tr>
                ) : (
                  centres.map((c) => (
                    <tr key={c.short_code} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                        {c.short_code}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {c.centre_code || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {c.centre_name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {c.principal || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {c.whatsapp || c.phone1 || c.phone2 || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 truncate max-w-xs">
                        {c.full_address || c.address || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear All Centres */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Clear All Centre Details?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete all stored centre details? You will need to load the Centre Backup Excel file again to search and autocomplete centres.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCentres}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
