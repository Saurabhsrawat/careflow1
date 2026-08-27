import React, { useState } from 'react';
import { HospitalPatient, HospitalDoctor } from '../../types';
import { 
  Users, 
  Search, 
  UserCheck, 
  Calendar, 
  Phone, 
  Mail, 
  Layers, 
  Stethoscope, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Activity,
  Heart
} from 'lucide-react';

interface HospitalPatientsListProps {
  patients: HospitalPatient[];
  doctors: HospitalDoctor[];
  loading: boolean;
  hospitalName: string;
  token: string | null;
}

export const HospitalPatientsList: React.FC<HospitalPatientsListProps> = ({
  patients,
  doctors,
  loading,
  hospitalName,
  token
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');

  // Administrative detail modal state
  const [selectedPatient, setSelectedPatient] = useState<HospitalPatient | null>(null);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);
  const [patientDetailData, setPatientDetailData] = useState<{
    patient: HospitalPatient;
    appointments: Array<any>;
    journeyMilestones: Array<any>;
  } | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Filter patients
  const filteredPatients = patients.filter((pat) => {
    const matchesSearch = 
      pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pat.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pat.contact && pat.contact.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (stageFilter !== 'all' && pat.current_stage !== stageFilter) return false;
    if (doctorFilter !== 'all' && pat.doctor_id !== doctorFilter) return false;

    return true;
  });

  // Fetch administrative profile
  const handleOpenPatientDetail = async (patient: HospitalPatient) => {
    setSelectedPatient(patient);
    setPatientDetailLoading(true);
    setDetailError(null);
    setPatientDetailData(null);

    try {
      const res = await fetch(`/api/hospitals/admin/patients/${patient.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load patient administrative profile');
      }
      setPatientDetailData(data);
    } catch (err: any) {
      setDetailError(err.message);
    } finally {
      setPatientDetailLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Symptoms':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Consultation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Tests':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Diagnosis':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Treatment':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Recovery':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Follow-up':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Enrolled Patient Registry</span>
            </h2>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
              {patients.length} Active Profiles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administrative oversight, appointment history, and journey stage tracking at {hospitalName}.
          </p>
        </div>

        {/* Privacy Note Badge */}
        <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>HIPAA Role Scoped:</strong> Admin views administrative info only. Private daily health logs are restricted to clinicians.
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient by name, email, or contact number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="sm:col-span-3">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            <option value="all">All Journey Stages ({patients.length})</option>
            <option value="Symptoms">Stage: Symptoms</option>
            <option value="Consultation">Stage: Consultation</option>
            <option value="Tests">Stage: Tests</option>
            <option value="Diagnosis">Stage: Diagnosis</option>
            <option value="Treatment">Stage: Treatment</option>
            <option value="Recovery">Stage: Recovery</option>
            <option value="Follow-up">Stage: Follow-up</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            <option value="all">All Assigned Physicians</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.specialization.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Cards / Table */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No patients matched your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the stage filter or search term.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-4 py-3.5">Current Stage</th>
                  <th className="px-4 py-3.5">Attending Doctor</th>
                  <th className="px-4 py-3.5">Contact Info</th>
                  <th className="px-4 py-3.5">Consultations</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((pat) => {
                  return (
                    <tr key={pat.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & ID */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {pat.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{pat.name}</span>
                              {pat.blood_group && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] font-bold">
                                  {pat.blood_group}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                              <span>DOB: {pat.date_of_birth || 'N/A'}</span>
                              <span>•</span>
                              <span>ID: {pat.id}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stage Badge */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStageColor(pat.current_stage)}`}>
                          <Layers className="w-3 h-3" />
                          <span>{pat.current_stage}</span>
                        </span>
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800">
                          {pat.assigned_doctor_name || 'Care Team Assigned'}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {pat.assigned_doctor_specialization || 'Clinical Staff'}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-4">
                        <div className="text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[150px]">{pat.email}</span>
                        </div>
                        {pat.contact && (
                          <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{pat.contact}</span>
                          </div>
                        )}
                      </td>

                      {/* Visit Counts */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-800">
                          {pat.appointment_count} {pat.appointment_count === 1 ? 'visit' : 'visits'}
                        </div>
                        {pat.last_visit_date && (
                          <div className="text-[11px] text-slate-400">
                            Last: {pat.last_visit_date}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenPatientDetail(pat)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Admin View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PATIENT ADMINISTRATIVE DETAIL MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                  {selectedPatient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedPatient.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStageColor(selectedPatient.current_stage)}`}>
                      {selectedPatient.current_stage} Stage
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Hospital Administrative Record • Scoped to {hospitalName}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
              {patientDetailLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading administrative profile...
                </div>
              ) : detailError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {detailError}
                </div>
              ) : patientDetailData ? (
                <>
                  {/* Demographics & Contact Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">DOB</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block">{patientDetailData.patient.date_of_birth || 'Not specified'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Blood Group</span>
                      <span className="text-xs font-bold text-rose-700 mt-0.5 block">{patientDetailData.patient.blood_group || 'O+'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Phone Contact</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{patientDetailData.patient.contact || 'None'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Emergency Contact</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{patientDetailData.patient.emergency_contact || 'None'}</span>
                    </div>
                  </div>

                  {/* Attending Physician Section */}
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {patientDetailData.patient.assigned_doctor_name || 'Care Team Assigned'}
                        </div>
                        <div className="text-[11px] text-indigo-700">
                          {patientDetailData.patient.assigned_doctor_specialization || 'Clinical Division'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">Primary Attending</span>
                  </div>

                  {/* Appointments at this Hospital */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Hospital Appointment Records ({patientDetailData.appointments.length})</span>
                    </h4>

                    {patientDetailData.appointments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No appointments recorded at {hospitalName}.</p>
                    ) : (
                      <div className="space-y-2">
                        {patientDetailData.appointments.map((appt, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{appt.date} at {appt.time}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  appt.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : appt.status === 'cancelled'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {appt.status}
                                </span>
                              </div>
                              <p className="text-slate-600 mt-0.5">{appt.purpose}</p>
                              <p className="text-slate-400 text-[11px] mt-0.5">Doctor: {appt.doctor_name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Journey Milestones Overview (Operational Stage Progression Only) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Care Journey Stage Progression</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Stage name & status only
                      </span>
                    </div>

                    {patientDetailData.journeyMilestones.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No journey stage milestones recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {patientDetailData.journeyMilestones.map((milestone, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              <span className="font-semibold text-slate-800">
                                {milestone.stage} Stage
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                milestone.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : milestone.status === 'current'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {milestone.status || 'Active'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{milestone.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Patient User ID: <code className="text-slate-600">{selectedPatient.user_id}</code>
              </span>
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
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
