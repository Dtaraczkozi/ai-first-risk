'use client';

import type { RiskSuggestion, DataSource } from '@/types/document';

const STORAGE_KEY = 'approved_risks';
const DISCOVERY_STORAGE_KEY = 'risk-discovery-state';

const mockOwners = [
  { name: 'Sarah Chen', role: 'Risk Manager', department: 'Risk Management' },
  { name: 'Michael Torres', role: 'CISO', department: 'Information Security' },
  { name: 'Jennifer Walsh', role: 'Compliance Director', department: 'Compliance' },
  { name: 'David Park', role: 'VP Operations', department: 'Operations' },
  { name: 'Robert Kim', role: 'CFO', department: 'Finance' },
  { name: 'Emily Johnson', role: 'IT Director', department: 'IT' },
  { name: 'James Wilson', role: 'Legal Counsel', department: 'Legal' },
  { name: 'Lisa Anderson', role: 'HR Director', department: 'Human Resources' },
];

const mockRiskTemplates = [
  { title: 'Data breach from external attack', category: 'cyber', description: 'Risk of unauthorized access to sensitive data through external cyber attacks including phishing, malware, or direct network intrusion.' },
  { title: 'Insider threat from privileged users', category: 'cyber', description: 'Risk of data theft or sabotage by employees with elevated system access privileges.' },
  { title: 'Third-party vendor security gaps', category: 'cyber', description: 'Risk exposure through security vulnerabilities in third-party vendor systems and services.' },
  { title: 'Ransomware attack on critical systems', category: 'cyber', description: 'Risk of operational disruption and data loss due to ransomware targeting critical business systems.' },
  { title: 'Cloud infrastructure misconfiguration', category: 'cyber', description: 'Risk of data exposure or service disruption due to misconfigured cloud services and storage.' },
  { title: 'GDPR compliance violation', category: 'compliance', description: 'Risk of regulatory penalties due to non-compliance with GDPR data protection requirements.' },
  { title: 'SOX reporting deficiency', category: 'compliance', description: 'Risk of material weakness in financial reporting controls affecting SOX compliance.' },
  { title: 'Industry regulation changes', category: 'compliance', description: 'Risk of non-compliance due to evolving industry-specific regulations and standards.' },
  { title: 'Anti-money laundering gaps', category: 'compliance', description: 'Risk of regulatory action due to inadequate AML monitoring and reporting procedures.' },
  { title: 'Export control violations', category: 'compliance', description: 'Risk of penalties for violations of export control regulations in international operations.' },
  { title: 'Supply chain disruption', category: 'operational', description: 'Risk of production delays or quality issues due to supplier failures or logistics disruptions.' },
  { title: 'Key personnel dependency', category: 'operational', description: 'Risk of operational impact from departure or unavailability of critical staff members.' },
  { title: 'Business continuity gaps', category: 'operational', description: 'Risk of extended downtime due to inadequate disaster recovery and business continuity plans.' },
  { title: 'Quality control failures', category: 'operational', description: 'Risk of product recalls or customer complaints due to quality assurance deficiencies.' },
  { title: 'IT system downtime', category: 'operational', description: 'Risk of business interruption from critical IT system failures or unplanned outages.' },
  { title: 'Process automation failures', category: 'operational', description: 'Risk of errors and delays when automated business processes malfunction.' },
  { title: 'Inventory management issues', category: 'operational', description: 'Risk of stockouts or excess inventory due to demand forecasting inaccuracies.' },
  { title: 'Currency exchange volatility', category: 'financial', description: 'Risk of financial loss due to adverse foreign exchange rate movements.' },
  { title: 'Credit default exposure', category: 'financial', description: 'Risk of bad debt from customer or counterparty payment failures.' },
  { title: 'Liquidity shortfall', category: 'financial', description: 'Risk of inability to meet short-term financial obligations due to cash flow constraints.' },
  { title: 'Interest rate fluctuation impact', category: 'financial', description: 'Risk of increased borrowing costs or asset value changes from interest rate movements.' },
  { title: 'Revenue concentration risk', category: 'financial', description: 'Risk of significant revenue loss from dependency on a small number of key customers.' },
  { title: 'Investment portfolio losses', category: 'financial', description: 'Risk of asset value decline in corporate investment holdings.' },
  { title: 'Market share erosion', category: 'strategic', description: 'Risk of declining market position due to competitive pressures or market changes.' },
  { title: 'Digital transformation delays', category: 'strategic', description: 'Risk of competitive disadvantage from slow adoption of digital technologies.' },
  { title: 'M&A integration challenges', category: 'strategic', description: 'Risk of value destruction from failed integration of acquired companies.' },
  { title: 'Brand reputation damage', category: 'strategic', description: 'Risk of customer loss and revenue impact from negative publicity or brand incidents.' },
  { title: 'New market entry failure', category: 'strategic', description: 'Risk of investment loss from unsuccessful expansion into new geographic markets.' },
  { title: 'Technology disruption threat', category: 'strategic', description: 'Risk of business model obsolescence from emerging disruptive technologies.' },
  { title: 'Talent acquisition challenges', category: 'strategic', description: 'Risk of growth constraints from inability to attract and retain skilled workforce.' },
  { title: 'API security vulnerabilities', category: 'cyber', description: 'Risk of data exposure through insecure API endpoints and authentication flaws.' },
  { title: 'Mobile device security risks', category: 'cyber', description: 'Risk of data leakage through lost, stolen, or compromised mobile devices.' },
  { title: 'Social engineering attacks', category: 'cyber', description: 'Risk of credential theft through sophisticated social engineering techniques.' },
  { title: 'Legacy system vulnerabilities', category: 'cyber', description: 'Risk of exploitation of unpatched vulnerabilities in legacy systems.' },
  { title: 'Privacy regulation changes', category: 'compliance', description: 'Risk of compliance gaps from evolving global privacy regulations.' },
  { title: 'Health and safety violations', category: 'compliance', description: 'Risk of regulatory penalties and liability from workplace safety incidents.' },
  { title: 'Contract compliance gaps', category: 'compliance', description: 'Risk of disputes and penalties from failure to meet contractual obligations.' },
  { title: 'Facility security incidents', category: 'operational', description: 'Risk of physical security breaches at corporate facilities.' },
  { title: 'Project delivery delays', category: 'operational', description: 'Risk of cost overruns and missed deadlines on major projects.' },
  { title: 'Vendor performance issues', category: 'operational', description: 'Risk of service degradation from underperforming vendors.' },
  { title: 'Insurance coverage gaps', category: 'financial', description: 'Risk of uninsured losses from inadequate insurance coverage.' },
  { title: 'Tax compliance risks', category: 'financial', description: 'Risk of penalties from tax reporting errors or aggressive tax positions.' },
  { title: 'Commodity price volatility', category: 'financial', description: 'Risk of margin compression from fluctuating commodity prices.' },
  { title: 'Product liability exposure', category: 'strategic', description: 'Risk of lawsuits and recalls from product defects or safety issues.' },
  { title: 'Intellectual property theft', category: 'strategic', description: 'Risk of competitive loss from theft or infringement of proprietary IP.' },
  { title: 'Customer data privacy breach', category: 'cyber', description: 'Risk of customer trust erosion from privacy incidents involving personal data.' },
  { title: 'Environmental compliance issues', category: 'compliance', description: 'Risk of penalties and remediation costs from environmental regulation violations.' },
  { title: 'Workforce safety incidents', category: 'operational', description: 'Risk of liability and productivity loss from workplace injuries.' },
  { title: 'Fraud and embezzlement', category: 'financial', description: 'Risk of financial loss from internal or external fraudulent activities.' },
  { title: 'Strategic partnership failures', category: 'strategic', description: 'Risk of revenue impact from dissolution of key strategic partnerships.' },
];

