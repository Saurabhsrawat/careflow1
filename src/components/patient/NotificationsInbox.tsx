import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Calendar, 
  Layers, 
  FileText, 
  CheckSquare, 
  Pill, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  Trash2,
  Sparkles,
  Info,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationsInboxProps {
  onNavigateTab?: (tab: any) => void;
  onRefreshBadge?: () => void;
}

export const NotificationsInbox: React.FC<NotificationsInboxProps> = ({ onNavigateTab, onRefreshBadge }) => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token = localStorage.getItem('careflow_token');
    const headers: Record<string, string> = { ...extra };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patient/notifications', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        if (onRefreshBadge) onRefreshBadge();
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      const res = await fetch(`/api/patient/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ is_read: !currentRead })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: !currentRead } : n));
        if (onRefreshBadge) onRefreshBadge();
      }
    } catch (err) {
      console.error('Failed to toggle notification read status:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/patient/notifications/mark-all-read', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        if (onRefreshBadge) onRefreshBadge();
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'journey':
        return <Layers className="w-5 h-5 text-teal-600" />;
      case 'report':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'task':
        return <CheckSquare className="w-5 h-5 text-amber-600" />;
      case 'reminder':
        return <Heart className="w-5 h-5 text-rose-600" />;
      case 'prescription':
        return <Pill className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredList = notifications.filter(n => filterMode === 'all' || !n.is_read);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" />
              <span>Direct Alerts & Care Updates</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Notifications & Care Inbox</h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Stay synchronized with Dr. Chen's care plans, diagnostic report uploads, appointment schedules, and daily telemetry reminders.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-black text-lg ${
              unreadCount > 0 
                ? 'bg-rose-500/20 border-rose-400/40 text-rose-300' 
                : 'bg-teal-500/20 border-teal-400/40 text-teal-300'
            }`}>
              {unreadCount}
            </div>
            <div>
              <div className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">Unread Alerts</div>
              <div className="text-sm font-bold text-white">{unreadCount > 0 ? `${unreadCount} Action Items` : 'All Caught Up'}</div>
              <div className="text-[11px] text-slate-300">Live Syncing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setFilterMode('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMode === 'unread'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Unread Only</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-black">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 hover:bg-teal-50 border border-teal-200 transition-all self-end sm:self-auto cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Checking notifications feed...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No notifications to display</p>
            <p className="text-xs text-slate-400">You're all caught up with your clinical care updates!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => {
              const isUnread = !item.is_read;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 ${
                    isUnread
                      ? 'bg-teal-50/40 border-teal-300/80 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                      isUnread ? 'bg-white border-teal-300 shadow-2xs' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {getNotificationIcon(item.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 inline-block animate-pulse" />
                        )}
                        <h3 className={`text-xs font-bold ${isUnread ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                          {item.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                          {item.type}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.created_at}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {item.action_tab && onNavigateTab && (
                      <button
                        onClick={() => {
                          if (isUnread) handleToggleRead(item.id, false);
                          onNavigateTab(item.action_tab);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-800 bg-teal-100 hover:bg-teal-200/80 border border-teal-300 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleRead(item.id, item.is_read)}
                      title={isUnread ? 'Mark as read' : 'Mark as unread'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {isUnread ? (
                        <Check className="w-4 h-4 text-teal-600" />
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 hover:text-slate-600">Unread</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
