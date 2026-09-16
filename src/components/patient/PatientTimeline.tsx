import React, { useState, useEffect } from 'react';
import { 
  History, 
  Layers, 
  Heart, 
  FileText, 
  Calendar, 
  CheckSquare, 
  Pill, 
  Stethoscope, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  Sparkles,
  ArrowUpRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { TimelineEntry } from '../../types';
import { authFetch } from '../../utils/api';

interface PatientTimelineProps {
  onNavigateTab?: (tab: any) => void;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [timelineItems, setTimelineItems] = useState<TimelineEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patient/timeline');
      if (res.ok) {
        const data = await res.json();
        setTimelineItems(data.timeline || []);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const filterOptions = [
    { id: 'all', label: 'All Activities', icon: History, count: timelineItems.length },
    { id: 'journey', label: 'Milestones', icon: Layers, count: timelineItems.filter(i => i.category === 'journey').length },
    { id: 'health_log', label: 'Vitals & Logs', icon: Heart, count: timelineItems.filter(i => i.category === 'health_log').length },
    { id: 'report', label: 'Reports', icon: FileText, count: timelineItems.filter(i => i.category === 'report').length },
    { id: 'appointment', label: 'Appointments', icon: Calendar, count: timelineItems.filter(i => i.category === 'appointment').length },
    { id: 'task', label: 'Care Tasks', icon: CheckSquare, count: timelineItems.filter(i => i.category === 'task').length },
    { id: 'clinical_note', label: 'Doctor Notes', icon: Stethoscope, count: timelineItems.filter(i => i.category === 'clinical_note').length },
  ];

  const filteredItems = timelineItems.filter(item => {
    const matchesFilter = selectedFilter === 'all' || item.category === selectedFilter;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.date.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const getItemVisuals = (category: string) => {
    switch (category) {
      case 'journey':
        return {
          icon: Layers,
          bgColor: 'bg-teal-100',
          textColor: 'text-teal-700',
          borderColor: 'border-teal-300',
          badgeClass: 'bg-teal-100 text-teal-800 border-teal-200'
        };
      case 'health_log':
        return {
          icon: Heart,
          bgColor: 'bg-rose-100',
          textColor: 'text-rose-700',
          borderColor: 'border-rose-300',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
        };
      case 'report':
        return {
          icon: FileText,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-300',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'appointment':
        return {
          icon: Calendar,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-300',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'task':
        return {
          icon: CheckSquare,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-300',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'clinical_note':
        return {
          icon: Stethoscope,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-300',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
      default:
        return {
          icon: History,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-700',
          borderColor: 'border-slate-300',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <History className="w-3.5 h-3.5" />
              <span>Granular Patient Activity Feed</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Complete Health Activity Timeline</h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              A comprehensive reverse-chronological record of every health telemetry entry, stage progression, medical test, appointment, doctor note, and completed task in your CareFlow journey.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-black text-lg">
              {timelineItems.length}
            </div>
            <div>
              <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Total Records</div>
              <div className="text-sm font-bold text-white">Reverse-Chronological</div>
              <div className="text-[11px] text-slate-300">Live Synchronized</div>
            </div>
          </div>
        </div>
      </div>

      {/* Difference Clarification Notice */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">How is Timeline different from Healthcare Journey?</strong>
          <span className="text-blue-800 ml-1">
            <strong>Care Journey</strong> represents the 8 high-level structured clinical phases (Symptoms &rarr; Consultation &rarr; Tests &rarr; Test Result &rarr; Diagnosis &rarr; Treatment &rarr; Recovery &rarr; Follow-up). This <strong>Timeline</strong> is your granular, day-by-day activity stream capturing every single log, report, prescription dose, note, and appointment in strict reverse-chronological order.
          </span>
        </div>
      </div>

      {/* Controls Bar: Search & Category Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search timeline records, tests, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="text-xs font-bold text-slate-500 self-end sm:self-center">
            Showing {filteredItems.length} of {timelineItems.length} activities
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          {filterOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedFilter(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TIMELINE FEED LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Aggregating timeline feed...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No timeline entries found</p>
            <p className="text-xs text-slate-400">Try adjusting your filter or search query.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 pl-6 md:pl-8 space-y-6">
            {filteredItems.map((item) => {
              const visuals = getItemVisuals(item.category);
              const Icon = visuals.icon;
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline node icon */}
                  <div className={`absolute -left-[35px] md:-left-[43px] top-1.5 w-8 h-8 rounded-xl border-2 ${visuals.borderColor} ${visuals.bgColor} ${visuals.textColor} flex items-center justify-center shadow-xs transition-transform group-hover:scale-110`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Card Body */}
                  <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${visuals.badgeClass}`}>
                          {item.badge || item.category.replace('_', ' ')}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Metadata details if present */}
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          {item.metadata.doctor && (
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Stethoscope className="w-3 h-3 text-teal-600" />
                              {item.metadata.doctor}
                            </span>
                          )}
                          {item.metadata.hospital && (
                            <span>{item.metadata.hospital}</span>
                          )}
                          {item.metadata.notes && (
                            <span className="italic text-slate-600">"{item.metadata.notes}"</span>
                          )}
                        </div>

                        {item.relatedStage && onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('journey')}
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <span>View Stage</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
