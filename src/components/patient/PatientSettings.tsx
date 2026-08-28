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
  Heart,
  Droplet,
  AlertOctagon,
  Moon,
  Pill,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PatientSettingsProps {
  onNavigateTab?: (tab: any) => void;
}

export const PatientSettings: React.FC<PatientSettingsProps> = ({ onNavigateTab }) => {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name || 'Alex Rivera',
    email: user?.email || 'alex.rivera@example.com',
    contact: '+1 (555) 349-8821',
    emergencyContact: 'Elena Rivera (+1 555-891-2300) - Sister',
    bloodGroup: 'O+',
    dateOfBirth: '1988-04-14',
    address: '742 Evergreen Terrace, San Francisco, CA 94107',
    allergies: 'Penicillin (Mild urticaria / hives), Sulfa drugs',
    primaryDoctor: 'Dr. Sarah Chen, MD (Cardiology)',
    hospital: 'St. Jude Medical Center'
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security password state
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    medicationReminders: true,
    vitalsCheckinAlert: true,
    upcomingAppointmentAlert: true,
    doctorMessageAlert: true,
    caregiverSyncAlert: true,
    emergencyCardAccessAlert: true
  });
  const [prefsSaved, setPrefsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      if (refreshUser) refreshUser();
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (passwords.newPass !== passwords.confirm) {
      setPassError('New passwords do not match');
      return;
    }
    if (passwords.newPass.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }

    setPassSaving(true);
    setTimeout(() => {
      setPassSaving(false);
      setPassSuccess(true);
      setPasswords({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setPassSuccess(false), 3000);
    }, 600);
  };

  const handleSavePrefs = () => {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Patient Account & Preferences</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Personal Profile & Privacy Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details, emergency contact numbers, notification preferences, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              <span>Personal Information</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    value={profile.contact}
                    onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={profile.emergencyContact}
                    onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    placeholder="Name (Relationship) - Phone"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={profile.bloodGroup}
                      disabled
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold"
                    />
                    <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                      <Droplet className="w-5 h-5 fill-rose-600" />
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Known Allergies & Clinical Alerts</label>
                <input
                  type="text"
                  value={profile.allergies}
                  onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Physician</label>
                  <input
                    type="text"
                    value={profile.primaryDoctor}
                    disabled
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Care Hospital</label>
                  <input
                    type="text"
                    value={profile.hospital}
                    disabled
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {saveSuccess && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Profile preferences updated</span>
                  </div>
                )}
                {!saveSuccess && <div />}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Password Security Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <span>Update Account Password</span>
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {passError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{passSaving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Notification & Privacy Rules */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-teal-600" />
                <span>Patient Alerts & Reminders</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize how CareFlow notifies you regarding medications, daily vitals, and doctor messages.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Medication Dose Reminders</div>
                  <div className="text-[11px] text-slate-500">Morning & evening push notifications for Metoprolol and hydration.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.medicationReminders}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, medicationReminders: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Daily Health Journal Prompt</div>
                  <div className="text-[11px] text-slate-500">Evening 8:00 PM reminder to record sleep, stress, and symptom severity.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.vitalsCheckinAlert}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, vitalsCheckinAlert: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Appointment Alerts (24h & 2h)</div>
                  <div className="text-[11px] text-slate-500">Advance notices before consultations with Dr. Sarah Chen.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.upcomingAppointmentAlert}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, upcomingAppointmentAlert: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Physician Care Plan Updates</div>
                  <div className="text-[11px] text-slate-500">Alerts when your care team advances journey stages or updates notes.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.doctorMessageAlert}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, doctorMessageAlert: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <div className="text-xs font-bold text-slate-900">Caregiver Access Logs</div>
                  <div className="text-[11px] text-slate-500">Security notification whenever a caregiver views your health records.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.caregiverSyncAlert}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, caregiverSyncAlert: e.target.checked })}
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
                onClick={handleSavePrefs}
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
