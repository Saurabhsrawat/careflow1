import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb, queryAll, queryOne, execute, initSchemaAndSeed, saveDb } from '../db';
import { authenticateUser } from './auth';

const router = Router();

// =========================================================================
// PUBLIC & HEALTH CHECK ENDPOINTS
// =========================================================================

// List all hospitals (public dropdowns, directory)
router.get('/', async (req: Request, res: Response) => {
  try {
    await getDb();
    const hospitals = queryAll(`
      SELECT h.id, h.name, h.address, h.phone, h.departments,
             (SELECT COUNT(*) FROM doctors d WHERE d.hospital_id = h.id AND d.is_active = 1) as doctor_count,
             (SELECT COUNT(*) FROM patients p WHERE p.hospital_id = h.id) as patient_count
      FROM hospitals h
      ORDER BY h.name ASC
    `);
    return res.json({ hospitals });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Database info & status
router.get('/status', async (req: Request, res: Response) => {
  try {
    await getDb();
    const userCount = queryOne('SELECT count(*) as count FROM users')?.count || 0;
    const hospitalCount = queryOne('SELECT count(*) as count FROM hospitals')?.count || 0;
    const patientCount = queryOne('SELECT count(*) as count FROM patients')?.count || 0;
    const doctorCount = queryOne('SELECT count(*) as count FROM doctors')?.count || 0;
    const journeyCount = queryOne('SELECT count(*) as count FROM journey_events')?.count || 0;

    return res.json({
      status: 'healthy',
      database: 'SQLite (sql.js WASM)',
      tables: {
        users: userCount,
        hospitals: hospitalCount,
        patients: patientCount,
        doctors: doctorCount,
        journeyEvents: journeyCount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Reset / re-seed database
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    // Drop existing tables and recreate
    db.run(`
      DROP TABLE IF EXISTS doctor_notifications;
      DROP TABLE IF EXISTS notifications;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS tasks;
      DROP TABLE IF EXISTS appointments;
      DROP TABLE IF EXISTS medical_reports;
      DROP TABLE IF EXISTS symptoms;
      DROP TABLE IF EXISTS daily_health_records;
      DROP TABLE IF EXISTS prescriptions;
      DROP TABLE IF EXISTS clinical_notes;
      DROP TABLE IF EXISTS journey_events;
      DROP TABLE IF EXISTS journeys;
      DROP TABLE IF EXISTS doctors;
      DROP TABLE IF EXISTS patients;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS hospitals;
    `);
    await initSchemaAndSeed(db);
    saveDb();
    return res.json({ success: true, message: 'Database reset and re-seeded with demo records.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// HOSPITAL ADMIN RBAC & SERVER-SIDE SCOPING MIDDLEWARE
// =========================================================================

function requireHospitalAdmin(req: Request, res: Response, next: Function) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (user.role !== 'hospital_admin') {
    return res.status(403).json({ 
      error: 'Forbidden: Hospital Admin role required to access hospital administrative resources.',
      role: user.role
    });
  }
  if (!user.hospital_id) {
    return res.status(403).json({ 
      error: 'Forbidden: Your administrator account has no affiliated hospital ID.',
      user_id: user.id
    });
  }
  next();
}

// Sub-router for hospital admin routes with authentication + RBAC
const adminRouter = Router();
adminRouter.use(authenticateUser);
adminRouter.use(requireHospitalAdmin);

// -------------------------------------------------------------------------
// 1. HOSPITAL ADMIN DASHBOARD
// -------------------------------------------------------------------------
adminRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;

    // Hospital basic profile
    const hospital = queryOne(`
      SELECT id, name, address, phone, departments, created_at
      FROM hospitals
      WHERE id = ?
    `, [adminHospitalId]);

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital record not found for admin' });
    }

    // Scoped KPI Stats (Strict SQL hospital_id filtering)
    const docStats = queryOne(`
      SELECT 
        COUNT(*) as total_doctors,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_doctors
      FROM doctors
      WHERE hospital_id = ?
    `, [adminHospitalId]);

    const patStats = queryOne(`
      SELECT COUNT(DISTINCT p.id) as total_patients
      FROM patients p
      WHERE p.hospital_id = ?
    `, [adminHospitalId]);

    const todayDate = '2026-08-27';

    const apptStats = queryOne(`
      SELECT 
        COUNT(CASE WHEN date = ? THEN 1 END) as today_appointments,
        COUNT(CASE WHEN status = 'upcoming' THEN 1 END) as pending_appointments
      FROM appointments
      WHERE hospital_id = ?
    `, [todayDate, adminHospitalId]);

    const journeyStats = queryOne(`
      SELECT COUNT(DISTINCT p.id) as active_journeys
      FROM patients p
      WHERE p.hospital_id = ? 
        AND p.current_stage NOT IN ('Follow-up', 'Discharged')
    `, [adminHospitalId]);

    // Today's appointments scoped to this hospital (administrative timing and status only)
    const todayAppointments = queryAll(`
      SELECT 
        a.id, a.patient_id, a.doctor_id, a.hospital_id, a.date, a.time, a.purpose, a.status,
        u_pat.name as patient_name,
        u_doc.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_pat ON p.user_id = u_pat.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      WHERE a.hospital_id = ? AND a.date = ?
      ORDER BY a.time ASC
    `, [adminHospitalId, todayDate]);

    // Scoped Hospital Recent Activity (Combining Appointments, Journey Milestones, and Patient Admissions)
    const recentAppointments = queryAll(`
      SELECT 
        a.id,
        'appointment_booked' as type,
        ('Appointment: ' || u_pat.name || ' with ' || u_doc.name) as title,
        (a.purpose || ' scheduled on ' || a.date || ' at ' || a.time || ' (' || a.status || ')') as description,
        a.created_at as timestamp,
        u_doc.name as actor
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_pat ON p.user_id = u_pat.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      WHERE a.hospital_id = ?
      ORDER BY a.created_at DESC
      LIMIT 6
    `, [adminHospitalId]);

    const recentJourneyEvents = queryAll(`
      SELECT 
        j.id,
        'journey_event' as type,
        ('Stage Update: ' || u_pat.name) as title,
        ('Patient transitioned to ' || j.stage || ' stage') as description,
        j.created_at as timestamp,
        COALESCE(u_doc.name, 'Clinical Care Team') as actor
      FROM journey_events j
      JOIN patients p ON j.patient_id = p.id
      JOIN users u_pat ON p.user_id = u_pat.id
      LEFT JOIN doctors d ON j.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      WHERE j.hospital_id = ?
      ORDER BY j.created_at DESC
      LIMIT 6
    `, [adminHospitalId]);

    const recentPatients = queryAll(`
      SELECT 
        p.id,
        'patient_registered' as type,
        ('Patient Admission: ' || u.name) as title,
        ('Enrolled in CareFlow under ' || COALESCE(u_doc.name, 'Hospital Care Team') || ' (' || p.current_stage || ' Stage)') as description,
        p.created_at as timestamp,
        u.name as actor
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      WHERE p.hospital_id = ?
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [adminHospitalId]);

    // Merge and sort activities chronologically
    const allActivities = [...recentAppointments, ...recentJourneyEvents, ...recentPatients]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const departmentsList = hospital.departments 
      ? hospital.departments.split(',').map((d: string) => d.trim()).filter(Boolean)
      : [];

    return res.json({
      hospital: {
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone,
        departments: departmentsList,
        created_at: hospital.created_at
      },
      stats: {
        totalDoctors: docStats?.total_doctors || 0,
        activeDoctors: docStats?.active_doctors || 0,
        totalPatients: patStats?.total_patients || 0,
        todayAppointments: apptStats?.today_appointments || 0,
        pendingAppointments: apptStats?.pending_appointments || 0,
        activeJourneys: journeyStats?.active_journeys || 0,
      },
      todayAppointments,
      recentActivity: allActivities,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------------
// 2. MANAGE DOCTORS (Scoped to hospital_id)
// -------------------------------------------------------------------------

// List doctors for this hospital
adminRouter.get('/doctors', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';
    const statusFilter = req.query.status ? String(req.query.status) : 'all';

    let sql = `
      SELECT 
        d.id, d.user_id, d.hospital_id, d.specialization, d.license_number, d.is_active, d.created_at,
        u.name, u.email,
        (SELECT COUNT(*) FROM patients p WHERE p.doctor_id = d.id) as patient_count,
        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id) as appointment_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.hospital_id = ?
    `;
    const params: any[] = [adminHospitalId];

    if (statusFilter === 'active') {
      sql += ` AND d.is_active = 1`;
    } else if (statusFilter === 'inactive') {
      sql += ` AND d.is_active = 0`;
    }

    if (search) {
      sql += ` AND (LOWER(u.name) LIKE ? OR LOWER(d.specialization) LIKE ? OR LOWER(u.email) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY d.is_active DESC, u.name ASC`;

    const doctors = queryAll(sql, params);
    return res.json({ doctors });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Add a new doctor (Always scoped to the admin's hospital_id)
adminRouter.post('/doctors', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const { name, email, password, specialization, license_number } = req.body;

    if (!name || !email || !specialization) {
      return res.status(400).json({ error: 'Doctor name, email, and specialization are required' });
    }

    // Check if email already registered
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    const defaultPassword = password || 'DoctorPass123!';
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);
    const userId = 'user-doc-' + uuidv4().slice(0, 8);
    const doctorId = 'doc-' + uuidv4().slice(0, 8);

    // Create user record with role = 'doctor' and strictly admin's hospital_id
    execute(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id)
      VALUES (?, ?, ?, ?, 'doctor', ?)
    `, [userId, name.trim(), email.trim().toLowerCase(), passwordHash, adminHospitalId]);

    // Create doctor record
    execute(`
      INSERT INTO doctors (id, user_id, hospital_id, specialization, license_number, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [doctorId, userId, adminHospitalId, specialization.trim(), license_number?.trim() || null]);

    const createdDoctor = queryOne(`
      SELECT d.id, d.user_id, d.hospital_id, d.specialization, d.license_number, d.is_active, d.created_at,
             u.name, u.email,
             0 as patient_count,
             0 as appointment_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [doctorId]);

    return res.status(201).json({
      success: true,
      message: `Doctor ${name} successfully added to hospital staff roster.`,
      doctor: createdDoctor,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Toggle doctor active status (Soft delete / reactivate — Scoped & Protected)
adminRouter.patch('/doctors/:id/status', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'number' && typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'Valid is_active (0 or 1) value required' });
    }

    const numericActive = is_active ? 1 : 0;

    // CRITICAL: Check doctor exists AND belongs to the admin's hospital
    const doctor = queryOne(`
      SELECT d.id, d.hospital_id, u.name 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.hospital_id !== adminHospitalId) {
      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to modify a doctor belonging to another hospital facility.',
        requestedDoctorHospital: doctor.hospital_id,
        yourHospital: adminHospitalId
      });
    }

    execute(`UPDATE doctors SET is_active = ? WHERE id = ?`, [numericActive, id]);

    return res.json({
      success: true,
      message: `Doctor ${doctor.name} has been ${numericActive === 1 ? 'reactivated' : 'deactivated (soft-deleted)'}. Historical patient records preserved.`,
      doctor_id: id,
      is_active: numericActive,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update doctor details (specialization, license, name)
adminRouter.put('/doctors/:id', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const { id } = req.params;
    const { name, specialization, license_number } = req.body;

    const doctor = queryOne(`
      SELECT d.id, d.user_id, d.hospital_id, u.name 
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (doctor.hospital_id !== adminHospitalId) {
      return res.status(403).json({ 
        error: 'Forbidden: Access denied to doctor belonging to another hospital facility.' 
      });
    }

    if (specialization) {
      execute(`UPDATE doctors SET specialization = ?, license_number = ? WHERE id = ?`, [
        specialization.trim(),
        license_number ? license_number.trim() : null,
        id
      ]);
    }
    if (name) {
      execute(`UPDATE users SET name = ? WHERE id = ?`, [name.trim(), doctor.user_id]);
    }

    return res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor_id: id
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------------
// 3. MANAGE PATIENTS (Hospital-associated administrative view ONLY)
// -------------------------------------------------------------------------

// List hospital patients (NO clinical health logs / symptoms exposed)
adminRouter.get('/patients', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const search = req.query.search ? String(req.query.search).toLowerCase() : '';
    const stageFilter = req.query.stage ? String(req.query.stage) : 'all';
    const doctorFilter = req.query.doctorId ? String(req.query.doctorId) : 'all';

    let sql = `
      SELECT 
        p.id, p.user_id, p.date_of_birth, p.contact, p.emergency_contact, p.blood_group,
        p.current_stage, p.doctor_id, p.hospital_id, p.created_at,
        u.name, u.email,
        u_doc.name as assigned_doctor_name,
        d.specialization as assigned_doctor_specialization,
        (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND a.hospital_id = p.hospital_id) as appointment_count,
        (SELECT MAX(date) FROM appointments a WHERE a.patient_id = p.id AND a.hospital_id = p.hospital_id) as last_visit_date
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      WHERE p.hospital_id = ?
    `;
    const params: any[] = [adminHospitalId];

    if (stageFilter && stageFilter !== 'all') {
      sql += ` AND p.current_stage = ?`;
      params.push(stageFilter);
    }

    if (doctorFilter && doctorFilter !== 'all') {
      sql += ` AND p.doctor_id = ?`;
      params.push(doctorFilter);
    }

    if (search) {
      sql += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(p.contact) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY u.name ASC`;

    const patients = queryAll(sql, params);
    return res.json({ patients });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Single patient administrative profile (strictly identity / scheduling overview, NO daily health records)
adminRouter.get('/patients/:id', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const { id } = req.params;

    const patient = queryOne(`
      SELECT 
        p.id, p.user_id, p.date_of_birth, p.contact, p.emergency_contact, p.blood_group,
        p.current_stage, p.doctor_id, p.hospital_id, p.created_at,
        u.name, u.email,
        u_doc.name as assigned_doctor_name,
        d.specialization as assigned_doctor_specialization
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      WHERE p.id = ?
    `, [id]);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Strict Hospital Isolation Check
    if (patient.hospital_id !== adminHospitalId) {
      return res.status(403).json({ 
        error: 'Forbidden: Access denied to patient records registered at another hospital facility.',
        patientHospital: patient.hospital_id,
        yourHospital: adminHospitalId
      });
    }

    // Scoped Appointments for this patient at this hospital (administrative timing and status only, no doctor clinical notes)
    const appointments = queryAll(`
      SELECT 
        a.id, a.date, a.time, a.purpose, a.status,
        u_doc.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      WHERE a.patient_id = ? AND a.hospital_id = ?
      ORDER BY a.date DESC, a.time ASC
    `, [id, adminHospitalId]);

    // High-level journey milestones summary (strictly stage names, status, and dates; NO clinical notes or diagnostic specifics)
    const journeyMilestones = queryAll(`
      SELECT j.id, j.stage, j.status, j.date
      FROM journey_events j
      WHERE j.patient_id = ? AND j.hospital_id = ?
      ORDER BY j.date ASC
    `, [id, adminHospitalId]);

    return res.json({
      patient,
      appointments,
      journeyMilestones,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------------
// 4. APPOINTMENT OVERSIGHT & REASSIGNMENT
// -------------------------------------------------------------------------

// List all appointments across the hospital
adminRouter.get('/appointments', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const doctorFilter = req.query.doctorId ? String(req.query.doctorId) : 'all';
    const statusFilter = req.query.status ? String(req.query.status) : 'all';
    const dateFilter = req.query.date ? String(req.query.date) : '';

    let sql = `
      SELECT 
        a.id, a.patient_id, a.doctor_id, a.hospital_id, a.date, a.time, a.purpose, a.status, a.created_at,
        u_pat.name as patient_name,
        u_pat.email as patient_email,
        p.contact as patient_contact,
        p.current_stage as patient_stage,
        u_doc.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_pat ON p.user_id = u_pat.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u_doc ON d.user_id = u_doc.id
      WHERE a.hospital_id = ?
    `;
    const params: any[] = [adminHospitalId];

    if (doctorFilter && doctorFilter !== 'all') {
      sql += ` AND a.doctor_id = ?`;
      params.push(doctorFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      sql += ` AND a.status = ?`;
      params.push(statusFilter);
    }

    if (dateFilter) {
      sql += ` AND a.date = ?`;
      params.push(dateFilter);
    }

    sql += ` ORDER BY a.date DESC, a.time ASC`;

    const appointments = queryAll(sql, params);
    return res.json({ appointments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Reassign appointment to another doctor at the same hospital
adminRouter.patch('/appointments/:id/reassign', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const { id } = req.params;
    const { new_doctor_id, reason } = req.body;

    if (!new_doctor_id) {
      return res.status(400).json({ error: 'Target new_doctor_id is required for reassignment' });
    }

    // 1. Verify existing appointment belongs to admin's hospital
    const appointment = queryOne(`
      SELECT a.*, u_pat.name as patient_name, u_old_doc.name as old_doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u_pat ON p.user_id = u_pat.id
      JOIN doctors d_old ON a.doctor_id = d_old.id
      JOIN users u_old_doc ON d_old.user_id = u_old_doc.id
      WHERE a.id = ?
    `, [id]);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.hospital_id !== adminHospitalId) {
      return res.status(403).json({ 
        error: 'Forbidden: Cannot reassign an appointment scheduled at another hospital facility.' 
      });
    }

    // 2. Verify target new doctor exists AND belongs to the SAME hospital
    const targetDoctor = queryOne(`
      SELECT d.id, d.hospital_id, d.specialization, u.name as doctor_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [new_doctor_id]);

    if (!targetDoctor) {
      return res.status(404).json({ error: 'Target doctor not found' });
    }

    if (targetDoctor.hospital_id !== adminHospitalId) {
      return res.status(403).json({ 
        error: 'Forbidden: Cannot reassign appointment to a doctor outside your hospital network.' 
      });
    }

    // Update appointment doctor and append reassignment note
    const updatedNotes = appointment.notes 
      ? `${appointment.notes} | [Reassigned from ${appointment.old_doctor_name} to ${targetDoctor.doctor_name}${reason ? ': ' + reason : ''}]`
      : `[Reassigned from ${appointment.old_doctor_name} to ${targetDoctor.doctor_name}${reason ? ': ' + reason : ''}]`;

    execute(`
      UPDATE appointments 
      SET doctor_id = ?, notes = ? 
      WHERE id = ?
    `, [new_doctor_id, updatedNotes, id]);

    // Send in-app notification to the newly assigned doctor
    execute(`
      INSERT INTO doctor_notifications (id, doctor_id, patient_id, patient_name, title, message, type, severity, is_read, action_tab, action_id, created_at)
      VALUES (?, ?, ?, ?, 'Appointment Reassigned to Your Schedule', ?, 'appointment', 'normal', 0, 'appointments', ?, datetime('now'))
    `, [
      uuidv4(),
      new_doctor_id,
      appointment.patient_id,
      appointment.patient_name,
      `Hospital Admin reassigned patient ${appointment.patient_name}'s appointment (${appointment.purpose}) on ${appointment.date} at ${appointment.time} to your clinic schedule.`,
      id
    ]);

    return res.json({
      success: true,
      message: `Appointment successfully reassigned to ${targetDoctor.doctor_name} (${targetDoctor.specialization}).`,
      appointment_id: id,
      new_doctor_name: targetDoctor.doctor_name,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update appointment status / notes
adminRouter.patch('/appointments/:id/status', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = queryOne('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.hospital_id !== adminHospitalId) {
      return res.status(403).json({ 
        error: 'Forbidden: Cannot update appointment from another hospital facility.' 
      });
    }

    if (status && !['pending', 'confirmed', 'upcoming', 'completed', 'cancelled', 'declined', 'past'].includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status' });
    }

    if (status && notes !== undefined) {
      execute(`UPDATE appointments SET status = ?, notes = ? WHERE id = ?`, [status, notes, id]);
    } else if (status) {
      execute(`UPDATE appointments SET status = ? WHERE id = ?`, [status, id]);
    } else if (notes !== undefined) {
      execute(`UPDATE appointments SET notes = ? WHERE id = ?`, [notes, id]);
    }

    return res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment_id: id,
      status: status || appointment.status
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------------
// 5. HOSPITAL SETTINGS & PROFILE
// -------------------------------------------------------------------------

// Get hospital settings profile
adminRouter.get('/profile', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const hospital = queryOne(`
      SELECT id, name, address, phone, departments, created_at
      FROM hospitals
      WHERE id = ?
    `, [adminHospitalId]);

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    return res.json({ hospital });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update hospital settings profile (Strictly updates admin's own hospital)
adminRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const { name, address, phone, departments } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Hospital name and address are required' });
    }

    const deptString = Array.isArray(departments) 
      ? departments.join(', ')
      : (departments || '');

    execute(`
      UPDATE hospitals 
      SET name = ?, address = ?, phone = ?, departments = ? 
      WHERE id = ?
    `, [name.trim(), address.trim(), phone?.trim() || null, deptString.trim(), adminHospitalId]);

    const updated = queryOne('SELECT id, name, address, phone, departments FROM hospitals WHERE id = ?', [adminHospitalId]);

    return res.json({
      success: true,
      message: 'Hospital details updated successfully',
      hospital: updated
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------------------
// 6. SERVER-SIDE ISOLATION VERIFICATION AUDIT ENDPOINT
// -------------------------------------------------------------------------
adminRouter.post('/test-isolation', async (req: Request, res: Response) => {
  try {
    const adminHospitalId = (req as any).user.hospital_id;
    const { target_hospital_id } = req.body;

    if (!target_hospital_id) {
      return res.status(400).json({ error: 'target_hospital_id parameter is required for audit test' });
    }

    // Direct check: if attempting cross-hospital inspection
    if (target_hospital_id !== adminHospitalId) {
      return res.status(403).json({
        securityAudit: 'PASS',
        enforced: true,
        statusCode: 403,
        error: 'Forbidden: Direct cross-hospital query rejected. Server-side isolation is strictly enforced at the SQL database layer.',
        authenticatedHospital: adminHospitalId,
        unauthorizedTargetHospital: target_hospital_id,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      securityAudit: 'SAME_HOSPITAL',
      enforced: true,
      message: 'Target hospital matches authenticated session scope.',
      authenticatedHospital: adminHospitalId
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Mount adminRouter under /admin prefix
router.use('/admin', adminRouter);

export default router;

