import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  UserPlus, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Heart, 
  Trash2, 
  Check, 
  AlertCircle, 
  Mail, 
  Lock,
  Sparkles,
  Info
} from 'lucide-react';
import { CaregiverLink } from '../../types';

interface CaregiverManagerProps {
  onNavigateTab?: (tab: any) => void;
}

export const CaregiverManager: React.FC<CaregiverManagerProps> = () => {
  const [caregivers, setCaregivers] = useState<CaregiverLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Link new caregiver form
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [canViewJourney, setCanViewJourney] = useState(true);
  const [canViewAppointments, setCanViewAppointments] = useState(true);
  const [canViewTasks, setCanViewTasks] = useState(false);
  const [canViewReports, setCanViewReports] = useState(false);
  const [canViewDailyHealth, setCanViewDailyHealth] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editing state
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editToggles, setEditToggles] = useState<{
    can_view_journey: boolean;
    can_view_appointments: boolean;
    can_view_tasks: boolean;
    can_view_reports: boolean;
    can_view_daily_health: boolean;
  }>({
    can_view_journey: true,
    can_view_appointments: true,
    can_view_tasks: false,
    can_view_reports: false,
    can_view_daily_health: true,
  });

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token = localStorage.getItem('careflow_token');
    const headers: Record<string, string> = { ...extra };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchCaregivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/patient/caregivers', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to load linked caregivers');
      }
      const data = await res.json();
      setCaregivers(data.caregivers || []);
    } catch (err: any) {
      console.error('Caregiver fetch error:', err);
      setError(err.message || 'Could not load caregivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const handleLinkCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/patient/caregivers/link', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          can_view_journey: canViewJourney ? 1 : 0,
          can_view_appointments: canViewAppointments ? 1 : 0,
          can_view_tasks: canViewTasks ? 1 : 0,
          can_view_reports: canViewReports ? 1 : 0,
          can_view_daily_health: canViewDailyHealth ? 1 : 0,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to link caregiver');

      setSuccessMsg(data.message || 'Caregiver linked successfully!');
      setEmail('');
      setShowAddForm(false);
      await fetchCaregivers();
    } catch (err: any) {
      console.error('Link caregiver error:', err);
      setError(err.message || 'Failed to link caregiver');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (cg: CaregiverLink) => {
    setEditingLinkId(cg.id);
    setEditToggles({
      can_view_journey: Boolean(cg.can_view_journey),
      can_view_appointments: Boolean(cg.can_view_appointments),
      can_view_tasks: Boolean(cg.can_view_tasks),
      can_view_reports: Boolean(cg.can_view_reports),
      can_view_daily_health: Boolean(cg.can_view_daily_health),
    });
  };

  const handleSaveEdit = async (linkId: string) => {
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await fetch(`/api/patient/caregivers/${linkId}/permissions`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(editToggles),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update permissions');

      setSuccessMsg('Permissions updated successfully!');
      setEditingLinkId(null);
      await fetchCaregivers();
    } catch (err: any) {
      console.error('Update caregiver permissions error:', err);
      setError(err.message || 'Failed to update permissions');
    }
  };

  const handleUnlink = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to unlink this caregiver? They will immediately lose access to your records.')) return;

    try {
      setError(null);
      setSuccessMsg(null);
      const res = await fetch(`/api/patient/caregivers/${linkId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to unlink caregiver');

      setSuccessMsg('Caregiver unlinked successfully');
      await fetchCaregivers();
    } catch (err: any) {
      console.error('Unlink caregiver error:', err);
      setError(err.message || 'Failed to unlink caregiver');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-bold uppercase tracking-wider mb-2">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Family & Caregiver Access</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Linked Caregivers</h1>
            <p className="text-teal-100/80 text-xs mt-1 max-w-xl">
              Grant trusted family members or caregivers supportive read-only access to your care journey, appointments, and daily wellness logs.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancel' : 'Link New Caregiver'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1 font-medium">{successMsg}</div>
        </div>
      )}

      {/* Add Caregiver Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Direct Link Caregiver</h2>
              <p className="text-xs text-slate-500">Enter your caregiver’s email and choose which categories they can see.</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              Direct Link
            </span>
          </div>

          <form onSubmit={handleLinkCaregiver} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Caregiver Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. caregiver@careflow.org or maria@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                If your caregiver hasn't registered yet, they can sign in with this email using password: <code className="font-semibold text-slate-600">password123</code>.
              </p>
            </div>

            {/* 5 Category Toggles */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Grant Category Permissions (On / Off)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Care Journey</div>
                      <div className="text-[10px] text-slate-500">Stage progress & milestones</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canViewJourney}
                    onChange={(e) => setCanViewJourney(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                  />
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Appointments</div>
                      <div className="text-[10px] text-slate-500">Dates, times & doctors</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canViewAppointments}
                    onChange={(e) => setCanViewAppointments(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                  />
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Daily Health & Vitals</div>
                      <div className="text-[10px] text-slate-500">Sleep, stress & adherence</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canViewDailyHealth}
                    onChange={(e) => setCanViewDailyHealth(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                  />
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Care Tasks</div>
                      <div className="text-[10px] text-slate-500">Preparation & habits</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canViewTasks}
                    onChange={(e) => setCanViewTasks(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                  />
                </label>

                <label className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-50 sm:col-span-2">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Medical Reports</div>
                      <div className="text-[10px] text-slate-500">Diagnostic lab & imaging records</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={canViewReports}
                    onChange={(e) => setCanViewReports(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
              >
                {saving ? 'Linking...' : 'Save & Link Caregiver'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Linked Caregivers List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Active Caregiver Connections ({caregivers.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Read-Only Scoped Access</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent animate-spin rounded-full mx-auto mb-2" />
            Loading caregivers...
          </div>
        ) : caregivers.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <HeartHandshake className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No caregivers currently linked</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              You haven't granted caregiver access to anyone yet. Click "Link New Caregiver" above to add family or support members.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {caregivers.map((cg) => {
              const isEditing = editingLinkId === cg.id;

              return (
                <div key={cg.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0">
                        {cg.caregiver_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{cg.caregiver_name || 'Caregiver'}</div>
                        <div className="text-[11px] text-slate-500">{cg.caregiver_email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => setEditingLinkId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(cg.id)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                          >
                            Save Toggles
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(cg)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
                          >
                            Edit Permissions
                          </button>
                          <button
                            onClick={() => handleUnlink(cg.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Unlink Caregiver"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Permissions Display / Edit Toggles */}
                  {isEditing ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editToggles.can_view_journey}
                          onChange={(e) => setEditToggles({ ...editToggles, can_view_journey: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Journey</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editToggles.can_view_appointments}
                          onChange={(e) => setEditToggles({ ...editToggles, can_view_appointments: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Appts</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editToggles.can_view_daily_health}
                          onChange={(e) => setEditToggles({ ...editToggles, can_view_daily_health: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Vitals</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editToggles.can_view_tasks}
                          onChange={(e) => setEditToggles({ ...editToggles, can_view_tasks: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Tasks</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editToggles.can_view_reports}
                          onChange={(e) => setEditToggles({ ...editToggles, can_view_reports: e.target.checked })}
                          className="rounded text-teal-600"
                        />
                        <span>Reports</span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-semibold text-slate-500 mr-1">Permitted:</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cg.can_view_journey ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 line-through'}`}>
                        Journey
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cg.can_view_appointments ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 line-through'}`}>
                        Appointments
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cg.can_view_daily_health ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 line-through'}`}>
                        Daily Health
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cg.can_view_tasks ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 line-through'}`}>
                        Tasks
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cg.can_view_reports ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400 line-through'}`}>
                        Reports
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Informational Guidance */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-1">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-teal-600" />
          <span>Patient Privacy Architecture</span>
        </div>
        <p className="leading-relaxed">
          Caregiver access is strictly read-only and scoped at the database layer. Caregivers can only inspect categories that are actively toggled on. If you disable a category, the server immediately denies access to those records.
        </p>
      </div>
    </div>
  );
};
