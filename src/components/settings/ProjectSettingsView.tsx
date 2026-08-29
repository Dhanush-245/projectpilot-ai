import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  Settings, 
  Trash2, 
  Download, 
  Save, 
  AlertTriangle, 
  Calendar, 
  Code2, 
  Target, 
  Users, 
  Lock,
  Layers,
  CheckCircle2,
  FileDown,
  FileText
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface ProjectSettingsViewProps {
  onProjectDeleted: () => void;
  onOpenExport?: () => void;
}

export const ProjectSettingsView: React.FC<ProjectSettingsViewProps> = ({
  onProjectDeleted,
  onOpenExport
}) => {
  const { 
    activeProject, 
    updateProjectDetails, 
    deleteCurrentProject, 
    tasks, 
    decisions, 
    notes, 
    conversations 
  } = useProject();

  const [name, setName] = useState(activeProject?.name || '');
  const [shortDescription, setShortDescription] = useState(activeProject?.shortDescription || '');
  const [currentPhase, setCurrentPhase] = useState(activeProject?.currentPhase || 'Phase 1: Architecture');
  const [problemBeingSolved, setProblemBeingSolved] = useState(activeProject?.problemBeingSolved || '');
  const [targetUsers, setTargetUsers] = useState(activeProject?.targetUsers || '');
  const [techPreferences, setTechPreferences] = useState(activeProject?.techPreferences || '');
  const [constraints, setConstraints] = useState(activeProject?.constraints || '');
  const [deadline, setDeadline] = useState(activeProject?.deadline || '');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-[#888888] font-serif">
        Please select or create a project to manage settings.
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortDescription.trim()) return;

    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateProjectDetails({
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        currentPhase: currentPhase.trim() || 'Phase 1: Architecture',
        problemBeingSolved: problemBeingSolved.trim() || undefined,
        targetUsers: targetUsers.trim() || undefined,
        techPreferences: techPreferences.trim() || undefined,
        constraints: constraints.trim() || undefined,
        deadline: deadline || undefined,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update project settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJson = () => {
    const exportData = {
      project: activeProject,
      tasks,
      decisions,
      notes,
      conversations,
      exportedAt: new Date().toISOString()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeProject.name.toLowerCase().replace(/\s+/g, '-')}-export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteProject = async () => {
    await deleteCurrentProject();
    setShowDeleteModal(false);
    onProjectDeleted();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">
              Configuration
            </span>
          </div>
          <h1 className="text-2xl font-normal text-white tracking-tight font-serif">
            Project Settings
          </h1>
          <p className="text-xs text-[#888888]">
            Update project metadata, target milestones, and export workspace data.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <FileDown className="w-4 h-4" />
              <span>Export as Markdown (.md)</span>
            </button>
          )}

          <button
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-xl bg-[#181818] hover:bg-[#222222] text-[#D1D5DB] text-xs font-semibold border border-[#333333] transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-[#AAAAAA]" />
            <span>Export JSON Workspace</span>
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] space-y-6">
        <div className="flex items-center justify-between border-b border-[#222222] pb-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#888888]" />
            <span>General Information</span>
          </h2>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully!
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">
              Short Description *
            </label>
            <textarea
              rows={3}
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444] resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#AAAAAA]" />
                Current Active Phase
              </label>
              <input
                type="text"
                value={currentPhase}
                onChange={(e) => setCurrentPhase(e.target.value)}
                placeholder="e.g., Phase 2: MVP Development"
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-rose-400" />
                Problem Being Solved
              </label>
              <input
                type="text"
                value={problemBeingSolved}
                onChange={(e) => setProblemBeingSolved(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#D1D5DB]" />
                Target Users
              </label>
              <input
                type="text"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#D1D5DB]" />
                Tech Preferences
              </label>
              <input
                type="text"
                value={techPreferences}
                onChange={(e) => setTechPreferences(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] uppercase mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#666666]" />
                Known Constraints
              </label>
              <input
                type="text"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[#222222]">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl bg-[#140c0c] border border-rose-950/60 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-normal text-white font-serif">Delete Project & Workspace</h3>
            <p className="text-xs text-[#888888] mt-0.5">
              Permanently remove this project, all associated roadmap tasks, ADRs, notes, and AI conversations from Firestore.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/50 text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Project</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title={`Delete "${activeProject.name}"?`}
        message="This action will permanently delete all project data, including roadmap tasks, architecture decisions, research notes, and AI conversations. This action cannot be undone."
        confirmLabel="Delete Everything"
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
