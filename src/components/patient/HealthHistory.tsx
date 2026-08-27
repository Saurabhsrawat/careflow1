import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  Calendar, 
  Moon, 
  Flame, 
  Heart, 
  Activity, 
  Droplet, 
  Pill, 
  Search, 
  Filter, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Plus, 
  ChevronRight, 
  FileText,
  Smile,
  Utensils,
  ChevronDown
} from 'lucide-react';
import { DailyHealthRecord, Symptom } from '../../types';

interface HealthHistoryProps {
  onNavigateTab?: (tab: 'dashboard' | 'journey' | 'health_recorder' | 'analytics' | 'history' | 'reports' | 'appointments' | 'tasks') => void;
}

export const HealthHistory: React.FC<HealthHistoryProps> = ({ onNavigateTab }) => {
  const [records, setRecords] = useState<DailyHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high_stress' | 'high_headache' | 'fatigue'>('all');
  const [selectedRecord, setSelectedRecord] = useState<DailyHealthRecord | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('careflow_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/patient/daily-health?limit=60', { headers, credentials: 'include' });
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const data = await res.json();
          setRecords(data.records || []);
        }
      }
    } catch (err) {
      console.error('Failed to load health history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      // Search term matching
      const matchesSearch = 
        !searchTerm ||
        rec.date.includes(searchTerm) ||
        (rec.notes && rec.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.mood && rec.mood.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.symptoms && rec.symptoms.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())));

      // Filter by severity categories
      if (!matchesSearch) return false;

      if (filterSeverity === 'high_stress') {
        return (rec.stress_level || 0) >= 7;
      }
      if (filterSeverity === 'high_headache') {
        const headache = rec.symptoms?.find(s => s.name.toLowerCase().includes('headache'))?.severity || 0;
        return headache >= 6;
      }
      if (filterSeverity === 'fatigue') {
        const fatigue = rec.symptoms?.find(s => s.name.toLowerCase().includes('fatigue'))?.severity || 0;
        return fatigue >= 4;
      }

      return true;
    });
  }, [records, searchTerm, filterSeverity]);

  // Helpers to extract symptoms
  const getHeadacheSeverity = (rec: DailyHealthRecord) => {
    return rec.symptoms?.find(s => s.name.toLowerCase().includes('headache'))?.severity || 0;
  };

  const getFatigueSeverity = (rec: DailyHealthRecord) => {
    return rec.symptoms?.find(s => s.name.toLowerCase().includes('fatigue'))?.severity || 0;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Raw Daily Logs
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Daily Health History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Browse and inspect all raw past health telemetry entries recorded during your care journey. Click any row to view complete day details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('analytics')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                View Analytics Charts
              </button>
              <button
                onClick={() => onNavigateTab('health_recorder')}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Today's Entry
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by date, notes, symptom, or mood..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-teal-500 transition-colors"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Severity filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filter:</span>
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              filterSeverity === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Logs ({records.length})
          </button>
          <button
            onClick={() => setFilterSeverity('high_stress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              filterSeverity === 'high_stress'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            High Stress (≥7)
          </button>
          <button
            onClick={() => setFilterSeverity('high_headache')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              filterSeverity === 'high_headache'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Severe Headache (≥6)
          </button>
          <button
            onClick={() => setFilterSeverity('fatigue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              filterSeverity === 'fatigue'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
            }`}
          >
            Fatigue Logs
          </button>
        </div>
      </div>

      {/* Scannable Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Sleep</th>
                <th className="py-3.5 px-4">Stress</th>
                <th className="py-3.5 px-4">Headache</th>
                <th className="py-3.5 px-4">Fatigue</th>
                <th className="py-3.5 px-4">Water</th>
                <th className="py-3.5 px-4">Exercise</th>
                <th className="py-3.5 px-4">Medication</th>
                <th className="py-3.5 px-4">Mood</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full mb-2" />
                    <div>Loading past health records...</div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Heart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <div className="font-bold text-slate-700">No health records found</div>
                    <p className="text-xs text-slate-500 mt-1">Try clearing filters or logging your first health entry.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const headache = getHeadacheSeverity(rec);
                  const fatigue = getFatigueSeverity(rec);
                  const isRxDay = rec.date >= '2026-08-20' || rec.medication_taken === 1 || rec.med_morning === 1;
                  const dosesTaken = (rec.med_morning || 0) + (rec.med_afternoon || 0) + (rec.med_night || 0);

                  return (
                    <tr 
                      key={rec.id}
                      onClick={() => setSelectedRecord(rec)}
                      className="hover:bg-teal-50/50 cursor-pointer transition-colors group select-none"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 group-hover:text-teal-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
                          <span>{new Date(rec.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* Sleep */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{rec.sleep_hours}h</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            rec.sleep_quality === 'Excellent' || rec.sleep_quality === 'Good'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}>
                            {rec.sleep_quality || 'Good'}
                          </span>
                        </div>
                      </td>

                      {/* Stress */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full ${
                          (rec.stress_level || 0) >= 8 
                            ? 'bg-rose-100 text-rose-800' 
                            : (rec.stress_level || 0) >= 5 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <Flame className="w-3 h-3" />
                          {rec.stress_level}/10
                        </span>
                      </td>

                      {/* Headache */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {headache > 0 ? (
                          <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                            headache >= 7 
                              ? 'bg-red-100 text-red-800' 
                              : headache >= 4 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {headache}/10
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">None</span>
                        )}
                      </td>

                      {/* Fatigue */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {fatigue > 0 ? (
                          <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                            fatigue >= 6 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {fatigue}/10
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">None</span>
                        )}
                      </td>

                      {/* Water */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                        {rec.water_intake || 8} gls
                      </td>

                      {/* Exercise */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                        {rec.exercise_minutes ? `${rec.exercise_minutes}m` : '0m'}
                      </td>

                      {/* Medication */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRxDay ? (
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              dosesTaken === 3 || rec.medication_taken === 1
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              <Pill className="w-3 h-3" />
                              {dosesTaken > 0 ? `${dosesTaken}/3 doses` : 'Taken'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Pre-Rx</span>
                        )}
                      </td>

                      {/* Mood */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {rec.mood || 'Neutral'}
                        </span>
                      </td>

                      {/* Details Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button className="text-teal-700 font-bold hover:text-teal-900 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Entry Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-3xl sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Health Log Entry Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    {new Date(selectedRecord.date + 'T00:00:00').toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Top Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-1">
                  <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-indigo-600" /> Sleep
                  </div>
                  <div className="text-xl font-black text-slate-900">{selectedRecord.sleep_hours} hrs</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{selectedRecord.sleep_quality} Quality</div>
                </div>

                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl space-y-1">
                  <div className="text-[11px] font-bold text-rose-900 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-600" /> Stress
                  </div>
                  <div className="text-xl font-black text-slate-900">{selectedRecord.stress_level}/10</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{selectedRecord.mood} Mood</div>
                </div>

                <div className="p-3.5 bg-cyan-50 border border-cyan-100 rounded-2xl space-y-1">
                  <div className="text-[11px] font-bold text-cyan-900 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-cyan-600" /> Hydration
                  </div>
                  <div className="text-xl font-black text-slate-900">{selectedRecord.water_intake || 8} gls</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{selectedRecord.exercise_minutes || 0}m activity</div>
                </div>

                <div className="p-3.5 bg-purple-50 border border-purple-100 rounded-2xl space-y-1">
                  <div className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-purple-600" /> Medication
                  </div>
                  <div className="text-lg font-black text-purple-900">
                    {selectedRecord.date >= '2026-08-20' || selectedRecord.medication_taken === 1 ? 'Rx Active' : 'Pre-Rx'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">Metoprolol 25mg</div>
                </div>

              </div>

              {/* Medication Dose Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Medication Dose Schedule & Compliance
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {selectedRecord.date >= '2026-08-20' ? 'Prescription Protocol' : 'Pre-Diagnosis Period'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Morning Dose</div>
                      <div className="text-[10px] text-slate-500">Metoprolol 25mg ER</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      selectedRecord.med_morning === 1 || (selectedRecord.date >= '2026-08-20' && selectedRecord.medication_taken === 1)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedRecord.med_morning === 1 || (selectedRecord.date >= '2026-08-20' && selectedRecord.medication_taken === 1) ? 'Taken ✓' : 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Afternoon Dose</div>
                      <div className="text-[10px] text-slate-500">Hydration & Electrolyte</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      selectedRecord.med_afternoon === 1 || (selectedRecord.date >= '2026-08-20' && selectedRecord.date !== '2026-08-22' && selectedRecord.medication_taken === 1)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedRecord.med_afternoon === 1 || (selectedRecord.date >= '2026-08-20' && selectedRecord.date !== '2026-08-22' && selectedRecord.medication_taken === 1) ? 'Taken ✓' : 'Missed / N/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Night Dose</div>
                      <div className="text-[10px] text-slate-500">Evening Rest Support</div>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      selectedRecord.med_night === 1 || (selectedRecord.date >= '2026-08-20' && selectedRecord.date !== '2026-08-27' && selectedRecord.medication_taken === 1)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedRecord.med_night === 1 || (selectedRecord.date >= '2026-08-20' && selectedRecord.date !== '2026-08-27' && selectedRecord.medication_taken === 1) ? 'Taken ✓' : 'Pending / N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Symptoms Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    Recorded Symptoms & Severity ({selectedRecord.symptoms?.length || 0})
                  </h3>
                </div>

                {selectedRecord.symptoms && selectedRecord.symptoms.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedRecord.symptoms.map((s, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{s.name}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            s.severity >= 7 ? 'bg-rose-100 text-rose-800' : s.severity >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            Severity: {s.severity}/10
                          </span>
                        </div>

                        {/* Visual severity bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              s.severity >= 7 ? 'bg-rose-600' : s.severity >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${s.severity * 10}%` }}
                          />
                        </div>

                        {s.notes && (
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60">
                            <strong>Note:</strong> {s.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50 rounded-xl text-slate-400 text-xs">
                    No symptoms recorded for this day.
                  </div>
                )}
              </div>

              {/* Daily Diary / Clinical Notes */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Daily Journal & Patient Notes
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed">
                  {selectedRecord.notes ? (
                    selectedRecord.notes
                  ) : (
                    <span className="text-slate-400 italic">No additional journal notes provided.</span>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
              <span className="text-xs text-slate-500 font-medium">
                Record ID: {selectedRecord.id.slice(0, 8)}...
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
