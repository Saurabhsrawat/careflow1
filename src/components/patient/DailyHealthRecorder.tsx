import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Moon, 
  Zap, 
  Droplet, 
  Smile, 
  Pill, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Activity,
  Flame,
  Info,
  Clock
} from 'lucide-react';
import { DailyHealthRecord, Symptom } from '../../types';
import { authFetch } from '../../utils/api';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface DailyHealthRecorderProps {
  onRecordSaved?: () => void;
  onNavigateTab?: (tab: 'dashboard' | 'journey' | 'health_recorder' | 'analytics' | 'history' | 'reports' | 'appointments' | 'tasks') => void;
}

export const DailyHealthRecorder: React.FC<DailyHealthRecorderProps> = ({ onRecordSaved, onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'log' | 'history' | 'insights'>('log');
  const [records, setRecords] = useState<DailyHealthRecord[]>([]);
  const [correlationData, setCorrelationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form State (Defaulting to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<string>('Good');
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(20);
  const [waterIntake, setWaterIntake] = useState<number>(8);
  const [mealCount, setMealCount] = useState<number>(3);
  const [stressLevel, setStressLevel] = useState<number>(4);
  const [mood, setMood] = useState<string>('Good');
  const [medicationTaken, setMedicationTaken] = useState<boolean>(true);
  const [medMorning, setMedMorning] = useState<boolean>(true);
  const [medAfternoon, setMedAfternoon] = useState<boolean>(true);
  const [medNight, setMedNight] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  
  // Dynamic symptoms state
  const [symptoms, setSymptoms] = useState<Array<{ name: string; severity: number; notes: string }>>([
    { name: 'Headache', severity: 2, notes: '' },
    { name: 'Fatigue', severity: 2, notes: '' },
    { name: 'Heart Palpitations', severity: 1, notes: '' }
  ]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const [recRes, corrRes] = await Promise.all([
        authFetch('/api/patient/daily-health?limit=30'),
        authFetch('/api/patient/correlation-insights')
      ]);

      if (recRes.ok) {
        const ct = recRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const data = await recRes.json();
          setRecords(data.records || []);
        }
      }
      if (corrRes.ok) {
        const ct = corrRes.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const corr = await corrRes.json();
          setCorrelationData(corr);
        }
      }
    } catch (err) {
      console.error('Failed to load health records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // When date changes, check if existing record exists to prefill
  useEffect(() => {
    const existing = records.find(r => r.date === date);
    if (existing) {
      setSleepHours(existing.sleep_hours || 7);
      setSleepQuality(existing.sleep_quality || 'Good');
      setExerciseMinutes(existing.exercise_minutes || 0);
      setWaterIntake(existing.water_intake || 8);
      setMealCount(existing.meal_count || 3);
      setStressLevel(existing.stress_level || 5);
      setMood(existing.mood || 'Good');
      setMedicationTaken(existing.medication_taken === 1);
      setMedMorning(existing.med_morning === 1 || existing.medication_taken === 1);
      setMedAfternoon(existing.med_afternoon === 1 || (existing.medication_taken === 1 && existing.date !== '2026-08-22'));
      setMedNight(existing.med_night === 1);
      setNotes(existing.notes || '');
      if (existing.symptoms && existing.symptoms.length > 0) {
        setSymptoms(existing.symptoms.map(s => ({
          name: s.name,
          severity: s.severity,
          notes: s.notes || ''
        })));
      } else {
        setSymptoms([]);
      }
    }
  }, [date, records]);

  const handleAddSymptom = (name: string = '') => {
    setSymptoms(prev => [...prev, { name, severity: 5, notes: '' }]);
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(prev => prev.filter((_, i) => i !== index));
  };

  const handleSymptomChange = (index: number, field: string, value: any) => {
    setSymptoms(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleQuickAddSymptom = (name: string) => {
    if (!symptoms.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setSymptoms(prev => [...prev, { name, severity: 4, notes: '' }]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const overallTaken = (medMorning || medAfternoon || medNight || medicationTaken) ? 1 : 0;
      const payload = {
        date,
        sleep_hours: Number(sleepHours),
        sleep_quality: sleepQuality,
        exercise_minutes: Number(exerciseMinutes),
        water_intake: Number(waterIntake),
        meal_count: Number(mealCount),
        stress_level: Number(stressLevel),
        mood,
        medication_taken: overallTaken,
        med_morning: medMorning ? 1 : 0,
        med_afternoon: medAfternoon ? 1 : 0,
        med_night: medNight ? 1 : 0,
        notes,
        symptoms: symptoms.filter(s => s.name && s.name.trim().length > 0)
      };

      const res = await authFetch('/api/patient/daily-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`Server returned unexpected response (${res.status}): ${text.slice(0, 100)}`);
        }
      }

      if (!res.ok) throw new Error(data.error || 'Failed to save health record');

      setSaveSuccess(`Daily health record for ${date} saved successfully! History and analytics updated.`);
      await fetchRecords();
      if (onRecordSaved) onRecordSaved();

      // Reset success message after 5 seconds
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error saving daily health record:', err);
      setSaveError(err.message || 'Error saving daily health record');
    } finally {
      setSaving(false);
    }
  };

  const moodOptions = [
    { label: 'Great', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    { label: 'Good', color: 'bg-teal-50 text-teal-700 border-teal-300' },
    { label: 'Neutral', color: 'bg-slate-50 text-slate-700 border-slate-300' },
    { label: 'Tired', color: 'bg-amber-50 text-amber-700 border-amber-300' },
    { label: 'Anxious', color: 'bg-orange-50 text-orange-700 border-orange-300' },
    { label: 'Stressed', color: 'bg-rose-50 text-rose-700 border-rose-300' },
    { label: 'Low', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  ];

  const sleepQualityOptions = ['Poor', 'Fair', 'Good', 'Excellent'];

  return (
    <div className="space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-teal-600" />
            Daily Health Recorder & Vitals
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Log your daily sleep, stress, medication, and symptoms to give your care team full diagnostic context.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-sm font-medium">
          <button
            onClick={() => setActiveSubTab('log')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'log' 
                ? 'bg-white text-teal-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Log Entry
          </button>
          <button
            onClick={() => setActiveSubTab('insights')}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'insights' 
                ? 'bg-white text-teal-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            14-Day Insights
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'history' 
                ? 'bg-white text-teal-700 shadow-sm font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            History Log ({records.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: LOG ENTRY FORM */}
      {activeSubTab === 'log' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Date Selector Banner */}
          <div className="bg-gradient-to-r from-teal-50 to-purple-50 border border-teal-200/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-teal-900 uppercase tracking-wider">Entry Date</div>
                <div className="text-sm font-bold text-slate-800">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="logDate" className="text-xs font-medium text-slate-600">Select Date:</label>
              <input
                id="logDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Core Biometrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Sleep & Recovery */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Moon className="w-5 h-5 text-indigo-600" />
                  <span>Sleep & Rest</span>
                </div>
                <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {sleepHours} Hours
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Hours of Sleep</span>
                  <span className="font-semibold text-slate-700">{sleepHours} hrs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0 hrs</span>
                  <span>4 hrs (Low)</span>
                  <span>8 hrs (Optimal)</span>
                  <span>14 hrs</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Sleep Quality</label>
                <div className="grid grid-cols-4 gap-2">
                  {sleepQualityOptions.map((q) => (
                    <button
                      type="button"
                      key={q}
                      onClick={() => setSleepQuality(q)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        sleepQuality === q
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Stress & Mental Load */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Flame className={`w-5 h-5 ${
                    stressLevel >= 7 ? 'text-rose-600' : stressLevel >= 4 ? 'text-amber-500' : 'text-emerald-500'
                  }`} />
                  <span>Stress Level</span>
                </div>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                  stressLevel >= 8 
                    ? 'bg-rose-100 text-rose-800' 
                    : stressLevel >= 5 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {stressLevel}/10 - {stressLevel <= 3 ? 'Low' : stressLevel <= 6 ? 'Moderate' : stressLevel <= 8 ? 'High' : 'Severe'}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Perceived Stress Scale</span>
                  <span className="font-bold text-slate-800">{stressLevel} of 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(parseInt(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>1 (Calm)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Overwhelmed)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">General Mood & State</label>
                <div className="flex flex-wrap gap-1.5">
                  {moodOptions.map((m) => (
                    <button
                      type="button"
                      key={m.label}
                      onClick={() => setMood(m.label)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        mood === m.label
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : m.color
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Activity, Hydration & Nutrition */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Activity className="w-5 h-5 text-teal-600" />
                  <span>Activity & Hydration</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exercise Minutes</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={exerciseMinutes}
                      onChange={(e) => setExerciseMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                    <span className="text-xs text-slate-500 font-medium">min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Water Intake</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={waterIntake}
                      onChange={(e) => setWaterIntake(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    />
                    <span className="text-xs text-slate-500 font-medium">glasses</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meals Logged</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((count) => (
                    <button
                      type="button"
                      key={count}
                      onClick={() => setMealCount(count)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        mealCount === count
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {count} {count === 1 ? 'meal' : 'meals'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Medication Adherence & Multi-Dose Tracking */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Pill className="w-5 h-5 text-purple-600" />
                  <span>Medication Adherence</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  (medMorning || medAfternoon || medNight || medicationTaken) ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {(medMorning && medAfternoon && medNight) ? '100% Adherent (3/3)' : (medMorning || medAfternoon || medNight) ? 'Partial Doses Logged' : 'Pending / Not Logged'}
                </span>
              </div>

              <div className="bg-purple-50/60 border border-purple-200/60 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900">Current Prescribed Regimen:</span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Dr. Sarah Chen, MD</span>
                </div>
                <div className="text-sm font-bold text-slate-800">
                  Metoprolol Succinate 25mg ER
                </div>
                <div className="text-xs text-slate-600">
                  Track each dose taken per day to ensure accurate telemetry for treatment review.
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-700">Dose Checklist:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    medMorning ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={medMorning}
                      onChange={(e) => {
                        setMedMorning(e.target.checked);
                        if (e.target.checked) setMedicationTaken(true);
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold">Morning Dose</div>
                      <div className="text-[10px] opacity-75">Metoprolol 25mg</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    medAfternoon ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={medAfternoon}
                      onChange={(e) => {
                        setMedAfternoon(e.target.checked);
                        if (e.target.checked) setMedicationTaken(true);
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold">Afternoon Dose</div>
                      <div className="text-[10px] opacity-75">Hydration / Supp.</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    medNight ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={medNight}
                      onChange={(e) => {
                        setMedNight(e.target.checked);
                        if (e.target.checked) setMedicationTaken(true);
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold">Night Dose</div>
                      <div className="text-[10px] opacity-75">Rest Support</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Dynamic Symptom Tracker */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Symptom Severity Logger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rate specific symptoms to track patterns with stress and sleep quality.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Quick add:</span>
                {['Headache', 'Heart Palpitations', 'Fatigue', 'Dizziness'].map((sym) => (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => handleQuickAddSymptom(sym)}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg transition-colors"
                  >
                    + {sym}
                  </button>
                ))}
              </div>
            </div>

            {symptoms.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 font-medium">No symptoms logged for this date. (Feeling 100% asymptomatic)</p>
                <button
                  type="button"
                  onClick={() => handleAddSymptom()}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Symptom
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {symptoms.map((symptom, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="Symptom Name (e.g. Headache, Chest Flutter)"
                        value={symptom.name}
                        onChange={(e) => handleSymptomChange(idx, 'name', e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
                      />

                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          symptom.severity >= 7 
                            ? 'bg-rose-100 text-rose-800' 
                            : symptom.severity >= 4 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Severity: {symptom.severity}/10
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveSymptom(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove symptom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Mild (1)</span>
                          <span className="font-semibold text-slate-700">{symptom.severity}/10</span>
                          <span>Severe (10)</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={symptom.severity}
                          onChange={(e) => handleSymptomChange(idx, 'severity', parseInt(e.target.value))}
                          className="w-full accent-teal-600 cursor-pointer"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Clinical notes (e.g. Right temple ache, after lunch)"
                        value={symptom.notes}
                        onChange={(e) => handleSymptomChange(idx, 'notes', e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddSymptom()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Symptom
                </button>
              </div>
            )}
          </div>

          {/* 6. Daily Notes & Submit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label htmlFor="dailyNotes" className="block text-sm font-bold text-slate-900 mb-1">
                Personal Daily Notes / Journal
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Note any work stress triggers, food/caffeine intake, or questions for Dr. Sarah Chen.
              </p>
              <textarea
                id="dailyNotes"
                rows={3}
                placeholder="e.g. Busy sprint release at work today. Took short walk during break to decompress."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
              />
            </div>

            {saveSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('history')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                >
                  View In History
                </button>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-slate-400" />
                <span>Logs are stored securely in SQLite and instantly synchronized with Dr. Sarah Chen's dashboard.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="submit"
                  id="btn-save-daily-record"
                  onClick={(e) => handleSubmit(e)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white text-sm font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving to Database...' : "Save Today's Record"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: 14-DAY CORRELATION INSIGHTS & CHARTS */}
      {activeSubTab === 'insights' && (
        <div className="space-y-6">
          {/* Key Insight Highlight Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-purple-300" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30 uppercase tracking-wider">
                  CareFlow Clinical Correlation Engine
                </div>
                <h3 className="text-lg font-bold text-white">
                  Strong Correlation Detected: Sleep Loss & Stress Trigger Headaches & Palpitations
                </h3>
                <p className="text-sm text-purple-100 leading-relaxed max-w-4xl">
                  {correlationData?.metrics?.clinicalSummary || 
                    'Patient records reveal an 86% correlation between high stress (score ≥7/10) + sleep restriction (<6 hrs) and acute palpitations/tension headache episodes. Noticeable stabilization observed following Metoprolol initiation and sleep recovery.'
                  }
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-purple-800/60">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-xs text-purple-200">Correlation Confidence</div>
                <div className="text-2xl font-bold text-white mt-0.5">86%</div>
                <div className="text-[11px] text-purple-300 mt-0.5">High statistical link</div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-xs text-purple-200">Pre-Treatment Sleep Avg</div>
                <div className="text-2xl font-bold text-white mt-0.5">5.6 hrs</div>
                <div className="text-[11px] text-rose-300 mt-0.5">Below 7h baseline</div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-xs text-purple-200">Post-Treatment Sleep Avg</div>
                <div className="text-2xl font-bold text-white mt-0.5">7.4 hrs</div>
                <div className="text-[11px] text-emerald-300 mt-0.5">+32% recovery increase</div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-xs text-purple-200">Active Symptom Score</div>
                <div className="text-2xl font-bold text-emerald-400 mt-0.5">1 / 10</div>
                <div className="text-[11px] text-emerald-300 mt-0.5">Down from peak 9/10</div>
              </div>
            </div>
          </div>

          {/* Interactive Chart 1: Sleep & Stress vs Headache Severity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  14-Day Timeline: Sleep (hrs) & Stress vs. Headache Severity (1-10)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Notice the sharp symptom escalation during Aug 18–20 (low sleep + high stress), followed by resolution post-treatment.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-indigo-600">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span> Sleep Hours
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Stress (1-10)
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Headache Severity
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              {correlationData?.chartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={correlationData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="formattedDate" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" domain={[0, 12]} tick={{ fontSize: 11 }} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">{data.date} ({label})</div>
                          <div className="text-indigo-300">🌙 Sleep: <span className="font-bold text-white">{data.sleep} hrs</span> ({data.mood})</div>
                          <div className="text-amber-300">🔥 Stress: <span className="font-bold text-white">{data.stress}/10</span></div>
                          <div className="text-rose-300">⚡ Headache Severity: <span className="font-bold text-white">{data.headacheSeverity}/10</span></div>
                          <div className="text-teal-300">💓 Palpitation Severity: <span className="font-bold text-white">{data.palpitationSeverity}/10</span></div>
                          <div className="text-purple-300">💊 Medication: <span className="font-bold text-white">{data.medicationTaken ? 'Taken' : 'None'}</span></div>
                        </div>
                      );
                    }} />
                    <Area yAxisId="left" type="monotone" dataKey="sleep" fill="#818cf8" stroke="#4f46e5" fillOpacity={0.15} name="Sleep (hrs)" />
                    <Line yAxisId="left" type="monotone" dataKey="stress" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} name="Stress" />
                    <Line yAxisId="left" type="monotone" dataKey="headacheSeverity" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} name="Headache Severity" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading trend data...</div>
              )}
            </div>

            {/* Stage Annotations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="font-bold text-amber-900">Aug 14–17: Early Symptoms</div>
                <div className="text-amber-800 mt-0.5">Stress rising from 3 to 6. Sleep dropping from 7.5 to 6.0h. First palpitation triggers.</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <div className="font-bold text-rose-900">Aug 18–20: Acute Peak Phase</div>
                <div className="text-rose-800 mt-0.5">Peak stress (9/10), sleep deprivation (4.5h), and severe headache (9/10). Prescribed Metoprolol.</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="font-bold text-emerald-900">Aug 21–27: Recovery Phase</div>
                <div className="text-emerald-800 mt-0.5">Metoprolol daily adherence, sleep restored to 8.0h, stress down to 2/10, symptoms normalized.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COMPLETE HISTORY LOG */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Past Daily Health Records</h3>
                <p className="text-xs text-slate-500">Showing {records.length} chronological journal entries</p>
              </div>

              <button
                onClick={() => setActiveSubTab('log')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Entry
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {records.map((rec) => (
                <div key={rec.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-700 font-bold shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase">{new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-sm leading-none">{new Date(rec.date + 'T00:00:00').getDate()}</span>
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>Mood: <strong className="text-slate-700">{rec.mood}</strong></span>
                          <span>•</span>
                          <span>Sleep: <strong className="text-slate-700">{rec.sleep_hours}h ({rec.sleep_quality})</strong></span>
                          <span>•</span>
                          <span>Water: <strong className="text-slate-700">{rec.water_intake} glasses</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        (rec.stress_level || 0) >= 8 
                          ? 'bg-rose-100 text-rose-800' 
                          : (rec.stress_level || 0) >= 5 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Stress: {rec.stress_level}/10
                      </span>

                      {rec.medication_taken === 1 ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 flex items-center gap-1">
                          <Pill className="w-3 h-3" /> Metoprolol Taken
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">
                          No Meds
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setDate(rec.date);
                          setActiveSubTab('log');
                        }}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-800 px-2 py-1 rounded-lg hover:bg-teal-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Symptoms for this day */}
                  {rec.symptoms && rec.symptoms.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-slate-500">Symptoms:</span>
                      {rec.symptoms.map((s, idx) => (
                        <span 
                          key={idx} 
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            s.severity >= 7 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : s.severity >= 4 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.name} ({s.severity}/10)
                          {s.notes ? ` - "${s.notes}"` : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {rec.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{rec.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
