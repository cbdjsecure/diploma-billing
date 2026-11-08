import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, Check, KeyRound, ShieldCheck, Headphones } from 'lucide-react';

export default function SettingsView() {
  const [session, setSession] = useState('2026-27');
  const [seasonalDiscount, setSeasonalDiscount] = useState('0');
  const [extraLess, setExtraLess] = useState('10');
  const [regFee, setRegFee] = useState('23');
  const [orgName, setOrgName] = useState('Suro Bharati Sangeet Kala Kendra');
  const [orgAddress, setOrgAddress] = useState('19/I, Vivekananda Lane, Serampore, Hooghly - 712201');
  const [helplineWhatsapp, setHelplineWhatsapp] = useState('');

  const [slabs, setSlabs] = useState([]);
  const [status, setStatus] = useState('');

  // Password update states
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newHelplinePass, setNewHelplinePass] = useState('');
  const [authStatus, setAuthStatus] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.session) setSession(data.settings.session);
          if (data.settings.seasonal_discount !== undefined) setSeasonalDiscount(data.settings.seasonal_discount);
          if (data.settings.extra_less !== undefined) setExtraLess(data.settings.extra_less);
          if (data.settings.registration_fee) setRegFee(data.settings.registration_fee);
          if (data.settings.org_name) setOrgName(data.settings.org_name);
          if (data.settings.org_address) setOrgAddress(data.settings.org_address);
          if (data.settings.helpline_whatsapp) setHelplineWhatsapp(data.settings.helpline_whatsapp);
        }
        if (data.discount_slabs) {
          setSlabs(data.discount_slabs);
        }
      });
  }, []);

  const handleSlabChange = (idx, field, val) => {
    const updated = [...slabs];
    updated[idx][field] = val === '' ? null : parseFloat(val);
    setSlabs(updated);
  };

  const addSlab = () => {
    setSlabs([...slabs, { min_count: 0, max_count: 0, discount_percent: 0 }]);
  };

  const removeSlab = (idx) => {
    setSlabs(slabs.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async () => {
    try {
      // Save settings
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            session,
            seasonal_discount: seasonalDiscount,
            extra_less: extraLess,
            registration_fee: regFee,
            org_name: orgName,
            org_address: orgAddress,
            helpline_whatsapp: helplineWhatsapp
          }
        })
      });

      // Save slabs
      await fetch('/api/settings/slabs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slabs })
      });

      setStatus('Settings saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    }
  };

  const handleUpdatePassword = async (username, newPassword) => {
    if (!newPassword || newPassword.length < 4) {
      alert('Password must be at least 4 characters long');
      return;
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      
      setAuthStatus(`✓ Password for ${username} updated successfully!`);
      if (username === 'admin') setNewAdminPass('');
      if (username === 'helpline') setNewHelplinePass('');
      setTimeout(() => setAuthStatus(''), 4000);
    } catch (err) {
      alert('Password update error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">System Settings & Discount Slabs</h2>
          <p className="text-sm text-slate-500">
            Configure default session, examinee discount slabs, and board details.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      {status && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4" /> {status}
        </div>
      )}

      {/* Board & Session Meta */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
          General Configurations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Current Session</label>
            <input
              type="text"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Registration Fee (₹ per new student)</label>
            <input
              type="number"
              value={regFee}
              onChange={(e) => setRegFee(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Default Extra Less (%)</label>
            <input
              type="number"
              value={extraLess}
              onChange={(e) => setExtraLess(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default Extra Less given (on top of slab) when examinees ≥ 15</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Seasonal Concession Default (%)</label>
            <input
              type="number"
              value={seasonalDiscount}
              onChange={(e) => setSeasonalDiscount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Seasonal festival concession (%)</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Organization Address (printed on bill)</label>
            <input
              type="text"
              value={orgAddress}
              onChange={(e) => setOrgAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kendra Helpline WhatsApp Number (for Bill Sharing)</label>
            <input
              type="text"
              value={helplineWhatsapp}
              onChange={(e) => setHelplineWhatsapp(e.target.value)}
              placeholder="e.g. 9830012345"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-semibold"
            />
            <p className="text-[11px] text-slate-400 mt-1">Exported bill images are dispatched to this Helpline with caption C-XXXX (teachers are never contacted directly)</p>
          </div>
        </div>
      </div>

      {/* Discount Slabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800">Candidate Count Discount Slabs</h3>
            <p className="text-xs text-slate-500">
              Set the standard concession based on total examinees. You can add more slabs anytime.
            </p>
          </div>
          <button
            onClick={addSlab}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Slab
          </button>
        </div>

        <div className="space-y-2">
          {slabs.map((slab, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 w-16">Slab #{idx + 1}</span>
              <div className="flex items-center gap-2 text-xs">
                <span>Min:</span>
                <input
                  type="number"
                  value={slab.min_count ?? ''}
                  onChange={(e) => handleSlabChange(idx, 'min_count', e.target.value)}
                  className="w-20 px-2 py-1 border border-slate-200 rounded bg-white font-mono"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>Max:</span>
                <input
                  type="number"
                  placeholder="No Limit"
                  value={slab.max_count ?? ''}
                  onChange={(e) => handleSlabChange(idx, 'max_count', e.target.value)}
                  className="w-24 px-2 py-1 border border-slate-200 rounded bg-white font-mono"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>Concession:</span>
                <input
                  type="number"
                  value={slab.discount_percent ?? ''}
                  onChange={(e) => handleSlabChange(idx, 'discount_percent', e.target.value)}
                  className="w-20 px-2 py-1 border border-slate-200 rounded bg-white font-mono font-bold text-rose-700"
                />
                <span>%</span>
              </div>
              <button
                onClick={() => removeSlab(idx)}
                className="ml-auto text-rose-500 hover:text-rose-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account Security & Password Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-rose-600" /> Account Security & Role Passwords
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Change login passwords for the Admin and Helpline accounts.
            </p>
          </div>
          {authStatus && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg animate-in fade-in">
              {authStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Admin Password Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800">Admin Account</span>
                <span className="text-[11px] text-slate-500 block font-mono">username: admin</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New Admin password"
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleUpdatePassword('admin', newAdminPass)}
                disabled={!newAdminPass}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-all cursor-pointer"
              >
                Update
              </button>
            </div>
          </div>

          {/* Helpline Password Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800">Helpline Account</span>
                <span className="text-[11px] text-slate-500 block font-mono">username: helpline</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New Helpline password"
                value={newHelplinePass}
                onChange={(e) => setNewHelplinePass(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleUpdatePassword('helpline', newHelplinePass)}
                disabled={!newHelplinePass}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-40 transition-all cursor-pointer"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

