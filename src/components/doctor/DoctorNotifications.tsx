import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  CheckSquare, 
  Heart, 
  Calendar, 
  Clock, 
  Trash2, 
  Filter, 
  ExternalLink, 
  ArrowRight,
  ShieldAlert,
  User,
  Pill,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface DoctorNotification {
  id: string;
  doctor_id: string;
  patient_id?: string;
  patient_name?: string;
  patient_stage?: string;
  title: string;
  message: string;
  type: 'report' | 'task' | 'health_log' | 'appointment' | 'alert' | 'adherence';
  severity: 'normal' | 'high' | 'critical';
  is_read: number | boolean;
  action_tab?: string;
  action_id?: string;
  created_at: string;
}

interface DoctorNotificationsProps {
  onSelectPatient: (patientId: string) => void;
  onNavigateTab?: (tab: any) => void;
  onRefreshBadge?: () => void;
}

export const DoctorNotifications: React.FC<DoctorNotificationsProps> = ({
  onSelectPatient,
  onNavigateTab,
  onRefreshBadge
}) => {
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch doctor notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleToggleRead = async (id: string, currentRead: boolean | number) => {
    try {
      const nextRead = !currentRead;
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: nextRead ? 1 : 0 } : n))
      );

      await fetch(`/api/doctor/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: nextRead })
      });

      if (onRefreshBadge) onRefreshBadge();
    } catch (err) {
      console.error('Failed to toggle notification status:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      await fetch('/api/doctor/notifications/mark-all-read', { method: 'POST' });
      if (onRefreshBadge) onRefreshBadge();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await fetch(`/api/doctor/notifications/${id}`, { method: 'DELETE' });
      if (onRefreshBadge) onRefreshBadge();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const isUnread = !n.is_read;
    const matchStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'unread' && isUnread) || 
      (filterStatus === 'read' && !isUnread);

    const matchType = filterType === 'all' || n.type === filterType;
    return matchStatus && matchType;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeBadge = (type: DoctorNotification['type'], severity: string) => {
    if (severity === 'high' || severity === 'critical' || type === 'alert') {
      return {
        label: 'Critical Alert',
        icon: ShieldAlert,
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        dot: 'bg-rose-600'
      };
    }
    switch (type) {
      case 'report':
        return {
          label: 'Report Upload',
          icon: FileText,
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          dot: 'bg-blue-600'
        };
      case 'task':
        return {
          label: 'Task Complete',
          icon: CheckSquare,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          dot: 'bg-emerald-600'
        };
      case 'health_log':
        return {
          label: 'Daily Health Log',
          icon: Heart,
          bg: 'bg-purple-50 border-purple-200 text-purple-700',
          dot: 'bg-purple-600'
        };
      case 'appointment':
        return {
          label: 'Appointment',
          icon: Calendar,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-600'
        };
      case 'adherence':
        return {
          label: 'Med Adherence',
          icon: Pill,
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          dot: 'bg-teal-600'
        };
      default:
        return {
          label: 'Update',
          icon: Bell,
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          dot: 'bg-slate-500'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4 text-teal-600" />
            <span>Clinical Feed & Alerts</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span>Doctor Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time feed of patient vital alerts, diagnostic uploads, completed care tasks, and scheduled clinic events.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchNotifications}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-teal-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilterStatus('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'unread'
                ? 'bg-teal-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilterStatus('read')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === 'read'
                ? 'bg-teal-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="alert">Critical Alerts</option>
            <option value="report">Diagnostic Reports</option>
            <option value="task">Patient Tasks</option>
            <option value="health_log">Daily Health Logs</option>
            <option value="appointment">Appointments</option>
            <option value="adherence">Medication Adherence</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 mt-3">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You're all caught up! There are no active notifications matching your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const isUnread = !n.is_read;
            const badge = getTypeBadge(n.type, n.severity);
            const Icon = badge.icon;

            return (
              <div
                key={n.id}
                className={`rounded-2xl border transition-all p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isUnread
                    ? 'bg-white border-teal-300 shadow-xs ring-1 ring-teal-100'
                    : 'bg-slate-50/60 border-slate-200 opacity-90'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Category Icon */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${badge.bg}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Notification Content */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>

                      {n.patient_name && (
                        <button
                          onClick={() => n.patient_id && onSelectPatient(n.patient_id)}
                          className="text-xs font-bold text-slate-900 hover:text-teal-700 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{n.patient_name}</span>
                        </button>
                      )}

                      <span className="text-[11px] text-slate-400 ml-auto sm:ml-0">
                        {n.created_at}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{n.message}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {n.patient_id && (
                    <button
                      onClick={() => onSelectPatient(n.patient_id!)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <span>Patient Chart</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleRead(n.id, n.is_read)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs"
                    title={isUnread ? 'Mark as Read' : 'Mark as Unread'}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isUnread ? 'text-slate-400' : 'text-teal-600'}`} />
                  </button>

                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
