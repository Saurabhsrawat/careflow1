import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  CircleDot, 
  AlertTriangle, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  CheckSquare, 
  ArrowRight, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Stethoscope, 
  Layers,
  HeartPulse,
  Share2,
  Info
} from 'lucide-react';
import { JourneyEvent, JourneyStage } from '../../types';

interface JourneyTimelineProps {
  onStageSelect?: (stage: JourneyStage | string) => void;
}

interface StageDetailData {
  stage: JourneyStage;
  stageNumber: number;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming' | 'delayed';
  doctor_name: string;
  doctor_specialization?: string;
  hospital_name: string;
  hospital_address?: string;
  description: string;
  next_step: string;
  clinical_note?: string | null;
  doctor_plan?: string | null;
  clinical_follow_up?: string | null;
  reports?: any[];
  tasks?: any[];
}

const DEFAULT_STAGE_DETAILS: Record<JourneyStage, StageDetailData> = {
  'Symptoms': {
    stage: 'Symptoms',
    stageNumber: 1,
    title: 'Initial Episodic Palpitations & Tension Headaches',
    date: '2026-08-01',
    status: 'completed',
    doctor_name: 'Dr. Sarah Chen, MD',
    doctor_specialization: 'Cardiology & Electrophysiology',
    hospital_name: 'St. Jude Medical Center',
    hospital_address: '100 Mercy Way, Suite 400',
    description: 'Patient experienced recurring palpitations, chest flutter, and frontal headaches aggravated during intense project deadlines and irregular sleep.',
    next_step: 'Schedule cardiology consultation',
    clinical_note: 'Patient presented with 2-week history of sinus palpitations and tension headaches.',
    doctor_plan: 'Baseline clinical workup ordered. Advised sleep logging and reduced stimulant intake.',
    clinical_follow_up: '2026-08-06'
  },
  'Consultation': {
    stage: 'Consultation',
    stageNumber: 2,
    title: 'Cardiology Diagnostic Consultation',
    date: '2026-08-06',
    status: 'completed',
    doctor_name: 'Dr. Sarah Chen, MD',
    doctor_specialization: 'Cardiology & Electrophysiology',
    hospital_name: 'St. Jude Medical Center',
    hospital_address: '100 Mercy Way, Suite 400',
    description: 'Comprehensive in-clinic consultation with Dr. Sarah Chen. Resting BP 138/88 mmHg, resting pulse 94 bpm. Ordered 12-lead ECG, 48-hr ambulatory Holter monitor, and comprehensive blood panel.',
    next_step: 'Complete Holter monitor and echocardiogram',
    clinical_note: 'Physical exam: S1/S2 present, no murmurs. Resting tachycardia (94 bpm). Advised caffeine restriction.',
    doctor_plan: 'Ordered ambulatory telemetry and metabolic labs.',
    clinical_follow_up: '2026-08-15'
  },
  'Tests': {
    stage: 'Tests',
    stageNumber: 3,
    title: 'Holter Monitor & Cardiac Blood Panel Execution',
    date: '2026-08-12',
    status: 'completed',
    doctor_name: 'Dr. Sarah Chen, MD',
    doctor_specialization: 'Cardiology & Electrophysiology',
    hospital_name: 'St. Jude Medical Center',
    hospital_address: '100 Mercy Way, Suite 400',
    description: 'Diagnostic tests conducted at St. Jude Cardiac Lab. 48-hour continuous monitor worn and full metabolic panel drawn.',
    next_step: 'Review lab telemetry and confirm formal diagnosis',
    clinical_note: 'Lab specimens received and Holter telemetry uploaded without artifact.',
    doctor_plan: 'Awaiting pathology and telemetry report.',
    clinical_follow_up: '2026-08-15'
  },
  'Test Result': {
    stage: 'Test Result',
    stageNumber: 4,
    title: 'ECG & Cardiac Lab Diagnostics Uploaded',
    date: '2026-08-15',
    status: 'completed',
    doctor_name: 'Dr. Sarah Chen, MD',
    doctor_specialization: 'Cardiology & Electrophysiology',
    hospital_name: 'St. Jude Medical Center',
    hospital_address: '100 Mercy Way, Suite 400',
    description: 'Holter analysis demonstrated intermittent sinus tachycardia during midday and evening hours with isolated PACs. Normal cardiac ultrasound & ejection fraction (62%). Blood chemistry normal.',
    next_step: 'Doctor clinical review & diagnosis formulation',
    clinical_note: 'ECG indicates regular sinus rhythm with rate acceleration during stress triggers. No QT prolongation.',
    doctor_plan: 'Formulate autonomic stabilization regimen with beta-blocker protocol.',
    clinical_follow_up: '2026-08-18'
  },
  'Diagnosis': {
    stage: 'Diagnosis',
    stageNumber: 5,
    title: 'Diagnosis: Stress-Induced Sinus Tachycardia',
    date: '2026-08-18',
    status: 'completed',
    doctor_name: 'Dr. Sarah Chen, MD',
    doctor_specialization: 'Cardiology & Electrophysiology',
    hospital_name: 'St. Jude Medical Center',
    hospital_address: '100 Mercy Way, Suite 400',
    description: 'Formal clinical diagnosis established. Correlated with autonomic stress reactivity and sleep deprivation. No structural cardiomyopathy or ischemia detected.',
    next_step: 'Initiate tailored beta-blocker protocol & daily health logging',
    clinical_note: 'Diagnosis confirmed: Sinus Tachycardia Secondary to Autonomic Stress Reactivity. Patient reassured.',
    doctor_plan: 'Initiate low-dose Metoprolol 25mg ER and lifestyle sleep hygiene.',
    clinical_follow_up: '2026-08-20'
  },
  'Treatment': {
    stage: 'Treatment',
    stageNumber: 6,
    title: 'Metoprolol Protocol & Daily Health Logging',
    date: '2026-08-20',
    status: 'current',
    doctor_name: 'Dr. Sarah Chen, MD',
    doctor_specialization: 'Cardiology & Electrophysiology',
    hospital_name: 'St. Jude Medical Center',
    hospital_address: '100 Mercy Way, Suite 400',
    description: 'Prescribed low-dose Metoprolol Succinate 25mg daily. Initiated daily CareFlow tracking for sleep, hydration, and stress correlation.',
    next_step: 'Follow-up appointment on Sep 2nd, 2026 for 2-week response review',
    clinical_note: 'Patient started Metoprolol Succinate 25mg once daily. Instructed on daily logging in CareFlow portal.',
    doctor_plan: 'Assess symptom resolution, resting heart rate response, and sleep restoration at 2 weeks.',
    clinical_follow_up: '2026-09-02'
  },
  'Recovery': {
    stage: 'Recovery',
    stageNumber: 7,
    title: 'Holter Re-assessment & Cardiac Stabilization',
    date: '2026-09-10',
    status: 'upcoming',
    doctor_name: 'Dr. Sarah Chen, MD',
    doctor_specialization: 'Cardiology & Electrophysiology',
    hospital_name: 'St. Jude Medical Center',
    hospital_address: '100 Mercy Way, Suite 400',
    description: 'Scheduled 30-day rhythm check. Goal: Heart rate resting <75 bpm, zero palpitation episodes, and normalized sleep recovery scores.',
    next_step: 'Repeat 24-hr Holter patch if symptom score remains <2/10',
    clinical_note: 'Milestone target: Autonomic tone normalization and sustained resting rate stability.',
    doctor_plan: 'Evaluate telemetry re-assessment and gradual exercise tolerance.',
    clinical_follow_up: '2026-09-15'
  },
  'Follow-up': {
    stage: 'Follow-up',
    stageNumber: 8,
    title: 'Comprehensive 60-Day Progress & Discharge Review',
    date: '2026-09-25',
    status: 'upcoming',
    doctor_name: 'Dr. Sarah Chen, MD',
    doctor_specialization: 'Cardiology & Electrophysiology',
    hospital_name: 'St. Jude Medical Center',
    hospital_address: '100 Mercy Way, Suite 400',
    description: 'Final milestone evaluation with Dr. Sarah Chen to assess long-term dosage weaning or maintenance protocol.',
    next_step: 'Transition to maintenance phase with quarterly check-ins',
    clinical_note: 'Long-term cardiac stabilization and preventive wellness maintenance plan.',
    doctor_plan: 'Quarterly remote vitals check and annual cardiology review.',
    clinical_follow_up: '2026-12-01'
  }
};

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ onStageSelect }) => {
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStageDetail, setSelectedStageDetail] = useState<StageDetailData | null>(null);

  // New Event Form State
  const [newStage, setNewStage] = useState<JourneyStage>('Treatment');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNextStep, setNewNextStep] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token = localStorage.getItem('careflow_token');
    const headers: Record<string, string> = { ...extra };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchJourney = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patient/journey', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        // Auto-expand current or latest completed event
        const current = data.events?.find((e: any) => e.status === 'current');
        if (current) setExpandedEventId(current.id);
        else if (data.events?.length > 0) setExpandedEventId(data.events[data.events.length - 1].id);
      }
    } catch (err) {
      console.error('Failed to load journey events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, []);

  const handleOpenStageDetail = (stageName: JourneyStage | string) => {
    const defaultData = DEFAULT_STAGE_DETAILS[stageName as JourneyStage] || {
      stage: stageName as JourneyStage,
      stageNumber: 1,
      title: `${stageName} Stage Milestone`,
      date: '2026-08-20',
      status: 'upcoming',
      doctor_name: 'Dr. Sarah Chen, MD',
      doctor_specialization: 'Cardiology & Electrophysiology',
      hospital_name: 'St. Jude Medical Center',
      hospital_address: '100 Mercy Way, Suite 400',
      description: `Clinical details for the ${stageName} phase.`,
      next_step: 'Consult with care team for next steps.'
    };

    const matchingEvent = events.find(e => e.stage.toLowerCase() === stageName.toLowerCase());

    const mergedData: StageDetailData = {
      ...defaultData,
      ...(matchingEvent ? {
        title: matchingEvent.title || defaultData.title,
        date: matchingEvent.date || defaultData.date,
        status: (matchingEvent.status as any) || defaultData.status,
        doctor_name: matchingEvent.doctor_name || defaultData.doctor_name,
        doctor_specialization: matchingEvent.doctor_specialization || defaultData.doctor_specialization,
        hospital_name: matchingEvent.hospital_name || defaultData.hospital_name,
        description: matchingEvent.description || defaultData.description,
        next_step: matchingEvent.next_step || defaultData.next_step,
        clinical_note: matchingEvent.clinical_note || defaultData.clinical_note,
        doctor_plan: matchingEvent.doctor_plan || defaultData.doctor_plan,
        clinical_follow_up: matchingEvent.clinical_follow_up || defaultData.clinical_follow_up,
        reports: (matchingEvent as any).reports || [],
        tasks: (matchingEvent as any).tasks || []
      } : {})
    };

    setSelectedStageDetail(mergedData);
    if (matchingEvent) {
      setExpandedEventId(matchingEvent.id);
    }
    if (onStageSelect) {
      onStageSelect(stageName);
    }
  };

  const handleNavigateStageDetail = (direction: 'prev' | 'next') => {
    if (!selectedStageDetail) return;
    const stageOrder: JourneyStage[] = ['Symptoms', 'Consultation', 'Tests', 'Test Result', 'Diagnosis', 'Treatment', 'Recovery', 'Follow-up'];
    const currentIndex = stageOrder.indexOf(selectedStageDetail.stage);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' 
      ? (currentIndex + 1) % stageOrder.length 
      : (currentIndex - 1 + stageOrder.length) % stageOrder.length;

    handleOpenStageDetail(stageOrder[nextIndex]);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedEventId(prev => (prev === id ? null : id));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newStage) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/patient/journey', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          stage: newStage,
          title: newTitle,
          description: newDescription,
          date: newDate,
          status: 'upcoming',
          next_step: newNextStep
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewNextStep('');
        await fetchJourney();
      }
    } catch (err) {
      console.error('Failed to create journey milestone:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const allStages: { stage: JourneyStage; label: string; desc: string }[] = [
    { stage: 'Symptoms', label: '1. Symptoms', desc: 'Patient self-reported onset & triggers' },
    { stage: 'Consultation', label: '2. Consultation', desc: 'Cardiologist initial clinical assessment' },
    { stage: 'Tests', label: '3. Tests', desc: 'Holter telemetry & blood diagnostics' },
    { stage: 'Test Result', label: '4. Test Result', desc: 'Cardiac lab reports & findings' },
    { stage: 'Diagnosis', label: '5. Diagnosis', desc: 'Confirmed clinical diagnosis & etiology' },
    { stage: 'Treatment', label: '6. Treatment', desc: 'Active Metoprolol protocol & vitals' },
    { stage: 'Recovery', label: '7. Recovery', desc: '30-day rhythm stabilization goal' },
    { stage: 'Follow-up', label: '8. Follow-up', desc: 'Long-term maintenance & review' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'current':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Current Active Stage
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Upcoming Milestone
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Action Required
          </span>
        );
      default:
        return null;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500 bg-emerald-500 text-white';
      case 'current':
        return 'border-teal-500 bg-teal-600 text-white shadow-lg ring-4 ring-teal-100';
      case 'delayed':
        return 'border-amber-500 bg-amber-500 text-white';
      default:
        return 'border-slate-300 bg-white text-slate-400';
    }
  };

  const filteredEvents = filterStage === 'all' 
    ? events 
    : events.filter(e => e.stage.toLowerCase() === filterStage.toLowerCase());

  const currentStageIndex = events.findIndex(e => e.status === 'current');
  const progressPercent = events.length > 0 && currentStageIndex !== -1 
    ? Math.round(((currentStageIndex + 1) / events.length) * 100)
    : 75;

  return (
    <div className="space-y-6">
      {/* Header & Stage Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              Patient Care Journey
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Cardiology Healthcare Journey Timeline
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Follow your continuous healthcare path from initial symptoms to diagnostic tests, active treatment, and long-term recovery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Milestone Note
            </button>
          </div>
        </div>

        {/* 8-Stage Progress Stepper */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Overall Journey Progress:</span>
            <span className="text-teal-700 font-bold">Stage 6 of 8 ({progressPercent}% Completed)</span>
          </div>

          {/* Stepper Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Quick Stage Chips */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-2">
            {allStages.map((s, idx) => {
              const matchingEvent = events.find(e => e.stage.toLowerCase() === s.stage.toLowerCase());
              const isCompleted = matchingEvent?.status === 'completed';
              const isCurrent = matchingEvent?.status === 'current';

              return (
                <button
                  key={s.stage}
                  id={`btn-stage-${s.stage.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => handleOpenStageDetail(s.stage)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer hover:shadow-xs ${
                    isCurrent 
                      ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-200 hover:bg-teal-100' 
                      : isCompleted 
                      ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60' 
                      : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100 hover:bg-slate-100'
                  }`}
                  title={`Click to view details for ${s.stage}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">0{idx + 1}</span>
                    {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {isCurrent && <Sparkles className="w-3 h-3 text-teal-600 animate-spin" />}
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{s.stage}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-600" />
            Chronological Care Milestones
          </h3>
          <span className="text-xs text-slate-400">Click any stage to expand details & doctor notes</span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {events.map((event, index) => {
            const isExpanded = expandedEventId === event.id;
            const isCurrent = event.status === 'current';
            const isCompleted = event.status === 'completed';

            return (
              <div key={event.id} className="relative group">
                {/* Timeline node icon */}
                <div 
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${getStageColor(event.status)}`}
                >
                  {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  {isCurrent && <Sparkles className="w-4 h-4 animate-pulse" />}
                  {event.status === 'upcoming' && <CircleDot className="w-4 h-4 text-slate-300" />}
                  {event.status === 'delayed' && <AlertTriangle className="w-4 h-4" />}
                </div>

                {/* Event Card */}
                <div 
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isCurrent 
                      ? 'border-teal-300 bg-gradient-to-br from-teal-50/50 via-white to-purple-50/40 shadow-md ring-1 ring-teal-200' 
                      : isExpanded 
                      ? 'border-slate-300 bg-white shadow-sm' 
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div 
                    onClick={() => handleToggleExpand(event.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-2.5 py-0.5 rounded-md">
                          Stage {index + 1}: {event.stage}
                        </span>
                        {getStatusBadge(event.status)}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mt-1">
                        {event.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="text-xs text-slate-500 text-right hidden sm:block">
                        <div className="font-semibold text-slate-700">{event.doctor_name || 'Dr. Sarah Chen, MD'}</div>
                        <div className="text-slate-400">{event.hospital_name || 'St. Jude Medical Center'}</div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStageDetail(event.stage);
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        title={`Open complete details for ${event.stage}`}
                      >
                        <span>Stage Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleToggleExpand(event.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Body */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4 border-t border-slate-100">
                      {/* Clinical Description */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                          Clinical Assessment & Notes
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {event.description || 'Clinical observation recorded for this milestone.'}
                        </p>
                      </div>

                      {/* Doctor's Clinical Note & Plan (if added by Doctor) */}
                      {(event.clinical_note || event.doctor_plan) && (
                        <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-4 space-y-2">
                          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Stethoscope className="w-4 h-4 text-blue-600" />
                              Attending Doctor Clinical Note ({event.doctor_name || 'Dr. Sarah Chen, MD'})
                            </span>
                            {event.clinical_follow_up && (
                              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                Target Review: {event.clinical_follow_up}
                              </span>
                            )}
                          </div>
                          {event.clinical_note && (
                            <p className="text-xs text-blue-950 leading-relaxed font-medium">
                              {event.clinical_note}
                            </p>
                          )}
                          {event.doctor_plan && (
                            <div className="pt-2 border-t border-blue-200/70 text-xs text-blue-900">
                              <strong>Treatment Plan:</strong> {event.doctor_plan}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Next Clinical Action / Guidance */}
                      {event.next_step && (
                        <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 flex items-start gap-3">
                          <ArrowRight className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                              Next Recommended Step
                            </div>
                            <div className="text-sm font-semibold text-teal-950 mt-0.5">
                              {event.next_step}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Linked Diagnostic Reports (if any) */}
                      {(event as any).reports && (event as any).reports.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-purple-600" />
                            Linked Medical Reports ({ (event as any).reports.length })
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(event as any).reports.map((rep: any) => (
                              <div key={rep.id} className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                                <div className="font-semibold text-slate-800 truncate pr-2">{rep.name}</div>
                                <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded">
                                  {rep.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Linked Care Tasks */}
                      {(event as any).tasks && (event as any).tasks.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                            Required Stage Tasks ({ (event as any).tasks.length })
                          </div>
                          <div className="space-y-1.5">
                            {(event as any).tasks.map((tsk: any) => (
                              <div key={tsk.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                                <span className={tsk.status === 'completed' ? 'line-through text-slate-400 font-medium' : 'text-slate-800 font-semibold'}>
                                  {tsk.title}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  tsk.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {tsk.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Journey Milestone Note</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Journey Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as JourneyStage)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  {allStages.map(s => (
                    <option key={s.stage} value={s.stage}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Holter Patch Removal & Telemetry Upload"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Doctor</label>
                  <input
                    type="text"
                    disabled
                    value="Dr. Sarah Chen, MD"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes & Observations</label>
                <textarea
                  rows={3}
                  placeholder="Details on symptoms, medications taken, or clinical instructions..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Next Step Guidance</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule follow-up visit on Sep 02, 2026"
                  value={newNextStep}
                  onChange={(e) => setNewNextStep(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* STAGE DETAIL MODAL */}
      {selectedStageDetail && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setSelectedStageDetail(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-md">
                    Stage {selectedStageDetail.stageNumber} of 8: {selectedStageDetail.stage}
                  </span>
                  {getStatusBadge(selectedStageDetail.status)}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 pt-1">
                  {selectedStageDetail.title}
                </h3>
              </div>

              <button 
                onClick={() => setSelectedStageDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-lg font-bold cursor-pointer"
                aria-label="Close Details Modal"
              >
                ✕
              </button>
            </div>

            {/* Core Milestone Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Milestone Date</div>
                  <div className="text-sm font-bold text-slate-900">
                    {new Date(selectedStageDetail.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attending Doctor</div>
                  <div className="text-sm font-bold text-slate-900 truncate">{selectedStageDetail.doctor_name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{selectedStageDetail.doctor_specialization || 'Cardiology & Electrophysiology'}</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 sm:col-span-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hospital / Medical Center</div>
                  <div className="text-sm font-bold text-slate-900">{selectedStageDetail.hospital_name}</div>
                  <div className="text-xs text-slate-500">{selectedStageDetail.hospital_address}</div>
                </div>
              </div>
            </div>

            {/* Clinical Description */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                Clinical Description & Observations
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {selectedStageDetail.description}
              </p>
            </div>

            {/* Doctor Note & Plan Callout */}
            {(selectedStageDetail.clinical_note || selectedStageDetail.doctor_plan) && (
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    Doctor Clinical Assessment ({selectedStageDetail.doctor_name})
                  </span>
                  {selectedStageDetail.clinical_follow_up && (
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Follow-up: {selectedStageDetail.clinical_follow_up}
                    </span>
                  )}
                </div>
                {selectedStageDetail.clinical_note && (
                  <p className="text-xs text-blue-950 leading-relaxed font-medium">
                    {selectedStageDetail.clinical_note}
                  </p>
                )}
                {selectedStageDetail.doctor_plan && (
                  <div className="pt-2 border-t border-blue-200/80 text-xs text-blue-950">
                    <strong>Treatment Action Plan:</strong> {selectedStageDetail.doctor_plan}
                  </div>
                )}
              </div>
            )}

            {/* Next Recommended Step */}
            <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
              <ArrowRight className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  Next Recommended Step
                </div>
                <div className="text-sm font-semibold text-teal-950 mt-0.5">
                  {selectedStageDetail.next_step}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  type="button"
                  onClick={() => handleNavigateStageDetail('prev')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  &larr; Prev Stage
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigateStageDetail('next')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Next Stage &rarr;
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStageDetail(null)}
                className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
