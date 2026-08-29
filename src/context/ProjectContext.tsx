import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { 
  Project, 
  Task, 
  Note, 
  Decision, 
  Experiment, 
  Conversation, 
  ChatMessage, 
  ProjectAnalysis,
  ProjectHealthReview,
  AssistantRole,
  AssistantSpeed
} from '../types';
import { normalizeProjectAnalysis } from '../utils/normalizeAnalysis';
import { 
  subscribeToProjects, 
  createProject, 
  updateProject, 
  deleteProject,
  subscribeToTasks, 
  createTask, 
  createBatchTasks, 
  updateTask, 
  deleteTask,
  subscribeToNotes, 
  createNote, 
  updateNote, 
  deleteNote,
  subscribeToDecisions, 
  createDecision, 
  updateDecision,
  deleteDecision,
  subscribeToExperiments, 
  createExperiment, 
  updateExperiment, 
  deleteExperiment,
  subscribeToConversations, 
  createConversation, 
  deleteConversation,
  subscribeToMessages, 
  addChatMessage 
} from '../services/firestoreService';
import { 
  requestProjectAnalysis, 
  sendProjectChatMessage, 
  requestProjectHealthReview 
} from '../services/geminiService';

interface ProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  percentage: number;
}

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProjectId: (id: string | null) => void;
  tasks: Task[];
  notes: Note[];
  decisions: Decision[];
  experiments: Experiment[];
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: ChatMessage[];
  loading: boolean;
  loadingProjects: boolean;
  loadingDetails: boolean;
  isAnalyzing: boolean;
  isSendingChat: boolean;
  isEvaluatingHealth: boolean;
  progressStats: ProgressStats;
  
  // Project Actions
  createNewProject: (
    data: Omit<Project, 'id' | 'uid' | 'createdAt' | 'updatedAt'>,
    generatePlanWithGemini?: boolean
  ) => Promise<string>;
  updateActiveProjectData: (updates: Partial<Project>) => Promise<void>;
  updateProjectDetails: (updates: Partial<Project>) => Promise<void>;
  deleteActiveProjectData: (projectId: string) => Promise<void>;
  deleteCurrentProject: () => Promise<void>;
  
  // Task Actions
  addNewTask: (taskData: Omit<Task, 'id' | 'uid' | 'projectId' | 'createdAt'>) => Promise<string>;
  modifyTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  
  // Note Actions
  addNewNote: (noteData: Omit<Note, 'id' | 'uid' | 'projectId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  modifyNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  removeNote: (noteId: string) => Promise<void>;
  
  // Decision Actions
  addNewDecision: (decisionData: Omit<Decision, 'id' | 'uid' | 'projectId' | 'createdAt'>) => Promise<string>;
  modifyDecision: (decisionId: string, updates: Partial<Decision>) => Promise<void>;
  removeDecision: (decisionId: string) => Promise<void>;
  
  // Experiment Actions
  addNewExperiment: (expData: Omit<Experiment, 'id' | 'uid' | 'projectId' | 'createdAt'>) => Promise<string>;
  modifyExperiment: (expId: string, updates: Partial<Experiment>) => Promise<void>;
  removeExperiment: (expId: string) => Promise<void>;
  
  // Conversation & AI Actions
  createNewConversation: (title?: string, role?: AssistantRole) => Promise<string>;
  removeConversation: (conversationId: string) => Promise<void>;
  sendMessageToAssistant: (
    content: string, 
    options?: { 
      role?: AssistantRole; 
      speed?: AssistantSpeed; 
      useSearch?: boolean 
    }
  ) => Promise<void>;
  reAnalyzeProject: (projectId?: string) => Promise<void>;
  runHealthReview: () => Promise<ProjectHealthReview | null>;
}


