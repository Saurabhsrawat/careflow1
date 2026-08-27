import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseStatus } from '../../types';
import { PatientPortal } from '../patient/PatientPortal';
import { DoctorPortal } from '../doctor/DoctorPortal';
import { HospitalAdminPortal } from '../hospital/HospitalAdminPortal';
import { CaregiverPortal } from '../caregiver/CaregiverPortal';
import { 
  User, 
  Stethoscope, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Calendar, 
  Heart, 
  FileText, 
  Layers, 
  Clock, 
  Database, 
  RefreshCw, 
  ArrowRight,
  Sparkles,
  Phone,
  AlertCircle
} from 'lucide-react';

export const PlaceholderDashboard: React.FC = () => {
  const { user, token, logout, refreshUser } = useAuth();
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const fetchStatus = () => {
    fetch('/api/hospitals/status')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch((err) => console.error('DB status error:', err));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleResetDb = async () => {
    if (!window.confirm('Reset SQLite database and re-seed with clean demo data?')) return;
    try {
      setResetting(true);
      setResetMessage(null);
      const res = await fetch('/api/hospitals/reset', { method: 'POST' });
      const data = await res.json();
      setResetMessage(data.message || 'Database re-seeded successfully');
      fetchStatus();
      await refreshUser();
    } catch (err: any) {
      setResetMessage('Reset failed: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  if (!user) return null;

  // If patient, render full Patient Module
  if (user.role === 'patient') {
    return <PatientPortal />;
  }

  // If doctor, render full Doctor Module
  if (user.role === 'doctor') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DoctorPortal />
      </div>
    );
  }

  // If hospital admin, render full Hospital Admin Module
  if (user.role === 'hospital_admin') {
    return (
      <HospitalAdminPortal 
        user={user} 
        token={token} 
        onLogout={logout} 
      />
    );
  }

  // If caregiver, render full Caregiver Module
  if (user.role === 'caregiver') {
    return <CaregiverPortal />;
  }
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
              user.role === 'doctor' 
                ? 'bg-blue-600' 
                : 'bg-purple-600'
            }`}>
              {user.role === 'doctor' && <Stethoscope className="w-7 h-7" />}
              {user.role === 'hospital_admin' && <ShieldCheck className="w-7 h-7" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Welcome, {user.name}
                </h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  user.role === 'doctor' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Email:</span> {user.email}
                </span>
                {user.hospital_name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.hospital_name}</span>
                  </span>
                )}
                {user.doctor?.specialization && (
                  <span className="flex items-center gap-1 text-blue-700 font-medium">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{user.doctor.specialization}</span>
                  </span>
                )}
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authenticated (Session Active)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDb}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting DB...' : 'Reset & Re-seed SQLite DB'}</span>
            </button>
          </div>
        </div>

        {resetMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}
      </div>

      {/* Phase 2 Scoping Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
            P2
          </div>
          <div>
            <h3 className="text-base font-bold text-blue-950">
              Phase 2 Focus: Patient Module Live
            </h3>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              Per step-by-step instructions, <strong>Phase 2</strong> implements the complete Patient experience (Healthcare Journey Timeline, 14-Day Daily Health Recorder with Sleep & Stress Correlation, Medical Reports, Appointments, and Tasks for Alex Rivera).
            </p>
            <p className="text-xs text-blue-700 mt-1">
              To test the full Patient Module, please switch or log in as <strong>Alex Rivera (alex.rivera@example.com)</strong>. The dedicated Doctor Care Portal (Phase 3) and Hospital Admin Management (Phase 4) will be built upon your confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Database & Architecture Inspection Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm">SQLite Database State & Tables</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
            Synchronized
          </span>
        </div>

        {dbStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-400">Users</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{dbStatus.tables.users}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-400">Hospitals</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{dbStatus.tables.hospitals}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-400">Patients</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{dbStatus.tables.patients}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-400">Doctors</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{dbStatus.tables.doctors}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-400">Journey Events</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{dbStatus.tables.journeyEvents}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
