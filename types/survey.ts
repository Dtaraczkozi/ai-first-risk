export interface IdentificationSurvey {
  id: string;
  title: string;
  targetRecipients: string[];
  questions: string[];
  scheduledAt: Date;
  sentAt?: Date;
  responses: SurveyResponse[];
  agentScheduled: boolean;
  status: 'draft' | 'sent' | 'collecting' | 'closed';
}

export interface SurveyResponse {
  respondentId: string;
  respondentName: string;
  answers: Record<string, string>;
  identifiedRisks: string[];
  submittedAt: Date;
}
