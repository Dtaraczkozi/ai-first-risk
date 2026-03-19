import type { RiskAssessment } from '@/types/risk';
import type { MonitoringAlert, RiskReport, ApprovalRequest } from '@/types/agent';

export const mockAssessments: RiskAssessment[] = [
  {
    id: 'assess-001',
    riskId: 'risk-001',
    assessedBy: 'agent',
    previousSeverity: 4,
    previousLikelihood: 3,
    previousImpact: 4,
    newSeverity: 5,
    newLikelihood: 4,
    newImpact: 5,
    rationale: 'Recent industry reports indicate a 40% increase in sophisticated phishing attacks targeting enterprises. Combined with the high value of customer data held, the risk profile has increased significantly.',
    approvalStatus: 'approved',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'assess-002',
    riskId: 'risk-004',
    assessedBy: 'agent',
    previousSeverity: 2,
    previousLikelihood: 3,
    previousImpact: 3,
    newSeverity: 3,
    newLikelihood: 4,
    newImpact: 4,
    rationale: 'Economic indicators suggest increased market volatility in Q2. Central bank policy changes and geopolitical tensions have elevated the probability and potential impact on revenue streams.',
    approvalStatus: 'approved',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'assess-003',
    riskId: 'risk-006',
    assessedBy: 'user',
    previousSeverity: 4,
    previousLikelihood: 4,
    previousImpact: 4,
    newSeverity: 3,
    newLikelihood: 4,
    newImpact: 3,
    rationale: 'Retention initiatives have reduced turnover in critical roles by 25%. Updated assessment reflects improved organizational stability.',
    approvalStatus: 'approved',
    createdAt: new Date('2024-02-18'),
  },
];

export const mockAlerts: MonitoringAlert[] = [
  {
    id: 'alert-001',
    riskId: 'risk-001',
    alertType: 'threshold_exceeded',
    message: 'Phishing attempt rate increased 150% above baseline this week',
    severity: 'critical',
    data: { baseline: 12, current: 30, threshold: 20 },
    createdAt: new Date('2024-02-25'),
  },
  {
    id: 'alert-002',
    riskId: 'risk-004',
    alertType: 'trend_detected',
    message: 'Market volatility index trending upward for 3 consecutive weeks',
    severity: 'warning',
    data: { weeklyValues: [22, 28, 35], trend: 'increasing' },
    createdAt: new Date('2024-02-24'),
  },
  {
    id: 'alert-003',
    riskId: 'risk-003',
    alertType: 'anomaly',
    message: 'Key vendor credit rating downgraded from A to BBB',
    severity: 'warning',
    data: { vendor: 'CloudServices Inc.', previousRating: 'A', newRating: 'BBB' },
    acknowledgedAt: new Date('2024-02-23'),
    createdAt: new Date('2024-02-22'),
  },
  {
    id: 'alert-004',
    riskId: 'risk-007',
    alertType: 'escalation_required',
    message: 'Multiple failed login attempts detected from unusual geographic locations',
    severity: 'critical',
    data: { attempts: 47, locations: ['RU', 'CN', 'NK'], timeWindow: '2 hours' },
    createdAt: new Date('2024-02-26'),
  },
];

