import { ProjectAnalysis } from '../types';

export function safeString(val: any): string {
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === 'string' ? item.trim() : (item ? String(item).trim() : '')))
      .filter(Boolean)
      .join('\n\n');
  }
  if (val && typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }
  return '';
}

export function safeStringList(val: any): string[] {
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          if (item.title && item.description) return `${item.title}: ${item.description}`;
          if (item.name && item.description) return `${item.name}: ${item.description}`;
          if (item.feature) return `${item.feature}${item.description ? `: ${item.description}` : ''}`;
          if (item.requirement) return `${item.requirement}${item.description ? `: ${item.description}` : ''}`;
          if (item.objective) return `${item.objective}${item.description ? `: ${item.description}` : ''}`;
          if (item.action) return `${item.action}${item.description ? `: ${item.description}` : ''}`;
          if (item.phase) return `${item.phase}${item.title ? `: ${item.title}` : ''}`;
          return Object.entries(item)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' — ');
        }
        return item ? String(item).trim() : '';
      })
      .filter(Boolean);
  }

  if (typeof val === 'string' && val.trim().length > 0) {
    if (val.includes('\n')) {
      return val
        .split('\n')
        .map((s) => s.replace(/^[-*•0-9.)\s]+/, '').trim())
        .filter(Boolean);
    }
    if (val.includes(';') || val.includes('•')) {
      return val
        .split(/[;•]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [val.trim()];
  }

  if (val && typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => {
        if (typeof v === 'string') return `${k}: ${v}`;
        if (Array.isArray(v)) return `${k}: ${v.join(', ')}`;
        return `${k}: ${JSON.stringify(v)}`;
      })
      .filter(Boolean);
  }

  return [];
}

export interface RiskItem {
  risk: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation: string;
}

export function safeRiskList(val: any): RiskItem[] {
  if (Array.isArray(val)) {
    return val
      .map((item, idx) => {
        if (item && typeof item === 'object') {
          const sevStr = String(item.severity || item.level || item.priority || 'MEDIUM').toUpperCase();
          const severity: 'LOW' | 'MEDIUM' | 'HIGH' = ['LOW', 'MEDIUM', 'HIGH'].includes(sevStr)
            ? (sevStr as 'LOW' | 'MEDIUM' | 'HIGH')
            : 'MEDIUM';

          const risk =
            item.risk ||
            item.title ||
            item.name ||
            item.description ||
            item.threat ||
            item.riskFactor ||
            `Technical Risk Factor ${idx + 1}`;

          const mitigation =
            item.mitigation ||
            item.solution ||
            item.action ||
            item.countermeasure ||
            item.prevention ||
            'Implement defensive input validation, rate limiting, and continuous observability.';

          return { risk, severity, mitigation };
        }

        if (typeof item === 'string' && item.trim().length > 0) {
          return {
            risk: item.trim(),
            severity: 'MEDIUM' as const,
            mitigation: 'Implement defensive validation and monitor telemetry.'
          };
        }

        return null;
      })
      .filter(Boolean) as RiskItem[];
  }

  if (typeof val === 'string' && val.trim().length > 0) {
    return [
      {
        risk: val.trim(),
        severity: 'MEDIUM',
        mitigation: 'Implement defensive validation and monitor telemetry.'
      }
    ];
  }

  return [];
}

