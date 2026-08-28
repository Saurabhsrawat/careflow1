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
  Check,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface HospitalAdminPortalProps {
  user: User;
  token: string | null;
  onLogout: () => void;
}

export type AdminTab = 'dashboard' | 'doctors' | 'patients' | 'appointments' | 'settings' | 'security';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
  isSpecial?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const HospitalAdminPortal: React.FC<HospitalAdminPortalProps> = ({
  user,
  token,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  
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

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Facility Operations',
      items: [
        { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'doctors', label: 'Manage Doctors', icon: Stethoscope, badge: `${doctors.length}` },
        { id: 'patients', label: 'Manage Patients', icon: Users, badge: `${patients.length}` },
        { id: 'appointments', label: 'Appointment Oversight', icon: Calendar, badge: `${appointments.length}` },
      ]
    },
    {
      title: 'Administration & Security',
      items: [
        { id: 'security', label: 'Isolation Audit Suite', icon: ShieldCheck, badge: 'HIPAA', isSpecial: true },
        { id: 'settings', label: 'Hospital Settings', icon: Settings, badge: null },
      ]
    }
  ];

  const allItems: NavItem[] = navGroups.flatMap(g => g.items);
  const activeItem: NavItem = allItems.find(item => item.id === activeTab) || allItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Mobile Top Navigation & Active View Header */}
      <div className="lg:hidden mb-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            <ActiveIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hospital Admin</div>
            <div className="text-sm font-bold text-slate-900">{activeItem.label}</div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{mobileMenuOpen ? 'Close Menu' : 'Browse Sections'}</span>
        </button>
      </div>

      {/* Main Single-Page-App Layout Container */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Persistent Left Sidebar */}
        <aside 
          className={`w-full shrink-0 transition-all duration-200 space-y-4 ${
            mobileMenuOpen ? 'block' : 'hidden lg:block'
          } ${collapsed ? 'lg:w-20' : 'lg:w-64 xl:w-72'}`}
        >
          
          {/* Admin & Facility Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              {!collapsed ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-sm font-bold text-slate-900 truncate">{user.name}</h2>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        Director
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-700 font-semibold mt-0.5 truncate">
                      {hospitalName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      Facility: {hospitalId}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-1.5 py-1">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm" title={`${user.name} - ${hospitalName}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                    Admin
                  </span>
                </div>
              )}

              {/* Sidebar Collapse/Expand Button (Desktop) */}
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition items-center justify-center cursor-pointer ml-auto"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar to icon-only mode"}
              >
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Reset & Audit Buttons */}
            {!collapsed ? (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <button
                  onClick={handleResetDatabase}
                  disabled={isResetting}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                  title="Reset database to clean initial seed data"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{resetSuccess ? 'Reset Done!' : 'Reset Demo Database'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-1 border-t border-slate-100 flex flex-col items-center">
                <button
                  onClick={handleResetDatabase}
                  disabled={isResetting}
                  title="Reset Demo DB"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                >
                  <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Items List */}
          <nav className="bg-white rounded-2xl border border-slate-200 shadow-xs p-2 space-y-3">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {!collapsed ? (
                  <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {group.title}
                  </div>
                ) : (
                  groupIdx > 0 && <div className="border-t border-slate-100 my-2" />
                )}
                
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        id={`hospital-sidebar-item-${item.id}`}
                        onClick={() => handleSelectTab(item.id)}
                        title={item.label}
                        className={`w-full flex items-center ${
                          collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                        } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? item.isSpecial
                              ? 'bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-500/30'
                              : 'bg-indigo-600 text-white font-bold shadow-xs ring-1 ring-indigo-500/30'
                            : item.isSpecial
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <Icon className={`w-4 h-4 ${
                              isActive 
                                ? 'text-white' 
                                : item.isSpecial 
                                  ? 'text-emerald-600' 
                                  : 'text-slate-500'
                            }`} />
                            {collapsed && item.badge && (
                              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-indigo-400 ring-1 ring-white" />
                            )}
                          </div>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!collapsed && item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
                              isActive
                                ? 'bg-white/20 text-white border border-white/20'
                                : item.isSpecial
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area: Only ONE Section Visible at a Time */}
        <main className="flex-1 min-w-0 w-full">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{error}</span>
              </div>
              <button 
                onClick={fetchAllData}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-xs font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <HospitalDashboard
              data={dashboardData}
              loading={loading}
              onNavigateTab={(tab) => handleSelectTab(tab)}
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
    </div>
  );
};

