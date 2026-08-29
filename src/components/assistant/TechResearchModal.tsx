import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useProject } from '../../context/ProjectContext';
import { requestResearchGrounding } from '../../services/geminiService';
import { 
  Globe, 
  Search, 
  X, 
  Sparkles, 
  ExternalLink, 
  Layers, 
  Copy, 
  Check, 
  ArrowRight,
  BookOpen,
  Plus
} from 'lucide-react';

interface TechResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export const TechResearchModal: React.FC<TechResearchModalProps> = ({
  isOpen,
  onClose,
  initialTopic = ''
}) => {
  const { activeProject, addNewNote } = useProject();
  const [query, setQuery] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedAsNote, setSavedAsNote] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    modelUsed?: string;
    groundingSources?: Array<{ title?: string; url?: string; snippet?: string }>;
    webSearchQueries?: string[];
    groundingStatus?: 'live' | 'fallback';
  } | null>(null);

  if (!isOpen) return null;

  const quickResearchTopics = [
    'Latest best practices for React 19 server components vs client architecture',
    'Firestore indexing strategies & security rules for multi-tenant apps',
    'Best lightweight Node.js rate-limiting & OWASP security middleware',
    'Gemini 3.5 Flash vs Gemini 3.1 Flash-Lite latency & token cost benchmarks',
    'Docker multi-stage build optimization for Cloud Run TypeScript servers'
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedAsNote(false);

    try {
      const response = await requestResearchGrounding({
        query: searchQuery.trim(),
        projectContext: activeProject ? {
          name: activeProject.name,
          analysis: activeProject.analysis
        } : undefined
      });

      setResult(response);
    } catch (err: any) {
      console.error('Research error:', err);
      setError(err?.message || 'Failed to complete grounded research');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    let md = `# Research: ${query}\n\n${result.summary}\n\n`;
    if (result.groundingSources && result.groundingSources.length > 0) {
      md += `### Web Sources (Google Search Grounding)\n`;
      result.groundingSources.forEach((src) => {
        md += `- [${src.title || 'Source'}](${src.url})\n`;
      });
    }
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsNote = async () => {
    if (!result || !activeProject) return;
    try {
      let noteContent = `${result.summary}\n\n---\n**Grounded via Google Search (${result.modelUsed || 'Gemini'})**\n`;
      if (result.groundingSources && result.groundingSources.length > 0) {
        noteContent += `\n**Sources:**\n` + result.groundingSources.map(s => `- [${s.title || 'Link'}](${s.url})`).join('\n');
      }

      await addNewNote({
        title: `Research: ${query.slice(0, 40)}`,
        content: noteContent,
        category: 'RESEARCH',
        tags: ['GoogleSearch', 'Gemini', 'Research']
      });

      setSavedAsNote(true);
      setTimeout(() => setSavedAsNote(false), 3000);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0a] border border-[#222222] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1f1f1f] bg-[#0e0e0e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-normal text-white font-serif">Tech & Market Research Grounding</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-500/30 font-mono">
                  Gemini 3.5 Flash + Google Search
                </span>
              </div>
              <p className="text-xs text-[#888888]">
                Real-time technical benchmarks, library documentation, security advisories, and architecture state-of-the-art.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-[#111111] border-b border-[#1f1f1f] space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search technical topics, library benchmarks, security standards..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#080808] border border-[#262626] text-white text-xs sm:text-sm placeholder:text-[#666666] focus:border-blue-500/50 focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-2 disabled:opacity-40 cursor-pointer transition-all shadow-xs shrink-0"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-black" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 text-black" />
                  <span>Live Ground</span>
                </>
              )}
            </button>
          </form>

          {/* Quick topic chips */}
          {!result && !loading && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-mono text-[#777777] block">Suggested Research Topics:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickResearchTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(topic);
                      handleSearch(topic);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2a2a2a] text-[11px] text-[#A0A0A0] hover:text-white transition-all text-left truncate max-w-xs cursor-pointer"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Globe className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-white font-serif">Querying Live Google Search...</h4>
                <p className="text-xs text-[#888888] font-mono">
                  Grounding technical findings with Gemini 3.5 Flash
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs sm:text-sm">
              <p className="font-semibold">Research Error</p>
              <p className="mt-1 text-rose-400/80">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in">
              {result.groundingStatus === 'fallback' && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 text-amber-200 text-xs">
                  Live Google Search quota is currently unavailable. This brief uses Gemini's model knowledge and contains no live web citations.
                </div>
              )}
              {/* Actions bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#888888]">
                    Model: <strong className="text-white">{result.modelUsed || 'Gemini'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#202020] border border-[#2a2a2a] text-xs text-[#D1D5DB] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy MD'}</span>
                  </button>

                  {activeProject && (
                    <button
                      onClick={handleSaveAsNote}
                      className="px-3 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/40 border border-blue-500/40 text-xs text-blue-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {savedAsNote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{savedAsNote ? 'Saved to Notes' : 'Save as Project Note'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Research Report Content */}
              <div className="markdown-content prose prose-invert prose-sm max-w-none space-y-3 leading-relaxed">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>

              {/* Grounding Web Citations */}
              {result.groundingSources && result.groundingSources.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-medium">
                    <Globe className="w-4 h-4" />
                    <span>Verified Web Sources ({result.groundingSources.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.groundingSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] hover:border-blue-500/40 text-xs text-[#A0A0A0] hover:text-white transition-all flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1 truncate">
                          <div className="font-semibold text-white truncate group-hover:text-blue-300">
                            {src.title || 'Reference Documentation'}
                          </div>
                          {src.snippet && (
                            <div className="text-[11px] text-[#777777] line-clamp-2">
                              {src.snippet}
                            </div>
                          )}
                          <div className="text-[10px] text-blue-400/80 truncate font-mono">
                            {src.url}
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-[#666666] group-hover:text-blue-400 shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