function generateMockSource(category: string): DataSource {
  const internalSources = [
    { name: 'Risk_Assessment_2024.pdf', description: 'Annual risk assessment report' },
    { name: 'Audit_Findings.xlsx', description: 'Internal audit findings summary' },
    { name: 'Compliance_Review.docx', description: 'Quarterly compliance review' },
    { name: 'Incident_Log.xlsx', description: 'Security incident tracking log' },
    { name: 'Vendor_Assessment.pdf', description: 'Third-party vendor evaluation' },
  ];
  const externalSources = [
    { type: 'news' as const, name: 'Industry News Alert', description: 'Recent industry publication', url: 'https://news.example.com' },
    { type: 'competitor' as const, name: 'Competitor Analysis', description: 'Competitive intelligence report', url: 'https://competitor.example.com' },
    { type: '10k_filing' as const, name: 'SEC 10-K Filing', description: 'Annual report disclosure', url: 'https://sec.gov' },
    { type: 'trend' as const, name: 'Market Trends Report', description: 'Industry trend analysis', url: 'https://trends.example.com' },
  ];

  const useInternal = Math.random() > 0.4;
  if (useInternal) {
    const source = internalSources[Math.floor(Math.random() * internalSources.length)];
    return {
      id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'document',
      name: source.name,
      description: source.description,
      relevance: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
      extractedAt: new Date(),
    };
  } else {
    const source = externalSources[Math.floor(Math.random() * externalSources.length)];
    return {
      id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: source.type,
      name: source.name,
      description: source.description,
      url: source.url,
      relevance: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
      extractedAt: new Date(),
    };
  }
}

