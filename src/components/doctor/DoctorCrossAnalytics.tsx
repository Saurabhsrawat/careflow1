import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Sparkles,
  AlertCircle,
  BarChart3,
  Layers
} from 'lucide-react';

interface DataPoint {
  date: string;
  sleep: number;
  stress: number;
  hydration: number;
  exercise: number;
  headache: number;
  fatigue: number;
  palpitations: number;
  medDoses: number;
}

interface CrossAnalyticsProps {
  dataPoints: DataPoint[];
  patientName: string;
}

const VARIABLES: { id: keyof DataPoint; label: string; unit: string; max: number; color: string; bgColor: string }[] = [
  { id: 'sleep', label: 'Sleep Duration', unit: 'hrs', max: 10, color: 'text-indigo-600', bgColor: 'bg-indigo-600' },
  { id: 'stress', label: 'Stress Index', unit: '/10', max: 10, color: 'text-rose-600', bgColor: 'bg-rose-600' },
  { id: 'headache', label: 'Headache Severity', unit: '/10', max: 10, color: 'text-amber-600', bgColor: 'bg-amber-600' },
  { id: 'fatigue', label: 'Fatigue Severity', unit: '/10', max: 10, color: 'text-orange-600', bgColor: 'bg-orange-600' },
  { id: 'palpitations', label: 'Heart Palpitations', unit: '/10', max: 10, color: 'text-red-600', bgColor: 'bg-red-600' },
  { id: 'exercise', label: 'Exercise', unit: 'mins', max: 60, color: 'text-emerald-600', bgColor: 'bg-emerald-600' },
  { id: 'hydration', label: 'Hydration Intake', unit: 'glasses', max: 12, color: 'text-cyan-600', bgColor: 'bg-cyan-600' },
  { id: 'medDoses', label: 'Medication Doses', unit: 'doses/day', max: 3, color: 'text-blue-600', bgColor: 'bg-blue-600' },
];

