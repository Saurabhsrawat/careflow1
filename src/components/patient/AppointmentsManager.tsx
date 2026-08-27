import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  AlertCircle,
  CalendarCheck,
  Stethoscope,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../../types';

export const AppointmentsManager: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [showBookModal, setShowBookModal] = useState(false);

  // Booking Form State
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('10:00 AM');
  const [bookPurpose, setBookPurpose] = useState('Cardiology Journey Review & Follow-up');
  const [bookNotes, setBookNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token = localStorage.getItem('careflow_token');
    const headers: Record<string, string> = { ...extra };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patient/appointments', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/patient/appointments/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        await fetchAppointments();
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDate || !bookTime || !bookPurpose) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          date: bookDate,
          time: bookTime,
          purpose: bookPurpose,
          notes: bookNotes
        })
      });
      if (res.ok) {
        setShowBookModal(false);
        setBookDate('');
        setBookNotes('');
        await fetchAppointments();
      }
    } catch (err) {
      console.error('Failed to book appointment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'upcoming') return a.status === 'upcoming';
    if (activeTab === 'completed') return a.status === 'completed' || a.status === 'past';
    if (activeTab === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 uppercase tracking-wider mb-2">
            <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
            Clinical Consultations
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Care Appointments & Consultations
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage your in-person clinic visits and diagnostic follow-up sessions with Dr. Sarah Chen.
          </p>
        </div>

        <button
          onClick={() => setShowBookModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Request Appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Upcoming ({appointments.filter(a => a.status === 'upcoming').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Past & Completed ({appointments.filter(a => a.status === 'completed' || a.status === 'past').length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cancelled'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Cancelled ({appointments.filter(a => a.status === 'cancelled').length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">No {activeTab} appointments found</div>
            <p className="text-xs text-slate-400 mt-1">Book a new session or check other tabs.</p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all ${
                appt.status === 'upcoming' 
                  ? 'border-blue-200 shadow-sm ring-1 ring-blue-100' 
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-blue-900 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      {new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-xl font-extrabold leading-none">
                      {new Date(appt.date + 'T00:00:00').getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                        appt.status === 'upcoming'
                          ? 'bg-blue-100 text-blue-800'
                          : appt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {appt.status}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {appt.time}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {appt.purpose}
                    </h3>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        <strong>{appt.doctor_name || 'Dr. Sarah Chen, MD'}</strong> ({appt.notes ? 'Cardiology' : 'Specialist'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{appt.hospital_name || 'St. Jude Medical Center'} • Suite 400</span>
                      </span>
                    </div>

                    {appt.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                        <strong>Clinical Note:</strong> {appt.notes}
                      </p>
                    )}
                  </div>
                </div>

                {appt.status === 'upcoming' && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleCancelAppointment(appt.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => alert(`Appointment on ${appt.date} at ${appt.time} added to system calendar.`)}
                      className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                    >
                      Add to Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Request Care Consultation</h3>
              <button 
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consulting Physician</label>
                <input
                  type="text"
                  disabled
                  value="Dr. Sarah Chen, MD (Cardiology & Internal Medicine)"
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time</label>
                  <select
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:15 PM">04:15 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Purpose of Visit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2-Week Medication Adherence & Symptom Review"
                  value={bookPurpose}
                  onChange={(e) => setBookPurpose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Symptoms or Special Requests</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Review recent sleep logs and headache correlation..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Confirming...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
