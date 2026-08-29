export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  projectId: string;
  uid: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  phase: string;
  dueDate?: string;
  createdAt: number;
  completedAt?: number | null;
}

export interface ProjectAnalysis {
  problemDefinition: string;
  targetUsers: string[];
  proposedSolution: string;
  keyObjectives: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  suggestedTechStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    aiMl?: string;
    hosting?: string;
    other?: string[];
  };
  dataRequirements: string[];
  aiConsiderations?: string;
  majorRisks: {
    risk: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    mitigation: string;
  }[];
  securityConsiderations: string[];
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendedPhases: string[];
  suggestedFirstActions: string[];
  analyzedAt: number;
}

export type HealthStatus = 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'BLOCKED' | 'GOOD' | 'PARTIAL' | 'NEEDS_ATTENTION';

export interface HealthArea {
  status: HealthStatus;
  summary: string;
  recommendations: string[];
}

export interface ProjectHealthReview {
  overallStatus: HealthStatus;
  score: number; // 0 - 100 advisory score
  overallSummary?: string;
  areas?: {
    progress?: HealthArea;
    documentation?: HealthArea;
    testing?: HealthArea;
    security?: HealthArea;
    architecture?: HealthArea;
    deploymentReadiness?: HealthArea;
  };
  strengths?: string[];
  risks?: {
    area: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    risk: string;
  }[];
  actionableNextSteps?: string[];
  keyActionItems?: string[];
  securityReview?: string;
  lastEvaluated?: number;
  assessedAt?: number;
}

export interface Project {
  id: string;
  uid: string;
  name: string;
  shortDescription: string;
  problemBeingSolved?: string;
  targetUsers?: string;
  techPreferences?: string;
  constraints?: string;
  deadline?: string;
  currentPhase?: string;
  analysis?: ProjectAnalysis | null;
  healthReview?: ProjectHealthReview | null;
  createdAt: number;
  updatedAt: number;
}

export type NoteCategory = 'GENERAL' | 'RESEARCH' | 'MEETING' | 'SPECIFICATION';

export interface Note {
  id: string;
  projectId: string;
  uid: string;
  title: string;
  content: string;
  category?: NoteCategory;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export type ProjectNote = Note;

export type DecisionStatus = 'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED' | 'REJECTED';

export interface Decision {
  id: string;
  projectId: string;
  uid: string;
  decision: string;
  context?: string;
  reasoning: string;
  alternativesConsidered?: string[] | string;
  status: DecisionStatus;
  date?: string;
  createdAt: number;
}

export type ArchitectureDecision = Decision;

export interface Experiment {
  id: string;
  projectId: string;
  uid: string;
  name: string;
  hypothesis: string;
  result?: string;
  conclusion?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'CONCLUDED';
  createdAt: number;
}

export type AssistantRole = 'ARCHITECT' | 'TECH_LEAD' | 'SECURITY' | 'FULLSTACK_DEV';
export type AssistantSpeed = 'FAST' | 'GENERAL' | 'DEEP_REASONING';

export interface GroundingSource {
  title?: string;
  url?: string;
  snippet?: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  uid: string;
  title: string;
  role?: AssistantRole;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  projectId: string;
  uid: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  groundingSources?: GroundingSource[];
  webSearchQueries?: string[];
  timestamp: number;
}

