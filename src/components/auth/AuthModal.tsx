import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Hospital, UserRole } from '../../types';
import { X, User, Stethoscope, ShieldCheck, Lock, Mail, Building2, Phone, AlertCircle, Calendar, Heart, CheckCircle2, HeartHandshake } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const { login, register, error, clearError, loading, quickLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [hospitalId, setHospitalId] = useState('');

  // Patient fields
  const [dob, setDob] = useState('1990-05-15');
  const [contact, setContact] = useState('+1 (555) 432-1098');
  const [emergencyContact, setEmergencyContact] = useState('Sarah Rivera (+1 555-888-9999)');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Doctor fields
  const [specialization, setSpecialization] = useState('Cardiology & Internal Medicine');
  const [licenseNumber, setLicenseNumber] = useState('MD-CA-99214');

  // Available hospitals
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    setMode(initialMode);
    clearError();
  }, [initialMode, isOpen]);

  useEffect(() => {
    // Fetch hospitals list from SQLite
    fetch('/api/hospitals')
      .then((res) => res.json())
      .then((data) => {
        if (data.hospitals && data.hospitals.length > 0) {
          setHospitals(data.hospitals);
          if (!hospitalId) {
            setHospitalId(data.hospitals[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load hospitals:', err));
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      const ok = await login(email, password);
      if (ok) onClose();
    } else {
      const payload: any = {
        name,
        email,
        password,
        role,
        hospital_id: hospitalId || undefined,
      };

      if (role === 'patient') {
        payload.date_of_birth = dob;
        payload.contact = contact;
        payload.emergency_contact = emergencyContact;
        payload.blood_group = bloodGroup;
      } else if (role === 'doctor') {
        payload.specialization = specialization;
        payload.license_number = licenseNumber;
      }

      const ok = await register(payload);
      if (ok) onClose();
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    quickLogin(demoEmail).then((ok) => {
      if (ok) onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'login' ? 'Sign in to CareFlow' : 'Create your CareFlow Account'}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === 'login' ? 'Access your Healthcare Journey or Clinical Portal' : 'Select your role and begin care tracking'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 mx-6 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              clearError();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              clearError();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'register' && (
            <>
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      role === 'patient'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <User className={`w-4 h-4 mb-1 ${role === 'patient' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Patient</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('doctor')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      role === 'doctor'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Stethoscope className={`w-4 h-4 mb-1 ${role === 'doctor' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Doctor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('hospital_admin')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      role === 'hospital_admin'
                        ? 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 mb-1 ${role === 'hospital_admin' ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('caregiver')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      role === 'caregiver'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <HeartHandshake className={`w-4 h-4 mb-1 ${role === 'caregiver' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>Caregiver</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={role === 'doctor' ? 'Dr. Jane Doe' : 'Jane Doe'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder={mode === 'login' ? 'e.g. alex.rivera@example.com' : 'user@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Registration Role-Specific Details */}
          {mode === 'register' && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              {/* Hospital Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Affiliated Hospital {role !== 'patient' && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    required={role !== 'patient'}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 bg-white"
                  >
                    <option value="">{role === 'patient' ? '-- Select Hospital (Optional) --' : '-- Select Hospital --'}</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.address})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient Fields */}
              {role === 'patient' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 bg-white"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="Name & Contact (e.g. Maria Doe +1 555-123-4567)"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                    />
                  </div>
                </div>
              )}

              {/* Doctor Fields */}
              {role === 'doctor' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specialization <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Cardiology, Neurology, Pediatrics"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Medical License ID</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. MD-98234-A"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors mt-2"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Complete Registration'}
          </button>
        </form>

        {/* 1-Click Demo Login Shortcuts */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center justify-between">
            <span>Quick 1-Click Demo Logins (Phase 1 Ready)</span>
            <span className="text-[10px] text-slate-400">pwd: password123</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('alex.rivera@example.com')}
              className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-medium text-left flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <div className="font-semibold truncate">Alex Rivera</div>
                <div className="text-[10px] text-emerald-600">Patient</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('dr.chen@stjude.org')}
              className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-800 text-xs font-medium text-left flex items-center gap-1.5 transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="truncate">
                <div className="font-semibold truncate">Dr. S. Chen</div>
                <div className="text-[10px] text-blue-600">Doctor (Cardio)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('dr.taylor@stjude.org')}
              className="px-2.5 py-1.5 rounded-lg border border-cyan-200 bg-white hover:bg-cyan-50 text-cyan-800 text-xs font-medium text-left flex items-center gap-1.5 transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <div className="truncate">
                <div className="font-semibold truncate">Dr. R. Taylor</div>
                <div className="text-[10px] text-cyan-600">Doctor (ER)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('dr.marcus@citygen.org')}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-800 text-xs font-medium text-left flex items-center gap-1.5 transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="truncate">
                <div className="font-semibold truncate">Dr. M. Vance</div>
                <div className="text-[10px] text-indigo-600">City Gen (Neuro)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('admin@stjude.org')}
              className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-purple-800 text-xs font-medium text-left flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <div className="truncate">
                <div className="font-semibold truncate">E. Rostova</div>
                <div className="text-[10px] text-purple-600">Hospital Admin</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('caregiver@careflow.org')}
              className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-900 text-xs font-medium text-left flex items-center gap-1.5 transition-colors"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="truncate">
                <div className="font-semibold truncate">M. Rivera</div>
                <div className="text-[10px] text-amber-700">Caregiver</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