export function safeTechStack(val: any): ProjectAnalysis['suggestedTechStack'] {
  if (!val || typeof val !== 'object') {
    return {
      frontend: 'React + TypeScript',
      backend: 'Node.js Express / Cloud Run',
      database: 'Cloud Firestore',
      aiMl: 'Gemini 3.5 Flash',
      hosting: 'Google Cloud Run',
      other: ['Tailwind CSS', 'Vite']
    };
  }

  const frontend =
    val.frontend ||
    val.front_end ||
    val.client ||
    val.ui ||
    val.Frontend ||
    'React + TypeScript';

  const backend =
    val.backend ||
    val.back_end ||
    val.server ||
    val.api ||
    val.Backend ||
    'Node.js Express';

  const database =
    val.database ||
    val.data_store ||
    val.storage ||
    val.db ||
    val.Database ||
    'Cloud Firestore';

  const aiMl =
    val.aiMl ||
    val.ai_ml ||
    val.ai ||
    val.ml ||
    val.llm ||
    val.model ||
    val.genAi ||
    val.AiMl ||
    'Gemini 3.5 Flash';

  const hosting =
    val.hosting ||
    val.deployment ||
    val.cloud ||
    val.infrastructure ||
    val.ingress ||
    val.Hosting ||
    'Google Cloud Run';

  let other: string[] = [];
  if (Array.isArray(val.other)) {
    other = safeStringList(val.other);
  } else if (Array.isArray(val.tools)) {
    other = safeStringList(val.tools);
  } else if (Array.isArray(val.libraries)) {
    other = safeStringList(val.libraries);
  }

  return {
    frontend,
    backend,
    database,
    aiMl,
    hosting,
    other: other.length > 0 ? other : ['Tailwind CSS', 'Vite']
  };
}

