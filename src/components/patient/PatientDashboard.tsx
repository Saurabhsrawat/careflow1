import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Layers, 
  Calendar, 
  CheckSquare, 
  FileText, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Moon, 
  Pill, 
  Zap, 
  Plus, 
  Stethoscope, 
  Building2,
  ChevronRight,
  Droplet,
  Flame,
  History,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Task, Appointment, JourneyEvent, DailyHealthRecord, MedicalReport } from '../../types';

interface PatientDashboardProps {
  onNavigateTab: (tab: any) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [correlationData, setCorrelationData] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('careflow_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [dashRes, corrRes] = await Promise.all([
        fetch('/api/patient/dashboard', { headers, credentials: 'include' }),
        fetch('/api/patient/correlation-insights', { headers, credentials: 'include' })
      ]);

      if (dashRes.ok) {
        const ct = dashRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const data = await dashRes.json();
          setDashboardData(data);
        }
      }
      if (corrRes.ok) {
        const ct = corrRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const corr = await corrRes.json();
          setCorrelationData(corr);
        }
      }
    } catch (err) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const token = localStorage.getItem('careflow_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/patient/tasks/${task.id}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const activeJourney = dashboardData?.activeJourney || null;
  const currentJourney: JourneyEvent | null = dashboardData?.currentJourneyEvent || null;
  const upcomingAppt: Appointment | null = dashboardData?.upcomingAppointment || null;
  const tasks: Task[] = dashboardData?.tasks || [];
  const todayHealth: DailyHealthRecord | null = dashboardData?.todayHealth || null;
  const recentReports: MedicalReport[] = dashboardData?.recentReports || [];
  const adherencePercent: number = dashboardData?.medicationAdherencePercent ?? 88;
  const recentActivity: any[] = dashboardData?.recentActivity || [];

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const allEvents: JourneyEvent[] = dashboardData?.journeyEvents || [];
  const currentStageIndex = allEvents.findIndex(e => e.status === 'current');
  const progressPercent = allEvents.length > 0 && currentStageIndex !== -1 
    ? Math.round(((currentStageIndex + 1) / allEvents.length) * 100)
    : allEvents.length > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Welcome & Stage Status Banner */}
      {activeJourney ? (
        <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Glow backdrop */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Active Care Journey: {activeJourney.title}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome back, {user?.name || 'Alex Rivera'}
                </h1>
                <p className="text-slate-300 text-sm max-w-2xl">
                  {currentJourney ? (
                    <>You are currently in <strong className="text-teal-300">Stage: {currentJourney.stage}</strong> under the care of {currentJourney.doctor_name || 'Dr. Sarah Chen'} at {currentJourney.hospital_name || 'St. Jude Medical Center'}.</>
                  ) : (
                    <>Active care journey started on {activeJourney.start_date}.</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigateTab('care_history')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-4 h-4 text-teal-300" />
                  Care History
                </button>
                <button
                  onClick={() => onNavigateTab('health_recorder')}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-slate-950" />
                  Log Today's Vitals
                </button>
              </div>
            </div>

            {/* Journey Progress Bar */}
            <div className="bg-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-teal-300 font-bold">Current Milestone:</span>
                  <span className="text-white font-bold text-sm">
                    {currentJourney?.title || 'Initial Care Evaluation'}
                  </span>
                </div>
                <div className="text-slate-300">
                  Stage {currentStageIndex !== -1 ? currentStageIndex + 1 : allEvents.length} of {allEvents.length} ({progressPercent}% Completed)
                </div>
              </div>

              <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div 
                  className="bg-gradient-to-r from-emerald-400 via-teal-400 to-purple-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Single Active Journey Mode Active
                </span>
                <button
                  onClick={() => onNavigateTab('journey')}
                  className="text-teal-300 hover:text-teal-200 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  View Full Timeline <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Active Care Journey State */
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                No Active Care Journey
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome back, {user?.name || 'Alex Rivera'}
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl">
                You currently do not have an active care journey. All prior health episodes, reports, and treatments are safely preserved in your personal Care History archive.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('care_history')}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Start New Care Journey
              </button>
              <button
                onClick={() => onNavigateTab('care_history')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-4 h-4 text-teal-300" />
                View Care History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Immediate Next Action Callout */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Next Clinical Action</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {currentJourney?.next_step || (activeJourney ? 'Follow-up appointment on Sep 2nd, 2026' : 'Schedule a consultation or start a new journey if experiencing symptoms')}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {activeJourney ? (
                <>Keep logging your daily sleep, stress, and multi-dose vitals so your doctor can correlate your rhythm data with treatment adherence.</>
              ) : (
                <>Log your daily vitals to maintain your wellness baseline or review past resolved episodes in My Care History.</>
              )}
            </div>
          </div>
        </div>

        {activeJourney ? (
          <button
            onClick={() => onNavigateTab('journey')}
            className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={() => onNavigateTab('appointments')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl whitespace-nowrap shadow-xs cursor-pointer"
          >
            Book Appointment
          </button>
        )}
      </div>

      {/* Main Dashboard 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* 3. Today's Health Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h2 className="font-bold text-slate-900 text-base">Today's Health Snapshot</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('analytics')}
                  className="text-xs font-bold text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Analytics
                </button>
                <button
                  onClick={() => onNavigateTab('health_recorder')}
                  className="text-xs font-bold text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  {todayHealth ? 'Update Entry' : 'Log Entry'} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {todayHealth ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                    <div className="text-[11px] font-semibold text-indigo-800 flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-indigo-600" /> Sleep
                    </div>
                    <div className="text-lg font-bold text-slate-900">{todayHealth.sleep_hours} hrs</div>
                    <div className="text-[10px] text-slate-500 font-medium">{todayHealth.sleep_quality} Quality</div>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1">
                    <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-600" /> Stress
                    </div>
                    <div className="text-lg font-bold text-slate-900">{todayHealth.stress_level}/10</div>
                    <div className="text-[10px] text-slate-500 font-medium">{todayHealth.mood} Mood</div>
                  </div>

                  <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl space-y-1">
                    <div className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-teal-600" /> Hydration
                    </div>
                    <div className="text-lg font-bold text-slate-900">{todayHealth.water_intake} gls</div>
                    <div className="text-[10px] text-slate-500 font-medium">{todayHealth.exercise_minutes || 0}m activity</div>
                  </div>

                  <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1">
                    <div className="text-[11px] font-semibold text-purple-800 flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-purple-600" /> Metoprolol
                    </div>
                    <div className="text-lg font-bold text-purple-900">
                      {todayHealth.med_morning === 1 || todayHealth.medication_taken === 1 ? 'Taken ✓' : 'Pending'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">25mg Morning Dose</div>
                  </div>
                </div>

                {/* Multi-dose status bar */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-purple-600" /> Today's Doses:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      todayHealth.med_morning === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      Morning: {todayHealth.med_morning === 1 ? 'Taken' : 'Missed'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      todayHealth.med_afternoon === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      Afternoon: {todayHealth.med_afternoon === 1 ? 'Taken' : 'Pending'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      todayHealth.med_night === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      Night: {todayHealth.med_night === 1 ? 'Taken' : 'Pending'}
                    </span>
                  </div>
                </div>

                {todayHealth.symptoms && todayHealth.symptoms.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">Active Symptoms:</span>
                    {todayHealth.symptoms.map((s, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {s.name} ({s.severity}/10)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">No health vitals logged yet today</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Logging takes less than 60 seconds and builds valuable diagnostic patterns for your doctor.
                </p>
                <button
                  onClick={() => onNavigateTab('health_recorder')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Today's Entry
                </button>
              </div>
            )}
          </div>

          {/* 4. Medication Tracking With Adherence % Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Medication Tracking & Adherence</h3>
                  <p className="text-xs text-slate-500">Continuous compliance rate across active treatment period</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-purple-900 bg-purple-100 px-3 py-1 rounded-xl">
                  {adherencePercent}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-purple-900">Current Regimen</div>
                <div className="text-sm font-extrabold text-slate-900">Metoprolol 25mg ER</div>
                <div className="text-[11px] text-slate-500">1x Daily with morning meal</div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-emerald-900">Adherence Status</div>
                <div className="text-sm font-extrabold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> High Adherence
                </div>
                <div className="text-[11px] text-slate-500">Above 80% clinical threshold</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-slate-700">Dose Breakdown</div>
                <div className="text-sm font-bold text-slate-900">3 Doses Tracked/Day</div>
                <div className="text-[11px] text-slate-500">Morning, Afternoon, Night</div>
              </div>
            </div>

            {/* Adherence visual bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Treatment Adherence Goal (80%+)</span>
                <span className="font-bold text-purple-800">{adherencePercent}% achieved</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${adherencePercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs flex-wrap gap-2">
              <span className="text-slate-500">Prescription active since Aug 20, 2026</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigateTab('medications')}
                  className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  Manage Medications & Schedule <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateTab('analytics')}
                  className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  Compliance Chart <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Pending Tasks Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Action Checklist</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {pendingTasks.length} pending
                </span>
              </div>

              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {tasks.slice(0, 4).map((task) => {
                const isCompleted = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors border border-slate-200/60 select-none"
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded border-2 border-slate-300 hover:border-emerald-500 shrink-0 transition-colors" />
                      )}
                      <span className={`text-xs font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                      </span>
                    </div>

                    {task.due_date && (
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Recent Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Recent Activity Feed</h3>
              </div>
              <button
                onClick={() => onNavigateTab('timeline')}
                className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                View Full Timeline <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentActivity.map((act) => (
                <div key={act.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === 'vitals' && <Heart className="w-4 h-4 text-teal-600" />}
                    {act.type === 'treatment' && <Pill className="w-4 h-4 text-purple-600" />}
                    {act.type === 'report' && <FileText className="w-4 h-4 text-blue-600" />}
                    {act.type === 'consultation' && <Stethoscope className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{act.title}</span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(act.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column (Upcoming appointment & Quick actions) */}
        <div className="space-y-6">

          {/* Upcoming Appointment Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Next Consultation</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
                Upcoming
              </span>
            </div>

            {upcomingAppt ? (
              <div className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">
                      {new Date(upcomingAppt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                      {upcomingAppt.time}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-sm">
                    {upcomingAppt.purpose}
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-blue-200/60">
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                      <span>{upcomingAppt.doctor_name || 'Attending Physician'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{upcomingAppt.hospital_name || 'St. Jude Medical Center'} • Room 402</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('appointments')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors text-center"
                  >
                    View Details & Calendar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl text-slate-400 text-xs">
                No upcoming appointment scheduled.
              </div>
            )}
          </div>

          {/* 14-Day Correlation Insight Callout */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-teal-50 border border-purple-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Clinical Insight</div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Sleep & Stress Correlation
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  <strong className="text-purple-900">86% correlation</strong> between sleep deficit (&lt;6 hrs) and acute headache episodes. Metoprolol has stabilized palpitations.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between text-xs">
              <button
                onClick={() => onNavigateTab('analytics')}
                className="font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline"
              >
                Open Analytics Page <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Recent Diagnostic Reports */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Recent Reports</h3>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-bold text-purple-600 hover:text-purple-800"
              >
                View All ({recentReports.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {recentReports.slice(0, 3).map((rep) => (
                <div 
                  key={rep.id} 
                  onClick={() => onNavigateTab('reports')}
                  className="p-3 bg-slate-50 hover:bg-purple-50/50 rounded-xl border border-slate-200/60 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate pr-2">{rep.name}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                      {rep.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{new Date(rep.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-purple-700 font-semibold">{rep.journey_stage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('health_recorder')}
                className="p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/70 text-left transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4 text-teal-600 mb-1" />
                <div className="text-xs font-bold">Log Vitals</div>
                <div className="text-[10px] text-teal-700">Daily health journal</div>
              </button>

              <button
                onClick={() => onNavigateTab('analytics')}
                className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/70 text-left transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-purple-600 mb-1" />
                <div className="text-xs font-bold">Analytics</div>
                <div className="text-[10px] text-purple-700">7 Trend charts</div>
              </button>

              <button
                onClick={() => onNavigateTab('history')}
                className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/70 text-left transition-colors cursor-pointer"
              >
                <History className="w-4 h-4 text-indigo-600 mb-1" />
                <div className="text-xs font-bold">Raw History</div>
                <div className="text-[10px] text-indigo-700">Past day entries</div>
              </button>

              <button
                onClick={() => onNavigateTab('journey')}
                className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/70 text-left transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue-600 mb-1" />
                <div className="text-xs font-bold">Timeline</div>
                <div className="text-[10px] text-blue-700">8 Care stages</div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
