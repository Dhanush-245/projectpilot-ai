import { Project, Task, Note, Decision, ProjectHealthReview, ProjectAnalysis } from '../types';
import { normalizeProjectAnalysis } from './normalizeAnalysis';

export interface MarkdownExportOptions {
  includeOverview: boolean;
  includeArchitecture: boolean;
  includeRoadmap: boolean;
  includeNotes: boolean;
  includeDecisions: boolean;
  includeHealth: boolean;
}

export const defaultExportOptions: MarkdownExportOptions = {
  includeOverview: true,
  includeArchitecture: true,
  includeRoadmap: true,
  includeNotes: true,
  includeDecisions: true,
  includeHealth: true,
};

function safeArray(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map((item) => (typeof item === 'string' ? item : (item ? String(item) : ''))).filter(Boolean);
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    if (val.includes('\n')) {
      return val.split('\n').map((s) => s.replace(/^[-*•0-9.)\s]+/, '').trim()).filter(Boolean);
    }
    return [val.trim()];
  }
  return [];
}

export function generateProjectMarkdown(
  project: Project,
  tasks: Task[] = [],
  notes: Note[] = [],
  decisions: Decision[] = [],
  healthReview?: ProjectHealthReview | null,
  options: MarkdownExportOptions = defaultExportOptions
): string {
  const parts: string[] = [];
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 1. Overview & Header
  if (options.includeOverview) {
    parts.push(`# ${project.name || 'Untitled Project'}`);
    parts.push(`> ${project.shortDescription || 'No description provided.'}\n`);

    parts.push('## 📌 Project Overview & Metadata\n');
    parts.push(`| Property | Details |`);
    parts.push(`| :--- | :--- |`);
    parts.push(`| **Current Phase** | ${project.currentPhase || 'Phase 1: Architecture'} |`);
    if (project.targetUsers) {
      parts.push(`| **Target Users** | ${project.targetUsers} |`);
    }
    if (project.deadline) {
      parts.push(`| **Target Deadline** | ${project.deadline} |`);
    }
    if (project.analysis?.estimatedComplexity) {
      parts.push(`| **Estimated Complexity** | ${project.analysis.estimatedComplexity} |`);
    }
    parts.push(`| **Created Date** | ${new Date(project.createdAt).toLocaleDateString()} |`);
    parts.push(`| **Exported Date** | ${exportDate} |`);
    parts.push('');

    if (project.problemBeingSolved) {
      parts.push('### Problem Definition');
      parts.push(project.problemBeingSolved + '\n');
    }

    if (project.techPreferences) {
      parts.push('### Technical Preferences');
      parts.push(project.techPreferences + '\n');
    }

    if (project.constraints) {
      parts.push('### Constraints & Guardrails');
      parts.push(project.constraints + '\n');
    }
  }

  // 2. AI Architecture & Technical Specification
  const analysis: ProjectAnalysis | null | undefined = project.analysis 
    ? normalizeProjectAnalysis(project.analysis, {
        name: project.name,
        shortDescription: project.shortDescription,
        problemBeingSolved: project.problemBeingSolved,
        targetUsers: project.targetUsers,
        techPreferences: project.techPreferences,
      })
    : null;
  if (options.includeArchitecture && analysis) {
    parts.push('## 🏛️ System Architecture & Technical Specification\n');

    if (analysis.problemDefinition) {
      parts.push('### Problem Definition');
      parts.push(analysis.problemDefinition + '\n');
    }

    if (analysis.proposedSolution) {
      parts.push('### Proposed Technical Solution');
      parts.push(analysis.proposedSolution + '\n');
    }

    // Recommended Tech Stack
    if (analysis.suggestedTechStack && Object.keys(analysis.suggestedTechStack).length > 0) {
      parts.push('### Recommended Technology Stack');
      parts.push('| Layer | Technology |');
      parts.push('| :--- | :--- |');
      if (analysis.suggestedTechStack.frontend) {
        parts.push(`| **Frontend** | ${analysis.suggestedTechStack.frontend} |`);
      }
      if (analysis.suggestedTechStack.backend) {
        parts.push(`| **Backend & API** | ${analysis.suggestedTechStack.backend} |`);
      }
      if (analysis.suggestedTechStack.database) {
        parts.push(`| **Database & Persistence** | ${analysis.suggestedTechStack.database} |`);
      }
      if (analysis.suggestedTechStack.hosting) {
        parts.push(`| **Hosting & Ingress** | ${analysis.suggestedTechStack.hosting} |`);
      }
      if (analysis.suggestedTechStack.aiMl) {
        parts.push(`| **AI / ML Layer** | ${analysis.suggestedTechStack.aiMl} |`);
      }
      parts.push('');
    }

    // Key Objectives
    const keyObjectives = safeArray(analysis.keyObjectives);
    if (keyObjectives.length > 0) {
      parts.push('### Key Project Objectives');
      keyObjectives.forEach((obj) => parts.push(`- [ ] ${obj}`));
      parts.push('');
    }

    // Functional Requirements
    const functionalReqs = safeArray(analysis.functionalRequirements);
    if (functionalReqs.length > 0) {
      parts.push('### Functional Requirements');
      functionalReqs.forEach((f) => parts.push(`- ${f}`));
      parts.push('');
    }

    // Non-Functional Requirements
    const nonFunctionalReqs = safeArray(analysis.nonFunctionalRequirements);
    if (nonFunctionalReqs.length > 0) {
      parts.push('### Non-Functional Requirements');
      nonFunctionalReqs.forEach((nf) => parts.push(`- ${nf}`));
      parts.push('');
    }

    // Data Requirements
    const dataReqs = safeArray(analysis.dataRequirements);
    if (dataReqs.length > 0) {
      parts.push('### Data Requirements');
      dataReqs.forEach((dr) => parts.push(`- ${dr}`));
      parts.push('');
    }

    // Security & Risks
    const secItems = safeArray(analysis.securityConsiderations);
    if (secItems.length > 0) {
      parts.push('### Security & Privacy Considerations');
      secItems.forEach((sec) => parts.push(`- 🔒 **Security Control**: ${sec}`));
      parts.push('');
    }

    if (Array.isArray(analysis.majorRisks) && analysis.majorRisks.length > 0) {
      parts.push('### Risk Mitigation Matrix');
      parts.push('| Risk | Severity | Mitigation Strategy |');
      parts.push('| :--- | :--- | :--- |');
      analysis.majorRisks.forEach((r) => {
        parts.push(`| **${r.risk}** | \`${r.severity}\` | ${r.mitigation} |`);
      });
      parts.push('');
    }

    // Recommended Phases
    const phases = safeArray(analysis.recommendedPhases);
    if (phases.length > 0) {
      parts.push('### Recommended Lifecycle Phases');
      phases.forEach((p, idx) => parts.push(`${idx + 1}. **${p}**`));
      parts.push('');
    }
  }

  // 3. Roadmap & Tasks
  if (options.includeRoadmap) {
    parts.push('## 🗺️ Project Roadmap & Tasks\n');

    if (tasks.length === 0) {
      parts.push('_No tasks logged in roadmap yet._\n');
    } else {
      const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
      const progressPercent = Math.round((completedCount / tasks.length) * 100);

      parts.push(`**Progress Summary:** ${completedCount} of ${tasks.length} tasks completed (${progressPercent}%)\n`);

      // Group tasks by Phase
      const phases = Array.from(new Set(tasks.map((t) => t.phase || 'General')));

      phases.forEach((phase) => {
        parts.push(`### Phase: ${phase}`);
        const phaseTasks = tasks.filter((t) => (t.phase || 'General') === phase);

        phaseTasks.forEach((t) => {
          const isDone = t.status === 'COMPLETED';
          const checkMark = isDone ? '[x]' : '[ ]';
          const priorityTag = `\`${t.priority}\``;
          const statusTag = t.status === 'IN_PROGRESS' ? '_(In Progress)_' : '';
          const dueTag = t.dueDate ? `📅 Due: ${t.dueDate}` : '';
          const metaParts = [priorityTag, statusTag, dueTag].filter(Boolean).join(' | ');

          parts.push(`- ${checkMark} **${t.title}** ${metaParts ? `(${metaParts})` : ''}`);
          if (t.description) {
            parts.push(`  > ${t.description.replace(/\n/g, '\n  > ')}`);
          }
        });
        parts.push('');
      });
    }
  }

  // 4. Notes & Research
  if (options.includeNotes) {
    parts.push('## 📝 Project Notes & Research\n');

    if (notes.length === 0) {
      parts.push('_No notes or research documents recorded._\n');
    } else {
      // Group notes by category
      const categories: ('RESEARCH' | 'SPECIFICATION' | 'MEETING' | 'GENERAL')[] = [
        'RESEARCH',
        'SPECIFICATION',
        'MEETING',
        'GENERAL'
      ];

      categories.forEach((cat) => {
        const catNotes = notes.filter((n) => (n.category || 'GENERAL') === cat);
        if (catNotes.length > 0) {
          parts.push(`### Category: ${cat}`);
          catNotes.forEach((n) => {
            const dateStr = new Date(n.createdAt).toLocaleDateString();
            const tags = n.tags && n.tags.length > 0 ? n.tags.map((t) => `\`#${t}\``).join(' ') : '';
            parts.push(`#### ${n.title}`);
            parts.push(`_Created on ${dateStr}${tags ? ` | ${tags}` : ''}_\n`);
            parts.push(`${n.content}\n`);
          });
        }
      });

      // Any uncategorized notes
      const otherNotes = notes.filter((n) => n.category && !categories.includes(n.category as any));
      if (otherNotes.length > 0) {
        parts.push(`### Other Notes`);
        otherNotes.forEach((n) => {
          parts.push(`#### ${n.title}`);
          parts.push(`${n.content}\n`);
        });
      }
    }
  }

  // 5. Architecture Decision Records (ADRs)
  if (options.includeDecisions) {
    parts.push('## ⚖️ Architecture Decision Records (ADRs)\n');

    if (decisions.length === 0) {
      parts.push('_No architecture decision records logged._\n');
    } else {
      parts.push('| # | Decision | Status | Date |');
      parts.push('| :--- | :--- | :--- | :--- |');
      decisions.forEach((d, idx) => {
        const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A';
        parts.push(`| **ADR-${String(idx + 1).padStart(3, '0')}** | ${d.decision} | \`${d.status}\` | ${dateStr} |`);
      });
      parts.push('');

      decisions.forEach((d, idx) => {
        parts.push(`### ADR-${String(idx + 1).padStart(3, '0')}: ${d.decision}`);
        parts.push(`- **Status**: \`${d.status}\``);
        parts.push(`- **Date**: ${d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'}`);
        if (d.context) {
          parts.push(`- **Context**: ${d.context}`);
        }
        parts.push(`- **Reasoning**: ${d.reasoning}`);

        if (d.alternativesConsidered) {
          const alts = Array.isArray(d.alternativesConsidered)
            ? d.alternativesConsidered
            : [d.alternativesConsidered];
          if (alts.length > 0) {
            parts.push(`- **Alternatives Considered**: ${alts.join(', ')}`);
          }
        }
        parts.push('');
      });
    }
  }

  // 6. Health & Risks Review
  const effectiveHealth = healthReview || project.healthReview;
  if (options.includeHealth && effectiveHealth) {
    parts.push('## 🩺 Project Health & Risk Evaluation\n');
    parts.push(`- **Overall Status**: \`${effectiveHealth.overallStatus}\``);
    parts.push(`- **Health Score**: **${effectiveHealth.score}/100**`);
    if (effectiveHealth.overallSummary) {
      parts.push(`- **Executive Summary**: ${effectiveHealth.overallSummary}`);
    }
    parts.push('');

    if (effectiveHealth.actionableNextSteps && effectiveHealth.actionableNextSteps.length > 0) {
      parts.push('### Recommended Next Steps');
      effectiveHealth.actionableNextSteps.forEach((step) => parts.push(`1. ${step}`));
      parts.push('');
    }

    if (effectiveHealth.strengths && effectiveHealth.strengths.length > 0) {
      parts.push('### Architectural Strengths');
      effectiveHealth.strengths.forEach((s) => parts.push(`- ✅ ${s}`));
      parts.push('');
    }
  }

  // Footer note
  parts.push('---\n*Generated with [ProjectPilot AI](https://github.com/) — Architecture & Technical Project Intelligence.*');

  return parts.join('\n');
}

export function downloadMarkdownFile(filename: string, markdownContent: string) {
  const cleanFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = cleanFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
