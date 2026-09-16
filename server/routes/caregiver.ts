import { Router, Request, Response } from 'express';
import { getDb, queryOne, queryAll } from '../db';
import { authenticateUser } from './auth';

const router = Router();

// Middleware: all routes require authenticated user
router.use(authenticateUser);

// Middleware: require caregiver role
function requireCaregiver(req: Request, res: Response, next: Function) {
  const user = (req as any).user;
  if (!user || user.role !== 'caregiver') {
    return res.status(403).json({ error: 'Forbidden: Access restricted to authenticated Caregivers' });
  }
  next();
}

router.use(requireCaregiver);

// 1. Get list of all patients linked to the authenticated caregiver
router.get('/patients', async (req: Request, res: Response) => {
  try {
    await getDb();
    const caregiverUserId = (req as any).user.id;

    const patients = queryAll(`
      SELECT 
        cl.id as link_id, 
        cl.patient_id,
        cl.can_view_journey, 
        cl.can_view_appointments, 
        cl.can_view_tasks, 
        cl.can_view_reports, 
        cl.can_view_daily_health,
        cl.created_at as linked_at,
        p.current_stage, 
        p.blood_group, 
        p.contact, 
        p.emergency_contact,
        u.name as patient_name, 
        u.email as patient_email,
        h.name as hospital_name,
        u_doc.name as doctor_name, 
        d.specialization as doctor_specialization
      FROM caregiver_links cl
      JOIN patients p ON cl.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN hospitals h ON p.hospital_id = h.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      WHERE cl.caregiver_user_id = ?
      ORDER BY cl.created_at DESC
    `, [caregiverUserId]);

    return res.json({ patients });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get granular scoped data for a specific linked patient
router.get('/patients/:patientId/data', async (req: Request, res: Response) => {
  try {
    await getDb();
    const caregiverUserId = (req as any).user.id;
    const { patientId } = req.params;

    // Check authorization in caregiver_links table
    const link = queryOne(`
      SELECT * FROM caregiver_links 
      WHERE caregiver_user_id = ? AND patient_id = ?
    `, [caregiverUserId, patientId]);

    if (!link) {
      return res.status(403).json({ 
        error: 'Forbidden: You are not authorized to view this patient’s care profile.' 
      });
    }

    // Basic patient header info
    const patientProfile = queryOne(`
      SELECT 
        p.id, 
        p.current_stage, 
        p.blood_group, 
        p.contact, 
        p.emergency_contact,
        u.name, 
        u.email,
        h.name as hospital_name,
        u_doc.name as doctor_name,
        d.specialization as doctor_specialization
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN hospitals h ON p.hospital_id = h.id
      LEFT JOIN doctors d ON p.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      WHERE p.id = ?
    `, [patientId]);

    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const permissions = {
      can_view_journey: Boolean(link.can_view_journey),
      can_view_appointments: Boolean(link.can_view_appointments),
      can_view_tasks: Boolean(link.can_view_tasks),
      can_view_reports: Boolean(link.can_view_reports),
      can_view_daily_health: Boolean(link.can_view_daily_health),
    };

    const responseData: any = {
      patient: patientProfile,
      permissions,
    };

    // 1. Care Journey (if granted)
    if (permissions.can_view_journey) {
      responseData.journeyEvents = queryAll(`
        SELECT j.*, u_doc.name as doctor_name, h.name as hospital_name
        FROM journey_events j
        LEFT JOIN doctors d ON j.doctor_id = d.id
        LEFT JOIN users u_doc ON d.user_id = u_doc.id
        LEFT JOIN hospitals h ON j.hospital_id = h.id
        WHERE j.patient_id = ?
        ORDER BY j.date ASC
      `, [patientId]);
    }

    // 2. Appointments (if granted)
    if (permissions.can_view_appointments) {
      responseData.appointments = queryAll(`
        SELECT a.*, u_doc.name as doctor_name, d.specialization as doctor_specialization, h.name as hospital_name
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN users u_doc ON d.user_id = u_doc.id
        LEFT JOIN hospitals h ON a.hospital_id = h.id
        WHERE a.patient_id = ?
        ORDER BY a.date ASC, a.time ASC
      `, [patientId]);
    }

    // 3. Care Tasks (if granted)
    if (permissions.can_view_tasks) {
      responseData.tasks = queryAll(`
        SELECT t.*, j.stage as journey_stage, j.title as journey_title
        FROM tasks t
        LEFT JOIN journey_events j ON t.related_journey_event_id = j.id
        WHERE t.patient_id = ?
        ORDER BY t.due_date ASC
      `, [patientId]);
    }

    // 4. Medical Reports (if granted)
    if (permissions.can_view_reports) {
      responseData.reports = queryAll(`
        SELECT r.*, u_doc.name as doctor_name, d.specialization as doctor_specialization, h.name as hospital_name
        FROM medical_reports r
        LEFT JOIN doctors d ON r.doctor_id = d.id
        LEFT JOIN users u_doc ON d.user_id = u_doc.id
        LEFT JOIN hospitals h ON r.hospital_id = h.id
        WHERE r.patient_id = ?
        ORDER BY r.date DESC
      `, [patientId]);
    }

    // 5. Daily Health & Adherence (if granted)
    if (permissions.can_view_daily_health) {
      const records = queryAll(`
        SELECT * FROM daily_health_records 
        WHERE patient_id = ?
        ORDER BY date DESC
        LIMIT 14
      `, [patientId]);

      // Attach symptoms to daily health records
      for (const rec of records) {
        rec.symptoms = queryAll(`
          SELECT name, severity, notes FROM symptoms WHERE daily_record_id = ?
        `, [rec.id]);
      }

      responseData.dailyHealth = records;

      const totalDays = records.length;
      if (totalDays > 0) {
        const avgSleep = records.reduce((sum: number, r: any) => sum + (r.sleep_hours || 0), 0) / totalDays;
        const avgStress = records.reduce((sum: number, r: any) => sum + (r.stress_level || 0), 0) / totalDays;
        const medTakenCount = records.filter((r: any) => r.medication_taken === 1).length;
        const adherenceRate = Math.round((medTakenCount / totalDays) * 100);

        responseData.summaryStats = {
          avgSleep: Math.round(avgSleep * 10) / 10,
          avgStress: Math.round(avgStress * 10) / 10,
          adherenceRate,
          totalLogs: totalDays,
        };
      }
    }

    return res.json(responseData);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Dedicated endpoint: Get Care Tasks for patient (Server-side 403 enforcement)
router.get('/patients/:patientId/tasks', async (req: Request, res: Response) => {
  try {
    await getDb();
    const caregiverUserId = (req as any).user.id;
    const { patientId } = req.params;

    const link = queryOne(`
      SELECT can_view_tasks FROM caregiver_links 
      WHERE caregiver_user_id = ? AND patient_id = ?
    `, [caregiverUserId, patientId]);

    if (!link) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to access this patient profile.' });
    }

    if (!link.can_view_tasks) {
      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to view care tasks for this patient. The patient has not granted Tasks permission.' 
      });
    }

    const tasks = queryAll(`
      SELECT t.*, j.stage as journey_stage, j.title as journey_title
      FROM tasks t
      LEFT JOIN journey_events j ON t.related_journey_event_id = j.id
      WHERE t.patient_id = ?
      ORDER BY t.due_date ASC
    `, [patientId]);

    return res.json({ tasks });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Dedicated endpoint: Update Care Task on patient's behalf (Actionable Caregiver assistance)
router.patch('/patients/:patientId/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { execute } = await import('../db');
    const caregiverUserId = (req as any).user.id;
    const { patientId, taskId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status ("pending" or "completed") is required' });
    }

    const link = queryOne(`
      SELECT can_view_tasks FROM caregiver_links 
      WHERE caregiver_user_id = ? AND patient_id = ?
    `, [caregiverUserId, patientId]);

    if (!link) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to access this patient profile.' });
    }

    if (!link.can_view_tasks) {
      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to manage tasks for this patient.' 
      });
    }

    const existingTask = queryOne(`
      SELECT * FROM tasks WHERE id = ? AND patient_id = ?
    `, [taskId, patientId]);

    if (!existingTask) {
      return res.status(404).json({ error: 'Care task not found for this patient.' });
    }

    execute(`
      UPDATE tasks SET status = ? WHERE id = ? AND patient_id = ?
    `, [status, taskId, patientId]);

    return res.json({ 
      success: true, 
      message: `Task updated to ${status} on patient's behalf`,
      taskId,
      status 
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Dedicated endpoint: Get Medical Reports for patient (Server-side 403 enforcement)
router.get('/patients/:patientId/reports', async (req: Request, res: Response) => {
  try {
    await getDb();
    const caregiverUserId = (req as any).user.id;
    const { patientId } = req.params;

    const link = queryOne(`
      SELECT can_view_reports FROM caregiver_links 
      WHERE caregiver_user_id = ? AND patient_id = ?
    `, [caregiverUserId, patientId]);

    if (!link) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to access this patient profile.' });
    }

    if (!link.can_view_reports) {
      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to view medical reports for this patient. The patient has not granted Reports permission.' 
      });
    }

    const reports = queryAll(`
      SELECT r.*, u_doc.name as doctor_name, d.specialization as doctor_specialization, h.name as hospital_name
      FROM medical_reports r
      LEFT JOIN doctors d ON r.doctor_id = d.id
      LEFT JOIN users u_doc ON d.user_id = u_doc.id
      LEFT JOIN hospitals h ON r.hospital_id = h.id
      WHERE r.patient_id = ?
      ORDER BY r.date DESC
    `, [patientId]);

    return res.json({ reports });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
