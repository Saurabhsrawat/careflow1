import React, { useState, useEffect } from 'react';
import { 
  HospitalAdminDashboardStats, 
  HospitalDoctor, 
  HospitalPatient, 
  HospitalAppointmentItem, 
  User 
} from '../../types';
import { HospitalDashboard } from './HospitalDashboard';
import { HospitalDoctorsList } from './HospitalDoctorsList';
import { HospitalPatientsList } from './HospitalPatientsList';
import { HospitalAppointments } from './HospitalAppointments';
import { HospitalSettings } from './HospitalSettings';
import { HospitalIsolationTester } from './HospitalIsolationTester';
import { 
  Building2, 
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  Calendar, 
  Settings, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  LogOut,
  Database,
  RotateCcw,
  Check
} from 'lucide-react';

interface HospitalAdminPortalProps {
  user: User;
  token: string | null;
  onLogout: () => void;
}

export type AdminTab = 'dashboard' | 'doctors' | 'patients' | 'appointments' | 'settings' | 'security';

export const HospitalAdminPortal: React.FC<HospitalAdminPortalProps> = ({
  user,
  token,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Data State
  const [dashboardData, setDashboardData] = useState<HospitalAdminDashboardStats | null>(null);
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([]);
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [appointments, setAppointments] = useState<HospitalAppointmentItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Database Reset State
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Load all admin data
  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Dashboard Stats
      const dashRes = await fetch('/api/hospitals/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!dashRes.ok) {
        const dErr = await dashRes.json();
        throw new Error(dErr.error || 'Failed to fetch dashboard data');
      }
      const dashJson = await dashRes.json();
      setDashboardData(dashJson);

      // 2. Fetch Doctors
      const docRes = await fetch('/api/hospitals/admin/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (docRes.ok) {
        const docJson = await docRes.json();
        setDoctors(docJson.doctors || []);
      }

      // 3. Fetch Patients
      const patRes = await fetch('/api/hospitals/admin/patients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (patRes.ok) {
        const patJson = await patRes.json();
        setPatients(patJson.patients || []);
      }

      // 4. Fetch Appointments
      const apptRes = await fetch('/api/hospitals/admin/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (apptRes.ok) {
        const apptJson = await apptRes.json();
        setAppointments(apptJson.appointments || []);
      }
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Handle Database Re-seed
  const handleResetDatabase = async () => {
    if (!window.confirm('Reset database to clean initial seeded records?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/hospitals/reset', { method: 'POST' });
      if (res.ok) {
        setResetSuccess(true);
        await fetchAllData();
        setTimeout(() => setResetSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error resetting database:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const hospitalName = dashboardData?.hospital?.name || 'St. Jude Medical Center';
  const hospitalId = dashboardData?.hospital?.id || user.hospital_id || 'hosp-stjude';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand & Facility Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight">CareFlow</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Hospital Admin
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {hospitalName}
                </div>
              </div>
            </div>

            {/* Quick Actions & User Profile */}
            <div className="flex items-center gap-3">
              {/* Reset Database Button */}
              <button
                onClick={handleResetDatabase}
                disabled={isResetting}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition"
                title="Reset database to initial seed state"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{resetSuccess ? 'Reset Done!' : 'Reset Demo DB'}</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200/80 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Isolation Verified</span>
              </button>

              {/* Admin Profile */}
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-400">Hospital Director</div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Operations Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'doctors'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctors ({doctors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('patients')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'patients'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Patients ({patients.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'appointments'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Appointments ({appointments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Hospital Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'security'
                  ? 'bg-emerald-100 text-emerald-800 font-extrabold shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Isolation Audit Suite</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{error}</span>
            </div>
            <button 
              onClick={fetchAllData}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <HospitalDashboard
            data={dashboardData}
            loading={loading}
            onNavigateTab={setActiveTab}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'doctors' && (
          <HospitalDoctorsList
            doctors={doctors}
            loading={loading}
            hospitalName={hospitalName}
            onRefresh={fetchAllData}
            token={token}
          />
        )}

        {activeTab === 'patients' && (
          <HospitalPatientsList
            patients={patients}
            doctors={doctors}
            loading={loading}
            hospitalName={hospitalName}
            token={token}
          />
        )}

        {activeTab === 'appointments' && (
          <HospitalAppointments
            appointments={appointments}
            doctors={doctors}
            loading={loading}
            hospitalName={hospitalName}
            onRefresh={fetchAllData}
            token={token}
          />
        )}

        {activeTab === 'settings' && (
          <HospitalSettings
            initialHospital={dashboardData?.hospital || null}
            onRefresh={fetchAllData}
            token={token}
          />
        )}

        {activeTab === 'security' && (
          <HospitalIsolationTester
            token={token}
            hospitalName={hospitalName}
            hospitalId={hospitalId}
          />
        )}
      </main>
    </div>
  );
};