export function seedMockRisks(count: number = 50): void {
  if (typeof window === 'undefined') return;
  
  const existingRisks = getApprovedRisks();
  if (existingRisks.length >= count) return;

  const risks: RiskSuggestion[] = [];
  const usedTemplates = new Set<number>();

  for (let i = 0; i < count; i++) {
    let templateIndex: number;
    do {
      templateIndex = Math.floor(Math.random() * mockRiskTemplates.length);
    } while (usedTemplates.has(templateIndex) && usedTemplates.size < mockRiskTemplates.length);
    
    if (usedTemplates.size >= mockRiskTemplates.length) {
      usedTemplates.clear();
    }
    usedTemplates.add(templateIndex);

    const template = mockRiskTemplates[templateIndex];
    const likelihood = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
    const impact = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
    const severity = Math.round((likelihood + impact) / 2) as 1 | 2 | 3 | 4 | 5;
    const owner = mockOwners[Math.floor(Math.random() * mockOwners.length)];

    const numSources = Math.floor(Math.random() * 3) + 1;
    const sources: DataSource[] = [];
    for (let j = 0; j < numSources; j++) {
      sources.push(generateMockSource(template.category));
    }

    risks.push({
      id: `risk-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      description: template.description,
      category: template.category as RiskSuggestion['category'],
      severity,
      likelihood,
      impact,
      reasoning: `This risk was identified through analysis of ${sources.length} source${sources.length > 1 ? 's' : ''} and represents a ${severity >= 4 ? 'high' : severity >= 3 ? 'medium' : 'low'} priority concern for the organization.`,
      sources,
      status: 'approved',
      suggestedOwner: owner,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
}

export function getApprovedRisks(): RiskSuggestion[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addApprovedRisk(risk: RiskSuggestion): void {
  if (typeof window === 'undefined') return;
  const risks = getApprovedRisks();
  const exists = risks.some(r => r.id === risk.id);
  if (!exists) {
    risks.push({ ...risk, status: 'approved' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
  }
}

export function removeApprovedRisk(riskId: string): void {
  if (typeof window === 'undefined') return;
  const risks = getApprovedRisks().filter(r => r.id !== riskId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
}

export function clearApprovedRisks(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getDraftRisks(): RiskSuggestion[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(DISCOVERY_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.suggestions || [];
  } catch {
    return [];
  }
}

export function updateDraftRisk(riskId: string, updates: Partial<RiskSuggestion>): void {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(DISCOVERY_STORAGE_KEY);
  if (!stored) return;
  
  try {
    const parsed = JSON.parse(stored);
    if (parsed.suggestions) {
      parsed.suggestions = parsed.suggestions.map((r: RiskSuggestion) => 
        r.id === riskId ? { ...r, ...updates } : r
      );
      localStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {
    console.error('Failed to update draft risk');
  }
}

export function updateApprovedRisk(riskId: string, updates: Partial<RiskSuggestion>): void {
  if (typeof window === 'undefined') return;
  const risks = getApprovedRisks();
  const updatedRisks = risks.map(r => r.id === riskId ? { ...r, ...updates } : r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRisks));
}

export function getRiskById(riskId: string): RiskSuggestion | null {
  const draftRisks = getDraftRisks();
  const draftRisk = draftRisks.find(r => r.id === riskId);
  if (draftRisk) return draftRisk;
  
  const approvedRisks = getApprovedRisks();
  const approvedRisk = approvedRisks.find(r => r.id === riskId);
  if (approvedRisk) return approvedRisk;
  
  return null;
}