const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const ensureStrArray = (val: any): string[] => {
  if (Array.isArray(val)) return val.map((item) => typeof item === 'string' ? item : (item ? String(item) : '')).filter(Boolean);
  if (typeof val === 'string' && val.trim().length > 0) {
    if (val.includes('\n')) return val.split('\n').map(s => s.replace(/^[-*•0-9.)\s]+/, '').trim()).filter(Boolean);
    return [val.trim()];
  }
  return [];
};

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [isEvaluatingHealth, setIsEvaluatingHealth] = useState<boolean>(false);

  // Subscribe to user projects
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setActiveProjectId(null);
      setLoadingProjects(false);
      return;
    }

    setLoadingProjects(true);
    const unsubscribe = subscribeToProjects(user.uid, (projectList) => {
      setProjects(projectList);
      // Auto-select first project if none selected or previously selected no longer exists
      setActiveProjectId((prev) => {
        if (!prev && projectList.length > 0) return projectList[0].id;
        if (prev && !projectList.some((p) => p.id === prev)) {
          return projectList.length > 0 ? projectList[0].id : null;
        }
        return prev;
      });
      setLoadingProjects(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Derived active project
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  // Subscribe to details of active project
  useEffect(() => {
    if (!user || !activeProjectId) {
      setTasks([]);
      setNotes([]);
      setDecisions([]);
      setExperiments([]);
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    setLoadingDetails(true);

    const unsubTasks = subscribeToTasks(user.uid, activeProjectId, (taskList) => {
      setTasks(taskList);
      setLoadingDetails(false);
    });

    const unsubNotes = subscribeToNotes(user.uid, activeProjectId, (noteList) => {
      setNotes(noteList);
    });

    const unsubDecisions = subscribeToDecisions(user.uid, activeProjectId, (decisionList) => {
      setDecisions(decisionList);
    });

    const unsubExperiments = subscribeToExperiments(user.uid, activeProjectId, (expList) => {
      setExperiments(expList);
    });

    const unsubConversations = subscribeToConversations(user.uid, activeProjectId, (convList) => {
      setConversations(convList);
      setActiveConversationId((prev) => {
        if (!prev && convList.length > 0) return convList[0].id;
        if (prev && !convList.some((c) => c.id === prev)) {
          return convList.length > 0 ? convList[0].id : null;
        }
        return prev;
      });
    });

    return () => {
      unsubTasks();
      unsubNotes();
      unsubDecisions();
      unsubExperiments();
      unsubConversations();
    };
  }, [user, activeProjectId]);

  // Subscribe to messages of active conversation
  useEffect(() => {
    if (!user || !activeProjectId || !activeConversationId) {
      setMessages([]);
      return;
    }

    const unsubMessages = subscribeToMessages(user.uid, activeProjectId, activeConversationId, (msgList) => {
      setMessages(msgList);
    });

    return () => unsubMessages();
  }, [user, activeProjectId, activeConversationId]);

  // Real Progress Calculation
  const progressStats = useMemo<ProgressStats>(() => {
    const total = tasks.length;
    if (total === 0) {
      return { total: 0, completed: 0, inProgress: 0, todo: 0, percentage: 0 };
    }
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const percentage = Math.round((completed / total) * 100);

    return { total, completed, inProgress, todo, percentage };
  }, [tasks]);

  // Create New Project with optional Gemini Analysis
  const createNewProject = async (
    data: Omit<Project, 'id' | 'uid' | 'createdAt' | 'updatedAt'>,
    generatePlanWithGemini: boolean = false
  ): Promise<string> => {
    if (!user) throw new Error('You must be logged in to create a project');

    let analysis: ProjectAnalysis | null = null;
    let initialRoadmapTasks: any[] = [];

    if (generatePlanWithGemini) {
      setIsAnalyzing(true);
      try {
        const geminiResult = await requestProjectAnalysis({
          name: data.name,
          shortDescription: data.shortDescription,
          problemBeingSolved: data.problemBeingSolved,
          targetUsers: data.targetUsers,
          techPreferences: data.techPreferences,
          constraints: data.constraints,
          deadline: data.deadline,
        });

        analysis = normalizeProjectAnalysis(geminiResult, {
          name: data.name,
          shortDescription: data.shortDescription,
          problemBeingSolved: data.problemBeingSolved,
          targetUsers: data.targetUsers,
          techPreferences: data.techPreferences,
        });

        initialRoadmapTasks = (geminiResult as any).roadmapTasks || [];
      } catch (err) {
        console.error('Gemini project analysis failed on creation:', err);
        // Continue creating project manually if analysis fails
      } finally {
        setIsAnalyzing(false);
      }
    }

    const projectId = await createProject(user.uid, {
      ...data,
      currentPhase: analysis?.recommendedPhases?.[0] || 'Phase 1: Research',
      analysis
    });

    // If initial roadmap tasks were produced, batch insert them
    if (initialRoadmapTasks.length > 0) {
      const taskBatch = initialRoadmapTasks.map((t) => ({
        title: t.title,
        description: t.description || '',
        status: 'TODO' as const,
        priority: (t.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
        phase: t.phase || 'Phase 1: Research'
      }));
      await createBatchTasks(user.uid, projectId, taskBatch);
    }

    // Create an initial starter conversation
    await createConversation(user.uid, projectId, 'General Project Inquiry');

    setActiveProjectId(projectId);
    return projectId;
  };

  const updateActiveProjectData = async (updates: Partial<Project>) => {
    if (!user || !activeProjectId) return;
    await updateProject(user.uid, activeProjectId, updates);
  };

  const updateProjectDetails = updateActiveProjectData;

  const deleteActiveProjectData = async (projectId: string) => {
    if (!user) return;
    await deleteProject(user.uid, projectId);
    if (activeProjectId === projectId) {
      const remaining = projects.filter((p) => p.id !== projectId);
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const deleteCurrentProject = async () => {
    if (!activeProjectId) return;
    await deleteActiveProjectData(activeProjectId);
  };

  // Task Actions
  const addNewTask = async (taskData: Omit<Task, 'id' | 'uid' | 'projectId' | 'createdAt'>) => {
    if (!user || !activeProjectId) throw new Error('No active project');
    return await createTask(user.uid, activeProjectId, taskData);
  };

  const modifyTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user || !activeProjectId) return;
    await updateTask(user.uid, activeProjectId, taskId, updates);
  };

  const removeTask = async (taskId: string) => {
    if (!user || !activeProjectId) return;
    await deleteTask(user.uid, activeProjectId, taskId);
  };

  // Note Actions
  const addNewNote = async (noteData: Omit<Note, 'id' | 'uid' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !activeProjectId) throw new Error('No active project');
    return await createNote(user.uid, activeProjectId, noteData);
  };

  const modifyNote = async (noteId: string, updates: Partial<Note>) => {
    if (!user || !activeProjectId) return;
    await updateNote(user.uid, activeProjectId, noteId, updates);
  };

  const removeNote = async (noteId: string) => {
    if (!user || !activeProjectId) return;
    await deleteNote(user.uid, activeProjectId, noteId);
  };

  // Decision Actions
  const addNewDecision = async (decisionData: Omit<Decision, 'id' | 'uid' | 'projectId' | 'createdAt'>) => {
    if (!user || !activeProjectId) throw new Error('No active project');
    return await createDecision(user.uid, activeProjectId, decisionData);
  };

  const modifyDecision = async (decisionId: string, updates: Partial<Decision>) => {
    if (!user || !activeProjectId) return;
    await updateDecision(user.uid, activeProjectId, decisionId, updates);
  };

  const removeDecision = async (decisionId: string) => {
    if (!user || !activeProjectId) return;
    await deleteDecision(user.uid, activeProjectId, decisionId);
  };

  // Experiment Actions
  const addNewExperiment = async (expData: Omit<Experiment, 'id' | 'uid' | 'projectId' | 'createdAt'>) => {
    if (!user || !activeProjectId) throw new Error('No active project');
    return await createExperiment(user.uid, activeProjectId, expData);
  };

  const modifyExperiment = async (expId: string, updates: Partial<Experiment>) => {
    if (!user || !activeProjectId) return;
    await updateExperiment(user.uid, activeProjectId, expId, updates);
  };

  const removeExperiment = async (expId: string) => {
    if (!user || !activeProjectId) return;
    await deleteExperiment(user.uid, activeProjectId, expId);
  };

  // Conversation & AI Assistant Actions
  const createNewConversation = async (title: string = 'New Conversation', role: AssistantRole = 'TECH_LEAD') => {
    if (!user || !activeProjectId) throw new Error('No active project');
    const convId = await createConversation(user.uid, activeProjectId, title, role);
    setActiveConversationId(convId);
    return convId;
  };

  const removeConversation = async (conversationId: string) => {
    if (!user || !activeProjectId) return;
    await deleteConversation(user.uid, activeProjectId, conversationId);
    if (activeConversationId === conversationId) {
      const remaining = conversations.filter((c) => c.id !== conversationId);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const sendMessageToAssistant = async (
    content: string,
    options?: {
      role?: AssistantRole;
      speed?: AssistantSpeed;
      useSearch?: boolean;
    }
  ) => {
    if (!user || !activeProjectId) throw new Error('No active project');

    let convId = activeConversationId;
    if (!convId) {
      convId = await createNewConversation('Project Discussion', options?.role || 'TECH_LEAD');
    }

    // Determine conversation role
    const currentConv = conversations.find(c => c.id === convId);
    const activeRole = options?.role || currentConv?.role || 'TECH_LEAD';

    // 1. Add user message to Firestore
    await addChatMessage(user.uid, activeProjectId, convId, 'user', content);

    // 2. Prepare rich, real project context
    const highPriorityPending = tasks
      .filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED')
      .map((t) => t.title);

    const projectContext = {
      name: activeProject?.name,
      shortDescription: activeProject?.shortDescription,
      problemBeingSolved: activeProject?.problemBeingSolved,
      currentPhase: activeProject?.currentPhase,
      analysis: activeProject?.analysis,
      tasksSummary: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === 'COMPLETED').length,
        inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        todo: tasks.filter((t) => t.status === 'TODO').length,
        highPriorityPending
      },
      recentNotes: notes.slice(0, 5).map((n) => ({ title: n.title, content: n.content })),
      decisions: decisions.slice(0, 5).map((d) => ({
        decision: d.decision,
        reasoning: d.reasoning,
        status: d.status
      })),
      experiments: experiments.slice(0, 5).map((e) => ({
        name: e.name,
        hypothesis: e.hypothesis,
        result: e.result
      }))
    };

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    setIsSendingChat(true);
    try {
      const responseResult = await sendProjectChatMessage({
        projectContext,
        conversationHistory: historyPayload,
        message: content,
        role: activeRole,
        speed: options?.speed || 'GENERAL',
        useSearch: options?.useSearch
      });

      // 3. Persist Assistant Reply in Firestore with rich metadata
      await addChatMessage(user.uid, activeProjectId, convId, 'assistant', responseResult.reply, {
        modelUsed: responseResult.modelUsed,
        groundingSources: responseResult.groundingSources,
        webSearchQueries: responseResult.webSearchQueries
      });
    } catch (err: any) {
      console.error('Error getting AI reply:', err);
      await addChatMessage(
        user.uid,
        activeProjectId,
        convId,
        'assistant',
        '⚠️ *Unable to generate response.* Please verify your authentication and connection, then try again.'
      );
    } finally {
      setIsSendingChat(false);
    }
  };


  const reAnalyzeProject = async (targetProjectId?: string) => {
    const pId = targetProjectId || activeProjectId;
    if (!user || !pId) return;

    const proj = projects.find((p) => p.id === pId) || activeProject;
    if (!proj) return;

    setIsAnalyzing(true);
    try {
      const result = await requestProjectAnalysis({
        name: proj.name,
        shortDescription: proj.shortDescription,
        problemBeingSolved: proj.problemBeingSolved,
        targetUsers: proj.targetUsers,
        techPreferences: proj.techPreferences,
        constraints: proj.constraints,
        deadline: proj.deadline
      });

      const analysis: ProjectAnalysis = normalizeProjectAnalysis(result, {
        name: proj.name,
        shortDescription: proj.shortDescription,
        problemBeingSolved: proj.problemBeingSolved,
        targetUsers: proj.targetUsers,
        techPreferences: proj.techPreferences,
      });

      await updateProject(user.uid, pId, { analysis });
    } catch (err) {
      console.error('Re-analysis error:', err);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runHealthReview = async (): Promise<ProjectHealthReview | null> => {
    if (!user || !activeProject) return null;

    setIsEvaluatingHealth(true);
    try {
      const review = await requestProjectHealthReview({
        project: activeProject,
        tasks,
        notes,
        decisions,
        experiments
      });

      await updateProject(user.uid, activeProject.id, { healthReview: review });
      return review;
    } catch (err) {
      console.error('Health assessment error:', err);
      throw err;
    } finally {
      setIsEvaluatingHealth(false);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProjectId,
        tasks,
        notes,
        decisions,
        experiments,
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        loading: loadingProjects || loadingDetails,
        loadingProjects,
        loadingDetails,
        isAnalyzing,
        isSendingChat,
        isEvaluatingHealth,
        progressStats,
        
        createNewProject,
        updateActiveProjectData,
        updateProjectDetails,
        deleteActiveProjectData,
        deleteCurrentProject,
        
        addNewTask,
        modifyTask,
        removeTask,
        
        addNewNote,
        modifyNote,
        removeNote,
        
        addNewDecision,
        modifyDecision,
        removeDecision,
        
        addNewExperiment,
        modifyExperiment,
        removeExperiment,
        
        createNewConversation,
        removeConversation,
        sendMessageToAssistant,
        reAnalyzeProject,
        runHealthReview
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
