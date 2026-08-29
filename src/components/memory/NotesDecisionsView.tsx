import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ArchitectureDecision, ProjectNote } from '../../types';
import { 
  Database, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Tag, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles,
  X,
  FileDown
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface NotesDecisionsViewProps {
  onOpenExport?: () => void;
}

export const NotesDecisionsView: React.FC<NotesDecisionsViewProps> = ({ onOpenExport }) => {
  const { 
    activeProject, 
    notes, 
    decisions, 
    addNewNote, 
    modifyNote, 
    removeNote, 
    addNewDecision, 
    modifyDecision, 
    removeDecision 
  } = useProject();

  const [activeTab, setActiveTab] = useState<'decisions' | 'notes'>('decisions');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal State
  const [showNewDecisionModal, setShowNewDecisionModal] = useState(false);
  const [editingDecision, setEditingDecision] = useState<ArchitectureDecision | null>(null);
  const [decDecision, setDecDecision] = useState('');
  const [decContext, setDecContext] = useState('');
  const [decReasoning, setDecReasoning] = useState('');
  const [decAlternatives, setDecAlternatives] = useState('');
  const [decStatus, setDecStatus] = useState<'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED' | 'REJECTED'>('ACCEPTED');
  const [deletingDecisionId, setDeletingDecisionId] = useState<string | null>(null);

  // Note Modal State
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<'RESEARCH' | 'MEETING' | 'SPECIFICATION' | 'GENERAL'>('GENERAL');
  const [noteTags, setNoteTags] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-[#888888] font-serif">
        Please select or create a project to view notes & decisions.
      </div>
    );
  }

  // Filtered decisions
  const filteredDecisions = decisions.filter((d) => 
    d.decision.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.reasoning.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.context && d.context.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtered notes
  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.tags && n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Decision handlers
  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decDecision.trim() || !decReasoning.trim()) return;

    const alts = decAlternatives.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingDecision) {
      await modifyDecision(editingDecision.id, {
        decision: decDecision.trim(),
        context: decContext.trim() || undefined,
        reasoning: decReasoning.trim(),
        alternativesConsidered: alts.length > 0 ? alts : undefined,
        status: decStatus,
      });
      setEditingDecision(null);
    } else {
      await addNewDecision({
        decision: decDecision.trim(),
        context: decContext.trim() || undefined,
        reasoning: decReasoning.trim(),
        alternativesConsidered: alts.length > 0 ? alts : undefined,
        status: decStatus,
        date: new Date().toISOString().split('T')[0],
      });
      setShowNewDecisionModal(false);
    }

    // Reset
    setDecDecision('');
    setDecContext('');
    setDecReasoning('');
    setDecAlternatives('');
    setDecStatus('ACCEPTED');
  };

  const handleOpenEditDecision = (d: ArchitectureDecision) => {
    setEditingDecision(d);
    setDecDecision(d.decision);
    setDecContext(d.context || '');
    setDecReasoning(d.reasoning);
    const formattedAlts = Array.isArray(d.alternativesConsidered) 
      ? d.alternativesConsidered.join(', ') 
      : (d.alternativesConsidered || '');
    setDecAlternatives(formattedAlts);
    setDecStatus(d.status);
  };

  // Note handlers
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const tagsArr = noteTags.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingNote) {
      await modifyNote(editingNote.id, {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        category: noteCategory,
        tags: tagsArr,
      });
      setEditingNote(null);
    } else {
      await addNewNote({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        category: noteCategory,
        tags: tagsArr,
      });
      setShowNewNoteModal(false);
    }

    // Reset
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('GENERAL');
    setNoteTags('');
  };

  const handleOpenEditNote = (n: ProjectNote) => {
    setEditingNote(n);
    setNoteTitle(n.title);
    setNoteContent(n.content);
    setNoteCategory(n.category);
    setNoteTags(n.tags ? n.tags.join(', ') : '');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0e0e0e] border border-[#222222] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a] font-mono">
              Project Memory & Records
            </span>
            <span className="text-xs font-mono text-[#888888]">
              {decisions.length} Decisions &bull; {notes.length} Notes
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif">
            Knowledge & Decisions
          </h1>
          <p className="text-xs text-[#888888]">
            Document architectural decisions (ADRs), research logs, and persistent project context.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="px-3.5 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-[#D1D5DB] hover:text-white text-xs font-semibold border border-[#2a2a2a] hover:border-[#383838] transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              title="Export notes & ADRs as Markdown"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>Export Notes (.md)</span>
            </button>
          )}

          {activeTab === 'decisions' ? (
            <button
              onClick={() => {
                setEditingDecision(null);
                setDecDecision('');
                setDecContext('');
                setDecReasoning('');
                setDecAlternatives('');
                setDecStatus('ACCEPTED');
                setShowNewDecisionModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Decision (ADR)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteTitle('');
                setNoteContent('');
                setNoteCategory('GENERAL');
                setNoteTags('');
                setShowNewNoteModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#0e0e0e] border border-[#222222]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'decisions'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-[#888888] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Architecture Decisions ({decisions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'notes'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-[#888888] hover:text-white hover:bg-[#181818]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Project Notes ({notes.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'decisions' ? 'Search ADRs...' : 'Search notes & tags...'}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#141414] border border-[#222222] text-xs text-[#D1D5DB] placeholder:text-[#666666] focus:border-[#444444]"
          />
        </div>
      </div>

      {/* Content: Architecture Decisions */}
      {activeTab === 'decisions' && (
        <div className="space-y-4 animate-in fade-in">
          {filteredDecisions.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0a0a0a] border border-[#222222] text-center space-y-3">
              <Database className="w-10 h-10 text-[#888888] mx-auto opacity-70" />
              <h3 className="text-sm font-normal text-white font-serif">No Architecture Decisions Found</h3>
              <p className="text-xs text-[#888888] max-w-sm mx-auto">
                Record technical decisions, rationale, and tradeoffs to give Gemini and your team persistent memory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDecisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-5 rounded-2xl bg-[#0e0e0e] border border-[#222222] hover:border-[#333333] space-y-3 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        dec.status === 'ACCEPTED' ? 'bg-[#141d16] text-emerald-400 border border-emerald-500/20' :
                        dec.status === 'PROPOSED' ? 'bg-[#1f1b14] text-amber-400 border border-amber-500/20' :
                        dec.status === 'SUPERSEDED' ? 'bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a]' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {dec.status}
                      </span>
                      <span className="text-[10px] text-[#666666] font-mono">{dec.date}</span>
                    </div>

                    <h3 className="text-sm font-normal text-white font-serif">{dec.decision}</h3>

                    {dec.context && (
                      <div className="text-xs text-[#888888]">
                        <span className="font-semibold text-[#AAAAAA]">Context:</span> {dec.context}
                      </div>
                    )}

                    <div className="text-xs text-[#D1D5DB]">
                      <span className="font-semibold text-[#AAAAAA]">Reasoning:</span> {dec.reasoning}
                    </div>

                    {dec.alternativesConsidered && (
                      <div className="text-[11px] text-[#888888] flex items-center gap-1.5 flex-wrap">
                        <span>Alternatives:</span>
                        {Array.isArray(dec.alternativesConsidered) ? (
                          dec.alternativesConsidered.map((alt, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-[#141414] border border-[#222222] text-[#888888] font-mono">
                              {alt}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#141414] border border-[#222222] text-[#888888] font-mono">
                            {dec.alternativesConsidered}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-[#222222] text-xs">
                    <button
                      onClick={() => handleOpenEditDecision(dec)}
                      className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#181818] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingDecisionId(dec.id)}
                      className="p-1.5 rounded-lg text-[#888888] hover:text-rose-400 hover:bg-[#181818] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content: Project Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-4 animate-in fade-in">
          {filteredNotes.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0a0a0a] border border-[#222222] text-center space-y-3">
              <FileText className="w-10 h-10 text-[#888888] mx-auto opacity-70" />
              <h3 className="text-sm font-normal text-white font-serif">No Project Notes Found</h3>
              <p className="text-xs text-[#888888] max-w-sm mx-auto">
                Store meeting notes, user interview findings, specifications, and scratchpad thoughts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-5 rounded-2xl bg-[#0e0e0e] border border-[#222222] hover:border-[#333333] space-y-3 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-[#181818] text-[#D1D5DB] border border-[#2a2a2a]">
                        {note.category}
                      </span>
                      <span className="text-[10px] text-[#666666] font-mono">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-normal text-white font-serif">{note.title}</h3>
                    <p className="text-xs text-[#888888] whitespace-pre-wrap line-clamp-6 leading-relaxed">
                      {note.content}
                    </p>

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {note.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#141414] text-[#888888] border border-[#222222]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-[#222222] text-xs">
                    <button
                      onClick={() => handleOpenEditNote(note)}
                      className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#181818] cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingNoteId(note.id)}
                      className="p-1.5 rounded-lg text-[#888888] hover:text-rose-400 hover:bg-[#181818] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: New / Edit Decision */}
      {(showNewDecisionModal || editingDecision) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-[#222222] rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setShowNewDecisionModal(false);
                setEditingDecision(null);
              }}
              className="absolute top-4 right-4 text-[#888888] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-normal text-white mb-4 font-serif">
              {editingDecision ? 'Edit Architecture Decision (ADR)' : 'Record Architecture Decision (ADR)'}
            </h3>

            <form onSubmit={handleSaveDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Decision Title *</label>
                <input
                  type="text"
                  required
                  value={decDecision}
                  onChange={(e) => setDecDecision(e.target.value)}
                  placeholder="e.g., Use Cloud Run for stateless container microservices"
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Context & Problem</label>
                <textarea
                  rows={2}
                  value={decContext}
                  onChange={(e) => setDecContext(e.target.value)}
                  placeholder="What was the problem or architecture requirement driving this choice?"
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Rationale & Reasoning *</label>
                <textarea
                  rows={3}
                  required
                  value={decReasoning}
                  onChange={(e) => setDecReasoning(e.target.value)}
                  placeholder="Why this decision was chosen over others..."
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Alternatives (comma-separated)</label>
                  <input
                    type="text"
                    value={decAlternatives}
                    onChange={(e) => setDecAlternatives(e.target.value)}
                    placeholder="GKE, Cloud Functions, VM"
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Status</label>
                  <select
                    value={decStatus}
                    onChange={(e) => setDecStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white cursor-pointer"
                  >
                    <option value="PROPOSED">Proposed</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="SUPERSEDED">Superseded</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewDecisionModal(false);
                    setEditingDecision(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#181818] text-[#D1D5DB] hover:bg-[#222222] border border-[#333333] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Save Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Note */}
      {(showNewNoteModal || editingNote) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-[#222222] rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => {
                setShowNewNoteModal(false);
                setEditingNote(null);
              }}
              className="absolute top-4 right-4 text-[#888888] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-normal text-white mb-4 font-serif">
              {editingNote ? 'Edit Project Note' : 'Create Project Note'}
            </h3>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g., Performance Benchmarking Results"
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Category</label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white cursor-pointer"
                  >
                    <option value="GENERAL">General</option>
                    <option value="RESEARCH">Research</option>
                    <option value="MEETING">Meeting</option>
                    <option value="SPECIFICATION">Specification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    placeholder="benchmark, db, latency"
                    className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#888888] uppercase mb-1">Content *</label>
                <textarea
                  rows={5}
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your research findings, notes, or technical observations..."
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white focus:border-[#444444] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewNoteModal(false);
                    setEditingNote(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#181818] text-[#D1D5DB] hover:bg-[#222222] border border-[#333333] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Decision Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deletingDecisionId)}
        title="Delete Architecture Decision"
        message="Are you sure you want to delete this ADR record? This action cannot be undone."
        confirmLabel="Delete Decision"
        onConfirm={async () => {
          if (deletingDecisionId) {
            await removeDecision(deletingDecisionId);
            setDeletingDecisionId(null);
          }
        }}
        onCancel={() => setDeletingDecisionId(null)}
      />

      {/* Delete Note Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deletingNoteId)}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmLabel="Delete Note"
        onConfirm={async () => {
          if (deletingNoteId) {
            await removeNote(deletingNoteId);
            setDeletingNoteId(null);
          }
        }}
        onCancel={() => setDeletingNoteId(null)}
      />
    </div>
  );
};
