import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  FileText, 
  Heart, 
  Info,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface DoctorAiAssistantProps {
  onSelectPatient?: (patientId: string) => void;
}

export const DoctorAiAssistant: React.FC<DoctorAiAssistantProps> = ({ onSelectPatient }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: string; isPlaceholderNotice?: boolean }>>([
    {
      role: 'assistant',
      text: 'Good day, Dr. Chen. I am your CareFlow Clinical Copilot shell. Once generative model synthesis is enabled in an upcoming phase, I will assist you with cross-patient trend summarization, risk flag triaging, diagnostic report interpretation, and consultation note drafting.',
      timestamp: '08:00 AM'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedPrompts = [
    {
      title: 'Summarize Active Patient Alerts',
      desc: 'Review high-severity autonomic stress & adherence flags across your 3 cardiology patients.',
      query: 'Summarize all high-priority alerts across Dr. Chen’s patients (Alex Rivera, Maya Lin, Marcus Thorne).'
    },
    {
      title: 'Alex Rivera Medication Adherence',
      desc: 'Analyze 14-day Metoprolol 25mg adherence (88%) versus sleep deficit spikes.',
      query: 'Analyze Alex Rivera’s 14-day daily vitals, sleep quality trends, and medication adherence trajectory.'
    },
    {
      title: 'Maya Lin Diagnostic Triage Status',
      desc: 'Check ECG findings and stress echo preparation ahead of today’s hospital workup.',
      query: 'Review Maya Lin’s diagnostic ECG report and confirm pre-stress echo fasting completion.'
    },
    {
      title: 'Marcus Thorne Rehab Milestones',
      desc: 'Evaluate 10-day post-PCI walking tolerance and 95%+ medication compliance.',
      query: 'Provide a progress summary on Marcus Thorne’s Phase II cardiac rehab and vital stability.'
    }
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim()) return;

    const userMsg = {
      role: 'user' as const,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botResponse = {
        role: 'assistant' as const,
        text: `AI Assistant Roadmap Preview: You asked: "${text.trim()}". In the upcoming phase, this assistant will synthesize live EHR data, holistic 14-day vital records, diagnostic PDFs, and clinical notes to generate actionable physician briefs. Real generative model reasoning will be wired in a subsequent update. In the meantime, you can explore live deterministic analytics in the Health Analytics and Consultations tabs.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isPlaceholderNotice: true
      };
      setMessages(prev => [...prev, botResponse]);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Top Phase Notice Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-2xl border border-teal-800/60 p-6 text-white shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Doctor Clinical AI Copilot &bull; UI Shell Preview</span>
            </div>
            <h1 className="text-2xl font-bold text-white">AI Clinical Assistant</h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Designed to help attending cardiologists query patient histories, draft consultation briefs, and detect subtle symptom correlation trends. Generative AI integration is scheduled for an upcoming phase — no live external LLM calls are currently made.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Physician Authority</div>
              <div className="text-[11px] text-slate-400">Deterministic EHR Grounding</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Prompts Grid */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Suggested Clinical Queries</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.query)}
              className="bg-white rounded-xl border border-slate-200 hover:border-teal-400 hover:shadow-xs p-4 text-left transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center justify-between">
                  <span>{p.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </h4>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] font-semibold text-teal-700">
                <span>Prompt preview</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Chat Box Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dr. Sarah Chen &bull; Clinical Copilot</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Shell Session &bull; St. Jude Medical Center</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear Chat</span>
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-teal-600 text-white shadow-2xs rounded-tr-xs'
                  : msg.isPlaceholderNotice
                    ? 'bg-slate-50 border border-teal-200/80 text-slate-800 shadow-2xs rounded-tl-xs'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs'
              }`}>
                {msg.isPlaceholderNotice && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 mb-2 pb-1.5 border-b border-teal-100">
                    <Info className="w-3.5 h-3.5 text-teal-600" />
                    <span>AI Assistant Roadmap Notice</span>
                  </div>
                )}
                <p>{msg.text}</p>
                <div className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-teal-100' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-xs">
                  SC
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic pl-11">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span>Synthesizing assistant response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about patient vitals, active alerts, holter results, or clinical guidelines..."
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[11px] text-slate-400 mt-2 text-center">
            UI Shell Preview &bull; Real model calls disabled during Phase 3 &bull; Grounded on St. Jude EHR records
          </div>
        </div>
      </div>
    </div>
  );
};
