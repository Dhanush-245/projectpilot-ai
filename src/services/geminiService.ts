import { Project, ProjectAnalysis, ProjectHealthReview, Task } from '../types';
import { getCurrentUserToken } from '../lib/firebase';
import { safeGroundingSources } from '../utils/grounding';

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

async function authenticatedPost(path: string, payload: unknown): Promise<Response> {
  const body = JSON.stringify(payload);
  let response = await fetch(path, { method: 'POST', headers: await buildAuthHeaders(), body });
  if (response.status === 401) {
    const refreshedToken = await getCurrentUserToken(true);
    if (refreshedToken) {
      response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${refreshedToken}` },
        body,
      });
    }
  }
  return response;
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
  const response = await authenticatedPost('/api/gemini/analyze-project', projectInput);

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
  const response = await authenticatedPost('/api/gemini/chat', params);

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
    groundingSources: safeGroundingSources(result.groundingSources),
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
  const response = await authenticatedPost('/api/gemini/research', params);

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
    groundingSources: safeGroundingSources(result.groundingSources),
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
  const response = await authenticatedPost('/api/gemini/health-assessment', params);

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
  const response = await authenticatedPost('/api/gemini/suggest-tasks', params);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to suggest tasks: HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.tasks || [];
}
