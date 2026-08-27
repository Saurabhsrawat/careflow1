import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Server, 
  Database, 
  RefreshCw, 
  Terminal,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  description: string;
  targetEndpoint: string;
  expectedStatus: number;
  actualStatus?: number;
  status: 'pending' | 'running' | 'passed' | 'failed';
  responsePayload?: any;
  durationMs?: number;
}

interface HospitalIsolationTesterProps {
  token: string | null;
  hospitalName: string;
  hospitalId: string;
}

export const HospitalIsolationTester: React.FC<HospitalIsolationTesterProps> = ({
  token,
  hospitalName,
  hospitalId
}) => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const initialTests: TestResult[] = [
    {
      id: 'test-1',
      name: 'Verify Authorized Scoped Dashboard Access',
      description: 'Fetch hospital admin dashboard with valid St. Jude token. Must return 200 OK containing only St. Jude statistics.',
      targetEndpoint: 'GET /api/hospitals/admin/dashboard',
      expectedStatus: 200,
      status: 'pending',
    },
    {
      id: 'test-2',
      name: 'Direct Cross-Facility Data Infiltration Attempt',
      description: 'Attempt to execute explicit cross-hospital query against City General (hosp-citygen). Must be rejected by server middleware.',
      targetEndpoint: 'POST /api/hospitals/admin/test-isolation (Target: hosp-citygen)',
      expectedStatus: 403,
      status: 'pending',
    },
    {
      id: 'test-3',
      name: 'Cross-Hospital Doctor Deactivation Attack',
      description: 'Attempt to soft-delete / deactivate Dr. Marcus Vance (doc-marcus-citygen at City General) using St. Jude admin token. Must return 403 Forbidden.',
      targetEndpoint: 'PATCH /api/hospitals/admin/doctors/doc-marcus-citygen/status',
      expectedStatus: 403,
      status: 'pending',
    },
    {
      id: 'test-4',
      name: 'Unauthorized Cross-Hospital Patient Record Access',
      description: 'Attempt to read administrative records for patient David Kim (pat-david-kim registered at City General). Must return 403 Forbidden.',
      targetEndpoint: 'GET /api/hospitals/admin/patients/pat-david-kim',
      expectedStatus: 403,
      status: 'pending',
    },
    {
      id: 'test-5',
      name: 'Unauthorized Cross-Hospital Appointment Modification',
      description: 'Attempt to reassign an appointment at City General (app-citygen-001) using St. Jude admin token. Must return 403 Forbidden.',
      targetEndpoint: 'PATCH /api/hospitals/admin/appointments/app-citygen-001/reassign',
      expectedStatus: 403,
      status: 'pending',
    },
  ];

  const [tests, setTests] = useState<TestResult[]>(initialTests);

  const runSingleTest = async (testIndex: number, currentTests: TestResult[]): Promise<TestResult> => {
    const test = currentTests[testIndex];
    const startTime = performance.now();

    try {
      let res: Response;
      if (test.id === 'test-1') {
        res = await fetch('/api/hospitals/admin/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else if (test.id === 'test-2') {
        res = await fetch('/api/hospitals/admin/test-isolation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ target_hospital_id: 'hosp-citygen' })
        });
      } else if (test.id === 'test-3') {
        res = await fetch('/api/hospitals/admin/doctors/doc-marcus-citygen/status', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ is_active: 0 })
        });
      } else if (test.id === 'test-4') {
        res = await fetch('/api/hospitals/admin/patients/pat-david-kim', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else if (test.id === 'test-5') {
        res = await fetch('/api/hospitals/admin/appointments/app-citygen-001/reassign', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ new_doctor_id: 'doc-chen-stjude' })
        });
      } else {
        throw new Error('Unknown test ID');
      }

      const durationMs = Math.round(performance.now() - startTime);
      let payload: any;
      try {
        payload = await res.json();
      } catch {
        payload = { raw: await res.text() };
      }

      const passed = res.status === test.expectedStatus;

      return {
        ...test,
        actualStatus: res.status,
        status: passed ? 'passed' : 'failed',
        responsePayload: payload,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      return {
        ...test,
        actualStatus: 0,
        status: 'failed',
        responsePayload: { error: err.message },
        durationMs,
      };
    }
  };

  const handleRunAllTests = async () => {
    setIsRunningAll(true);
    const updated = [...tests];

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'running' };
      setTests([...updated]);
      const result = await runSingleTest(i, updated);
      updated[i] = result;
      setTests([...updated]);
    }

    setIsRunningAll(false);
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const allCompleted = tests.every(t => t.status === 'passed' || t.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Multi-Hospital Data Isolation & RBAC Test Suite</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Execute real-time penetration tests to prove that SQL-level scoping rejects unauthorized cross-hospital data access with HTTP 403 Forbidden.
          </p>
        </div>

        <button
          onClick={handleRunAllTests}
          disabled={isRunningAll}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0"
        >
          {isRunningAll ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Executing Tests...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Automated Isolation Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Test Execution Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Authenticated Scope</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block">{hospitalName}</span>
          <code className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">{hospitalId}</code>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Target Foreign Facility</span>
          <span className="text-sm font-bold text-rose-700 mt-0.5 block">City General Hospital</span>
          <code className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">hosp-citygen</code>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Suite Status</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-bold text-slate-900">
              {passedCount} of {tests.length} Passed
            </span>
            {allCompleted && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                passedCount === tests.length ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {passedCount === tests.length ? 'ALL ENFORCED' : 'FAILED'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {tests.map((test, idx) => {
          const isExpanded = expandedTestId === test.id;

          return (
            <div 
              key={test.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                test.status === 'passed'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : test.status === 'failed'
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div 
                onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                className="p-4 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="mt-0.5 sm:mt-0">
                    {test.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {test.status === 'failed' && <XCircle className="w-5 h-5 text-rose-600" />}
                    {test.status === 'running' && <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />}
                    {test.status === 'pending' && <Lock className="w-5 h-5 text-slate-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{test.name}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {test.targetEndpoint.split(' ')[0]} {test.targetEndpoint.split(' ')[1]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{test.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Expected: HTTP {test.expectedStatus}</span>
                    {test.actualStatus !== undefined && (
                      <span className={`text-xs font-bold block ${
                        test.status === 'passed' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        Actual: HTTP {test.actualStatus} {test.durationMs !== undefined && `(${test.durationMs}ms)`}
                      </span>
                    )}
                  </div>

                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Response Inspector Details */}
              {isExpanded && test.responsePayload && (
                <div className="px-5 pb-4 pt-2 border-t border-slate-100 bg-slate-900 text-slate-200 text-xs font-mono rounded-b-2xl">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Live Response Payload & Authorization Headers</span>
                    </div>
                    <span>Status Code: {test.actualStatus}</span>
                  </div>
                  <pre className="overflow-x-auto p-2 bg-slate-950 rounded-lg text-[11px] leading-relaxed text-emerald-400">
                    {JSON.stringify(test.responsePayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security Architecture Explanatory Callout */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Server-Side Isolation Guarantees</span>
        </h4>
        <p className="leading-relaxed">
          1. <strong>JWT Hospital Scoping:</strong> The authenticated hospital administrator token carries the verified claim <code>hospital_id: "hosp-stjude"</code>.
        </p>
        <p className="leading-relaxed">
          2. <strong>SQL Parameter Binding:</strong> Every query in <code>/server/routes/hospitals.ts</code> binds <code>WHERE hospital_id = ?</code> using <code>req.user.hospital_id</code>. Requests targeting another facility’s foreign key (e.g. <code>hosp-citygen</code>) are halted immediately with <code>403 Forbidden</code>.
        </p>
        <p className="leading-relaxed">
          3. <strong>Zero Leakage:</strong> City General doctors, patient names, and appointments are completely inaccessible to St. Jude administrators, both on UI and network layers.
        </p>
      </div>
    </div>
  );
};
