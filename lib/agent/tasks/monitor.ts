import type { AgentTask, MonitoringAlert } from '@/types/agent';
import { sendStructuredMessage } from '@/lib/anthropic';
import { SYSTEM_PROMPTS, USER_PROMPTS } from '../prompts';
import { dataStore } from '@/data/store';

interface MonitorInput {
  riskIds?: string[];
  thresholds?: Record<string, number>;
}

interface MonitorResponse {
  alerts: Array<{
    riskId: string;
    alertType: 'threshold_exceeded' | 'trend_detected' | 'anomaly' | 'escalation_required';
    message: string;
    severity: 'info' | 'warning' | 'critical';
    data: Record<string, unknown>;
    recommendedActions: string[];
  }>;
}

export async function monitorTask(
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
  const input = task.input as MonitorInput;
  
  let risksToMonitor = dataStore.getRisks();
  if (input.riskIds && input.riskIds.length > 0) {
    risksToMonitor = risksToMonitor.filter(r => input.riskIds!.includes(r.id));
  }

  risksToMonitor = risksToMonitor.filter(r => 
    r.status !== 'closed' && r.severity >= 3
  );

  if (risksToMonitor.length === 0) {
    return {
      output: { alerts: [] },
    };
  }

  const response = await sendStructuredMessage<MonitorResponse>(
    SYSTEM_PROMPTS.monitor,
    USER_PROMPTS.monitor({
      risks: risksToMonitor.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        severity: r.severity,
        likelihood: r.likelihood,
        impact: r.impact,
        status: r.status,
      })),
      thresholds: input.thresholds,
    }),
    { temperature: 0.3 }
  );

  const alerts: MonitoringAlert[] = response.alerts.map(a => ({
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    riskId: a.riskId,
    alertType: a.alertType,
    message: a.message,
    severity: a.severity,
    data: a.data,
    createdAt: new Date(),
  }));

  alerts.forEach(alert => dataStore.createAlert(alert));

  return {
    output: { alerts },
  };
}
