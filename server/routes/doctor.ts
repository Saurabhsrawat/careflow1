import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, queryOne, queryAll, execute } from '../db';
import { authenticateUser } from './auth';

const router = Router();

// Middleware: authenticate user and ensure doctor profile
router.use(authenticateUser);

// Helper to get doctor profile for logged in user
function getDoctorInfo(req: Request) {
  const user = (req as any).user;
  if (!user) return null;

  // Find doctor record
  let doc = queryOne(`
    SELECT d.id, d.user_id, d.hospital_id, d.specialization, d.license_number,
           u.name as doctor_name, u.email as doctor_email,
           h.name as hospital_name, h.address as hospital_address
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN hospitals h ON d.hospital_id = h.id
    WHERE d.user_id = ?
  `, [user.id]);

  // Fallback for demo if logged in as another role testing doctor endpoints
  if (!doc) {
    doc = queryOne(`
      SELECT d.id, d.user_id, d.hospital_id, d.specialization, d.license_number,
             u.name as doctor_name, u.email as doctor_email,
             h.name as hospital_name, h.address as hospital_address
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN hospitals h ON d.hospital_id = h.id
      WHERE d.id = 'doc-chen-stjude'
    `);
  }

  return doc;
}

// Calculate age from DOB
function getAge(dob?: string): number {
  if (!dob) return 38;
  const birthYear = new Date(dob).getFullYear();
  return 2026 - birthYear;
}

// Helper to compute threshold-based alerts (Deterministic, NON-AI)
function computePatientAlerts(patientId: string, patientName: string): any[] {
  const records = queryAll(`
    SELECT * FROM daily_health_records 
    WHERE patient_id = ? 
    ORDER BY date DESC
  `, [patientId]);

  const alerts: any[] = [];

  if (records.length >= 2) {
    // 1. Fatigue trend check (last 3-4 days)
    const recentFatigueRecords = queryAll(`
      SELECT r.date, s.severity FROM symptoms s
      JOIN daily_health_records r ON s.daily_record_id = r.id
      WHERE r.patient_id = ? AND s.name = 'Fatigue'
      ORDER BY r.date DESC
      LIMIT 4
    `, [patientId]);

    if (recentFatigueRecords.length >= 2) {
      const latestFatigue = recentFatigueRecords[0].severity;
      const priorFatigue = recentFatigueRecords[recentFatigueRecords.length - 1].severity;
      if (latestFatigue - priorFatigue >= 4) {
        alerts.push({
          id: `alert-fatigue-${patientId}`,
          patient_id: patientId,
          patient_name: patientName,
          type: 'threshold',
          severity: 'medium',
          title: 'Elevated Fatigue Index',
          message: `Fatigue increased from ${priorFatigue}/10 to ${latestFatigue}/10 across recent entries. Recommend checking sleep log and workload stress.`,
          date: recentFatigueRecords[0].date
        });
      }
    }

    // 2. Sleep duration comparison (compare recent 3 days vs prior 4 days)
    const recent3Days = records.slice(0, 3);
    const prior4Days = records.slice(3, 7);
    if (recent3Days.length > 0 && prior4Days.length > 0) {
      const avgRecentSleep = recent3Days.reduce((sum, r) => sum + (r.sleep_hours || 0), 0) / recent3Days.length;
      const avgPriorSleep = prior4Days.reduce((sum, r) => sum + (r.sleep_hours || 0), 0) / prior4Days.length;
      if (avgPriorSleep - avgRecentSleep >= 1.5) {
        alerts.push({
          id: `alert-sleep-${patientId}`,
          patient_id: patientId,
          patient_name: patientName,
          type: 'trend',
          severity: 'medium',
          title: 'Sleep Duration Deficit',
          message: `Average sleep decreased from ${avgPriorSleep.toFixed(1)}h to ${avgRecentSleep.toFixed(1)}h recently.`,
          date: recent3Days[0].date
        });
      }
    }

    // 3. Stress level elevation
    const recentStress = records.slice(0, 3);
    const avgStress = recentStress.reduce((sum, r) => sum + (r.stress_level || 0), 0) / recentStress.length;
    if (avgStress >= 7.0) {
      alerts.push({
        id: `alert-stress-${patientId}`,
        patient_id: patientId,
        patient_name: patientName,
        type: 'threshold',
        severity: 'high',
        title: 'Elevated Autonomic Stress Score',
        message: `Patient self-reported high stress average (${avgStress.toFixed(1)}/10) over consecutive days.`,
        date: records[0].date
      });
    }

    // 4. Medication compliance check
    const treatmentRecords = records.filter(r => r.medication_taken === 1 || r.med_morning === 1 || r.date >= '2026-08-20');
    if (treatmentRecords.length >= 3) {
      let dosesExpected = treatmentRecords.length * 3;
      let dosesTaken = treatmentRecords.reduce((sum, r) => sum + (r.med_morning || 0) + (r.med_afternoon || 0) + (r.med_night || 0), 0);
      const adherence = Math.round((dosesTaken / dosesExpected) * 100);
      if (adherence < 70) {
        alerts.push({
          id: `alert-adherence-${patientId}`,
          patient_id: patientId,
          patient_name: patientName,
          type: 'adherence',
          severity: 'high',
          title: 'Medication Adherence Below 70%',
          message: `Multi-dose compliance rate dropped to ${adherence}%. Multiple missed afternoon/night doses noted.`,
          date: records[0].date
        });
      }
    }
  }

  // If no negative alerts, provide a neutral stability indicator
  if (alerts.length === 0) {
    alerts.push({
      id: `alert-stable-${patientId}`,
      patient_id: patientId,
      patient_name: patientName,
      type: 'trend',
      severity: 'low',
      title: 'Vitals & Adherence Stable',
      message: 'Daily health entries and medication schedule remain within expected baseline parameters.',
      date: '2026-08-27'
    });
  }

  return alerts;
}

