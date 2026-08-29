import { Project, ProjectAnalysis, ProjectHealthReview, Task } from '../types';
import { getCurrentUserToken } from '../lib/firebase';

/**
 * Builds request headers with optional Bearer Firebase ID token when authenticated.
 */
async function buildAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = await getCurrentUserToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface ProjectAnalysisResult {
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
  roadmapTasks?: Array<{
    title: string;
    description: string;
    phase: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'TODO';
  }>;
}

export async function requestProjectAnalysis(projectInput: {
  name: string;
  shortDescription: string;
  problemBeingSolved?: string;
  targetUsers?: string;
  techPreferences?: string;
  constraints?: string;
  deadline?: string;
}): Promise<ProjectAnalysisResult> {
  const headers = await buildAuthHeaders();
  const response = await fetch('/api/gemini/analyze-project', {
    method: 'POST',
    headers,
    body: JSON.stringify(projectInput),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to analyze project: HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Malformed response received from Gemini analysis service');
  }

  return result.data;
}

export interface ChatResponseResult {
  reply: string;
  modelUsed?: string;
  groundingSources?: Array<{ title?: string; url?: string; snippet?: string }>;
  webSearchQueries?: string[];
}

export async function sendProjectChatMessage(params: {
  projectContext: any;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  message: string;
  role?: 'ARCHITECT' | 'TECH_LEAD' | 'SECURITY' | 'FULLSTACK_DEV';
  speed?: 'FAST' | 'GENERAL' | 'DEEP_REASONING';
  useSearch?: boolean;
}): Promise<ChatResponseResult> {
  const headers = await buildAuthHeaders();
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat request failed: HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.reply) {
    throw new Error('Malformed reply received from AI Assistant');
  }

  return {
    reply: result.reply,
    modelUsed: result.modelUsed,
    groundingSources: result.groundingSources || [],
    webSearchQueries: result.webSearchQueries || []
  };
}

export async function requestResearchGrounding(params: {
  query: string;
  projectContext?: any;
}): Promise<{
  summary: string;
  modelUsed?: string;
  groundingSources?: Array<{ title?: string; url?: string; snippet?: string }>;
  webSearchQueries?: string[];
}> {
  const headers = await buildAuthHeaders();
  const response = await fetch('/api/gemini/research', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Research request failed: HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.summary) {
    throw new Error('Malformed response from Research Grounding service');
  }

  return {
    summary: result.summary,
    modelUsed: result.modelUsed,
    groundingSources: result.groundingSources || [],
    webSearchQueries: result.webSearchQueries || []
  };
}


export async function requestProjectHealthReview(params: {
  project: Project;
  tasks: Task[];
  notes: any[];
  decisions: any[];
  experiments: any[];
}): Promise<ProjectHealthReview> {
  const headers = await buildAuthHeaders();
  const response = await fetch('/api/gemini/health-assessment', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Health assessment failed: HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Malformed response received from Health service');
  }

  return {
    ...result.data,
    assessedAt: Date.now()
  };
}

export async function requestSuggestedTasks(params: {
  projectName: string;
  phase?: string;
  objective?: string;
  existingTasks: Task[];
}): Promise<Array<{ title: string; description: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; phase: string }>> {
  const headers = await buildAuthHeaders();
  const response = await fetch('/api/gemini/suggest-tasks', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to suggest tasks: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.tasks || [];
}

