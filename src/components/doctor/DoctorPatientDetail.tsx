import React, { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  Calendar, 
  FileText, 
  CheckSquare, 
  TrendingUp, 
  AlertCircle, 
  ArrowLeft, 
  Clock, 
  Pill, 
  Plus, 
  Stethoscope, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  GitCompare, 
  Droplet, 
  Moon, 
  ShieldAlert, 
  ArrowRight,
  ExternalLink,
  ClipboardList,
  Edit3,
  BrainCircuit,
  MessageSquare,
  Phone,
  Mail,
  Shield,
  Info
} from 'lucide-react';
import { DoctorCrossAnalytics } from './DoctorCrossAnalytics';
import { DoctorHealthAnalytics } from './DoctorHealthAnalytics';
import { authFetch } from '../../utils/api';

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
  onSelectPatient?: (id: string) => void;
}

type TabType = 
  | 'overview' 
  | 'journey' 
  | 'analytics' 
  | 'daily_health' 
  | 'reports' 
  | 'prescriptions' 
  | 'clinical_notes' 
  | 'tasks' 
  | 'appointments' 
  | 'ai_insights';

export const DoctorPatientDetail: React.FC<PatientDetailProps> = ({ patientId, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [patientData, setPatientData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | '90d'>('14d');

  // Modals state
  const [showAddJourneyModal, setShowAddJourneyModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showAddPrescriptionModal, setShowAddPrescriptionModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddApptModal, setShowAddApptModal] = useState(false);
  const [selectedJourneyEventForNote, setSelectedJourneyEventForNote] = useState<any | null>(null);

  // Form states
  const [journeyForm, setJourneyForm] = useState({
    stage: 'Treatment',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'current',
    next_step: '',
    clinical_note: '',
    doctor_plan: '',
    clinical_follow_up: ''
  });

  const [noteForm, setNoteForm] = useState({
    title: '',
    note: '',
    plan: '',
    follow_up_date: ''
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily (morning)',
    duration: '30 days',
    instructions: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    related_journey_event_id: ''
  });

  const [apptForm, setApptForm] = useState({
    date: '2026-09-02',
    time: '10:00 AM',
    purpose: 'Cardiology Treatment Follow-up',
    notes: ''
  });

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/doctor/patients/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientData(data);
      }
    } catch (err) {
      console.error('Failed to load patient chart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const handleAddJourneyEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/api/doctor/patients/${patientId}/journey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journeyForm)
      });
      if (res.ok) {
        setShowAddJourneyModal(false);
        setJourneyForm({
          stage: 'Treatment',
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          status: 'current',
          next_step: '',
          clinical_note: '',
          doctor_plan: '',
          clinical_follow_up: ''
        });
        await fetchPatientDetails();
      }
    } catch (err) {
      console.error('Error adding journey event:', err);
    }
  };

  const handleAddClinicalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedJourneyEventForNote) {
        // Add note to specific journey event
        const res = await authFetch(`/api/doctor/patients/${patientId}/journey/${selectedJourneyEventForNote.id}/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinical_note: noteForm.note,
            doctor_plan: noteForm.plan,
            clinical_follow_up: noteForm.follow_up_date
          })
        });
        if (res.ok) {
          setShowAddNoteModal(false);
          setSelectedJourneyEventForNote(null);
          setNoteForm({ title: '', note: '', plan: '', follow_up_date: '' });
          await fetchPatientDetails();
        }
      } else {
        // Add general clinical note
        const res = await authFetch(`/api/doctor/patients/${patientId}/clinical-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteForm)
        });
        if (res.ok) {
          setShowAddNoteModal(false);
          setNoteForm({ title: '', note: '', plan: '', follow_up_date: '' });
          await fetchPatientDetails();
        }
      }
    } catch (err) {
      console.error('Error adding clinical note:', err);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/api/doctor/patients/${patientId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionForm)
      });
      if (res.ok) {
        setShowAddPrescriptionModal(false);
        setPrescriptionForm({
          name: '',
          dosage: '',
          frequency: 'Once daily (morning)',
          duration: '30 days',
          instructions: ''
        });
        await fetchPatientDetails();
      }
    } catch (err) {
      console.error('Error adding prescription:', err);
    }
  };

  const handleTogglePrescriptionStatus = async (id: string, newStatus: string) => {
    try {
      await authFetch(`/api/doctor/prescriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchPatientDetails();
    } catch (err) {
      console.error('Error updating prescription:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/api/doctor/patients/${patientId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });
      if (res.ok) {
        setShowAddTaskModal(false);
        setTaskForm({
          title: '',
          due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          related_journey_event_id: ''
        });
        await fetchPatientDetails();
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleScheduleAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/doctor/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          ...apptForm
        })
      });
      if (res.ok) {
        setShowAddApptModal(false);
        setApptForm({
          date: '2026-09-02',
          time: '10:00 AM',
          purpose: 'Cardiology Treatment Follow-up',
          notes: ''
        });
        await fetchPatientDetails();
      }
    } catch (err) {
      console.error('Error scheduling appointment:', err);
    }
  };

  const handleUpdateApptStatus = async (apptId: string, status: string) => {
    try {
      const res = await authFetch(`/api/doctor/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchPatientDetails();
      }
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-sm font-semibold text-slate-700">Loading Patient Clinical Chart...</div>
      </div>
    );
  }

  if (!patientData || !patientData.patient) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <div className="text-base font-bold text-slate-800">Patient Record Not Found</div>
        <p className="text-xs text-slate-500">
          This patient is either not assigned to your cardiology clinic or does not exist in St. Jude Medical Center.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
        >
          Return to My Patients
        </button>
      </div>
    );
  }

  const { patient, journeyEvents, dailyHealthRecords, reports, appointments, tasks, prescriptions, clinicalNotes, alerts, analytics, crossAnalytics } = patientData;
  const currentPeriodStats = analytics[timeRange] || analytics['14d'] || {};

  return (
    <div className="space-y-6">
      {/* Top Patient Master Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors mt-0.5"
              title="Back to Patients List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {patient.name}
                </h1>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  ID: {patient.id}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                  Stage: {patient.current_stage}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Adherence: {patient.adherence_percent}%
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {patient.gender || 'Not specified'} • {patient.age ? `${patient.age} yrs` : ''} (DOB: {patient.date_of_birth})
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  Blood: {patient.blood_group || 'O+'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-5 text-xs text-slate-500 mt-2">
                <span><strong>Contact:</strong> {patient.contact || 'N/A'}</span>
                <span><strong>Emergency:</strong> {patient.emergency_contact || 'N/A'}</span>
                <span><strong>Email:</strong> {patient.email}</span>
                <span><strong>Hospital:</strong> {patient.hospital_name || 'St. Jude Medical Center'}</span>
                <span><strong>Attending:</strong> {patient.doctor_name || 'Dr. Sarah Chen, MD'}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSelectedJourneyEventForNote(null);
                setShowAddNoteModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Write Clinical Note</span>
            </button>
            <button
              onClick={() => setShowAddPrescriptionModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Prescribe Rx</span>
            </button>
            <button
              onClick={() => setShowAddJourneyModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Journey Milestone</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold text-slate-600">
          {[
            { id: 'overview', label: 'Patient Overview', icon: User },
            { id: 'journey', label: `Journey Timeline (${journeyEvents.length})`, icon: Activity },
            { id: 'analytics', label: 'Health Analytics & Correlation', icon: TrendingUp },
            { id: 'daily_health', label: `Daily Health Records (${dailyHealthRecords.length})`, icon: ClipboardList },
            { id: 'prescriptions', label: `Prescriptions (${prescriptions.length})`, icon: Pill },
            { id: 'clinical_notes', label: `Clinical Notes (${clinicalNotes.length})`, icon: Edit3 },
            { id: 'reports', label: `Reports (${reports.length})`, icon: FileText },
            { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckSquare },
            { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
            { id: 'ai_insights', label: 'AI Insights (Placeholder)', icon: BrainCircuit },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Comprehensive Clinical & Medical Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card 1: Clinical Conditions, Medical History & Allergies */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Clinical Diagnosis & Medical History</h3>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Care Plan Active
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Current Conditions */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Current Conditions & Active Diagnoses</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {patient.current_conditions || 'Stress-Induced Sinus Tachycardia • Under active clinical evaluation'}
                  </p>
                </div>

                {/* Medical History */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Documented Medical & Surgical History</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {patient.medical_history || 'No prior adverse cardiovascular hospitalizations or cardiac procedures recorded.'}
                  </p>
                </div>

                {/* Known Allergies */}
                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200/80 space-y-1">
                  <div className="font-bold text-rose-950 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Known Drug Allergies & Contraindications</span>
                  </div>
                  <p className="text-rose-900 font-semibold leading-relaxed">
                    {patient.allergies || 'No Known Drug Allergies (NKDA)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Demographics, Contact & Care Team */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-900">Demographics & Contact Details</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Patient ID:</span>
                    <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">{patient.id}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Gender & Age:</span>
                    <span className="font-semibold text-slate-800">{patient.gender || 'Not specified'}, {patient.age} yrs</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Date of Birth:</span>
                    <span className="font-mono text-slate-800">{patient.date_of_birth}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Blood Group:</span>
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">{patient.blood_group || 'O+'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Primary Phone:</span>
                    <span className="font-semibold text-slate-800">{patient.contact || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Emergency Phone:</span>
                    <span className="font-semibold text-slate-800">{patient.emergency_contact || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="text-slate-800 truncate max-w-[180px] font-medium">{patient.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Attending Physician:</span>
                    <span className="font-semibold text-blue-700">{patient.doctor_name || 'Dr. Sarah Chen, MD'}</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Facility:</span>
                <span className="font-bold text-slate-800">{patient.hospital_name || 'St. Jude Medical Center'}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Quick Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Current Journey Milestone</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-lg font-bold text-slate-900">{patient.current_stage}</div>
              <div className="text-[11px] text-slate-500">
                {journeyEvents.find((e: any) => e.status === 'current')?.title || 'Active care protocol'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Avg Sleep (14 Days)</span>
                <Moon className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-lg font-bold text-slate-900">{patient.avg_sleep} hrs/night</div>
              <div className="text-[11px] text-slate-500">
                Quality: {currentPeriodStats.sleep?.qualityPercent || 78}% Good/Excellent
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Stress Level Average</span>
                <Heart className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-lg font-bold text-slate-900">{patient.avg_stress} / 10</div>
              <div className="text-[11px] text-slate-500">
                Peak: {currentPeriodStats.stress?.highest || 9}/10 (Aug 20)
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Medication Compliance</span>
                <Pill className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-bold text-slate-900">{patient.adherence_percent}%</div>
              <div className="text-[11px] text-slate-500">
                {prescriptions.filter((p: any) => p.status === 'active').length} active Rx prescribed
              </div>
            </div>
          </div>

          {/* Active Threshold Alerts for this patient */}
          {alerts && alerts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Deterministic Clinical Alerts ({alerts.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alerts.map((alt: any) => (
                  <div 
                    key={alt.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      alt.severity === 'high' 
                        ? 'bg-rose-50 border-rose-200 text-rose-950' 
                        : alt.severity === 'medium' 
                        ? 'bg-amber-50 border-amber-200 text-amber-950' 
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      alt.severity === 'high' ? 'text-rose-600' : alt.severity === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                    }`} />
                    <div className="space-y-0.5 text-xs">
                      <div className="font-bold">{alt.title}</div>
                      <div className="opacity-90 leading-relaxed">{alt.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Daily Health Logs, Active Medications & Appointments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Symptoms & Log Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Latest Telemetry & Vitals</span>
                </div>
                <button
                  onClick={() => setActiveTab('daily_health')}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  View All &rarr;
                </button>
              </div>

              {dailyHealthRecords[0] ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-400">Sleep</div>
                      <div className="font-bold text-slate-800 mt-0.5">{dailyHealthRecords[0].sleep_hours} hrs</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-400">Stress</div>
                      <div className="font-bold text-slate-800 mt-0.5">{dailyHealthRecords[0].stress_level}/10</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-slate-400">Exercise</div>
                      <div className="font-bold text-slate-800 mt-0.5">{dailyHealthRecords[0].exercise_minutes} mins</div>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-slate-700">Patient Journal Note:</div>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      "{dailyHealthRecords[0].notes || 'No notes added for today.'}"
                    </p>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <div className="font-semibold text-slate-700">Reported Symptoms:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {dailyHealthRecords[0].symptoms?.length > 0 ? (
                        dailyHealthRecords[0].symptoms.map((s: any) => (
                          <span key={s.id} className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-medium">
                            {s.name}: <strong className="text-slate-900">{s.severity}/10</strong>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">No active symptoms reported today.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Open Health Analytics Graphs &rarr;</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4">No daily health records found.</div>
              )}
            </div>

            {/* Active Prescriptions & Medications */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>Medications ({prescriptions.filter((p: any) => p.status === 'active').length} Active)</span>
                </div>
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className="text-xs text-emerald-600 hover:underline font-semibold"
                >
                  Manage Rx &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {prescriptions.filter((p: any) => p.status === 'active').map((rx: any) => (
                  <div key={rx.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-emerald-950">{rx.name} ({rx.dosage})</div>
                      <div className="text-emerald-800 mt-0.5">{rx.frequency} &bull; {rx.instructions || 'Standard dosage'}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 uppercase">
                      Active
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Next Follow-up Consultation:</span>
                <span className="font-bold text-blue-700">{patient.next_follow_up}</span>
              </div>
            </div>

            {/* Scheduled Appointments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Consultations ({appointments.length})</span>
                </div>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  All Appts &rarr;
                </button>
              </div>

              <div className="space-y-2">
                {appointments.slice(0, 3).map((appt: any) => (
                  <div key={appt.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{appt.date} • {appt.time}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        appt.status === 'scheduled' || appt.status === 'upcoming' 
                          ? 'bg-blue-100 text-blue-800' 
                          : appt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="font-medium text-slate-900">{appt.purpose}</div>
                    <div className="text-[11px] text-slate-500">Provider: {appt.doctor_name || 'Dr. Sarah Chen, MD'}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowAddApptModal(true)}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Consultation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JOURNEY TIMELINE */}
      {activeTab === 'journey' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Healthcare Journey Timeline (Doctor Care & Planning View)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every milestone, clinical assessment, and doctor care plan added here is directly synchronized with {patient.name}'s portal.
              </p>
            </div>

            <button
              onClick={() => setShowAddJourneyModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Journey Milestone</span>
            </button>
          </div>

          {/* Chronological Journey Milestones */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {journeyEvents.map((ev: any, idx: number) => {
              const isCurrent = ev.status === 'current';
              const isCompleted = ev.status === 'completed';

              return (
                <div key={ev.id} className="relative group">
                  {/* Stage Circle Marker */}
                  <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                      : isCompleted
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Milestone Card */}
                  <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50/50 border-blue-300 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-bold text-slate-700 uppercase tracking-wider">{ev.stage}</span>
                          <span>&bull;</span>
                          <span className="font-mono">{ev.date}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1">{ev.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isCurrent
                            ? 'bg-blue-200 text-blue-900'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ev.status}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedJourneyEventForNote(ev);
                            setNoteForm({
                              title: `Clinical Note for ${ev.stage}`,
                              note: ev.clinical_note || '',
                              plan: ev.doctor_plan || '',
                              follow_up_date: ev.clinical_follow_up || ''
                            });
                            setShowAddNoteModal(true);
                          }}
                          className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{ev.clinical_note ? 'Edit Clinical Note' : 'Add Note'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {ev.description || 'No description provided.'}
                    </p>

                    {/* Attached Doctor Clinical Note & Treatment Plan */}
                    {(ev.clinical_note || ev.doctor_plan) && (
                      <div className="mt-3 p-3.5 bg-blue-100/60 border border-blue-200 rounded-xl text-xs space-y-1.5">
                        <div className="font-bold text-blue-950 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
                            Doctor Assessment & Treatment Plan
                          </span>
                          {ev.clinical_follow_up && (
                            <span className="text-[11px] font-semibold text-blue-800">
                              Follow-up: {ev.clinical_follow_up}
                            </span>
                          )}
                        </div>
                        {ev.clinical_note && (
                          <div className="text-blue-900 leading-relaxed font-medium">
                            {ev.clinical_note}
                          </div>
                        )}
                        {ev.doctor_plan && (
                          <div className="pt-1 text-blue-950 font-semibold border-t border-blue-200/60">
                            Plan: {ev.doctor_plan}
                          </div>
                        )}
                      </div>
                    )}

                    {ev.next_step && (
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span><strong>Next Step:</strong> {ev.next_step}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: HEALTH ANALYTICS & CROSS-ANALYTICS */}
      {activeTab === 'analytics' && (
        <DoctorHealthAnalytics
          patientId={patient.id}
          patientName={patient.name}
          initialChartData={patientData?.chartData}
          initialAnalytics={patientData?.analytics}
          initialCrossAnalytics={patientData?.crossAnalytics}
        />
      )}

      {/* TAB 4: DAILY HEALTH RECORDS */}
      {activeTab === 'daily_health' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Raw Daily Health Entries & Patient Journal ({dailyHealthRecords.length} Days)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Read-only view of patient self-recorded entries, dose logs, and symptom notes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-3 px-3.5 font-bold">Date</th>
                  <th className="py-3 px-3 font-bold">Sleep</th>
                  <th className="py-3 px-3 font-bold">Stress</th>
                  <th className="py-3 px-3 font-bold">Exercise</th>
                  <th className="py-3 px-3 font-bold">Hydration</th>
                  <th className="py-3 px-3 font-bold">Rx Doses (M/A/N)</th>
                  <th className="py-3 px-3 font-bold">Symptoms Reported</th>
                  <th className="py-3 px-3.5 font-bold">Patient Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyHealthRecords.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-indigo-900">{r.sleep_hours}h</span>{' '}
                      <span className="text-slate-400">({r.sleep_quality})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        r.stress_level >= 7 ? 'bg-rose-100 text-rose-800' : r.stress_level >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.stress_level}/10
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{r.exercise_minutes}m</td>
                    <td className="py-3 px-3 text-slate-700">{r.water_intake} gl</td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-slate-800">
                        {r.med_morning ? '✓' : '✗'} / {r.med_afternoon ? '✓' : '✗'} / {r.med_night ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {r.symptoms?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.symptoms.map((s: any) => (
                            <span key={s.id} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {s.name} ({s.severity}/10)
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate text-[11px]" title={r.notes}>
                      {r.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Prescription & Medication Regimen Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prescribed medications are immediately synchronized to {patient.name}'s daily compliance tracker.
              </p>
            </div>

            <button
              onClick={() => setShowAddPrescriptionModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Prescribe Medication</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((rx: any) => {
              const isActive = rx.status === 'active';
              return (
                <div key={rx.id} className={`p-4 rounded-2xl border transition-all ${
                  isActive ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{rx.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {rx.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                        Dosage: {rx.dosage} &bull; {rx.frequency}
                      </div>
                    </div>

                    <select
                      value={rx.status}
                      onChange={(e) => handleTogglePrescriptionStatus(rx.id, e.target.value)}
                      className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-700"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong>Instructions:</strong> {rx.instructions || 'Standard daily intake with water.'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    <span>Duration: {rx.duration}</span>
                    <span>Prescribed by: {rx.doctor_name || 'Dr. Sarah Chen, MD'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: CLINICAL NOTES */}
      {activeTab === 'clinical_notes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Doctor Clinical Notes & Care Documentation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official clinical notes recorded across journey consultations and check-ins.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedJourneyEventForNote(null);
                setNoteForm({ title: '', note: '', plan: '', follow_up_date: '' });
                setShowAddNoteModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Clinical Note</span>
            </button>
          </div>

          <div className="space-y-4">
            {clinicalNotes.map((cn: any) => (
              <div key={cn.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{cn.title}</h4>
                    {cn.journey_stage && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        Stage: {cn.journey_stage}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {cn.created_at ? cn.created_at.split(' ')[0] : '2026-08-18'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {cn.note}
                </p>

                {cn.plan && (
                  <div className="text-xs text-blue-950 font-medium bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                    <strong>Treatment Plan:</strong> {cn.plan}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Author: {cn.doctor_name || 'Dr. Sarah Chen, MD'}</span>
                  {cn.follow_up_date && (
                    <span>Next Review Date: <strong>{cn.follow_up_date}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Medical Reports & Diagnostic Telemetry ({reports.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Attached ECG, Holter logs, laboratory chemistry, and imaging documentation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((rep: any) => (
              <div key={rep.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                      {rep.type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{rep.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{rep.name}</h4>
                  <div className="text-xs text-slate-500">
                    Stage: <strong>{rep.journey_stage}</strong> &bull; St. Jude Cardiac Lab
                  </div>
                </div>

                <span className="text-xs text-blue-600 font-semibold px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                  PDF Ready
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Patient Tasks & Follow-up Action Items ({tasks.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks created here appear directly in {patient.name}'s task checklist.
              </p>
            </div>

            <button
              onClick={() => setShowAddTaskModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Task</span>
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((tsk: any) => (
              <div key={tsk.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                    tsk.status === 'completed' ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {tsk.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className={`font-semibold ${tsk.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {tsk.title}
                    </div>
                    {tsk.due_date && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Due Date: {tsk.due_date}
                      </div>
                    )}
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  tsk.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {tsk.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Consultation Appointments Timeline ({appointments.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage upcoming clinical reviews and past consultation logs.
              </p>
            </div>

            <button
              onClick={() => setShowAddApptModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Appointment</span>
            </button>
          </div>

          <div className="space-y-3">
            {appointments.map((appt: any) => {
              const isPending = appt.status === 'pending';
              const isConfirmed = appt.status === 'confirmed';
              const isUpcoming = appt.status === 'upcoming';
              const isCompleted = appt.status === 'completed';

              return (
                <div key={appt.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isPending ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{appt.purpose}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isPending 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : isConfirmed 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : isUpcoming 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : isCompleted 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isPending ? 'Pending Confirmation' : isConfirmed ? 'Confirmed' : appt.status}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Date: <strong className="text-slate-700">{appt.date}</strong> at <strong className="text-slate-700">{appt.time}</strong> &bull; {appt.hospital_name || 'St. Jude Cardiology'}
                    </div>
                    {appt.notes && (
                      <div className="text-slate-600 italic">Notes: {appt.notes}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isPending && (
                      <>
                        <button
                          onClick={() => handleUpdateApptStatus(appt.id, 'confirmed')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors"
                        >
                          Accept & Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium text-xs transition-colors"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {(isConfirmed || isUpcoming) && (
                      <button
                        onClick={() => handleUpdateApptStatus(appt.id, 'completed')}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold text-xs transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 10: AI INSIGHTS PLACEHOLDER */}
      {activeTab === 'ai_insights' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              AI Clinical Decision Support Engine (Phase 5 / Future Module)
            </h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
              This module will use secure server-side Gemini intelligence to generate synthesized patient longitudinal timelines, automatic adverse symptom pattern detection, and clinical note drafts.
            </p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl max-w-xl mx-auto text-left text-xs text-purple-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Preview: Upcoming Gemini Clinical Copilot Features:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-purple-800">
              <li>Automatic correlation summaries across 30+ day multi-modal telemetry</li>
              <li>Smart drafting of SOAP progress notes from daily patient inputs</li>
              <li>Medication interaction safety checks & titration suggestions</li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL: Add Journey Event */}
      {showAddJourneyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Healthcare Journey Milestone</h3>
              <button onClick={() => setShowAddJourneyModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddJourneyEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Stage Category</label>
                <select
                  value={journeyForm.stage}
                  onChange={(e) => setJourneyForm({ ...journeyForm, stage: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                >
                  {['Symptoms', 'Consultation', 'Tests', 'Test Result', 'Diagnosis', 'Treatment', 'Recovery', 'Follow-up'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-Day Echocardiogram & Titration Review"
                  value={journeyForm.title}
                  onChange={(e) => setJourneyForm({ ...journeyForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={journeyForm.date}
                    onChange={(e) => setJourneyForm({ ...journeyForm, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={journeyForm.status}
                    onChange={(e) => setJourneyForm({ ...journeyForm, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="current">Current Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical Description / Findings</label>
                <textarea
                  rows={2}
                  value={journeyForm.description}
                  onChange={(e) => setJourneyForm({ ...journeyForm, description: e.target.value })}
                  placeholder="Clinical assessment and diagnostic purpose..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Doctor Treatment Plan (Optional)</label>
                <input
                  type="text"
                  value={journeyForm.doctor_plan}
                  onChange={(e) => setJourneyForm({ ...journeyForm, doctor_plan: e.target.value })}
                  placeholder="e.g. Continue Metoprolol 25mg daily, maintain fluid logs"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Next Action Required</label>
                <input
                  type="text"
                  value={journeyForm.next_step}
                  onChange={(e) => setJourneyForm({ ...journeyForm, next_step: e.target.value })}
                  placeholder="e.g. Schedule repeat 24-hr Holter patch"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddJourneyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Write Clinical Note */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedJourneyEventForNote ? `Clinical Note for Stage: ${selectedJourneyEventForNote.stage}` : 'Write Doctor Clinical Note'}
              </h3>
              <button onClick={() => setShowAddNoteModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddClinicalNote} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Note Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology Progress Review & Medication Response"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical Findings & Assessment</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record objective observations, vitals review, and patient response..."
                  value={noteForm.note}
                  onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Treatment / Management Plan</label>
                <input
                  type="text"
                  placeholder="e.g. Maintain current dosage; patient instructed on daily hydration"
                  value={noteForm.plan}
                  onChange={(e) => setNoteForm({ ...noteForm, plan: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Follow-up Target Date</label>
                <input
                  type="date"
                  value={noteForm.follow_up_date}
                  onChange={(e) => setNoteForm({ ...noteForm, follow_up_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Prescribe Rx */}
      {showAddPrescriptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Prescribe New Medication</h3>
              <button onClick={() => setShowAddPrescriptionModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddPrescription} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metoprolol Succinate ER"
                  value={prescriptionForm.name}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 25mg"
                    value={prescriptionForm.dosage}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Frequency</label>
                  <select
                    value={prescriptionForm.frequency}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="Once daily (morning)">Once daily (morning)</option>
                    <option value="Twice daily (morning & night)">Twice daily (morning & night)</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Once daily (bedtime)">Once daily (bedtime)</option>
                    <option value="As needed (PRN)">As needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Duration</label>
                <input
                  type="text"
                  value={prescriptionForm.duration}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                  placeholder="e.g. 30 days"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Instructions</label>
                <input
                  type="text"
                  value={prescriptionForm.instructions}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                  placeholder="Take with breakfast and full glass of water"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPrescriptionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Assign Patient Care Task</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Record resting pulse before morning Metoprolol"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Schedule Appointment */}
      {showAddApptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Schedule Appointment</h3>
              <button onClick={() => setShowAddApptModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form onSubmit={handleScheduleAppt} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={apptForm.date}
                    onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={apptForm.time}
                    onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Purpose / Consultation Type</label>
                <input
                  type="text"
                  required
                  value={apptForm.purpose}
                  onChange={(e) => setApptForm({ ...apptForm, purpose: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  value={apptForm.notes}
                  onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
                  placeholder="e.g. Review 2-week health logs and resting pulse"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddApptModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
