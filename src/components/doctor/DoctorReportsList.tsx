import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  User, 
  Calendar, 
  Building2, 
  ArrowRight,
  Plus,
  X,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface ReportItem {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_stage: string;
  doctor_id?: string;
  hospital_name?: string;
  name: string;
  type: string;
  date: string;
  file?: string;
  journey_stage?: string;
}

interface ReportsProps {
  onSelectPatient: (patientId: string) => void;
}

export const DoctorReportsList: React.FC<ReportsProps> = ({ onSelectPatient }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('all');
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/reports');
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

  const filteredReports = reports.filter(r => {
    const matchSearch = 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.journey_stage && r.journey_stage.toLowerCase().includes(search.toLowerCase()));

    const matchPatient = selectedPatientFilter === 'all' || r.patient_id === selectedPatientFilter;
    return matchSearch && matchPatient;
  });

  const uniquePatients = Array.from(new Set(reports.map(r => JSON.stringify({ id: r.patient_id, name: r.patient_name }))))
    .map((str: string) => JSON.parse(str) as { id: string; name: string });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Diagnostic Repository</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Diagnostic Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive archive of 12-lead ECGs, 48-hour Holter summaries, blood panels, and cardiac catheterization records across your patients.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          {reports.length} Total Diagnostic Files
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by title, patient name, or journey stage..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        <select
          value={selectedPatientFilter}
          onChange={(e) => setSelectedPatientFilter(e.target.value)}
          className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Patients ({reports.length})</option>
          {uniquePatients.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 mt-3">Loading diagnostic reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Reports Found</h3>
          <p className="text-xs text-slate-500 mt-1">No diagnostic reports match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {report.journey_stage || 'Diagnostic'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{report.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.date}</span>
                    <span>&bull;</span>
                    <span>{report.hospital_name || 'St. Jude Lab'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onSelectPatient(report.patient_id)}
                    className="text-xs font-semibold text-slate-700 hover:text-teal-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>{report.patient_name}</span>
                    <span className="text-[10px] text-slate-400">({report.patient_stage})</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewReport(report)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => onSelectPatient(report.patient_id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  <span>Patient Chart</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  Diagnostic Report
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{previewReport.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: {previewReport.patient_name} &bull; Uploaded {previewReport.date}
                </p>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <FileText className="w-12 h-12 text-teal-600 mx-auto" />
              <div className="text-xs font-bold text-slate-800">{previewReport.file || `${previewReport.name}.pdf`}</div>
              <div className="text-[11px] text-slate-500">St. Jude Medical Center Cardiac Laboratory Archive</div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Diagnostic Integrity</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const pid = previewReport.patient_id;
                  setPreviewReport(null);
                  onSelectPatient(pid);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Open Full Patient File
              </button>

              <button
                onClick={() => setPreviewReport(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
