import type { AIAssessorPersona } from '@/types/assessor-persona';

export const MOCK_PERSONAS: AIAssessorPersona[] = [
  {
    id: 'persona-001',
    name: 'CISO Perspective Persona',
    role: 'Chief Information Security Officer',
    department: 'Technology',
    perspective:
      'Assesses risks through the lens of technical vulnerability and cyber threat intelligence. Prioritises risks with direct system exposure, unpatched vulnerabilities, or identity control gaps. Applies conservative likelihood estimates to cyber and operational categories based on historical incident frequency and industry threat data.',
    biases: ['conservative on likelihood', 'technical focus', 'cyber-weighted', 'underweights reputational risk'],
    sourceContext: ['org_chart', 'job_description'],
    createdByAgent: true,
    customisedByUser: false,
    active: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'persona-002',
    name: 'CFO Perspective Persona',
    role: 'Chief Financial Officer',
    department: 'Finance',
    perspective:
      'Evaluates risks primarily through their financial materiality and balance sheet impact. Favours quantitative evidence (loss events, exposure amounts, insurance gaps) over qualitative narrative. Tends to rate financial and strategic risks higher on impact, and is inclined toward risk transfer as a preferred treatment strategy.',
    biases: ['financial impact focus', 'risk-transfer preference', 'quantitative bias', 'underweights operational risk'],
    sourceContext: ['org_chart', 'job_description', 'bu_data'],
    createdByAgent: true,
    customisedByUser: false,
    active: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'persona-003',
    name: 'COO Perspective Persona',
    role: 'Chief Operating Officer',
    department: 'Operations',
    perspective:
      'Assesses risks from an operational continuity and process resilience standpoint. Sensitive to risks that could interrupt service delivery, supplier chains, or workforce availability. Applies higher likelihood scores to risks that have previously materialised in similar organisations. Underweights compliance risks unless they have direct operational consequences.',
    biases: ['operational continuity focus', 'process-oriented', 'sensitivity to precedent', 'underweights compliance risk'],
    sourceContext: ['org_chart', 'job_description', 'bu_data'],
    createdByAgent: true,
    customisedByUser: false,
    active: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'persona-004',
    name: 'Head of Compliance Persona',
    role: 'Chief Compliance Officer',
    department: 'Legal & Compliance',
    perspective:
      'Reviews risks against regulatory obligations, internal policy, and audit findings. Assigns elevated impact scores to risks with regulatory exposure, particularly where fines or enforcement action is possible. Applies conservative assumptions on both likelihood and impact for compliance and financial risks. Benchmarks against published regulatory enforcement data.',
    biases: ['regulatory sensitivity', 'conservative on impact', 'policy-anchored', 'underweights strategic risk'],
    sourceContext: ['org_chart', 'job_description'],
    createdByAgent: true,
    customisedByUser: false,
    active: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
];
