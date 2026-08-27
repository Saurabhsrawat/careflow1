import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DatabaseStatus } from '../types';
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  HeartPulse, 
  ShieldCheck, 
  Stethoscope, 
  User, 
  Database, 
  Layers, 
  Sparkles, 
  FileText,
  AlertTriangle,
  Building2,
  Calendar
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { quickLogin } = useAuth();
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  useEffect(() => {
    fetch('/api/hospitals/status')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch((err) => console.error('Failed to query DB status:', err));
  }, []);

  const journeyStages = [
    { name: 'Symptoms', status: 'completed', desc: 'Initial palpitations logged' },
    { name: 'Consultation', status: 'completed', desc: 'Dr. Chen in-clinic ECG' },
    { name: 'Tests', status: 'completed', desc: 'Holter & Echo completed' },
    { name: 'Diagnosis', status: 'completed', desc: 'Sinus tachycardia confirmed' },
    { name: 'Treatment', status: 'current', desc: 'Care protocol & Daily log' },
    { name: 'Recovery', status: 'upcoming', desc: 'Symptom stabilization' },
    { name: 'Follow-up', status: 'upcoming', desc: 'Cardiology review on Sep 2' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-teal-50/60 via-slate-50/40 to-white pt-10 pb-12 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/70 text-teal-800 border border-teal-200/80">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Patient-Centric Care Coordination System</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Transform Fragmented Medical Data into a Unified <span className="text-teal-700">Healthcare Journey</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              CareFlow bridges hospital visits with chronological care progression and daily patient health logging — 
              empowering patients, doctors, and hospital administrators with seamless, role-isolated context.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                id="landing-signin-btn"
                onClick={() => onOpenAuth('login')}
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
              >
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="landing-register-btn"
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-2xs transition-all"
              >
                Create New Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 1-Click Interactive Demo Testing Panel */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                Phase 1 Ready for Review
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Instant Demo Account Access</h2>
              <p className="text-xs text-slate-500">Test the 3 foundational roles immediately with pre-configured credentials and isolated scopes.</p>
            </div>

            {dbStatus && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Database className="w-4 h-4 text-teal-600" />
                <span>SQLite DB Active: {dbStatus.tables.users} Users, {dbStatus.tables.hospitals} Hospitals</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Role 1: Patient */}
            <div className="bg-emerald-50/40 rounded-xl p-5 border border-emerald-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Role 1
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Patient Demo</h3>
                <p className="text-xs text-slate-600 mt-1">Alex Rivera (Assigned to St. Jude Medical Center & Dr. Sarah Chen)</p>
                
                <div className="mt-3 space-y-1 text-xs text-slate-500 bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-slate-700">alex.rivera@example.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Password:</span>
                    <span className="font-mono text-slate-700">password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scope:</span>
                    <span className="text-emerald-700 font-medium">Own data only</span>
                  </div>
                </div>
              </div>

              <button
                id="demo-login-patient"
                onClick={() => quickLogin('alex.rivera@example.com')}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Login as Patient</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Role 2: Doctor */}
            <div className="bg-blue-50/40 rounded-xl p-5 border border-blue-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Role 2
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Doctor Demo</h3>
                <p className="text-xs text-slate-600 mt-1">Dr. Sarah Chen, MD (Cardiology & Internal Medicine, St. Jude)</p>

                <div className="mt-3 space-y-1 text-xs text-slate-500 bg-white/80 p-2.5 rounded-lg border border-blue-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-slate-700">dr.chen@stjude.org</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Password:</span>
                    <span className="font-mono text-slate-700">password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scope:</span>
                    <span className="text-blue-700 font-medium">Assigned patients at St. Jude</span>
                  </div>
                </div>
              </div>

              <button
                id="demo-login-doctor"
                onClick={() => quickLogin('dr.chen@stjude.org')}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Login as Doctor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Role 3: Hospital Admin */}
            <div className="bg-purple-50/40 rounded-xl p-5 border border-purple-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Role 3
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Hospital Admin Demo</h3>
                <p className="text-xs text-slate-600 mt-1">Elena Rostova (Lead Administrator, St. Jude Medical Center)</p>

                <div className="mt-3 space-y-1 text-xs text-slate-500 bg-white/80 p-2.5 rounded-lg border border-purple-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-slate-700">admin@stjude.org</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Password:</span>
                    <span className="font-mono text-slate-700">password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scope:</span>
                    <span className="text-purple-700 font-medium">St. Jude data only</span>
                  </div>
                </div>
              </div>

              <button
                id="demo-login-admin"
                onClick={() => quickLogin('admin@stjude.org')}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Login as Hospital Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Core CareFlow Architecture</h2>
          <p className="text-xs text-slate-500 mt-1">
            Built strictly according to the phase roadmap: simple, reliable, and role-enforced.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Healthcare Journey Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1. Chronological Healthcare Journey</h3>
                <p className="text-xs text-slate-500">7 standard progression stages from Symptoms to Follow-up</p>
              </div>
            </div>

            {/* Visual stage stepper preview */}
            <div className="space-y-2 pt-2">
              {journeyStages.map((st, idx) => (
                <div key={st.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-400 w-4">{idx + 1}.</span>
                    <span className="font-semibold text-slate-800">{st.name}</span>
                    <span className="text-slate-500 hidden sm:inline text-[11px]">— {st.desc}</span>
                  </div>
                  <div>
                    {st.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                    {st.status === 'current' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        <Clock className="w-3 h-3" /> Current Stage
                      </span>
                    )}
                    {st.status === 'upcoming' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 2: Daily Health Recorder */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">2. Between-Visit Daily Health Logs</h3>
                  <p className="text-xs text-slate-500">Unlocks correlations doctors miss</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Patients log daily recovery markers between clinical consultations:
              </p>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Sleep & Quality</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Hours rested + sleep grade</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Stress & Mood</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">1-10 intensity score</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Activity & Hydration</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Exercise min + water intake</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Symptom Severity</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Specific symptoms (1-10)</div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Clinical Insight:</span> Allows doctors in Phase 3 to correlate symptom spikes with sleep deficit and medication adherence.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
