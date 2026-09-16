import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  Stethoscope, 
  Building2, 
  Info, 
  Sparkles, 
  RotateCw,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react';
import { Prescription } from '../../types';
import { authFetch } from '../../utils/api';

interface MedicationsManagerProps {
  onNavigateTab?: (tab: any) => void;
}

export const MedicationsManager: React.FC<MedicationsManagerProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patient/medications');
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
        setTodaySchedule(data.todaySchedule || []);
        setAdherenceData(data.adherence || null);
      }
    } catch (err) {
      console.error('Failed to load medications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleToggleDose = async (slot: string, currentStatus: string) => {
    const nextTaken = currentStatus !== 'taken';
    setTogglingSlot(slot);
    try {
      const res = await authFetch('/api/patient/medications/toggle-dose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: '2026-08-27',
          slot,
          taken: nextTaken,
        })
      });
      if (res.ok) {
        setFeedbackMsg(`Dose updated for ${slot} (${nextTaken ? 'Taken' : 'Pending'})`);
        setTimeout(() => setFeedbackMsg(null), 3000);
        await fetchMedications();
      }
    } catch (err) {
      console.error('Failed to toggle dose:', err);
    } finally {
      setTogglingSlot(null);
    }
  };

  const getSlotIcon = (slot: string) => {
    switch (slot) {
      case 'morning':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'afternoon':
        return <Sunset className="w-5 h-5 text-orange-500" />;
      case 'night':
        return <Moon className="w-5 h-5 text-indigo-500" />;
      default:
        return <Clock className="w-5 h-5 text-teal-600" />;
    }
  };

  if (loading && !adherenceData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading prescriptions and dose schedule...</p>
      </div>
    );
  }

  const adherencePercent = adherenceData?.overallPercent ?? 88;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Pill className="w-3.5 h-3.5" />
              <span>Prescription & Protocol Management</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Active Medications & Dosing Schedule</h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Track prescribed cardiology regimens, verify daily dose adherence across morning, afternoon, and evening intervals, and review clinical instructions.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-4 min-w-[220px]">
            <div className="w-14 h-14 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-black text-xl">
              {adherencePercent}%
            </div>
            <div>
              <div className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">14-Day Adherence</div>
              <div className="text-sm font-black text-white">7-Day Streak Active</div>
              <div className="text-[11px] text-slate-300 mt-0.5">High Clinical Compliance</div>
            </div>
          </div>
        </div>

        {feedbackMsg && (
          <div className="mt-4 p-2.5 bg-teal-500/20 border border-teal-400/40 rounded-lg text-teal-200 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-300" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* SECTION 1: TODAY'S DOSE SCHEDULE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Today's Dosing Schedule (Thursday, Aug 27, 2026)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click dose buttons to mark medication as taken or pending for today.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 self-start sm:self-center">
            {todaySchedule.filter(s => s.status === 'taken').length} of {todaySchedule.length} Doses Taken
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todaySchedule.map((slot) => {
            const isTaken = slot.status === 'taken';
            const isPending = slot.status === 'pending';
            const isToggling = togglingSlot === slot.slot;

            return (
              <div 
                key={slot.slot}
                className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-4 ${
                  isTaken 
                    ? 'bg-emerald-50/50 border-emerald-200/80 shadow-xs' 
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        {getSlotIcon(slot.slot)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 capitalize">{slot.slot} Dose</div>
                        <div className="text-[11px] text-slate-500 font-medium">{slot.timeLabel.split(' - ')[0]}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isTaken 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isTaken ? 'Taken ✓' : 'Due / Pending'}
                    </span>
                  </div>

                  <div className="border-t border-slate-200/60 pt-2">
                    <div className="text-xs font-bold text-slate-900">{slot.medicationName}</div>
                    <div className="text-[11px] font-semibold text-teal-700 mt-0.5">{slot.dosage}</div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{slot.instructions}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {slot.loggedAt ? `Logged at ${slot.loggedAt}` : 'Not logged yet'}
                  </span>

                  <button
                    id={`btn-toggle-dose-${slot.slot}`}
                    disabled={isToggling}
                    onClick={() => handleToggleDose(slot.slot, slot.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isTaken
                        ? 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50'
                        : 'bg-teal-600 text-white hover:bg-teal-700 shadow-xs'
                    }`}
                  >
                    {isToggling ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isTaken ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark Pending</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as Taken</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: CURRENT PRESCRIPTIONS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Current Prescriptions</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prescriptions authorized by your attending cardiology clinical team.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {prescriptions.length} Active Prescriptions
          </span>
        </div>

        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div 
              key={rx.id}
              className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-teal-300 transition-all space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-slate-900">{rx.name}</h3>
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                        {rx.dosage}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                        {rx.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 flex-wrap font-medium">
                      <span>Frequency: <strong className="text-slate-700">{rx.frequency}</strong></span>
                      <span>&bull;</span>
                      <span>Duration: <strong className="text-slate-700">{rx.duration}</strong></span>
                      <span>&bull;</span>
                      <span>Start Date: <strong className="text-slate-700">{rx.created_at || '2026-08-20'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-left md:text-right bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Prescribing Physician</div>
                  <div className="font-bold text-slate-800 flex items-center gap-1 md:justify-end">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    <span>{rx.doctor_name || 'Dr. Sarah Chen, MD'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{rx.hospital_name || 'St. Jude Medical Center'}</div>
                </div>
              </div>

              {/* Instructions Callout */}
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-bold">Clinical Instructions: </strong>
                  <span>{rx.instructions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: 14-DAY ADHERENCE HISTORY LOG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>14-Day Adherence Log & Dose History</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual dose completion records since treatment protocol initiation on August 20, 2026.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Taken
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Pending / Missed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Pre-protocol
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Protocol Phase</th>
                <th className="py-2.5 px-3 text-center">Morning Dose</th>
                <th className="py-2.5 px-3 text-center">Afternoon Regimen</th>
                <th className="py-2.5 px-3 text-center">Evening Protocol</th>
                <th className="py-2.5 px-3 text-center">Day Score</th>
                <th className="py-2.5 px-3">Clinical Journal Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adherenceData?.history?.map((row: any) => (
                <tr key={row.date} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {row.date === '2026-08-27' ? `${row.date} (Today)` : row.date}
                  </td>
                  <td className="py-2.5 px-3">
                    {row.isTreatmentDay ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        Treatment (Metoprolol)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Diagnostic Workup
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.isTreatmentDay ? (
                      row.morning ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Taken
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md text-[11px]">
                          <XCircle className="w-3 h-3" /> Missed
                        </span>
                      )
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.isTreatmentDay ? (
                      row.afternoon ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Taken
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md text-[11px]">
                          <XCircle className="w-3 h-3" /> Missed
                        </span>
                      )
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.isTreatmentDay ? (
                      row.night ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Taken
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          Pending
                        </span>
                      )
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    {row.isTreatmentDay ? (
                      <span className={`text-xs px-2 py-0.5 rounded-md ${
                        row.score === 100 ? 'text-emerald-700 bg-emerald-50' : row.score >= 66 ? 'text-teal-700 bg-teal-50' : 'text-amber-700 bg-amber-50'
                      }`}>
                        {row.score}%
                      </span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={row.notes}>
                    {row.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
