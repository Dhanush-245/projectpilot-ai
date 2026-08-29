import React from 'react';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  KanbanSquare, 
  MessageSquareCode, 
  Database, 
  Activity, 
  Settings,
  Sparkles
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export type NavTab = 
  | 'dashboard' 
  | 'intelligence' 
  | 'roadmap' 
  | 'assistant' 
  | 'memory' 
  | 'health' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  onTabChange?: (tab: NavTab) => void;
  isMobileMenuOpen?: boolean;
  isOpen?: boolean;
  onCloseMobileMenu?: () => void;
  onClose?: () => void;
  onOpenNewProject?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onTabChange,
  isMobileMenuOpen = false,
  isOpen = false,
  onCloseMobileMenu,
  onClose,
  onOpenNewProject
}) => {
  const { activeProject, progressStats } = useProject();

  const handleSelect = (tab: NavTab) => {
    if (onSelectTab) onSelectTab(tab);
    if (onTabChange) onTabChange(tab);
    if (onCloseMobileMenu) onCloseMobileMenu();
    if (onClose) onClose();
  };

  const mobileOpen = isMobileMenuOpen || isOpen;
  const handleClose = () => {
    if (onCloseMobileMenu) onCloseMobileMenu();
    if (onClose) onClose();
  };

  const navItems: Array<{ id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'intelligence', 
      label: 'AI Architecture', 
      icon: BrainCircuit,
      badge: activeProject?.analysis ? 'Ready' : undefined
    },
    { 
      id: 'roadmap', 
      label: 'Roadmap & Tasks', 
      icon: KanbanSquare,
      badge: progressStats.total > 0 ? `${progressStats.completed}/${progressStats.total}` : undefined
    },
    { 
      id: 'assistant', 
      label: 'AI Co-Pilot', 
      icon: MessageSquareCode,
      badge: 'Gemini'
    },
    { 
      id: 'memory', 
      label: 'Project Memory', 
      icon: Database 
    },
    { 
      id: 'health', 
      label: 'Health & Risks', 
      icon: Activity,
      badge: activeProject?.healthReview ? `${activeProject.healthReview.score}%` : undefined
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#080808] border-r border-[#222222] p-4 flex flex-col justify-between z-30 transition-transform duration-200 ease-in-out shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Active Project Card in Sidebar */}
          {activeProject && (
            <div className="p-3.5 rounded-xl bg-[#121212] border border-[#222222] shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-[#888888] uppercase tracking-wider">Current Project</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f1f1f] text-[#D1D5DB] border border-[#333333] font-mono">
                  {activeProject.currentPhase?.split(':')[0] || 'Active'}
                </span>
              </div>
              <div className="text-sm font-bold text-white truncate font-serif" title={activeProject.name}>
                {activeProject.name}
              </div>
              
              {/* Mini Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#888888] mb-1">
                  <span>Progress</span>
                  <span className="font-mono font-medium text-white">{progressStats.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#D1D5DB] rounded-full transition-all duration-300"
                    style={{ width: `${progressStats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#181818] text-white border border-[#333333] shadow-xs'
                      : 'text-[#999999] hover:text-white hover:bg-[#121212] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#888888]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive 
                        ? 'bg-[#252525] text-white border border-[#3a3a3a]' 
                        : 'bg-[#141414] text-[#888888] border border-[#222222]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 rounded-xl bg-[#101010] border border-[#222222] text-[11px] text-[#888888] space-y-1.5 font-mono">
          <div className="flex items-center gap-1.5 text-[#D1D5DB]">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>AI Workspace Engine</span>
          </div>
          <div className="text-[10px] text-[#666666]">
            Cloud Run &bull; Firestore RBAC
          </div>
        </div>
      </aside>
    </>
  );
};
