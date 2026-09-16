import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Calendar, 
  CheckCircle2, 
  Stethoscope, 
  Building2, 
  Plus, 
  FileCheck,
  Search,
  Filter,
  Activity,
  Heart
} from 'lucide-react';
import { MedicalReport, JourneyStage } from '../../types';
import { authFetch } from '../../utils/api';

export const MedicalReportsList: React.FC = () => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<MedicalReport | null>(null);

  // Upload Form State
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('PDF');
  const [reportStage, setReportStage] = useState<JourneyStage>('Tests');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/patient/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      if (!reportName.trim()) {
        // Strip extension for friendly default title
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setReportName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim()) return;

    try {
      setUploading(true);
      setUploadError(null);

      const fileNameToUse = selectedFileName || `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;

      const res = await authFetch('/api/patient/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName.trim(),
          type: reportType,
          journey_stage: reportStage,
          date: reportDate,
          file: fileNameToUse
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload report');
      }

      setShowUploadModal(false);
      setReportName('');
      setSelectedFileName('');
      await fetchReports();
    } catch (err: any) {
      console.error('Failed to upload report:', err);
      setUploadError(err.message || 'Error uploading report');
    } finally {
      setUploading(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.doctor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = selectedStage === 'all' || r.journey_stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            Diagnostic Documents
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Medical Reports & Lab Telemetry
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Access, view, and upload official lab telemetry, Holter monitor summaries, ECGs, and treatment protocols.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload New Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by title or doctor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['all', 'Tests', 'Test Result', 'Diagnosis', 'Treatment'].map((stg) => (
            <button
              key={stg}
              onClick={() => setSelectedStage(stg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedStage === stg
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {stg === 'all' ? 'All Stages' : stg}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((report) => (
          <div 
            key={report.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase">
                      {report.journey_stage || 'Diagnostic'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                      {report.name}
                    </h3>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {report.type}
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span>Issued Date:</span>
                  <span className="font-semibold text-slate-700">{new Date(report.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Physician:</span>
                  <span className="font-semibold text-slate-700">{report.doctor_name || 'Dr. Sarah Chen, MD'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Facility:</span>
                  <span className="font-semibold text-slate-700">{report.hospital_name || 'St. Jude Medical Center'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Verified Lab Document
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingReport(report)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Preview Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{viewingReport.name}</h3>
                  <p className="text-xs text-slate-400">Clinical telemetry preview • {viewingReport.journey_stage} Stage</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingReport(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated Medical Document Body */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 text-xs font-mono text-slate-800">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm">ST. JUDE CARDIAC DIAGNOSTIC LAB</div>
                  <div>100 Mercy Way, Suite 400 • Clinical Report #CJ-9042</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">PATIENT: Alex Rivera</div>
                  <div>DOB: 1988-04-12 (O+)</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase">1. Clinical Findings & Telemetry Summary:</div>
                <p className="leading-relaxed font-sans text-slate-700">
                  {viewingReport.name.includes('Holter') ? (
                    'Continuous 48-hour rhythm monitoring recorded mean heart rate of 78 bpm (min 54 bpm nocturnal, max 128 bpm diurnal during reported workplace stressor). Intermittent sinus tachycardia noted with isolated Premature Atrial Complexes (PACs). No prolonged ventricular arrhythmias or ischemic ST shifts detected.'
                  ) : viewingReport.name.includes('ECG') ? (
                    'Normal sinus rhythm with rate 92 bpm. Normal axis, normal PR interval (152 ms), QRS duration (88 ms), QTc (418 ms). No acute ST-T wave abnormalities. Voltage criteria within physiological limits.'
                  ) : viewingReport.name.includes('Blood') ? (
                    'Serum Potassium: 4.2 mEq/L (Normal 3.5-5.0). Serum Magnesium: 2.1 mg/dL (Normal 1.7-2.2). TSH: 1.84 uIU/mL (Normal 0.4-4.0). Fasting Lipid: Total Cholesterol 182 mg/dL. Troponin-I: <0.01 ng/mL (Negative).'
                  ) : (
                    'Patient care protocol established by Dr. Sarah Chen, MD. Prescribed Metoprolol Succinate 25mg PO Daily. Daily logging of sleep quality, hydration, and stress scores mandated on CareFlow platform.'
                  )}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold">Physician Signature:</span> Dr. Sarah Chen, MD (Cardiology & Internal Medicine)
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                  Status: Approved
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Downloading ${viewingReport.name} (Simulated PDF download).`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-xs"
              >
                <Download className="w-4 h-4" />
                Download Report (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Upload Medical Report</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24-Hr Ambulatory Blood Pressure Log"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Journey Stage</label>
                  <select
                    value={reportStage}
                    onChange={(e) => setReportStage(e.target.value as JourneyStage)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Symptoms">1. Symptoms</option>
                    <option value="Consultation">2. Consultation</option>
                    <option value="Tests">3. Tests</option>
                    <option value="Test Result">4. Test Result</option>
                    <option value="Diagnosis">5. Diagnosis</option>
                    <option value="Treatment">6. Treatment</option>
                    <option value="Recovery">7. Recovery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PDF">PDF Lab Report</option>
                    <option value="Telemetry">Telemetry ECG Waveform</option>
                    <option value="Image">Diagnostic Scan / Image</option>
                    <option value="Protocol">Prescription / Action Plan</option>
                  </select>
                </div>
              </div>

              {/* Drag & drop upload target with functional file picker */}
              <label className="block border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 hover:bg-purple-50/40 hover:border-purple-300 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  className="sr-only"
                />
                <Upload className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                {selectedFileName ? (
                  <div>
                    <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{selectedFileName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Click to choose a different file</div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-700">Click to select file or drag and drop</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">PDF, PNG, JPG, or DICOM (Auto-generates placeholder file)</div>
                  </div>
                )}
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-upload-report"
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Uploading...' : 'Save & Link to Journey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
