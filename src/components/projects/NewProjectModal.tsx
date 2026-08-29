import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  X, 
  Sparkles, 
  FolderPlus, 
  AlertCircle, 
  Calendar, 
  Code2, 
  Users, 
  Target,
  BrainCircuit,
  Lock
} from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createNewProject, isAnalyzing } = useProject();

  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [problemBeingSolved, setProblemBeingSolved] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [techPreferences, setTechPreferences] = useState('');
  const [constraints, setConstraints] = useState('');
  const [deadline, setDeadline] = useState('');
  const [generateWithGemini, setGenerateWithGemini] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortDescription.trim()) {
      setError('Please provide both a project name and a brief description.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await createNewProject({
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        problemBeingSolved: problemBeingSolved.trim() || undefined,
        targetUsers: targetUsers.trim() || undefined,
        techPreferences: techPreferences.trim() || undefined,
        constraints: constraints.trim() || undefined,
        deadline: deadline || undefined,
      }, generateWithGemini);

      // Reset form and close
      setName('');
      setShortDescription('');
      setProblemBeingSolved('');
      setTargetUsers('');
      setTechPreferences('');
      setConstraints('');
      setDeadline('');
      onClose();
    } catch (err: any) {
      console.error('Failed to create project:', err);
      setError(err?.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0e0e0e] border border-[#222222] rounded-2xl shadow-2xl p-6 sm:p-8 relative my-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          disabled={loading || isAnalyzing}
          className="absolute top-5 right-5 text-[#888888] hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a]">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-normal text-white tracking-tight font-serif">Create New Project</h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Define your project idea and let Gemini generate a structured architecture and roadmap.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#1a0f0f] border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., CloudScale Analytics"
              disabled={loading || isAnalyzing}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] focus:border-[#444444] text-sm text-white placeholder:text-[#666666] transition-all"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1.5">
              Idea & Short Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="What are you building? Summarize the concept in a few sentences..."
              disabled={loading || isAnalyzing}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] focus:border-[#444444] text-sm text-white placeholder:text-[#666666] transition-all resize-none"
            />
          </div>

          {/* 2-Column Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-400" />
                Problem Being Solved
              </label>
              <input
                type="text"
                value={problemBeingSolved}
                onChange={(e) => setProblemBeingSolved(e.target.value)}
                placeholder="e.g., High latency in real-time stream aggregation"
                disabled={loading || isAnalyzing}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] focus:border-[#444444] text-sm text-white placeholder:text-[#666666] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#D1D5DB]" />
                Target Users
              </label>
              <input
                type="text"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="e.g., Data engineers, DevOps teams"
                disabled={loading || isAnalyzing}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] focus:border-[#444444] text-sm text-white placeholder:text-[#666666] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#D1D5DB]" />
                Tech Preferences
              </label>
              <input
                type="text"
                value={techPreferences}
                onChange={(e) => setTechPreferences(e.target.value)}
                placeholder="e.g., React, TypeScript, Cloud Run, Go"
                disabled={loading || isAnalyzing}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] focus:border-[#444444] text-sm text-white placeholder:text-[#666666] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={loading || isAnalyzing}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] focus:border-[#444444] text-sm text-white placeholder:text-[#666666] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#666666]" />
              Known Constraints (Optional)
            </label>
            <input
              type="text"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g., Budget limits, strict privacy, zero external DB dependencies"
              disabled={loading || isAnalyzing}
              className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] focus:border-[#444444] text-sm text-white placeholder:text-[#666666] transition-all"
            />
          </div>

          {/* Gemini Plan Generation Checkbox Card */}
          <div 
            onClick={() => !loading && !isAnalyzing && setGenerateWithGemini(!generateWithGemini)}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              generateWithGemini 
                ? 'bg-[#161616] border-[#333333] shadow-md' 
                : 'bg-[#101010] border-[#222222] opacity-70'
            }`}
          >
            <input
              type="checkbox"
              id="gemini-toggle"
              checked={generateWithGemini}
              onChange={(e) => setGenerateWithGemini(e.target.checked)}
              disabled={loading || isAnalyzing}
              className="mt-1 h-4 w-4 rounded border-[#333333] text-white focus:ring-0 cursor-pointer"
            />
            <div>
              <label htmlFor="gemini-toggle" className="text-xs font-semibold text-white flex items-center gap-2 cursor-pointer uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4 text-[#D1D5DB]" />
                <span>Generate Project Plan with Gemini</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#222222] text-[#D1D5DB] font-mono border border-[#333333]">Recommended</span>
              </label>
              <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                Gemini will architect functional requirements, tech stack, security risk mitigations, development phases, and an initial actionable task roadmap automatically.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || isAnalyzing}
              className="px-4 py-2.5 text-xs font-semibold text-[#D1D5DB] hover:text-white bg-[#181818] hover:bg-[#222222] rounded-xl border border-[#333333] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isAnalyzing}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl text-black bg-white hover:bg-neutral-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {(loading || isAnalyzing) ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>{isAnalyzing ? 'Gemini Architecting Project...' : 'Creating Project...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
