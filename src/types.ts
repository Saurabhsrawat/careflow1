export type UserRole = 'patient' | 'doctor' | 'hospital_admin' | 'caregiver';

export type JourneyStage = 
  | 'Symptoms'
  | 'Consultation'
  | 'Tests'
  | 'Test Result'
  | 'Diagnosis'
  | 'Treatment'
  | 'Recovery'
  | 'Follow-up';

export type JourneyStatus = 'completed' | 'current' | 'upcoming' | 'delayed';

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled' | 'past';

export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone?: string;
  doctor_count?: number;
  patient_count?: number;
  created_at?: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  date_of_birth?: string;
  contact?: string;
  emergency_contact?: string;
  blood_group?: string;
  current_stage: JourneyStage | string;
  doctor_id?: string;
  hospital_id?: string;
  assigned_doctor_name?: string;
  assigned_doctor_specialization?: string;
  created_at?: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  hospital_id: string;
  specialization: string;
  license_number?: string;
  is_active: number;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  hospital_id?: string;
  hospital_name?: string;
  hospital_address?: string;
  created_at: string;
  patient?: PatientProfile | null;
  doctor?: DoctorProfile | null;
}

export interface JourneyEvent {
  id: string;
  patient_id: string;
  stage: JourneyStage | string;
  title: string;
  description?: string;
  date: string;
  status: JourneyStatus;
  doctor_id?: string;
  doctor_name?: string;
  hospital_id?: string;
  hospital_name?: string;
  next_step?: string;
  clinical_note?: string;
  doctor_plan?: string;
  clinical_follow_up?: string;
  created_at?: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id?: string;
  doctor_name?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  status: 'active' | 'completed' | 'discontinued';
  created_at?: string;
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name?: string;
  journey_event_id?: string;
  journey_stage?: string;
  journey_title?: string;
  title: string;
  note: string;
  plan?: string;
  follow_up_date?: string;
  created_at?: string;
}

export interface PatientAlert {
  id: string;
  patient_id: string;
  patient_name: string;
  type: 'trend' | 'threshold' | 'adherence' | 'test_pending';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  date: string;
}

export interface DoctorPatientSummary {
  id: string;
  user_id: string;
  name: string;
  email: string;
  age?: number;
  date_of_birth?: string;
  contact?: string;
  emergency_contact?: string;
  blood_group?: string;
  current_stage: string;
  doctor_id: string;
  doctor_name?: string;
  hospital_id: string;
  hospital_name?: string;
  last_visit_date?: string;
  next_appointment?: Appointment | null;
  adherence_percent: number;
  recent_symptoms?: string[];
  avg_sleep: number;
  avg_stress: number;
  alert_flags: string[];
  active_alerts: PatientAlert[];
}

export interface DailyHealthRecord {
  id: string;
  patient_id: string;
  date: string;
  sleep_hours?: number;
  sleep_quality?: 'Poor' | 'Fair' | 'Good' | 'Excellent' | string;
  exercise_minutes?: number;
  water_intake?: number;
  meal_count?: number;
  stress_level?: number; // 1-10
  mood?: 'Great' | 'Good' | 'Neutral' | 'Low' | 'Anxious' | 'Stressed' | 'Tired' | 'Normal' | 'Happy' | string;
  medication_taken?: number; // 1 or 0
  med_morning?: number; // 1 or 0
  med_afternoon?: number; // 1 or 0
  med_night?: number; // 1 or 0
  notes?: string;
  created_at?: string;
  symptoms?: Symptom[];
}

export interface Symptom {
  id: string;
  daily_record_id: string;
  name: string;
  severity: number; // 1-10
  notes?: string;
  created_at?: string;
}

export interface MedicalReport {
  id: string;
  patient_id: string;
  doctor_id?: string;
  doctor_name?: string;
  hospital_id?: string;
  hospital_name?: string;
  name: string;
  type: string;
  date: string;
  file?: string;
  file_size?: string;
  journey_stage?: JourneyStage | string;
  created_at?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  date: string;
  time: string;
  purpose: string;
  status: AppointmentStatus;
  notes?: string;
  doctor_name?: string;
  hospital_name?: string;
  patient_name?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  patient_id: string;
  title: string;
  status: TaskStatus;
  related_journey_event_id?: string;
  related_journey_stage?: string;
  related_journey_title?: string;
  due_date?: string;
  created_at?: string;
}

export interface ActivityItem {
  id: string;
  type: 'journey' | 'report' | 'health_log' | 'appointment' | 'task' | 'medication' | 'clinical_note';
  title: string;
  description: string;
  timestamp: string;
  date?: string;
  badge?: string;
  severity?: string;
  iconType?: string;
  metadata?: any;
}

export interface TimelineEntry {
  id: string;
  category: 'journey' | 'health_log' | 'report' | 'appointment' | 'task' | 'medication' | 'clinical_note';
  title: string;
  description: string;
  date: string;
  timestamp: string;
  badge?: string;
  badgeColor?: string;
  iconName: string;
  relatedStage?: string;
  metadata?: Record<string, any>;
}

export interface MedicationScheduleSlot {
  slot: 'morning' | 'afternoon' | 'night';
  timeLabel: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  status: 'taken' | 'missed' | 'pending';
  loggedAt?: string;
}

