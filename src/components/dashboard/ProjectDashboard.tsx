import React, { useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  BrainCircuit, 
  Database, 
  Activity, 
  Plus, 
  KanbanSquare,
  FileText,
  ShieldAlert,
  ChevronRight,
  FileDown
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';
import { normalizeProjectAnalysis } from '../../utils/normalizeAnalysis';

interface ProjectDashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  onOpenExport?: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  onNavigate,
  onOpenNewTask,
  onOpenNewProject,
  onOpenExport
}) => {
  const { 
    activeProject, 
    tasks, 
    notes, 
    decisions, 
    progressStats, 
    modifyTask,
    runHealthReview,
    isEvaluatingHealth
  } = useProject();

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
      <div className="p-8 max-w-4xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#222222] text-[#D1D5DB] flex items-center justify-center mx-auto mb-4">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-normal text-white tracking-tight font-serif">No Project Selected</h2>
        <p className="text-sm text-[#888888] max-w-md mx-auto mt-2 leading-relaxed">
          Create your first project to unlock AI architecture analysis, phase-based roadmaps, and grounded Gemini co-pilot memory.
        </p>
        <button
          onClick={onOpenNewProject}
          className="mt-6 px-5 py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create First Project</span>
        </button>
      </div>
    );
  }

  const highPriorityTasks = tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED').slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Top Banner: Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] shadow-xl relative overflow-hidden">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">
              {activeProject.currentPhase || 'Phase 1: Architecture'}
            </span>
            {activeProject.deadline && (
              <span className="text-xs font-mono text-[#888888] bg-[#141414] border border-[#222222] px-2.5 py-1 rounded-md">
                Target: {activeProject.deadline}
              </span>
            )}
            {activeProject.analysis && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#161f18] text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-mono">
                <BrainCircuit className="w-3.5 h-3.5" />
                AI Analyzed
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif">
            {activeProject.name}
          </h1>
          <p className="text-sm text-[#999999] leading-relaxed">
            {activeProject.shortDescription}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-[#D1D5DB] hover:text-white text-xs font-semibold border border-[#2a2a2a] hover:border-[#383838] transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>Export .MD</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('assistant')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Co-Pilot</span>
          </button>
          <button
            onClick={onOpenNewTask}
            className="px-3.5 py-2 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#D1D5DB] hover:text-white text-xs font-semibold border border-[#333333] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress Metric */}
        <div className="p-5 rounded-xl bg-[#0e0e0e] border border-[#222222] hover:border-[#333333] transition-all">
          <div className="flex items-center justify-between text-xs text-[#888888] font-medium">
            <span>Overall Progress</span>
            <span className="p-1.5 rounded-lg bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a]">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {progressStats.percentage}%
          </div>
          <div className="w-full h-2 bg-[#1f1f1f] rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progressStats.percentage}%` }}
            />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="p-5 rounded-xl bg-[#0e0e0e] border border-[#222222] hover:border-[#333333] transition-all">
          <div className="flex items-center justify-between text-xs text-[#888888] font-medium">
            <span>Completed Tasks</span>
            <span className="p-1.5 rounded-lg bg-[#141d16] text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {progressStats.completed} <span className="text-xs text-[#666666] font-normal">/ {progressStats.total}</span>
          </div>
          <div className="text-xs text-[#888888] mt-2">
            {progressStats.total > 0 ? `${progressStats.total - progressStats.completed} remaining` : 'No tasks created yet'}
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="p-5 rounded-xl bg-[#0e0e0e] border border-[#222222] hover:border-[#333333] transition-all">
          <div className="flex items-center justify-between text-xs text-[#888888] font-medium">
            <span>In Progress</span>
            <span className="p-1.5 rounded-lg bg-[#1f1b14] text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
            {progressStats.inProgress}
          </div>
          <div className="text-xs text-[#888888] mt-2">
            {progressStats.todo} tasks queued in Todo
          </div>
        </div>

        {/* Project Health Score */}
        <div 
          onClick={() => onNavigate('health')}
          className="p-5 rounded-xl bg-[#0e0e0e] border border-[#222222] hover:border-[#444444] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-[#888888] font-medium">
            <span>Health & Diagnostics</span>
            <span className="p-1.5 rounded-lg bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2 flex items-center gap-2">
            <span>{activeProject.healthReview?.score ?? '--'}</span>
            <span className="text-xs font-sans text-[#888888]">/ 100</span>
          </div>
          <div className="text-xs text-[#D1D5DB] flex items-center gap-1 mt-2 group-hover:text-white">
            <span>{activeProject.healthReview ? activeProject.healthReview.overallStatus : 'Run Live Diagnostic'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Action Items & Project Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: High Priority Action Items */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2 font-serif">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>High-Priority Action Items</span>
            </h2>
            <button
              onClick={() => onNavigate('roadmap')}
              className="text-xs font-medium text-[#999999] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {highPriorityTasks.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#0e0e0e] border border-[#222222] text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-medium text-[#D1D5DB]">No high priority blockers pending!</p>
                <p className="text-[11px] text-[#666666] mt-1">All critical path tasks are up to date or completed.</p>
              </div>
            ) : (
              highPriorityTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] hover:border-[#333333] transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                        HIGH PRIORITY
                      </span>
                      <span className="text-[10px] text-[#888888] bg-[#181818] border border-[#2a2a2a] px-2 py-0.5 rounded font-mono">
                        {task.phase}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white font-serif">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-[#888888] line-clamp-2">{task.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => modifyTask(task.id, { status: 'COMPLETED' })}
                    title="Mark task as complete"
                    className="p-2 rounded-lg bg-[#181818] hover:bg-emerald-950/40 hover:text-emerald-400 text-[#888888] border border-[#2a2a2a] transition-all cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* AI Intelligence Snapshot */}
          {normalizedAnalysis && (
            <div className="p-5 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <BrainCircuit className="w-4 h-4 text-white" />
                  <span className="font-serif">AI Architecture & Next Actions</span>
                </div>
                <button
                  onClick={() => onNavigate('intelligence')}
                  className="text-xs font-medium text-[#999999] hover:text-white cursor-pointer"
                >
                  Full Architecture
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-[#D1D5DB] font-semibold">Suggested Immediate Actions:</div>
                <ul className="space-y-1.5">
                  {(normalizedAnalysis.suggestedFirstActions || []).slice(0, 3).map((act, i) => (
                    <li key={i} className="text-xs text-[#888888] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Project Memory (ADRs & Notes) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent ADRs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2 font-serif">
                <Database className="w-4 h-4 text-[#D1D5DB]" />
                <span>Architecture Decisions</span>
              </h2>
              <button
                onClick={() => onNavigate('memory')}
                className="text-xs font-medium text-[#999999] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>All ADRs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {decisions.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] text-xs text-[#666666] text-center">
                  No architecture decisions recorded yet.
                </div>
              ) : (
                decisions.slice(0, 3).map((d) => (
                  <div key={d.id} className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#222222] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate max-w-[200px] font-serif">{d.decision}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">
                        {d.status}
                      </span>
                    </div>
                    <p className="text-[#888888] line-clamp-2 text-[11px] leading-relaxed">{d.reasoning}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2 font-serif">
                <FileText className="w-4 h-4 text-[#D1D5DB]" />
                <span>Project Notes</span>
              </h2>
              <button
                onClick={() => onNavigate('memory')}
                className="text-xs font-medium text-[#999999] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>All Notes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {notes.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] text-xs text-[#666666] text-center">
                  No research or meeting notes yet.
                </div>
              ) : (
                notes.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#222222] text-xs space-y-1">
                    <h3 className="font-semibold text-white truncate font-serif">{n.title}</h3>
                    <p className="text-[#888888] line-clamp-2 text-[11px] leading-relaxed">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
