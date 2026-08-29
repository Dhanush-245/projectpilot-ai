import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Compass, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  BrainCircuit, 
  CheckCircle2, 
  ArrowRight,
  UserCheck
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signInGoogle, signInGuest, loading, error, clearError } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-[#D1D5DB] flex flex-col justify-between selection:bg-neutral-800 selection:text-white">
      {/* Header */}
      <header className="border-b border-[#222222] bg-[#080808]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white font-bold shadow-sm">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-serif">
                ProjectPilot <span className="text-xs px-2 py-0.5 rounded-md bg-[#181818] text-[#999999] border border-[#2a2a2a] font-mono font-semibold">AI</span>
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-[#888888] border border-[#222222] px-3 py-1.5 rounded-full bg-[#101010] hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud Run & Gemini Ready
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
        {/* Left Column: Product Value */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#2a2a2a] text-[#D1D5DB] text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            Google Cloud Run AI Challenge Original Workspace
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.15] font-serif">
            Turn ideas into <span className="text-[#D1D5DB] italic">intelligent, actionable</span> projects.
          </h1>

          <p className="text-base sm:text-lg text-[#999999] max-w-2xl leading-relaxed">
            ProjectPilot AI is a secure intelligence workspace for builders. Transform unstructured concepts into structured architecture, actionable roadmaps, persistent project memory, and grounded AI co-pilot insights.
          </p>

          {/* Core Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#222222] hover:border-[#333333] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#181818] text-white border border-[#2a2a2a]">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white font-serif text-base">Idea to Architecture</h3>
              </div>
              <p className="text-sm text-[#888888] leading-relaxed">
                Automated requirements, security risk analysis, and tech stack recommendations powered by Gemini.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#222222] hover:border-[#333333] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#181818] text-white border border-[#2a2a2a]">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white font-serif text-base">Phase-Based Roadmap</h3>
              </div>
              <p className="text-sm text-[#888888] leading-relaxed">
                Structured execution roadmap with real-time task progress metrics and smart milestone planning.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#222222] hover:border-[#333333] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#181818] text-white border border-[#2a2a2a]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white font-serif text-base">Project Memory & ADRs</h3>
              </div>
              <p className="text-sm text-[#888888] leading-relaxed">
                Persistent architecture decision records, technical experiments, and markdown notes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d0d0d] border border-[#222222] hover:border-[#333333] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#181818] text-white border border-[#2a2a2a]">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white font-serif text-base">Health & Risk Scanner</h3>
              </div>
              <p className="text-sm text-[#888888] leading-relaxed">
                Multi-vector AI diagnostics assessing progress velocity, security hygiene, and Cloud Run deployment readiness.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Secure Authentication Card */}
        <div className="lg:col-span-5">
          <div className="w-full bg-[#0c0c0c] border border-[#222222] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="mb-6">
              <h2 className="text-2xl font-normal text-white tracking-tight font-serif">Access Your Workspace</h2>
              <p className="text-sm text-[#888888] mt-1 leading-relaxed">
                Authenticate to load your private projects securely with Firebase isolation.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start justify-between gap-3 animate-in fade-in">
                <span>{error}</span>
                <button 
                  onClick={clearError}
                  className="text-rose-400 hover:text-rose-200 text-xs font-semibold uppercase tracking-wider"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Google Sign In */}
              <button
                type="button"
                onClick={signInGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
                <ArrowRight className="w-4 h-4 ml-auto text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#222222] w-full" />
                <span className="bg-[#0c0c0c] px-3 text-xs font-mono text-[#666666] uppercase">or</span>
              </div>

              {/* Instant Guest / Reviewer Sign In */}
              <button
                type="button"
                onClick={signInGuest}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#D1D5DB] hover:text-white font-medium text-sm border border-[#333333] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <UserCheck className="w-5 h-5 text-white" />
                <span>Instant Developer Preview</span>
                <ArrowRight className="w-4 h-4 ml-auto text-[#666666] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Security checklist */}
            <div className="mt-8 pt-6 border-t border-[#222222] space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-[#888888]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-Trust Firestore owner-isolated data isolation</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#888888]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Server-side Gemini model fallback protection</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#888888]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Secure secret hygiene & token authorization</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222222] bg-[#080808] px-6 py-4 text-center text-xs text-[#666666] font-mono">
        ProjectPilot AI &bull; Built for the Google Cloud Run AI Challenge &bull; Powered by Gemini
      </footer>
    </div>
  );
};
