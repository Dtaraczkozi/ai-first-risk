import type { SynthesisedAssessment } from '@/types/assessor-persona';

export const MOCK_SYNTHESISED_ASSESSMENTS: SynthesisedAssessment[] = [
  {
    riskId: 'PLACEHOLDER_RISK_1',
    opinions: [
      {
        assessorId: 'persona-001',
        assessorName: 'CISO Perspective Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-001',
        likelihood: 4,
        impact: 5,
        rationale:
          'Two prior incidents in 18 months with no MFA enforcement on admin endpoints. KRI-001 currently RED at 4 unpatched CVEs. Cloud infrastructure misconfiguration is a top-10 OWASP risk category.',
        confidence: 'high',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        assessorId: 'persona-002',
        assessorName: 'CFO Perspective Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-002',
        likelihood: 3,
        impact: 5,
        rationale:
          'Financial exposure from a cloud breach estimated at £2.4M–£8M based on comparable incidents (Capita 2023, MOVEit 2023). Insurance gap of approximately £1.2M. Likelihood discounted given current vendor SLA commitments.',
        confidence: 'medium',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        assessorId: 'persona-003',
        assessorName: 'COO Perspective Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-003',
        likelihood: 4,
        impact: 4,
        rationale:
          'Operational disruption from cloud outage estimated at 4–8 hours based on dependency mapping. Business continuity plan has not been tested in 214 days (KRI-006 RED). Impact discounted from 5 as alternative processing paths exist for 3 of 5 critical systems.',
        confidence: 'medium',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        assessorId: 'human-001',
        assessorName: 'J. Chen',
        assessorType: 'human',
        likelihood: 3,
        impact: 4,
        rationale:
          'Agree with elevated likelihood given KRI trend. Discounting impact slightly — our data residency controls would limit blast radius vs. full breach scenarios.',
        confidence: 'medium',
        submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ],
    synthesisedLikelihood: 3.8,
    synthesisedImpact: 4.7,
    outlierFlags: ['human-001'],
    anomalyNotes: [
      'Human assessor (J. Chen) rated both L and I lower than all AI personas — possible insider knowledge of recent remediation not yet reflected in KRI data.',
    ],
    benchmarkComparison:
      'Inherent score of 4.2 is consistent with industry median for cloud infrastructure exposure in financial services (Marsh 2025 Risk Benchmarking Report: median 3.9–4.4).',
    confidenceLevel: 'high',
    whatChangedSinceLastTime:
      'Inherent likelihood increased from 3.0 to 3.8 since the Q3 2025 assessment. Impact unchanged at 4.7.',
    whyItChanged:
      'Two additional CVEs were identified in the intervening period (KRI-001 moved from amber to red). The cloud provider also disclosed a misconfiguration vulnerability in their shared responsibility documentation (November 2025).',
    uncertainties: [
      'MFA remediation project status — if completed, likelihood should reduce to ≤2.',
      'Cloud provider\'s latest security attestation (SOC 2 Type II) not yet received for this period.',
    ],
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    riskId: 'PLACEHOLDER_RISK_2',
    opinions: [
      {
        assessorId: 'persona-002',
        assessorName: 'CFO Perspective Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-002',
        likelihood: 4,
        impact: 4,
        rationale:
          'FX hedge ratio has declined to 74% (KRI-007 RED, down 18pp over 5 months). Unhedged exposure of approximately £14M at current EUR/GBP volatility implies potential P&L impact of £1.8M–£3.2M at 1-sigma.',
        confidence: 'high',
        submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        assessorId: 'persona-003',
        assessorName: 'COO Perspective Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-003',
        likelihood: 3,
        impact: 3,
        rationale:
          'Operational exposure to FX movements is limited to procurement costs. Supply chain contracts are largely GBP-denominated. Impact primarily falls on financial reporting, not operational delivery.',
        confidence: 'medium',
        submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        assessorId: 'persona-004',
        assessorName: 'Head of Compliance Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-004',
        likelihood: 3,
        impact: 4,
        rationale:
          'FX risk disclosure obligations under IFRS 7 require adequate hedging documentation. Current hedge ratio decline may require enhanced disclosure in next financial statements.',
        confidence: 'medium',
        submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ],
    synthesisedLikelihood: 3.4,
    synthesisedImpact: 3.7,
    outlierFlags: ['persona-003'],
    anomalyNotes: [
      'COO Perspective Persona rated impact significantly lower (3 vs 4) — reflects operational vs. financial framing of the risk.',
    ],
    benchmarkComparison:
      'FX concentration risk at this hedge ratio is rated as moderate-high for a company of this size and geographic exposure profile (Deloitte Treasury Benchmarking 2025).',
    confidenceLevel: 'medium',
    whatChangedSinceLastTime:
      'Inherent score increased from 2.9 to 3.4 since the last assessment, driven by the deterioration in the FX hedge ratio.',
    whyItChanged:
      'Three hedging instruments matured in Q4 2025 and were not renewed due to treasury capacity constraints. The hedge ratio has consequently declined from 92% to 74%.',
    uncertainties: [
      'Treasury team intends to renew hedging instruments in Q2 2026 — timeline not yet confirmed.',
      'EUR/GBP volatility assumptions based on 30-day trailing data; longer-term volatility may differ.',
    ],
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    riskId: 'PLACEHOLDER_RISK_3',
    opinions: [
      {
        assessorId: 'persona-004',
        assessorName: 'Head of Compliance Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-004',
        likelihood: 5,
        impact: 4,
        rationale:
          'Regulatory findings unresolved >30d rate is at 12% (KRI-003 RED, threshold 10%). DORA Art. 9 ICT risk management obligations are partially unmet. EBA supervisory priorities for 2026 explicitly list ICT governance as a focus area. Likelihood of formal finding is high.',
        confidence: 'high',
        submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        assessorId: 'persona-001',
        assessorName: 'CISO Perspective Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-001',
        likelihood: 4,
        impact: 4,
        rationale:
          'ICT risk management gaps are technically verifiable. The two open high-severity audit findings (KRI-004) are directly relevant to DORA Art. 9 obligations. Likelihood adjusted to 4 (not 5) as current engagement with regulator is constructive.',
        confidence: 'high',
        submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        assessorId: 'persona-002',
        assessorName: 'CFO Perspective Persona',
        assessorType: 'ai_persona',
        personaId: 'persona-002',
        likelihood: 4,
        impact: 5,
        rationale:
          'DORA non-compliance fines can reach 1% of global annual turnover. Financial impact at high end significantly exceeds other open risks. Insurance does not cover regulatory fines.',
        confidence: 'high',
        submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
    ],
    synthesisedLikelihood: 4.3,
    synthesisedImpact: 4.3,
    outlierFlags: [],
    anomalyNotes: [],
    benchmarkComparison:
      'Similar DORA compliance gaps have resulted in formal supervisory actions in 4 of 12 comparable institutions assessed by the EBA in H2 2025.',
    confidenceLevel: 'high',
    whatChangedSinceLastTime:
      'Both likelihood and impact have increased since the Q3 2025 assessment (was L:3.1, I:3.8). This represents the largest single-period increase in the register.',
    whyItChanged:
      'DORA entered into full force in January 2025. The two audit findings related to ICT governance (KRI-004) have remained unresolved for over 90 days. The regulatory environment has become materially less tolerant.',
    uncertainties: [
      'Ongoing remediation plan may close the primary gaps before next supervisory review — timeline Q2 2026.',
      'Regulator has not yet communicated formal inspection schedule.',
    ],
    createdAt: new Date(Date.now() - 20 * 60 * 1000),
  },
];
