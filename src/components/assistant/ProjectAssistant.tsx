import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useProject } from '../../context/ProjectContext';
import { AssistantRole, AssistantSpeed } from '../../types';
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  MessageSquare, 
  BrainCircuit, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  Lightbulb, 
  Bot, 
  User,
  Clock,
  Globe,
  Zap,
  Cpu,
  ExternalLink,
  Search,
  BookOpen,
  Code
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const ProjectAssistant: React.FC = () => {
  const { 
    activeProject, 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    messages, 
    sendMessageToAssistant, 
    createNewConversation, 
    removeConversation, 
    isSendingChat,
    tasks,
    decisions,
    notes,
    experiments
  } = useProject();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<AssistantRole>('TECH_LEAD');
  const [selectedSpeed, setSelectedSpeed] = useState<AssistantSpeed>('GENERAL');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(false);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync selected role when switching active conversation
  useEffect(() => {
    if (activeConversationId) {
      const conv = conversations.find(c => c.id === activeConversationId);
      if (conv?.role) {
        setSelectedRole(conv.role);
      }
    }
  }, [activeConversationId, conversations]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSendingChat]);

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-[#888888] font-serif">
        Please select or create a project to chat with the ProjectPilot AI assistant.
      </div>
    );
  }

  const roleConfigs: Record<AssistantRole, { label: string; icon: any; description: string }> = {
    TECH_LEAD: { label: 'Tech Lead', icon: Sparkles, description: 'Architecture, trade-offs & sprint velocity' },
    ARCHITECT: { label: 'System Architect', icon: Layers, description: 'High-level design, ADRs & scalability' },
    SECURITY: { label: 'Security Officer', icon: ShieldAlert, description: 'Threat modeling, OWASP & secret hygiene' },
    FULLSTACK_DEV: { label: 'Full-Stack Dev', icon: Code, description: 'Clean TypeScript, APIs & practical code' }
  };

  const promptChips = [
    { label: 'What should I work on next given my phase?', icon: Lightbulb },
    { label: 'Perform a security audit of my architecture & auth', icon: ShieldAlert },
    { label: 'Review my current task roadmap & blockers', icon: Layers },
    { label: 'Research modern libraries & best practices for our stack', icon: Globe, autoSearch: true },
    { label: 'Summarize all architectural decisions (ADRs) recorded', icon: BrainCircuit },
  ];

  const handleSendMessage = async (text: string, forceSearch?: boolean) => {
    if (!text.trim() || isSendingChat) return;
    setInputMessage('');
    await sendMessageToAssistant(text.trim(), {
      role: selectedRole,
      speed: selectedSpeed,
      useSearch: forceSearch !== undefined ? forceSearch : useSearchGrounding
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const handleConfirmDeleteConv = async () => {
    if (!deletingConvId) return;
    await removeConversation(deletingConvId);
    setDeletingConvId(null);
  };

  const handleCreateNewThread = () => {
    createNewConversation(`Thread ${conversations.length + 1}`, selectedRole);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col space-y-3 animate-in fade-in">
      {/* Top Banner: Controls, Persona Selector, & Grounding Switch */}
      <div className="p-4 rounded-2xl bg-[#0e0e0e] border border-[#222222] flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-center text-white font-bold shrink-0">
            {React.createElement(roleConfigs[selectedRole].icon, { className: "w-5 h-5 text-white" })}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-normal text-white tracking-tight font-serif">Project Co-Pilot</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#141d16] text-emerald-400 border border-emerald-500/20 font-mono">
                Context-Grounded
              </span>
              {useSearchGrounding && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300 border border-blue-500/30 font-mono flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Live Search On
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#888888] font-mono mt-0.5">
              Memory: {tasks.length} Tasks &bull; {decisions.length} ADRs &bull; {notes.length} Notes &bull; {experiments.length} Experiments
            </p>
          </div>
        </div>

        {/* Persona, Model Speed & Grounding Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Persona / Role Selector */}
          <div className="flex items-center gap-1 bg-[#141414] border border-[#222222] rounded-xl p-1">
            <span className="text-[10px] text-[#777777] font-mono px-1 hidden sm:inline">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as AssistantRole)}
              className="bg-transparent text-xs text-white focus:outline-hidden cursor-pointer px-1 py-0.5 font-medium"
            >
              <option value="TECH_LEAD" className="bg-[#141414]">Tech Lead</option>
              <option value="ARCHITECT" className="bg-[#141414]">Architect</option>
              <option value="SECURITY" className="bg-[#141414]">Security Officer</option>
              <option value="FULLSTACK_DEV" className="bg-[#141414]">Full-Stack Dev</option>
            </select>
          </div>

          {/* Speed / Reasoning Selector */}
          <div className="flex items-center gap-1 bg-[#141414] border border-[#222222] rounded-xl p-1">
            <select
              value={selectedSpeed}
              onChange={(e) => setSelectedSpeed(e.target.value as AssistantSpeed)}
              className="bg-transparent text-xs text-[#D1D5DB] focus:outline-hidden cursor-pointer px-1 py-0.5"
            >
              <option value="GENERAL" className="bg-[#141414]">General (Gemini 3.5 Flash)</option>
              <option value="FAST" className="bg-[#141414]">Fast (Gemini 3.1 Flash-Lite)</option>
              <option value="DEEP_REASONING" className="bg-[#141414]">Deep Reasoning (Gemini 3.1 Pro)</option>
            </select>
          </div>

          {/* Google Search Grounding Toggle */}
          <button
            onClick={() => setUseSearchGrounding(!useSearchGrounding)}
            title="Toggle Google Search Grounding for real-time web knowledge"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all border ${
              useSearchGrounding 
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-xs' 
                : 'bg-[#141414] text-[#888888] border-[#222222] hover:text-white'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 ${useSearchGrounding ? 'text-blue-400' : 'text-[#888888]'}`} />
            <span className="hidden sm:inline">Search Grounding</span>
          </button>

          {/* Conversation Selector */}
          {conversations.length > 1 && (
            <select
              value={activeConversationId || ''}
              onChange={(e) => setActiveConversationId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#141414] border border-[#222222] text-xs text-[#D1D5DB] focus:border-[#444444] max-w-[140px] truncate cursor-pointer"
            >
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleCreateNewThread}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          {activeConversationId && conversations.length > 1 && (
            <button
              onClick={() => setDeletingConvId(activeConversationId)}
              title="Delete thread"
              className="p-1.5 rounded-xl text-[#888888] hover:text-rose-400 hover:bg-[#181818] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-[#080808] border border-[#222222] p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#222222] text-[#D1D5DB] flex items-center justify-center">
              {React.createElement(roleConfigs[selectedRole].icon, { className: "w-7 h-7 text-white" })}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-normal text-white font-serif">
                {roleConfigs[selectedRole].label} Co-Pilot Ready
              </h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                {roleConfigs[selectedRole].description} for <strong className="text-white font-serif">{activeProject.name}</strong>. Ask about technical strategy, next steps, risks, or code architecture.
              </p>
            </div>

            {/* Quick Prompt Chips */}
            <div className="w-full space-y-2">
              <span className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider block text-left">
                Suggested Prompts:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {promptChips.map((chip, idx) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.label, chip.autoSearch)}
                      className="p-2.5 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] border border-[#222222] hover:border-[#333333] text-left text-xs text-[#D1D5DB] hover:text-white flex items-center gap-2.5 transition-all cursor-pointer group"
                    >
                      <Icon className="w-4 h-4 text-[#888888] group-hover:text-white transition-colors shrink-0" />
                      <span className="truncate">{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#141414] border border-[#222222] text-[#D1D5DB] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#222222] border border-[#333333] text-white shadow-sm'
                      : 'bg-[#0e0e0e] border border-[#222222] text-[#D1D5DB] shadow-md'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="markdown-content prose prose-invert prose-xs sm:prose-sm max-w-none space-y-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* Grounding Sources / Citations */}
                      {msg.groundingSources && msg.groundingSources.length > 0 && (
                        <div className="pt-3 mt-3 border-t border-[#1e1e1e] space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-blue-400 font-medium">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Google Search Grounding Sources ({msg.groundingSources.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.groundingSources.map((source, sIdx) => (
                              <a
                                key={sIdx}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] border border-[#222222] hover:border-blue-500/40 text-[11px] text-[#A0A0A0] hover:text-white transition-all flex items-start justify-between gap-2 group"
                              >
                                <div className="space-y-0.5 truncate">
                                  <div className="font-medium text-white truncate text-[11px] group-hover:text-blue-300">
                                    {source.title || 'Web Reference'}
                                  </div>
                                  {source.snippet && (
                                    <div className="text-[10px] text-[#777777] line-clamp-1">
                                      {source.snippet}
                                    </div>
                                  )}
                                </div>
                                <ExternalLink className="w-3 h-3 text-[#666666] group-hover:text-blue-400 shrink-0 mt-0.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Footer: Model Used & Timestamp */}
                  <div
                    className={`text-[10px] mt-2.5 font-mono flex items-center gap-2 flex-wrap ${
                      isUser ? 'text-[#888888] justify-end' : 'text-[#666666]'
                    }`}
                  >
                    {!isUser && msg.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#161616] border border-[#262626] text-[#A0A0A0]">
                        {msg.modelUsed}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#181818] border border-[#2a2a2a] text-[#D1D5DB] flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSendingChat && (
          <div className="flex items-start gap-3 justify-start animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-[#141414] border border-[#222222] text-[#D1D5DB] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-[#0e0e0e] border border-[#222222] text-[#D1D5DB] text-xs flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
              <span className="text-[#888888] font-mono text-[11px] ml-1">
                {useSearchGrounding ? 'Gemini 3.5 Flash researching live with Google Search...' : 'Gemini analyzing project context & memory...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box with Grounding & Role Indicators */}
      <div className="shrink-0 p-2.5 rounded-2xl bg-[#0e0e0e] border border-[#222222] shadow-xl flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <textarea
            rows={2}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${roleConfigs[selectedRole].label} anything about architecture, tasks, risks, or code...`}
            disabled={isSendingChat}
            className="w-full max-h-32 p-2 bg-transparent text-xs sm:text-sm text-white placeholder:text-[#666666] focus:outline-hidden resize-none"
          />
          <div className="flex items-center justify-between px-2 pt-1 border-t border-[#181818] text-[11px] text-[#666666] font-mono">
            <div className="flex items-center gap-2">
              <span>Persona: <strong className="text-[#A0A0A0]">{roleConfigs[selectedRole].label}</strong></span>
              <span>&bull;</span>
              <span>Model: <strong className="text-[#A0A0A0]">{selectedSpeed}</strong></span>
            </div>
            <span className="text-[10px]">Enter to send, Shift+Enter for new line</span>
          </div>
        </div>

        <button
          onClick={() => handleSendMessage(inputMessage)}
          disabled={!inputMessage.trim() || isSendingChat}
          className="p-3.5 rounded-xl bg-white hover:bg-neutral-200 text-black disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 shadow-sm self-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Thread Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deletingConvId)}
        title="Delete Conversation Thread"
        message="Are you sure you want to delete this conversation thread? Its history will be removed permanently."
        confirmLabel="Delete Thread"
        onConfirm={handleConfirmDeleteConv}
        onCancel={() => setDeletingConvId(null)}
      />
    </div>
  );
};

