import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar, 
  Heart, 
  Activity, 
  Moon, 
  Pill, 
  AlertCircle, 
  CheckCircle2, 
  LayoutGrid, 
  List, 
  Building2,
  Stethoscope,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { DoctorPatientSummary } from '../../types';

interface PatientListProps {
  onSelectPatient: (patientId: string) => void;
}

export const DoctorPatientList: React.FC<PatientListProps> = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState<DoctorPatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Failed to load doctor patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.contact && p.contact.includes(searchQuery));

    const matchesStage = stageFilter === 'all' || p.current_stage.toLowerCase() === stageFilter.toLowerCase();

    return matchesSearch && matchesStage;
  });

  const getStageBadgeColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'treatment':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'recovery':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'tests':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'diagnosis':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                My Assigned Patients
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active cardiology cohort assigned to <strong>Dr. Sarah Chen, MD</strong> at <strong>St. Jude Medical Center</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              {patients.length} Active Clinic Cohort
            </span>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patients by name, email, or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="all">All Journey Stages</option>
              <option value="Symptoms">Symptoms</option>
              <option value="Consultation">Consultation</option>
              <option value="Tests">Tests</option>
              <option value="Test Result">Test Result</option>
              <option value="Diagnosis">Diagnosis</option>
              <option value="Treatment">Treatment</option>
              <option value="Recovery">Recovery</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-slate-500">Loading assigned patient records...</div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">No matching patients found</div>
          <p className="text-xs text-slate-400">Try adjusting your search criteria or stage filter.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-3.5 px-4">Patient Name & Demographics</th>
                  <th className="py-3.5 px-4">Journey Stage</th>
                  <th className="py-3.5 px-4">Last Visit</th>
                  <th className="py-3.5 px-4">Next Appointment</th>
                  <th className="py-3.5 px-4">Adherence</th>
                  <th className="py-3.5 px-4">Vitals Summary</th>
                  <th className="py-3.5 px-4">Alert Flags</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => (
                  <tr 
                    key={p.id}
                    onClick={() => onSelectPatient(p.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.age} yrs &bull; Blood: <strong>{p.blood_group || 'O+'}</strong> &bull; {p.contact}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-block font-bold text-[11px] px-2.5 py-1 rounded-full border ${getStageBadgeColor(p.current_stage)}`}>
                        {p.current_stage}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-600">
                      {p.last_visit_date || '2026-08-15'}
                    </td>

                    <td className="py-4 px-4">
                      {p.next_appointment ? (
                        <div className="text-blue-900 font-semibold">
                          {p.next_appointment.date}
                          <div className="text-[10px] text-slate-400">{p.next_appointment.time}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None scheduled</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{p.adherence_percent}%</span>
                        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.adherence_percent >= 85 ? 'bg-emerald-500' : p.adherence_percent >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${p.adherence_percent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-[11px] text-slate-600 space-y-0.5">
                      <div>Sleep: <strong>{p.avg_sleep}h</strong> / night</div>
                      <div>Stress: <strong>{p.avg_stress}/10</strong></div>
                    </td>

                    <td className="py-4 px-4">
                      {p.active_alerts && p.active_alerts.filter(a => a.severity !== 'low').length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {p.active_alerts.filter(a => a.severity !== 'low').map((alt, idx) => (
                            <span 
                              key={idx}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                                alt.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {alt.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Stable Baseline
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(p.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold transition-colors"
                      >
                        <span>Open Chart</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectPatient(p.id)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
                      {p.name}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.age} yrs &bull; Blood: {p.blood_group || 'O+'}
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getStageBadgeColor(p.current_stage)}`}>
                    {p.current_stage}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-slate-400">Sleep</div>
                    <div className="font-bold text-slate-800 mt-0.5">{p.avg_sleep}h</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-slate-400">Stress</div>
                    <div className="font-bold text-slate-800 mt-0.5">{p.avg_stress}/10</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-slate-400">Adherence</div>
                    <div className="font-bold text-emerald-700 mt-0.5">{p.adherence_percent}%</div>
                  </div>
                </div>

                {p.active_alerts && p.active_alerts.filter(a => a.severity !== 'low').length > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-0.5">
                    <div className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{p.active_alerts[0].title}</span>
                    </div>
                    <p className="text-[11px] text-amber-800 line-clamp-1">
                      {p.active_alerts[0].message}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Next: {p.next_appointment?.date || 'Follow-up TBD'}</span>
                <span className="font-semibold text-blue-600 flex items-center gap-1">
                  View Chart &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
