import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/api';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar, 
  ArrowRight,
  Plus
} from 'lucide-react';

interface TaskItem {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_stage: string;
  title: string;
  status: 'pending' | 'completed' | 'overdue';
  due_date?: string;
  journey_stage?: string;
  journey_title?: string;
}

interface TasksProps {
  onSelectPatient: (patientId: string) => void;
}

export const DoctorTasksList: React.FC<TasksProps> = ({ onSelectPatient }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [patientFilter, setPatientFilter] = useState<string>('all');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/doctor/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(t => {
    const matchSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.journey_stage && t.journey_stage.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPatient = patientFilter === 'all' || t.patient_id === patientFilter;

    return matchSearch && matchStatus && matchPatient;
  });

  const uniquePatients = Array.from(new Set(tasks.map(t => JSON.stringify({ id: t.patient_id, name: t.patient_name }))))
    .map((str: string) => JSON.parse(str) as { id: string; name: string });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4 text-teal-600" />
            <span>Care Directives & Milestones</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Care Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor prescribed patient action items, fasting protocols, walking exercises, and appointment confirmations across all assigned patients.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            {pendingCount} Pending
          </div>
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            {completedCount} Completed
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, directives, or patient name..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Patients ({tasks.length})</option>
            {uniquePatients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 mt-3">Loading patient tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Care Tasks Found</h3>
          <p className="text-xs text-slate-500 mt-1">No tasks match your selected filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = task.status === 'overdue';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                  isCompleted ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCompleted
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : isOverdue
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        {task.status.toUpperCase()}
                      </span>

                      <button
                        onClick={() => onSelectPatient(task.patient_id)}
                        className="text-xs font-bold text-slate-900 hover:text-teal-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        <span>{task.patient_name}</span>
                        <span className="text-[10px] text-slate-400">({task.patient_stage})</span>
                      </button>

                      {task.journey_stage && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {task.journey_stage}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>

                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Target Due Date: {task.due_date}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSelectPatient(task.patient_id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer self-end sm:self-center"
                >
                  <span>Patient Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