export const mockReports: RiskReport[] = [
  {
    id: 'report-001',
    title: 'Q1 2024 Enterprise Risk Summary',
    type: 'executive',
    content: `## Executive Summary

The organization's overall risk posture has moderately increased compared to Q4 2023, primarily driven by elevated cybersecurity threats and market volatility.

### Key Highlights
- **10 active risks** tracked across 5 categories
- **3 risks** rated as Critical or High severity
- **11 controls** implemented with average effectiveness of 4.1/5
- **2 new risks** identified by AI monitoring this quarter

### Risk Distribution
Cyber risks continue to represent the highest concentration of critical exposures, followed by compliance and operational risks.

### Recommendations
1. Expedite implementation of proposed controls for strategic risks
2. Increase monitoring frequency for financial market indicators
3. Schedule board-level review of cybersecurity investment roadmap`,
    risksSummary: {
      total: 10,
      byCategory: { cyber: 2, compliance: 2, operational: 3, financial: 2, strategic: 1 },
      bySeverity: { 5: 2, 4: 4, 3: 3, 2: 1 },
      byStatus: { identified: 3, assessed: 3, mitigated: 3, closed: 1 },
    },
    recommendations: [
      'Expedite implementation of proposed controls for strategic risks',
      'Increase monitoring frequency for financial market indicators',
      'Schedule board-level review of cybersecurity investment roadmap',
    ],
    generatedAt: new Date('2024-02-27'),
  },
];

export const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: 'approval-001',
    taskId: 'task-001',
    taskType: 'identify',
    title: 'New Risk: Competitor Technology Disruption',
    description: 'AI agent has identified a potential strategic risk based on market analysis and competitor activity monitoring.',
    proposedChanges: {
      action: 'add_risk',
      risk: {
        title: 'Competitor Technology Disruption',
        category: 'strategic',
        severity: 4,
        likelihood: 3,
        impact: 5,
      },
    },
    reasoning: 'Analysis of recent competitor announcements and patent filings indicates accelerated AI investment that could impact our market position within 12-18 months.',
    evidence: [
      'Competitor X announced $50M AI R&D investment',
      'Three new AI-related patents filed by Competitor Y',
      'Industry analyst report projecting 30% market shift by 2025',
    ],
    status: 'pending',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'approval-002',
    taskId: 'task-002',
    taskType: 'identify',
    title: 'New Risk: Third-Party API Dependency Failure',
    description: 'AI agent has identified operational risk related to external API dependencies in core systems.',
    proposedChanges: {
      action: 'add_risk',
      risk: {
        title: 'Third-Party API Dependency Failure',
        category: 'operational',
        severity: 3,
        likelihood: 3,
        impact: 4,
      },
    },
    reasoning: 'Code analysis reveals 7 critical third-party API dependencies without redundancy. Historical uptime data shows 3 significant outages in the past year.',
    evidence: [
      'Dependency analysis showing 7 single-point-of-failure APIs',
      'Incident history: 3 outages totaling 12 hours downtime',
      'Vendor SLA review showing limited liability coverage',
    ],
    status: 'pending',
    createdAt: new Date('2024-02-22'),
  },
  {
    id: 'approval-003',
    taskId: 'task-003',
    taskType: 'suggest_controls',
    title: 'Control Suggestion: Competitive Intelligence Program',
    description: 'AI agent suggests implementing a new control to address strategic risk from competitor disruption.',
    proposedChanges: {
      action: 'add_control',
      riskId: 'risk-005',
      control: {
        name: 'Competitive Intelligence Program',
        type: 'detective',
        frequency: 'monthly',
      },
    },
    reasoning: 'Early warning of competitive threats enables 6-12 month lead time for strategic responses, significantly reducing potential impact.',
    evidence: [
      'Industry benchmark: 70% of companies with CI programs outperform peers',
      'Cost-benefit analysis shows 5:1 ROI on threat prevention',
    ],
    status: 'pending',
    createdAt: new Date('2024-02-21'),
  },
  {
    id: 'approval-004',
    taskId: 'task-004',
    taskType: 'report',
    title: 'Publish: Q1 2024 Executive Risk Report',
    description: 'AI agent has generated the quarterly executive risk summary for stakeholder distribution.',
    proposedChanges: {
      action: 'publish_report',
      reportId: 'report-001',
      distribution: ['Board of Directors', 'Executive Committee', 'Risk Committee'],
    },
    reasoning: 'Quarterly reporting cadence maintains stakeholder awareness and supports governance requirements.',
    status: 'pending',
    createdAt: new Date('2024-02-27'),
  },
];
