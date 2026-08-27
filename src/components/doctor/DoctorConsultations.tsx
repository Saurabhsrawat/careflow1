import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Stethoscope, 
  ArrowRight, 
  ExternalLink,
  ClipboardList,
  Sparkles,
  Heart,
  Pill,
  X,
  Layers,
  ChevronDown
} from 'lucide-react';

interface ConsultationItem {
  id: string;
  patient_id: string;
  doctor_id: string;
  journey_event_id?: string;
  title: string;
  note: string;
  plan?: string;
  follow_up_date?: string;
  created_at?: string;
  patient_name: string;
  patient_email?: string;
  date_of_birth?: string;
  blood_group?: string;
  patient_current_stage?: string;
  journey_stage?: string;
  journey_title?: string;
  journey_date?: string;
  journey_status?: string;
  doctor_name?: string;
  hospital_name?: string;
}

interface ConsultationsProps {
  onSelectPatient: (patientId: string) => void;
}

export const DoctorConsultations: React.FC<ConsultationsProps> = ({ onSelectPatient }) => {
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationItem | null>(null);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);

  // Add Consultation Form State
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patient_id: 'pat-alex-rivera',
    title: 'Routine Cardiology Follow-Up & Holter Review',
    consultation_type: 'Follow-up',
    journey_stage: 'Treatment',
    note: '',
    plan: '',
    follow_up_date: '2026-09-02'
  });

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const [res, patRes] = await Promise.all([
        fetch('/api/doctor/consultations'),
        fetch('/api/doctor/patients')
      ]);

      if (res.ok) {
        const data = await res.json();
        setConsultations(data.consultations || []);
      }

      if (patRes.ok) {
        const patData = await patRes.json();
        setAssignedPatients(patData.patients || []);
      }
    } catch (err) {
      console.error('Failed to load consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id || !form.title || !form.note) {
      alert('Please fill out patient, consultation title, and clinical notes.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/doctor/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: form.patient_id,
          title: form.title,
          note: form.note,
          plan: form.plan,
          follow_up_date: form.follow_up_date || null,
          journey_stage: form.journey_stage
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setForm({
          patient_id: assignedPatients[0]?.id || 'pat-alex-rivera',
          title: '',
          consultation_type: 'Follow-up',
          journey_stage: 'Treatment',
          note: '',
          plan: '',
          follow_up_date: ''
        });
        await fetchConsultations();
      } else {
        const errData = await res.json();
        alert('Failed to save consultation: ' + (errData.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error saving consultation: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredConsultations = useMemo(() => {
    return consultations.filter(item => {
      const matchSearch = 
        item.patient_name.toLowerCase().includes(search.toLowerCase()) ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.note.toLowerCase().includes(search.toLowerCase()) ||
        (item.plan && item.plan.toLowerCase().includes(search.toLowerCase())) ||
        (item.journey_stage && item.journey_stage.toLowerCase().includes(search.toLowerCase()));

      const matchPatient = selectedPatientFilter === 'all' || item.patient_id === selectedPatientFilter;
      
      const matchType = selectedTypeFilter === 'all' || 
        (selectedTypeFilter === 'Initial' && (item.title.toLowerCase().includes('initial') || item.journey_stage === 'Consultation')) ||
        (selectedTypeFilter === 'Diagnosis' && (item.title.toLowerCase().includes('diagnos') || item.journey_stage === 'Diagnosis')) ||
        (selectedTypeFilter === 'Treatment' && (item.title.toLowerCase().includes('treatment') || item.title.toLowerCase().includes('regimen') || item.journey_stage === 'Treatment')) ||
        (selectedTypeFilter === 'Follow-up' && (item.title.toLowerCase().includes('follow') || item.title.toLowerCase().includes('rehab') || item.journey_stage === 'Follow-up' || item.journey_stage === 'Recovery'));

      return matchSearch && matchPatient && matchType;
    });
  }, [consultations, search, selectedPatientFilter, selectedTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4 text-teal-600" />
            <span>Clinical Records & Decisions</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Consultations Log</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Detailed clinical notes, diagnostic evaluations, pharmacotherapy regimens, and follow-up plans across your assigned patients at St. Jude Medical Center.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Consultation</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Total Consultations</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{consultations.length}</div>
          <div className="text-[11px] text-teal-600 font-medium mt-1">Cross-patient clinical logs</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Follow-Ups Set</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {consultations.filter(c => c.follow_up_date).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Next review milestones</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Active Regimens</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {consultations.filter(c => c.plan && c.plan.length > 10).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Structured care plans</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Assigned Patients</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{assignedPatients.length || 3}</div>
          <div className="text-[11px] text-slate-500 mt-1">Under Dr. Sarah Chen</div>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clinical notes, diagnosis, prescriptions, or patient name..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Patient Filter */}
            <select
              value={selectedPatientFilter}
              onChange={(e) => setSelectedPatientFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Patients ({consultations.length})</option>
              {assignedPatients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.current_stage})</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Types</option>
              <option value="Initial">Initial Evaluations</option>
              <option value="Diagnosis">Diagnostic Reviews</option>
              <option value="Treatment">Treatment Regimens</option>
              <option value="Follow-up">Follow-ups & Rehab</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consultations Feed */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 mt-3">Loading clinical consultations...</p>
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Consultations Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {search ? 'Try adjusting your search keywords or active filters.' : 'No consultation records match the selected filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConsultations.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all p-5 sm:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Main Clinical Note Body */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onSelectPatient(item.patient_id)}
                      className="inline-flex items-center gap-1.5 font-bold text-base text-slate-900 hover:text-teal-600 transition-colors cursor-pointer group"
                    >
                      <User className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                      <span>{item.patient_name}</span>
                    </button>

                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.patient_current_stage || item.journey_stage || 'Active'}
                    </span>

                    {item.journey_stage && (
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-teal-50 text-teal-800 border border-teal-200">
                        Stage: {item.journey_stage}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.journey_date || item.created_at?.split(' ')[0] || 'Aug 2026'}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>{item.title}</span>
                    </h3>
                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-sm text-slate-700 leading-relaxed">
                      {item.note}
                    </div>
                  </div>

                  {item.plan && (
                    <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-start gap-2.5 text-xs text-teal-900">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-teal-950">Clinical Management Plan: </span>
                        <span>{item.plan}</span>
                      </div>
                    </div>
                  )}

                  {item.follow_up_date && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Scheduled Next Follow-Up: </span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.follow_up_date}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Action Bar */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                  <button
                    onClick={() => setSelectedConsultation(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <span>Full Clinical View</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => onSelectPatient(item.patient_id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Patient Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Consultation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  <span>Record Clinical Consultation</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Document clinical findings, assessment, and action plan in the patient's permanent record.
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConsultation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Patient *</label>
                  <select
                    value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white"
                    required
                  >
                    {assignedPatients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.current_stage})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Journey Stage</label>
                  <select
                    value={form.journey_stage}
                    onChange={(e) => setForm({ ...form, journey_stage: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Tests">Tests</option>
                    <option value="Test Result">Test Result</option>
                    <option value="Diagnosis">Diagnosis</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Cardiology Progress Review & Medication Titration"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Assessment & Examination Notes *</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={4}
                  placeholder="Subjective complaints, physical exam (BP, HR, auscultation), diagnostic review, tolerance of current pharmacotherapy..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Management Plan & Directives</label>
                <textarea
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  rows={2}
                  placeholder="Dosage adjustments, diagnostic lab orders, dietary restrictions, symptom thresholds for emergency contact..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Next Follow-Up Date</label>
                <input
                  type="date"
                  value={form.follow_up_date}
                  onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Setting a follow-up date will automatically coordinate clinic appointment scheduling and patient reminders.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Consultation Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Consultation Drawer / Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                  Clinical Consultation Record
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1.5">{selectedConsultation.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-800">{selectedConsultation.patient_name}</span>
                  <span>&bull;</span>
                  <span>{selectedConsultation.journey_date || selectedConsultation.created_at?.split(' ')[0]}</span>
                  <span>&bull;</span>
                  <span>{selectedConsultation.hospital_name || 'St. Jude Medical Center'}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedConsultation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Clinical Assessment & Examination
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed">
                  {selectedConsultation.note}
                </div>
              </div>

              {selectedConsultation.plan && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-1.5">
                    Plan & Directives
                  </h4>
                  <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-100 text-sm text-teal-950 font-medium leading-relaxed">
                    {selectedConsultation.plan}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-medium text-slate-500">Stage Linkage</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {selectedConsultation.journey_stage || 'Consultation'}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="text-[11px] font-medium text-blue-600">Next Follow-Up</div>
                  <div className="text-sm font-bold text-blue-900 mt-0.5">
                    {selectedConsultation.follow_up_date || 'None scheduled'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const pid = selectedConsultation.patient_id;
                  setSelectedConsultation(null);
                  onSelectPatient(pid);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>Open Full Patient Chart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSelectedConsultation(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
