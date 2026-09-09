import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  GitCompare, 
  User, 
  Sparkles, 
  Info, 
  Activity,
  Heart,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { DoctorCrossAnalytics } from './DoctorCrossAnalytics';
import { DoctorHealthAnalytics } from './DoctorHealthAnalytics';
import { authFetch } from '../../utils/api';

interface DoctorAnalyticsWrapperProps {
  onSelectPatient: (patientId: string) => void;
}

export const DoctorAnalyticsWrapper: React.FC<DoctorAnalyticsWrapperProps> = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-alex-rivera');
  const [patientData, setPatientData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/doctor/patients')
      .then(res => res.json())
      .then(data => {
        if (data.patients && data.patients.length > 0) {
          setPatients(data.patients);
          if (!selectedPatientId) {
            setSelectedPatientId(data.patients[0].id);
          }
        }
      })
      .catch(err => console.error('Failed to load patients for analytics:', err));
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    setLoading(true);
    authFetch(`/api/doctor/patients/${selectedPatientId}`)
      .then(res => res.json())
      .then(data => {
        setPatientData(data);
      })
      .catch(err => console.error('Failed to load patient analytics data:', err))
      .finally(() => setLoading(false));
  }, [selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const dataPoints = (patientData?.dailyLogs || []).map((log: any) => ({
    date: log.date,
    sleep: log.sleep_hours ?? 7,
    stress: log.stress_level ?? 5,
    hydration: log.hydration_glasses ?? 6,
    exercise: log.exercise_minutes ?? 15,
    headache: log.headache_severity ?? 2,
    fatigue: log.fatigue_severity ?? 3,
    palpitations: log.palpitations_severity ?? 2,
    medDoses: log.medication_taken_count ?? 2,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <GitCompare className="w-4 h-4 text-teal-600" />
            <span>Multi-Variable Correlation Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Cross-Variable Health Analytics</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Correlate longitudinal vital variables (sleep, stress, hydration, exercise) against symptom severity scores across 14-day clinical records.
          </p>
        </div>

        {/* Patient Selector Pills */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPatientId(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedPatientId === p.id
                  ? 'bg-teal-600 text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{p.name.split(' ')[0]}</span>
              <span className="text-[10px] opacity-80">({p.current_stage})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Patient Stats Banner */}
      {selectedPatient && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white shadow-2xs">
              {selectedPatient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{selectedPatient.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  {selectedPatient.current_stage}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {selectedPatient.age} yrs &bull; {selectedPatient.gender} &bull; Blood: {selectedPatient.blood_group} &bull; 14-Day Continuous Telemetry
              </div>
            </div>
          </div>

          <button
            onClick={() => onSelectPatient(selectedPatient.id)}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Open Full Patient Chart &rarr;
          </button>
        </div>
      )}

      {/* Longitudinal Telemetry Charts & Cross Analytics */}
      <DoctorHealthAnalytics
        key={selectedPatientId}
        patientId={selectedPatientId}
        patientName={selectedPatient?.name || 'Patient'}
        initialChartData={patientData?.chartData}
        initialAnalytics={patientData?.analytics}
        initialCrossAnalytics={patientData?.crossAnalytics}
      />
    </div>
  );
};
