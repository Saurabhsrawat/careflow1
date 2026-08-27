import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  ChevronRight, 
  CheckCircle2, 
  Stethoscope, 
  Sparkles, 
  Heart, 
  Moon, 
  Pill,
  ArrowRight,
  RefreshCw,
  Building2
} from 'lucide-react';
import { DoctorPatientSummary, PatientAlert } from '../../types';

interface DoctorDashboardProps {
  onSelectPatient: (patientId: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'patients' | 'appointments') => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onSelectPatient, onNavigateTab }) => {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignedPatients, setAssignedPatients] = useState<DoctorPatientSummary[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, patRes] = await Promise.all([
        fetch('/api/doctor/dashboard'),
        fetch('/api/doctor/patients')
      ]);

      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboardData(data);
      }

      if (patRes.ok) {
        const patData = await patRes.json();
        setAssignedPatients(patData.patients || []);
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-sm font-semibold text-slate-700">Loading Cardiology Clinical Dashboard...</div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    todayAppointmentsCount: 2,
    activePatientsCount: 3,
    pendingReviewsCount: 1,
    newReportsCount: 4,
    patientAlertsCount: 2
  };

  const todayAppointments = dashboardData?.todayAppointments || [];
  const alerts: PatientAlert[] = dashboardData?.alerts || [];
  const activeAlerts = alerts.filter(a => a.severity !== 'low');

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Doctor Meta */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-7 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/30 text-blue-100 text-xs font-semibold border border-blue-400/30 backdrop-blur-xs">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Cardiology & Internal Medicine Clinical Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Doctor Command Center &mdash; Dr. Sarah Chen, MD
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 opacity-80" />
              St. Jude Medical Center
            </span>
            <span>&bull;</span>
            <span>License: MD-CA-98421</span>
            <span>&bull;</span>
            <span className="font-mono text-blue-200">Date: August 27, 2026</span>
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/20 self-start md:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Stat 1: Today's Appointments */}
        <div 
          onClick={() => onNavigateTab('appointments')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Today's Appts</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.todayAppointmentsCount}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
            <span>Scheduled Today</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Stat 2: Active Patients */}
        <div 
          onClick={() => onNavigateTab('patients')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Active Patients</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.activePatientsCount}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
            <span>St. Jude Cohort</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Stat 3: Pending Reviews */}
        <div 
          onClick={() => onNavigateTab('patients')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Pending Reviews</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.pendingReviewsCount}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
            <span>Tests / Diagnosis</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Stat 4: New Reports */}
        <div 
          onClick={() => onSelectPatient('pat-alex-rivera')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>New Reports</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.newReportsCount}
          </div>
          <div className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
            <span>Diagnostic Files</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Stat 5: Patient Alerts */}
        <div 
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Patient Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.patientAlertsCount}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold">
            {stats.patientAlertsCount > 0 ? 'Threshold flags active' : 'All parameters nominal'}
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Appointments & Clinical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Appointments Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Today's Appointments & Consultations (Aug 27, 2026)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any patient to navigate directly into their comprehensive clinical record and timeline.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              View Full Schedule &rarr;
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No appointments scheduled for today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="py-3 px-3.5">Time</th>
                    <th className="py-3 px-3.5">Patient</th>
                    <th className="py-3 px-3">Journey Stage</th>
                    <th className="py-3 px-3.5">Consultation Purpose</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayAppointments.map((appt: any) => (
                    <tr 
                      key={appt.id}
                      onClick={() => onSelectPatient(appt.patient_id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {appt.time}
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {appt.patient_name}
                        </div>
                        <div className="text-[10px] text-slate-400">{appt.patient_email}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          {appt.patient_stage || 'Treatment'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 text-slate-700 font-medium">
                        {appt.purpose}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {appt.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(appt.patient_id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <span>Open Profile</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Deterministic Patient Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Clinical Threshold Alerts
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                {activeAlerts.length} Actionable
              </span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {activeAlerts.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All assigned patient vitals and journal logs are within normal thresholds.</span>
                </div>
              ) : (
                activeAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => onSelectPatient(alt.patient_id)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${alt.severity === 'high' ? 'text-rose-600' : 'text-amber-600'}`} />
                        <span>{alt.patient_name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                        alt.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alt.severity}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-800">{alt.title}</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {alt.message}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60">
                      <span>Log date: {alt.date}</span>
                      <span className="font-bold text-blue-600">Review Patient &rarr;</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
            <strong>Clinical Note:</strong> Alerts calculate daily shift variations in sleep, stress, and symptom intensity deterministically without probabilistic hallucination.
          </div>
        </div>
      </div>

      {/* Assigned Patients Quick Cohort Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Assigned Cardiology Patient Cohort
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients currently under active medical supervision by Dr. Sarah Chen.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('patients')}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            View All Patients &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assignedPatients.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectPatient(p.id)}
              className="p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      {p.name}
                    </h4>
                    <div className="text-[11px] text-slate-500">
                      {p.age} yrs &bull; Blood: <strong>{p.blood_group || 'O+'}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                    {p.current_stage}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200/80">
                    <div className="text-[10px] text-slate-400">Sleep</div>
                    <div className="font-bold text-slate-800">{p.avg_sleep}h</div>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200/80">
                    <div className="text-[10px] text-slate-400">Stress</div>
                    <div className="font-bold text-slate-800">{p.avg_stress}/10</div>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200/80">
                    <div className="text-[10px] text-slate-400">Adherence</div>
                    <div className="font-bold text-emerald-700">{p.adherence_percent}%</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Next: {p.next_appointment?.date || 'TBD'}</span>
                <span className="font-bold text-blue-600 flex items-center gap-0.5">
                  Open Chart &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
