import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BillingDesk from './components/BillingDesk';
import BillHistory from './components/BillHistory';
import CentresDirectory from './components/CentresDirectory';
import RateCharts from './components/RateCharts';
import SettingsView from './components/SettingsView';
import Login from './components/Login';
import { Lock } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('billing_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('billing_user');
      const u = saved ? JSON.parse(saved) : null;
      return u?.role === 'helpline' ? 'helpline' : 'billing';
    } catch (e) {
      return 'billing';
    }
  });

  const [loadedBillId, setLoadedBillId] = useState(null);
  const [lockedToast, setLockedToast] = useState('');

  // When currentUser changes, enforce appropriate active tab
  useEffect(() => {
    if (currentUser?.role === 'helpline') {
      setActiveTab('helpline');
    }
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'helpline') {
      setActiveTab('helpline');
    } else {
      setActiveTab('billing');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('billing_user');
      setCurrentUser(null);
      setActiveTab('billing');
      setLoadedBillId(null);
    }
  };

  const handleLockedTabClick = (tabLabel) => {
    setLockedToast(`🔒 "${tabLabel}" is locked for the Helpline account. You have full access to the Helpline Bill Desk.`);
    setTimeout(() => setLockedToast(''), 4500);
  };

  const handleEditBill = (billId) => {
    if (currentUser?.role === 'helpline') {
      handleLockedTabClick('New Bill Desk');
      return;
    }
    setLoadedBillId(billId);
    setActiveTab('billing');
  };

  const handleClearLoadedBill = () => {
    setLoadedBillId(null);
  };

  // If not logged in, render the login page
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isHelpline = currentUser.role === 'helpline';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLockedTabClick={handleLockedTabClick}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If helpline user somehow lands on non-helpline tab, fallback safely to helpline desk */}
        {isHelpline ? (
          <BillHistory isHelplineOnly={true} />
        ) : (
          <>
            {activeTab === 'billing' && (
              <BillingDesk 
                loadedBillId={loadedBillId} 
                onClearLoadedBill={handleClearLoadedBill} 
              />
            )}
            {activeTab === 'history' && (
              <BillHistory onEditBill={handleEditBill} />
            )}
            {activeTab === 'helpline' && (
              <BillHistory isHelplineOnly={true} />
            )}
            {activeTab === 'centres' && <CentresDirectory />}
            {activeTab === 'rates' && <RateCharts />}
            {activeTab === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {/* Floating Locked Tab Notification */}
      {lockedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
            <Lock className="w-4 h-4" />
          </div>
          <span>{lockedToast}</span>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 no-print">
        Suro Bharati Sangeet Kala Kendra Examination Billing System • Built with React, Vite & Node.js
      </footer>
    </div>
  );
}
