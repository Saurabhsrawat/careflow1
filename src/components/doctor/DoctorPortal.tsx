import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Stethoscope, 
  Building2, 
  User, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  ClipboardList,
  Bot,
  Bell,
  Settings,
  TrendingUp,
  FileText,
  CheckSquare,
  Sparkles,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Activity
} from 'lucide-react';
import { DoctorDashboard } from './DoctorDashboard';
import { DoctorPatientList } from './DoctorPatientList';
import { DoctorPatientDetail } from './DoctorPatientDetail';
import { DoctorAppointments } from './DoctorAppointments';
import { DoctorConsultations } from './DoctorConsultations';
import { DoctorAiAssistant } from './DoctorAiAssistant';
import { DoctorNotifications } from './DoctorNotifications';
import { DoctorSettings } from './DoctorSettings';
import { DoctorReportsList } from './DoctorReportsList';
import { DoctorTasksList } from './DoctorTasksList';
import { DoctorAnalyticsWrapper } from './DoctorAnalyticsWrapper';
import { authFetch } from '../../utils/api';

export type DoctorTabType = 
  | 'dashboard'
  | 'patients'
  | 'consultations'
  | 'appointments'
  | 'analytics'
  | 'tasks'
  | 'reports'
  | 'ai_assistant'
  | 'notifications'
  | 'settings';

interface DoctorPortalProps {
  initialPatientId?: string | null;
}

interface NavItem {
  id: DoctorTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
  isAlert?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ initialPatientId }) => {
  const [activeTab, setActiveTab] = useState<DoctorTabType>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId || null);
  const [unreadCount, setUnreadCount] = useState<number>(2);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await authFetch('/api/doctor/notifications');
      if (res.ok) {
        const data = await res.json();
        const unread = (data.notifications || []).filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to fetch doctor notification badge count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setMobileMenuOpen(false);
  };

  const handleBackToPatients = () => {
    setSelectedPatientId(null);
  };

  const handleSelectTab = (tab: DoctorTabType) => {
    setSelectedPatientId(null);
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Clinical Care',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'patients', label: 'My Patients', icon: Users, badge: '3 Active' },
        { id: 'consultations', label: 'Consultations', icon: ClipboardList, badge: 'Clinical Records' },
        { id: 'appointments', label: 'Appointments', icon: Calendar, badge: '2 Today' },
      ]
    },
    {
      title: 'Clinical Intelligence',
      items: [
        { id: 'analytics', label: 'Health Analytics', icon: TrendingUp, badge: 'Correlations' },
        { id: 'tasks', label: 'Patient Tasks', icon: CheckSquare, badge: null },
        { id: 'reports', label: 'Diagnostic Reports', icon: FileText, badge: null },
        { id: 'ai_assistant', label: 'AI Assistant', icon: Bot, badge: 'Clinical AI' },
      ]
    },
    {
      title: 'Communication & Settings',
      items: [
        { 
          id: 'notifications', 
          label: 'Notifications', 
          icon: Bell, 
          badge: unreadCount > 0 ? `${unreadCount} New` : null,
          isAlert: unreadCount > 0 
        },
        { id: 'settings', label: 'Settings', icon: Settings, badge: null },
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
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {selectedPatientId ? <User className="w-5 h-5" /> : <ActiveIcon className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Doctor Portal</div>
            <div className="text-sm font-bold text-slate-900">
              {selectedPatientId ? 'Patient Chart Overview' : activeItem.label}
            </div>
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
          
          {/* Doctor Profile Card & Collapse Toggle */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              {!collapsed ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-sm font-bold text-white truncate">Dr. Sarah Chen, MD</h2>
                    </div>
                    <div className="text-[11px] text-blue-300 font-semibold mt-0.5 flex items-center gap-1">
                      <span className="truncate">Cardiology Specialist</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">St. Jude Medical</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-1.5 py-1">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm" title="Dr. Sarah Chen, MD">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    MD
                  </span>
                </div>
              )}

              {/* Sidebar Collapse/Expand Button (Desktop) */}
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition items-center justify-center cursor-pointer ml-auto"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar to icon-only mode"}
              >
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            {/* Selected Patient Banner in Sidebar if active */}
            {selectedPatientId && !collapsed && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-teal-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Viewing Patient Chart</span>
                </span>
                <button
                  onClick={handleBackToPatients}
                  className="text-[10px] font-bold px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                >
                  Exit Chart
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
                    const isActive = activeTab === item.id && !selectedPatientId;

                    return (
                      <button
                        key={item.id}
                        id={`doctor-sidebar-item-${item.id}`}
                        onClick={() => handleSelectTab(item.id)}
                        title={item.label}
                        className={`w-full flex items-center ${
                          collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                        } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-500/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <Icon className={`w-4 h-4 ${
                              isActive 
                                ? 'text-white' 
                                : item.isAlert 
                                  ? 'text-rose-500' 
                                  : 'text-slate-500'
                            }`} />
                            {collapsed && item.badge && (
                              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-blue-400 ring-1 ring-white" />
                            )}
                          </div>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!collapsed && item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
                              isActive
                                ? 'bg-white/20 text-white border border-white/20'
                                : item.isAlert
                                  ? 'bg-rose-500 text-white font-black animate-pulse'
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
          {selectedPatientId ? (
            <DoctorPatientDetail
              patientId={selectedPatientId}
              onBack={handleBackToPatients}
              onSelectPatient={handleSelectPatient}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DoctorDashboard
                  onSelectPatient={handleSelectPatient}
                  onNavigateTab={(tab) => handleSelectTab(tab)}
                />
              )}

              {activeTab === 'patients' && (
                <DoctorPatientList
                  onSelectPatient={handleSelectPatient}
                />
              )}

              {activeTab === 'consultations' && (
                <DoctorConsultations
                  onSelectPatient={handleSelectPatient}
                />
              )}

              {activeTab === 'appointments' && (
                <DoctorAppointments
                  onSelectPatient={handleSelectPatient}
                />
              )}

              {activeTab === 'analytics' && (
                <DoctorAnalyticsWrapper
                  onSelectPatient={handleSelectPatient}
                />
              )}

              {activeTab === 'tasks' && (
                <DoctorTasksList
                  onSelectPatient={handleSelectPatient}
                />
              )}

              {activeTab === 'reports' && (
                <DoctorReportsList
                  onSelectPatient={handleSelectPatient}
                />
              )}

              {activeTab === 'ai_assistant' && (
                <DoctorAiAssistant
                  onSelectPatient={handleSelectPatient}
                />
              )}

              {activeTab === 'notifications' && (
                <DoctorNotifications
                  onSelectPatient={handleSelectPatient}
                  onNavigateTab={(tab) => handleSelectTab(tab)}
                  onRefreshBadge={fetchUnreadCount}
                />
              )}

              {activeTab === 'settings' && (
                <DoctorSettings />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

