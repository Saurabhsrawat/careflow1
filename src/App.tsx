import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { PlaceholderDashboard } from './components/dashboard/PlaceholderDashboard';
import { Activity } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg animate-pulse mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <div className="text-sm font-semibold text-slate-700">Loading CareFlow...</div>
        <div className="text-xs text-slate-400 mt-1">Initializing SQLite connection & session</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header onOpenAuth={handleOpenAuth} />

      <main className="flex-1">
        {user ? (
          <PlaceholderDashboard />
        ) : (
          <LandingPage onOpenAuth={handleOpenAuth} />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>CareFlow Healthcare Journey Platform — Phase 1 Foundation</div>
          <div className="text-slate-400">Step-by-step verified build</div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
