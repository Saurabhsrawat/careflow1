import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  User, 
  Layers, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Heart, 
  ShieldCheck, 
  Building2, 
  Stethoscope, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Moon, 
  Activity, 
  Phone, 
  Sparkles,
  ChevronRight,
  Pill,
  Lock
} from 'lucide-react';
import { CaregiverPatientView } from '../../types';

interface LinkedPatientSummary {
  link_id: string;
  patient_id: string;
  can_view_journey: number;
  can_view_appointments: number;
  can_view_tasks: number;
  can_view_reports: number;
  can_view_daily_health: number;
  linked_at: string;
  current_stage: string;
  blood_group?: string;
  contact?: string;
  emergency_contact?: string;
  patient_name: string;
  patient_email: string;
  hospital_name?: string;
  doctor_name?: string;
  doctor_specialization?: string;
}

export const CaregiverPortal: React.FC = () => {
  const [patients, setPatients] = useState<LinkedPatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<CaregiverPatientView | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active category tab within selected patient (only from granted categories)
  const [activeCategory, setActiveCategory] = useState<string>('overview');

  const fetchPatientsList = async () => {
    try {
      setLoadingList(true);
      setError(null);
      const res = await fetch('/api/caregiver/patients');
      if (!res.ok) {
        throw new Error('Failed to load linked patients');
      }
      const data = await res.json();
      const list: LinkedPatientSummary[] = data.patients || [];
      setPatients(list);
      if (list.length > 0 && !selectedPatientId) {
        setSelectedPatientId(list[0].patient_id);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading caregiver dashboard');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchPatientData = async (patientId: string) => {
    try {
      setLoadingData(true);
      setError(null);
      const res = await fetch(`/api/caregiver/patients/${patientId}/data`);
      if (!res.ok) {
        throw new Error('Unable to access patient care data');
      }
      const data: CaregiverPatientView = await res.json();
      setPatientData(data);
    } catch (err: any) {
      setError(err.message || 'Error loading patient details');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  if (loadingList) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white mx-auto mb-3 animate-pulse">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Loading Caregiver Portal...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving authorized patient connections</p>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Linked Patients Connected Yet</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
            Ask the patient to link your email address from their CareFlow portal under the Caregiver / Access section to grant you supportive viewing access.
          </p>
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>How Caregiver Access Works:</span>
            </div>
            <div>1. Patient adds your registered email.</div>
            <div>2. Patient configures category toggles (Journey, Vitals, Appointments, etc.).</div>
            <div>3. Your dashboard automatically updates with authorized records.</div>
          </div>
        </div>
      </div>
    );
  }

  const currentPatientSummary = patients.find(p => p.patient_id === selectedPatientId) || patients[0];
  const permissions = patientData?.permissions || {
    can_view_journey: Boolean(currentPatientSummary.can_view_journey),
    can_view_appointments: Boolean(currentPatientSummary.can_view_appointments),
    can_view_tasks: Boolean(currentPatientSummary.can_view_tasks),
    can_view_reports: Boolean(currentPatientSummary.can_view_reports),
    can_view_daily_health: Boolean(currentPatientSummary.can_view_daily_health),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Caregiver Welcome Banner */}
      <div className="bg-linear-to-r from-amber-900 via-amber-800 to-stone-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Caregiver Portal (Support Role)</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Patient Support Dashboard</h1>
            <p className="text-amber-100/80 text-xs mt-1 max-w-2xl">
              Viewing authorized health trajectory, scheduled appointments, and daily wellness logs granted by your loved ones.
            </p>
          </div>

          {/* Patient Selector if multiple patients linked */}
          {patients.length > 1 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <label className="block text-[11px] font-bold text-amber-200 uppercase mb-1">
                Select Patient:
              </label>
              <select
                value={selectedPatientId || ''}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  setActiveCategory('overview');
                }}
                className="bg-white text-slate-900 text-xs font-semibold rounded-lg px-3 py-1.5 border-0 focus:ring-2 focus:ring-amber-400"
              >
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.patient_name} ({p.current_stage})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Patient Profile Card & Permissions Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
              {currentPatientSummary.patient_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{currentPatientSummary.patient_name}</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {currentPatientSummary.current_stage} Stage
                </span>
                {currentPatientSummary.blood_group && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Blood: {currentPatientSummary.blood_group}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                {currentPatientSummary.doctor_name && (
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    Doctor: <strong className="text-slate-700">{currentPatientSummary.doctor_name}</strong>
                  </span>
                )}
                {currentPatientSummary.hospital_name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentPatientSummary.hospital_name}</span>
                  </span>
                )}
                {currentPatientSummary.emergency_contact && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Emergency: {currentPatientSummary.emergency_contact}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Granular Permission Scope Indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Authorized Viewing Scope:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${permissions.can_view_journey ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-400 line-through'}`}>
                Journey
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${permissions.can_view_appointments ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-400 line-through'}`}>
                Appointments
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${permissions.can_view_daily_health ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-400 line-through'}`}>
                Daily Health
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${permissions.can_view_tasks ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-400 line-through'}`}>
                Tasks
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${permissions.can_view_reports ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-400 line-through'}`}>
                Reports
              </span>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar (Only Shows Granted Categories) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
          <button
            onClick={() => setActiveCategory('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'overview'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {permissions.can_view_journey && (
            <button
              onClick={() => setActiveCategory('journey')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'journey'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Care Journey</span>
            </button>
          )}

          {permissions.can_view_appointments && (
            <button
              onClick={() => setActiveCategory('appointments')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'appointments'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Appointments</span>
            </button>
          )}

          {permissions.can_view_daily_health && (
            <button
              onClick={() => setActiveCategory('daily_health')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'daily_health'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Daily Health & Vitals</span>
            </button>
          )}

          {permissions.can_view_tasks && (
            <button
              onClick={() => setActiveCategory('tasks')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'tasks'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Care Tasks</span>
            </button>
          )}

          {permissions.can_view_reports && (
            <button
              onClick={() => setActiveCategory('reports')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'reports'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Medical Reports</span>
            </button>
          )}
        </div>
      </div>

      {loadingData ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading permitted patient data...</p>
        </div>
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeCategory === 'overview' && (
            <div className="space-y-6">
              
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Current Stage</span>
                    <Layers className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2">
                    {currentPatientSummary.current_stage}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Active Care Plan Active</div>
                </div>

                {permissions.can_view_appointments ? (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Upcoming Visit</span>
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-slate-900 mt-2">
                      {patientData?.appointments?.[0] ? `${patientData.appointments[0].date}` : 'No upcoming'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {patientData?.appointments?.[0] ? `${patientData.appointments[0].time} with ${patientData.appointments[0].doctor_name}` : 'Schedule in sync'}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase">Appointments</span>
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-sm font-semibold text-slate-500 mt-2">Restricted</div>
                    <div className="text-[11px] text-slate-400 mt-1">Not granted by patient</div>
                  </div>
                )}

                {permissions.can_view_daily_health && patientData?.summaryStats ? (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Med Adherence</span>
                      <Pill className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600 mt-2">
                      {patientData.summaryStats.adherenceRate}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Active 14-day compliance</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase">Daily Vitals</span>
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-sm font-semibold text-slate-500 mt-2">Restricted</div>
                    <div className="text-[11px] text-slate-400 mt-1">Not granted by patient</div>
                  </div>
                )}

                {permissions.can_view_daily_health && patientData?.summaryStats ? (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Avg Sleep</span>
                      <Moon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-2">
                      {patientData.summaryStats.avgSleep} hrs
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Resting score normalized</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 uppercase">Sleep / Stress</span>
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-sm font-semibold text-slate-500 mt-2">Restricted</div>
                    <div className="text-[11px] text-slate-400 mt-1">Not granted by patient</div>
                  </div>
                )}
              </div>

              {/* Journey Highlights (if granted) */}
              {permissions.can_view_journey && patientData?.journeyEvents && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-600" />
                      <span>Care Journey Status</span>
                    </h3>
                    <span className="text-xs text-slate-500">{patientData.journeyEvents.length} Clinical Milestones</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patientData.journeyEvents.slice(0, 4).map((ev) => (
                      <div key={ev.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{ev.stage}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ev.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            ev.status === 'current' ? 'bg-teal-100 text-teal-800' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {ev.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700">{ev.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2">{ev.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps & Support Advisory */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <HeartHandshake className="w-4 h-4 text-amber-700" />
                  <span>Caregiver Support Summary</span>
                </div>
                <p className="leading-relaxed text-amber-900/90">
                  You are supporting <strong>{currentPatientSummary.patient_name}</strong> through the <strong>{currentPatientSummary.current_stage}</strong> stage of their healthcare journey. Permissions can be adjusted by the patient anytime from their profile settings.
                </p>
              </div>
            </div>
          )}

          {/* CARE JOURNEY TAB */}
          {activeCategory === 'journey' && permissions.can_view_journey && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Patient Care Journey</h3>
                  <p className="text-xs text-slate-500">Track end-to-end treatment milestones from symptoms to recovery</p>
                </div>
              </div>

              <div className="space-y-4">
                {patientData?.journeyEvents?.map((ev, idx) => (
                  <div 
                    key={ev.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      ev.status === 'current'
                        ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Stage {idx + 1}: {ev.stage}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ev.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            ev.status === 'current' ? 'bg-teal-100 text-teal-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ev.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">{ev.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                      </div>
                      <div className="text-[11px] text-slate-400 shrink-0 font-medium">{ev.date}</div>
                    </div>

                    {ev.next_step && (
                      <div className="mt-3 p-2.5 rounded-lg bg-teal-100/60 text-teal-900 text-xs font-medium flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span><strong>Next Step:</strong> {ev.next_step}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeCategory === 'appointments' && permissions.can_view_appointments && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Scheduled Appointments</h3>
                <p className="text-xs text-slate-500">Upcoming clinical consultations and imaging tests</p>
              </div>

              {(!patientData?.appointments || patientData.appointments.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No appointments scheduled.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientData.appointments.map(app => (
                    <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          {app.date} • {app.time}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.status === 'upcoming' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{app.purpose}</h4>
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.doctor_name || 'Attending Physician'} ({app.doctor_specialization || 'Clinic'})</span>
                      </div>
                      {app.hospital_name && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{app.hospital_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DAILY HEALTH & VITALS TAB */}
          {activeCategory === 'daily_health' && permissions.can_view_daily_health && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daily Health & Vitals Log</h3>
                <p className="text-xs text-slate-500">Continuous 14-day symptom, sleep, and medication records</p>
              </div>

              {(!patientData?.dailyHealth || patientData.dailyHealth.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No daily health records found.
                </div>
              ) : (
                <div className="space-y-3">
                  {patientData.dailyHealth.map(rec => (
                    <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{rec.date}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Sleep: {rec.sleep_hours}h ({rec.sleep_quality})
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.stress_level > 6 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Stress: {rec.stress_level}/10
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.medication_taken ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rec.medication_taken ? 'Meds Taken' : 'Missed Dose'}
                          </span>
                        </div>
                      </div>

                      {rec.notes && (
                        <p className="text-xs text-slate-600 italic">"{rec.notes}"</p>
                      )}

                      {rec.symptoms && rec.symptoms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {rec.symptoms.map((s: any, sIdx: number) => (
                            <span key={sIdx} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                              {s.name} ({s.severity}/10)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CARE TASKS TAB */}
          {activeCategory === 'tasks' && permissions.can_view_tasks && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Care Tasks & Regimens</h3>
                <p className="text-xs text-slate-500">Assigned pre-procedure instructions and lifestyle tasks</p>
              </div>

              {(!patientData?.tasks || patientData.tasks.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No active tasks.
                </div>
              ) : (
                <div className="space-y-2">
                  {patientData.tasks.map(t => (
                    <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          t.status === 'completed' ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300'
                        }`}>
                          {t.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-xs font-semibold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {t.title}
                        </span>
                      </div>
                      {t.due_date && (
                        <span className="text-[11px] text-slate-500 font-medium">Due: {t.due_date}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MEDICAL REPORTS TAB */}
          {activeCategory === 'reports' && permissions.can_view_reports && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Medical Reports</h3>
                <p className="text-xs text-slate-500">Diagnostic lab reports and imaging summaries</p>
              </div>

              {(!patientData?.reports || patientData.reports.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No medical reports uploaded.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientData.reports.map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{r.type}</span>
                        <span className="text-[11px] text-slate-500">{r.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{r.name}</h4>
                      <div className="text-[11px] text-slate-500">{r.hospital_name || 'Hospital Diagnostic Suite'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
