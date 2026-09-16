import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Stethoscope, 
  Building2, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Info, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  Shield,
  Eye
} from 'lucide-react';
import { AccessEntity } from '../../types';
import { authFetch } from '../../utils/api';

interface AccessRequestsProps {
  onNavigateTab?: (tab: any) => void;
}

export const AccessRequests: React.FC<AccessRequestsProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<AccessEntity[]>([]);
  const [bannerNotice, setBannerNotice] = useState<string>('');

  const fetchAccess = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patient/access-requests');
      if (res.ok) {
        const data = await res.json();
        setEntities(data.entities || []);
        setBannerNotice(data.bannerNotice || '');
      }
    } catch (err) {
      console.error('Failed to load access info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Data Privacy & Authorization</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Who Can Access My Information</h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              CareFlow provides total transparency into authorized healthcare institutions, clinicians, and diagnostic facilities currently connected to your medical profile.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 font-black text-lg">
              {entities.length}
            </div>
            <div>
              <div className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">Authorized Entities</div>
              <div className="text-sm font-bold text-white">HIPAA Compliant</div>
              <div className="text-[11px] text-slate-300">Audited Access</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROADMAP BANNER (Clear Phase Notice) */}
      <div className="bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              Future Permission Control Feature
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              Coming in Later Phase
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            {bannerNotice || 'Cross-hospital access requests and granular permission controls are coming in a later phase. You have full transparency over healthcare entities currently authorized to access your medical records.'}
          </p>
          <div className="text-[11px] text-amber-700 font-semibold pt-1">
            In the upcoming release, you will be able to approve external hospital referrals, revoke individual test access, and set time-limited clinical sharing tokens.
          </div>
        </div>
      </div>

      {/* AUTHORIZED CLINICIANS & INSTITUTIONS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              <span>Current Authorized Entities ({entities.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified clinical organizations with active authorization to view or contribute to your medical records.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            All Connections Active & Verified
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading access authorizations...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entities.map((entity) => (
              <div 
                key={entity.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-teal-300 transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      {entity.id === 'acc-1' ? (
                        <Stethoscope className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900">{entity.name}</h3>
                        <span className="text-xs font-semibold text-slate-600">({entity.organization})</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          {entity.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
                        <span>Role: <strong className="text-slate-700">{entity.role}</strong></span>
                        <span>&bull;</span>
                        <span>Scope: <strong className="text-slate-700">{entity.accessLevel}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-500">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Audit Activity</div>
                    <div className="font-semibold text-slate-800 text-[11px] mt-0.5">{entity.lastAccessed}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Granted: {entity.grantedAt}</div>
                  </div>
                </div>

                {/* Specific Permitted Domains */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Authorized Clinical Data Domains:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                      entity.permissions.journey ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {entity.permissions.journey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span className="font-bold text-[11px]">Care Journey</span>
                    </div>

                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                      entity.permissions.reports ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {entity.permissions.reports ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span className="font-bold text-[11px]">Lab & ECG Reports</span>
                    </div>

                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                      entity.permissions.dailyHealth ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {entity.permissions.dailyHealth ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span className="font-bold text-[11px]">Daily Health Logs</span>
                    </div>

                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                      entity.permissions.prescriptions ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {entity.permissions.prescriptions ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                      <span className="font-bold text-[11px]">Prescriptions</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
