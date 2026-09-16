import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Filter,
  Search,
  Building2,
  Stethoscope,
  Check
} from 'lucide-react';
import { Appointment } from '../../types';

interface AppointmentsProps {
  onSelectPatient: (patientId: string) => void;
}

export const DoctorAppointments: React.FC<AppointmentsProps> = ({ onSelectPatient }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'today' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const [form, setForm] = useState({
    patient_id: 'pat-alex-rivera',
    date: '2026-08-27',
    time: '03:30 PM',
    purpose: 'Cardiology Progress Review & Prescription Titration',
    notes: ''
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/doctor/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to fetch doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await authFetch('/api/doctor/patients');
      if (res.ok) {
        const data = await res.json();
        setAssignedPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Failed to fetch patients for appointment form:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const targetAppt = appointments.find(a => a.id === id);
      const res = await authFetch(`/api/doctor/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const patientName = (targetAppt as any)?.patient_name || 'Patient';
        if (newStatus === 'confirmed') {
          setActionFeedback(`Consultation request for ${patientName} on ${targetAppt?.date} has been confirmed.`);
        } else if (newStatus === 'cancelled') {
          setActionFeedback(`Appointment for ${patientName} on ${targetAppt?.date} has been declined / cancelled.`);
        } else if (newStatus === 'completed') {
          setActionFeedback(`Appointment for ${patientName} marked as completed.`);
        }
        await fetchAppointments();
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/doctor/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowScheduleModal(false);
        setActionFeedback('New appointment scheduled successfully.');
        setForm({
          patient_id: 'pat-alex-rivera',
          date: '2026-08-27',
          time: '03:30 PM',
          purpose: 'Cardiology Progress Review & Prescription Titration',
          notes: ''
        });
        await fetchAppointments();
      }
    } catch (err) {
      console.error('Failed to schedule appointment:', err);
    }
  };

  const todayDate = '2026-08-27';
  const currentDate = new Date().toISOString().split('T')[0];

  const pendingCount = appointments.filter((a: any) => a.status === 'pending').length;
  const upcomingCount = appointments.filter((a: any) => a.status === 'upcoming' || a.status === 'confirmed').length;
  const todayCount = appointments.filter((a: any) => (a.date === todayDate || a.date === currentDate) && a.status !== 'cancelled').length;
  const completedCount = appointments.filter((a: any) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a: any) => a.status === 'cancelled').length;

  const filteredAppointments = appointments.filter((a: any) => {
    const matchesSearch = 
      (a.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.hospital_name || '').toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filter === 'today') matchesFilter = (a.date === todayDate || a.date === currentDate) && a.status !== 'cancelled';
    else if (filter === 'pending') matchesFilter = a.status === 'pending';
    else if (filter === 'upcoming') matchesFilter = a.status === 'upcoming' || a.status === 'confirmed';
    else if (filter === 'completed') matchesFilter = a.status === 'completed';
    else if (filter === 'cancelled') matchesFilter = a.status === 'cancelled';

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Toast Banner */}
      {actionFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 text-emerald-900 transition-all">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Clinic Appointments & Consultations
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage patient clinical consultations, pending booking requests, and scheduled reviews.
            </p>
          </div>

          <button
            id="doctor-schedule-appointment-btn"
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Appointment</span>
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({appointments.length})
            </button>

            <button
              id="doctor-pending-filter-btn"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : pendingCount > 0
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending Requests</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                filter === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-300 text-amber-950'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                filter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today ({todayCount})
            </button>

            <button
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                filter === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming & Confirmed ({upcomingCount})
            </button>

            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                filter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>

            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                filter === 'cancelled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient or purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300" />
            <div className="font-semibold text-slate-600">No appointments found for the selected filter</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((appt: any) => {
              const isToday = appt.date === todayDate;
              const isPending = appt.status === 'pending';
              const isConfirmed = appt.status === 'confirmed';
              const isUpcoming = appt.status === 'upcoming';
              const isCompleted = appt.status === 'completed';
              const isCancelled = appt.status === 'cancelled';

              return (
                <div 
                  key={appt.id}
                  className={`p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPending ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl text-center shrink-0 border ${
                      isPending
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : isToday 
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider">{appt.date.split('-')[1]}/{appt.date.split('-')[2]}</div>
                      <div className="text-xs font-mono font-bold">{appt.time}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onSelectPatient(appt.patient_id)}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 text-left transition-colors cursor-pointer"
                        >
                          {appt.patient_name}
                        </button>
                        {appt.patient_stage && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Stage: {appt.patient_stage}
                          </span>
                        )}

                        {isPending && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Pending Doctor Confirmation
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Confirmed
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Upcoming
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Completed
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-rose-100 text-rose-800 border border-rose-200">
                            Cancelled
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-800">
                        {appt.purpose}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        {appt.hospital_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{appt.hospital_name}</span>
                          </span>
                        )}
                        {appt.patient_email && (
                          <span className="text-slate-400">&bull; {appt.patient_email}</span>
                        )}
                      </div>

                      {appt.notes && (
                        <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{appt.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                    {/* Actions for Pending Requests */}
                    {isPending && (
                      <>
                        <button
                          id={`doctor-confirm-btn-${appt.id}`}
                          onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Confirm</span>
                        </button>
                        <button
                          id={`doctor-decline-btn-${appt.id}`}
                          onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    )}

                    {/* Actions for Confirmed & Upcoming Appointments */}
                    {(isUpcoming || isConfirmed) && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'completed')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                          className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onSelectPatient(appt.patient_id)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Chart</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Appointment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Schedule Clinic Consultation</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Patient</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 font-semibold"
                >
                  {assignedPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stage: {p.current_stage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Consultation Purpose</label>
                <input
                  type="text"
                  required
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical Notes / Agenda</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Review 2-week daily health logs, Metoprolol response..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
