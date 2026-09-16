import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DB_FILE = path.join(process.cwd(), 'careflow.sqlite');

let dbInstance: Database | null = null;

// Helper to save DB to disk
export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite DB to disk:', err);
  }
}

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from file.');
      ensureExtraTablesAndSeeds(dbInstance);
      saveDb();
      return dbInstance;
    } catch (err) {
      console.warn('Could not read existing DB file, creating a fresh one:', err);
    }
  }

  dbInstance = new SQL.Database();
  console.log('Created fresh SQLite database.');
  await initSchemaAndSeed(dbInstance);
  ensureExtraTablesAndSeeds(dbInstance);
  saveDb();
  return dbInstance;
}

export function ensureExtraTablesAndSeeds(db: Database): void {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('appointment', 'journey', 'report', 'task', 'reminder', 'prescription', 'alert')),
        is_read INTEGER DEFAULT 0,
        action_tab TEXT DEFAULT 'dashboard',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS doctor_notifications (
        id TEXT PRIMARY KEY,
        doctor_id TEXT NOT NULL,
        patient_id TEXT,
        patient_name TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('report', 'task', 'health_log', 'appointment', 'alert', 'adherence')),
        severity TEXT DEFAULT 'normal' CHECK(severity IN ('normal', 'high', 'critical')),
        is_read INTEGER DEFAULT 0,
        action_tab TEXT DEFAULT 'patients',
        action_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
      );
    `);

    // Schema migration: Check and add missing departments column in hospitals
    try {
      const hTableInfo = db.exec(`PRAGMA table_info(hospitals);`);
      const hCols = hTableInfo[0]?.values?.map((row: any) => row[1]) || [];
      if (!hCols.includes('departments')) {
        db.run(`ALTER TABLE hospitals ADD COLUMN departments TEXT;`);
        db.run(`UPDATE hospitals SET departments = 'Cardiology, Internal Medicine, Radiology, Cardiac Rehab, Emergency Care, Pathology' WHERE id = 'hosp-stjude';`);
        db.run(`UPDATE hospitals SET departments = 'Neurology, Orthopedics, General Medicine, Pediatrics, Physical Therapy, Emergency Care' WHERE id = 'hosp-citygen';`);
      }
    } catch (migErr) {
      console.warn('Migration warning for hospitals:', migErr);
    }

    // Schema migration: Check and add second doctor for St. Jude if not present
    try {
      const docTaylorCheck = db.exec(`SELECT count(*) as count FROM doctors WHERE id = 'doc-robert-stjude';`);
      const docTaylorCount = docTaylorCheck[0]?.values[0]?.[0] as number || 0;
      if (docTaylorCount === 0) {
        const passwordHash = bcrypt.hashSync('password123', 10);
        db.run(`
          INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
          ('user-doc-robert', 'Dr. Robert Taylor, MD', 'dr.taylor@stjude.org', '${passwordHash}', 'doctor', 'hosp-stjude');
        `);
        db.run(`
          INSERT INTO doctors (id, user_id, hospital_id, specialization, license_number, is_active) VALUES
          ('doc-robert-stjude', 'user-doc-robert', 'hosp-stjude', 'Emergency & Critical Care', 'MD-CA-67290', 1);
        `);
      }

      const doc2Check = db.exec(`SELECT count(*) as count FROM doctors WHERE id = 'doc-hayes-stjude';`);
      const doc2Count = doc2Check[0]?.values[0]?.[0] as number || 0;
      if (doc2Count === 0) {
        const passwordHash = bcrypt.hashSync('password123', 10);
        db.run(`
          INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
          ('user-doc-hayes', 'Dr. Robert Hayes, MD', 'dr.hayes@stjude.org', '${passwordHash}', 'doctor', 'hosp-stjude');
        `);
        db.run(`
          INSERT INTO doctors (id, user_id, hospital_id, specialization, license_number, is_active) VALUES
          ('doc-hayes-stjude', 'user-doc-hayes', 'hosp-stjude', 'Interventional Cardiology & Electrophysiology', 'MD-CA-99302', 1);
        `);
      }
    } catch (docErr) {
      console.warn('Doctor migration check error:', docErr);
    }

    // Schema migration: Check and ensure City General doctor, patient & appointments exist
    try {
      const cgDoc2Check = db.exec(`SELECT count(*) as count FROM doctors WHERE id = 'doc-patel-citygen';`);
      const cgDoc2Count = cgDoc2Check[0]?.values[0]?.[0] as number || 0;
      if (cgDoc2Count === 0) {
        const passwordHash = bcrypt.hashSync('password123', 10);
        db.run(`
          INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
          ('user-doc-patel', 'Dr. Priya Patel, MD', 'dr.patel@citygen.org', '${passwordHash}', 'doctor', 'hosp-citygen');
        `);
        db.run(`
          INSERT INTO doctors (id, user_id, hospital_id, specialization, license_number, is_active) VALUES
          ('doc-patel-citygen', 'user-doc-patel', 'hosp-citygen', 'Orthopedics & Sports Medicine', 'MD-NY-91823', 1);
        `);
      }

      const cgPat2Check = db.exec(`SELECT count(*) as count FROM patients WHERE id = 'pat-lisa-ray';`);
      const cgPat2Count = cgPat2Check[0]?.values[0]?.[0] as number || 0;
      if (cgPat2Count === 0) {
        const passwordHash = bcrypt.hashSync('password123', 10);
        db.run(`
          INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
          ('user-pat-lisa', 'Lisa Ray', 'lisa.ray@example.com', '${passwordHash}', 'patient', 'hosp-citygen');
        `);
        db.run(`
          INSERT INTO patients (id, user_id, date_of_birth, contact, emergency_contact, blood_group, current_stage, doctor_id, hospital_id) VALUES
          ('pat-lisa-ray', 'user-pat-lisa', '1995-03-18', '+1 (555) 789-0123', 'Tom Ray (+1 555-456-7890)', 'O-', 'Tests', 'doc-patel-citygen', 'hosp-citygen');
        `);
      }

      // Check and add appointments for City General
      const cgAppCheck = db.exec(`SELECT count(*) as count FROM appointments WHERE hospital_id = 'hosp-citygen';`);
      const cgAppCount = cgAppCheck[0]?.values[0]?.[0] as number || 0;
      if (cgAppCount === 0) {
        db.run(`
          INSERT INTO appointments (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes) VALUES
          ('app-citygen-001', 'pat-david-kim', 'doc-marcus-citygen', 'hosp-citygen', '2026-08-28', '11:00 AM', 'Neurology Diagnostic Consultation & MRI Review', 'upcoming', 'Evaluate cranial MRI and recurring visual aura episodes.'),
          ('app-citygen-002', 'pat-lisa-ray', 'doc-patel-citygen', 'hosp-citygen', '2026-08-27', '03:30 PM', 'Orthopedic Knee Imaging & Range-of-Motion Test', 'upcoming', 'Follow-up on MRI of right ACL and meniscal alignment.');
        `);
      }
    } catch (cgErr) {
      console.warn('City General migration check error:', cgErr);
    }
    try {
      const tableInfo = db.exec(`PRAGMA table_info(daily_health_records);`);
      const cols = tableInfo[0]?.values?.map((row: any) => row[1]) || [];
      if (!cols.includes('med_morning')) {
        db.run(`ALTER TABLE daily_health_records ADD COLUMN med_morning INTEGER DEFAULT 0;`);
      }
      if (!cols.includes('med_afternoon')) {
        db.run(`ALTER TABLE daily_health_records ADD COLUMN med_afternoon INTEGER DEFAULT 0;`);
      }
      if (!cols.includes('med_night')) {
        db.run(`ALTER TABLE daily_health_records ADD COLUMN med_night INTEGER DEFAULT 0;`);
      }
    } catch (migErr) {
      console.warn('Migration warning for daily_health_records:', migErr);
    }

    // Schema migration: Check and add missing clinical columns in journey_events
    try {
      const jTableInfo = db.exec(`PRAGMA table_info(journey_events);`);
      const jCols = jTableInfo[0]?.values?.map((row: any) => row[1]) || [];
      if (!jCols.includes('clinical_note')) {
        db.run(`ALTER TABLE journey_events ADD COLUMN clinical_note TEXT;`);
      }
      if (!jCols.includes('doctor_plan')) {
        db.run(`ALTER TABLE journey_events ADD COLUMN doctor_plan TEXT;`);
      }
      if (!jCols.includes('clinical_follow_up')) {
        db.run(`ALTER TABLE journey_events ADD COLUMN clinical_follow_up TEXT;`);
      }
      if (!jCols.includes('journey_id')) {
        db.run(`ALTER TABLE journey_events ADD COLUMN journey_id TEXT;`);
      }
    } catch (migErr) {
      console.warn('Migration warning for journey_events:', migErr);
    }

    // Schema migration: Check and add patient clinical attributes (gender, medical_history, current_conditions, allergies)
    try {
      const pTableInfo = db.exec(`PRAGMA table_info(patients);`);
      const pCols = pTableInfo[0]?.values?.map((row: any) => row[1]) || [];
      if (!pCols.includes('gender')) {
        db.run(`ALTER TABLE patients ADD COLUMN gender TEXT;`);
      }
      if (!pCols.includes('medical_history')) {
        db.run(`ALTER TABLE patients ADD COLUMN medical_history TEXT;`);
      }
      if (!pCols.includes('current_conditions')) {
        db.run(`ALTER TABLE patients ADD COLUMN current_conditions TEXT;`);
      }
      if (!pCols.includes('allergies')) {
        db.run(`ALTER TABLE patients ADD COLUMN allergies TEXT;`);
      }

      // Populate enriched clinical attributes for patient cohort
      db.run(`
        UPDATE patients SET
          gender = 'Male',
          current_conditions = 'Stress-Induced Sinus Tachycardia (ICD-10 I47.1) • Borderline Primary Hypertension',
          allergies = 'Penicillin (Severe anaphylaxis) • Sulfa Drugs (Moderate rash)',
          medical_history = 'Grade II Lateral Ankle Sprain (Resolved Apr 2026) • Family History of Early CAD (Paternal)'
        WHERE id = 'pat-alex-rivera' AND (gender IS NULL OR gender = '');

        UPDATE patients SET
          gender = 'Female',
          current_conditions = 'Exertional Dyspnea & Episodic Palpitations • Mild Iron Deficiency Anemia',
          allergies = 'Latex (Mild contact dermatitis)',
          medical_history = 'Childhood exercise-induced bronchospasm • Normal baseline metabolic profile'
        WHERE id = 'pat-maya-lin' AND (gender IS NULL OR gender = '');

        UPDATE patients SET
          gender = 'Male',
          current_conditions = 'Post-PCI LAD Stent Recovery • Hyperlipidemia • Coronary Artery Disease',
          allergies = 'Shellfish (Moderate angioedema) • Radiocontrast Dye (Mild pruritus)',
          medical_history = 'Percutaneous Coronary Intervention (Aug 2026) • Essential Hypertension (10 years)'
        WHERE id = 'pat-marcus-thorne' AND (gender IS NULL OR gender = '');

        UPDATE patients SET
          gender = 'Male',
          current_conditions = 'Migraine with Visual Aura • Cranial Neuropathy Monitoring',
          allergies = 'No Known Drug Allergies (NKDA)',
          medical_history = 'Recurrent unilateral vascular headaches • No prior surgeries'
        WHERE id = 'pat-david-kim' AND (gender IS NULL OR gender = '');

        UPDATE patients SET
          gender = 'Female',
          current_conditions = 'Right ACL Sprain & Meniscal Alignment • Joint Effusion',
          allergies = 'Codeine (Mild nausea)',
          medical_history = 'Athletic knee hyperflexion injury • Candidate for conservative physical therapy'
        WHERE id = 'pat-lisa-ray' AND (gender IS NULL OR gender = '');
      `);
    } catch (patMigErr) {
      console.warn('Patients schema migration warning:', patMigErr);
    }

    // Schema migration: Ensure journeys table exists and migrate journeys
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS journeys (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          title TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('active', 'resolved', 'closed')),
          start_date TEXT NOT NULL,
          end_date TEXT,
          category TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
        );
      `);

      // 1. Ensure active journey for Alex Rivera exists
      const alexActiveCheck = db.exec(`SELECT count(*) as count FROM journeys WHERE patient_id = 'pat-alex-rivera' AND status = 'active';`);
      const alexActiveCount = (alexActiveCheck[0]?.values[0]?.[0] as number) || 0;
      if (alexActiveCount === 0) {
        db.run(`
          INSERT INTO journeys (id, patient_id, title, status, start_date, end_date, category)
          VALUES ('journey-alex-cardio-001', 'pat-alex-rivera', 'Sinus Tachycardia & Episodic Palpitations', 'active', '2026-08-01', NULL, 'Cardiology');
        `);
      }

      // Group existing Alex Rivera journey events into the active journey
      db.run(`
        UPDATE journey_events
        SET journey_id = 'journey-alex-cardio-001'
        WHERE patient_id = 'pat-alex-rivera' AND (journey_id IS NULL OR journey_id = '');
      `);

      // 2. Ensure historical resolved journey exists for Alex Rivera (Ankle Sprain & Rehabilitation)
      const alexPastCheck = db.exec(`SELECT count(*) as count FROM journeys WHERE id = 'journey-alex-sprain-000';`);
      const alexPastCount = (alexPastCheck[0]?.values[0]?.[0] as number) || 0;
      if (alexPastCount === 0) {
        db.run(`
          INSERT INTO journeys (id, patient_id, title, status, start_date, end_date, category)
          VALUES ('journey-alex-sprain-000', 'pat-alex-rivera', 'Grade II Ankle Sprain & Physical Rehabilitation', 'resolved', '2026-03-10', '2026-04-22', 'Orthopedics');
        `);

        // Insert complete 8-stage historical events for the resolved ankle sprain episode
        db.run(`
          INSERT OR IGNORE INTO journey_events (id, patient_id, journey_id, stage, title, description, date, status, doctor_id, hospital_id, next_step, clinical_note, doctor_plan, clinical_follow_up) VALUES
          ('ev-sprain-001', 'pat-alex-rivera', 'journey-alex-sprain-000', 'Symptoms', 'Acute Lateral Ankle Inversion Injury & Swelling', 'Patient suffered sharp twisting injury during weekend trail run. Acute lateral swelling, ecchymosis, and inability to bear weight comfortably.', '2026-03-10', 'completed', 'doc-robert-stjude', 'hosp-stjude', 'Urgent orthopedic triage', 'Triage exam: Acute soft tissue edema over ATFL. Neurovascularly intact.', 'Immobilization in air-stirrup splint and RICE protocol ordered.', '2026-03-12'),
          ('ev-sprain-002', 'pat-alex-rivera', 'journey-alex-sprain-000', 'Consultation', 'Orthopedic Clinical Evaluation & Stress Assessment', 'Comprehensive clinical assessment with Dr. Robert Taylor. Ottawa Ankle Rules evaluated; focal tenderness over anterior talofibular ligament.', '2026-03-12', 'completed', 'doc-robert-stjude', 'hosp-stjude', 'Order bilateral weight-bearing radiographs', 'Anterior drawer sign positive (mild laxity, intact endpoint). Talar tilt test equivocal.', 'Prescribe weight-bearing X-ray and diagnostic musculoskeletal ultrasound.', '2026-03-14'),
          ('ev-sprain-003', 'pat-alex-rivera', 'journey-alex-sprain-000', 'Tests', 'Ankle Radiographs & High-Resolution Ultrasound', 'Three-view radiographs (AP, lateral, mortise) and musculoskeletal ultrasound completed at St. Jude Radiology.', '2026-03-14', 'completed', 'doc-robert-stjude', 'hosp-stjude', 'Radiology interpretation review', 'Ultrasound shows hypoechoic thickening and partial fiber discontinuity of anterior talofibular ligament.', 'Await radiologist final confirmation.', '2026-03-16'),
          ('ev-sprain-004', 'pat-alex-rivera', 'journey-alex-sprain-000', 'Test Result', 'Imaging Confirmation: No Fracture, Grade II ATFL Tear', 'Radiology report confirmed intact cortical margins, no syndesmotic widening or avulsion fracture. Grade II ATFL partial tear documented.', '2026-03-16', 'completed', 'doc-robert-stjude', 'hosp-stjude', 'Formulate rehabilitation protocol', 'Syndesmosis intact. Mortise symmetric. Isolated grade II ligamentous sprain.', 'Initiate structured physical therapy regimen and protected weight-bearing.', '2026-03-18'),
          ('ev-sprain-005', 'pat-alex-rivera', 'journey-alex-sprain-000', 'Diagnosis', 'Diagnosis: Grade II Left Ankle Inversion Sprain', 'Formal diagnosis established: Grade II Inversion Sprain of the Left Ankle with ATFL partial tear. Conservative functional treatment pathway indicated.', '2026-03-18', 'completed', 'doc-robert-stjude', 'hosp-stjude', 'Commence targeted physical therapy', 'Patient educated on ligament remodeling phases. Instructed on progressive loading.', 'Referral to Physical Therapy; NSAIDs for 5 days as needed.', '2026-03-22'),
          ('ev-sprain-006', 'pat-alex-rivera', 'journey-alex-sprain-000', 'Treatment', 'Functional Physical Therapy & Proprioceptive Training', 'Initiated twice-weekly PT at St. Jude Rehab. Exercises included isometric peroneus activation, ankle alphabet, and wobble-board balance drills.', '2026-03-22', 'completed', 'doc-robert-stjude', 'hosp-stjude', 'Mid-point functional re-assessment', 'Dorsiflexion improved to 15 degrees. Swelling substantially diminished.', 'Progress to single-leg dynamic stabilization drills.', '2026-04-08'),
          ('ev-sprain-007', 'pat-alex-rivera', 'journey-alex-sprain-000', 'Recovery', 'Dynamic Balance Restoration & Jogging Progression', 'Patient achieved 100% pain-free normal gait. Y-balance test symmetry reached 94%. Completed straight-line jogging test without pain or apprehension.', '2026-04-08', 'completed', 'doc-robert-stjude', 'hosp-stjude', 'Final discharge clinical evaluation', 'Excellent ligamentous stability. Zero effusion. Ankle range of motion symmetric.', 'Cleared for gradual return to outdoor recreational running with supportive footwear.', '2026-04-22'),
          ('ev-sprain-008', 'pat-alex-rivera', 'journey-alex-sprain-000', 'Follow-up', 'Episode Resolution & Full Discharge Clearance', 'Final evaluation with Dr. Robert Taylor. Full recovery confirmed. Ankle stability restored to baseline. Care journey marked as resolved.', '2026-04-22', 'completed', 'doc-robert-stjude', 'hosp-stjude', 'Care journey resolved; return to annual wellness maintenance', 'Final clinical note: Complete functional resolution of Grade II ankle sprain. No chronic instability. Episode closed successfully.', 'Maintenance home exercise protocol provided for ankle inversion prevention.', '2026-04-22');
        `);
      }

      // 3. Ensure Maya Lin, Marcus Thorne, David Kim have journeys and their events updated
      const otherPatients = [
        { id: 'pat-maya-lin', jId: 'journey-maya-cardio-001', title: 'Exertional Dyspnea & Palpitation Evaluation', start: '2026-08-10', cat: 'Cardiology' },
        { id: 'pat-marcus-thorne', jId: 'journey-thorne-cardio-001', title: 'Post-PCI LAD Stent Recovery & Cardiac Rehabilitation', start: '2026-07-05', cat: 'Cardiology' },
        { id: 'pat-david-kim', jId: 'journey-david-neuro-001', title: 'Chronic Migraine & Visual Aura Evaluation', start: '2026-08-12', cat: 'Neurology' },
      ];

      otherPatients.forEach(p => {
        const check = db.exec(`SELECT count(*) as count FROM journeys WHERE id = '${p.jId}';`);
        const count = (check[0]?.values[0]?.[0] as number) || 0;
        if (count === 0) {
          db.run(`
            INSERT INTO journeys (id, patient_id, title, status, start_date, end_date, category)
            VALUES ('${p.jId}', '${p.id}', '${p.title}', 'active', '${p.start}', NULL, '${p.cat}');
          `);
        }
        db.run(`
          UPDATE journey_events
          SET journey_id = '${p.jId}'
          WHERE patient_id = '${p.id}' AND (journey_id IS NULL OR journey_id = '');
        `);
      });

      // Enrich symptoms for Marcus Thorne if only Fatigue exists
      try {
        const thorneSymCheck = db.exec(`
          SELECT count(DISTINCT s.name) as count 
          FROM symptoms s
          JOIN daily_health_records r ON s.daily_record_id = r.id
          WHERE r.patient_id = 'pat-marcus-thorne';
        `);
        const symCount = (thorneSymCheck[0]?.values[0]?.[0] as number) || 0;
        if (symCount <= 1) {
          const recs = db.exec(`SELECT id, date, stress_level, sleep_hours FROM daily_health_records WHERE patient_id = 'pat-marcus-thorne' ORDER BY date ASC;`);
          const rows = recs[0]?.values || [];
          rows.forEach((row: any) => {
            const recId = row[0];
            const date = row[1];
            const stress = Number(row[2]) || 3;
            const sleep = Number(row[3]) || 7;
            
            // Add realistic clinical post-PCI recovery symptoms correlated with stress & sleep
            const headacheSev = sleep < 7.2 ? Math.min(5, Math.max(1, Math.round((8 - sleep) * 2))) : (stress > 3 ? 2 : 0);
            const palpSev = stress >= 3 ? Math.min(4, Math.max(1, stress - 1)) : 0;
            const fatigueSev = sleep < 7.5 ? 3 : 1;

            if (headacheSev > 0) {
              db.run(`INSERT INTO symptoms (id, daily_record_id, name, severity, notes) VALUES ('${uuidv4()}', '${recId}', 'Headache', ${headacheSev}, 'Post-walking mild tension');`);
            }
            if (palpSev > 0) {
              db.run(`INSERT INTO symptoms (id, daily_record_id, name, severity, notes) VALUES ('${uuidv4()}', '${recId}', 'Heart Palpitations', ${palpSev}, 'Mild transient flutter after exertion');`);
            }
          });
        }
      } catch (symEnrichErr) {
        console.warn('Marcus Thorne symptom enrich warning:', symEnrichErr);
      }
    } catch (jMigErr) {
      console.warn('Journeys migration error:', jMigErr);
    }

    // Check if daily health records exist for Alex Rivera
    const healthCheck = db.exec(`SELECT count(*) as count FROM daily_health_records WHERE patient_id = 'pat-alex-rivera';`);
    const healthCount = healthCheck[0]?.values[0]?.[0] as number || 0;

    if (healthCount === 0) {
      const healthDays = [
        { date: '2026-08-14', sleep: 7.5, quality: 'Good', exercise: 30, water: 8, meals: 3, stress: 3, mood: 'Good', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Feeling relatively rested. Busy start to the workday.', symptoms: [{ name: 'Headache', severity: 2, notes: 'Mild afternoon tightness' }, { name: 'Fatigue', severity: 2, notes: 'Normal end-of-day tiredness' }, { name: 'Heart Palpitations', severity: 2, notes: 'Faint flutter after morning coffee' }] },
        { date: '2026-08-15', sleep: 7.0, quality: 'Good', exercise: 25, water: 7, meals: 3, stress: 4, mood: 'Neutral', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Holter monitor turned in at clinic today.', symptoms: [{ name: 'Headache', severity: 3, notes: 'Occasional temple throb' }, { name: 'Fatigue', severity: 3, notes: 'Mild afternoon slump' }, { name: 'Heart Palpitations', severity: 3, notes: 'Noticeable before dinner' }] },
        { date: '2026-08-16', sleep: 6.5, quality: 'Fair', exercise: 15, water: 6, meals: 3, stress: 5, mood: 'Neutral', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Late conference call, struggled to wind down.', symptoms: [{ name: 'Headache', severity: 4, notes: 'Dull ache behind right eye' }, { name: 'Fatigue', severity: 4, notes: 'Sluggish afternoon, needed second coffee' }, { name: 'Heart Palpitations', severity: 4, notes: 'Fluttering while sitting at desk' }] },
        { date: '2026-08-17', sleep: 6.0, quality: 'Fair', exercise: 10, water: 6, meals: 2, stress: 6, mood: 'Anxious', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Anxious waiting for diagnostic test results.', symptoms: [{ name: 'Headache', severity: 5, notes: 'Throbbing headache from 2pm onwards' }, { name: 'Fatigue', severity: 5, notes: 'Low energy throughout the day' }, { name: 'Heart Palpitations', severity: 5, notes: 'Rapid beating during team meeting' }, { name: 'Dizziness', severity: 3, notes: 'Felt slight vertigo when standing up' }] },
        { date: '2026-08-18', sleep: 5.5, quality: 'Poor', exercise: 0, water: 5, meals: 2, stress: 7, mood: 'Stressed', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Diagnosis confirmed today. Big sprint release deadline at work.', symptoms: [{ name: 'Headache', severity: 7, notes: 'Severe frontal headache, light sensitive' }, { name: 'Fatigue', severity: 6, notes: 'Exhausted by midday' }, { name: 'Heart Palpitations', severity: 6, notes: 'Pounding chest sensation in evening' }] },
        { date: '2026-08-19', sleep: 5.0, quality: 'Poor', exercise: 0, water: 5, meals: 2, stress: 8, mood: 'Stressed', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Woke up twice during the night. High work pressure.', symptoms: [{ name: 'Headache', severity: 8, notes: 'Intense migraine-like pain' }, { name: 'Fatigue', severity: 7, notes: 'Heavy lethargy and muscle tension' }, { name: 'Heart Palpitations', severity: 8, notes: 'Frequent flutter episodes lasting 5-10 mins' }, { name: 'Dizziness', severity: 4, notes: 'Lightheaded in morning' }] },
        { date: '2026-08-20', sleep: 4.5, quality: 'Poor', exercise: 0, water: 4, meals: 2, stress: 9, mood: 'Low', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Peak stress day. Started Metoprolol 25mg prescribed by Dr. Chen.', symptoms: [{ name: 'Headache', severity: 9, notes: 'Severe throbbing headache all day' }, { name: 'Fatigue', severity: 8, notes: 'Heavy eye and mental fatigue' }, { name: 'Heart Palpitations', severity: 8, notes: 'Rapid resting pulse 98 bpm before first med dose' }] },
        { date: '2026-08-21', sleep: 5.0, quality: 'Poor', exercise: 10, water: 6, meals: 3, stress: 8, mood: 'Tired', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Second day on Metoprolol. Heart felt slightly steadier.', symptoms: [{ name: 'Headache', severity: 7, notes: 'Headache persistent but decreasing in sharpness' }, { name: 'Fatigue', severity: 6, notes: 'Mild medication drowsiness' }, { name: 'Heart Palpitations', severity: 6, notes: 'Fewer flutter spikes' }] },
        { date: '2026-08-22', sleep: 5.5, quality: 'Fair', exercise: 15, water: 7, meals: 3, stress: 7, mood: 'Neutral', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Weekend rest started. Reduced caffeine intake. Missed afternoon dose while out.', symptoms: [{ name: 'Headache', severity: 6, notes: 'Manageable dull ache' }, { name: 'Fatigue', severity: 5, notes: 'Energy improving with rest' }, { name: 'Heart Palpitations', severity: 5, notes: 'Only 1 flutter episode in morning' }] },
        { date: '2026-08-23', sleep: 6.0, quality: 'Fair', exercise: 20, water: 8, meals: 3, stress: 6, mood: 'Neutral', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Went for evening walk. Breathing exercises helped calm chest flutter.', symptoms: [{ name: 'Headache', severity: 4, notes: 'Mild tension only' }, { name: 'Fatigue', severity: 4, notes: 'Moderate fatigue after walk' }, { name: 'Heart Palpitations', severity: 4, notes: 'Resting pulse down to 78 bpm' }] },
        { date: '2026-08-24', sleep: 6.8, quality: 'Good', exercise: 25, water: 8, meals: 3, stress: 5, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Better sleep! Work project finished, feeling tension release.', symptoms: [{ name: 'Headache', severity: 3, notes: 'Occasional mild forehead pressure' }, { name: 'Fatigue', severity: 3, notes: 'Good stamina through work hours' }, { name: 'Heart Palpitations', severity: 2, notes: 'Almost zero fluttering' }] },
        { date: '2026-08-25', sleep: 7.2, quality: 'Good', exercise: 30, water: 9, meals: 3, stress: 4, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Steady energy. Metoprolol 25mg taken with breakfast.', symptoms: [{ name: 'Headache', severity: 2, notes: 'Very slight' }, { name: 'Fatigue', severity: 2, notes: 'Feeling alert and functional' }, { name: 'Heart Palpitations', severity: 2, notes: 'Heart rhythm feels normal and calm' }] },
        { date: '2026-08-26', sleep: 7.6, quality: 'Excellent', exercise: 35, water: 9, meals: 3, stress: 3, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Great sleep unbroken for 7.5 hours. Exercised without tachycardia.', symptoms: [{ name: 'Headache', severity: 1, notes: 'Near zero pain' }, { name: 'Fatigue', severity: 1, notes: 'High sustained energy' }, { name: 'Heart Palpitations', severity: 1, notes: 'None noted today' }] },
        { date: '2026-08-27', sleep: 8.0, quality: 'Excellent', exercise: 40, water: 10, meals: 3, stress: 2, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 0, notes: 'Feeling restored. Ready for next week follow-up check with Dr. Chen.', symptoms: [{ name: 'Headache', severity: 1, notes: 'No headache' }, { name: 'Fatigue', severity: 1, notes: 'Well rested and energetic' }, { name: 'Heart Palpitations', severity: 1, notes: 'Normal resting pulse 68 bpm' }] },
      ];

      healthDays.forEach((d) => {
        const recordId = uuidv4();
        db.run(`
          INSERT INTO daily_health_records (id, patient_id, date, sleep_hours, sleep_quality, exercise_minutes, water_intake, meal_count, stress_level, mood, medication_taken, med_morning, med_afternoon, med_night, notes) VALUES
          ('${recordId}', 'pat-alex-rivera', '${d.date}', ${d.sleep}, '${d.quality}', ${d.exercise}, ${d.water}, ${d.meals}, ${d.stress}, '${d.mood}', ${d.med}, ${d.med_m || 0}, ${d.med_a || 0}, ${d.med_n || 0}, '${d.notes.replace(/'/g, "''")}');
        `);

        d.symptoms.forEach((s) => {
          const symId = uuidv4();
          db.run(`
            INSERT INTO symptoms (id, daily_record_id, name, severity, notes) VALUES
            ('${symId}', '${recordId}', '${s.name.replace(/'/g, "''")}', ${s.severity}, '${(s.notes || '').replace(/'/g, "''")}');
          `);
        });
      });
    }

    // Ensure Maya Lin has 14 full days of health records (Aug 14-27, 2026)
    try {
      const mayaHealthCheck = db.exec(`SELECT count(*) as count FROM daily_health_records WHERE patient_id = 'pat-maya-lin';`);
      const mayaCount = (mayaHealthCheck[0]?.values[0]?.[0] as number) || 0;
      if (mayaCount < 14) {
        const extraMayaDays = [
          { date: '2026-08-14', sleep: 6.2, quality: 'Fair', exercise: 15, water: 6, meals: 3, stress: 6, mood: 'Tired', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Feeling slightly fatigued in the afternoon.', symptoms: [{ name: 'Heart Palpitations', severity: 4 }, { name: 'Fatigue', severity: 4 }] },
          { date: '2026-08-15', sleep: 5.8, quality: 'Fair', exercise: 10, water: 5, meals: 2, stress: 7, mood: 'Anxious', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Work deadline approaching, noticed skipped heartbeats.', symptoms: [{ name: 'Heart Palpitations', severity: 6 }, { name: 'Headache', severity: 5 }, { name: 'Fatigue', severity: 5 }] },
          { date: '2026-08-16', sleep: 6.0, quality: 'Fair', exercise: 15, water: 6, meals: 3, stress: 7, mood: 'Stressed', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Consultation with Dr. Sarah Chen at St. Jude today.', symptoms: [{ name: 'Heart Palpitations', severity: 5 }, { name: 'Headache', severity: 4 }] },
          { date: '2026-08-17', sleep: 5.4, quality: 'Poor', exercise: 0, water: 5, meals: 2, stress: 8, mood: 'Anxious', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Poor sleep, felt uneasy and fluttery.', symptoms: [{ name: 'Heart Palpitations', severity: 7 }, { name: 'Fatigue', severity: 6 }, { name: 'Headache', severity: 5 }] },
          { date: '2026-08-18', sleep: 6.5, quality: 'Good', exercise: 20, water: 7, meals: 3, stress: 5, mood: 'Calm', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Took light walk after dinner, felt much better.', symptoms: [{ name: 'Heart Palpitations', severity: 3 }, { name: 'Fatigue', severity: 3 }] },
          { date: '2026-08-19', sleep: 5.9, quality: 'Fair', exercise: 10, water: 6, meals: 3, stress: 6, mood: 'Neutral', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Followed relaxation breathing exercises.', symptoms: [{ name: 'Heart Palpitations', severity: 4 }, { name: 'Fatigue', severity: 4 }] },
          { date: '2026-08-20', sleep: 5.5, quality: 'Fair', exercise: 10, water: 6, meals: 2, stress: 7, mood: 'Anxious', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Magnesium started per prescription.', symptoms: [{ name: 'Heart Palpitations', severity: 5 }, { name: 'Headache', severity: 4 }, { name: 'Fatigue', severity: 5 }] }
        ];
        extraMayaDays.forEach(d => {
          const exists = db.exec(`SELECT 1 FROM daily_health_records WHERE patient_id = 'pat-maya-lin' AND date = '${d.date}'`);
          if (!exists || !exists[0]?.values?.length) {
            const recId = uuidv4();
            db.run(`
              INSERT INTO daily_health_records (id, patient_id, date, sleep_hours, sleep_quality, exercise_minutes, water_intake, meal_count, stress_level, mood, medication_taken, med_morning, med_afternoon, med_night, notes) VALUES
              ('${recId}', 'pat-maya-lin', '${d.date}', ${d.sleep}, '${d.quality}', ${d.exercise}, ${d.water}, ${d.meals}, ${d.stress}, '${d.mood}', ${d.med}, ${d.med_m || 0}, ${d.med_a || 0}, ${d.med_n || 0}, '${d.notes.replace(/'/g, "''")}');
            `);
            d.symptoms.forEach(s => {
              db.run(`
                INSERT INTO symptoms (id, daily_record_id, name, severity, notes) VALUES
                ('${uuidv4()}', '${recId}', '${s.name}', ${s.severity}, '');
              `);
            });
          }
        });
      }
    } catch (mErr) {
      console.warn('Maya Lin extra days seeding check:', mErr);
    }

    // Ensure Marcus Thorne has 14 full days of health records (Aug 14-27, 2026)
    try {
      const thorneHealthCheck = db.exec(`SELECT count(*) as count FROM daily_health_records WHERE patient_id = 'pat-marcus-thorne';`);
      const thorneCount = (thorneHealthCheck[0]?.values[0]?.[0] as number) || 0;
      if (thorneCount < 14) {
        const extraThorneDays = [
          { date: '2026-08-14', sleep: 7.0, quality: 'Good', exercise: 15, water: 7, meals: 3, stress: 4, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Gentle walking indoors.', symptoms: [{ name: 'Fatigue', severity: 4 }] },
          { date: '2026-08-15', sleep: 7.2, quality: 'Good', exercise: 20, water: 8, meals: 3, stress: 3, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Recovering energy steadily.', symptoms: [{ name: 'Fatigue', severity: 3 }] },
          { date: '2026-08-16', sleep: 7.0, quality: 'Good', exercise: 20, water: 8, meals: 3, stress: 3, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Taking Lisinopril and Atorvastatin as directed.', symptoms: [{ name: 'Fatigue', severity: 3 }] },
          { date: '2026-08-17', sleep: 7.4, quality: 'Good', exercise: 20, water: 8, meals: 3, stress: 3, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'BP 122/78, resting HR 68.', symptoms: [{ name: 'Fatigue', severity: 2 }] }
        ];
        extraThorneDays.forEach(d => {
          const exists = db.exec(`SELECT 1 FROM daily_health_records WHERE patient_id = 'pat-marcus-thorne' AND date = '${d.date}'`);
          if (!exists || !exists[0]?.values?.length) {
            const recId = uuidv4();
            db.run(`
              INSERT INTO daily_health_records (id, patient_id, date, sleep_hours, sleep_quality, exercise_minutes, water_intake, meal_count, stress_level, mood, medication_taken, med_morning, med_afternoon, med_night, notes) VALUES
              ('${recId}', 'pat-marcus-thorne', '${d.date}', ${d.sleep}, '${d.quality}', ${d.exercise}, ${d.water}, ${d.meals}, ${d.stress}, '${d.mood}', ${d.med}, ${d.med_m || 0}, ${d.med_a || 0}, ${d.med_n || 0}, '${d.notes.replace(/'/g, "''")}');
            `);
            d.symptoms.forEach(s => {
              db.run(`
                INSERT INTO symptoms (id, daily_record_id, name, severity, notes) VALUES
                ('${uuidv4()}', '${recId}', '${s.name}', ${s.severity}, '');
              `);
            });
          }
        });
      }
    } catch (tErr) {
      console.warn('Marcus Thorne extra days seeding check:', tErr);
    }

    // Ensure Dr. Robert Taylor has appointment with Maya Lin for cross-doctor testing
    try {
      const taylorAppCheck = db.exec(`SELECT count(*) as count FROM appointments WHERE doctor_id = 'doc-robert-stjude' AND patient_id = 'pat-maya-lin';`);
      const tCount = (taylorAppCheck[0]?.values[0]?.[0] as number) || 0;
      if (tCount === 0) {
        db.run(`
          INSERT INTO appointments (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes) VALUES
          ('app-taylor-maya-001', 'pat-maya-lin', 'doc-robert-stjude', 'hosp-st-jude', '2026-08-29', '02:00 PM', 'Electrophysiology Arrhythmia Secondary Evaluation', 'upcoming', 'Secondary evaluation of exertional heart rate spikes and Holter findings.');
        `);
      }
    } catch (atErr) {
      console.warn('Taylor appointment check:', atErr);
    }

    // Ensure all 8 journey events exist for Alex Rivera's active cardiology journey
    const stagesCheck = db.exec(`SELECT count(*) as count FROM journey_events WHERE patient_id = 'pat-alex-rivera' AND journey_id = 'journey-alex-cardio-001';`);
    const journeyCount = stagesCheck[0]?.values[0]?.[0] as number || 0;
    if (journeyCount < 8) {
      // Re-populate complete 8 stages for Alex Rivera
      db.run(`DELETE FROM journey_events WHERE patient_id = 'pat-alex-rivera' AND journey_id = 'journey-alex-cardio-001';`);
      db.run(`
        INSERT INTO journey_events (id, patient_id, journey_id, stage, title, description, date, status, doctor_id, hospital_id, next_step, clinical_note, doctor_plan, clinical_follow_up) VALUES
        ('ev-symptoms-001', 'pat-alex-rivera', 'journey-alex-cardio-001', 'Symptoms', 'Initial Episodic Palpitations & Tension Headaches', 'Patient experienced recurring palpitations, chest flutter, and frontal headaches aggravated during intense project deadlines and irregular sleep.', '2026-08-01', 'completed', 'doc-chen-stjude', 'hosp-st-jude', 'Schedule cardiology consultation', 'Patient presented with 2-week history of sinus palpitations.', 'Baseline clinical workup ordered.', '2026-08-06'),
        ('ev-consult-002', 'pat-alex-rivera', 'journey-alex-cardio-001', 'Consultation', 'Cardiology Diagnostic Consultation', 'Comprehensive in-clinic consultation with Dr. Sarah Chen. Resting BP 138/88 mmHg, resting pulse 94 bpm. Ordered 12-lead ECG, 48-hr ambulatory Holter monitor, and comprehensive blood panel.', '2026-08-06', 'completed', 'doc-chen-stjude', 'hosp-st-jude', 'Complete Holter monitor and echocardiogram', 'Physical exam: S1/S2 present, no murmurs. Resting tachycardia (94 bpm). Advised caffeine restriction.', 'Ordered ambulatory telemetry and metabolic labs.', '2026-08-15'),
        ('ev-tests-003', 'pat-alex-rivera', 'journey-alex-cardio-001', 'Tests', 'Holter Monitor & Cardiac Blood Panel Execution', 'Diagnostic tests conducted at St. Jude Cardiac Lab. 48-hour continuous monitor worn and full metabolic panel drawn.', '2026-08-12', 'completed', 'doc-chen-stjude', 'hosp-st-jude', 'Review lab telemetry and confirm formal diagnosis', 'Lab specimens received and Holter telemetry uploaded without artifact.', 'Awaiting pathology report.', '2026-08-15'),
        ('ev-testres-004', 'pat-alex-rivera', 'journey-alex-cardio-001', 'Test Result', 'ECG & Cardiac Lab Diagnostics Uploaded', 'Holter analysis demonstrated intermittent sinus tachycardia during midday and evening hours with isolated PACs. Normal cardiac ultrasound & ejection fraction (62%). Blood chemistry normal.', '2026-08-15', 'completed', 'doc-chen-stjude', 'hosp-st-jude', 'Doctor clinical review & diagnosis formulation', 'ECG indicates regular sinus rhythm with rate acceleration during stress triggers. No QT prolongation.', 'Formulate autonomic stabilization regimen.', '2026-08-18'),
        ('ev-diag-005', 'pat-alex-rivera', 'journey-alex-cardio-001', 'Diagnosis', 'Diagnosis: Stress-Induced Sinus Tachycardia', 'Formal clinical diagnosis established. Correlated with autonomic stress reactivity and sleep deprivation. No structural cardiomyopathy or ischemia detected.', '2026-08-18', 'completed', 'doc-chen-stjude', 'hosp-st-jude', 'Initiate tailored beta-blocker protocol & daily health logging', 'Diagnosis confirmed: Sinus Tachycardia Secondary to Autonomic Stress Reactivity. Patient reassured.', 'Initiate low-dose Metoprolol 25mg ER and lifestyle sleep hygiene.', '2026-08-20'),
        ('ev-treat-006', 'pat-alex-rivera', 'journey-alex-cardio-001', 'Treatment', 'Metoprolol Protocol & Daily Health Logging', 'Prescribed low-dose Metoprolol Succinate 25mg daily. Initiated daily CareFlow tracking for sleep, hydration, and stress correlation.', '2026-08-20', 'current', 'doc-chen-stjude', 'hosp-st-jude', 'Follow-up appointment on Sep 2nd, 2026 for 2-week response review', 'Patient started Metoprolol Succinate 25mg once daily. Instructed on daily logging in CareFlow portal.', 'Assess symptom resolution, resting heart rate response, and sleep restoration at 2 weeks.', '2026-09-02'),
        ('ev-recov-007', 'pat-alex-rivera', 'journey-alex-cardio-001', 'Recovery', 'Holter Re-assessment & Cardiac Stabilization', 'Scheduled 30-day rhythm check. Goal: Heart rate resting <75 bpm, zero palpitation episodes, and normalized sleep recovery scores.', '2026-09-10', 'upcoming', 'doc-chen-stjude', 'hosp-st-jude', 'Repeat 24-hr Holter patch if symptom score remains <2/10', NULL, NULL, NULL),
        ('ev-follow-008', 'pat-alex-rivera', 'journey-alex-cardio-001', 'Follow-up', 'Comprehensive 60-Day Progress & Discharge Review', 'Final milestone evaluation with Dr. Sarah Chen to assess long-term dosage weaning or maintenance protocol.', '2026-09-25', 'upcoming', 'doc-chen-stjude', 'hosp-st-jude', 'Transition to maintenance phase with quarterly check-ins', NULL, NULL, NULL);
      `);
    }

    // Check if notifications exist for Alex Rivera
    const check = db.exec(`SELECT count(*) as count FROM notifications WHERE patient_id = 'pat-alex-rivera';`);
    const count = check[0]?.values[0]?.[0] as number || 0;

    if (count === 0) {
      db.run(`
        INSERT INTO notifications (id, patient_id, title, message, type, is_read, action_tab, created_at) VALUES
        ('${uuidv4()}', 'pat-alex-rivera', 'Follow-up appointment scheduled', 'Your cardiology treatment follow-up consultation with Dr. Sarah Chen is scheduled for September 2, 2026 at 10:30 AM at St. Jude Medical Center.', 'appointment', 0, 'appointments', '2026-08-26 14:30:00'),
        ('${uuidv4()}', 'pat-alex-rivera', 'Dr. Chen added a clinical care plan', 'Dr. Sarah Chen updated your Treatment stage: "Assess symptom resolution, resting heart rate response, and sleep restoration at 2 weeks."', 'journey', 0, 'journey', '2026-08-25 11:20:00'),
        ('${uuidv4()}', 'pat-alex-rivera', 'Diagnostic report available', '48-Hour Continuous Holter Monitor Diagnostic Summary has been processed and uploaded by St. Jude Cardiac Diagnostics Lab.', 'report', 1, 'reports', '2026-08-15 16:45:00'),
        ('${uuidv4()}', 'pat-alex-rivera', 'New care task assigned by Dr. Chen', 'Dr. Sarah Chen assigned task: "Confirm cardiology follow-up session with Dr. Chen" (Due Sep 1, 2026).', 'task', 0, 'tasks', '2026-08-24 09:00:00'),
        ('${uuidv4()}', 'pat-alex-rivera', 'Daily health log reminder', 'Good evening Alex, please remember to record today''s sleep quality, evening vitals, and medication doses in your health journal.', 'reminder', 1, 'health_recorder', '2026-08-26 20:00:00'),
        ('${uuidv4()}', 'pat-alex-rivera', 'Prescription adherence streak', 'Congratulations! You have maintained an 88% adherence streak over the last 7 days for Metoprolol Succinate ER 25mg.', 'prescription', 1, 'medications', '2026-08-27 08:30:00');
      `);
    }

    // Check if doctor notifications exist for Dr. Sarah Chen
    const docCheck = db.exec(`SELECT count(*) as count FROM doctor_notifications WHERE doctor_id = 'doc-chen-stjude';`);
    const docCount = docCheck[0]?.values[0]?.[0] as number || 0;

    if (docCount === 0) {
      db.run(`
        INSERT INTO doctor_notifications (id, doctor_id, patient_id, patient_name, title, message, type, severity, is_read, action_tab, action_id, created_at) VALUES
        ('${uuidv4()}', 'doc-chen-stjude', 'pat-alex-rivera', 'Alex Rivera', 'Patient Alert: Elevated Stress & Fatigue Index', 'Alex Rivera logged peak autonomic stress (8/10) with elevated fatigue following missed evening medication doses. Recommend reviewing vitals and dose timing.', 'alert', 'high', 0, 'patients', 'pat-alex-rivera', '2026-08-27 08:15:00'),
        ('${uuidv4()}', 'doc-chen-stjude', 'pat-maya-lin', 'Maya Lin', 'New Diagnostic Report Uploaded', 'Initial 12-Lead Resting ECG report has been uploaded and linked to Tests stage for Maya Lin.', 'report', 'normal', 0, 'reports', 'pat-maya-lin', '2026-08-26 16:40:00'),
        ('${uuidv4()}', 'doc-chen-stjude', 'pat-marcus-thorne', 'Marcus Thorne', 'Patient Completed Care Task', 'Marcus Thorne completed task: "Complete 30-min cardiac rehab walking session" (Target 35 mins achieved).', 'task', 'normal', 0, 'tasks', 'pat-marcus-thorne', '2026-08-27 07:30:00'),
        ('${uuidv4()}', 'doc-chen-stjude', 'pat-alex-rivera', 'Alex Rivera', 'Daily Health Record Submitted', 'Alex Rivera logged Day 14 health entry: 7.0h sleep (Good), 20m exercise, 8 glasses water, stress 5/10.', 'health_log', 'normal', 1, 'patients', 'pat-alex-rivera', '2026-08-26 21:10:00'),
        ('${uuidv4()}', 'doc-chen-stjude', 'pat-maya-lin', 'Maya Lin', 'Clinic Appointment Today', 'Maya Lin is scheduled for "Cardiac Stress Echo & Diagnostic Workup" today at 09:00 AM in Cardiology Suite 400.', 'appointment', 'normal', 0, 'appointments', 'pat-maya-lin', '2026-08-27 06:00:00'),
        ('${uuidv4()}', 'doc-chen-stjude', 'pat-marcus-thorne', 'Marcus Thorne', 'High Medication Adherence (95%+)', 'Marcus Thorne maintained 10 consecutive days of full medication compliance for Lisinopril 10mg and Atorvastatin 20mg.', 'adherence', 'normal', 1, 'patients', 'pat-marcus-thorne', '2026-08-26 18:00:00'),
        ('${uuidv4()}', 'doc-chen-stjude', 'pat-maya-lin', 'Maya Lin', 'Pre-Procedure Fasting Confirmed', 'Maya Lin marked task as completed: "Fast 8 hours prior to morning lipid & thyroid blood draw".', 'task', 'normal', 0, 'tasks', 'pat-maya-lin', '2026-08-27 06:45:00');
      `);
    }

    // Schema migration: Ensure users table check constraint allows 'caregiver'
    try {
      // Check SQLite table definition for users
      const usersSqlRes = db.exec(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users';`);
      const currentSql = usersSqlRes[0]?.values[0]?.[0] as string || '';
      if (currentSql && !currentSql.includes("'caregiver'")) {
        console.log('Migrating users table schema to allow caregiver role...');
        db.run('PRAGMA foreign_keys = OFF;');
        db.run(`
          CREATE TABLE IF NOT EXISTS users_migration_temp (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'hospital_admin', 'caregiver')),
            hospital_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
          );
        `);
        db.run(`INSERT OR IGNORE INTO users_migration_temp (id, name, email, password_hash, role, hospital_id, created_at) SELECT id, name, email, password_hash, role, hospital_id, created_at FROM users;`);
        db.run(`DROP TABLE users;`);
        db.run(`ALTER TABLE users_migration_temp RENAME TO users;`);
        db.run('PRAGMA foreign_keys = ON;');
        console.log('Users table schema migration completed successfully.');
      }
    } catch (migErr) {
      console.warn('Users table migration warning:', migErr);
    }

    // Schema migration: Ensure appointments table check constraint allows all modern appointment status values
    // ('pending', 'confirmed', 'upcoming', 'completed', 'cancelled', 'declined', 'past')
    try {
      const apptSqlRes = db.exec(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'appointments';`);
      const currentApptSql = apptSqlRes[0]?.values[0]?.[0] as string || '';
      if (currentApptSql && (!currentApptSql.includes("'pending'") || !currentApptSql.includes("'confirmed'"))) {
        console.log('Migrating appointments table schema to allow pending, confirmed, declined status values...');
        db.run('PRAGMA foreign_keys = OFF;');
        db.run(`
          CREATE TABLE IF NOT EXISTS appointments_migration_temp (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            hospital_id TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            purpose TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('pending', 'confirmed', 'upcoming', 'completed', 'cancelled', 'declined', 'past')),
            notes TEXT,
            related_journey_event_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id),
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
            FOREIGN KEY (related_journey_event_id) REFERENCES journey_events(id)
          );
        `);
        db.run(`
          INSERT INTO appointments_migration_temp (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes, related_journey_event_id, created_at)
          SELECT id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes, related_journey_event_id, created_at FROM appointments;
        `);
        db.run(`DROP TABLE appointments;`);
        db.run(`ALTER TABLE appointments_migration_temp RENAME TO appointments;`);
        db.run('PRAGMA foreign_keys = ON;');
        console.log('Appointments table schema migration completed successfully. All existing records preserved.');
      }
    } catch (migApptErr) {
      console.warn('Appointments table migration warning:', migApptErr);
    }

    // Schema migration: Ensure caregiver_links table exists and demo caregiver is seeded
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS caregiver_links (
          id TEXT PRIMARY KEY,
          caregiver_user_id TEXT NOT NULL,
          patient_id TEXT NOT NULL,
          can_view_journey INTEGER DEFAULT 1,
          can_view_appointments INTEGER DEFAULT 1,
          can_view_tasks INTEGER DEFAULT 0,
          can_view_reports INTEGER DEFAULT 0,
          can_view_daily_health INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (caregiver_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
          UNIQUE(caregiver_user_id, patient_id)
        );
      `);

      const cgUserCheck = db.exec(`SELECT count(*) as count FROM users WHERE email = 'caregiver@careflow.org';`);
      const cgUserCount = cgUserCheck[0]?.values[0]?.[0] as number || 0;
      if (cgUserCount === 0) {
        const passwordHash = bcrypt.hashSync('password123', 10);
        db.run(`
          INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
          ('user-cg-maria', 'Maria Rivera', 'caregiver@careflow.org', '${passwordHash}', 'caregiver', NULL);
        `);
      }

      const linkCheck = db.exec(`SELECT count(*) as count FROM caregiver_links WHERE caregiver_user_id = 'user-cg-maria' AND patient_id = 'pat-alex-rivera';`);
      const linkCount = linkCheck[0]?.values[0]?.[0] as number || 0;
      if (linkCount === 0) {
        db.run(`
          INSERT INTO caregiver_links (id, caregiver_user_id, patient_id, can_view_journey, can_view_appointments, can_view_tasks, can_view_reports, can_view_daily_health)
          VALUES ('link-maria-alex', 'user-cg-maria', 'pat-alex-rivera', 1, 1, 0, 0, 1);
        `);
      }

      // Second Demo Caregiver: Elena Rivera with Full Permissions (demonstrates visible Tasks and Medical Reports)
      const elenaUserCheck = db.exec(`SELECT count(*) as count FROM users WHERE email = 'elena.caregiver@careflow.org';`);
      const elenaUserCount = elenaUserCheck[0]?.values[0]?.[0] as number || 0;
      if (elenaUserCount === 0) {
        const passwordHash = bcrypt.hashSync('password123', 10);
        db.run(`
          INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
          ('user-cg-elena', 'Elena Rivera', 'elena.caregiver@careflow.org', '${passwordHash}', 'caregiver', NULL);
        `);
      }

      const elenaLinkCheck = db.exec(`SELECT count(*) as count FROM caregiver_links WHERE caregiver_user_id = 'user-cg-elena' AND patient_id = 'pat-alex-rivera';`);
      const elenaLinkCount = elenaLinkCheck[0]?.values[0]?.[0] as number || 0;
      if (elenaLinkCount === 0) {
        db.run(`
          INSERT INTO caregiver_links (id, caregiver_user_id, patient_id, can_view_journey, can_view_appointments, can_view_tasks, can_view_reports, can_view_daily_health)
          VALUES ('link-elena-alex', 'user-cg-elena', 'pat-alex-rivera', 1, 1, 1, 1, 1);
        `);
      }
    } catch (cgErr) {
      console.warn('Caregiver table migration check error:', cgErr);
    }

    // Ensure clinical notes and medical reports are populated for Alex Rivera, Maya Lin, and Marcus Thorne
    try {
      const alexNotesCheck = db.exec(`SELECT count(*) as count FROM clinical_notes WHERE patient_id = 'pat-alex-rivera';`);
      const alexNotesCount = alexNotesCheck[0]?.values[0]?.[0] as number || 0;
      if (alexNotesCount < 4) {
        db.run(`
          INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date, created_at) VALUES
          ('${uuidv4()}', 'pat-alex-rivera', 'doc-chen-stjude', 'ev-tests-003', 'Diagnostic Workup & Holter Attachment Briefing', 'Patient arrived for 48-hour Holter monitor lead placement. Instructions provided regarding activity logging.', 'Review telemetry upon device return.', '2026-08-15', '2026-08-12 10:15:00'),
          ('${uuidv4()}', 'pat-alex-rivera', 'doc-chen-stjude', 'ev-treat-006', 'Mid-Treatment Telemetry & Metoprolol Response Review', 'Check-in on Day 4 of Metoprolol Succinate ER 25mg. Significant reduction in resting pulse (72 bpm vs 94 bpm) and fewer palpitation spikes.', 'Continue current dosage. Bedtime routine encouraged.', '2026-09-02', '2026-08-24 14:30:00');
        `);
      }

      const mayaNotesCheck = db.exec(`SELECT count(*) as count FROM clinical_notes WHERE patient_id = 'pat-maya-lin';`);
      const mayaNotesCount = mayaNotesCheck[0]?.values[0]?.[0] as number || 0;
      if (mayaNotesCount < 3) {
        db.run(`
          INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date, created_at) VALUES
          ('${uuidv4()}', 'pat-maya-lin', 'doc-chen-stjude', 'ev-maya-001', 'Initial Triage & Exertional Palpitations Evaluation', 'Patient presents with episodic post-prandial palpitations and lightheadedness when climbing stairs. BP 134/86, HR 88 bpm.', 'Scheduled full cardiovascular diagnostic triage.', '2026-08-16', '2026-08-10 11:00:00'),
          ('${uuidv4()}', 'pat-maya-lin', 'doc-chen-stjude', 'ev-maya-003', 'Pre-Stress Echo Protocol & Workup Consultation', 'Pre-procedure review with patient. Fasting guidelines reviewed.', 'Proceed with stress echo on Aug 27 at 09:00 AM.', '2026-08-27', '2026-08-25 15:45:00');
        `);
      }

      const mayaReportsCheck = db.exec(`SELECT count(*) as count FROM medical_reports WHERE patient_id = 'pat-maya-lin';`);
      const mayaReportsCount = mayaReportsCheck[0]?.values[0]?.[0] as number || 0;
      if (mayaReportsCount < 3) {
        db.run(`
          INSERT INTO medical_reports (id, patient_id, doctor_id, hospital_id, name, type, date, file, journey_stage) VALUES
          ('${uuidv4()}', 'pat-maya-lin', 'doc-chen-stjude', 'hosp-stjude', 'Thyroid Stimulating Hormone & Metabolic Panel', 'PDF', '2026-08-20', 'maya_metabolic_panel.pdf', 'Tests'),
          ('${uuidv4()}', 'pat-maya-lin', 'doc-chen-stjude', 'hosp-stjude', 'Treadmill Stress Echo Preliminary Rhythm Tracing', 'PDF', '2026-08-27', 'maya_stress_echo_prelim.pdf', 'Tests');
        `);
      }

      const marcusReportsCheck = db.exec(`SELECT count(*) as count FROM medical_reports WHERE patient_id = 'pat-marcus-thorne';`);
      const marcusReportsCount = marcusReportsCheck[0]?.values[0]?.[0] as number || 0;
      if (marcusReportsCount < 3) {
        db.run(`
          INSERT INTO medical_reports (id, patient_id, doctor_id, hospital_id, name, type, date, file, journey_stage) VALUES
          ('${uuidv4()}', 'pat-marcus-thorne', 'doc-chen-stjude', 'hosp-stjude', 'Cardiac Rehabilitation Exercise Tolerance Report', 'PDF', '2026-08-22', 'thorne_rehab_stress_aug22.pdf', 'Recovery');
        `);
      }
    } catch (enrichErr) {
      console.warn('Demo data enrichment check warning:', enrichErr);
    }

    saveDb();
  } catch (err) {
    console.error('Error ensuring extra tables and seeds:', err);
  }
}

export async function initSchemaAndSeed(db: Database): Promise<void> {
  // Create tables matching core data models requested
  db.run(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      departments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'hospital_admin', 'caregiver')),
      hospital_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      date_of_birth TEXT,
      gender TEXT,
      contact TEXT,
      emergency_contact TEXT,
      blood_group TEXT,
      current_stage TEXT DEFAULT 'Diagnosis',
      doctor_id TEXT,
      hospital_id TEXT,
      medical_history TEXT,
      current_conditions TEXT,
      allergies TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      hospital_id TEXT NOT NULL,
      specialization TEXT NOT NULL,
      license_number TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS journeys (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'resolved', 'closed')),
      start_date TEXT NOT NULL,
      end_date TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journey_events (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      journey_id TEXT,
      stage TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('completed', 'current', 'upcoming', 'delayed')),
      doctor_id TEXT,
      hospital_id TEXT,
      next_step TEXT,
      clinical_note TEXT,
      doctor_plan TEXT,
      clinical_follow_up TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS daily_health_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      date TEXT NOT NULL,
      sleep_hours REAL,
      sleep_quality TEXT,
      exercise_minutes INTEGER,
      water_intake REAL,
      meal_count INTEGER,
      stress_level INTEGER CHECK(stress_level BETWEEN 1 AND 10),
      mood TEXT,
      medication_taken INTEGER DEFAULT 1,
      med_morning INTEGER DEFAULT 0,
      med_afternoon INTEGER DEFAULT 0,
      med_night INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS symptoms (
      id TEXT PRIMARY KEY,
      daily_record_id TEXT NOT NULL,
      name TEXT NOT NULL,
      severity INTEGER CHECK(severity BETWEEN 1 AND 10),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (daily_record_id) REFERENCES daily_health_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS medical_reports (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT,
      hospital_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      file TEXT,
      journey_stage TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      hospital_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('pending', 'confirmed', 'upcoming', 'completed', 'cancelled', 'declined', 'past')),
      notes TEXT,
      related_journey_event_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
      FOREIGN KEY (related_journey_event_id) REFERENCES journey_events(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      related_journey_event_id TEXT,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (related_journey_event_id) REFERENCES journey_events(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      instructions TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'discontinued')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS clinical_notes (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      journey_event_id TEXT,
      title TEXT NOT NULL,
      note TEXT NOT NULL,
      plan TEXT,
      follow_up_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (journey_event_id) REFERENCES journey_events(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('appointment', 'journey', 'report', 'task', 'reminder', 'prescription', 'alert')),
      is_read INTEGER DEFAULT 0,
      action_tab TEXT DEFAULT 'dashboard',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS doctor_notifications (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      patient_id TEXT,
      patient_name TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('report', 'task', 'health_log', 'appointment', 'alert', 'adherence')),
      severity TEXT DEFAULT 'normal' CHECK(severity IN ('normal', 'high', 'critical')),
      is_read INTEGER DEFAULT 0,
      action_tab TEXT DEFAULT 'patients',
      action_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );
  `);

  // Check if hospitals exist; if not, seed default demo data
  const check = db.exec(`SELECT count(*) as count FROM hospitals;`);
  const count = check[0]?.values[0]?.[0] as number || 0;

  if (count === 0) {
    console.log('Seeding initial CareFlow data (hospitals, demo users for 3 roles)...');

    const hosp1Id = 'hosp-stjude';
    const hosp2Id = 'hosp-citygen';

    const stJudeDepts = JSON.stringify(['Cardiology & Internal Medicine', 'Emergency & Critical Care', 'Diagnostic Radiology', 'Pediatrics']);
    const cityGenDepts = JSON.stringify(['Neurology', 'General Surgery', 'Orthopedics', 'Oncology']);

    db.run(`
      INSERT INTO hospitals (id, name, address, phone, departments) VALUES
      ('${hosp1Id}', 'St. Jude Medical Center', '100 Mercy Way, Suite 400', '+1 (555) 234-5678', '${stJudeDepts.replace(/'/g, "''")}'),
      ('${hosp2Id}', 'City General Hospital', '742 Evergreen Blvd', '+1 (555) 876-5432', '${cityGenDepts.replace(/'/g, "''")}');
    `);

    // Common password hash for 'password123'
    const passwordHash = bcrypt.hashSync('password123', 10);

    // 1. Hospital Admin for St. Jude
    const admin1UserId = 'user-admin-stjude';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${admin1UserId}', 'Elena Rostova', 'admin@stjude.org', '${passwordHash}', 'hospital_admin', '${hosp1Id}');
    `);

    // 2. Doctor 1 for St. Jude (Dr. Sarah Chen)
    const doctor1UserId = 'user-doc-chen';
    const doctor1Id = 'doc-chen-stjude';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${doctor1UserId}', 'Dr. Sarah Chen, MD', 'dr.chen@stjude.org', '${passwordHash}', 'doctor', '${hosp1Id}');
    `);
    db.run(`
      INSERT INTO doctors (id, user_id, hospital_id, specialization, license_number, is_active) VALUES
      ('${doctor1Id}', '${doctor1UserId}', '${hosp1Id}', 'Cardiology & Internal Medicine', 'MD-CA-98421', 1);
    `);

    // 2b. Doctor 2 for St. Jude (Dr. Robert Taylor)
    const doctor3UserId = 'user-doc-robert';
    const doctor3Id = 'doc-robert-stjude';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${doctor3UserId}', 'Dr. Robert Taylor, MD', 'dr.taylor@stjude.org', '${passwordHash}', 'doctor', '${hosp1Id}');
    `);
    db.run(`
      INSERT INTO doctors (id, user_id, hospital_id, specialization, license_number, is_active) VALUES
      ('${doctor3Id}', '${doctor3UserId}', '${hosp1Id}', 'Emergency & Critical Care', 'MD-CA-67290', 1);
    `);

    // 3. Second Doctor for City General (to test role & hospital isolation)
    const doctor2UserId = 'user-doc-marcus';
    const doctor2Id = 'doc-marcus-citygen';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${doctor2UserId}', 'Dr. Marcus Vance, MD', 'dr.marcus@citygen.org', '${passwordHash}', 'doctor', '${hosp2Id}');
    `);
    db.run(`
      INSERT INTO doctors (id, user_id, hospital_id, specialization, license_number, is_active) VALUES
      ('${doctor2Id}', '${doctor2UserId}', '${hosp2Id}', 'Neurology', 'MD-NY-44820', 1);
    `);

    // 4. Hospital Admin for City General
    const admin2UserId = 'user-admin-citygen';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${admin2UserId}', 'David Sterling', 'admin@citygen.org', '${passwordHash}', 'hospital_admin', '${hosp2Id}');
    `);

    // ==========================================
    // SEED PATIENT 1: Alex Rivera (Stage 6: Treatment, Dr. Sarah Chen, St. Jude)
    // ==========================================
    const patient1UserId = 'user-pat-alex';
    const patient1Id = 'pat-alex-rivera';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${patient1UserId}', 'Alex Rivera', 'alex.rivera@example.com', '${passwordHash}', 'patient', '${hosp1Id}');
    `);
    db.run(`
      INSERT INTO patients (id, user_id, date_of_birth, contact, emergency_contact, blood_group, current_stage, doctor_id, hospital_id) VALUES
      ('${patient1Id}', '${patient1UserId}', '1988-04-12', '+1 (555) 345-6789', 'Maria Rivera (+1 555-901-2345)', 'O+', 'Treatment', '${doctor1Id}', '${hosp1Id}');
    `);

    const ev1 = 'ev-symptoms-001';
    const ev2 = 'ev-consult-002';
    const ev3 = 'ev-tests-003';
    const ev4 = 'ev-testres-004';
    const ev5 = 'ev-diag-005';
    const ev6 = 'ev-treat-006';
    const ev7 = 'ev-recov-007';
    const ev8 = 'ev-follow-008';

    db.run(`
      INSERT INTO journey_events (id, patient_id, stage, title, description, date, status, doctor_id, hospital_id, next_step, clinical_note, doctor_plan, clinical_follow_up) VALUES
      ('${ev1}', '${patient1Id}', 'Symptoms', 'Initial Episodic Palpitations & Tension Headaches', 'Patient experienced recurring palpitations, chest flutter, and frontal headaches aggravated during intense project deadlines and irregular sleep.', '2026-08-01', 'completed', '${doctor1Id}', '${hosp1Id}', 'Schedule cardiology consultation', 'Patient presented with 2-week history of sinus palpitations.', 'Baseline clinical workup ordered.', '2026-08-06'),
      ('${ev2}', '${patient1Id}', 'Consultation', 'Cardiology Diagnostic Consultation', 'Comprehensive in-clinic consultation with Dr. Sarah Chen. Resting BP 138/88 mmHg, resting pulse 94 bpm. Ordered 12-lead ECG, 48-hr ambulatory Holter monitor, and comprehensive blood panel.', '2026-08-06', 'completed', '${doctor1Id}', '${hosp1Id}', 'Complete Holter monitor and echocardiogram', 'Physical exam: S1/S2 present, no murmurs. Resting tachycardia (94 bpm). Advised caffeine restriction.', 'Ordered ambulatory telemetry and metabolic labs.', '2026-08-15'),
      ('${ev3}', '${patient1Id}', 'Tests', 'Holter Monitor & Cardiac Blood Panel Execution', 'Diagnostic tests conducted at St. Jude Cardiac Lab. 48-hour continuous monitor worn and full metabolic panel drawn.', '2026-08-12', 'completed', '${doctor1Id}', '${hosp1Id}', 'Review lab telemetry and confirm formal diagnosis', 'Lab specimens received and Holter telemetry uploaded without artifact.', 'Awaiting pathology report.', '2026-08-15'),
      ('${ev4}', '${patient1Id}', 'Test Result', 'ECG & Cardiac Lab Diagnostics Uploaded', 'Holter analysis demonstrated intermittent sinus tachycardia during midday and evening hours with isolated PACs. Normal cardiac ultrasound & ejection fraction (62%). Blood chemistry normal.', '2026-08-15', 'completed', '${doctor1Id}', '${hosp1Id}', 'Doctor clinical review & diagnosis formulation', 'ECG indicates regular sinus rhythm with rate acceleration during stress triggers. No QT prolongation.', 'Formulate autonomic stabilization regimen.', '2026-08-18'),
      ('${ev5}', '${patient1Id}', 'Diagnosis', 'Diagnosis: Stress-Induced Sinus Tachycardia', 'Formal clinical diagnosis established. Correlated with autonomic stress reactivity and sleep deprivation. No structural cardiomyopathy or ischemia detected.', '2026-08-18', 'completed', '${doctor1Id}', '${hosp1Id}', 'Initiate tailored beta-blocker protocol & daily health logging', 'Diagnosis confirmed: Sinus Tachycardia Secondary to Autonomic Stress Reactivity. Patient reassured.', 'Initiate low-dose Metoprolol 25mg ER and lifestyle sleep hygiene.', '2026-08-20'),
      ('${ev6}', '${patient1Id}', 'Treatment', 'Metoprolol Protocol & Daily Health Logging', 'Prescribed low-dose Metoprolol Succinate 25mg daily. Initiated daily CareFlow tracking for sleep, hydration, and stress correlation.', '2026-08-20', 'current', '${doctor1Id}', '${hosp1Id}', 'Follow-up appointment on Sep 2nd, 2026 for 2-week response review', 'Patient started Metoprolol Succinate 25mg once daily. Instructed on daily logging in CareFlow portal.', 'Assess symptom resolution, resting heart rate response, and sleep restoration at 2 weeks.', '2026-09-02'),
      ('${ev7}', '${patient1Id}', 'Recovery', 'Holter Re-assessment & Cardiac Stabilization', 'Scheduled 30-day rhythm check. Goal: Heart rate resting <75 bpm, zero palpitation episodes, and normalized sleep recovery scores.', '2026-09-10', 'upcoming', '${doctor1Id}', '${hosp1Id}', 'Repeat 24-hr Holter patch if symptom score remains <2/10', NULL, NULL, NULL),
      ('${ev8}', '${patient1Id}', 'Follow-up', 'Comprehensive 60-Day Progress & Discharge Review', 'Final milestone evaluation with Dr. Sarah Chen to assess long-term dosage weaning or maintenance protocol.', '2026-09-25', 'upcoming', '${doctor1Id}', '${hosp1Id}', 'Transition to maintenance phase with quarterly check-ins', NULL, NULL, NULL);
    `);

    // Prescriptions for Alex Rivera
    db.run(`
      INSERT INTO prescriptions (id, patient_id, doctor_id, name, dosage, frequency, duration, instructions, status) VALUES
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', 'Metoprolol Succinate ER', '25mg', 'Once daily (morning)', '30 days', 'Take with morning meal and full glass of water. Monitor resting pulse.', 'active'),
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', 'Electrolyte & Hydration Solution', '500ml', 'Daily afternoon', 'Ongoing', 'Maintain consistent fluid intake during working hours.', 'active');
    `);

    // Clinical Notes for Alex Rivera
    db.run(`
      INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date) VALUES
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${ev2}', 'Initial Cardiology Evaluation', 'Patient presents with a 2-week history of episodic palpitations and tension-type headaches correlated with irregular work hours and sleep deficit. Exam: BP 138/88, HR 94 bpm. Heart sounds clear, no murmur.', 'Ordered 12-lead ECG, 48-hr ambulatory Holter, and metabolic panel. Reassurance provided.', '2026-08-15'),
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${ev5}', 'Diagnostic Conference & Regimen Planning', 'Holter and echocardiogram review demonstrates sinus tachycardia without structural heart disease. Symptoms correlate directly with sleep restriction (<6 hrs) and high stress scores.', 'Initiate Metoprolol Succinate 25mg ER daily. Patient to maintain continuous daily logs in CareFlow app.', '2026-09-02');
    `);

    // 14 Days of Daily Health Records for Alex Rivera
    const healthDays = [
      { date: '2026-08-14', sleep: 7.5, quality: 'Good', exercise: 30, water: 8, meals: 3, stress: 3, mood: 'Good', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Feeling relatively rested. Busy start to the workday.', symptoms: [{ name: 'Headache', severity: 2, notes: 'Mild afternoon tightness' }, { name: 'Fatigue', severity: 2, notes: 'Normal end-of-day tiredness' }, { name: 'Heart Palpitations', severity: 2, notes: 'Faint flutter after morning coffee' }] },
      { date: '2026-08-15', sleep: 7.0, quality: 'Good', exercise: 25, water: 7, meals: 3, stress: 4, mood: 'Neutral', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Holter monitor turned in at clinic today.', symptoms: [{ name: 'Headache', severity: 3, notes: 'Occasional temple throb' }, { name: 'Fatigue', severity: 3, notes: 'Mild afternoon slump' }, { name: 'Heart Palpitations', severity: 3, notes: 'Noticeable before dinner' }] },
      { date: '2026-08-16', sleep: 6.5, quality: 'Fair', exercise: 15, water: 6, meals: 3, stress: 5, mood: 'Neutral', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Late conference call, struggled to wind down.', symptoms: [{ name: 'Headache', severity: 4, notes: 'Dull ache behind right eye' }, { name: 'Fatigue', severity: 4, notes: 'Sluggish afternoon, needed second coffee' }, { name: 'Heart Palpitations', severity: 4, notes: 'Fluttering while sitting at desk' }] },
      { date: '2026-08-17', sleep: 6.0, quality: 'Fair', exercise: 10, water: 6, meals: 2, stress: 6, mood: 'Anxious', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Anxious waiting for diagnostic test results.', symptoms: [{ name: 'Headache', severity: 5, notes: 'Throbbing headache from 2pm onwards' }, { name: 'Fatigue', severity: 5, notes: 'Low energy throughout the day' }, { name: 'Heart Palpitations', severity: 5, notes: 'Rapid beating during team meeting' }, { name: 'Dizziness', severity: 3, notes: 'Felt slight vertigo when standing up' }] },
      { date: '2026-08-18', sleep: 5.5, quality: 'Poor', exercise: 0, water: 5, meals: 2, stress: 7, mood: 'Stressed', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Diagnosis confirmed today. Big sprint release deadline at work.', symptoms: [{ name: 'Headache', severity: 7, notes: 'Severe frontal headache, light sensitive' }, { name: 'Fatigue', severity: 6, notes: 'Exhausted by midday' }, { name: 'Heart Palpitations', severity: 6, notes: 'Pounding chest sensation in evening' }] },
      { date: '2026-08-19', sleep: 5.0, quality: 'Poor', exercise: 0, water: 5, meals: 2, stress: 8, mood: 'Stressed', med: 0, med_m: 0, med_a: 0, med_n: 0, notes: 'Woke up twice during the night. High work pressure.', symptoms: [{ name: 'Headache', severity: 8, notes: 'Intense migraine-like pain' }, { name: 'Fatigue', severity: 7, notes: 'Heavy lethargy and muscle tension' }, { name: 'Heart Palpitations', severity: 8, notes: 'Frequent flutter episodes lasting 5-10 mins' }, { name: 'Dizziness', severity: 4, notes: 'Lightheaded in morning' }] },
      { date: '2026-08-20', sleep: 4.5, quality: 'Poor', exercise: 0, water: 4, meals: 2, stress: 9, mood: 'Low', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Peak stress day. Started Metoprolol 25mg prescribed by Dr. Chen.', symptoms: [{ name: 'Headache', severity: 9, notes: 'Severe throbbing headache all day' }, { name: 'Fatigue', severity: 8, notes: 'Heavy eye and mental fatigue' }, { name: 'Heart Palpitations', severity: 8, notes: 'Rapid resting pulse 98 bpm before first med dose' }] },
      { date: '2026-08-21', sleep: 5.0, quality: 'Poor', exercise: 10, water: 6, meals: 3, stress: 8, mood: 'Tired', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Second day on Metoprolol. Heart felt slightly steadier.', symptoms: [{ name: 'Headache', severity: 7, notes: 'Headache persistent but decreasing in sharpness' }, { name: 'Fatigue', severity: 6, notes: 'Mild medication drowsiness' }, { name: 'Heart Palpitations', severity: 6, notes: 'Fewer flutter spikes' }] },
      { date: '2026-08-22', sleep: 5.5, quality: 'Fair', exercise: 15, water: 7, meals: 3, stress: 7, mood: 'Neutral', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Weekend rest started. Reduced caffeine intake. Missed afternoon dose while out.', symptoms: [{ name: 'Headache', severity: 6, notes: 'Manageable dull ache' }, { name: 'Fatigue', severity: 5, notes: 'Energy improving with rest' }, { name: 'Heart Palpitations', severity: 5, notes: 'Only 1 flutter episode in morning' }] },
      { date: '2026-08-23', sleep: 6.0, quality: 'Fair', exercise: 20, water: 8, meals: 3, stress: 6, mood: 'Neutral', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Went for evening walk. Breathing exercises helped calm chest flutter.', symptoms: [{ name: 'Headache', severity: 4, notes: 'Mild tension only' }, { name: 'Fatigue', severity: 4, notes: 'Moderate fatigue after walk' }, { name: 'Heart Palpitations', severity: 4, notes: 'Resting pulse down to 78 bpm' }] },
      { date: '2026-08-24', sleep: 6.8, quality: 'Good', exercise: 25, water: 8, meals: 3, stress: 5, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Better sleep! Work project finished, feeling tension release.', symptoms: [{ name: 'Headache', severity: 3, notes: 'Occasional mild forehead pressure' }, { name: 'Fatigue', severity: 3, notes: 'Good stamina through work hours' }, { name: 'Heart Palpitations', severity: 2, notes: 'Almost zero fluttering' }] },
      { date: '2026-08-25', sleep: 7.2, quality: 'Good', exercise: 30, water: 9, meals: 3, stress: 4, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Steady energy. Metoprolol 25mg taken with breakfast.', symptoms: [{ name: 'Headache', severity: 2, notes: 'Very slight' }, { name: 'Fatigue', severity: 2, notes: 'Feeling alert and functional' }, { name: 'Heart Palpitations', severity: 2, notes: 'Heart rhythm feels normal and calm' }] },
      { date: '2026-08-26', sleep: 7.6, quality: 'Excellent', exercise: 35, water: 9, meals: 3, stress: 3, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Great sleep unbroken for 7.5 hours. Exercised without tachycardia.', symptoms: [{ name: 'Headache', severity: 1, notes: 'Near zero pain' }, { name: 'Fatigue', severity: 1, notes: 'High sustained energy' }, { name: 'Heart Palpitations', severity: 1, notes: 'None noted today' }] },
      { date: '2026-08-27', sleep: 8.0, quality: 'Excellent', exercise: 40, water: 10, meals: 3, stress: 2, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 0, notes: 'Feeling restored. Ready for next week follow-up check with Dr. Chen.', symptoms: [{ name: 'Headache', severity: 1, notes: 'No headache' }, { name: 'Fatigue', severity: 1, notes: 'Well rested and energetic' }, { name: 'Heart Palpitations', severity: 1, notes: 'Normal resting pulse 68 bpm' }] },
    ];

    healthDays.forEach((d) => {
      const recordId = uuidv4();
      db.run(`
        INSERT INTO daily_health_records (id, patient_id, date, sleep_hours, sleep_quality, exercise_minutes, water_intake, meal_count, stress_level, mood, medication_taken, med_morning, med_afternoon, med_night, notes) VALUES
        ('${recordId}', '${patient1Id}', '${d.date}', ${d.sleep}, '${d.quality}', ${d.exercise}, ${d.water}, ${d.meals}, ${d.stress}, '${d.mood}', ${d.med}, ${d.med_m || 0}, ${d.med_a || 0}, ${d.med_n || 0}, '${d.notes.replace(/'/g, "''")}');
      `);

      d.symptoms.forEach((s) => {
        const symId = uuidv4();
        db.run(`
          INSERT INTO symptoms (id, daily_record_id, name, severity, notes) VALUES
          ('${symId}', '${recordId}', '${s.name.replace(/'/g, "''")}', ${s.severity}, '${(s.notes || '').replace(/'/g, "''")}');
        `);
      });
    });

    // Medical Reports for Alex Rivera
    db.run(`
      INSERT INTO medical_reports (id, patient_id, doctor_id, hospital_id, name, type, date, file, journey_stage) VALUES
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${hosp1Id}', '12-Lead Electrocardiogram (ECG) Report', 'PDF', '2026-08-06', 'ecg_report_aug06.pdf', 'Tests'),
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${hosp1Id}', '48-Hour Continuous Holter Monitor Diagnostic Summary', 'PDF', '2026-08-15', 'holter_summary_aug15.pdf', 'Test Result'),
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${hosp1Id}', 'Comprehensive Metabolic & Lipid Blood Panel', 'PDF', '2026-08-12', 'blood_panel_aug12.pdf', 'Tests'),
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${hosp1Id}', 'Metoprolol Protocol & Cardiac Care Action Plan', 'PDF', '2026-08-20', 'cardiac_treatment_plan.pdf', 'Treatment');
    `);

    // Tasks for Alex Rivera
    db.run(`
      INSERT INTO tasks (id, patient_id, title, status, related_journey_event_id, due_date) VALUES
      ('${uuidv4()}', '${patient1Id}', 'Log daily morning vitals & sleep quality', 'pending', '${ev6}', '2026-08-28'),
      ('${uuidv4()}', '${patient1Id}', 'Confirm cardiology follow-up session with Dr. Chen', 'pending', '${ev6}', '2026-09-01'),
      ('${uuidv4()}', '${patient1Id}', 'Upload blood pressure log report', 'completed', '${ev3}', '2026-08-15'),
      ('${uuidv4()}', '${patient1Id}', 'Pick up low-dose Metoprolol 25mg prescription', 'completed', '${ev6}', '2026-08-20'),
      ('${uuidv4()}', '${patient1Id}', 'Perform light 20-min evening walking exercise', 'pending', '${ev6}', '2026-08-28');
    `);

    // Appointments for Alex Rivera (Today is Aug 27, 2026)
    db.run(`
      INSERT INTO appointments (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes) VALUES
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${hosp1Id}', '2026-09-02', '10:30 AM', 'Cardiology Journey Follow-up & Treatment Review', 'upcoming', 'Review 2-week daily health logs, Metoprolol response, and heart rate telemetry'),
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${hosp1Id}', '2026-08-06', '09:00 AM', 'Initial Diagnostic Cardiology Consultation', 'completed', 'Initial ECG performed. Prescribed 48-hr Holter monitor and blood work.'),
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${hosp1Id}', '2026-08-15', '02:15 PM', 'Cardiac Lab Holter Diagnostics Review', 'completed', 'Reviewed Holter findings. Confirmed sinus tachycardia with autonomic stress triggers.'),
      ('${uuidv4()}', '${patient1Id}', '${doctor1Id}', '${hosp1Id}', '2026-08-10', '11:00 AM', 'Cardiac Ultrasound & Echocardiogram', 'cancelled', 'Rescheduled due to hospital cardiac lab equipment maintenance window.');
    `);

    // ==========================================
    // SEED PATIENT 2: Maya Lin (Stage 3: Tests, Dr. Sarah Chen, St. Jude)
    // ==========================================
    const patient2UserId = 'user-pat-maya';
    const patient2Id = 'pat-maya-lin';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${patient2UserId}', 'Maya Lin', 'maya.lin@example.com', '${passwordHash}', 'patient', '${hosp1Id}');
    `);
    db.run(`
      INSERT INTO patients (id, user_id, date_of_birth, contact, emergency_contact, blood_group, current_stage, doctor_id, hospital_id) VALUES
      ('${patient2Id}', '${patient2UserId}', '1984-07-23', '+1 (555) 432-8765', 'Ken Lin (+1 555-888-3412)', 'A+', 'Tests', '${doctor1Id}', '${hosp1Id}');
    `);

    const evM1 = 'ev-maya-001';
    const evM2 = 'ev-maya-002';
    const evM3 = 'ev-maya-003';
    const evM4 = 'ev-maya-004';
    const evM5 = 'ev-maya-005';

    db.run(`
      INSERT INTO journey_events (id, patient_id, stage, title, description, date, status, doctor_id, hospital_id, next_step, clinical_note, doctor_plan, clinical_follow_up) VALUES
      ('${evM1}', '${patient2Id}', 'Symptoms', 'Exertional Shortness of Breath & Post-Lunch Palpitations', 'Patient reported sudden heart rate spikes after stairs climbing and episodic dizziness.', '2026-08-10', 'completed', '${doctor1Id}', '${hosp1Id}', 'Consultation scheduled', 'Initial triage notes recorded.', 'Workup indicated.', '2026-08-16'),
      ('${evM2}', '${patient2Id}', 'Consultation', 'Cardiovascular Assessment & Diagnostic Triage', 'Consultation with Dr. Sarah Chen. Exam showed borderline BP 134/86. Heart rate 88 bpm.', '2026-08-16', 'completed', '${doctor1Id}', '${hosp1Id}', 'Execute Stress Echocardiogram & Thyroid Panel', 'No heart murmurs. Suspected autonomic or endocrine overlay.', 'Ordered Stress Echo and fasting endocrine panel.', '2026-08-27'),
      ('${evM3}', '${patient2Id}', 'Tests', 'Cardiac Stress Echo & Fasting Thyroid Panel', 'Diagnostic appointment scheduled at St. Jude Diagnostic Imaging Unit.', '2026-08-27', 'current', '${doctor1Id}', '${hosp1Id}', 'Awaiting diagnostic imaging & lab output', 'Test in progress today at hospital lab.', 'Review results with patient once processed.', '2026-08-29'),
      ('${evM4}', '${patient2Id}', 'Test Result', 'Diagnostic Imaging Review & Correlation', 'Pending completion of Stress Echocardiogram.', '2026-08-30', 'upcoming', '${doctor1Id}', '${hosp1Id}', 'Diagnosis formulation', NULL, NULL, NULL),
      ('${evM5}', '${patient2Id}', 'Diagnosis', 'Targeted Treatment Plan Formulation', 'Pending test review.', '2026-09-05', 'upcoming', '${doctor1Id}', '${hosp1Id}', 'Initiate therapeutic interventions', NULL, NULL, NULL);
    `);

    // Prescriptions for Maya Lin
    db.run(`
      INSERT INTO prescriptions (id, patient_id, doctor_id, name, dosage, frequency, duration, instructions, status) VALUES
      ('${uuidv4()}', '${patient2Id}', '${doctor1Id}', 'Magnesium Glycinate', '200mg', 'Once daily (bedtime)', '30 days', 'Take 30 mins before sleep to support relaxation and nocturnal autonomic stability.', 'active');
    `);

    // Clinical Notes for Maya Lin
    db.run(`
      INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date) VALUES
      ('${uuidv4()}', '${patient2Id}', '${doctor1Id}', '${evM2}', 'Cardiovascular Assessment & Triage', 'Patient is a 42-year-old female presenting with exertional palpitations and lightheadedness. Borderline resting BP 134/86. Thyroid exam non-tender.', 'Ordered fasting thyroid panel and treadmill stress echo for Aug 27.', '2026-08-27');
    `);

    // 7 Days of Health Logs for Maya Lin (Aug 21-27, 2026)
    const mayaDays = [
      { date: '2026-08-21', sleep: 5.5, quality: 'Fair', exercise: 10, water: 5, meals: 2, stress: 7, mood: 'Anxious', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Feeling fluttery after drinking coffee.', symptoms: [{ name: 'Heart Palpitations', severity: 6 }, { name: 'Fatigue', severity: 5 }, { name: 'Headache', severity: 4 }] },
      { date: '2026-08-22', sleep: 5.2, quality: 'Poor', exercise: 0, water: 6, meals: 2, stress: 8, mood: 'Stressed', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Busy workday, couldn’t sleep well.', symptoms: [{ name: 'Heart Palpitations', severity: 7 }, { name: 'Fatigue', severity: 7 }, { name: 'Dizziness', severity: 5 }] },
      { date: '2026-08-23', sleep: 6.0, quality: 'Fair', exercise: 15, water: 6, meals: 3, stress: 7, mood: 'Tired', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Slightly calmer afternoon.', symptoms: [{ name: 'Heart Palpitations', severity: 5 }, { name: 'Fatigue', severity: 6 }] },
      { date: '2026-08-24', sleep: 5.0, quality: 'Poor', exercise: 0, water: 5, meals: 2, stress: 8, mood: 'Stressed', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Chest flutter during stair climb.', symptoms: [{ name: 'Heart Palpitations', severity: 8 }, { name: 'Fatigue', severity: 8 }, { name: 'Shortness of Breath', severity: 6 }] },
      { date: '2026-08-25', sleep: 5.8, quality: 'Fair', exercise: 10, water: 7, meals: 3, stress: 7, mood: 'Neutral', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Preparing for stress echo test.', symptoms: [{ name: 'Heart Palpitations', severity: 5 }, { name: 'Fatigue', severity: 5 }] },
      { date: '2026-08-26', sleep: 5.4, quality: 'Poor', exercise: 0, water: 6, meals: 2, stress: 8, mood: 'Anxious', med: 1, med_m: 1, med_a: 0, med_n: 1, notes: 'Anxious about tomorrow’s hospital tests.', symptoms: [{ name: 'Heart Palpitations', severity: 7 }, { name: 'Fatigue', severity: 7 }, { name: 'Headache', severity: 6 }] },
      { date: '2026-08-27', sleep: 5.6, quality: 'Fair', exercise: 0, water: 6, meals: 2, stress: 7, mood: 'Anxious', med: 1, med_m: 1, med_a: 0, med_n: 0, notes: 'At hospital lab today for Stress Echo.', symptoms: [{ name: 'Heart Palpitations', severity: 6 }, { name: 'Fatigue', severity: 6 }] },
    ];

    mayaDays.forEach((d) => {
      const recId = uuidv4();
      db.run(`
        INSERT INTO daily_health_records (id, patient_id, date, sleep_hours, sleep_quality, exercise_minutes, water_intake, meal_count, stress_level, mood, medication_taken, med_morning, med_afternoon, med_night, notes) VALUES
        ('${recId}', '${patient2Id}', '${d.date}', ${d.sleep}, '${d.quality}', ${d.exercise}, ${d.water}, ${d.meals}, ${d.stress}, '${d.mood}', ${d.med}, ${d.med_m || 0}, ${d.med_a || 0}, ${d.med_n || 0}, '${d.notes.replace(/'/g, "''")}');
      `);
      d.symptoms.forEach((s) => {
        db.run(`
          INSERT INTO symptoms (id, daily_record_id, name, severity, notes) VALUES
          ('${uuidv4()}', '${recId}', '${s.name}', ${s.severity}, '');
        `);
      });
    });

    // Medical Reports for Maya Lin
    db.run(`
      INSERT INTO medical_reports (id, patient_id, doctor_id, hospital_id, name, type, date, file, journey_stage) VALUES
      ('${uuidv4()}', '${patient2Id}', '${doctor1Id}', '${hosp1Id}', 'Initial 12-Lead Resting ECG', 'PDF', '2026-08-16', 'maya_ecg_aug16.pdf', 'Tests');
    `);

    // Tasks for Maya Lin
    db.run(`
      INSERT INTO tasks (id, patient_id, title, status, related_journey_event_id, due_date) VALUES
      ('${uuidv4()}', '${patient2Id}', 'Fast 8 hours prior to morning lipid & thyroid blood draw', 'completed', '${evM3}', '2026-08-27'),
      ('${uuidv4()}', '${patient2Id}', 'Complete treadmill stress echocardiogram test', 'pending', '${evM3}', '2026-08-27'),
      ('${uuidv4()}', '${patient2Id}', 'Log daily sleep and palpitations episodes', 'pending', '${evM3}', '2026-08-30');
    `);

    // Appointments for Maya Lin (One scheduled for TODAY Aug 27, 2026!)
    db.run(`
      INSERT INTO appointments (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes) VALUES
      ('${uuidv4()}', '${patient2Id}', '${doctor1Id}', '${hosp1Id}', '2026-08-27', '09:00 AM', 'Cardiac Stress Echo & Diagnostic Workup', 'upcoming', 'Conduct treadmill stress echocardiography and draw endocrine panel.'),
      ('${uuidv4()}', '${patient2Id}', '${doctor1Id}', '${hosp1Id}', '2026-08-16', '11:15 AM', 'Cardiovascular Assessment & Triage', 'completed', 'Triage consultation completed. Ordered diagnostic stress echo.');
    `);

    // ==========================================
    // SEED PATIENT 3: Marcus Thorne (Stage 7: Recovery, Dr. Sarah Chen, St. Jude)
    // ==========================================
    const patient3UserId = 'user-pat-marcus';
    const patient3Id = 'pat-marcus-thorne';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${patient3UserId}', 'Marcus Thorne', 'marcus.thorne@example.com', '${passwordHash}', 'patient', '${hosp1Id}');
    `);
    db.run(`
      INSERT INTO patients (id, user_id, date_of_birth, contact, emergency_contact, blood_group, current_stage, doctor_id, hospital_id) VALUES
      ('${patient3Id}', '${patient3UserId}', '1968-11-05', '+1 (555) 765-4321', 'Sarah Thorne (+1 555-999-1234)', 'B+', 'Recovery', '${doctor1Id}', '${hosp1Id}');
    `);

    const evT1 = 'ev-thorne-001';
    const evT2 = 'ev-thorne-002';
    const evT3 = 'ev-thorne-003';
    const evT4 = 'ev-thorne-004';
    const evT5 = 'ev-thorne-005';
    const evT6 = 'ev-thorne-006';
    const evT7 = 'ev-thorne-007';

    db.run(`
      INSERT INTO journey_events (id, patient_id, stage, title, description, date, status, doctor_id, hospital_id, next_step, clinical_note, doctor_plan, clinical_follow_up) VALUES
      ('${evT1}', '${patient3Id}', 'Symptoms', 'Exertional Angina & Chest Tightness', 'Exertional pressure with exercise. Triage completed.', '2026-07-05', 'completed', '${doctor1Id}', '${hosp1Id}', 'Urgent cardiology evaluation', 'Stable angina symptoms reported.', 'Accelerate angiographic imaging.', '2026-07-12'),
      ('${evT2}', '${patient3Id}', 'Consultation', 'Coronary Artery Disease Evaluation', 'In-depth cardiovascular consultation with Dr. Sarah Chen.', '2026-07-12', 'completed', '${doctor1Id}', '${hosp1Id}', 'Coronary angiography', 'LAD stenosis suspected.', 'Catheterization scheduled.', '2026-07-18'),
      ('${evT3}', '${patient3Id}', 'Tests', 'Coronary Angiogram & CT Calcium Score', 'High-resolution cardiac catheterization performed.', '2026-07-18', 'completed', '${doctor1Id}', '${hosp1Id}', 'Intervention planning', '75% proximal LAD lesion visualized.', 'PCI scheduled.', '2026-07-22'),
      ('${evT4}', '${patient3Id}', 'Diagnosis', 'Single Vessel CAD (LAD 75% Stenosis)', 'Definitive anatomical diagnosis established.', '2026-07-25', 'completed', '${doctor1Id}', '${hosp1Id}', 'Elective drug-eluting stent placement', 'Clear indication for DES angioplasty.', 'Admit for day-surgery PCI.', '2026-08-01'),
      ('${evT5}', '${patient3Id}', 'Treatment', 'Successful LAD Drug-Eluting Stent Placement', 'Successful uncomplicated DES placement to proximal LAD. TIMI 3 flow achieved.', '2026-08-01', 'completed', '${doctor1Id}', '${hosp1Id}', 'Initiate dual antiplatelet & cardiac rehab', 'Procedure completed without complication. Excellent post-dilation result.', 'Dual antiplatelet therapy and low-impact rehab.', '2026-08-18'),
      ('${evT6}', '${patient3Id}', 'Recovery', 'Post-PCI Cardiac Rehab & Endurance Walking', 'Patient in active rehabilitation phase. Logging daily walks, stable BP, 95%+ medication compliance.', '2026-08-18', 'current', '${doctor1Id}', '${hosp1Id}', 'Scheduled 60-day recovery assessment on Sep 15, 2026', 'Progress is remarkable. BP well-controlled at 118/74, resting HR 64.', 'Continue rehab exercise walking and Lisinopril regimen.', '2026-09-15'),
      ('${evT7}', '${patient3Id}', 'Follow-up', '60-Day Post-Stent Status & Lipid Optimization', 'Milestone evaluation to titrate lipid therapy.', '2026-09-15', 'upcoming', '${doctor1Id}', '${hosp1Id}', 'Transition to long-term cardiology maintenance', NULL, NULL, NULL);
    `);

    // Prescriptions for Marcus Thorne
    db.run(`
      INSERT INTO prescriptions (id, patient_id, doctor_id, name, dosage, frequency, duration, instructions, status) VALUES
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', 'Lisinopril', '10mg', 'Once daily (morning)', '90 days', 'Take every morning with water. Maintains healthy vessel dilation post-PCI.', 'active'),
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', 'Atorvastatin', '20mg', 'Once daily (bedtime)', '90 days', 'Take at night. Lipid stabilization therapy.', 'active'),
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', 'Aspirin (Enteric Coated)', '81mg', 'Once daily (lunch)', '90 days', 'Cardioprotective antiplatelet therapy.', 'active');
    `);

    // Clinical Notes for Marcus Thorne
    db.run(`
      INSERT INTO clinical_notes (id, patient_id, doctor_id, journey_event_id, title, note, plan, follow_up_date) VALUES
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', '${evT2}', 'Cardiovascular Diagnostic Consultation', '62-year-old male with 6-week progressive exertional chest tightness radiating to left shoulder, relieved with rest. Positive family history. Resting ECG shows subtle ST depressions in V4-V6.', 'Immediate diagnostic coronary angiography and CT calcium scoring.', '2026-07-18'),
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', '${evT5}', 'Post-PCI Discharge Clinical Summary', 'Patient underwent successful DES placement to LAD. Hemodynamically stable throughout hospital observation. TIMI 3 flow achieved.', 'Discharged on DAPT, Lisinopril 10mg, Atorvastatin 20mg. Begin Phase II Cardiac Rehab.', '2026-08-18'),
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', '${evT6}', 'Rehab Milestone Check', 'Patient is walking 35 mins/day without angina or dyspnea. Home BP logs average 118/74, resting heart rate 64 bpm.', 'Maintain current doses. Follow up in 4 weeks on Sep 15.', '2026-09-15');
    `);

    // 10 Days of Health Logs for Marcus Thorne (Aug 18-27, 2026) - Highly stable recovery
    const thorneDays = [
      { date: '2026-08-18', sleep: 7.2, quality: 'Good', exercise: 20, water: 8, meals: 3, stress: 3, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'First day of rehab walking.', symptoms: [{ name: 'Fatigue', severity: 3 }] },
      { date: '2026-08-19', sleep: 7.5, quality: 'Good', exercise: 25, water: 8, meals: 3, stress: 2, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Walked 1 mile around neighborhood.', symptoms: [{ name: 'Fatigue', severity: 2 }] },
      { date: '2026-08-20', sleep: 7.4, quality: 'Good', exercise: 25, water: 9, meals: 3, stress: 3, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'BP steady at 120/76.', symptoms: [{ name: 'Fatigue', severity: 2 }] },
      { date: '2026-08-21', sleep: 7.8, quality: 'Excellent', exercise: 30, water: 9, meals: 3, stress: 2, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Good energy all morning.', symptoms: [] },
      { date: '2026-08-22', sleep: 7.6, quality: 'Good', exercise: 30, water: 8, meals: 3, stress: 3, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Weekend walking routine.', symptoms: [{ name: 'Fatigue', severity: 2 }] },
      { date: '2026-08-23', sleep: 8.0, quality: 'Excellent', exercise: 35, water: 9, meals: 3, stress: 2, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'No chest discomfort whatsoever.', symptoms: [] },
      { date: '2026-08-24', sleep: 7.7, quality: 'Good', exercise: 35, water: 10, meals: 3, stress: 2, mood: 'Good', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Stretching and brisk walk.', symptoms: [] },
      { date: '2026-08-25', sleep: 7.9, quality: 'Excellent', exercise: 35, water: 9, meals: 3, stress: 2, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Medications taken on schedule.', symptoms: [] },
      { date: '2026-08-26', sleep: 8.0, quality: 'Excellent', exercise: 40, water: 10, meals: 3, stress: 2, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Feeling healthy and strong.', symptoms: [] },
      { date: '2026-08-27', sleep: 7.8, quality: 'Good', exercise: 40, water: 9, meals: 3, stress: 2, mood: 'Great', med: 1, med_m: 1, med_a: 1, med_n: 1, notes: 'Ready for today’s check-in with Dr. Chen.', symptoms: [] },
    ];

    thorneDays.forEach((d) => {
      const recId = uuidv4();
      db.run(`
        INSERT INTO daily_health_records (id, patient_id, date, sleep_hours, sleep_quality, exercise_minutes, water_intake, meal_count, stress_level, mood, medication_taken, med_morning, med_afternoon, med_night, notes) VALUES
        ('${recId}', '${patient3Id}', '${d.date}', ${d.sleep}, '${d.quality}', ${d.exercise}, ${d.water}, ${d.meals}, ${d.stress}, '${d.mood}', ${d.med}, ${d.med_m || 0}, ${d.med_a || 0}, ${d.med_n || 0}, '${d.notes.replace(/'/g, "''")}');
      `);
      d.symptoms.forEach((s) => {
        db.run(`
          INSERT INTO symptoms (id, daily_record_id, name, severity, notes) VALUES
          ('${uuidv4()}', '${recId}', '${s.name}', ${s.severity}, '');
        `);
      });
    });

    // Medical Reports for Marcus Thorne
    db.run(`
      INSERT INTO medical_reports (id, patient_id, doctor_id, hospital_id, name, type, date, file, journey_stage) VALUES
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', '${hosp1Id}', 'Cardiac Catheterization & Angiography Report', 'PDF', '2026-07-18', 'catheterization_report.pdf', 'Tests'),
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', '${hosp1Id}', 'Post-PCI Echocardiogram & Wall Motion Summary', 'PDF', '2026-08-18', 'post_pci_echo.pdf', 'Recovery');
    `);

    // Tasks for Marcus Thorne
    db.run(`
      INSERT INTO tasks (id, patient_id, title, status, related_journey_event_id, due_date) VALUES
      ('${uuidv4()}', '${patient3Id}', 'Complete 30-min cardiac rehab walking session', 'completed', '${evT6}', '2026-08-27'),
      ('${uuidv4()}', '${patient3Id}', 'Record morning blood pressure and resting pulse', 'completed', '${evT6}', '2026-08-27'),
      ('${uuidv4()}', '${patient3Id}', 'Refill Lisinopril and Atorvastatin prescriptions', 'pending', '${evT6}', '2026-09-10');
    `);

    // Appointments for Marcus Thorne (One scheduled for TODAY Aug 27, 2026 at 02:00 PM!)
    db.run(`
      INSERT INTO appointments (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes) VALUES
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', '${hosp1Id}', '2026-08-27', '02:00 PM', 'Post-Rehab Progress & Exercise Tolerance Review', 'upcoming', 'Evaluate daily walking tolerance, review home BP logs, and assess stent recovery.'),
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', '${hosp1Id}', '2026-09-15', '11:00 AM', '60-Day Milestone Stent Evaluation', 'upcoming', 'Follow-up cardiology consultation.'),
      ('${uuidv4()}', '${patient3Id}', '${doctor1Id}', '${hosp1Id}', '2026-08-18', '10:00 AM', 'Post-Procedure Discharge Evaluation', 'completed', 'Discharge check completed successfully.');
    `);

    // ==========================================
    // SEED PATIENT 4: David Kim (City General Hospital, Dr. Marcus Vance)
    // ==========================================
    const patient4UserId = 'user-pat-david';
    const patient4Id = 'pat-david-kim';
    db.run(`
      INSERT INTO users (id, name, email, password_hash, role, hospital_id) VALUES
      ('${patient4UserId}', 'David Kim', 'david.kim@example.com', '${passwordHash}', 'patient', '${hosp2Id}');
    `);
    db.run(`
      INSERT INTO patients (id, user_id, date_of_birth, contact, emergency_contact, blood_group, current_stage, doctor_id, hospital_id) VALUES
      ('${patient4Id}', '${patient4UserId}', '1992-09-14', '+1 (555) 890-1234', 'Jenny Kim (+1 555-777-6543)', 'AB+', 'Consultation', '${doctor2Id}', '${hosp2Id}');
    `);

    db.run(`
      INSERT INTO journey_events (id, patient_id, stage, title, description, date, status, doctor_id, hospital_id, next_step) VALUES
      ('${uuidv4()}', '${patient4Id}', 'Symptoms', 'Chronic Migraine & Visual Aura', 'Neurology consult referral at City General.', '2026-08-12', 'completed', '${doctor2Id}', '${hosp2Id}', 'Neurology consultation'),
      ('${uuidv4()}', '${patient4Id}', 'Consultation', 'Neurology Diagnostic Consult', 'Consultation with Dr. Marcus Vance at City General Hospital.', '2026-08-20', 'current', '${doctor2Id}', '${hosp2Id}', 'Brain MRI scheduled');
    `);

    // Appointments for David Kim (City General)
    db.run(`
      INSERT INTO appointments (id, patient_id, doctor_id, hospital_id, date, time, purpose, status, notes) VALUES
      ('app-citygen-001', '${patient4Id}', '${doctor2Id}', '${hosp2Id}', '2026-08-30', '11:30 AM', 'Neurology Cranial Follow-up & MRI Review', 'upcoming', 'Evaluate MRI scans and visual migraine trigger log.');
    `);

    console.log('CareFlow database seeded successfully with 4 patients across 2 hospitals.');
  }
}

// Helper query wrappers for easy CRUD
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('DB not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('DB not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.run(params);
  stmt.free();
  saveDb();
}
