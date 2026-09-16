import React, { useState, useEffect } from 'react';
import { 
  History, 
  Layers, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Building2, 
  Stethoscope, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  CheckSquare, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  X, 
  AlertCircle,
  FolderArchive,
  Search,
  Activity
} from 'lucide-react';
import { HealthcareJourney, JourneyEvent } from '../../types';
import { authFetch } from '../../utils/api';

interface CareHistoryProps {
  onNavigateTab: (tab: any) => void;
  onSelectJourney?: (journeyId: string) => void;
}

export const CareHistory: React.FC<CareHistoryProps> = ({ onNavigateTab, onSelectJourney }) => {
  const [journeys, setJourneys] = useState<HealthcareJourney[]>([]);
  const [activeJourney, setActiveJourney] = useState<HealthcareJourney | null>(null);
  const [resolvedJourneys, setResolvedJourneys] = useState<HealthcareJourney[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Detail modal / expanded view
  const [selectedJourneyDetail, setSelectedJourneyDetail] = useState<{
    journey: HealthcareJourney;
    events: JourneyEvent[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // New Journey Modal
  const [showNewJourneyModal, setShowNewJourneyModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('General Medicine');
  const [newStartDate, setNewStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDescription, setNewDescription] = useState<string>('');
  const [submittingNew, setSubmittingNew] = useState<boolean>(false);

  // Resolve Journey Modal
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [journeyToResolve, setJourneyToResolve] = useState<HealthcareJourney | null>(null);
  const [resolveEndDate, setResolveEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submittingResolve, setSubmittingResolve] = useState<boolean>(false);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patient/journeys');
      if (res.ok) {
        const data = await res.json();
        setJourneys(data.journeys || []);
        setActiveJourney(data.activeJourney || null);
        setResolvedJourneys(data.resolvedJourneys || []);
      }
    } catch (err) {
      console.error('Failed to fetch care journeys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  const handleOpenJourneyDetails = async (journey: HealthcareJourney) => {
    try {
      setLoadingDetail(true);
      const res = await authFetch(`/api/patient/journeys/${journey.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedJourneyDetail(data);
      }
    } catch (err) {
      console.error('Failed to load journey details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStartNewJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmittingNew(true);
      const res = await authFetch('/api/patient/journeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          start_date: newStartDate,
          initial_description: newDescription.trim()
        })
      });

      if (res.ok) {
        setShowNewJourneyModal(false);
        setNewTitle('');
        setNewDescription('');
        await fetchJourneys();
        onNavigateTab('journey');
      }
    } catch (err) {
      console.error('Failed to start new journey:', err);
    } finally {
      setSubmittingNew(false);
    }
  };

  const handleConfirmResolveJourney = async () => {
    if (!journeyToResolve) return;
    try {
      setSubmittingResolve(true);
      const res = await authFetch('/api/patient/journey/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          journey_id: journeyToResolve.id,
          end_date: resolveEndDate
        })
      });

      if (res.ok) {
        setShowResolveModal(false);
        setJourneyToResolve(null);
        await fetchJourneys();
      }
    } catch (err) {
      console.error('Failed to resolve journey:', err);
    } finally {
      setSubmittingResolve(false);
    }
  };

  const calculateDurationDays = (startStr: string, endStr?: string | null): number => {
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const filteredJourneys = journeys.filter(j => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return j.title.toLowerCase().includes(q) ||
      (j.category && j.category.toLowerCase().includes(q)) ||
      (j.resolving_doctor_name && j.resolving_doctor_name.toLowerCase().includes(q)) ||
      (j.resolving_hospital_name && j.resolving_hospital_name.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold uppercase tracking-wider">
              <History className="w-3.5 h-3.5 text-teal-400" />
              Comprehensive Care Record
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              My Care History
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Healthcare journeys represent distinct clinical episodes (e.g. recurring headaches, ankle sprain rehabilitation). Review historical episodes or initiate a new care path.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewJourneyModal(true)}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Start New Care Journey
            </button>
            <button
              onClick={() => onNavigateTab('journey')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition border border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-teal-300" />
              Active Journey View
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Journeys</div>
            <div className="text-2xl font-extrabold text-slate-900">{journeys.length}</div>
            <div className="text-xs text-slate-500">Across lifetime record</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Episode</div>
            <div className="text-base font-extrabold text-slate-900 truncate max-w-[200px]">
              {activeJourney ? activeJourney.title : 'None (All Resolved)'}
            </div>
            <div className="text-xs text-slate-500">
              {activeJourney ? `Started ${activeJourney.start_date}` : 'Ready for new journey'}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Episodes</div>
            <div className="text-2xl font-extrabold text-slate-900">{resolvedJourneys.length}</div>
            <div className="text-xs text-slate-500">Successfully concluded</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, doctor, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredJourneys.length}</strong> of <strong>{journeys.length}</strong> care journeys
        </div>
      </div>

      {/* Current Active Journey Section (if exists) */}
      {activeJourney && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Currently Active Care Journey
            </h2>
            <span className="text-xs font-semibold text-teal-700 bg-teal-100/70 px-2.5 py-0.5 rounded-md">
              Single Active Journey Constraint Enforced
            </span>
          </div>

          <div className="bg-gradient-to-r from-teal-50/70 via-white to-purple-50/40 border-2 border-teal-500/40 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-600 text-white">
                    Active Episode
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {activeJourney.category || 'General Care'}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Started {new Date(activeJourney.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    ({calculateDurationDays(activeJourney.start_date)} days ongoing)
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">
                  {activeJourney.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  {activeJourney.resolving_doctor_name && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      <span>{activeJourney.resolving_doctor_name}</span>
                    </div>
                  )}
                  {activeJourney.resolving_hospital_name && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>{activeJourney.resolving_hospital_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>{activeJourney.events_count || 8} Milestones Recorded</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
                <button
                  onClick={() => onNavigateTab('journey')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setJourneyToResolve(activeJourney);
                    setShowResolveModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resolve & Archive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past / Resolved Care Journeys */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-slate-500" />
            Past Care Journeys & Episodes ({filteredJourneys.filter(j => j.status !== 'active').length})
          </h2>
        </div>

        {filteredJourneys.filter(j => j.status !== 'active').length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Past Journeys Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Resolved healthcare journeys will be automatically archived here with their full clinical timeline, reports, and doctor plans preserved.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJourneys.filter(j => j.status !== 'active').map((journey) => {
              const durationDays = calculateDurationDays(journey.start_date, journey.end_date);

              return (
                <div 
                  key={journey.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all p-5 sm:p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Resolved Episode
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {journey.category || 'Clinical Care'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(journey.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' — '}
                          {journey.end_date ? new Date(journey.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Resolved'}
                          <span className="text-slate-400">({durationDays} days)</span>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">
                        {journey.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                        {journey.resolving_doctor_name && (
                          <div className="flex items-center gap-1.5 font-medium">
                            <Stethoscope className="w-4 h-4 text-teal-600" />
                            <span>Attending: {journey.resolving_doctor_name}</span>
                          </div>
                        )}
                        {journey.resolving_hospital_name && (
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="w-4 h-4 text-teal-600" />
                            <span>{journey.resolving_hospital_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span>{journey.events_count || 8} Milestones Preserved</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-center">
                      <button
                        onClick={() => handleOpenJourneyDetails(journey)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Episode Timeline</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Start New Journey Modal */}
      {showNewJourneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Start New Care Journey</h3>
                  <p className="text-xs text-slate-500">Create a distinct healthcare episode</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewJourneyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeJourney && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Ongoing Journey Notice:</strong>
                  Starting a new care journey will automatically resolve your ongoing journey (<span className="font-semibold">"{activeJourney.title}"</span>) and archive its complete record in your Care History.
                </div>
              </div>
            )}

            <form onSubmit={handleStartNewJourney} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Journey Label / Episode Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ankle Sprain & Physical Rehab, Migraine Care, Dermatology Evaluation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Care Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics & Sports Medicine">Orthopedics & Sports Medicine</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Endocrinology">Endocrinology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Symptoms & Reason for Care
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe initial symptoms or reason for starting this care episode..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewJourneyModal(false)}
                  className="px-4 py-2 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNew || !newTitle.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingNew ? 'Starting Journey...' : 'Start Care Journey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Journey Confirmation Modal */}
      {showResolveModal && journeyToResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Resolve Care Journey</h3>
                <p className="text-xs text-slate-500">Conclude this clinical episode</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p>
                You are about to mark <strong>"{journeyToResolve.title}"</strong> as resolved and archived into your past care history.
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>Started: {journeyToResolve.start_date}</span>
                <span>Milestones: {journeyToResolve.events_count || 8}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Resolution / End Date
              </label>
              <input
                type="date"
                value={resolveEndDate}
                onChange={(e) => setResolveEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowResolveModal(false);
                  setJourneyToResolve(null);
                }}
                className="px-4 py-2 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolveJourney}
                disabled={submittingResolve}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {submittingResolve ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Episode Details Modal */}
      {selectedJourneyDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedJourneyDetail.journey.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedJourneyDetail.journey.start_date} — {selectedJourneyDetail.journey.end_date || 'Concluded'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedJourneyDetail.journey.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Historical Care Episode Archive &bull; {selectedJourneyDetail.events.length} Milestones Recorded
                </p>
              </div>

              <button
                onClick={() => setSelectedJourneyDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Milestone Events */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedJourneyDetail.events.map((ev, idx) => (
                  <div key={ev.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>

                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="font-bold text-teal-800 uppercase tracking-wider bg-teal-100/80 px-2 py-0.5 rounded-md">
                          Stage {idx + 1}: {ev.stage}
                        </span>
                        <span className="text-slate-400 font-mono">{ev.date}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                      {ev.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                        {ev.doctor_name && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                            {ev.doctor_name}
                          </span>
                        )}
                        {ev.hospital_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {ev.hospital_name}
                          </span>
                        )}
                        {ev.clinical_note && (
                          <span className="text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-md">
                            Note Attached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
              <button
                onClick={() => setSelectedJourneyDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl"
              >
                Close Archive View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
