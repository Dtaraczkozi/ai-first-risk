export type ControlType = 
  | 'preventive'
  | 'detective'
  | 'corrective'
  | 'directive';

export type ControlStatus = 
  | 'proposed'
  | 'implemented'
  | 'effective'
  | 'ineffective'
  | 'retired';

export type ControlFrequency = 
  | 'continuous'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'ad-hoc';

export interface Control {
  id: string;
  name: string;
  description: string;
  type: ControlType;
  status: ControlStatus;
  frequency: ControlFrequency;
  owner?: string;
  effectiveness: 1 | 2 | 3 | 4 | 5;
  linkedRiskIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ControlSuggestion {
  id: string;
  riskId: string;
  suggestedControl: Omit<Control, 'id' | 'createdAt' | 'updatedAt' | 'linkedRiskIds'>;
  rationale: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}
