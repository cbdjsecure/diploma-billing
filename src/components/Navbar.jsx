import React from 'react';
import { 
  FileText, 
  Settings, 
  Database, 
  History, 
  Building2,
  Headphones,
  Lock,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout, onLockedTabClick }) {
  const isHelplineUser = currentUser?.role === 'helpline';

  const navItems = [
    { id: 'billing', label: 'New Bill Desk', icon: FileText },
    { id: 'history', label: 'Bill History & Records', icon: History },
    { id: 'helpline', label: 'Helpline Bill Desk', icon: Headphones },
    { id: 'centres', label: 'Centres Directory', icon: Building2 },
    { id: 'rates', label: 'Rate Charts', icon: Database },
    { id: 'settings', label: 'Settings & Slabs', icon: Settings },
  ];

  const handleTabClick = (item) => {
    const isLocked = isHelplineUser && item.id !== 'helpline';
    if (isLocked) {
      if (onLockedTabClick) {
        onLockedTabClick(item.label);
      }
      return;
    }
    setActiveTab(item.id);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3">
          {/* Logo & Org */}
          <div 
            className="flex items-center space-x-3 cursor-pointer shrink-0" 
            onClick={() => handleTabClick(isHelplineUser ? { id: 'helpline', label: 'Helpline Bill Desk' } : { id: 'billing', label: 'New Bill Desk' })}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-200 font-extrabold text-base">
              SB
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm sm:text-base leading-tight tracking-tight">
                Suro Bharati Sangeet Kala Kendra
              </h1>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Diploma Examination Billing System • 2026-27
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = isHelplineUser && item.id !== 'helpline';

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item)}
                  title={isLocked ? `Locked for Helpline role` : item.label}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                    isLocked
                      ? 'text-slate-400 bg-slate-100/70 border border-slate-200/80 cursor-not-allowed hover:bg-slate-200/50 hover:text-slate-500'
                      : isActive
                      ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    isLocked 
                      ? 'text-slate-400' 
                      : isActive 
                      ? 'text-rose-600' 
                      : 'text-slate-400'
                  }`} />
                  <span className="hidden md:inline">{item.label}</span>
                  {isLocked && (
                    <span className="inline-flex items-center text-slate-400 pl-0.5" title="Locked tab">
                      <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 shrink-0">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                ) : (
                  <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className="font-bold text-slate-700">
                  {currentUser.display_name || currentUser.username}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                  currentUser.role === 'admin' 
                    ? 'bg-rose-100 text-rose-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {currentUser.role}
                </span>
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out of billing system"
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-600 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
