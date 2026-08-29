import { HealthArea, ProjectHealthReview } from '../types';
import { safeString, safeStringList } from './normalizeAnalysis';

const HEALTH_STATUSES = ['GOOD', 'PARTIAL', 'NEEDS_ATTENTION'] as const;

function healthStatus(value: unknown): HealthArea['status'] {
  const normalized = String(value || '').toUpperCase().replace(/[ -]+/g, '_');
  if (HEALTH_STATUSES.includes(normalized as typeof HEALTH_STATUSES[number])) {
    return normalized as typeof HEALTH_STATUSES[number];
  }
  if (normalized === 'ON_TRACK') return 'GOOD';
  if (normalized === 'AT_RISK') return 'PARTIAL';
  return 'NEEDS_ATTENTION';
}

function healthArea(value: unknown): HealthArea {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    status: healthStatus(source.status),
    summary: safeString(source.summary || source.explanation) || 'No detailed assessment was provided.',
    recommendations: safeStringList(source.recommendations || source.actions).slice(0, 10),
  };
}

export function parseGeminiJson(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(unfenced);
}

export function normalizeHealthReview(raw: unknown): ProjectHealthReview {
  const source = raw && typeof raw === 'object' ? raw as Record<string, any> : {};
  const rawScore = Number(source.score ?? source.healthScore ?? source.health_score ?? 0);
  const score = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, Math.round(rawScore))) : 0;
  const sourceAreas = source.areas && typeof source.areas === 'object' ? source.areas : {};
  return {
    overallStatus: healthStatus(source.overallStatus ?? source.overall_status ?? source.status),
    score,
    overallSummary: safeString(source.overallSummary ?? source.overall_summary ?? source.summary) ||
      'Health assessment completed with limited explanatory detail.',
    areas: {
      progress: healthArea(sourceAreas.progress ?? source.progress),
      documentation: healthArea(sourceAreas.documentation ?? source.documentation),
      testing: healthArea(sourceAreas.testing ?? source.testing),
      security: healthArea(sourceAreas.security ?? source.security),
      architecture: healthArea(sourceAreas.architecture ?? source.architecture),
      deploymentReadiness: healthArea(sourceAreas.deploymentReadiness ?? sourceAreas.deployment_readiness ??
        source.deploymentReadiness ?? source.deployment_readiness),
    },
    strengths: safeStringList(source.strengths).slice(0, 20),
    risks: Array.isArray(source.risks) ? source.risks.slice(0, 20).map((risk: any) => ({
      area: safeString(risk?.area) || 'General',
      severity: ['LOW', 'MEDIUM', 'HIGH'].includes(String(risk?.severity).toUpperCase())
        ? String(risk.severity).toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' : 'MEDIUM',
      risk: safeString(risk?.risk || risk?.description) || 'Unspecified project risk',
    })) : [],
    actionableNextSteps: safeStringList(source.actionableNextSteps ?? source.actionable_next_steps ?? source.recommendations).slice(0, 20),
    keyActionItems: safeStringList(source.keyActionItems ?? source.key_action_items).slice(0, 10),
    securityReview: safeString(source.securityReview ?? source.security_review),
    lastEvaluated: Date.now(),
    assessedAt: Date.now(),
  };
}
