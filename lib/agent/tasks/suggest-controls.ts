import type { AgentTask } from '@/types/agent';
import { sendStructuredMessage } from '@/lib/anthropic';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../prompts';
import { dataStore } from '@/data/store';

interface SuggestControlsInput {
  riskId: string;
}

interface SuggestControlsResponse {
  suggestions: Array<{
    name: string;
    description: string;
    type: 'preventive' | 'detective' | 'corrective' | 'directive';
    frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'ad-hoc';
    owner: string;
    effectiveness: 1 | 2 | 3 | 4 | 5;
    rationale: string;
    costBenefit: string;
  }>;
}

export async function suggestControlsTask(
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
  const input = task.input as SuggestControlsInput;
  const risk = dataStore.getRisk(input.riskId);
  
  if (!risk) {
    throw new Error(`Risk not found: ${input.riskId}`);
  }

  const existingControls = dataStore.getControlsForRisk(input.riskId);
  const allControls = dataStore.getControls();

  const response = await sendStructuredMessage<SuggestControlsResponse>(
    SYSTEM_PROMPTS.suggest_controls,
    USER_PROMPTS.suggest_controls({
      riskId: input.riskId,
      risk,
      existingControls: [...existingControls, ...allControls.slice(0, 5)],
    }),
    { temperature: 0.7 }
  );

  const output = {
    suggestions: response.suggestions.map(s => ({
      riskId: input.riskId,
      suggestedControl: {
        name: s.name,
        description: s.description,
        type: s.type,
        status: 'proposed' as const,
        frequency: s.frequency,
        owner: s.owner,
        effectiveness: s.effectiveness,
      },
      rationale: s.rationale,
      approvalStatus: 'pending' as const,
    })),
  };

  if (output.suggestions.length > 0) {
    const firstSuggestion = response.suggestions[0];
    return {
      output,
      approvalData: {
        title: `Control Suggestion: ${firstSuggestion.name}`,
        description: `AI agent suggests implementing a new control to address risk: ${risk.title}`,
        proposedChanges: {
          action: 'add_control',
          riskId: input.riskId,
          control: {
            name: firstSuggestion.name,
            description: firstSuggestion.description,
            type: firstSuggestion.type,
            frequency: firstSuggestion.frequency,
            owner: firstSuggestion.owner,
            effectiveness: firstSuggestion.effectiveness,
          },
        },
        reasoning: firstSuggestion.rationale,
        evidence: [firstSuggestion.costBenefit],
      },
    };
  }

  return { output };
}
