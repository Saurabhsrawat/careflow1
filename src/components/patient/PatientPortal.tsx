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
  Flame,
  ChevronRight
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
import { HeartHandshake } from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'journey' | 'medications' | 'timeline' | 'health_recorder' | 
    'analytics' | 'history' | 'reports' | 'appointments' | 'tasks' | 
    'emergency_card' | 'access_requests' | 'notifications' | 'ai_summary' | 'caregivers'
  >('dashboard');

  const [unreadCount, setUnreadCount] = useState<number>(3);

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

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity, badge: null },
    { id: 'journey', label: 'Care Journey', icon: Layers, badge: 'Stage 6' },
    { id: 'medications', label: 'Medications', icon: Pill, badge: '88% Adherence' },
    { id: 'timeline', label: 'Timeline', icon: History, badge: 'Activity Feed' },
    { id: 'health_recorder', label: 'Daily Vitals Log', icon: Heart, badge: null },
    { id: 'analytics', label: 'Health Analytics', icon: TrendingUp, badge: '7 Charts' },
    { id: 'history', label: 'Daily History', icon: History, badge: '14 Days' },
    { id: 'reports', label: 'Medical Reports', icon: FileText, badge: '4 Files' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: '1 Upcoming' },
    { id: 'tasks', label: 'Care Tasks', icon: CheckSquare, badge: null },
    { id: 'caregivers', label: 'Caregivers', icon: HeartHandshake, badge: 'Family Access' },
    { id: 'emergency_card', label: 'Emergency Card', icon: AlertOctagon, badge: 'O+' },
    { id: 'access_requests', label: 'Access Requests', icon: Lock, badge: 'Privacy' },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell, 
      badge: unreadCount > 0 ? `${unreadCount} New` : null,
      isAlert: unreadCount > 0 
    },
    { id: 'ai_summary', label: 'AI Summary', icon: Bot, badge: 'Preview' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Patient Profile Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900">{user?.name || 'Alex Rivera'}</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider">
                Patient Portal
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                <Droplet className="w-3 h-3 text-rose-600 fill-rose-600" />
                <span>Blood Group: O+</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                Attending: <strong className="text-slate-700">Dr. Sarah Chen, MD</strong> (Cardiology)
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>St. Jude Medical Center</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <button
            onClick={() => setActiveTab('emergency_card')}
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Emergency Card</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              unreadCount > 0
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-btn-${item.id}`}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.isAlert ? 'text-rose-500' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : item.isAlert 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-slate-100 text-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'dashboard' && (
          <PatientDashboard onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'journey' && (
          <JourneyTimeline onStageSelect={(stage) => console.log('Selected stage:', stage)} />
        )}
        {activeTab === 'medications' && (
          <MedicationsManager onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'timeline' && (
          <PatientTimeline onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'health_recorder' && (
          <DailyHealthRecorder 
            onNavigateTab={(tab) => setActiveTab(tab)} 
            onRecordSaved={() => {
              fetchUnreadCount();
            }}
          />
        )}
        {activeTab === 'analytics' && (
          <HealthAnalytics onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'history' && (
          <HealthHistory onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'reports' && (
          <MedicalReportsList />
        )}
        {activeTab === 'appointments' && (
          <AppointmentsManager />
        )}
        {activeTab === 'tasks' && (
          <TasksChecklist />
        )}
        {activeTab === 'caregivers' && (
          <CaregiverManager onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'emergency_card' && (
          <EmergencyCard onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'access_requests' && (
          <AccessRequests onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'notifications' && (
          <NotificationsInbox 
            onNavigateTab={(tab) => setActiveTab(tab)} 
            onRefreshBadge={fetchUnreadCount}
          />
        )}
        {activeTab === 'ai_summary' && (
          <AiHealthSummary onNavigateTab={(tab) => setActiveTab(tab)} />
        )}
      </div>
    </div>
  );
};
