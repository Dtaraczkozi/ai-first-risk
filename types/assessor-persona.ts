export type PersonaSource = 'org_chart' | 'job_description' | 'bu_data' | 'manual';
export type AssessorType = 'human' | 'ai_persona';

export interface AIAssessorPersona {
  id: string;
  name: string;
  role: string;
  department: string;
  perspective: string;
  biases: string[];
  sourceContext: PersonaSource[];
  createdByAgent: boolean;
  customisedByUser: boolean;
  active: boolean;
  createdAt: Date;
}

export interface AssessorOpinion {
  assessorId: string;
  assessorName: string;
  assessorType: AssessorType;
  personaId?: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
  submittedAt: Date;
}

export interface SynthesisedAssessment {
  riskId: string;
  opinions: AssessorOpinion[];
  synthesisedLikelihood: number;
  synthesisedImpact: number;
  outlierFlags: string[];
  anomalyNotes: string[];
  benchmarkComparison?: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  whatChangedSinceLastTime: string;
  whyItChanged: string;
  uncertainties: string[];
  createdAt: Date;
}
