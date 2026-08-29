import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { 
  Compass, 
  Plus, 
  ChevronDown, 
  LogOut, 
  FolderKanban, 
  Menu, 
  X,
  Shield,
  FileDown,
  Globe
} from 'lucide-react';

interface NavbarProps {
  onOpenNewProject: () => void;
  onOpenExport?: () => void;
  onOpenResearch?: () => void;
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewProject,
  onOpenExport,
  onOpenResearch,
  onToggleMobileMenu,
  onToggleSidebar,
  isMobileMenuOpen = false
}) => {

  const { user, logout } = useAuth();
  const { projects, activeProject, setActiveProjectId } = useProject();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleToggle = () => {
    if (onToggleMobileMenu) onToggleMobileMenu();
    if (onToggleSidebar) onToggleSidebar();
  };

  return (
    <header className="h-16 border-b border-[#222222] bg-[#080808]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand + Project Selector */}
      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={handleToggle}
          className="lg:hidden p-2 rounded-lg text-[#999999] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white font-bold shadow-sm">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-serif">
              ProjectPilot <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#181818] text-[#999999] border border-[#2a2a2a] font-mono font-semibold">AI</span>
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-[#222222] hidden sm:block" />

        {/* Project Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121212] border border-[#222222] hover:border-[#333333] text-sm font-medium text-[#D1D5DB] hover:text-white transition-all cursor-pointer max-w-[200px] sm:max-w-[280px]"
          >
            <FolderKanban className="w-4 h-4 text-[#999999] shrink-0" />
            <span className="truncate">{activeProject?.name || 'Select Project'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#666666] shrink-0 ml-1" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-[#0d0d0d] border border-[#222222] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-xs font-semibold text-[#888888] uppercase tracking-wider">
                My Projects ({projects.length})
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {projects.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-[#666666]">No projects yet</div>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProjectId(p.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[#181818] transition-colors cursor-pointer ${
                        p.id === activeProject?.id ? 'bg-[#181818] text-white font-semibold border-l-2 border-white' : 'text-[#D1D5DB]'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.analysis && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#222222] text-[#999999] font-mono border border-[#333333]">
                          AI
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-[#222222] mt-1 pt-1 px-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-[#D1D5DB] hover:text-white hover:bg-[#181818] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  <span>Create New Project</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions + User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Research Grounding Button */}
        {onOpenResearch && (
          <button
            onClick={onOpenResearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 hover:text-white font-medium text-xs border border-blue-500/30 hover:border-blue-400/50 transition-all cursor-pointer shadow-2xs"
            title="Perform live Google Search grounded technical research"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">Live Research</span>
          </button>
        )}

        {/* Export Markdown Button */}
        {activeProject && onOpenExport && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-[#D1D5DB] hover:text-white font-medium text-xs border border-[#262626] hover:border-[#383838] transition-all cursor-pointer shadow-2xs"
            title="Export project roadmap, notes & architecture as Markdown"
          >
            <FileDown className="w-3.5 h-3.5 text-white" />
            <span className="hidden md:inline">Export .MD</span>
          </button>
        )}


        {/* Quick New Project Button */}
        <button
          onClick={onOpenNewProject}
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#181818] hover:bg-[#222222] text-white font-medium text-xs border border-[#333333] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>

        {/* User Profile / Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#141414] transition-colors cursor-pointer"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border border-[#2a2a2a]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#181818] border border-[#2a2a2a] text-white font-semibold text-xs flex items-center justify-center font-mono">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-[#D1D5DB] truncate max-w-[120px]">
                {user?.displayName || 'Developer'}
              </div>
              <div className="text-[10px] text-[#888888] truncate max-w-[120px] font-mono">
                {user?.isAnonymous ? 'Guest Preview' : (user?.email || 'Authenticated')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#666666] hidden md:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0d0d0d] border border-[#222222] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-[#222222]">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.displayName || 'Developer'}
                </div>
                <div className="text-[11px] text-[#888888] truncate mt-0.5 font-mono">
                  {user?.email || (user?.isAnonymous ? 'Guest Mode (Ephemeral UID)' : 'User')}
                </div>
              </div>

              <div className="px-2 py-1">
                <div className="px-3 py-1.5 text-[11px] text-[#999999] flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Firestore Isolated</span>
                </div>
              </div>

              <div className="border-t border-[#222222] pt-1 px-2">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-[#1a1113] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
