import React, { useState, useEffect } from 'react';
import { Database, Save, Check, RefreshCw } from 'lucide-react';

export default function RateCharts() {
  const [rates, setRates] = useState([]);
  const [filterZone, setFilterZone] = useState('zone1_ne_wb');
  const [filterCat, setFilterCat] = useState('indian');
  const [editMap, setEditMap] = useState({});
  const [status, setStatus] = useState('');

  const loadRates = () => {
    fetch(`/api/rates?zone=${filterZone}&category=${filterCat}`)
      .then((res) => res.json())
      .then((data) => {
        setRates(data || []);
        const initial = {};
        for (const item of data || []) {
          initial[item.id] = { exam_fee: item.exam_fee, convocation_fee: item.convocation_fee };
        }
        setEditMap(initial);
      });
  };

  useEffect(() => {
    loadRates();
  }, [filterZone, filterCat]);

  const handleRateChange = (id, field, value) => {
    setEditMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSaveOne = async (id) => {
    const data = editMap[id];
    try {
      await fetch(`/api/rates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setStatus('Rate updated successfully!');
      setTimeout(() => setStatus(''), 2500);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Rate Chart Manager</h2>
          <p className="text-sm text-slate-500">
            View and adjust official session fee rates across all 5 zones and disciplines.
          </p>
        </div>

        {status && (
          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {status}
          </span>
        )}
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Discipline / Category</label>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium"
          >
            <option value="indian">Indian Classical (Dance/Music/Art)</option>
            <option value="western">Western Dance & Music</option>
            <option value="yoga">Yoga (Universal)</option>
          </select>
        </div>

        {filterCat !== 'yoga' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select State / Zone</label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium"
            >
              <option value="zone1_ne_wb">Zone 1: NE States + West Bengal (Excl. Kolkata)</option>
              <option value="zone4_kolkata">Zone 4: Kolkata Zone (Pin 700)</option>
              <option value="zone3_central_east">Zone 3: Bihar, Jharkhand, Odisha, CG</option>
              <option value="zone2_other">Zone 2: Other States (All India)</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Level / Year Name</th>
              <th className="py-3 px-4">Exam Fee (₹)</th>
              <th className="py-3 px-4">Convocation Fee (₹)</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rates.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-semibold text-slate-800">{r.level_name}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={editMap[r.id]?.exam_fee ?? r.exam_fee}
                    onChange={(e) => handleRateChange(r.id, 'exam_fee', e.target.value)}
                    className="w-32 px-2 py-1 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    value={editMap[r.id]?.convocation_fee ?? r.convocation_fee}
                    onChange={(e) => handleRateChange(r.id, 'convocation_fee', e.target.value)}
                    className="w-32 px-2 py-1 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleSaveOne(r.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

