export type RiskCategory = 
  | 'operational'
  | 'compliance'
  | 'financial'
  | 'cyber'
  | 'strategic';

export type RiskStatus = 
  | 'identified'
  | 'assessed'
  | 'mitigated'
  | 'closed';

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected';

export type CreatedBy = 'user' | 'agent';

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: 1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  status: RiskStatus;
  controlIds: string[];
  createdBy: CreatedBy;
  approvalStatus: ApprovalStatus;
  owner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskAssessment {
  id: string;
  riskId: string;
  assessedBy: CreatedBy;
  previousSeverity?: 1 | 2 | 3 | 4 | 5;
  previousLikelihood?: 1 | 2 | 3 | 4 | 5;
  previousImpact?: 1 | 2 | 3 | 4 | 5;
  newSeverity: 1 | 2 | 3 | 4 | 5;
  newLikelihood: 1 | 2 | 3 | 4 | 5;
  newImpact: 1 | 2 | 3 | 4 | 5;
  rationale: string;
  approvalStatus: ApprovalStatus;
  createdAt: Date;
}

export function calculateRiskScore(risk: Pick<Risk, 'severity' | 'likelihood' | 'impact'>): number {
  return risk.severity * risk.likelihood * risk.impact;
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 15) return 'low';
  if (score <= 45) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}
