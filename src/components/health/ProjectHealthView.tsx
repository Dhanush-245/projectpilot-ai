import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Plus, 
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const ProjectHealthView: React.FC = () => {
  const { 
    activeProject, 
    runHealthReview, 
    isEvaluatingHealth, 
    addNewTask, 
    tasks, 
    decisions, 
    notes 
  } = useProject();

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-[#888888] font-serif">
        Please select or create a project to view health & diagnostics.
      </div>
    );
  }

  const review = activeProject.healthReview;

  const handleAddActionToRoadmap = async (actionText: string) => {
    await addNewTask({
      title: actionText,
      description: `Recommended by Gemini Project Health Diagnostic on ${new Date().toLocaleDateString()}`,
      phase: activeProject.currentPhase || 'General',
      priority: 'HIGH',
      status: 'TODO'
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">
              AI Project Health & Diagnostic
            </span>
            {review && (
              <span className="text-xs font-mono text-[#888888]">
                Last reviewed: {new Date(review.lastEvaluated).toLocaleDateString()}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif">
            Project Health & Feasibility
          </h1>
          <p className="text-xs text-[#888888] mt-1 max-w-2xl">
            Gemini audits roadmap momentum, architecture decisions, and potential technical blockers.
          </p>
        </div>

        <button
          onClick={() => runHealthReview()}
          disabled={isEvaluatingHealth}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluatingHealth ? 'animate-spin' : ''}`} />
          <span>{isEvaluatingHealth ? 'Running Diagnostic...' : 'Run Live Diagnostic'}</span>
        </button>
      </div>

      {!review ? (
        <div className="p-12 rounded-2xl bg-[#0a0a0a] border border-[#222222] text-center space-y-4">
          <Activity className="w-12 h-12 text-[#888888] mx-auto opacity-70" />
          <h3 className="text-lg font-normal text-white font-serif">No Health Audit Recorded Yet</h3>
          <p className="text-sm text-[#888888] max-w-md mx-auto">
            Run an AI health check to evaluate your project momentum, detect unmitigated technical risks, and generate immediate corrective actions.
          </p>
          <button
            onClick={() => runHealthReview()}
            disabled={isEvaluatingHealth}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEvaluatingHealth ? 'Analyzing...' : 'Run Diagnostic with Gemini'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Score & Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#2a2a2a] text-[#D1D5DB] flex items-center justify-center shrink-0">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs text-[#888888] font-semibold uppercase tracking-wider">Health Score</span>
                <div className="text-3xl font-normal text-white font-serif mt-0.5">
                  {review.score} <span className="text-xs text-[#666666] font-sans">/ 100</span>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                review.overallStatus === 'ON_TRACK' ? 'bg-[#141d16] border border-emerald-500/20 text-emerald-400' :
                review.overallStatus === 'AT_RISK' ? 'bg-[#1f1b14] border border-amber-500/20 text-amber-400' :
                'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs text-[#888888] font-semibold uppercase tracking-wider">Overall Status</span>
                <div className="text-lg font-normal text-white font-serif mt-0.5">
                  {review.overallStatus.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Data Points Card */}
            <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-[#2a2a2a] text-[#D1D5DB] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs text-[#888888] font-semibold uppercase tracking-wider">Audited Scope</span>
                <div className="text-xs text-[#D1D5DB] font-mono mt-1 space-y-0.5">
                  <div>{tasks.length} Roadmap Tasks</div>
                  <div>{decisions.length} Architecture ADRs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Next Steps (with 1-click Add to Roadmap) */}
          <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#AAAAAA]" />
                <span>Recommended Corrective Actions</span>
              </div>
              <span className="text-[11px] text-[#888888]">Click &quot;+ Add to Roadmap&quot; to queue tasks</span>
            </div>

            <div className="space-y-2.5">
              {(review.actionableNextSteps || []).map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 text-xs text-[#D1D5DB]">
                    <ArrowRight className="w-4 h-4 text-[#888888] shrink-0" />
                    <span>{step}</span>
                  </div>

                  <button
                    onClick={() => handleAddActionToRoadmap(step)}
                    className="px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-white hover:text-black text-[#D1D5DB] border border-[#333333] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Roadmap</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Identified Risks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Execution Strengths</span>
              </div>

              <div className="space-y-2.5">
                {(review.strengths || []).map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#D1D5DB] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Identified Risks */}
            <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Identified Risks & Gaps</span>
              </div>

              <div className="space-y-2.5">
                {(review.risks || []).map((r, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#141414] border border-[#222222] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">{r.area}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        r.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        r.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-[#181818] text-[#888888] border border-[#2a2a2a]'
                      }`}>
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#888888]">{r.risk}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security & Architecture Assessment */}
          {review.securityReview && (
            <div className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#888888]" />
                <span>Security & Architecture Audit</span>
              </div>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                {review.securityReview}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
