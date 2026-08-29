import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  Circle, 
  AlertCircle, 
  Filter, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Layers, 
  Calendar,
  ChevronDown,
  X,
  FileDown
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { requestSuggestedTasks } from '../../services/geminiService';

interface RoadmapViewProps {
  onOpenNewTask: () => void;
  onOpenExport?: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ onOpenNewTask, onOpenExport }) => {
  const { 
    activeProject, 
    tasks, 
    addNewTask, 
    modifyTask, 
    removeTask, 
    progressStats 
  } = useProject();

  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Task Edit Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPhase, setEditPhase] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('MEDIUM');
  const [editStatus, setEditStatus] = useState<TaskStatus>('TODO');
  const [editDueDate, setEditDueDate] = useState('');

  // Delete Confirmation State
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // AI Task Generator State
  const [isGeneratingAiTasks, setIsGeneratingAiTasks] = useState(false);
  const [suggestedAiTasks, setSuggestedAiTasks] = useState<Array<{ title: string; description: string; priority: TaskPriority; phase: string }>>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-[#888888] font-serif">
        Please select or create a project to manage its roadmap.
      </div>
    );
  }

  // Extract distinct phases
  const distinctPhases = Array.from(new Set(tasks.map((t) => t.phase))).filter(Boolean);
  if (distinctPhases.length === 0 && Array.isArray(activeProject.analysis?.recommendedPhases)) {
    distinctPhases.push(...activeProject.analysis.recommendedPhases);
  }
  if (distinctPhases.length === 0) {
    distinctPhases.push('Phase 1: Research', 'Phase 2: Architecture', 'Phase 3: Core MVP', 'Phase 4: Testing & Security', 'Phase 5: Deployment');
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (selectedPhase !== 'ALL' && task.phase !== selectedPhase) return false;
    if (selectedStatus !== 'ALL' && task.status !== selectedStatus) return false;
    if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) return false;
    return true;
  });

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPhase(task.phase);
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.dueDate || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    await modifyTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      phase: editPhase.trim() || 'General',
      priority: editPriority,
      status: editStatus,
      dueDate: editDueDate || undefined,
    });

    setEditingTask(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTaskId) return;
    await removeTask(deletingTaskId);
    setDeletingTaskId(null);
  };

  const handleGenerateAiTasks = async () => {
    setIsGeneratingAiTasks(true);
    try {
      const suggestions = await requestSuggestedTasks({
        projectName: activeProject.name,
        phase: selectedPhase !== 'ALL' ? selectedPhase : activeProject.currentPhase,
        objective: activeProject.analysis?.keyObjectives?.[0],
        existingTasks: tasks
      });
      setSuggestedAiTasks(suggestions.map((s) => ({
        ...s,
        priority: (s.priority as TaskPriority) || 'MEDIUM'
      })));
      setShowAiModal(true);
    } catch (err) {
      console.error('Failed to generate AI task suggestions:', err);
    } finally {
      setIsGeneratingAiTasks(false);
    }
  };

  const handleAddAiTaskToRoadmap = async (taskSuggestion: { title: string; description: string; priority: TaskPriority; phase: string }) => {
    await addNewTask({
      title: taskSuggestion.title,
      description: taskSuggestion.description,
      priority: taskSuggestion.priority,
      phase: taskSuggestion.phase || distinctPhases[0] || 'General',
      status: 'TODO'
    });
    setSuggestedAiTasks((prev) => prev.filter((t) => t.title !== taskSuggestion.title));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">
              Roadmap & Tasks
            </span>
            <span className="text-xs font-mono text-[#888888]">
              {progressStats.completed}/{progressStats.total} Completed ({progressStats.percentage}%)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif">
            Execution Roadmap
          </h1>
          <p className="text-xs text-[#888888]">
            Track milestones, manage task states, and auto-suggest action items with Gemini.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-[#D1D5DB] hover:text-white text-xs font-semibold border border-[#2a2a2a] hover:border-[#383838] transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              title="Export roadmap as Markdown"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>Export Roadmap (.md)</span>
            </button>
          )}

          <button
            onClick={handleGenerateAiTasks}
            disabled={isGeneratingAiTasks}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingAiTasks ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAiTasks ? 'Suggesting...' : 'AI Suggest Tasks'}</span>
          </button>

          <button
            onClick={onOpenNewTask}
            className="px-3.5 py-2 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#D1D5DB] hover:text-white text-xs font-semibold border border-[#333333] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0e0e0e] border border-[#222222]">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#888888] font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Phase Filter */}
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#222222] text-[#D1D5DB] focus:border-[#444444] cursor-pointer text-xs"
          >
            <option value="ALL">All Phases</option>
            {distinctPhases.map((phase, i) => (
              <option key={i} value={phase}>{phase}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#222222] text-[#D1D5DB] focus:border-[#444444] cursor-pointer text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#222222] text-[#D1D5DB] focus:border-[#444444] cursor-pointer text-xs"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-lg border border-[#222222] text-xs">
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'board' ? 'bg-white text-black font-semibold shadow-xs' : 'text-[#888888] hover:text-white'
            }`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              viewMode === 'list' ? 'bg-white text-black font-semibold shadow-xs' : 'text-[#888888] hover:text-white'
            }`}
          >
            Phase List
          </button>
        </div>
      </div>

      {/* VIEW: Kanban Board Mode */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column: To Do */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-[#888888] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Circle className="w-3.5 h-3.5 text-[#666666]" />
                <span className="font-serif">To Do</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">
                {filteredTasks.filter((t) => t.status === 'TODO').length}
              </span>
            </div>

            <div className="space-y-3 min-h-[250px] p-2 rounded-2xl bg-[#0a0a0a] border border-[#222222]">
              {filteredTasks.filter((t) => t.status === 'TODO').map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={handleOpenEdit} 
                  onDelete={() => setDeletingTaskId(task.id)}
                  onStatusChange={(status) => modifyTask(task.id, { status })}
                />
              ))}
              {filteredTasks.filter((t) => t.status === 'TODO').length === 0 && (
                <div className="p-6 text-center text-xs text-[#666666]">No tasks in To Do</div>
              )}
            </div>
          </div>

          {/* Column: In Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-serif">In Progress</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#1f1b14] text-amber-300 border border-amber-500/20 font-mono">
                {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length}
              </span>
            </div>

            <div className="space-y-3 min-h-[250px] p-2 rounded-2xl bg-[#0a0a0a] border border-[#222222]">
              {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={handleOpenEdit} 
                  onDelete={() => setDeletingTaskId(task.id)}
                  onStatusChange={(status) => modifyTask(task.id, { status })}
                />
              ))}
              {filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length === 0 && (
                <div className="p-6 text-center text-xs text-[#666666]">No tasks in progress</div>
              )}
            </div>
          </div>

          {/* Column: Completed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-serif">Completed</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#141d16] text-emerald-300 border border-emerald-500/20 font-mono">
                {filteredTasks.filter((t) => t.status === 'COMPLETED').length}
              </span>
            </div>

            <div className="space-y-3 min-h-[250px] p-2 rounded-2xl bg-[#0a0a0a] border border-[#222222]">
              {filteredTasks.filter((t) => t.status === 'COMPLETED').map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={handleOpenEdit} 
                  onDelete={() => setDeletingTaskId(task.id)}
                  onStatusChange={(status) => modifyTask(task.id, { status })}
                />
              ))}
              {filteredTasks.filter((t) => t.status === 'COMPLETED').length === 0 && (
                <div className="p-6 text-center text-xs text-[#666666]">No completed tasks</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW: Phase List Mode */
        <div className="space-y-6">
          {distinctPhases.map((phase, pIdx) => {
            const phaseTasks = filteredTasks.filter((t) => t.phase === phase);
            if (phaseTasks.length === 0 && selectedPhase !== 'ALL') return null;

            return (
              <div key={pIdx} className="p-5 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                <div className="flex items-center justify-between border-b border-[#222222] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono text-xs font-bold flex items-center justify-center">
                      {pIdx + 1}
                    </span>
                    <h3 className="text-sm font-normal text-white font-serif">{phase}</h3>
                  </div>
                  <span className="text-xs text-[#888888] font-mono">
                    {phaseTasks.filter((t) => t.status === 'COMPLETED').length} / {phaseTasks.length} Completed
                  </span>
                </div>

                <div className="space-y-2">
                  {phaseTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => modifyTask(task.id, {
                            status: task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
                          })}
                          className={`p-1 rounded cursor-pointer ${
                            task.status === 'COMPLETED' ? 'text-emerald-400' : 'text-[#666666] hover:text-[#D1D5DB]'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold truncate ${
                            task.status === 'COMPLETED' ? 'line-through text-[#666666]' : 'text-white font-serif'
                          }`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <p className="text-xs text-[#888888] truncate">{task.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                          task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-[#181818] text-[#888888] border border-[#2a2a2a]'
                        }`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#222222] cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingTaskId(task.id)}
                          className="p-1.5 rounded-lg text-[#888888] hover:text-rose-400 hover:bg-[#222222] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {phaseTasks.length === 0 && (
                    <div className="p-4 text-center text-xs text-[#666666]">No tasks in this phase</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Task Suggestions Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[#0e0e0e] border border-[#222222] rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#181818] text-white border border-[#2a2a2a]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-normal text-white font-serif">AI Suggested Roadmap Tasks</h3>
                <p className="text-xs text-[#888888]">Add recommended actions directly into your project backlog.</p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {suggestedAiTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#666666]">All suggestions added!</div>
              ) : (
                suggestedAiTasks.map((st, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#141414] border border-[#222222] flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">{st.phase}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f1b14] text-amber-400 border border-amber-500/20 font-mono">{st.priority}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white font-serif">{st.title}</h4>
                      <p className="text-[11px] text-[#888888]">{st.description}</p>
                    </div>
                    <button
                      onClick={() => handleAddAiTaskToRoadmap(st)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold cursor-pointer shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#222222] flex justify-end">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl bg-[#181818] text-[#D1D5DB] hover:bg-[#222222] border border-[#333333] text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-[#222222] rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingTask(null)}
              className="absolute top-4 right-4 text-[#888888] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-normal text-white mb-4 font-serif">Edit Task</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Phase</label>
                  <input
                    type="text"
                    value={editPhase}
                    onChange={(e) => setEditPhase(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-2 rounded-xl bg-[#181818] text-[#D1D5DB] hover:bg-[#222222] border border-[#333333] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deletingTaskId)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTaskId(null)}
      />
    </div>
  );
};

// Subcomponent: Task Card for Kanban
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  return (
    <div className="p-4 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] space-y-2.5 transition-all shadow-xs group">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#181818] text-[#888888] border border-[#2a2a2a] font-mono truncate max-w-[120px]">
          {task.phase}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
          task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
          task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
          'bg-[#181818] text-[#888888] border border-[#2a2a2a]'
        }`}>
          {task.priority}
        </span>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-white leading-snug font-serif">{task.title}</h4>
        {task.description && (
          <p className="text-[11px] text-[#888888] mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
        )}
      </div>

      {task.dueDate && (
        <div className="flex items-center gap-1.5 text-[10px] text-[#666666] font-mono">
          <Calendar className="w-3 h-3" />
          <span>Due {task.dueDate}</span>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[#222222] text-xs">
        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          className="text-[10px] bg-[#1a1a1a] border border-[#262626] rounded px-1.5 py-1 text-[#D1D5DB] cursor-pointer focus:border-[#444444]"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#222222] cursor-pointer"
            title="Edit task"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-[#888888] hover:text-rose-400 hover:bg-[#222222] cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
