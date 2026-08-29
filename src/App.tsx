import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { ProjectAnalysisView } from './components/projects/ProjectAnalysisView';
import { RoadmapView } from './components/tasks/RoadmapView';
import { ProjectAssistant } from './components/assistant/ProjectAssistant';
import { NotesDecisionsView } from './components/memory/NotesDecisionsView';
import { ProjectHealthView } from './components/health/ProjectHealthView';
import { ProjectSettingsView } from './components/settings/ProjectSettingsView';
import { NewProjectModal } from './components/projects/NewProjectModal';
import { CreateTaskModal } from './components/tasks/CreateTaskModal';
import { ExportMarkdownModal } from './components/export/ExportMarkdownModal';
import { TechResearchModal } from './components/assistant/TechResearchModal';
import { BrainCircuit, Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    projects, 
    activeProject, 
    loading: projectLoading 
  } = useProject();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [exportFocus, setExportFocus] = useState<'all' | 'roadmap' | 'notes' | 'architecture' | 'decisions'>('all');

  const handleOpenExport = (focus: 'all' | 'roadmap' | 'notes' | 'architecture' | 'decisions' = 'all') => {
    setExportFocus(focus);
    setShowExportModal(true);
  };


  // Authentication Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#999999] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#222222] text-[#D1D5DB] flex items-center justify-center animate-pulse">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#888888]">
          <Loader2 className="w-4 h-4 animate-spin text-[#D1D5DB]" />
          <span>Authenticating ProjectPilot...</span>
        </div>
      </div>
    );
  }

  // Not signed in -> Show Login Page
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#D1D5DB] flex flex-col font-sans selection:bg-neutral-800 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenNewProject={() => setShowNewProjectModal(true)}
        onOpenExport={() => handleOpenExport('all')}
        onOpenResearch={() => setShowResearchModal(true)}
      />


      <div className="flex flex-1 overflow-hidden relative">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          onOpenNewProject={() => {
            setShowNewProjectModal(true);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#050505]">
          {projectLoading && projects.length === 0 ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#888888] space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#D1D5DB]" />
              <span className="text-xs font-mono">Loading projects and workspace memory...</span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <ProjectDashboard
                  onNavigate={(tab) => setActiveTab(tab)}
                  onOpenNewTask={() => setShowNewTaskModal(true)}
                  onOpenNewProject={() => setShowNewProjectModal(true)}
                  onOpenExport={() => handleOpenExport('all')}
                />
              )}

              {activeTab === 'intelligence' && <ProjectAnalysisView />}

              {activeTab === 'roadmap' && (
                <RoadmapView 
                  onOpenNewTask={() => setShowNewTaskModal(true)} 
                  onOpenExport={() => handleOpenExport('roadmap')}
                />
              )}

              {activeTab === 'assistant' && <ProjectAssistant />}

              {activeTab === 'memory' && (
                <NotesDecisionsView 
                  onOpenExport={() => handleOpenExport('notes')}
                />
              )}

              {activeTab === 'health' && <ProjectHealthView />}

              {activeTab === 'settings' && (
                <ProjectSettingsView
                  onProjectDeleted={() => setActiveTab('dashboard')}
                  onOpenExport={() => handleOpenExport('all')}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
      />

      <CreateTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
      />

      <ExportMarkdownModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        defaultFocus={exportFocus}
      />

      <TechResearchModal
        isOpen={showResearchModal}
        onClose={() => setShowResearchModal(false)}
      />
    </div>

  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <MainLayout />
      </ProjectProvider>
    </AuthProvider>
  );
}
