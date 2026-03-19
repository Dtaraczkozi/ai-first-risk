import type { Risk, RiskAssessment } from './risk';
import type { Control, ControlSuggestion } from './control';

export type AgentTaskType = 
  | 'identify'
  | 'assess'
  | 'suggest_controls'
  | 'monitor'
  | 'report';

export type AgentTaskStatus = 
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed';

export type ApprovalDecision = 
  | 'approved'
  | 'rejected'
  | 'pending';

export interface AgentTaskInput {
  identify: { dataSource?: string; category?: string };
  assess: { riskId: string };
  suggest_controls: { riskId: string };
  monitor: { riskIds?: string[]; thresholds?: Record<string, number> };
  report: { reportType: 'summary' | 'detailed' | 'executive'; riskIds?: string[] };
}

export interface AgentTaskOutput {
  identify: { risks: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>[] };
  assess: { assessment: Omit<RiskAssessment, 'id' | 'createdAt'> };
  suggest_controls: { suggestions: Omit<ControlSuggestion, 'id' | 'createdAt'>[] };
  monitor: { alerts: MonitoringAlert[] };
  report: { report: RiskReport };
}

export interface AgentTask<T extends AgentTaskType = AgentTaskType> {
  id: string;
  type: T;
  status: AgentTaskStatus;
  input: AgentTaskInput[T];
  output?: AgentTaskOutput[T];
  requiresApproval: boolean;
  approvalDecision: ApprovalDecision;
  approvalFeedback?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface MonitoringAlert {
  id: string;
  riskId: string;
  alertType: 'threshold_exceeded' | 'trend_detected' | 'anomaly' | 'escalation_required';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data?: Record<string, unknown>;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface RiskReport {
  id: string;
  title: string;
  type: 'summary' | 'detailed' | 'executive';
  content: string;
  risksSummary: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<number, number>;
    byStatus: Record<string, number>;
  };
  recommendations: string[];
  generatedAt: Date;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  taskType: AgentTaskType;
  title: string;
  description: string;
  proposedChanges: Record<string, unknown>;
  reasoning: string;
  evidence?: string[];
  status: ApprovalDecision;
  reviewedBy?: string;
  reviewedAt?: Date;
  feedback?: string;
  createdAt: Date;
}

export const APPROVAL_REQUIRED_ACTIONS: Record<AgentTaskType, boolean> = {
  identify: true,
  assess: true,
  suggest_controls: true,
  monitor: false,
  report: true,
};
