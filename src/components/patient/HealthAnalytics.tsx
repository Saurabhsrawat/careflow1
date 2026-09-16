import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Moon, 
  Flame, 
  Activity, 
  Droplet, 
  Pill, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Heart,
  ChevronRight,
  Info,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  LineChart,
  BarChart,
  AreaChart,
  Line, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { authFetch } from '../../utils/api';

interface HealthAnalyticsProps {
  onNavigateTab?: (tab: 'dashboard' | 'journey' | 'health_recorder' | 'analytics' | 'history' | 'reports' | 'appointments' | 'tasks') => void;
}

export const HealthAnalytics: React.FC<HealthAnalyticsProps> = ({ onNavigateTab }) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | 'custom'>('14');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-08-14');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-27');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patient/correlation-insights');
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          const data = await res.json();
          setChartData(data.chartData || []);
          setMetrics(data.metrics || null);
        }
      }
    } catch (err) {
      console.error('Failed to load health analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    if (timeRange === '7') {
      return chartData.slice(-7);
    } else if (timeRange === '14') {
      return chartData.slice(-14);
    } else if (timeRange === '30') {
      return chartData.slice(-30);
    } else if (timeRange === 'custom') {
      return chartData.filter(d => d.date >= customStartDate && d.date <= customEndDate);
    }
    return chartData;
  }, [chartData, timeRange, customStartDate, customEndDate]);

  // Computed summary metrics for the selected time range
  const rangeStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        avgSleep: 0,
        avgStress: 0,
        avgExercise: 0,
        avgWater: 0,
        maxHeadache: 0,
        avgFatigue: 0,
        adherencePercent: 88,
        totalDays: 0,
      };
    }

    const totalDays = filteredData.length;
    const totalSleep = filteredData.reduce((acc, d) => acc + (d.sleep || 0), 0);
    const totalStress = filteredData.reduce((acc, d) => acc + (d.stress || 0), 0);
    const totalExercise = filteredData.reduce((acc, d) => acc + (d.exercise || 0), 0);
    const totalWater = filteredData.reduce((acc, d) => acc + (d.water || 0), 0);
    const maxHeadache = filteredData.reduce((max, d) => Math.max(max, d.headacheSeverity || 0), 0);
    const totalFatigue = filteredData.reduce((acc, d) => acc + (d.fatigueSeverity || 0), 0);

    // Calculate medication adherence for active treatment days in range
    const prescribedDays = filteredData.filter(d => d.isPrescribedDay || d.date >= '2026-08-20' || d.medicationTaken);
    let adherence = 88;
    if (prescribedDays.length > 0) {
      const dosesExpected = prescribedDays.length * 3;
      const dosesTaken = prescribedDays.reduce((acc, d) => acc + (d.dosesTaken || (d.medicationTaken ? 3 : 0)), 0);
      adherence = Math.round((dosesTaken / dosesExpected) * 100);
    }

    return {
      avgSleep: Number((totalSleep / totalDays).toFixed(1)),
      avgStress: Number((totalStress / totalDays).toFixed(1)),
      avgExercise: Math.round(totalExercise / totalDays),
      avgWater: Number((totalWater / totalDays).toFixed(1)),
      maxHeadache,
      avgFatigue: Number((totalFatigue / totalDays).toFixed(1)),
      adherencePercent: adherence,
      totalDays,
    };
  }, [filteredData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[170px] space-y-1.5 z-50">
          <div className="font-bold border-b border-slate-700 pb-1 text-teal-300">
            {dataPoint.formattedDate || label} ({dataPoint.date})
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.stroke || entry.fill }} />
                {entry.name}:
              </span>
              <span className="font-bold text-white">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
          {dataPoint.mood && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Mood: <span className="text-slate-200">{dataPoint.mood}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold uppercase tracking-wider mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            Dedicated Health Analytics
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Biometric Trends & Clinical Correlation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Individual trend telemetry tracking sleep, stress, activity, hydration, symptoms, and medication adherence.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
            <button
              onClick={() => setTimeRange('7')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === '7'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('14')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === '14'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimeRange('30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === '30'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === 'custom'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            title="Refresh Analytics"
            className="p-2 text-slate-500 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (shown when custom is selected) */}
      {timeRange === 'custom' && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Select Custom Window:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-teal-500"
            />
          </div>
          <span className="text-[11px] text-teal-800 font-bold ml-auto">
            Showing {filteredData.length} records in range
          </span>
        </div>
      )}

      {/* Summary KPI Strip for the Selected Range */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Sleep KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-indigo-800 flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            Avg Sleep
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {rangeStats.avgSleep} <span className="text-xs font-normal text-slate-500">hrs</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <span className="text-emerald-600 font-bold">Target 8.0h</span>
          </div>
        </div>

        {/* Stress KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-rose-800 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            Avg Stress
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {rangeStats.avgStress} <span className="text-xs font-normal text-slate-500">/10</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {rangeStats.avgStress >= 7 ? 'High Stress' : rangeStats.avgStress >= 4 ? 'Moderate' : 'Calm'}
          </div>
        </div>

        {/* Exercise KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Avg Activity
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {rangeStats.avgExercise} <span className="text-xs font-normal text-slate-500">mins</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">
            Daily mobility
          </div>
        </div>

        {/* Water Intake KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-cyan-800 flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-cyan-600" />
            Avg Hydration
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {rangeStats.avgWater} <span className="text-xs font-normal text-slate-500">gls</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Goal 8-10 gls
          </div>
        </div>

        {/* Peak Headache KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-amber-600" />
            Max Headache
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {rangeStats.maxHeadache} <span className="text-xs font-normal text-slate-500">/10</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">
            1/10 recently
          </div>
        </div>

        {/* Medication Adherence KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-purple-800 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-purple-600" />
            Med Adherence
          </div>
          <div className="text-xl font-extrabold text-purple-900">
            {rangeStats.adherencePercent}%
          </div>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" /> High Compliance
          </div>
        </div>

      </div>

      {/* Clinical Correlation Summary Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Doctor Context Diagnostic Insight
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              Autonomic Stress Reactivity & Sleep Recovery Pattern
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dr. Sarah Chen's diagnostic analysis: Alex's tension headaches and sinus palpitations spiked directly during days with sleep deprivation (&lt;5.5h) and peak stress (8–9/10). Following Metoprolol initiation on Aug 20 and restoration of 7.5+ hours of sleep, symptom severity decreased from 9/10 down to 1/10.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/15 text-center min-w-[140px]">
            <div className="text-xs text-purple-200 font-semibold">Correlation Rate</div>
            <div className="text-3xl font-black text-white mt-0.5">86%</div>
            <div className="text-[10px] text-teal-300 font-bold mt-1">Stress vs Symptoms</div>
          </div>
        </div>
      </div>

      {/* Grid of 7 Individual Dedicated Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Sleep Hours & Quality Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">1. Sleep Duration & Recovery Quality</h3>
                <p className="text-[11px] text-slate-500">Daily hours logged with target benchmark (8.0 hrs)</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Avg {rangeStats.avgSleep}h
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={8} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target (8h)', fill: '#10b981', fontSize: 10, position: 'right' }} />
                <Area type="monotone" dataKey="sleep" name="Sleep Hours" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#sleepGradient)" unit="hrs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Stress Level Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">2. Stress Level Index (1-10 Scale)</h3>
                <p className="text-[11px] text-slate-500">Daily subjective pressure rating (spiked Aug 18-20)</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
              Avg {rangeStats.avgStress}/10
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'High Stress (≥7)', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                <Line type="monotone" dataKey="stress" name="Stress Rating" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48' }} activeDot={{ r: 6 }} unit="/10" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Physical Exercise Minutes Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">3. Physical Exercise & Mobility</h3>
                <p className="text-[11px] text-slate-500">Active minutes per day (walking, light cardio)</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Avg {rangeStats.avgExercise}m
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 50]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={30} stroke="#059669" strokeDasharray="3 3" label={{ value: 'Target 30m', fill: '#059669', fontSize: 10, position: 'right' }} />
                <Bar dataKey="exercise" name="Exercise Minutes" fill="#10b981" radius={[4, 4, 0, 0]} unit="mins" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Water Intake Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <Droplet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">4. Daily Hydration & Fluid Intake</h3>
                <p className="text-[11px] text-slate-500">Glasses consumed daily (target 8 glasses / ~64 oz)</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg">
              Avg {rangeStats.avgWater} gls
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 12]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={8} stroke="#0891b2" strokeDasharray="3 3" label={{ value: 'Target 8 gls', fill: '#0891b2', fontSize: 10, position: 'right' }} />
                <Area type="monotone" dataKey="water" name="Water Glasses" stroke="#0891b2" strokeWidth={2.5} fillOpacity={1} fill="url(#waterGradient)" unit="glasses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Headache Severity Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">5. Headache Severity (1-10 Scale)</h3>
                <p className="text-[11px] text-slate-500">Tension and frontal headache pain progression</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
              Peak {rangeStats.maxHeadache}/10
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="headacheSeverity" name="Headache Severity" stroke="#d97706" strokeWidth={3} dot={{ r: 4, fill: '#d97706' }} activeDot={{ r: 6 }} unit="/10" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Fatigue Severity Trend Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">6. Fatigue & Exhaustion Score (1-10 Scale)</h3>
                <p className="text-[11px] text-slate-500">Lethargy and physical stamina depletion index</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-orange-800 bg-orange-50 px-2.5 py-1 rounded-lg">
              Avg {rangeStats.avgFatigue}/10
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fatigueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="fatigueSeverity" name="Fatigue Severity" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#fatigueGradient)" unit="/10" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 7. Medication Adherence & Daily Dose Compliance Chart (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">7. Medication Adherence & Daily Dose Compliance</h3>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {rangeStats.adherencePercent}% Adherence
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tracking Morning (Metoprolol 25mg), Afternoon, and Night doses across treatment timeline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-700">All Doses Taken (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-700">Partial Doses (67%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="text-slate-500">Pre-Prescription</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Target Compliance (80%)', fill: '#10b981', fontSize: 10, position: 'right' }} />
              <Bar dataKey="dayAdherenceRate" name="Daily Adherence %" fill="#9333ea" radius={[4, 4, 0, 0]} unit="%" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 14-Day Dose Compliance Breakdown Table */}
        <div className="pt-3 border-t border-slate-100 overflow-x-auto">
          <div className="text-xs font-bold text-slate-700 mb-2">Daily Dose Checklist Log:</div>
          <div className="flex items-center gap-2 min-w-max pb-2">
            {filteredData.map((d, idx) => {
              const isRx = d.date >= '2026-08-20' || d.isPrescribedDay;
              return (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-[76px] space-y-1">
                  <div className="text-[10px] font-bold text-slate-500">{d.formattedDate}</div>
                  {isRx ? (
                    <div className="space-y-0.5">
                      <div className={`text-[10px] font-bold px-1 py-0.2 rounded ${d.medMorning === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        M: {d.medMorning === 1 ? '✓' : '✗'}
                      </div>
                      <div className={`text-[10px] font-bold px-1 py-0.2 rounded ${d.medAfternoon === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        A: {d.medAfternoon === 1 ? '✓' : '✗'}
                      </div>
                      <div className={`text-[10px] font-bold px-1 py-0.2 rounded ${d.medNight === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        N: {d.medNight === 1 ? '✓' : '—'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 py-3 font-medium">Pre-Rx</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
        <div className="text-slate-600 font-medium">
          Looking for the raw table view of all recorded health journals?
        </div>
        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <>
              <button
                onClick={() => onNavigateTab('history')}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                View Daily History Table <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('health_recorder')}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                Log New Health Record <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
};
