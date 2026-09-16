import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Moon, 
  Flame, 
  Pill, 
  Calendar, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ArrowUpRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { HealthSummarySynthesis } from '../../types';
import { authFetch } from '../../utils/api';

interface AiHealthSummaryProps {
  onNavigateTab?: (tab: any) => void;
}

export const AiHealthSummary: React.FC<AiHealthSummaryProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<HealthSummarySynthesis | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patient/ai-summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load AI summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading || !summary) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Synthesizing clinical health trajectory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clinical Health Synthesis Engine</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Your Comprehensive Health Summary</h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              An intelligent synthesis of your 14-day telemetry logs, doctor care plans, medication adherence streaks, and diagnostic findings.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-4 min-w-[220px]">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-black text-lg">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Analysis Engine</div>
              <div className="text-sm font-bold text-white">Live Clinical Model</div>
              <div className="text-[11px] text-slate-300">{summary.generatedDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* PROMINENT AI COMING SOON BADGE / BANNER */}
      <div className="bg-indigo-50/70 border-2 border-indigo-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
          <Bot className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xs font-black uppercase tracking-wider text-indigo-950">
              AI-Enhanced Real-Time Summaries Coming Soon
            </h2>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900 uppercase">
              Preview Mode • Calculated from Live Data
            </span>
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed">
            While conversational AI and natural language summaries are rolling out in the next CareFlow release, this page currently presents a live, deterministic synthesis computed directly from your electronic health records, 14-day vitals journal, and cardiology telemetry.
          </p>
        </div>
      </div>

      {/* CORE SUMMARY CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
        {/* Title & Stage */}
        <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              {summary.currentStage}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              {summary.currentDiagnosis}
            </h2>
          </div>

          <div className="text-left md:text-right">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Primary Diagnosis Code</div>
            <div className="text-sm font-bold text-slate-800">ICD-10 I47.1 (Sinus Tachycardia)</div>
          </div>
        </div>

        {/* 1. SYMPTOM TRAJECTORY & RECOVERY */}
        <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider">Symptom Trajectory & Treatment Response</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white uppercase">
              87.5% Severity Reduction
            </span>
          </div>

          <p className="text-xs text-emerald-950 leading-relaxed">
            {summary.symptomTrajectory.summary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <div className="text-[11px] font-bold text-slate-500">Palpitations Frequency / Severity</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">{summary.symptomTrajectory.palpitationsChange}</div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-200">
              <div className="text-[11px] font-bold text-slate-500">Headache / Tension Trend</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">{summary.symptomTrajectory.headacheChange}</div>
            </div>
          </div>
        </div>

        {/* 2. 14-DAY VITALS AGGREGATES */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-teal-600" />
            <span>14-Day Vitals & Biomarker Averages</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Avg Sleep</span>
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">{summary.vitalsAverages.avgSleep} hrs</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">&uarr; Reached 8.0h Target</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Avg Stress</span>
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">{summary.vitalsAverages.avgStress} / 10</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">&darr; Dropped to 2/10</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                <span>Daily Exercise</span>
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">{summary.vitalsAverages.avgExercise} mins</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">Aerobic Walking</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                <span>Adherence</span>
              </div>
              <div className="text-xl font-black text-teal-700 mt-1">{summary.adherenceRate}%</div>
              <div className="text-[10px] text-teal-700 font-bold mt-0.5">7-Day Streak Active</div>
            </div>
          </div>
        </div>

        {/* 3. KEY CLINICAL FINDINGS & CORRELATIONS */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span>Key Clinical Telemetry Observations</span>
          </h3>

          <div className="space-y-2">
            {summary.clinicalFindings.map((finding, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>{finding}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. UPCOMING MILESTONE & CLINICAL DIRECTIVES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Upcoming Appointment */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
            <div className="text-[10px] font-extrabold uppercase text-blue-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Next Clinical Review</span>
            </div>
            <div className="text-sm font-black text-slate-900">
              {summary.upcomingAppointment.date} at {summary.upcomingAppointment.time}
            </div>
            <div className="text-xs text-slate-700">{summary.upcomingAppointment.doctor}</div>
            <p className="text-[11px] text-slate-500">{summary.upcomingAppointment.purpose}</p>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('appointments')}
                className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View Appointment Schedule</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Recommended Directives */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="text-[10px] font-extrabold uppercase text-teal-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Patient Directives</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {summary.recommendedActions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">&bull;</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
