export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx' | 'txt' | 'xlsx';
  size: number;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'analyzed' | 'error';
  category?: 'org_structure' | 'reports' | 'register' | 'other';
}

export interface DataSource {
  id: string;
  type: 'document' | 'competitor' | '10k_filing' | 'news' | 'trend';
  name: string;
  description: string;
  url?: string;
  relevance: 'high' | 'medium' | 'low';
  extractedAt: Date;
}

export interface SuggestedOwner {
  name: string;
  role: string;
  department: string;
}

export interface MitigationControl {
  id: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective';
}

export interface Mitigation {
  plan: string;
  controls: MitigationControl[];
}

export interface RiskSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'operational' | 'compliance' | 'financial' | 'cyber' | 'strategic';
  severity: 1 | 2 | 3 | 4 | 5;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  sources: DataSource[];
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  suggestedOwner?: SuggestedOwner;
  mitigation?: Mitigation;
  userFeedback?: string;
  createdAt: Date;
}

export interface AnalysisSession {
  id: string;
  status: 'uploading' | 'analyzing_documents' | 'researching_external' | 'generating_risks' | 'ready_for_review' | 'completed';
  documents: UploadedDocument[];
  dataSources: DataSource[];
  suggestions: RiskSuggestion[];
  progress: number;
  currentStep: string;
  startedAt: Date;
  completedAt?: Date;
}
