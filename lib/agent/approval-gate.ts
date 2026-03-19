import type { AgentTask, AgentTaskType, ApprovalRequest, ApprovalDecision } from '@/types/agent';
import type { Risk } from '@/types/risk';
import { dataStore } from '@/data/store';

const APPROVAL_REQUIRED: Record<AgentTaskType, boolean> = {
  identify: true,
  assess: true,
  suggest_controls: true,
  monitor: false,
  report: true,
};

export function requiresApproval(taskType: AgentTaskType): boolean {
  return APPROVAL_REQUIRED[taskType];
}

export function createApprovalRequest(
  task: AgentTask,
  title: string,
  description: string,
  proposedChanges: Record<string, unknown>,
  reasoning: string,
  evidence?: string[]
): ApprovalRequest {
  const request: ApprovalRequest = {
    id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    taskId: task.id,
    taskType: task.type,
    title,
    description,
    proposedChanges,
    reasoning,
    evidence,
    status: 'pending',
    createdAt: new Date(),
  };

  dataStore.createApprovalRequest(request);
  return request;
}

export function processApprovalDecision(
  requestId: string,
  decision: 'approved' | 'rejected',
  reviewedBy: string,
  feedback?: string
): ApprovalRequest | undefined {
  const request = dataStore.getApprovalRequest(requestId);
  if (!request) return undefined;

  const updatedRequest = dataStore.updateApprovalRequest(requestId, {
    status: decision,
    reviewedBy,
    reviewedAt: new Date(),
    feedback,
  });

  if (updatedRequest) {
    const task = dataStore.getTask(request.taskId);
    if (task) {
      dataStore.updateTask(task.id, {
        approvalDecision: decision,
        approvalFeedback: feedback,
        status: decision === 'approved' ? 'completed' : 'failed',
        completedAt: new Date(),
      });

      if (decision === 'approved') {
        executeApprovedAction(request);
      }
    }
  }

  return updatedRequest;
}

function executeApprovedAction(request: ApprovalRequest): void {
  const changes = request.proposedChanges;
  
  switch (changes.action) {
    case 'add_risk': {
      const riskData = changes.risk as Record<string, unknown>;
      dataStore.createRisk({
        id: `risk-${Date.now()}`,
        title: riskData.title as string,
        description: riskData.description as string || '',
        category: riskData.category as 'operational' | 'compliance' | 'financial' | 'cyber' | 'strategic',
        severity: riskData.severity as 1 | 2 | 3 | 4 | 5,
        likelihood: riskData.likelihood as 1 | 2 | 3 | 4 | 5,
        impact: riskData.impact as 1 | 2 | 3 | 4 | 5,
        status: 'identified',
        controlIds: [],
        createdBy: 'agent',
        approvalStatus: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      break;
    }

    case 'update_risk': {
      const riskId = changes.riskId as string;
      const updates = changes.updates as Record<string, unknown>;
      dataStore.updateRisk(riskId, updates as Partial<Risk>);
      break;
    }

    case 'add_control': {
      const controlData = changes.control as Record<string, unknown>;
      const riskId = changes.riskId as string;
      const newControl = dataStore.createControl({
        id: `ctrl-${Date.now()}`,
        name: controlData.name as string,
        description: controlData.description as string || '',
        type: controlData.type as 'preventive' | 'detective' | 'corrective' | 'directive',
        status: 'proposed',
        frequency: controlData.frequency as 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'ad-hoc',
        owner: controlData.owner as string,
        effectiveness: controlData.effectiveness as 1 | 2 | 3 | 4 | 5 || 3,
        linkedRiskIds: [riskId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const risk = dataStore.getRisk(riskId);
      if (risk) {
        dataStore.updateRisk(riskId, {
          controlIds: [...risk.controlIds, newControl.id],
        });
      }
      break;
    }

    case 'publish_report': {
      break;
    }
  }
}

export function getPendingApprovalsCount(): number {
  return dataStore.getPendingApprovalRequests().length;
}

export function getApprovalsByTaskType(): Record<AgentTaskType, number> {
  const pending = dataStore.getPendingApprovalRequests();
  return pending.reduce((acc, req) => {
    acc[req.taskType] = (acc[req.taskType] || 0) + 1;
    return acc;
  }, {} as Record<AgentTaskType, number>);
}
