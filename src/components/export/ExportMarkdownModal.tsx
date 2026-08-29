import React, { useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { 
  generateProjectMarkdown, 
  downloadMarkdownFile, 
  MarkdownExportOptions, 
  defaultExportOptions 
} from '../../utils/markdownExporter';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  KanbanSquare, 
  BookOpen, 
  Layers, 
  Activity, 
  SlidersHorizontal,
  Code2,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ExportMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFocus?: 'all' | 'roadmap' | 'notes' | 'architecture' | 'decisions';
}

export const ExportMarkdownModal: React.FC<ExportMarkdownModalProps> = ({
  isOpen,
  onClose,
  defaultFocus = 'all'
}) => {
  const { activeProject, tasks, notes, decisions } = useProject();

  const [options, setOptions] = useState<MarkdownExportOptions>(() => {
    if (defaultFocus === 'roadmap') {
      return {
        includeOverview: true,
        includeArchitecture: false,
        includeRoadmap: true,
        includeNotes: false,
        includeDecisions: false,
        includeHealth: false,
      };
    }
    if (defaultFocus === 'notes') {
      return {
        includeOverview: true,
        includeArchitecture: false,
        includeRoadmap: false,
        includeNotes: true,
        includeDecisions: false,
        includeHealth: false,
      };
    }
    if (defaultFocus === 'decisions') {
      return {
        includeOverview: true,
        includeArchitecture: false,
        includeRoadmap: false,
        includeNotes: false,
        includeDecisions: true,
        includeHealth: false,
      };
    }
    return defaultExportOptions;
  });

  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  const markdownContent = useMemo(() => {
    if (!activeProject) return '';
    return generateProjectMarkdown(
      activeProject,
      tasks,
      notes,
      decisions,
      activeProject.healthReview,
      options
    );
  }, [activeProject, tasks, notes, decisions, options]);

  if (!isOpen || !activeProject) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    const slug = (activeProject.name || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const filename = `${slug}-spec.md`;
    downloadMarkdownFile(filename, markdownContent);
  };

  const handleDownloadJson = () => {
    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project: {
        id: activeProject.id,
        name: activeProject.name,
        shortDescription: activeProject.shortDescription,
        problemBeingSolved: activeProject.problemBeingSolved,
        targetUsers: activeProject.targetUsers,
        techPreferences: activeProject.techPreferences,
        constraints: activeProject.constraints,
        deadline: activeProject.deadline,
        currentPhase: activeProject.currentPhase,
        analysis: activeProject.analysis,
        healthReview: activeProject.healthReview || null,
        createdAt: activeProject.createdAt,
        updatedAt: activeProject.updatedAt,
      },
      tasks,
      notes,
      decisions,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (activeProject.name || 'project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    a.href = url;
    a.download = `${slug}-workspace.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const applyPreset = (preset: 'all' | 'roadmap' | 'notes' | 'architecture' | 'decisions') => {
    if (preset === 'all') {
      setOptions({
        includeOverview: true,
        includeArchitecture: true,
        includeRoadmap: true,
        includeNotes: true,
        includeDecisions: true,
        includeHealth: true,
      });
    } else if (preset === 'roadmap') {
      setOptions({
        includeOverview: true,
        includeArchitecture: false,
        includeRoadmap: true,
        includeNotes: false,
        includeDecisions: false,
        includeHealth: false,
      });
    } else if (preset === 'notes') {
      setOptions({
        includeOverview: true,
        includeArchitecture: false,
        includeRoadmap: false,
        includeNotes: true,
        includeDecisions: true,
        includeHealth: false,
      });
    } else if (preset === 'architecture') {
      setOptions({
        includeOverview: true,
        includeArchitecture: true,
        includeRoadmap: false,
        includeNotes: false,
        includeDecisions: false,
        includeHealth: true,
      });
    }
  };

  const lineCount = markdownContent.split('\n').length;
  const wordCount = markdownContent.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-[#0e0e0e] border border-[#222222] rounded-2xl w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-base font-bold text-white font-serif flex items-center gap-2">
                Export Project as Markdown
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#1e1e1e] text-[#D1D5DB] border border-[#333333]">
                  .MD Portability
                </span>
              </h2>
              <p className="text-xs text-[#888888]">
                Generate clean, GitHub-Flavored Markdown for documentation, PRDs, or offline backup.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#1f1f1f] transition-colors cursor-pointer"
            aria-label="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Column (Options Sidebar + Live Preview) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Options & Filters Panel */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-[#222222] bg-[#0a0a0a] p-5 overflow-y-auto space-y-6 shrink-0">
            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                Quick Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1e1e1e] text-[#D1D5DB] hover:text-white text-xs font-medium border border-[#222222] transition-colors cursor-pointer text-left truncate"
                >
                  Complete Spec
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('roadmap')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1e1e1e] text-[#D1D5DB] hover:text-white text-xs font-medium border border-[#222222] transition-colors cursor-pointer text-left truncate"
                >
                  Roadmap Only
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('notes')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1e1e1e] text-[#D1D5DB] hover:text-white text-xs font-medium border border-[#222222] transition-colors cursor-pointer text-left truncate"
                >
                  Notes & ADRs
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('architecture')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1e1e1e] text-[#D1D5DB] hover:text-white text-xs font-medium border border-[#222222] transition-colors cursor-pointer text-left truncate"
                >
                  Architecture
                </button>
              </div>
            </div>

            {/* Custom Section Toggles */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider block">
                Include Sections
              </span>

              <div className="space-y-2">
                {/* 1. Overview */}
                <label className="flex items-center gap-2.5 text-xs text-[#D1D5DB] hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeOverview}
                    onChange={(e) => setOptions({ ...options, includeOverview: e.target.checked })}
                    className="rounded bg-[#181818] border-[#333333] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                  />
                  <span>Overview & Metadata</span>
                </label>

                {/* 2. Architecture */}
                <label className="flex items-center gap-2.5 text-xs text-[#D1D5DB] hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeArchitecture}
                    onChange={(e) => setOptions({ ...options, includeArchitecture: e.target.checked })}
                    className="rounded bg-[#181818] border-[#333333] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                  />
                  <span>AI Architecture & Tech Spec</span>
                </label>

                {/* 3. Roadmap */}
                <label className="flex items-center gap-2.5 text-xs text-[#D1D5DB] hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeRoadmap}
                    onChange={(e) => setOptions({ ...options, includeRoadmap: e.target.checked })}
                    className="rounded bg-[#181818] border-[#333333] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                  />
                  <span>Roadmap & Tasks ({tasks.length})</span>
                </label>

                {/* 4. Notes */}
                <label className="flex items-center gap-2.5 text-xs text-[#D1D5DB] hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeNotes}
                    onChange={(e) => setOptions({ ...options, includeNotes: e.target.checked })}
                    className="rounded bg-[#181818] border-[#333333] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                  />
                  <span>Notes & Research ({notes.length})</span>
                </label>

                {/* 5. Decisions */}
                <label className="flex items-center gap-2.5 text-xs text-[#D1D5DB] hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeDecisions}
                    onChange={(e) => setOptions({ ...options, includeDecisions: e.target.checked })}
                    className="rounded bg-[#181818] border-[#333333] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                  />
                  <span>Architecture Decisions ({decisions.length})</span>
                </label>

                {/* 6. Health Review */}
                <label className="flex items-center gap-2.5 text-xs text-[#D1D5DB] hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeHealth}
                    onChange={(e) => setOptions({ ...options, includeHealth: e.target.checked })}
                    className="rounded bg-[#181818] border-[#333333] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                  />
                  <span>Health & Risk Diagnostics</span>
                </label>
              </div>
            </div>

            {/* Document Metrics */}
            <div className="p-3 rounded-xl bg-[#121212] border border-[#222222] text-[11px] text-[#888888] space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Words:</span>
                <span className="text-white font-semibold">{wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Lines:</span>
                <span className="text-white font-semibold">{lineCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="text-[#D1D5DB]">GitHub Flavored MD</span>
              </div>
            </div>
          </div>

          {/* Main Preview / Code View */}
          <div className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
            {/* View Mode Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#222222] bg-[#0c0c0c]">
              <div className="flex items-center gap-1 bg-[#141414] p-0.5 rounded-lg border border-[#222222] text-xs">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'preview'
                      ? 'bg-white text-black font-semibold shadow-xs'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Formatted Preview</span>
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'raw'
                      ? 'bg-white text-black font-semibold shadow-xs'
                      : 'text-[#888888] hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Raw Markdown</span>
                </button>
              </div>

              <span className="text-[11px] text-[#666666] hidden sm:inline-block font-mono">
                {activeProject.name}.md
              </span>
            </div>

            {/* Document Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {viewMode === 'preview' ? (
                <div className="max-w-3xl mx-auto prose prose-invert prose-headings:font-serif prose-headings:font-normal prose-h1:text-2xl prose-h2:text-xl prose-h3:text-base prose-p:text-xs prose-p:leading-relaxed prose-p:text-[#D1D5DB] prose-li:text-xs prose-li:text-[#D1D5DB] prose-table:text-xs prose-th:text-[#888888] prose-th:border-[#333333] prose-td:border-[#222222] prose-blockquote:border-l-neutral-600 prose-blockquote:text-[#999999] prose-blockquote:text-xs">
                  <ReactMarkdown>{markdownContent}</ReactMarkdown>
                </div>
              ) : (
                <pre className="p-4 bg-[#0a0a0a] border border-[#222222] rounded-xl text-xs font-mono text-[#D1D5DB] whitespace-pre-wrap leading-relaxed select-text overflow-x-auto max-w-3xl mx-auto">
                  {markdownContent}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#222222] bg-[#121212]">
          <div className="text-xs text-[#888888] hidden sm:block">
            Ready to export for GitHub Readmes, Notion, Obsidian, or architecture logs.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-white text-xs font-semibold border border-[#333333] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#181818] hover:bg-[#252525] text-[#D1D5DB] hover:text-white text-xs font-semibold border border-[#333333] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              title="Download full project workspace data as JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export JSON Workspace</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .MD File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
