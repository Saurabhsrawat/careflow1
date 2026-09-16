import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  CalendarPlus,
  Download,
  ExternalLink
} from 'lucide-react';
import { authFetch } from '../../utils/api';
import { Appointment, AppointmentStatus, AvailableDoctor } from '../../types';
import { downloadIcsFile, getGoogleCalendarUrl } from '../../utils/calendar';

export const AppointmentsManager: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'completed' | 'cancelled'>('upcoming');
  const [showBookModal, setShowBookModal] = useState(false);

  // Status & Feedback State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmCancelApptId, setConfirmCancelApptId] = useState<string | null>(null);
  const [calendarFeedback, setCalendarFeedback] = useState<{ apptId: string; message: string; googleUrl: string } | null>(null);

  // Helper for sensible default booking date (3 days from today)
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  };

  // Booking Form State
  const [bookDate, setBookDate] = useState(getDefaultDate());
  const [bookTime, setBookTime] = useState('10:00 AM');
  const [bookPurpose, setBookPurpose] = useState('Cardiology Progress Review & Treatment Evaluation');
  const [bookNotes, setBookNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patient/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      } else {
        console.error('Failed to load appointments: status', res.status);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await authFetch('/api/patient/doctors');
      if (res.ok) {
        const data = await res.json();
        const docs: AvailableDoctor[] = data.doctors || [];
        setAvailableDoctors(docs);
        if (docs.length > 0) {
          setSelectedDoctorId(prev => {
            if (prev && docs.some(d => d.id === prev)) return prev;
            const primary = docs.find(d => d.is_primary) || docs[0];
            return primary ? primary.id : docs[0].id;
          });
        }
      } else {
        console.error('Failed to load available doctors: status', res.status);
      }
    } catch (err) {
      console.error('Failed to load available doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const handleOpenBookModal = () => {
    setBookingError(null);
    if (availableDoctors.length === 0) {
      fetchDoctors();
    }
    if (!bookDate) {
      setBookDate(getDefaultDate());
    }
    setShowBookModal(true);
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      setConfirmCancelApptId(null);
      const res = await authFetch(`/api/patient/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        setSuccessMessage('Consultation request has been cancelled.');
        await fetchAppointments();
      } else {
        const errData = await res.json().catch(() => ({}));
        setBookingError(errData.error || 'Failed to cancel appointment. Please try again.');
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setBookingError('Network error while cancelling appointment. Please try again.');
    }
  };

  const handleAddToCalendar = (appt: Appointment) => {
    const success = downloadIcsFile(appt);
    const googleUrl = getGoogleCalendarUrl(appt);
    if (success) {
      setCalendarFeedback({
        apptId: appt.id,
        message: 'iCalendar (.ics) event downloaded! Compatible with Apple Calendar, Outlook, and Android.',
        googleUrl
      });
    } else {
      setCalendarFeedback({
        apptId: appt.id,
        message: 'Calendar event ready. You can open directly in Google Calendar below:',
        googleUrl
      });
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!selectedDoctorId) {
      setBookingError('Please select a physician from the available doctors list.');
      return;
    }
    if (!bookDate) {
      setBookingError('Please choose your preferred appointment date.');
      return;
    }
    if (!bookTime) {
      setBookingError('Please choose your preferred appointment time.');
      return;
    }
    if (!bookPurpose.trim()) {
      setBookingError('Please specify the reason or purpose for your consultation.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authFetch('/api/patient/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          date: bookDate,
          time: bookTime,
          purpose: bookPurpose.trim(),
          notes: bookNotes.trim(),
          status: 'pending'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const selectedDoc = availableDoctors.find(d => d.id === selectedDoctorId);
        const doctorName = selectedDoc ? selectedDoc.name : 'your doctor';
        
        setShowBookModal(false);
        setBookNotes('');
        setSuccessMessage(
          `Appointment request submitted successfully! Your request for ${bookDate} at ${bookTime} with ${doctorName} has been received and is pending clinical confirmation.`
        );
        setActiveTab('upcoming');
        await fetchAppointments();
      } else {
        const errData = await res.json().catch(() => ({}));
        setBookingError(errData.error || 'Failed to book appointment. Please try again.');
      }
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setBookingError('Network error while booking appointment. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = availableDoctors.find(d => d.id === selectedDoctorId);

  // Group available doctors by hospital so patients can easily scan facilities and specialists
  const doctorsByHospital = useMemo(() => {
    const groups: Record<string, AvailableDoctor[]> = {};
    availableDoctors.forEach(doc => {
      const hosp = doc.hospital_name || 'Affiliated Medical Facility';
      if (!groups[hosp]) groups[hosp] = [];
      groups[hosp].push(doc);
    });
    return groups;
  }, [availableDoctors]);

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const upcomingAndConfirmedCount = appointments.filter(a => a.status === 'upcoming' || a.status === 'confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'completed' || a.status === 'past').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'upcoming') {
      // Show upcoming, confirmed, and pending requests in upcoming view
      return a.status === 'upcoming' || a.status === 'confirmed' || a.status === 'pending';
    }
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'completed') return a.status === 'completed' || a.status === 'past';
    if (activeTab === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3 text-emerald-900 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Consultation Request Confirmed</h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">{successMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

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
            Book consultations with primary doctors and specialists across affiliated hospital facilities.
          </p>
        </div>

        <button
          id="patient-request-appointment-btn"
          onClick={handleOpenBookModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Request Appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Upcoming & Pending ({upcomingAndConfirmedCount + pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <span>Pending Review</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${activeTab === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'}`}>
            {pendingCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Past & Completed ({completedCount})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'cancelled'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-slate-500 font-semibold">Loading your clinical appointments...</div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-700">No {activeTab} appointments found</div>
            <p className="text-xs text-slate-400 mt-1">Book a new session or check other tabs.</p>
            <button
              onClick={handleOpenBookModal}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Appointment Now</span>
            </button>
          </div>
        ) : (
          filteredAppointments.map((appt) => {
            const isPending = appt.status === 'pending';
            const isConfirmed = appt.status === 'confirmed';
            const isUpcoming = appt.status === 'upcoming';
            const isCompleted = appt.status === 'completed';
            const isCancelled = appt.status === 'cancelled';

            return (
              <div
                key={appt.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all ${
                  isPending
                    ? 'border-amber-200 bg-amber-50/20 shadow-xs ring-1 ring-amber-100'
                    : isConfirmed || isUpcoming
                    ? 'border-blue-200 shadow-sm ring-1 ring-blue-100'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Date Badge */}
                    <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${
                      isPending
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : isConfirmed || isUpcoming
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isPending ? 'text-amber-600' : 'text-blue-600'}`}>
                        {new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-extrabold leading-none">
                        {new Date(appt.date + 'T00:00:00').getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPending && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Doctor Confirmation
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Confirmed Consultation
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Upcoming
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Completed
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            Cancelled
                          </span>
                        )}

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
                          <strong>{appt.doctor_name || 'Attending Physician'}</strong>
                          {appt.doctor_specialization && (
                            <span className="text-slate-500">({appt.doctor_specialization})</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{appt.hospital_name || 'Medical Center'}{appt.hospital_address ? ` • ${appt.hospital_address}` : ''}</span>
                        </span>
                      </div>

                      {appt.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-2">
                          <strong>Note / Request:</strong> {appt.notes}
                        </p>
                      )}

                      {/* Status Descriptive Alert */}
                      {isPending && (
                        <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Your consultation request has been sent to <strong>{appt.doctor_name || 'the physician'}</strong>. Awaiting doctor acceptance and confirmation.
                          </span>
                        </div>
                      )}
                      {isConfirmed && (
                        <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            Confirmed by <strong>{appt.doctor_name || 'Doctor'}</strong>. Please bring your health records and medication log.
                          </span>
                        </div>
                      )}

                      {/* Calendar Export Feedback Callout */}
                      {calendarFeedback && calendarFeedback.apptId === appt.id && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <CalendarCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                              <p className="font-medium text-slate-800 leading-relaxed">
                                {calendarFeedback.message}
                              </p>
                            </div>
                            <button
                              onClick={() => setCalendarFeedback(null)}
                              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-1"
                              title="Dismiss"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-blue-100">
                            <button
                              onClick={() => downloadIcsFile(appt)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Again (.ics)
                            </button>
                            <a
                              href={calendarFeedback.googleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open in Google Calendar
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(isPending || isUpcoming || isConfirmed) && (
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      {confirmCancelApptId === appt.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1 text-xs">
                          <span className="text-rose-700 font-semibold">Cancel request?</span>
                          <button
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="px-2 py-0.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmCancelApptId(null)}
                            className="px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmCancelApptId(appt.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                        >
                          Cancel Request
                        </button>
                      )}

                      {(isConfirmed || isUpcoming) && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAddToCalendar(appt)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 cursor-pointer shadow-2xs"
                            title="Download iCalendar file (.ics) and sync with your calendar"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                            Add to Calendar
                          </button>
                          <a
                            href={getGoogleCalendarUrl(appt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                            title="Open directly in Google Calendar"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Request Care Consultation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select your physician and preferred consultation schedule.</p>
              </div>
              <button 
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="appointment-doctor-select" className="text-xs font-semibold text-slate-700">
                    Consulting Physician <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    All Participating Facilities & Specialists
                  </span>
                </div>

                {loadingDoctors ? (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Loading physicians across facilities...</span>
                  </div>
                ) : availableDoctors.length === 0 ? (
                  <div className="w-full bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-700 flex items-center justify-between">
                    <span>No physicians found.</span>
                    <button 
                      type="button" 
                      onClick={fetchDoctors}
                      className="text-rose-800 font-bold underline text-xs"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <select
                      id="appointment-doctor-select"
                      required
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                    >
                      {(Object.entries(doctorsByHospital) as [string, AvailableDoctor[]][]).map(([hospitalName, docs]) => (
                        <optgroup key={hospitalName} label={`🏥 ${hospitalName}`}>
                          {docs.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} — {doc.specialization}{doc.is_primary ? ' [Your Primary Doctor]' : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    {/* Selected Doctor Live Details Card */}
                    {selectedDoctor && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                            <span>{selectedDoctor.name}</span>
                          </div>
                          {selectedDoctor.is_primary ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              Assigned Primary Doctor
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Specialist Consultation
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Specialty:</span> {selectedDoctor.specialization}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{selectedDoctor.hospital_name || 'Medical Facility'}{selectedDoctor.hospital_address ? ` • ${selectedDoctor.hospital_address}` : ''}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="appointment-date-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="appointment-date-input"
                    type="date"
                    required
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label htmlFor="appointment-time-select" className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Time <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="appointment-time-select"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:15 AM">11:15 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:15 PM">04:15 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="appointment-purpose-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Purpose of Visit <span className="text-rose-500">*</span>
                </label>
                <input
                  id="appointment-purpose-input"
                  type="text"
                  required
                  placeholder="e.g. 2-Week Medication Adherence & Symptom Review"
                  value={bookPurpose}
                  onChange={(e) => setBookPurpose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="appointment-notes-input" className="block text-xs font-semibold text-slate-700 mb-1">
                  Symptoms or Special Requests
                </label>
                <textarea
                  id="appointment-notes-input"
                  rows={2}
                  placeholder="e.g. Review recent sleep logs, vitals rhythm, or discuss second opinion..."
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="patient-submit-appointment-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submit Consultation Request</span>
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
