import React, { useState, useEffect } from 'react';
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
  Building2
} from 'lucide-react';
import { Appointment } from '../../types';

interface AppointmentsProps {
  onSelectPatient: (patientId: string) => void;
}

export const DoctorAppointments: React.FC<AppointmentsProps> = ({ onSelectPatient }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'cancelled'>('today');
  const [search, setSearch] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);

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
      const res = await fetch('/api/doctor/appointments');
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
      const res = await fetch('/api/doctor/patients');
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
      await fetch(`/api/doctor/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/doctor/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowScheduleModal(false);
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

  const filteredAppointments = appointments.filter((a: any) => {
    const matchesSearch = 
      (a.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.purpose || '').toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filter === 'today') matchesFilter = a.date === todayDate;
    else if (filter === 'upcoming') matchesFilter = a.date >= todayDate && a.status === 'upcoming';
    else if (filter === 'completed') matchesFilter = a.status === 'completed';
    else if (filter === 'cancelled') matchesFilter = a.status === 'cancelled';

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
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
              Manage patient clinical consultations, telemetry reviews, and scheduled follow-ups.
            </p>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Appointment</span>
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {(['today', 'upcoming', 'completed', 'cancelled', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-all ${
                  filter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
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
              return (
                <div 
                  key={appt.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl text-center shrink-0 border ${
                      isToday ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      <div className="text-[10px] font-bold uppercase tracking-wider">{appt.date.split('-')[1]}/{appt.date.split('-')[2]}</div>
                      <div className="text-xs font-mono font-bold">{appt.time}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectPatient(appt.patient_id)}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 text-left transition-colors"
                        >
                          {appt.patient_name}
                        </button>
                        {appt.patient_stage && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Stage: {appt.patient_stage}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          appt.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : appt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {appt.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-800">
                        {appt.purpose}
                      </div>

                      {appt.notes && (
                        <div className="text-xs text-slate-500 italic">
                          "{appt.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {appt.status === 'upcoming' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'completed')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}

                    <button
                      onClick={() => onSelectPatient(appt.patient_id)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold transition-colors flex items-center gap-1"
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
