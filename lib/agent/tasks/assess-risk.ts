import type { AgentTask } from '@/types/agent';
import { sendStructuredMessage } from '@/lib/anthropic';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../prompts';
import { dataStore } from '@/data/store';

interface AssessRiskInput {
  riskId: string;
}

interface AssessRiskResponse {
  assessment: {
    riskId: string;
    newSeverity: 1 | 2 | 3 | 4 | 5;
    newLikelihood: 1 | 2 | 3 | 4 | 5;
    newImpact: 1 | 2 | 3 | 4 | 5;
    rationale: string;
    evidence: string[];
    recommendations: string[];
  };
}

export async function assessRiskTask(
  task: AgentTask
): Promise<{
  output: unknown;
  approvalData?: {
    title: string;
    description: string;
    proposedChanges: Record<string, unknown>;
    reasoning: string;
    evidence?: string[];
  };
}> {
  const input = task.input as AssessRiskInput;
  const risk = dataStore.getRisk(input.riskId);
  
  if (!risk) {
    throw new Error(`Risk not found: ${input.riskId}`);
  }

  const existingAssessments = dataStore.getAssessmentsForRisk(input.riskId);
  const controls = dataStore.getControlsForRisk(input.riskId);

  const response = await sendStructuredMessage<AssessRiskResponse>(
    SYSTEM_PROMPTS.assess,
    USER_PROMPTS.assess({
      riskId: input.riskId,
      currentRisk: {
        ...risk,
        existingAssessments: existingAssessments.slice(-3),
        linkedControls: controls,
      },
    }),
    { temperature: 0.5 }
  );

  const hasChanges = 
    response.assessment.newSeverity !== risk.severity ||
    response.assessment.newLikelihood !== risk.likelihood ||
    response.assessment.newImpact !== risk.impact;

  const output = {
    assessment: {
      riskId: input.riskId,
      assessedBy: 'agent',
      previousSeverity: risk.severity,
      previousLikelihood: risk.likelihood,
      previousImpact: risk.impact,
      newSeverity: response.assessment.newSeverity,
      newLikelihood: response.assessment.newLikelihood,
      newImpact: response.assessment.newImpact,
      rationale: response.assessment.rationale,
      approvalStatus: 'pending',
    },
  };

  if (hasChanges) {
    return {
      output,
      approvalData: {
        title: `Assessment Update: ${risk.title}`,
        description: `AI agent proposes updating the risk assessment based on current conditions.`,
        proposedChanges: {
          action: 'update_risk',
          riskId: input.riskId,
          updates: {
            severity: response.assessment.newSeverity,
            likelihood: response.assessment.newLikelihood,
            impact: response.assessment.newImpact,
            status: 'assessed',
          },
          previousValues: {
            severity: risk.severity,
            likelihood: risk.likelihood,
            impact: risk.impact,
          },
        },
        reasoning: response.assessment.rationale,
        evidence: response.assessment.evidence,
      },
    };
  }

  return { output };
}
