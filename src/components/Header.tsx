import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User, Building2, Stethoscope, ShieldCheck, HeartHandshake } from 'lucide-react';

interface HeaderProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { user, logout, quickLogin } = useAuth();

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'patient':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <User className="w-3.5 h-3.5" />
            Patient
          </span>
        );
      case 'doctor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Stethoscope className="w-3.5 h-3.5" />
            Doctor
          </span>
        );
      case 'hospital_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hospital Admin
          </span>
        );
      case 'caregiver':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
            Caregiver
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">CareFlow</span>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Phase 1 Foundation
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Patient-Centric Healthcare Journey & Care Coordination</p>
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Role & Hospital Affiliation */}
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{user.hospital_name || 'General Network'}</span>
                </div>
              </div>

              {getRoleBadge()}

              {/* Demo Switcher Quick Menu */}
              <div className="hidden lg:flex items-center bg-slate-100 rounded-lg p-1 text-xs border border-slate-200">
                <span className="text-slate-500 px-2 font-medium">Switch Demo:</span>
                <button
                  onClick={() => quickLogin('alex.rivera@example.com')}
                  className={`px-2 py-1 rounded transition-colors ${
                    user.role === 'patient' ? 'bg-white text-teal-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to Alex Rivera (Patient)"
                >
                  Patient
                </button>
                <button
                  onClick={() => quickLogin('dr.chen@stjude.org')}
                  className={`px-2 py-1 rounded transition-colors ${
                    user.role === 'doctor' ? 'bg-white text-teal-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to Dr. Sarah Chen (Doctor)"
                >
                  Doctor
                </button>
                <button
                  onClick={() => quickLogin('admin@stjude.org')}
                  className={`px-2 py-1 rounded transition-colors ${
                    user.role === 'hospital_admin' ? 'bg-white text-teal-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to Elena Rostova (Admin)"
                >
                  Admin
                </button>
                <button
                  onClick={() => quickLogin('caregiver@careflow.org')}
                  className={`px-2 py-1 rounded transition-colors ${
                    user.role === 'caregiver' ? 'bg-white text-teal-700 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Switch to Maria Rivera (Caregiver)"
                >
                  Caregiver
                </button>
              </div>

              {/* Logout button */}
              <button
                id="header-logout-btn"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="Sign out of current session"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="header-login-btn"
                onClick={() => onOpenAuth?.('login')}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                id="header-register-btn"
                onClick={() => onOpenAuth?.('register')}
                className="px-4 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
