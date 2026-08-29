import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { TaskPriority, TaskStatus } from '../../types';
import { X, Plus, Calendar, Tag, AlertCircle } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose
}) => {
  const { activeProject, addNewTask } = useProject();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultPhases = (Array.isArray(activeProject?.analysis?.recommendedPhases) && activeProject.analysis.recommendedPhases.length > 0)
    ? activeProject.analysis.recommendedPhases
    : [
        'Phase 1: Research',
        'Phase 2: Architecture',
        'Phase 3: Core MVP',
        'Phase 4: Security & Testing',
        'Phase 5: Deployment'
      ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addNewTask({
        title: title.trim(),
        description: description.trim() || undefined,
        phase: phase.trim() || defaultPhases[0] || 'General',
        priority,
        status,
        dueDate: dueDate || undefined,
      });

      setTitle('');
      setDescription('');
      setPhase('');
      setPriority('MEDIUM');
      setStatus('TODO');
      setDueDate('');
      onClose();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(err?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#0e0e0e] border border-[#222222] rounded-2xl shadow-2xl p-6 sm:p-7 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-[#888888] hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a]">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-normal text-white tracking-tight font-serif">Create Roadmap Task</h3>
            <p className="text-xs text-[#888888]">Add an action item to {activeProject?.name || 'project'}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#1a0f0f] border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Configure Firebase Auth security rules"
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white placeholder:text-[#666666] focus:border-[#444444]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key specifications, acceptance criteria, or links..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white placeholder:text-[#666666] focus:border-[#444444] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">
                Development Phase
              </label>
              <input
                type="text"
                list="phase-suggestions"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                placeholder={defaultPhases[0] || 'Phase 1: Research'}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
              />
              <datalist id="phase-suggestions">
                {defaultPhases.map((p, i) => (
                  <option key={i} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white cursor-pointer focus:border-[#444444]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white cursor-pointer focus:border-[#444444]"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-[#D1D5DB] hover:text-white bg-[#181818] hover:bg-[#222222] border border-[#333333] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
