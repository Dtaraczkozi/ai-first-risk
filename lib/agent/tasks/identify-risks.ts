import type { AgentTask } from '@/types/agent';
import { sendStructuredMessage } from '@/lib/anthropic';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../prompts';
import { dataStore } from '@/data/store';

interface IdentifyRisksInput {
  dataSource?: string;
  category?: string;
}

interface IdentifyRisksResponse {
  risks: Array<{
    title: string;
    description: string;
    category: 'operational' | 'compliance' | 'financial' | 'cyber' | 'strategic';
    severity: 1 | 2 | 3 | 4 | 5;
    likelihood: 1 | 2 | 3 | 4 | 5;
    impact: 1 | 2 | 3 | 4 | 5;
    reasoning: string;
    evidence: string[];
  }>;
}

export async function identifyRisksTask(
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
  const input = task.input as IdentifyRisksInput;
  
  const existingRisks = dataStore.getRisks();
  const contextPrompt = `
Current Risk Register Context:
- Total existing risks: ${existingRisks.length}
- Existing categories: ${[...new Set(existingRisks.map(r => r.category))].join(', ')}
- Recent risks: ${existingRisks.slice(0, 5).map(r => r.title).join(', ')}

Identify new risks that are NOT already in the register.
`;

  const response = await sendStructuredMessage<IdentifyRisksResponse>(
    SYSTEM_PROMPTS.identify + contextPrompt,
    USER_PROMPTS.identify(input),
    { temperature: 0.7 }
  );

  const output = {
    risks: response.risks.map(r => ({
      title: r.title,
      description: r.description,
      category: r.category,
      severity: r.severity,
      likelihood: r.likelihood,
      impact: r.impact,
      status: 'identified' as const,
      controlIds: [],
      createdBy: 'agent' as const,
      approvalStatus: 'pending' as const,
    })),
  };

  if (output.risks.length > 0) {
    const firstRisk = response.risks[0];
    return {
      output,
      approvalData: {
        title: `New Risk: ${firstRisk.title}`,
        description: `AI agent has identified ${output.risks.length} potential risk(s) based on analysis.`,
        proposedChanges: {
          action: 'add_risk',
          risk: {
            title: firstRisk.title,
            description: firstRisk.description,
            category: firstRisk.category,
            severity: firstRisk.severity,
            likelihood: firstRisk.likelihood,
            impact: firstRisk.impact,
          },
        },
        reasoning: firstRisk.reasoning,
        evidence: firstRisk.evidence,
      },
    };
  }

  return { output };
}
