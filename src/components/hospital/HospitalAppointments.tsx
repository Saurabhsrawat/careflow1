import React, { useState } from 'react';
import { HospitalAppointmentItem, HospitalDoctor } from '../../types';
import { authFetch } from '../../utils/api';
import { 
  Calendar, 
  Clock, 
  Search, 
  UserCheck, 
  Stethoscope, 
  UserX, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw, 
  ArrowRightLeft, 
  Filter,
  CheckCircle2,
  CalendarCheck,
  Building2,
  Send
} from 'lucide-react';

interface HospitalAppointmentsProps {
  appointments: HospitalAppointmentItem[];
  doctors: HospitalDoctor[];
  loading: boolean;
  hospitalName: string;
  onRefresh: () => void;
  token: string | null;
}

export const HospitalAppointments: React.FC<HospitalAppointmentsProps> = ({
  appointments,
  doctors,
  loading,
  hospitalName,
  onRefresh,
  token
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Reassignment Modal State
  const [reassignAppt, setReassignAppt] = useState<HospitalAppointmentItem | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  // Status Update State
  const [updatingApptId, setUpdatingApptId] = useState<string | null>(null);

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch = 
      appt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (doctorFilter !== 'all' && appt.doctor_id !== doctorFilter) return false;
    if (statusFilter !== 'all' && appt.status !== statusFilter) return false;
    if (dateFilter && appt.date !== dateFilter) return false;

    return true;
  });

  // Handle Reassignment
  const handleOpenReassignModal = (appt: HospitalAppointmentItem) => {
    setReassignAppt(appt);
    // Default to first available active doctor that is not the current doctor
    const otherDoctor = doctors.find(d => d.id !== appt.doctor_id && d.is_active === 1);
    setTargetDoctorId(otherDoctor ? otherDoctor.id : '');
    setReassignReason('');
    setErrorMsg(null);
  };

  const handleExecuteReassignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignAppt || !targetDoctorId) {
      setErrorMsg('Please select a target physician for reassignment.');
      return;
    }

    setIsSubmittingReassign(true);
    setErrorMsg(null);

    try {
      const res = await authFetch(`/api/hospitals/admin/appointments/${reassignAppt.id}/reassign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_doctor_id: targetDoctorId,
          reason: reassignReason.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reassign appointment');
      }

      setSuccessMsg(data.message || 'Appointment reassigned successfully.');
      setReassignAppt(null);
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    setUpdatingApptId(apptId);
    setErrorMsg(null);

    try {
      const res = await authFetch(`/api/hospitals/admin/appointments/${apptId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setSuccessMsg(`Appointment status updated to ${newStatus}.`);
      onRefresh();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingApptId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Hospital Appointment Oversight</span>
            </h2>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
              {appointments.length} Total Consultations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master clinic schedule and physician reassignments for {hospitalName}.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Schedule</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient, doctor, or purpose..."
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
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            <option value="all">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="declined">Declined</option>
            <option value="past">Past</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Appointments List / Table */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">Patient Details</th>
                  <th className="px-4 py-3.5">Attending Physician</th>
                  <th className="px-4 py-3.5">Clinical Purpose & Notes</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Oversight Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => {
                  const isUpdating = updatingApptId === appt.id;

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date & Time */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{appt.date}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{appt.time}</span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {appt.patient_name}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[140px]">
                          {appt.patient_email}
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{appt.doctor_name}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[150px]">
                          {appt.doctor_specialization}
                        </div>
                      </td>

                      {/* Purpose & Notes */}
                      <td className="px-4 py-4 max-w-xs">
                        <p className="font-medium text-slate-800">{appt.purpose}</p>
                        {appt.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                            {appt.notes}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          appt.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : appt.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : appt.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : appt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : appt.status === 'declined'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : appt.status === 'past'
                            ? 'bg-gray-100 text-gray-700 border border-gray-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}>
                          {appt.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenReassignModal(appt)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1"
                            title="Reassign to another doctor"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Reassign</span>
                          </button>

                          {appt.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1"
                                title="Confirm Appointment"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Confirm</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(appt.id, 'declined')}
                                disabled={isUpdating}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1"
                                title="Decline Appointment"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </>
                          )}

                          {(appt.status === 'upcoming' || appt.status === 'confirmed') && (
                            <button
                              onClick={() => handleUpdateStatus(appt.id, 'completed')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1"
                              title="Mark Completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCTOR REASSIGNMENT MODAL */}
      {reassignAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reassign Appointment Doctor</h3>
                  <p className="text-xs text-slate-500">Hospital Staff Caseload Adjustment</p>
                </div>
              </div>
              <button 
                onClick={() => setReassignAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReassignment} className="space-y-4 mt-4">
              {/* Appointment Context Summary */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <strong className="text-slate-800">{reassignAppt.patient_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled:</span>
                  <span className="text-slate-800 font-medium">{reassignAppt.date} at {reassignAppt.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose:</span>
                  <span className="text-slate-700">{reassignAppt.purpose}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Current Doctor:</span>
                  <span className="text-rose-700 font-semibold">{reassignAppt.doctor_name}</span>
                </div>
              </div>

              {/* Target Physician Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reassign to New Attending Physician *
                </label>
                <select
                  required
                  value={targetDoctorId}
                  onChange={(e) => setTargetDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="">-- Select Active Doctor at {hospitalName} --</option>
                  {doctors
                    .filter(d => d.is_active === 1)
                    .map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.specialization} ({doc.patient_count} active patients)
                      </option>
                    ))}
                </select>
              </div>

              {/* Reason / Admin Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Reassignment (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Schedule conflict coverage / Specialized cardiology sub-consult requested."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Notification Note */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
                <Send className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  The newly assigned physician will receive an instant in-app notification in their clinical portal alert feed.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReassignAppt(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReassign || !targetDoctorId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingReassign ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reassigning...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Reassignment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
