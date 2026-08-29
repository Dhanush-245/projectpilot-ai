import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  Code2, 
  Target, 
  Database, 
  Cpu, 
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { normalizeProjectAnalysis } from '../../utils/normalizeAnalysis';

export const ProjectAnalysisView: React.FC = () => {
  const { activeProject, isAnalyzing, reAnalyzeProject } = useProject();
  const [activeTab, setActiveTab] = useState<'architecture' | 'requirements' | 'security' | 'phases'>('architecture');

  const normalizedAnalysis = useMemo(() => {
    if (!activeProject?.analysis) return null;
    return normalizeProjectAnalysis(activeProject.analysis, {
      name: activeProject.name,
      shortDescription: activeProject.shortDescription,
      problemBeingSolved: activeProject.problemBeingSolved,
      targetUsers: activeProject.targetUsers,
      techPreferences: activeProject.techPreferences,
    });
  }, [activeProject]);

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-[#888888] font-serif">
        Please select or create a project to view its AI architecture.
      </div>
    );
  }

  const analysis = normalizedAnalysis;

  const dataRequirements = analysis?.dataRequirements || [];
  const keyObjectives = analysis?.keyObjectives || [];
  const functionalRequirements = analysis?.functionalRequirements || [];
  const nonFunctionalRequirements = analysis?.nonFunctionalRequirements || [];
  const securityConsiderations = analysis?.securityConsiderations || [];
  const majorRisks = analysis?.majorRisks || [];
  const recommendedPhases = analysis?.recommendedPhases || [];
  const suggestedFirstActions = analysis?.suggestedFirstActions || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">
              AI Project Architecture
            </span>
            {analysis && (
              <span className="text-xs font-mono text-[#888888]">
                Complexity: <span className="text-white font-semibold">{analysis.estimatedComplexity || 'MEDIUM'}</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif">
            {activeProject.name} — Architecture & Plan
          </h1>
          <p className="text-xs text-[#888888] mt-1 max-w-2xl">
            AI-assisted technical specification, security risk matrix, and multi-phase roadmap designed by Gemini.
          </p>
        </div>

        <button
          onClick={() => reAnalyzeProject()}
          disabled={isAnalyzing}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Re-Architecting...' : 'Re-Analyze with Gemini'}</span>
        </button>
      </div>

      {!analysis ? (
        <div className="p-12 rounded-2xl bg-[#0e0e0e] border border-[#222222] text-center space-y-4">
          <BrainCircuit className="w-12 h-12 text-[#D1D5DB] mx-auto opacity-70" />
          <h3 className="text-lg font-normal text-white font-serif">No AI Architecture Generated Yet</h3>
          <p className="text-sm text-[#888888] max-w-md mx-auto">
            Click below to have Gemini generate functional requirements, security risk mitigations, and tech stack recommendations for this project.
          </p>
          <button
            onClick={() => reAnalyzeProject()}
            disabled={isAnalyzing}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Generate Project Plan with Gemini'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#222222] pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'architecture'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#141414]'
              }`}
            >
              System Architecture & Tech Stack
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'requirements'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#141414]'
              }`}
            >
              Objectives & Requirements
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#141414]'
              }`}
            >
              Security & Risk Matrix
            </button>
            <button
              onClick={() => setActiveTab('phases')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'phases'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#141414]'
              }`}
            >
              Phases & First Actions
            </button>
          </div>

          {/* TAB 1: System Architecture & Tech Stack */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Problem & Solution Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                    <Target className="w-4 h-4" />
                    <span>Problem Definition</span>
                  </div>
                  <p className="text-sm text-[#D1D5DB] leading-relaxed">
                    {analysis.problemDefinition || 'Problem statement to be addressed by the technical implementation.'}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Proposed Solution</span>
                  </div>
                  <p className="text-sm text-[#D1D5DB] leading-relaxed">
                    {analysis.proposedSolution || 'Architecture overview and engineering approach.'}
                  </p>
                </div>
              </div>

              {/* Suggested Tech Stack */}
              <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Code2 className="w-4 h-4 text-[#D1D5DB]" />
                  <span className="font-serif">Recommended Technology Stack</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
                    <span className="text-[11px] font-mono text-[#666666] uppercase">Frontend</span>
                    <p className="text-sm font-semibold text-white mt-1">{analysis.suggestedTechStack?.frontend || 'React + TypeScript'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
                    <span className="text-[11px] font-mono text-[#666666] uppercase">Backend & API</span>
                    <p className="text-sm font-semibold text-white mt-1">{analysis.suggestedTechStack?.backend || 'Express / Node.js'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
                    <span className="text-[11px] font-mono text-[#666666] uppercase">Database & Storage</span>
                    <p className="text-sm font-semibold text-white mt-1">{analysis.suggestedTechStack?.database || 'Cloud Firestore'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#141414] border border-[#222222]">
                    <span className="text-[11px] font-mono text-[#666666] uppercase">Hosting / Ingress</span>
                    <p className="text-sm font-semibold text-white mt-1">{analysis.suggestedTechStack?.hosting || 'Google Cloud Run'}</p>
                  </div>
                </div>

                {analysis.suggestedTechStack?.aiMl && (
                  <div className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-xs text-[#D1D5DB]">
                    <span className="font-semibold text-white">AI / ML Layer:</span> {analysis.suggestedTechStack.aiMl}
                  </div>
                )}
              </div>

              {/* Data & AI Considerations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Database className="w-4 h-4 text-[#D1D5DB]" />
                    <span className="font-serif">Data Requirements</span>
                  </div>
                  {dataRequirements.length === 0 ? (
                    <p className="text-xs text-[#888888]">No explicit data requirements specified.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-[#D1D5DB]">
                      {dataRequirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-[#D1D5DB]" />
                    <span className="font-serif">AI / ML Considerations</span>
                  </div>
                  <p className="text-xs text-[#D1D5DB] leading-relaxed">
                    {analysis.aiConsiderations || 'Ensure zero client-side API key leakage, model fallback ladder resilience, and token usage optimization.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Objectives & Requirements */}
          {activeTab === 'requirements' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Target className="w-4 h-4 text-[#D1D5DB]" />
                  <span className="font-serif">Key Project Objectives</span>
                </div>
                {keyObjectives.length === 0 ? (
                  <p className="text-xs text-[#888888]">No key objectives defined.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {keyObjectives.map((obj, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#D1D5DB] flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-serif">
                    Functional Requirements
                  </div>
                  {functionalRequirements.length === 0 ? (
                    <p className="text-xs text-[#888888]">No functional requirements defined.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-[#D1D5DB]">
                      {functionalRequirements.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-serif">
                    Non-Functional Requirements
                  </div>
                  {nonFunctionalRequirements.length === 0 ? (
                    <p className="text-xs text-[#888888]">No non-functional requirements defined.</p>
                  ) : (
                    <ul className="space-y-2 text-xs text-[#D1D5DB]">
                      {nonFunctionalRequirements.map((nf, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                          <span>{nf}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & Risk Matrix */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Security Standards */}
              <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-serif">Security & Privacy Architecture</span>
                </div>
                {securityConsiderations.length === 0 ? (
                  <p className="text-xs text-[#888888]">Standard OWASP and Cloud Run security protocols enforced.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {securityConsiderations.map((sec, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#D1D5DB] flex items-start gap-2.5">
                        <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{sec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Major Risks & Mitigations */}
              <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-serif">Technical & Operational Risk Matrix</span>
                </div>

                {majorRisks.length === 0 ? (
                  <p className="text-xs text-[#888888]">No major risks logged.</p>
                ) : (
                  <div className="space-y-3">
                    {majorRisks.map((r, i) => (
                      <div key={i} className="p-4 rounded-xl bg-[#141414] border border-[#222222] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-white font-serif">{r.risk}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            r.severity === 'HIGH' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : r.severity === 'MEDIUM'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {r.severity} RISK
                          </span>
                        </div>
                        <p className="text-xs text-[#888888]">
                          <span className="text-[#666666] font-medium">Mitigation:</span> {r.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Recommended Phases & First Actions */}
          {activeTab === 'phases' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-[#D1D5DB]" />
                  <span className="font-serif">Recommended Development Phases</span>
                </div>

                {recommendedPhases.length === 0 ? (
                  <p className="text-xs text-[#888888]">Standard 5-phase development lifecycle active.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recommendedPhases.map((phase, i) => (
                      <div key={i} className="p-4 rounded-xl bg-[#141414] border border-[#222222] flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#1e1e1e] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 border border-[#2a2a2a]">
                          {i + 1}
                        </div>
                        <span className="text-xs font-semibold text-white font-serif">{phase}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider font-serif">
                  Suggested Immediate Next Actions
                </div>
                {suggestedFirstActions.length === 0 ? (
                  <p className="text-xs text-[#888888]">Proceed with Phase 1 tasks from your roadmap.</p>
                ) : (
                  <div className="space-y-2">
                    {suggestedFirstActions.map((action, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#D1D5DB] flex items-center gap-3">
                        <ArrowRight className="w-4 h-4 text-white shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