// 1. DOCTOR DASHBOARD STATS & OVERVIEW
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    if (!doc) return res.status(404).json({ error: 'Doctor record not found' });

    const todayDate = '2026-08-27';

    // Summary Stat 1: Today's Appointments
    const todayAppointments = queryAll(`
      SELECT a.*, p.current_stage as patient_stage, u.name as patient_name, u.email as patient_email
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ? AND a.date = ?
      ORDER BY a.time ASC
    `, [doc.id, todayDate]);

    // Summary Stat 2: Active Patients assigned to this doctor at this hospital
    const assignedPatients = queryAll(`
      SELECT p.id, p.current_stage, u.name as patient_name, u.email as patient_email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.doctor_id = ? AND p.hospital_id = ?
    `, [doc.id, doc.hospital_id]);

    // Summary Stat 3: Pending Reviews (Patients in Tests or Test Result stage)
    const pendingReviewsCount = assignedPatients.filter(p => 
      p.current_stage === 'Tests' || p.current_stage === 'Test Result' || p.current_stage === 'Diagnosis'
    ).length;

    // Summary Stat 4: New Reports uploaded in active journey
    const newReports = queryAll(`
      SELECT r.*, u.name as patient_name
      FROM medical_reports r
      JOIN patients p ON r.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE p.doctor_id = ? AND p.hospital_id = ?
      ORDER BY r.date DESC
      LIMIT 5
    `, [doc.id, doc.hospital_id]);

    // Summary Stat 5: Patient Alerts across assigned patients
    let allAlerts: any[] = [];
    assignedPatients.forEach(p => {
      const patientAlerts = computePatientAlerts(p.id, p.patient_name);
      allAlerts = allAlerts.concat(patientAlerts);
    });

    const activeAlerts = allAlerts.filter(a => a.severity === 'high' || a.severity === 'medium');

    return res.json({
      doctor: doc,
      stats: {
        todayAppointmentsCount: todayAppointments.length,
        activePatientsCount: assignedPatients.length,
        pendingReviewsCount,
        newReportsCount: newReports.length,
        patientAlertsCount: activeAlerts.length
      },
      todayAppointments,
      alerts: allAlerts,
      recentReports: newReports
    });
  } catch (err: any) {
    console.error('Error fetching doctor dashboard:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. MY PATIENTS LIST (Enforces only patients assigned to Dr. Chen at St. Jude)
router.get('/patients', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });

    // KNOWN SIMPLIFICATION (Cross-hospital consultation / Access Requests):
    // For now, a doctor sees patients who are directly assigned to them (primary doctor at their hospital),
    // as well as patients who have scheduled appointments/consultations with them (e.g. cross-hospital bookings).
    // In production, cross-hospital medical history access will require formal patient-consented Access Requests.
    const patients = queryAll(`
      SELECT p.id, p.user_id, p.date_of_birth, p.gender, p.contact, p.emergency_contact, p.blood_group,
             p.current_stage, p.doctor_id, p.hospital_id, p.medical_history, p.current_conditions, p.allergies,
             u.name, u.email,
             h.name as hospital_name
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN hospitals h ON p.hospital_id = h.id
      WHERE (p.doctor_id = ? AND p.hospital_id = ?)
         OR EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = ?)
      ORDER BY u.name ASC
    `, [doc.id, doc.hospital_id, doc.id]);

    const enrichedPatients = patients.map((p) => {
      // Latest health records
      const records = queryAll(`
        SELECT * FROM daily_health_records WHERE patient_id = ? ORDER BY date DESC
      `, [p.id]);

      const latestRecord = records[0] || null;

      // Recent symptoms
      let recentSymptoms: string[] = [];
      if (latestRecord) {
        const syms = queryAll(`SELECT name, severity FROM symptoms WHERE daily_record_id = ?`, [latestRecord.id]);
        recentSymptoms = syms.map(s => `${s.name} (${s.severity}/10)`);
      }

      // Calculate avg sleep & avg stress
      let avg_sleep = 7.0;
      let avg_stress = 4.0;
      if (records.length > 0) {
        avg_sleep = Number((records.reduce((sum, r) => sum + (r.sleep_hours || 0), 0) / records.length).toFixed(1));
        avg_stress = Number((records.reduce((sum, r) => sum + (r.stress_level || 0), 0) / records.length).toFixed(1));
      }

      // Calculate medication adherence
      const treatmentRecords = records.filter(r => r.medication_taken === 1 || r.med_morning === 1 || r.date >= '2026-08-20');
      let adherence_percent = 88;
      if (treatmentRecords.length > 0) {
        const expected = treatmentRecords.length * 3;
        const taken = treatmentRecords.reduce((sum, r) => sum + (r.med_morning || 0) + (r.med_afternoon || 0) + (r.med_night || 0), 0);
        adherence_percent = Math.round((taken / expected) * 100);
      } else if (p.current_stage === 'Recovery') {
        adherence_percent = 95;
      }

      // Next appointment
      const nextAppt = queryOne(`
        SELECT * FROM appointments 
        WHERE patient_id = ? AND date >= '2026-08-27' AND status = 'upcoming'
        ORDER BY date ASC, time ASC
        LIMIT 1
      `, [p.id]);

      // Last visit date
      const lastAppt = queryOne(`
        SELECT date FROM appointments 
        WHERE patient_id = ? AND date <= '2026-08-27' AND status = 'completed'
        ORDER BY date DESC
        LIMIT 1
      `, [p.id]);

      // Alerts
      const alerts = computePatientAlerts(p.id, p.name);
      const alert_flags = alerts.map(a => a.title);

      return {
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        age: getAge(p.date_of_birth),
        gender: p.gender || 'Not specified',
        date_of_birth: p.date_of_birth,
        contact: p.contact,
        emergency_contact: p.emergency_contact,
        blood_group: p.blood_group,
        current_stage: p.current_stage,
        medical_history: p.medical_history || '',
        current_conditions: p.current_conditions || '',
        allergies: p.allergies || '',
        doctor_id: p.doctor_id,
        doctor_name: doc.doctor_name,
        hospital_id: p.hospital_id,
        hospital_name: p.hospital_name,
        last_visit_date: lastAppt ? lastAppt.date : '2026-08-15',
        next_appointment: nextAppt,
        adherence_percent,
        recent_symptoms: recentSymptoms,
        avg_sleep,
        avg_stress,
        alert_flags,
        active_alerts: alerts
      };
    });

    return res.json({ patients: enrichedPatients });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. PATIENT OVERVIEW & FULL DRILL-DOWN DETAILS
router.get('/patients/:patientId', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { patientId } = req.params;

    // KNOWN SIMPLIFICATION TO NOTE (do not build real access control for this yet):
    // For now, a new doctor at a new hospital will be able to see the patient's full existing journey/history
    // once an appointment exists between them, since the real Access Request approval flow is still a placeholder.
    // NOTE: This is a known simplification to revisit when Access Requests becomes a real feature —
    // real permission-gating and patient consent verification will be implemented then.
    const patient = queryOne(`
      SELECT p.*, u.name, u.email, h.name as hospital_name, h.address as hospital_address, h.phone as hospital_phone
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN hospitals h ON p.hospital_id = h.id
      WHERE (p.id = ? OR p.user_id = ?) 
        AND (
          p.doctor_id = ? 
          OR (p.hospital_id = ? AND ? IS NOT NULL)
          OR EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = ?)
        )
    `, [patientId, patientId, doc?.id, doc?.hospital_id, doc?.hospital_id, doc?.id]);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or no clinical relationship/appointment established.' });
    }

    const canonicalPatientId = patient.id;

    // Attending doctor info
    const attendingDoc = patient.doctor_id ? queryOne(`
      SELECT u.name as doctor_name, d.specialization
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [patient.doctor_id]) : null;

    // All Journeys for this patient
    const journeys = queryAll(`
      SELECT j.*, (SELECT count(*) FROM journey_events ev WHERE ev.journey_id = j.id) as events_count
      FROM journeys j
      WHERE j.patient_id = ?
      ORDER BY j.start_date DESC
    `, [canonicalPatientId]);

    const activeJourney = journeys.find((j: any) => j.status === 'active') || null;
    const requestedJourneyId = req.query.journey_id as string;
    let selectedJourney: any = null;

    if (requestedJourneyId) {
      selectedJourney = journeys.find((j: any) => j.id === requestedJourneyId) || null;
    } else {
      selectedJourney = activeJourney;
    }

    // Journey Events (scoped to selected journey if available, else patient's events)
    let journeyEvents: any[] = [];
    if (selectedJourney) {
      journeyEvents = queryAll(`
        SELECT j.*, u_doc.name as doctor_name, h.name as hospital_name
        FROM journey_events j
        LEFT JOIN doctors d ON j.doctor_id = d.id
        LEFT JOIN users u_doc ON d.user_id = u_doc.id
        LEFT JOIN hospitals h ON j.hospital_id = h.id
        WHERE j.journey_id = ?
        ORDER BY j.date ASC
      `, [selectedJourney.id]);
    } else {
      journeyEvents = queryAll(`
        SELECT j.*, u_doc.name as doctor_name, h.name as hospital_name
        FROM journey_events j
        LEFT JOIN doctors d ON j.doctor_id = d.id
        LEFT JOIN users u_doc ON d.user_id = u_doc.id
        LEFT JOIN hospitals h ON j.hospital_id = h.id
        WHERE j.patient_id = ?
        ORDER BY j.date ASC
      `, [canonicalPatientId]);
    }

    // Attach linked reports and tasks to each journey stage
    const enrichedEvents = journeyEvents.map((ev: any) => {
      const reports = queryAll(`
        SELECT id, name, type, date, file FROM medical_reports 
        WHERE patient_id = ? AND journey_stage = ?
      `, [canonicalPatientId, ev.stage]);

      const tasks = queryAll(`
        SELECT id, title, status, due_date FROM tasks 
        WHERE patient_id = ? AND related_journey_event_id = ?
      `, [canonicalPatientId, ev.id]);

      const notes = queryAll(`
        SELECT * FROM clinical_notes
        WHERE patient_id = ? AND journey_event_id = ?
      `, [canonicalPatientId, ev.id]);

      return {
        ...ev,
        reports,
        tasks,
        notes
      };
    });

    // Daily health records + symptoms
    const records = queryAll(`
      SELECT * FROM daily_health_records 
      WHERE patient_id = ? 
      ORDER BY date DESC
    `, [canonicalPatientId]);

    const enrichedRecords = records.map(r => {
      const syms = queryAll(`SELECT * FROM symptoms WHERE daily_record_id = ?`, [r.id]);
      return {
        ...r,
        symptoms: syms
      };
    });

    const chartData = formatChartData(records);

    // Medical reports
    const reports = queryAll(`
      SELECT r.*, u_doc.name as doctor_name, h.name as hospital_name
      FROM medical_reports r
      LEFT JOIN doctors d ON r.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      LEFT JOIN hospitals h ON r.hospital_id = h.id
      WHERE r.patient_id = ?
      ORDER BY r.date DESC
    `, [canonicalPatientId]);

    // Appointments
    const appointments = queryAll(`
      SELECT a.*, u_doc.name as doctor_name, h.name as hospital_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE a.patient_id = ?
      ORDER BY a.date DESC, a.time ASC
    `, [canonicalPatientId]);

    // Tasks
    const tasks = queryAll(`
      SELECT t.*, j.title as related_journey_title, j.stage as related_journey_stage
      FROM tasks t
      LEFT JOIN journey_events j ON t.related_journey_event_id = j.id
      WHERE t.patient_id = ?
      ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, t.due_date ASC
    `, [canonicalPatientId]);

    // Prescriptions
    const prescriptions = queryAll(`
      SELECT pr.*, u_doc.name as doctor_name
      FROM prescriptions pr
      LEFT JOIN doctors d ON pr.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      WHERE pr.patient_id = ?
      ORDER BY pr.created_at DESC
    `, [canonicalPatientId]);

    // Clinical Notes
    const clinicalNotes = queryAll(`
      SELECT cn.*, u_doc.name as doctor_name, j.title as journey_title, j.stage as journey_stage
      FROM clinical_notes cn
      LEFT JOIN doctors d ON cn.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      LEFT JOIN journey_events j ON cn.journey_event_id = j.id
      WHERE cn.patient_id = ?
      ORDER BY cn.created_at DESC
    `, [canonicalPatientId]);

    // Alerts
    const alerts = computePatientAlerts(canonicalPatientId, patient.name);

    // Compute Analytics Breakdown (7 / 14 / 30 / 90 days)
    const analytics = computeDoctorAnalytics(enrichedRecords);

    // Compute Cross-Analytics Matrix
    const crossAnalytics = computeCrossAnalytics(enrichedRecords);

    // Header Summary Metrics
    const latestHealth = enrichedRecords[0] || null;
    const nextAppt = appointments.find(a => a.status === 'upcoming');
    const lastAppt = appointments.find(a => a.status === 'completed');

    const treatmentRecords = records.filter(r => r.medication_taken === 1 || r.med_morning === 1 || r.date >= '2026-08-20');
    let adherencePercent = 88;
    if (treatmentRecords.length > 0) {
      const exp = treatmentRecords.length * 3;
      const tak = treatmentRecords.reduce((sum, r) => sum + (r.med_morning || 0) + (r.med_afternoon || 0) + (r.med_night || 0), 0);
      adherencePercent = Math.round((tak / exp) * 100);
    } else if (patient.current_stage === 'Recovery') {
      adherencePercent = 95;
    }

    return res.json({
      patient: {
        ...patient,
        id: patient.id,
        gender: patient.gender || 'Not specified',
        current_conditions: patient.current_conditions || 'Under active clinical evaluation',
        medical_history: patient.medical_history || 'No significant prior medical/surgical history documented.',
        allergies: patient.allergies || 'No Known Drug Allergies (NKDA)',
        doctor_name: attendingDoc?.doctor_name || doc?.doctor_name || 'Dr. Sarah Chen, MD',
        hospital_name: patient.hospital_name || 'St. Jude Medical Center',
        age: getAge(patient.date_of_birth),
        adherence_percent: adherencePercent,
        last_consultation: lastAppt ? lastAppt.date : '2026-08-15',
        next_follow_up: nextAppt ? `${nextAppt.date} (${nextAppt.time})` : (appointments.length > 0 ? `${appointments[0].date} (${appointments[0].time})` : 'None scheduled'),
        avg_sleep: analytics['14d']?.sleep?.average || 6.5,
        avg_stress: analytics['14d']?.stress?.average || 5.2,
        recent_symptoms: latestHealth?.symptoms?.map((s: any) => `${s.name} (${s.severity}/10)`) || []
      },
      journeys,
      activeJourney,
      selectedJourney,
      journeyEvents: enrichedEvents,
      dailyHealthRecords: enrichedRecords,
      chartData,
      reports,
      appointments,
      tasks,
      prescriptions,
      clinicalNotes,
      alerts,
      analytics,
      crossAnalytics
    });
  } catch (err: any) {
    console.error('Error fetching patient overview:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Helper to format daily health records for longitudinal charts
function formatChartData(records: any[]) {
  // Sort ascending by date for charts
  const sorted = [...records].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return sorted.map((rec: any) => {
    const symptoms = queryAll(`SELECT * FROM symptoms WHERE daily_record_id = ?`, [rec.id]);
    const headache = symptoms.find((s: any) => s.name?.toLowerCase().includes('headache'))?.severity || 0;
    const fatigue = symptoms.find((s: any) => s.name?.toLowerCase().includes('fatigue'))?.severity || 0;
    const palpitations = symptoms.find((s: any) => s.name?.toLowerCase().includes('palpitation'))?.severity || 0;
    const maxSymptomSeverity = symptoms.reduce((max: number, s: any) => Math.max(max, s.severity || 0), 0);

    const medM = rec.med_morning === 1 ? 1 : 0;
    const medA = rec.med_afternoon === 1 ? 1 : 0;
    const medN = rec.med_night === 1 ? 1 : 0;
    const dosesTaken = medM + medA + medN;
    const isPrescribedDay = rec.date >= '2026-08-20' || rec.medication_taken === 1 || dosesTaken > 0;
    const dayAdherenceRate = isPrescribedDay ? Math.round((dosesTaken / 3) * 100) : (rec.medication_taken === 1 ? 100 : 0);

    // Format date consistently without timezone shift
    let formattedDate = rec.date;
    try {
      const [year, month, day] = rec.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      formattedDate = rec.date;
    }

    return {
      id: rec.id,
      date: rec.date,
      formattedDate,
      sleep: rec.sleep_hours != null ? Number(rec.sleep_hours) : 0,
      sleepQuality: rec.sleep_quality || 'Good',
      stress: rec.stress_level != null ? Number(rec.stress_level) : 0,
      exercise: rec.exercise_minutes != null ? Number(rec.exercise_minutes) : 0,
      water: rec.water_intake != null ? Number(rec.water_intake) : 0,
      mealCount: rec.meal_count != null ? Number(rec.meal_count) : 3,
      medicationTaken: rec.medication_taken === 1 || dosesTaken > 0,
      medMorning: medM,
      medAfternoon: medA,
      medNight: medN,
      dosesTaken,
      dayAdherenceRate,
      isPrescribedDay,
      headacheSeverity: headache,
      fatigueSeverity: fatigue,
      palpitationSeverity: palpitations,
      overallSeverity: maxSymptomSeverity,
      mood: rec.mood || 'Good',
      notes: rec.notes || '',
      symptoms
    };
  });
}

// GET /api/doctor/patients/:patientId/health-analytics
// Real endpoint returning full longitudinal chart series, summary metrics, period stats, and cross-analytics
router.get('/patients/:patientId/health-analytics', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });

    const { patientId } = req.params;

    const patient = queryOne(`
      SELECT p.*, u.name, u.email, h.name as hospital_name
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN hospitals h ON p.hospital_id = h.id
      WHERE p.id = ? AND (p.doctor_id = ? OR p.hospital_id = ? OR EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = ?))
    `, [patientId, doc.id, doc.hospital_id, doc.id]);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found or unauthorized' });
    }

    const records = queryAll(`
      SELECT * FROM daily_health_records 
      WHERE patient_id = ? 
      ORDER BY date ASC
    `, [patientId]);

    const chartData = formatChartData(records);

    // Compute aggregate correlation stats
    const totalDays = chartData.length;
    const highStressDays = chartData.filter(d => d.stress >= 7);
    const highStressWithSevereSymptoms = highStressDays.filter(d => d.headacheSeverity >= 6 || d.palpitationSeverity >= 6);
    const lowSleepDays = chartData.filter(d => d.sleep < 6);
    const correlationScore = highStressDays.length > 0
      ? Math.round((highStressWithSevereSymptoms.length / highStressDays.length) * 100)
      : 0;

    const avgSleepPreMed = chartData.slice(0, 7).reduce((acc, d) => acc + d.sleep, 0) / Math.max(1, Math.min(7, totalDays));
    const avgSleepRecent = chartData.slice(-4).reduce((acc, d) => acc + d.sleep, 0) / Math.max(1, Math.min(4, totalDays));

    const treatmentDays = chartData.filter(d => d.isPrescribedDay);
    const totalExpectedDoses = treatmentDays.length * 3;
    const totalActualDoses = treatmentDays.reduce((acc, d) => acc + d.dosesTaken, 0);
    const overallMedicationAdherence = totalExpectedDoses > 0 
      ? Math.round((totalActualDoses / totalExpectedDoses) * 100)
      : 88;

    const metrics = {
      totalLoggedDays: totalDays,
      stressSymptomCorrelationPercent: correlationScore,
      lowSleepDaysCount: lowSleepDays.length,
      highStressDaysCount: highStressDays.length,
      avgSleepPreTreatment: Number(avgSleepPreMed.toFixed(1)),
      avgSleepRecent: Number(avgSleepRecent.toFixed(1)),
      overallMedicationAdherence,
      totalDosesTaken: totalActualDoses,
      totalDosesExpected: totalExpectedDoses,
      treatmentDaysCount: treatmentDays.length,
      clinicalSummary: `Patient records reveal an ${correlationScore}% correlation between elevated stress (score ≥7/10) / sleep deficit (<6 hrs) and acute symptoms. Observable clinical stabilization is noted alongside therapeutic compliance.`
    };

    const recordsDesc = [...records].reverse();
    const analytics = computeDoctorAnalytics(recordsDesc);
    const crossAnalytics = computeCrossAnalytics(recordsDesc.map(r => ({
      ...r,
      symptoms: queryAll(`SELECT * FROM symptoms WHERE daily_record_id = ?`, [r.id])
    })));

    return res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        current_stage: patient.current_stage,
        blood_group: patient.blood_group,
        age: getAge(patient.date_of_birth)
      },
      chartData,
      metrics,
      analytics,
      crossAnalytics
    });
  } catch (err: any) {
    console.error('Error fetching doctor health analytics:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Deterministic Analytics Calculation Helper
function computeDoctorAnalytics(records: any[]) {
  const getPeriodStats = (daysCount: number) => {
    const subset = records.slice(0, daysCount);
    if (subset.length === 0) return null;

    // Sleep
    const sleepVals = subset.map(r => r.sleep_hours || 0);
    const avgSleep = Number((sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1));
    const minSleep = Math.min(...sleepVals);
    const maxSleep = Math.max(...sleepVals);
    const goodQualityCount = subset.filter(r => r.sleep_quality === 'Good' || r.sleep_quality === 'Excellent').length;
    const sleepQualityPct = Math.round((goodQualityCount / subset.length) * 100);

    // Sleep Trend (compare first half vs second half)
    const mid = Math.floor(subset.length / 2);
    const recentSleep = subset.slice(0, mid);
    const olderSleep = subset.slice(mid);
    const recentSleepAvg = recentSleep.length > 0 ? recentSleep.reduce((a, b) => a + (b.sleep_hours || 0), 0) / recentSleep.length : avgSleep;
    const olderSleepAvg = olderSleep.length > 0 ? olderSleep.reduce((a, b) => a + (b.sleep_hours || 0), 0) / olderSleep.length : avgSleep;
    const sleepTrend = recentSleepAvg >= olderSleepAvg ? 'up' : 'down';

    // Activity
    const actVals = subset.map(r => r.exercise_minutes || 0);
    const avgActivity = Math.round(actVals.reduce((a, b) => a + b, 0) / actVals.length);
    const actTrend = subset[0]?.exercise_minutes >= (subset[subset.length - 1]?.exercise_minutes || 0) ? 'up' : 'down';

    // Hydration
    const hydVals = subset.map(r => r.water_intake || 0);
    const avgHydration = Number((hydVals.reduce((a, b) => a + b, 0) / hydVals.length).toFixed(1));
    const hydTrend = avgHydration >= 7.0 ? 'up' : 'down';

    // Stress
    const stressVals = subset.map(r => r.stress_level || 0);
    const avgStress = Number((stressVals.reduce((a, b) => a + b, 0) / stressVals.length).toFixed(1));
    const maxStress = Math.max(...stressVals);
    const minStress = Math.min(...stressVals);
    const recentStressAvg = recentSleep.length > 0 ? recentSleep.reduce((a, b) => a + (b.stress_level || 0), 0) / recentSleep.length : avgStress;
    const olderStressAvg = olderSleep.length > 0 ? olderSleep.reduce((a, b) => a + (b.stress_level || 0), 0) / olderSleep.length : avgStress;
    const stressTrend = recentStressAvg <= olderStressAvg ? 'down' : 'up'; // down stress is improving

    // Medication Adherence
    const medExpected = subset.length * 3;
    const medTaken = subset.reduce((sum, r) => sum + (r.med_morning || 0) + (r.med_afternoon || 0) + (r.med_night || 0), 0);
    const medPct = Math.round((medTaken / medExpected) * 100);

    // Symptoms Trend Per Symptom
    const symptomMap: { [key: string]: { date: string; severity: number }[] } = {};
    subset.forEach(r => {
      if (r.symptoms) {
        r.symptoms.forEach((s: any) => {
          if (!symptomMap[s.name]) symptomMap[s.name] = [];
          symptomMap[s.name].push({ date: r.date, severity: s.severity });
        });
      }
    });

    return {
      periodDays: daysCount,
      recordCount: subset.length,
      sleep: {
        average: avgSleep,
        min: minSleep,
        max: maxSleep,
        qualityPercent: sleepQualityPct,
        trend: sleepTrend
      },
      activity: {
        averageMinutes: avgActivity,
        activityLevel: avgActivity >= 30 ? 'Active' : avgActivity >= 15 ? 'Moderate' : 'Low',
        trend: actTrend
      },
      hydration: {
        averageIntake: avgHydration,
        dailyVariation: '± 1.2 glasses',
        trend: hydTrend
      },
      stress: {
        average: avgStress,
        highest: maxStress,
        lowest: minStress,
        trend: stressTrend,
        elevatedFlag: avgStress >= 6.5
      },
      medicationAdherence: {
        percent: medPct,
        dosesTaken: medTaken,
        dosesMissed: Math.max(0, medExpected - medTaken),
        dosesTotal: medExpected
      },
      symptoms: symptomMap
    };
  };

  return {
    '7d': getPeriodStats(7),
    '14d': getPeriodStats(14),
    '30d': getPeriodStats(30) || getPeriodStats(14),
    '90d': getPeriodStats(90) || getPeriodStats(14),
  };
}

// 5. CROSS-ANALYTICS ENGINE (Deterministic correlation over seeded data)
// Uses clear non-causal labeling: "Observed correlation. Requires clinical evaluation."
function computeCrossAnalytics(records: any[]) {
  // Extract tuples: sleep, stress, hydration, exercise, headache, fatigue, palpitations, med_adherence
  const dataPoints = records.map(r => {
    const headacheSym = r.symptoms?.find((s: any) => s.name === 'Headache');
    const fatigueSym = r.symptoms?.find((s: any) => s.name === 'Fatigue');
    const palpSym = r.symptoms?.find((s: any) => s.name === 'Heart Palpitations');
    const dosesTakenToday = (r.med_morning || 0) + (r.med_afternoon || 0) + (r.med_night || 0);

    return {
      date: r.date,
      sleep: r.sleep_hours || 0,
      stress: r.stress_level || 0,
      hydration: r.water_intake || 0,
      exercise: r.exercise_minutes || 0,
      headache: headacheSym ? headacheSym.severity : 0,
      fatigue: fatigueSym ? fatigueSym.severity : 0,
      palpitations: palpSym ? palpSym.severity : 0,
      medDoses: dosesTakenToday
    };
  });

  return {
    dataPoints,
    disclaimer: 'Observed correlation across recorded patient journal entries. Requires clinical evaluation and does not establish medical causation.',
    variables: [
      { id: 'sleep', label: 'Sleep Duration (Hours)' },
      { id: 'stress', label: 'Stress Index (1-10)' },
      { id: 'hydration', label: 'Hydration Intake (Glasses)' },
      { id: 'exercise', label: 'Physical Exercise (Minutes)' },
      { id: 'headache', label: 'Headache Severity (1-10)' },
      { id: 'fatigue', label: 'Fatigue Severity (1-10)' },
      { id: 'palpitations', label: 'Palpitations Severity (1-10)' },
      { id: 'medDoses', label: 'Medication Doses Taken (0-3)' }
    ]
  };
}

// 6. DOCTOR ACTIONS (Synchronized with real patient data)

// Add a new journey event
router.post('/patients/:patientId/journey', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { patientId } = req.params;
    const { stage, title, description, date, status, next_step, clinical_note, doctor_plan, clinical_follow_up, journey_id, start_new_journey, new_journey_title } = req.body;

    if (!stage || !title || !date) {
      return res.status(400).json({ error: 'Stage, title and date are required' });
    }

    let targetJourneyId = journey_id;

    if (start_new_journey) {
      // If patient has an existing active journey, resolve it
      const currentActive = queryOne(`SELECT * FROM journeys WHERE patient_id = ? AND status = 'active' LIMIT 1`, [patientId]);
      if (currentActive) {
        execute(`UPDATE journeys SET status = 'resolved', end_date = ? WHERE id = ?`, [date, currentActive.id]);
      }
      targetJourneyId = `journey-${uuidv4().substring(0, 8)}`;
      execute(`
        INSERT INTO journeys (id, patient_id, title, status, start_date)
        VALUES (?, ?, ?, 'active', ?)
      `, [targetJourneyId, patientId, new_journey_title || title, date]);
    } else if (!targetJourneyId) {
      // Find active journey or auto-create one
      const currentActive = queryOne(`SELECT * FROM journeys WHERE patient_id = ? AND status = 'active' LIMIT 1`, [patientId]);
      if (currentActive) {
        targetJourneyId = currentActive.id;
      } else {
        targetJourneyId = `journey-${uuidv4().substring(0, 8)}`;
        execute(`
          INSERT INTO journeys (id, patient_id, title, status, start_date)
          VALUES (?, ?, ?, 'active', ?)
        `, [targetJourneyId, patientId, title, date]);
      }
    }

    const eventId = uuidv4();
    execute(`
      INSERT INTO journey_events (id, patient_id, journey_id, stage, title, description, date, status, doctor_id, hospital_id, next_step, clinical_note, doctor_plan, clinical_follow_up)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId,
      patientId,
      targetJourneyId,
      stage,
      title,
      description || '',
      date,
      status || 'upcoming',
      doc?.id || 'doc-chen-stjude',
      doc?.hospital_id || 'hosp-stjude',
      next_step || '',
      clinical_note || '',
      doctor_plan || '',
      clinical_follow_up || ''
    ]);

    // If status is current, update patient's current_stage
    if (status === 'current') {
      execute(`UPDATE patients SET current_stage = ? WHERE id = ?`, [stage, patientId]);
    }

    // Also record clinical note in clinical_notes table if provided
    if (clinical_note || doctor_plan) {
      execute(`
        INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(),
        patientId,
        doc?.id || 'doc-chen-stjude',
        eventId,
        `${stage} Milestone Clinical Assessment`,
        clinical_note || title,
        doctor_plan || '',
        clinical_follow_up || date
      ]);
    }

    return res.status(201).json({ success: true, eventId, journeyId: targetJourneyId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Resolve a patient's care journey
router.post('/patients/:patientId/journey/resolve', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { patientId } = req.params;
    const { journey_id, end_date, clinical_summary } = req.body;

    const resolvedDate = end_date || new Date().toISOString().split('T')[0];

    let targetJourney: any = null;
    if (journey_id) {
      targetJourney = queryOne(`SELECT * FROM journeys WHERE id = ? AND patient_id = ?`, [journey_id, patientId]);
    } else {
      targetJourney = queryOne(`SELECT * FROM journeys WHERE patient_id = ? AND status = 'active' LIMIT 1`, [patientId]);
    }

    if (!targetJourney) {
      return res.status(404).json({ error: 'No active care journey found to resolve' });
    }

    execute(`
      UPDATE journeys
      SET status = 'resolved', end_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [resolvedDate, targetJourney.id]);

    execute(`
      UPDATE journey_events
      SET status = 'completed'
      WHERE journey_id = ? AND status = 'current'
    `, [targetJourney.id]);

    execute(`UPDATE patients SET current_stage = 'Resolved' WHERE id = ?`, [patientId]);

    // Send patient notification
    execute(`
      INSERT INTO notifications (id, patient_id, title, message, type, is_read, action_tab, created_at)
      VALUES (?, ?, ?, ?, 'journey', 0, 'journey', CURRENT_TIMESTAMP)
    `, [
      uuidv4(),
      patientId,
      'Care Journey Resolved',
      `Dr. ${doc?.name || 'Your care team'} marked your care journey "${targetJourney.title}" as resolved.${clinical_summary ? ' Note: ' + clinical_summary : ''}`
    ]);

    return res.json({ success: true, message: `Care journey "${targetJourney.title}" resolved.`, journeyId: targetJourney.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Add clinical note to a journey event
router.post('/patients/:patientId/journey/:eventId/note', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { patientId, eventId } = req.params;
    const { clinical_note, doctor_plan, clinical_follow_up } = req.body;

    if (!clinical_note) {
      return res.status(400).json({ error: 'Clinical note text is required' });
    }

    // Update journey_events table
    execute(`
      UPDATE journey_events
      SET clinical_note = ?, doctor_plan = ?, clinical_follow_up = ?
      WHERE id = ? AND patient_id = ?
    `, [clinical_note, doctor_plan || '', clinical_follow_up || '', eventId, patientId]);

    // Insert into clinical_notes table
    execute(`
      INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      patientId,
      doc?.id || 'doc-chen-stjude',
      eventId,
      'Doctor Milestone Clinical Note',
      clinical_note,
      doctor_plan || '',
      clinical_follow_up || ''
    ]);

    return res.json({ success: true, message: 'Clinical note synchronized to journey event.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Add general clinical note
router.post('/patients/:patientId/clinical-notes', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { patientId } = req.params;
    const { title, note, plan, follow_up_date, journey_event_id } = req.body;

    if (!title || !note) {
      return res.status(400).json({ error: 'Title and note are required' });
    }

    const noteId = uuidv4();
    execute(`
      INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      noteId,
      patientId,
      doc?.id || 'doc-chen-stjude',
      journey_event_id || null,
      title,
      note,
      plan || '',
      follow_up_date || ''
    ]);

    return res.status(201).json({ success: true, noteId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Add or update medication prescription (Doctor view -> synced to patient view)
router.post('/patients/:patientId/prescriptions', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { patientId } = req.params;
    const { name, dosage, frequency, duration, instructions } = req.body;

    if (!name || !dosage || !frequency) {
      return res.status(400).json({ error: 'Medication name, dosage, and frequency are required' });
    }

    const presId = uuidv4();
    execute(`
      INSERT INTO prescriptions (id, patient_id, doctor_id, name, dosage, frequency, duration, instructions, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      presId,
      patientId,
      doc?.id || 'doc-chen-stjude',
      name,
      dosage,
      frequency,
      duration || '30 days',
      instructions || ''
    ]);

    return res.status(201).json({ success: true, prescriptionId: presId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update prescription status
router.patch('/prescriptions/:id', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { id } = req.params;
    const { status, dosage, instructions } = req.body;

    if (status) {
      execute(`UPDATE prescriptions SET status = ? WHERE id = ?`, [status, id]);
    }
    if (dosage) {
      execute(`UPDATE prescriptions SET dosage = ? WHERE id = ?`, [dosage, id]);
    }
    if (instructions) {
      execute(`UPDATE prescriptions SET instructions = ? WHERE id = ?`, [instructions, id]);
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Create task for patient (Doctor creates -> appears in patient's task list)
router.post('/patients/:patientId/tasks', async (req: Request, res: Response) => {
  try {
    await getDb();
    const { patientId } = req.params;
    const { title, due_date, related_journey_event_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const taskId = uuidv4();
    execute(`
      INSERT INTO tasks (id, patient_id, title, status, related_journey_event_id, due_date)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `, [
      taskId,
      patientId,
      title,
      related_journey_event_id || null,
      due_date || null
    ]);

    return res.status(201).json({ success: true, taskId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Doctor Appointment management
router.get('/appointments', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });

    const appointments = queryAll(`
      SELECT a.*, p.current_stage as patient_stage, u.name as patient_name, u.email as patient_email, h.name as hospital_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE a.doctor_id = ?
      ORDER BY a.date ASC, a.time ASC
    `, [doc.id]);

    return res.json({ appointments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Doctor schedules new appointment
router.post('/appointments', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { patient_id, date, time, purpose, notes, related_journey_event_id } = req.body;

    if (!patient_id || !date || !time || !purpose) {
      return res.status(400).json({ error: 'Patient ID, date, time, and purpose are required' });
    }

    const apptId = uuidv4();
    execute(`
      INSERT INTO appointments (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes, related_journey_event_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?)
    `, [
      apptId,
      patient_id,
      doc?.id || 'doc-chen-stjude',
      doc?.hospital_id || 'hosp-stjude',
      date,
      time,
      purpose,
      notes || '',
      related_journey_event_id || null
    ]);

    return res.status(201).json({ success: true, apptId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update appointment status
router.patch('/appointments/:id', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { id } = req.params;
    const { status, notes } = req.body;

    const existingAppt = queryOne(`
      SELECT a.*, u_doc.name as doctor_name, u_pat.name as patient_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users u_pat ON p.user_id = u_pat.id
      WHERE a.id = ?
    `, [id]);

    if (!existingAppt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (status) {
      execute(`UPDATE appointments SET status = ? WHERE id = ?`, [status, id]);
    }
    if (notes !== undefined) {
      execute(`UPDATE appointments SET notes = ? WHERE id = ?`, [notes, id]);
    }

    // Send notifications to the patient regarding their consultation status update
    try {
      const doctorDisplayName = existingAppt.doctor_name || doc?.doctor_name || 'Your Doctor';
      if (status === 'confirmed' || status === 'upcoming') {
        execute(`
          INSERT INTO notifications (id, patient_id, title, message, type, is_read, action_tab, created_at)
          VALUES (?, ?, ?, ?, 'appointment', 0, 'appointments', CURRENT_TIMESTAMP)
        `, [
          uuidv4(),
          existingAppt.patient_id,
          'Consultation Confirmed',
          `${doctorDisplayName} has accepted and confirmed your consultation for ${existingAppt.date} at ${existingAppt.time}.`
        ]);
      } else if (status === 'cancelled') {
        execute(`
          INSERT INTO notifications (id, patient_id, title, message, type, is_read, action_tab, created_at)
          VALUES (?, ?, ?, ?, 'appointment', 0, 'appointments', CURRENT_TIMESTAMP)
        `, [
          uuidv4(),
          existingAppt.patient_id,
          'Consultation Request Declined',
          `Your appointment request for ${existingAppt.date} at ${existingAppt.time} was cancelled or declined by ${doctorDisplayName}.`
        ]);
      } else if (status === 'completed') {
        execute(`
          INSERT INTO notifications (id, patient_id, title, message, type, is_read, action_tab, created_at)
          VALUES (?, ?, ?, ?, 'appointment', 0, 'appointments', CURRENT_TIMESTAMP)
        `, [
          uuidv4(),
          existingAppt.patient_id,
          'Consultation Completed',
          `Your consultation on ${existingAppt.date} with ${doctorDisplayName} has been marked as completed.`
        ]);
      }
    } catch (notifErr) {
      console.warn('Failed to insert patient status notification:', notifErr);
    }

    return res.json({ success: true, id, status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Upload / attach medical report
router.post('/patients/:patientId/reports', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const { patientId } = req.params;
    const { name, type, date, file, journey_stage } = req.body;

    if (!name || !date || !journey_stage) {
      return res.status(400).json({ error: 'Report name, date, and journey stage are required' });
    }

    const reportId = uuidv4();
    execute(`
      INSERT INTO medical_reports (id, patient_id, doctor_id, hospital_id, name, type, date, file, journey_stage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reportId,
      patientId,
      doc?.id || 'doc-chen-stjude',
      doc?.hospital_id || 'hosp-stjude',
      name,
      type || 'PDF',
      date,
      file || `${name.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      journey_stage
    ]);

    return res.status(201).json({ success: true, reportId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CONSULTATIONS (Cross-Patient Clinical Records)
// ==========================================
router.get('/consultations', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';

    const consultations = queryAll(`
      SELECT 
        cn.id,
        cn.patient_id,
        cn.doctor_id,
        cn.journey_event_id,
        cn.title,
        cn.note,
        cn.plan,
        cn.follow_up_date,
        cn.created_at,
        u.name as patient_name,
        u.email as patient_email,
        p.date_of_birth,
        p.blood_group,
        p.current_stage as patient_current_stage,
        j.stage as journey_stage,
        j.title as journey_title,
        j.date as journey_date,
        j.status as journey_status,
        u_doc.name as doctor_name,
        h.name as hospital_name
      FROM clinical_notes cn
      JOIN patients p ON cn.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN doctors d ON cn.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      LEFT JOIN hospitals h ON d.hospital_id = h.id
      LEFT JOIN journey_events j ON cn.journey_event_id = j.id
      WHERE cn.doctor_id = ?
      ORDER BY COALESCE(j.date, cn.created_at) DESC
    `, [doctorId]);

    return res.json({ consultations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/consultations', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';
    const { patient_id, title, note, plan, follow_up_date, journey_event_id, journey_stage, date } = req.body;

    if (!patient_id || !title || !note) {
      return res.status(400).json({ error: 'Patient ID, consultation title, and clinical note are required' });
    }

    let eventId = journey_event_id;
    if (!eventId && journey_stage) {
      const targetEvent = queryOne(`
        SELECT id FROM journey_events WHERE patient_id = ? AND stage = ? LIMIT 1
      `, [patient_id, journey_stage]);
      if (targetEvent) {
        eventId = targetEvent.id;
      }
    }

    const noteId = uuidv4();
    execute(`
      INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      noteId,
      patient_id,
      doctorId,
      eventId || null,
      title,
      note,
      plan || null,
      follow_up_date || null
    ]);

    // If follow_up_date is provided and no appointment exists for that day, optionally schedule follow-up
    if (follow_up_date) {
      const existingAppt = queryOne(`
        SELECT id FROM appointments WHERE patient_id = ? AND date = ?
      `, [patient_id, follow_up_date]);
      if (!existingAppt) {
        execute(`
          INSERT INTO appointments (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(),
          patient_id,
          doctorId,
          doc?.hospital_id || 'hosp-stjude',
          follow_up_date,
          '10:30 AM',
          `Clinical Follow-Up: ${title}`,
          'upcoming',
          `Follow-up consultation scheduled from clinical plan: ${plan || 'Routine review'}`
        ]);
      }
    }

    return res.status(201).json({ success: true, noteId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DOCTOR NOTIFICATIONS
// ==========================================
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';

    const notifications = queryAll(`
      SELECT 
        dn.*,
        p.current_stage as patient_stage
      FROM doctor_notifications dn
      LEFT JOIN patients p ON dn.patient_id = p.id
      WHERE dn.doctor_id = ?
      ORDER BY dn.created_at DESC
    `, [doctorId]);

    const unreadCount = notifications.filter((n: any) => !n.is_read).length;

    return res.json({ notifications, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';
    const { id } = req.params;
    const { is_read } = req.body;

    execute(`
      UPDATE doctor_notifications 
      SET is_read = ? 
      WHERE id = ? AND doctor_id = ?
    `, [is_read ? 1 : 0, id, doctorId]);

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/notifications/mark-all-read', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';

    execute(`
      UPDATE doctor_notifications 
      SET is_read = 1 
      WHERE doctor_id = ?
    `, [doctorId]);

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications/:id', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';
    const { id } = req.params;

    execute(`
      DELETE FROM doctor_notifications 
      WHERE id = ? AND doctor_id = ?
    `, [id, doctorId]);

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DOCTOR PROFILE & SETTINGS
// ==========================================
router.get('/profile', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';

    const profile = queryOne(`
      SELECT 
        d.id,
        d.user_id,
        d.hospital_id,
        d.specialization,
        d.license_number,
        d.is_active,
        u.name,
        u.email,
        h.name as hospital_name,
        h.address as hospital_address,
        h.phone as hospital_phone
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN hospitals h ON d.hospital_id = h.id
      WHERE d.id = ?
    `, [doctorId]);

    if (!profile) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    return res.json({
      profile: {
        ...profile,
        phone: '+1 (555) 234-5678 ext 402',
        office: 'Suite 400, East Wing Cardiology Clinic',
        department: 'Department of Cardiovascular Medicine & Electrophysiology',
        bio: 'Board-certified cardiologist specializing in preventive cardiology, cardiac arrhythmia management, and integrative recovery protocols at St. Jude Medical Center.'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';
    const { name, specialization, license_number } = req.body;

    if (name) {
      const doctorRow = queryOne('SELECT user_id FROM doctors WHERE id = ?', [doctorId]);
      if (doctorRow) {
        execute('UPDATE users SET name = ? WHERE id = ?', [name, doctorRow.user_id]);
      }
    }

    if (specialization || license_number) {
      execute(`
        UPDATE doctors 
        SET specialization = COALESCE(?, specialization),
            license_number = COALESCE(?, license_number)
        WHERE id = ?
      `, [specialization || null, license_number || null, doctorId]);
    }

    return res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', async (req: Request, res: Response) => {
  try {
    await getDb();
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const userRow = queryOne('SELECT * FROM users WHERE id = ?', [user.id]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, userRow.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CROSS-PATIENT DIAGNOSTIC REPORTS & TASKS
// ==========================================
router.get('/reports', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';

    const reports = queryAll(`
      SELECT 
        mr.*,
        u.name as patient_name,
        p.current_stage as patient_stage,
        p.date_of_birth,
        h.name as hospital_name
      FROM medical_reports mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN hospitals h ON mr.hospital_id = h.id
      WHERE mr.doctor_id = ?
      ORDER BY mr.date DESC
    `, [doctorId]);

    return res.json({ reports });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/tasks', async (req: Request, res: Response) => {
  try {
    await getDb();
    const doc = getDoctorInfo(req);
    const doctorId = doc?.id || 'doc-chen-stjude';

    const tasks = queryAll(`
      SELECT 
        t.*,
        u.name as patient_name,
        p.current_stage as patient_stage,
        j.stage as journey_stage,
        j.title as journey_title
      FROM tasks t
      JOIN patients p ON t.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN journey_events j ON t.related_journey_event_id = j.id
      WHERE p.doctor_id = ?
      ORDER BY 
        CASE t.status 
          WHEN 'pending' THEN 1 
          WHEN 'overdue' THEN 2 
          ELSE 3 
        END,
        t.due_date ASC
    `, [doctorId]);

    return res.json({ tasks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