export interface EmergencyCardData {
  patientName: string;
  dateOfBirth: string;
  age: number;
  gender?: string;
  bloodGroup: string;
  contact: string;
  allergies: Array<{
    allergen: string;
    severity: 'Severe' | 'Moderate' | 'Mild';
    reaction: string;
  }>;
  currentConditions: Array<{
    condition: string;
    diagnosedDate: string;
    status: string;
  }>;
  activeMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
    prescribingDoctor?: string;
  }>;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  }>;
  attendingDoctor: {
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
  };
  hospitalEmergencyPhone: string;
  organDonor: boolean;
  advanceDirective: string;
  lastUpdated: string;
}

export interface AccessEntity {
  id: string;
  name: string;
  organization: string;
  role: string;
  accessLevel: string;
  permissions: {
    journey: boolean;
    reports: boolean;
    dailyHealth: boolean;
    prescriptions: boolean;
  };
  status: 'Active Primary' | 'Institutional' | 'Lab Access';
  grantedAt: string;
  lastAccessed: string;
}

export interface NotificationItem {
  id: string;
  patient_id?: string;
  title: string;
  message: string;
  type: 'appointment' | 'journey' | 'report' | 'task' | 'reminder' | 'prescription' | 'alert';
  is_read: boolean;
  action_tab?: string;
  created_at: string;
  timestamp?: string;
}

export interface HealthSummarySynthesis {
  generatedDate: string;
  isAiEnhancedPreview: boolean;
  currentStage: string;
  currentDiagnosis: string;
  symptomTrajectory: {
    trend: 'improving' | 'stable' | 'worsening';
    palpitationsChange: string;
    headacheChange: string;
    summary: string;
  };
  vitalsAverages: {
    avgSleep: number;
    avgStress: number;
    avgExercise: number;
    avgWater: number;
  };
  adherenceRate: number;
  adherenceStatus: string;
  activePrescriptions: string[];
  upcomingAppointment?: {
    date: string;
    time: string;
    doctor: string;
    purpose: string;
  };
  clinicalFindings: string[];
  recommendedActions: string[];
}

export interface DatabaseStatus {
  status: string;
  database: string;
  tables: {
    users: number;
    hospitals: number;
    patients: number;
    doctors: number;
    journeyEvents: number;
  };
}

export interface HospitalAdminDashboardStats {
  hospital: {
    id: string;
    name: string;
    address: string;
    phone?: string;
    departments?: string[];
    created_at?: string;
  };
  stats: {
    totalDoctors: number;
    activeDoctors: number;
    totalPatients: number;
    todayAppointments: number;
    pendingAppointments: number;
    activeJourneys: number;
  };
  todayAppointments: Array<{
    id: string;
    patient_id: string;
    doctor_id: string;
    hospital_id: string;
    date: string;
    time: string;
    purpose: string;
    status: AppointmentStatus;
    notes?: string;
    patient_name: string;
    doctor_name: string;
    doctor_specialization: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'appointment_booked' | 'journey_event' | 'patient_registered' | string;
    title: string;
    description: string;
    timestamp: string;
    actor?: string;
  }>;
}

export interface HospitalDoctor {
  id: string;
  user_id: string;
  hospital_id: string;
  name: string;
  email: string;
  specialization: string;
  license_number?: string;
  is_active: number;
  created_at: string;
  patient_count: number;
  appointment_count: number;
}

export interface HospitalPatient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  contact?: string;
  emergency_contact?: string;
  blood_group?: string;
  current_stage: string;
  doctor_id?: string;
  hospital_id: string;
  created_at: string;
  name: string;
  email: string;
  assigned_doctor_name?: string;
  assigned_doctor_specialization?: string;
  appointment_count: number;
  last_visit_date?: string;
}

export interface HospitalAppointmentItem {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  date: string;
  time: string;
  purpose: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  patient_name: string;
  patient_email: string;
  patient_contact?: string;
  patient_stage?: string;
  doctor_name: string;
  doctor_specialization: string;
}

export interface CaregiverPermissions {
  can_view_journey: boolean;
  can_view_appointments: boolean;
  can_view_tasks: boolean;
  can_view_reports: boolean;
  can_view_daily_health: boolean;
}

export interface CaregiverLink extends CaregiverPermissions {
  id: string;
  caregiver_user_id: string;
  patient_id: string;
  caregiver_name?: string;
  caregiver_email?: string;
  patient_name?: string;
  patient_email?: string;
  patient_current_stage?: string;
  created_at?: string;
}

export interface CaregiverPatientView {
  patient: {
    id: string;
    name: string;
    email: string;
    contact?: string;
    emergency_contact?: string;
    blood_group?: string;
    current_stage: string;
    hospital_name?: string;
    doctor_name?: string;
  };
  permissions: CaregiverPermissions;
  journeyEvents?: JourneyEvent[];
  appointments?: Appointment[];
  tasks?: Task[];
  reports?: MedicalReport[];
  dailyHealth?: DailyHealthRecord[];
  summaryStats?: {
    avgSleep?: number;
    avgStress?: number;
    adherenceRate?: number;
    totalLogs?: number;
  };
}

