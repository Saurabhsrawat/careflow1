import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  Heart, 
  FileText, 
  Calendar, 
  CheckSquare, 
  User, 
  Building2, 
  Stethoscope, 
  ShieldCheck, 
  TrendingUp,
  Sparkles,
  Phone,
  Droplet,
  History,
  Pill,
  AlertOctagon,
  Lock,
  Bell,
  Bot,
  Settings,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PatientDashboard } from './PatientDashboard';
import { JourneyTimeline } from './JourneyTimeline';
import { DailyHealthRecorder } from './DailyHealthRecorder';
import { HealthAnalytics } from './HealthAnalytics';
import { HealthHistory } from './HealthHistory';
import { MedicalReportsList } from './MedicalReportsList';
import { AppointmentsManager } from './AppointmentsManager';
import { TasksChecklist } from './TasksChecklist';
import { MedicationsManager } from './MedicationsManager';
import { PatientTimeline } from './PatientTimeline';
import { EmergencyCard } from './EmergencyCard';
import { AccessRequests } from './AccessRequests';
import { NotificationsInbox } from './NotificationsInbox';
import { AiHealthSummary } from './AiHealthSummary';
import { CaregiverManager } from './CaregiverManager';
import { PatientSettings } from './PatientSettings';
import { CareHistory } from './CareHistory';

export type PatientTabType =
  | 'dashboard'
  | 'journey'
  | 'care_history'
  | 'health_recorder'
  | 'analytics'
  | 'history'
  | 'appointments'
  | 'medications'
  | 'reports'
  | 'tasks'
  | 'caregivers'
  | 'ai_summary'
  | 'timeline'
  | 'emergency_card'
  | 'access_requests'
  | 'notifications'
  | 'settings';

interface NavItem {
  id: PatientTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string | null;
  isAlert?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PatientTabType>('dashboard');
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('careflow_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/patient/notifications', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread notifications count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const navGroups: NavGroup[] = [
    {
      title: 'Overview & Vitals',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'journey', label: 'Care Journey', icon: Layers, badge: 'Stage 6' },
        { id: 'care_history', label: 'My Care History', icon: History, badge: 'Episodes' },
        { id: 'health_recorder', label: 'Daily Vitals Log', icon: Heart, badge: 'Daily' },
        { id: 'analytics', label: 'Health Analytics', icon: TrendingUp, badge: '7 Trends' },
        { id: 'history', label: 'Daily History', icon: History, badge: '14 Days' },
      ]
    },
    {
      title: 'Care Coordination',
      items: [
        { id: 'appointments', label: 'Appointments', icon: Calendar, badge: '1 Upcoming' },
        { id: 'medications', label: 'Medications', icon: Pill, badge: '88% Adh.' },
        { id: 'reports', label: 'Medical Reports', icon: FileText, badge: '4 Files' },
        { id: 'tasks', label: 'Care Tasks', icon: CheckSquare, badge: null },
        { id: 'caregivers', label: 'Caregivers', icon: HeartHandshake, badge: 'Family' },
      ]
    },
    {
      title: 'Intelligence & Safety',
      items: [
        { id: 'ai_summary', label: 'AI Health Summary', icon: Bot, badge: 'AI' },
        { id: 'timeline', label: 'Timeline Feed', icon: History, badge: null },
        { id: 'emergency_card', label: 'Emergency Card', icon: AlertOctagon, badge: 'O+' },
        { id: 'access_requests', label: 'Access Requests', icon: Lock, badge: 'HIPAA' },
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

  const handleSelectTab = (tab: PatientTabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Mobile Top Navigation & Active View Header */}
      <div className="lg:hidden mb-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
            <ActiveIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Patient Portal</div>
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
          
          {/* Patient Profile Card & Collapse Toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              {!collapsed ? (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Alex Rivera'}</h2>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-0.5">
                        <Droplet className="w-2.5 h-2.5 fill-rose-600 text-rose-600" />
                        <span>O+</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate">Dr. Sarah Chen</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-1.5 py-1">
                  <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm" title={user?.name || 'Patient'}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded-full bg-rose-100 text-rose-800 flex items-center gap-0.5">
                    O+
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

            {/* Quick Action Buttons (expanded mode) */}
            {!collapsed ? (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  id="btn-quick-emergency"
                  onClick={() => handleSelectTab('emergency_card')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activeTab === 'emergency_card'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Emergency</span>
                </button>

                <button
                  id="btn-quick-alerts"
                  onClick={() => handleSelectTab('notifications')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    activeTab === 'notifications'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : unreadCount > 0
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Alerts</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => handleSelectTab('emergency_card')}
                  title="Emergency Card"
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                    activeTab === 'emergency_card' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSelectTab('notifications')}
                  title={`Notifications (${unreadCount} unread)`}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors relative cursor-pointer ${
                    activeTab === 'notifications' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Bell className="w-4 h-4 text-amber-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white animate-pulse" />
                  )}
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
                        id={`sidebar-item-${item.id}`}
                        onClick={() => handleSelectTab(item.id)}
                        title={item.label}
                        className={`w-full flex items-center ${
                          collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                        } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-teal-600 text-white font-bold shadow-xs ring-1 ring-teal-500/30'
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
                              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-teal-400 ring-1 ring-white" />
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
          {activeTab === 'dashboard' && (
            <PatientDashboard onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'journey' && (
            <JourneyTimeline 
              onStageSelect={(stage) => console.log('Selected stage:', stage)}
              onNavigateTab={(tab) => handleSelectTab(tab)}
            />
          )}

          {activeTab === 'care_history' && (
            <CareHistory onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'health_recorder' && (
            <DailyHealthRecorder 
              onNavigateTab={(tab) => handleSelectTab(tab)} 
              onRecordSaved={() => {
                fetchUnreadCount();
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <HealthAnalytics onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'history' && (
            <HealthHistory onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsManager />
          )}

          {activeTab === 'medications' && (
            <MedicationsManager onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'reports' && (
            <MedicalReportsList />
          )}

          {activeTab === 'tasks' && (
            <TasksChecklist />
          )}

          {activeTab === 'caregivers' && (
            <CaregiverManager onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'ai_summary' && (
            <AiHealthSummary onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'timeline' && (
            <PatientTimeline onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'emergency_card' && (
            <EmergencyCard onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'access_requests' && (
            <AccessRequests onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsInbox 
              onNavigateTab={(tab) => handleSelectTab(tab)} 
              onRefreshBadge={fetchUnreadCount}
            />
          )}

          {activeTab === 'settings' && (
            <PatientSettings onNavigateTab={(tab) => handleSelectTab(tab)} />
          )}
        </main>
      </div>
    </div>
  );
};

