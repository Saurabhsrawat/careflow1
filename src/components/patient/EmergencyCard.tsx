import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  Heart, 
  Pill, 
  Phone, 
  ShieldAlert, 
  Printer, 
  Share2, 
  User, 
  Calendar, 
  Building2, 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  Check,
  Copy,
  Droplet
} from 'lucide-react';
import { EmergencyCardData } from '../../types';

interface EmergencyCardProps {
  onNavigateTab?: (tab: any) => void;
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<EmergencyCardData | null>(null);
  const [copied, setCopied] = useState(false);

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token = localStorage.getItem('careflow_token');
    const headers: Record<string, string> = { ...extra };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchEmergencyCard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patient/emergency-card', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCardData(data.emergencyCard);
      }
    } catch (err) {
      console.error('Failed to load emergency card:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyCard();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!cardData) return;
    const text = `
EMERGENCY MEDICAL CARD — CAREFLOW
Patient: ${cardData.patientName} (DOB: ${cardData.dateOfBirth}, Age: ${cardData.age})
Blood Group: ${cardData.bloodGroup}
Allergies: ${cardData.allergies.map(a => `${a.allergen} (${a.severity}: ${a.reaction})`).join('; ')}
Conditions: ${cardData.currentConditions.map(c => c.condition).join('; ')}
Medications: ${cardData.activeMedications.map(m => `${m.name} ${m.dosage} (${m.frequency})`).join('; ')}
Primary Contact: ${cardData.emergencyContacts[0]?.name} (${cardData.emergencyContacts[0]?.relationship}) - ${cardData.emergencyContacts[0]?.phone}
Attending Doctor: ${cardData.attendingDoctor.name} (${cardData.attendingDoctor.hospital}) - ${cardData.attendingDoctor.phone}
Hospital 24/7 ER: ${cardData.hospitalEmergencyPhone}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading || !cardData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-10 h-10 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Generating emergency clinical card...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
            <h1 className="text-base font-black text-slate-900">Digital Emergency Medical Card</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimized for immediate clinical triage by first responders, paramedics, and emergency department personnel.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleCopySummary}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* THE HIGH-VISIBILITY EMERGENCY CARD ITSELF */}
      <div className="bg-white rounded-3xl border-3 border-rose-600 shadow-xl overflow-hidden print:border-2 print:shadow-none">
        {/* Top Emergency Red Bar */}
        <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-rose-100">
                CRITICAL MEDICAL INFORMATION
              </div>
              <div className="text-lg font-black tracking-tight">
                PARAMEDIC / EMERGENCY ROOM CARD
              </div>
            </div>
          </div>

          <div className="bg-white text-rose-700 px-4 py-1.5 rounded-2xl shadow-sm flex items-center gap-2">
            <Droplet className="w-5 h-5 fill-rose-600 text-rose-600" />
            <div className="text-left">
              <div className="text-[9px] font-black uppercase tracking-wider text-rose-500">Blood Group</div>
              <div className="text-xl font-black leading-none">{cardData.bloodGroup}</div>
            </div>
          </div>
        </div>

        {/* Patient Key Identity Strip */}
        <div className="bg-slate-900 text-white p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-800">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient Full Name</div>
            <div className="text-xl font-black text-white mt-0.5">{cardData.patientName}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth / Age</div>
            <div className="text-base font-bold text-white mt-0.5">{cardData.dateOfBirth} ({cardData.age} yrs)</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct Patient Phone</div>
            <div className="text-base font-bold text-white mt-0.5">{cardData.contact}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Advance Directive / Code</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{cardData.advanceDirective}</div>
          </div>
        </div>

        {/* Card Body Grid */}
        <div className="p-6 md:p-8 space-y-6 bg-slate-50/50">
          {/* 1. CRITICAL ALLERGIES (High Contrast Alert Box) */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-900">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <h2 className="text-sm font-black uppercase tracking-wider">
                Known Drug Allergies & Anaphylaxis Risks
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cardData.allergies.map((alg, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-rose-700">{alg.allergen}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-600 text-white uppercase">
                      {alg.severity}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">
                    Reaction: <span className="font-normal text-slate-600">{alg.reaction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. CURRENT CONDITIONS & ACTIVE MEDICATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Conditions */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
                <Heart className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black uppercase tracking-wider">Active Clinical Conditions</h3>
              </div>

              <div className="space-y-2.5">
                {cardData.currentConditions.map((cond, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-black text-slate-900">{cond.condition}</div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                      <span>Status: <strong className="text-slate-700">{cond.status}</strong></span>
                      <span>Dx: {cond.diagnosedDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Medications */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
                <Pill className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-black uppercase tracking-wider">Current Prescribed Medications</h3>
              </div>

              <div className="space-y-2.5">
                {cardData.activeMedications.map((med, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-teal-50/40 border border-teal-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{med.name}</span>
                      <span className="text-xs font-extrabold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                        {med.dosage}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      Frequency: <strong className="text-slate-800">{med.frequency}</strong>
                    </div>
                    {med.instructions && (
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic">
                        {med.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. EMERGENCY CONTACTS & ATTENDING CLINICIAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contacts */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-wider">Emergency Contacts</h3>
              </div>

              <div className="space-y-2.5">
                {cardData.emergencyContacts.map((cnt, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${cnt.isPrimary ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-slate-900">{cnt.name}</div>
                        <div className="text-[11px] font-semibold text-slate-600">{cnt.relationship}</div>
                      </div>
                      {cnt.isPrimary && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white uppercase">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{cnt.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attending Hospital & Physician */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider">Attending Clinic & 24/7 ER Line</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                  <div className="text-[10px] font-extrabold uppercase text-blue-800">Attending Cardiologist</div>
                  <div className="text-xs font-black text-slate-900 mt-0.5">{cardData.attendingDoctor.name}</div>
                  <div className="text-[11px] text-slate-600">{cardData.attendingDoctor.specialization}</div>
                  <div className="text-[11px] font-bold text-blue-900 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-600" />
                    <span>{cardData.attendingDoctor.phone}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Hospital 24/7 Emergency Line</div>
                    <div className="text-xs font-bold text-white mt-0.5">{cardData.attendingDoctor.hospital}</div>
                  </div>
                  <div className="text-xs font-black text-rose-400">{cardData.hospitalEmergencyPhone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Verification Strip */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Verified CareFlow Medical Record ID: <strong>PAT-ALEX-RIVERA</strong></span>
          </div>
          <div>Last Synchronized: {cardData.lastUpdated}</div>
        </div>
      </div>
    </div>
  );
};