export function normalizeProjectAnalysis(
  raw: any,
  fallbackContext?: {
    name?: string;
    shortDescription?: string;
    problemBeingSolved?: string;
    targetUsers?: string;
    techPreferences?: string;
  }
): ProjectAnalysis {
  if (!raw || typeof raw !== 'object') {
    return {
      problemDefinition:
        fallbackContext?.problemBeingSolved ||
        fallbackContext?.shortDescription ||
        'Problem definition to be addressed by the technical implementation.',
      targetUsers: fallbackContext?.targetUsers ? [fallbackContext.targetUsers] : ['Software Developers', 'Engineering Teams'],
      proposedSolution:
        fallbackContext?.shortDescription ||
        'A resilient, modular system architecture engineered with security and scalability best practices.',
      keyObjectives: ['Deliver reliable MVP functionality', 'Enforce robust security and data isolation', 'Optimize latency and API efficiency'],
      functionalRequirements: ['Core workflow execution', 'Real-time project state persistence', 'Audit logging and error recovery'],
      nonFunctionalRequirements: ['Sub-second UI response time', 'WCAG AA accessible UI', 'OWASP Top 10 security compliance'],
      suggestedTechStack: safeTechStack(null),
      dataRequirements: ['User profile and session storage', 'Structured project and entity collections'],
      aiConsiderations: 'Zero client-side API key leakage, model fallback ladder resilience, and token usage optimization.',
      majorRisks: [
        {
          risk: 'API Rate Limits & Latency',
          severity: 'MEDIUM',
          mitigation: 'Implement tiered model fallback ladder and request timeout guards.'
        }
      ],
      securityConsiderations: [
        'Owner-bound Firestore security rules (request.auth.uid == userId)',
        'Server-side Gemini API key isolation',
        'Defensive input sanitization against prompt injection'
      ],
      estimatedComplexity: 'MEDIUM',
      recommendedPhases: [
        'Phase 1: Research & Technical Feasibility',
        'Phase 2: System Architecture & Data Schema',
        'Phase 3: Core MVP Implementation',
        'Phase 4: Security Hardening & Testing',
        'Phase 5: Production Deployment'
      ],
      suggestedFirstActions: [
        'Review system architecture and establish repository structure',
        'Configure database security rules and environment variables',
        'Implement primary user workflow and verify end-to-end data flow'
      ],
      analyzedAt: Date.now()
    };
  }

  // 1. Problem Definition
  const problemDefinition =
    safeString(
      raw.problemDefinition ||
      raw.problem_definition ||
      raw.problem ||
      raw.problemStatement ||
      raw.problem_statement ||
      raw.problemBeingSolved ||
      raw.challenge ||
      raw.problemDescription
    ) ||
    fallbackContext?.problemBeingSolved ||
    fallbackContext?.shortDescription ||
    'Problem definition to be addressed by the technical implementation.';

  // 2. Proposed Solution
  const proposedSolution =
    safeString(
      raw.proposedSolution ||
      raw.proposed_solution ||
      raw.solution ||
      raw.technicalSolution ||
      raw.technical_solution ||
      raw.architectureOverview ||
      raw.architecture_overview ||
      raw.systemArchitecture ||
      raw.system_architecture ||
      raw.approach ||
      raw.overview
    ) ||
    fallbackContext?.shortDescription ||
    'Modular technical architecture designed with high availability, security-first principles, and structured data flow.';

  // 3. Target Users
  const targetUsersRaw =
    raw.targetUsers ||
    raw.target_users ||
    raw.target_user_personas ||
    raw.userPersonas ||
    raw.user_personas ||
    raw.users ||
    raw.personas ||
    raw.audience;
  let targetUsers = safeStringList(targetUsersRaw);
  if (targetUsers.length === 0 && fallbackContext?.targetUsers) {
    targetUsers = safeStringList(fallbackContext.targetUsers);
  }
  if (targetUsers.length === 0) {
    targetUsers = ['System Users', 'Engineering & Operations Teams'];
  }

  // 4. Key Objectives
  const keyObjectivesRaw =
    raw.keyObjectives ||
    raw.key_objectives ||
    raw.objectives ||
    raw.measurableObjectives ||
    raw.measurable_objectives ||
    raw.goals ||
    raw.keyGoals;
  let keyObjectives = safeStringList(keyObjectivesRaw);
  if (keyObjectives.length === 0) {
    keyObjectives = [
      'Deliver reliable core system capabilities with high performance',
      'Enforce zero-trust security and data privacy across all endpoints',
      'Maintain an extensible and well-documented architectural foundation'
    ];
  }

  // 5. Functional Requirements
  const funcReqsRaw =
    raw.functionalRequirements ||
    raw.functional_requirements ||
    raw.features ||
    raw.coreFeatures ||
    raw.core_features ||
    raw.functional_requirements_list ||
    raw.keyFeatures;
  let functionalRequirements = safeStringList(funcReqsRaw);
  if (functionalRequirements.length === 0) {
    functionalRequirements = [
      'Interactive user management and authorization lifecycle',
      'Real-time data synchronization and persistence',
      'Automated error handling with actionable user feedback'
    ];
  }

  // 6. Non-Functional Requirements
  const nonFuncReqsRaw =
    raw.nonFunctionalRequirements ||
    raw.non_functional_requirements ||
    raw.nonFunctional ||
    raw.nfrs ||
    raw.systemRequirements ||
    raw.performanceRequirements;
  let nonFunctionalRequirements = safeStringList(nonFuncReqsRaw);
  if (nonFunctionalRequirements.length === 0) {
    nonFunctionalRequirements = [
      'Sub-500ms API response time under standard workload',
      'WCAG AA accessible user interface with responsive layouts',
      'Strict adherence to OWASP Top 10 web application security guidelines'
    ];
  }

  // 7. Suggested Tech Stack
  const techStackRaw =
    raw.suggestedTechStack ||
    raw.suggested_tech_stack ||
    raw.techStack ||
    raw.tech_stack ||
    raw.technologyStack ||
    raw.technology_stack ||
    raw.stack;
  const suggestedTechStack = safeTechStack(techStackRaw);

  // 8. Data Requirements
  const dataReqsRaw =
    raw.dataRequirements ||
    raw.data_requirements ||
    raw.data ||
    raw.dataModel ||
    raw.data_model ||
    raw.dataModels ||
    raw.data_models ||
    raw.schema ||
    raw.databaseSchema ||
    raw.storageRequirements ||
    raw.storage_requirements;
  let dataRequirements = safeStringList(dataReqsRaw);
  if (dataRequirements.length === 0) {
    dataRequirements = [
      'User credentials and access control metadata with tenant/owner isolation',
      'Core domain entities with indexed relational or document lookups',
      'Audit log trail and operational metrics'
    ];
  }

  // 9. AI Considerations
  const aiConsiderations =
    safeString(
      raw.aiConsiderations ||
      raw.ai_considerations ||
      raw.aiMlConsiderations ||
      raw.ai_ml_considerations ||
      raw.aiMl ||
      raw.ai_ml ||
      raw.ai ||
      raw.llmConsiderations ||
      raw.llm_considerations
    ) ||
    'Ensure zero client-side API key leakage, model fallback ladder resilience, defensive prompt injection sanitization, and token usage optimization.';

  // 10. Major Risks & Mitigations
  const risksRaw =
    raw.majorRisks ||
    raw.major_risks ||
    raw.risks ||
    raw.riskMatrix ||
    raw.risk_matrix ||
    raw.technicalRisks ||
    raw.operationalRisks;
  let majorRisks = safeRiskList(risksRaw);
  if (majorRisks.length === 0) {
    majorRisks = [
      {
        risk: 'External Service Availability & Rate Limiting',
        severity: 'MEDIUM',
        mitigation: 'Incorporate automated model fallback ladders and exponential backoff retry policies.'
      },
      {
        risk: 'Unauthorized Data Exposure',
        severity: 'HIGH',
        mitigation: 'Enforce strict owner-bound database security rules and validate auth headers on every API route.'
      }
    ];
  }

  // 11. Security Considerations
  const secRaw =
    raw.securityConsiderations ||
    raw.security_considerations ||
    raw.security ||
    raw.securityAndPrivacy ||
    raw.security_and_privacy ||
    raw.privacyConsiderations ||
    raw.security_standards ||
    raw.owasp;
  let securityConsiderations = safeStringList(secRaw);
  if (securityConsiderations.length === 0) {
    securityConsiderations = [
      'Owner-bound Firestore security rules (request.auth.uid == userId)',
      'Server-side Gemini API key isolation via Google Cloud Secret Manager / env vars',
      'Input validation & indirect prompt injection defense (OWASP Top 10)',
      'Zero-hardcoded secret hygiene across client and server modules'
    ];
  }

  // 12. Estimated Complexity
  const compStr = String(raw.estimatedComplexity || raw.estimated_complexity || raw.complexity || 'MEDIUM').toUpperCase();
  const estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].includes(compStr)
    ? (compStr as 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH')
    : 'MEDIUM';

  // 13. Recommended Phases
  const phasesRaw =
    raw.recommendedPhases ||
    raw.recommended_phases ||
    raw.phases ||
    raw.developmentPhases ||
    raw.development_phases ||
    raw.roadmapPhases;
  let recommendedPhases = safeStringList(phasesRaw);
  if (recommendedPhases.length === 0) {
    recommendedPhases = [
      'Phase 1: Research & Technical Feasibility',
      'Phase 2: System Architecture & Data Schema',
      'Phase 3: Core MVP Implementation',
      'Phase 4: Security Hardening & Testing',
      'Phase 5: Production Deployment & Observability'
    ];
  }

  // 14. Suggested Immediate Actions
  const actionsRaw =
    raw.suggestedFirstActions ||
    raw.suggested_first_actions ||
    raw.suggestedImmediateActions ||
    raw.suggested_immediate_actions ||
    raw.immediateActions ||
    raw.immediate_actions ||
    raw.firstActions ||
    raw.first_actions ||
    raw.actionItems ||
    raw.nextSteps ||
    raw.initialActions;
  let suggestedFirstActions = safeStringList(actionsRaw);
  if (suggestedFirstActions.length === 0) {
    suggestedFirstActions = [
      'Establish repository structure and configure environment variables',
      'Deploy owner-bound database rules and verify authentication flow',
      'Implement initial milestone tasks from the execution roadmap'
    ];
  }

  return {
    problemDefinition,
    targetUsers,
    proposedSolution,
    keyObjectives,
    functionalRequirements,
    nonFunctionalRequirements,
    suggestedTechStack,
    dataRequirements,
    aiConsiderations,
    majorRisks,
    securityConsiderations,
    estimatedComplexity,
    recommendedPhases,
    suggestedFirstActions,
    analyzedAt: Number(raw.analyzedAt) || Date.now()
  };
}