export const DoctorCrossAnalytics: React.FC<CrossAnalyticsProps> = ({ dataPoints, patientName }) => {
  const [varX, setVarX] = useState<keyof DataPoint>('sleep');
  const [varY, setVarY] = useState<keyof DataPoint>('headache');

  const metaX = VARIABLES.find(v => v.id === varX) || VARIABLES[0];
  const metaY = VARIABLES.find(v => v.id === varY) || VARIABLES[2];

  // Deterministic correlation and split-analysis calculation
  const analysis = useMemo(() => {
    if (!dataPoints || dataPoints.length < 3) return null;

    const pairs = dataPoints.map(d => ({
      date: d.date,
      x: Number(d[varX]) || 0,
      y: Number(d[varY]) || 0,
    }));

    // Sort by date ascending
    pairs.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate split statistics based on median or midpoint of X
    const xVals = pairs.map(p => p.x);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const midX = (minX + maxX) / 2;

    const lowGroup = pairs.filter(p => p.x <= midX);
    const highGroup = pairs.filter(p => p.x > midX);

    const avgYLow = lowGroup.length > 0 ? (lowGroup.reduce((sum, p) => sum + p.y, 0) / lowGroup.length) : 0;
    const avgYHigh = highGroup.length > 0 ? (highGroup.reduce((sum, p) => sum + p.y, 0) / highGroup.length) : 0;

    // Simple Pearson Correlation Coefficient (r)
    const n = pairs.length;
    const meanX = pairs.reduce((sum, p) => sum + p.x, 0) / n;
    const meanY = pairs.reduce((sum, p) => sum + p.y, 0) / n;

    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let p of pairs) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    const r = den === 0 ? 0 : Number((num / den).toFixed(2));

    let strength = 'Weak';
    if (Math.abs(r) >= 0.7) strength = 'Strong';
    else if (Math.abs(r) >= 0.4) strength = 'Moderate';

    const direction = r > 0 ? 'Positive' : r < 0 ? 'Inverse' : 'Neutral';

    return {
      pairs,
      midX,
      avgYLow: Number(avgYLow.toFixed(1)),
      avgYHigh: Number(avgYHigh.toFixed(1)),
      lowCount: lowGroup.length,
      highCount: highGroup.length,
      r,
      strength,
      direction
    };
  }, [dataPoints, varX, varY]);

  const presetPairs = [
    { x: 'sleep', y: 'headache', label: 'Sleep vs Headache' },
    { x: 'sleep', y: 'stress', label: 'Sleep vs Stress' },
    { x: 'stress', y: 'palpitations', label: 'Stress vs Palpitations' },
    { x: 'medDoses', y: 'palpitations', label: 'Medication vs Palpitations' },
    { x: 'hydration', y: 'fatigue', label: 'Hydration vs Fatigue' },
    { x: 'exercise', y: 'stress', label: 'Exercise vs Stress' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Preset Shortcuts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <GitCompare className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Cross-Variable Health Correlation Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select two clinical variables to evaluate co-occurrence patterns across {patientName}'s daily health logs.
            </p>
          </div>

          {/* Strict Non-Causal Compliance Badge */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-xs text-amber-900 flex items-start gap-2 max-w-sm">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">Clinical Disclaimer</div>
              <div className="text-[11px] text-amber-800 leading-tight">
                Observed correlation. Requires clinical evaluation. Statistical co-occurrence does not establish medical causation.
              </div>
            </div>
          </div>
        </div>

        {/* Preset Comparison Buttons */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick Correlation Presets:
          </div>
          <div className="flex flex-wrap gap-2">
            {presetPairs.map((p) => {
              const isSelected = varX === p.x && varY === p.y;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    setVarX(p.x as keyof DataPoint);
                    setVarY(p.y as keyof DataPoint);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-200 font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Variable Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Variable 1 (Independent / Base Parameter)
            </label>
            <select
              value={varX}
              onChange={(e) => setVarX(e.target.value as keyof DataPoint)}
              className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VARIABLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({v.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              Variable 2 (Observed Symptom / Outcome)
            </label>
            <select
              value={varY}
              onChange={(e) => setVarY(e.target.value as keyof DataPoint)}
              className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VARIABLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({v.unit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Result Card */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Statistical Breakdown */}
          <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Correlation Summary
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Pearson Coefficient (r):</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{analysis.r}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Correlation Pattern:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    analysis.direction === 'Inverse' 
                      ? 'bg-amber-100 text-amber-800' 
                      : analysis.direction === 'Positive' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {analysis.strength} {analysis.direction}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Data Points Analyzed:</span>
                  <span className="font-semibold text-slate-800">{analysis.pairs.length} days</span>
                </div>
              </div>

              {/* High vs Low Split Observation */}
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700">Sub-Group Observations:</div>
                <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl space-y-1.5">
                  <div className="text-blue-900">
                    When <strong>{metaX.label}</strong> ≤ {analysis.midX.toFixed(1)} {metaX.unit}:
                  </div>
                  <div className="text-sm font-bold text-blue-950">
                    Average {metaY.label}: {analysis.avgYLow} {metaY.unit}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 border border-indigo-200/70 rounded-xl space-y-1.5">
                  <div className="text-indigo-900">
                    When <strong>{metaX.label}</strong> &gt; {analysis.midX.toFixed(1)} {metaX.unit}:
                  </div>
                  <div className="text-sm font-bold text-indigo-950">
                    Average {metaY.label}: {analysis.avgYHigh} {metaY.unit}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 italic border-t border-slate-100">
              * Note: Data reflects self-reported telemetry and structured patient records.
            </div>
          </div>

          {/* Dual-Axis Visual Trend Comparison */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Synchronized Timeline View: {metaX.label} vs {metaY.label}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-medium text-indigo-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  {metaX.label}
                </span>
                <span className="flex items-center gap-1 font-medium text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  {metaY.label}
                </span>
              </div>
            </div>

            {/* Visual Bar Comparison Graph */}
            <div className="space-y-3 pt-2">
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {analysis.pairs.map((p, idx) => {
                  const pctX = Math.min(100, Math.round((p.x / metaX.max) * 100));
                  const pctY = Math.min(100, Math.round((p.y / metaY.max) * 100));
                  const dateFormatted = p.date.replace('2026-', '');

                  return (
                    <div key={p.date} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600 font-medium">
                        <span className="font-mono text-slate-700">{dateFormatted}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-indigo-700 font-semibold">
                            {metaX.label}: {p.x} {metaX.unit}
                          </span>
                          <span className="text-rose-700 font-semibold">
                            {metaY.label}: {p.y} {metaY.unit}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {/* Bar for Variable X */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pctX}%` }}
                          />
                        </div>
                        {/* Bar for Variable Y */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pctY}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
