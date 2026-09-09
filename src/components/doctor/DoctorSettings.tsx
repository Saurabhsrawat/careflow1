import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Lock, 
  Building2, 
  Stethoscope, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  KeyRound,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/api';

export const DoctorSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile Form
  const [profile, setProfile] = useState({
    name: 'Dr. Sarah Chen, MD',
    email: 'dr.chen@stjude.org',
    specialization: 'Cardiology & Internal Medicine',
    hospital_name: 'St. Jude Medical Center',
    license_number: 'MD-CA-98421',
    phone: '+1 (555) 234-5678 ext 402',
    office: 'Suite 400, East Wing Cardiology Clinic',
    department: 'Department of Cardiovascular Medicine & Electrophysiology',
    bio: 'Board-certified cardiologist specializing in preventive cardiology, cardiac arrhythmia management, and integrative recovery protocols at St. Jude Medical Center.'
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    thresholdAlerts: true,
    newReports: true,
    taskCompletions: true,
    dailyHealthLogs: false,
    appointmentReminders: true,
    pagerEmergencyEscalation: true
  });
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    authFetch('/api/doctor/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile(prev => ({
            ...prev,
            name: data.profile.name || prev.name,
            email: data.profile.email || prev.email,
            specialization: data.profile.specialization || prev.specialization,
            hospital_name: data.profile.hospital_name || prev.hospital_name,
            license_number: data.profile.license_number || prev.license_number,
            phone: data.profile.phone || prev.phone,
            office: data.profile.office || prev.office,
            bio: data.profile.bio || prev.bio
          }));
        }
      })
      .catch(err => console.error('Failed to load profile:', err));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileSuccess(false);

      const res = await authFetch('/api/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          specialization: profile.specialization,
          license_number: profile.license_number
        })
      });

      if (res.ok) {
        setProfileSuccess(true);
        if (refreshUser) refreshUser();
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await authFetch('/api/doctor/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(data.error || 'Failed to update password');
      }
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveNotifPrefs = () => {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Doctor Preferences & Credentials</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Physician Profile & Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage clinical credentials, contact numbers, security passwords, and real-time patient notification rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Doctor Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <span>Clinical Profile Information</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Doctor Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical License Number</label>
                  <input
                    type="text"
                    value={profile.license_number}
                    onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Specialization</label>
                  <input
                    type="text"
                    value={profile.specialization}
                    onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Hospital Institution</label>
                  <input
                    type="text"
                    value={profile.hospital_name}
                    disabled
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Direct Contact Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Direct Phone</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Office Location</label>
                <input
                  type="text"
                  value={profile.office}
                  onChange={(e) => setProfile({ ...profile, office: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Professional Bio & Clinical Focus</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {profileSuccess && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Profile saved successfully</span>
                  </div>
                )}
                {!profileSuccess && <div />}

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Password & Security Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <span>Change Account Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="Enter current account password"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Notification Preferences */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <span>Notification Rules</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure real-time clinical notification triggers and pager escalations.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Critical Threshold Alerts</div>
                  <div className="text-[11px] text-slate-500">Instant notification when a patient logs high stress or low sleep spikes.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.thresholdAlerts}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, thresholdAlerts: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Diagnostic Report Uploads</div>
                  <div className="text-[11px] text-slate-500">Notify when labs upload ECG, Holter, or blood panel summaries.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.newReports}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, newReports: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Patient Care Task Completions</div>
                  <div className="text-[11px] text-slate-500">Alerts when patients finish prescribed rehab walking or fasting tasks.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.taskCompletions}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, taskCompletions: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Daily Health Journal Entries</div>
                  <div className="text-[11px] text-slate-500">Receive an evening alert when a patient logs daily vitals.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.dailyHealthLogs}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, dailyHealthLogs: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Appointment Reminders</div>
                  <div className="text-[11px] text-slate-500">Daily 07:00 AM summary of scheduled clinic consultations.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.appointmentReminders}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, appointmentReminders: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">SMS / Pager Emergency Relay</div>
                  <div className="text-[11px] text-slate-500">Escalate urgent cardiac alerts to clinic on-call pager.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.pagerEmergencyEscalation}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, pagerEmergencyEscalation: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {prefsSaved && (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Preferences saved</span>
                </div>
              )}
              {!prefsSaved && <div />}

              <button
                type="button"
                onClick={handleSaveNotifPrefs}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
