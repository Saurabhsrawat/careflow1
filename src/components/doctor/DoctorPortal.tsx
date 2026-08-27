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
  ChevronDown
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

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ initialPatientId }) => {
  const [activeTab, setActiveTab] = useState<DoctorTabType>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId || null);
  const [unreadCount, setUnreadCount] = useState<number>(2);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/doctor/notifications');
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
  };

  const handleBackToPatients = () => {
    setSelectedPatientId(null);
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'patients' as const, label: 'My Patients', icon: Users, badge: '3 Active' },
    { id: 'consultations' as const, label: 'Consultations', icon: ClipboardList, badge: 'Clinical Records' },
    { id: 'appointments' as const, label: 'Appointments', icon: Calendar, badge: '2 Today' },
    { id: 'analytics' as const, label: 'Health Analytics', icon: TrendingUp, badge: 'Correlations' },
    { id: 'tasks' as const, label: 'Patient Tasks', icon: CheckSquare, badge: null },
    { id: 'reports' as const, label: 'Diagnostic Reports', icon: FileText, badge: null },
    { id: 'ai_assistant' as const, label: 'AI Assistant', icon: Bot, badge: 'Preview' },
    { 
      id: 'notifications' as const, 
      label: 'Notifications', 
      icon: Bell, 
      badge: unreadCount > 0 ? `${unreadCount} New` : null,
      isAlert: unreadCount > 0 
    },
    { id: 'settings' as const, label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <div className="space-y-6">
      {/* Top Doctor Profile Bar */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-tight">Dr. Sarah Chen, MD</h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase tracking-wider">
                Cardiology Specialist
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Lic: MD-CA-98421
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>St. Jude Medical Center</span>
              </span>
              <span>&bull;</span>
              <span>Dept of Cardiovascular Medicine</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Physician Session</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 self-start md:self-center">
          {selectedPatientId && (
            <button
              onClick={handleBackToPatients}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedPatientId(null);
              setActiveTab('consultations');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Consultations</span>
          </button>
        </div>
      </div>

      {/* Navigation Bar / Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !selectedPatientId;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedPatientId(null);
                  setActiveTab(item.id);
                }}
                className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-bold ring-1 ring-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.isAlert
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isActive
                          ? 'bg-teal-500/30 text-teal-300 border border-teal-400/40'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {selectedPatientId && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white shadow-xs ml-auto">
              <User className="w-4 h-4" />
              <span>Active Patient Chart View</span>
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div>
        {selectedPatientId ? (
          <DoctorPatientDetail
            patientId={selectedPatientId}
            onBack={handleBackToPatients}
            onSelectPatient={handleSelectPatient}
          />
        ) : activeTab === 'dashboard' ? (
          <DoctorDashboard
            onSelectPatient={handleSelectPatient}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
            }}
          />
        ) : activeTab === 'patients' ? (
          <DoctorPatientList
            onSelectPatient={handleSelectPatient}
          />
        ) : activeTab === 'consultations' ? (
          <DoctorConsultations
            onSelectPatient={handleSelectPatient}
          />
        ) : activeTab === 'appointments' ? (
          <DoctorAppointments
            onSelectPatient={handleSelectPatient}
          />
        ) : activeTab === 'analytics' ? (
          <DoctorAnalyticsWrapper
            onSelectPatient={handleSelectPatient}
          />
        ) : activeTab === 'tasks' ? (
          <DoctorTasksList
            onSelectPatient={handleSelectPatient}
          />
        ) : activeTab === 'reports' ? (
          <DoctorReportsList
            onSelectPatient={handleSelectPatient}
          />
        ) : activeTab === 'ai_assistant' ? (
          <DoctorAiAssistant
            onSelectPatient={handleSelectPatient}
          />
        ) : activeTab === 'notifications' ? (
          <DoctorNotifications
            onSelectPatient={handleSelectPatient}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onRefreshBadge={fetchUnreadCount}
          />
        ) : activeTab === 'settings' ? (
          <DoctorSettings />
        ) : null}
      </div>
    </div>
  );
};
