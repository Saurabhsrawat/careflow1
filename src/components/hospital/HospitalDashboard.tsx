import React from 'react';
import { HospitalAdminDashboardStats } from '../../types';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Activity, 
  Layers, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  CalendarCheck,
  ShieldCheck
} from 'lucide-react';

interface HospitalDashboardProps {
  data: HospitalAdminDashboardStats | null;
  loading: boolean;
  onNavigateTab: (tab: 'doctors' | 'patients' | 'appointments' | 'settings' | 'security') => void;
  onRefresh: () => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  data,
  loading,
  onNavigateTab,
  onRefresh
}) => {
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl"></div>
          <div className="h-72 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { hospital, stats, todayAppointments, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Facility Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>Administrative Operations Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>{hospital.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {hospital.address}
              </span>
              {hospital.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  {hospital.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Hospital Data Isolated (Server Enforced)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('doctors')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Manage Doctors</span>
            </button>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition border border-white/15 inline-flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Hospital Schedule</span>
            </button>
          </div>
        </div>

        {/* Department Badges */}
        {hospital.departments && hospital.departments.length > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400 mr-2">Departments:</span>
            {hospital.departments.map((dept, idx) => (
              <span 
                key={idx}
                className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-xs text-slate-200"
              >
                {dept}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hospital KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div 
          onClick={() => onNavigateTab('doctors')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Doctors</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalDoctors}</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {stats.activeDoctors} active
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Staff roster</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('patients')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Enrolled Patients</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalPatients}</span>
            <span className="text-xs text-slate-500">affiliated</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Administrative view</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('appointments')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Today's Visits</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.todayAppointments}</span>
            <span className="text-xs text-slate-500">on Aug 27</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Clinic schedule</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('appointments')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Visits</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.pendingAppointments}</span>
            <span className="text-xs text-slate-500">upcoming</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Oversight</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('patients')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Journeys</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.activeJourneys}</span>
            <span className="text-xs text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">in progress</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Treatment tracking</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Today's Appointments & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments at this Hospital */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Today's Clinic Consultations</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled across all doctors at {hospital.name} (Aug 27, 2026)
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('appointments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View Full Schedule</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 my-4">
                <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No consultations scheduled today</p>
                <p className="text-xs text-slate-400 mt-1">All appointments for this hospital will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {todayAppointments.map((appt) => (
                  <div 
                    key={appt.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-colors bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-700 shrink-0">
                        <Clock className="w-3.5 h-3.5 mb-0.5" />
                        <span className="text-xs font-bold">{appt.time.split(' ')[0]}</span>
                        <span className="text-[9px] uppercase font-semibold text-indigo-500">{appt.time.split(' ')[1]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{appt.patient_name}</h3>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            appt.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appt.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">{appt.purpose}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                          <Stethoscope className="w-3 h-3 text-slate-400" />
                          <span>Attending: <strong className="text-slate-700 font-semibold">{appt.doctor_name}</strong> ({appt.doctor_specialization})</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center sm:self-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        onClick={() => onNavigateTab('appointments')}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      >
                        Manage / Reassign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing real-time appointments scoped to {hospital.name}</span>
            <button 
              onClick={onRefresh}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Scoped Recent Activity Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Facility Activity Stream</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                Live Feed
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl text-xs text-slate-400">
                No recent activity logged for this facility.
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentActivity.map((act, index) => (
                  <div key={index} className="flex items-start gap-3 text-xs">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      act.type === 'appointment_booked'
                        ? 'bg-blue-100 text-blue-700'
                        : act.type === 'journey_event'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {act.type === 'appointment_booked' && <Calendar className="w-3 h-3" />}
                      {act.type === 'journey_event' && <Layers className="w-3 h-3" />}
                      {act.type === 'patient_registered' && <UserCheck className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 leading-tight truncate">{act.title}</p>
                      <p className="text-slate-500 mt-0.5 line-clamp-2">{act.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {act.timestamp ? new Date(act.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('security')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Verify Security & Data Isolation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
