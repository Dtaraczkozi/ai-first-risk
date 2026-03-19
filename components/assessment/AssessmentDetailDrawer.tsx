'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as StartIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  MenuBook as InstructionsIcon,
  Adjust as ScopeIcon,
  Email as EmailIcon,
  Source as SourceIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { RiskSuggestion, SuggestedOwner } from '@/types/document';
import { getSeverityColor, getScoreLabel, getRiskDisplayId } from '@/lib/utils';

export interface AssessmentGroup {
  id: string;
  label: string;
  description: string;
  risks: RiskSuggestion[];
  color?: string;
  /** Present when the group was built from a recommendation card */
  source?: string;
  urgency?: 'critical' | 'high' | 'medium';
  recType?: 'priority' | 'regulation' | 'news' | 'periodic';
}

interface AssessmentDetailPanelProps {
  group: AssessmentGroup | null;
  onClose: () => void;
  onStart: () => void;
  allRisks?: RiskSuggestion[];
}

const severityLabels: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High',
};
// Use canonical severity colours from shared utils
const severityColors: Record<number, string> = {
  1: getSeverityColor(1), 2: getSeverityColor(2), 3: getSeverityColor(3),
  4: getSeverityColor(4), 5: getSeverityColor(5),
};
const categoryColors: Record<string, string> = {
  operational: '#0060C7', compliance: '#9530DC', financial: '#009999',
  cyber: '#C42B31', strategic: '#C29A1D',
};
const ownerColors: Record<string, string> = {
  'Sarah Chen': '#0060C7', 'Michael Torres': '#C42B31', 'Jennifer Walsh': '#9530DC',
  'David Park': '#009999', 'Robert Kim': '#C29A1D',
};

const likelihoodScale = [
  { score: 1, label: 'Very Low',  color: '#4caf50', description: 'Unlikely to occur. Less than 5% probability within the assessment period.' },
  { score: 2, label: 'Low',       color: '#8bc34a', description: 'Unlikely but possible. 5–20% probability. Would require unusual circumstances.' },
  { score: 3, label: 'Medium',    color: '#ff9800', description: 'May occur occasionally. 20–50% probability. Has occurred in similar contexts.' },
  { score: 4, label: 'High',      color: '#f44336', description: 'Likely to occur. 50–80% probability. Has occurred in this organisation before.' },
  { score: 5, label: 'Very High', color: '#b71c1c', description: 'Near certain. Greater than 80% probability. Ongoing or recurring issue.' },
];

const impactScale = [
  { score: 1, label: 'Very Low',  color: '#4caf50', description: 'Negligible — minimal disruption, fully absorbed within normal operations.' },
  { score: 2, label: 'Low',       color: '#8bc34a', description: 'Minor — manageable without escalation to senior management.' },
  { score: 3, label: 'Medium',    color: '#ff9800', description: 'Moderate — requires management attention; may affect budget or timelines.' },
  { score: 4, label: 'High',      color: '#f44336', description: 'Significant — material financial, legal, or operational consequences.' },
  { score: 5, label: 'Very High', color: '#b71c1c', description: 'Severe — business-critical impact threatening continuity or major regulatory consequences.' },
];

function deriveEmail(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '.') + '@organisation.com';
}

function getInstructions(group: AssessmentGroup): { steps: string[]; objective: string; documentation: string } {
  const isCategory   = group.id.startsWith('cat-');
  const isSeverity   = group.id.startsWith('sev-');
  const isOwner      = group.id.startsWith('owner-');
  const isRec        = group.id.startsWith('rec-');
  const isRegRec     = group.id.startsWith('rec-reg-');
  const isPeriodicRec = group.id.startsWith('rec-periodic-');
  const isNewsRec    = group.id.startsWith('rec-news-');
  const isPrioRec    = group.id === 'rec-prio-high' || group.id === 'rec-top-cat';

  const cat = isCategory ? group.label.split(' ')[0].toLowerCase() : '';

  const categoryObjectives: Record<string, string> = {
    operational: 'Evaluate the likelihood and effectiveness of existing controls for operational risks, and identify gaps in business continuity and process resilience.',
    compliance: 'Assess regulatory exposure and control adequacy across compliance obligations. Determine whether current controls meet required standards.',
    financial: 'Review financial risk indicators, exposure levels, and hedging effectiveness. Quantify potential monetary impact.',
    cyber: 'Evaluate technical controls, threat landscape, and incident response readiness for cyber and information security risks.',
    strategic: 'Assess strategic risk posture, market positioning threats, and alignment of risk appetite with business objectives.',
  };

  // ── Recommendation-triggered objectives ──────────────────────────────────
  if (isRec) {
    const objective = group.description; // rec.reasoning is already the objective

    const steps = isRegRec
      ? [
          'Review the referenced regulation or standard in full',
          'Map each risk in scope to the specific regulatory requirement it relates to',
          'Assess current control adequacy against the regulatory obligation',
          'Identify and document any compliance gaps or deficiencies',
          'Assign owners and target dates for remediation of each gap',
          'Sign off with the compliance lead before submission',
        ]
      : isPeriodicRec
      ? [
          'Retrieve the previous cycle\'s assessment results for comparison',
          'Review each risk for changes in likelihood, impact, or context since last cycle',
          'Confirm that treatment plans are on track or update them as needed',
          'Reassess control effectiveness based on recent audits or incidents',
          'Document any material changes and rationale for score adjustments',
          'Obtain sign-off from risk owners and the Risk Manager',
        ]
      : isNewsRec
      ? [
          'Review the referenced intelligence or news report',
          'Identify which risks in scope are most directly affected by the development',
          'Re-evaluate likelihood scores in light of the new information',
          'Check whether existing controls remain effective given the changed context',
          'Update risk ratings and notify owners of any material changes',
          'Document the trigger event and the rationale for any score revisions',
        ]
      : isPrioRec
      ? [
          'Start with the highest inherent score risks first',
          'Verify that all risks have an active owner assigned',
          'Review and confirm or revise likelihood and impact scores',
          'Ensure each risk has a documented treatment plan',
          'Escalate unmitigated high-severity risks to leadership',
        ]
      : [
          'Review each risk description for accuracy and completeness',
          'Validate the inherent likelihood and impact scores',
          'Confirm the adequacy and effectiveness of existing controls',
          'Update the residual risk score after control consideration',
          'Record any recommended control enhancements',
          'Sign off on each assessed risk with date and assessor name',
        ];

    return { objective, steps, documentation: 'Each assessed risk must include: updated likelihood and impact scores, control effectiveness rating (Effective / Partial / Ineffective), assessor sign-off with date, and a comment on any changes from the previous assessment cycle.' };
  }

  // ── Standard group objectives ─────────────────────────────────────────────
  const objective = isCategory
    ? categoryObjectives[cat] || `Evaluate the residual risk level for all ${group.label.toLowerCase()} and determine the effectiveness of existing controls.`
    : isSeverity
    ? `Prioritise and assess all ${group.label.toLowerCase()}. Focus on reducing residual exposure through immediate treatment plans.`
    : isOwner
    ? `${group.label.replace("'s Risks", '')} should review each risk in their portfolio, validate scores, and confirm or update treatment plans.`
    : `All risks within the ${group.label} scope should be reviewed by department leads to confirm ownership and residual exposure.`;

  const steps = isCategory && cat === 'cyber'
    ? [
        'Review the threat intelligence summary for each risk',
        'Validate likelihood scores against recent vulnerability scans or incidents',
        'Confirm control effectiveness ratings with the CISO',
        'Update residual risk scores based on implemented controls',
        'Document any control gaps with target remediation dates',
      ]
    : isSeverity
    ? [
        'Start with the highest inherent score risks first',
        'Verify that all risks have an active owner assigned',
        'Review and confirm or revise likelihood and impact scores',
        'Ensure each risk has a documented treatment plan',
        'Escalate unmitigated high-severity risks to leadership',
      ]
    : [
        'Review each risk description for accuracy and completeness',
        'Validate the inherent likelihood and impact scores',
        'Confirm the adequacy and effectiveness of existing controls',
        'Update the residual risk score after control consideration',
        'Record any recommended control enhancements',
        'Sign off on each assessed risk with date and assessor name',
      ];

  return {
    objective,
    steps,
    documentation: 'Each assessed risk must include: updated likelihood and impact scores, control effectiveness rating (Effective / Partial / Ineffective), assessor sign-off with date, and a comment on any changes from the previous assessment cycle.',
  };
}

function ScaleTable({ scale, title }: { scale: typeof likelihoodScale; title: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary"
        sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.75 }}>
        {title}
      </Typography>
      <Box sx={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
        {scale.map((level, i) => (
          <Stack
            key={level.score}
            direction="row"
            alignItems="flex-start"
            sx={{
              px: 1.5, py: 1,
              borderBottom: i < scale.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              bgcolor: i % 2 === 0 ? 'rgba(0,0,0,0.12)' : 'transparent',
            }}
          >
            {/* Score badge */}
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, mt: 0.15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: `${level.color}22`, border: `1px solid ${level.color}55`,
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700, color: level.color, lineHeight: 1 }}>
                {level.score}
              </Typography>
            </Box>

            {/* Label */}
            <Typography variant="caption" sx={{ fontWeight: 600, width: 70, flexShrink: 0, ml: 1, mt: 0.2, color: level.color }}>
              {level.label}
            </Typography>

            {/* Description */}
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, lineHeight: 1.55 }}>
              {level.description}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

function AssessorTooltipContent({ assessor }: { assessor: SuggestedOwner }) {
  const email = deriveEmail(assessor.name);
  const initials = assessor.name.split(' ').map(n => n[0]).join('');
  const color = ownerColors[assessor.name] || '#6B7280';

  return (
    <Box sx={{ p: 0.5, minWidth: 240 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Avatar sx={{ width: 40, height: 40, fontSize: '0.9rem', fontWeight: 700, bgcolor: color }}>
          {initials}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{assessor.name}</Typography>
          <Typography variant="caption" color="text.secondary">{assessor.role}</Typography>
        </Box>
      </Stack>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1 }} />
      <Stack spacing={0.6}>
        <Stack direction="row" spacing={1} alignItems="center">
          <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {email}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 12, height: 12, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary">
            {assessor.department}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export function AssessmentDetailPanel({ group, onClose, onStart, allRisks = [] }: AssessmentDetailPanelProps) {
  // ── Editable local state (reset whenever a new group is opened) ──────────
  const [localRisks, setLocalRisks] = useState<RiskSuggestion[]>(group?.risks ?? []);
  const [localAssessors, setLocalAssessors] = useState<SuggestedOwner[]>(() => {
    const seen = new Set<string>();
    return (group?.risks ?? []).reduce<SuggestedOwner[]>((acc, r) => {
      if (r.suggestedOwner && !seen.has(r.suggestedOwner.name)) {
        seen.add(r.suggestedOwner.name);
        acc.push(r.suggestedOwner);
      }
      return acc;
    }, []);
  });

  const [riskSearch, setRiskSearch] = useState('');
  const [assessorSearch, setAssessorSearch] = useState('');
  const [showAssessorDropdown, setShowAssessorDropdown] = useState(false);

  useEffect(() => {
    if (!group) return;
    setLocalRisks(group.risks);
    const seen = new Set<string>();
    setLocalAssessors(group.risks.reduce<SuggestedOwner[]>((acc, r) => {
      if (r.suggestedOwner && !seen.has(r.suggestedOwner.name)) {
        seen.add(r.suggestedOwner.name);
        acc.push(r.suggestedOwner);
      }
      return acc;
    }, []));
    setRiskSearch('');
    setAssessorSearch('');
    setShowAssessorDropdown(false);
  }, [group?.id]);

  if (!group) return null;

  // ── Derived values ────────────────────────────────────────────────────────
  type Assessor = SuggestedOwner & { riskCount: number };
  const assessors: Assessor[] = localAssessors
    .map(a => ({ ...a, riskCount: localRisks.filter(r => r.suggestedOwner?.name === a.name).length }))
    .sort((a, b) => b.riskCount - a.riskCount);

  const highSeverityCount = localRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length;

  const sortedRisks = [...localRisks].sort((a, b) => {
    const scoreA = Math.round((a.likelihood + a.impact) / 2);
    const scoreB = Math.round((b.likelihood + b.impact) / 2);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.impact - a.impact;
  });

  // Risks not yet in scope — filtered by search query
  const localRiskIds = new Set(localRisks.map(r => r.id));
  const searchableRisks = allRisks.filter(r => !localRiskIds.has(r.id));
  const filteredSearchRisks = riskSearch.trim()
    ? searchableRisks.filter(r =>
        r.title.toLowerCase().includes(riskSearch.toLowerCase()) ||
        r.description.toLowerCase().includes(riskSearch.toLowerCase()))
    : [];

  // Assessors not yet assigned — filtered by search query
  const localAssessorNames = new Set(localAssessors.map(a => a.name));
  const availableAssessors = allRisks
    .filter(r => r.suggestedOwner && !localAssessorNames.has(r.suggestedOwner.name))
    .map(r => r.suggestedOwner!)
    .filter((owner, idx, arr) => arr.findIndex(o => o.name === owner.name) === idx);
  const filteredAssessors = assessorSearch.trim()
    ? availableAssessors.filter(a =>
        a.name.toLowerCase().includes(assessorSearch.toLowerCase()) ||
        a.role.toLowerCase().includes(assessorSearch.toLowerCase()))
    : availableAssessors;

  const instructions = getInstructions(group);

  const accordionSx = {
    background: 'rgba(22, 27, 39, 0.5)',
    border: '1px solid rgba(96, 165, 250, 0.1)',
    borderRadius: '10px !important',
    mb: 1.5,
    '&:before': { display: 'none' },
  };
  const summaryLabelSx = {
    px: 2.5, py: 0.5, minHeight: 52,
    '& .MuiAccordionSummary-content': { my: 1 },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Fixed header ── */}
      <Box sx={{
        px: 3, py: 2,
        borderBottom: '1px solid rgba(96, 165, 250, 0.1)',
        background: 'rgba(14, 20, 35, 0.6)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}>
        <Typography variant="caption" color="text.secondary"
          sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.5 }}>
          Assessment details
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25, flex: 1, mr: 2 }}>
            {group.label}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, mt: -0.25 }}>
            <Button variant="contained" size="small" startIcon={<StartIcon />}
              onClick={() => { onStart(); onClose(); }}>
              Start assessment
            </Button>
            <IconButton size="small" onClick={onClose}
              sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
              aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Recommendation context bar — shown only for rec-derived groups */}
        {(group.urgency || group.source) && (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap"
            sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(96,165,250,0.1)', gap: 0.75 }}>
            {group.urgency && (() => {
              const urgencyMap = {
                critical: { label: 'Critical', color: '#E54E54', bg: 'rgba(229,78,84,0.12)' },
                high:     { label: 'High',     color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
                medium:   { label: 'Medium',   color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
              };
              const u = urgencyMap[group.urgency!];
              return (
                <Chip size="small" label={u.label}
                  sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600, bgcolor: u.bg, color: u.color }} />
              );
            })()}
            {group.recType && (() => {
              const typeLabels: Record<string, string> = {
                priority: 'Risk priority', regulation: 'Regulation trigger',
                news: 'Industry news', periodic: 'Periodic review',
              };
              return (
                <Typography variant="caption" color="text.secondary">
                  {typeLabels[group.recType!] ?? group.recType}
                </Typography>
              );
            })()}
            {group.source && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto !important' }}>
                <SourceIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                  {group.source}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      {/* ── Always-visible stats bar ── */}
      <Box sx={{
        px: 3, py: 1.5,
        borderBottom: '1px solid rgba(96,165,250,0.08)',
        background: 'rgba(10,16,30,0.4)',
        flexShrink: 0,
      }}>
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>Total risks</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{localRisks.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>Assessors</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{assessors.length || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>High severity</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, color: highSeverityCount > 0 ? '#E54E54' : 'text.primary' }}>
              {highSeverityCount}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>Methodology</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.82rem' }}>Qualitative 5-pt</Typography>
          </Box>
        </Stack>
      </Box>

      {/* ── Scrollable body ── */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>

        {/* ── SCOPE ── */}
        <Accordion defaultExpanded disableGutters elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} sx={summaryLabelSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ScopeIcon sx={{ fontSize: 18, color: 'primary.light' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Scope</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
            <Divider sx={{ borderColor: 'rgba(96,165,250,0.08)', mb: 2 }} />
            <Stack spacing={2}>
              {/* Search to add risks */}
              <Box>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search risks to add…"
                  value={riskSearch}
                  onChange={(e) => setRiskSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
                />
                {riskSearch.trim() && (
                  <Box sx={{
                    mt: 0.5, borderRadius: 1.5, border: '1px solid rgba(96,165,250,0.12)',
                    background: 'rgba(10,16,30,0.85)', backdropFilter: 'blur(12px)',
                    maxHeight: 200, overflowY: 'auto',
                  }}>
                    {filteredSearchRisks.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 1.5, fontStyle: 'italic' }}>
                        No matching risks outside this scope
                      </Typography>
                    ) : (
                      filteredSearchRisks.map(r => {
                        const s = Math.round((r.likelihood + r.impact) / 2);
                        return (
                          <Stack
                            key={r.id}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            onClick={() => { setLocalRisks(prev => [...prev, r]); setRiskSearch(''); }}
                            sx={{
                              px: 1.5, py: 1, cursor: 'pointer',
                              borderBottom: '1px solid rgba(96,165,250,0.06)',
                              '&:last-child': { borderBottom: 'none' },
                              '&:hover': { bgcolor: 'rgba(96,165,250,0.07)' },
                            }}
                          >
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: severityColors[s], flexShrink: 0 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.disabled', flexShrink: 0 }}>
                                  {getRiskDisplayId(r.id, allRisks ?? [])}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.3 }}>{r.title}</Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {r.category} · {severityLabels[s]}
                              </Typography>
                            </Box>
                            <AddIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                          </Stack>
                        );
                      })
                    )}
                  </Box>
                )}
              </Box>

              {/* Risk list */}
              <Stack spacing={0.75}>
                {sortedRisks.map((risk) => {
                  const score = Math.round((risk.likelihood + risk.impact) / 2);
                  const color = severityColors[score];
                  const initials = risk.suggestedOwner
                    ? risk.suggestedOwner.name.split(' ').map(n => n[0]).join('')
                    : null;
                  return (
                    <Box key={risk.id} sx={{
                      p: 1.5, borderRadius: 1.5,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(8,13,24,0.3)',
                    }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.4 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.02em', flexShrink: 0 }}>
                              {getRiskDisplayId(risk.id, allRisks ?? [])}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                              {risk.title}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary"
                            sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                            {risk.description}
                          </Typography>
                          <Stack direction="row" spacing={1.5} sx={{ mt: 0.75 }}>
                            <Typography variant="caption" color="text.secondary">
                              {'Likelihood: '}
                              <Box component="span" sx={{ fontWeight: 600, color: severityColors[risk.likelihood] }}>
                                {severityLabels[risk.likelihood]}
                              </Box>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {'Impact: '}
                              <Box component="span" sx={{ fontWeight: 600, color: severityColors[risk.impact] }}>
                                {severityLabels[risk.impact]}
                              </Box>
                            </Typography>
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ flexShrink: 0 }}>
                          <Chip size="small" label={`${score} · ${severityLabels[score]}`} sx={{
                            height: 18, fontSize: '0.75rem', fontWeight: 600,
                            bgcolor: `${color}1a`, color, border: `1px solid ${color}44`,
                          }} />
                          <Tooltip title="Remove from scope" placement="top">
                            <IconButton
                              size="small"
                              onClick={() => setLocalRisks(prev => prev.filter(r => r.id !== risk.id))}
                              sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#f87171' }, mt: -0.25 }}
                            >
                              <CloseIcon sx={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      {risk.suggestedOwner && (
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                          <Avatar sx={{
                            width: 18, height: 18, fontSize: '0.5rem', fontWeight: 700,
                            bgcolor: ownerColors[risk.suggestedOwner.name] || '#6B7280',
                          }}>
                            {initials}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {risk.suggestedOwner.name} · {risk.suggestedOwner.role}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  );
                })}
                {localRisks.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', textAlign: 'center', py: 1 }}>
                    No risks in scope. Search above to add some.
                  </Typography>
                )}
              </Stack>

              {/* Meta */}
              <Stack spacing={0.5}>
                {[
                  ['Target completion', 'Within 30 days'],
                  ['Approval required', 'Yes — Risk Manager sign-off'],
                  ['Assessment type', 'Inherent + Residual'],
                ].map(([label, value]) => (
                  <Stack key={label} direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="caption">{value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* ── ASSESSORS ── */}
        <Accordion defaultExpanded disableGutters elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} sx={summaryLabelSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PeopleIcon sx={{ fontSize: 18, color: 'primary.light' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Assessors</Typography>
              <Chip size="small" label={assessors.length} sx={{ height: 18, fontSize: '0.7rem', ml: 0.5 }} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
            <Divider sx={{ borderColor: 'rgba(96,165,250,0.08)', mb: 2 }} />

            <Stack spacing={1}>
              {/* Compact assessor cards — detail on hover */}
              {assessors.map((assessor) => {
                const color = ownerColors[assessor.name] || '#6B7280';
                const initials = assessor.name.split(' ').map(n => n[0]).join('');
                return (
                  <Tooltip
                    key={assessor.name}
                    placement="left"
                    arrow
                    title={<AssessorTooltipContent assessor={assessor} />}
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: 'rgba(14,22,38,0.97)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(96,165,250,0.12)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                          borderRadius: 2,
                          p: 1.5,
                          maxWidth: 320,
                        },
                      },
                      arrow: { sx: { color: 'rgba(14,22,38,0.97)' } },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.25}
                      alignItems="center"
                      sx={{
                        px: 1.5, py: 1, borderRadius: 1.5, cursor: 'default',
                        border: '1px solid rgba(96,165,250,0.08)',
                        background: 'rgba(14,20,35,0.4)',
                        transition: 'border-color 0.15s',
                        '&:hover': { borderColor: 'rgba(96,165,250,0.22)' },
                      }}
                    >
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: color, flexShrink: 0 }}>
                        {initials}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.25 }}>{assessor.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{assessor.role}</Typography>
                      </Box>
                      {assessor.riskCount > 0 && (
                        <Chip size="small"
                          label={`${assessor.riskCount} ${assessor.riskCount === 1 ? 'risk' : 'risks'}`}
                          sx={{ height: 18, fontSize: '0.75rem', bgcolor: 'rgba(96,165,250,0.1)', border: 'none', flexShrink: 0 }}
                        />
                      )}
                      <Tooltip title="Remove assessor" placement="top">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); setLocalAssessors(prev => prev.filter(a => a.name !== assessor.name)); }}
                          sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#f87171' }, flexShrink: 0 }}
                        >
                          <CloseIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Tooltip>
                );
              })}

              {/* Add assessor */}
              {!showAssessorDropdown ? (
                <Button
                  size="small"
                  startIcon={<PersonAddIcon sx={{ fontSize: 15 }} />}
                  onClick={() => setShowAssessorDropdown(true)}
                  sx={{
                    mt: 0.5, color: 'text.secondary', textTransform: 'none', fontSize: '0.78rem',
                    justifyContent: 'flex-start', '&:hover': { color: 'primary.light' },
                  }}
                >
                  Add assessor
                </Button>
              ) : (
                <Box sx={{ mt: 0.5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    autoFocus
                    placeholder="Search by name or role…"
                    value={assessorSearch}
                    onChange={(e) => setAssessorSearch(e.target.value)}
                    onBlur={() => { if (!assessorSearch) setShowAssessorDropdown(false); }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => { setShowAssessorDropdown(false); setAssessorSearch(''); }}>
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
                  />
                  {filteredAssessors.length > 0 && (
                    <Box sx={{
                      mt: 0.5, borderRadius: 1.5, border: '1px solid rgba(96,165,250,0.12)',
                      background: 'rgba(10,16,30,0.85)', backdropFilter: 'blur(12px)',
                      maxHeight: 180, overflowY: 'auto',
                    }}>
                      {filteredAssessors.map(a => {
                        const c = ownerColors[a.name] || '#6B7280';
                        const ini = a.name.split(' ').map(n => n[0]).join('');
                        return (
                          <Stack
                            key={a.name}
                            direction="row"
                            spacing={1.25}
                            alignItems="center"
                            onClick={() => {
                              setLocalAssessors(prev => [...prev, a]);
                              setAssessorSearch('');
                              setShowAssessorDropdown(false);
                            }}
                            sx={{
                              px: 1.5, py: 1, cursor: 'pointer',
                              borderBottom: '1px solid rgba(96,165,250,0.06)',
                              '&:last-child': { borderBottom: 'none' },
                              '&:hover': { bgcolor: 'rgba(96,165,250,0.07)' },
                            }}
                          >
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', fontWeight: 700, bgcolor: c, flexShrink: 0 }}>
                              {ini}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.25 }}>{a.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{a.role} · {a.department}</Typography>
                            </Box>
                            <AddIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                          </Stack>
                        );
                      })}
                    </Box>
                  )}
                  {filteredAssessors.length === 0 && assessorSearch.trim() && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 1, fontStyle: 'italic' }}>
                      No matching assessors found
                    </Typography>
                  )}
                  {filteredAssessors.length === 0 && !assessorSearch.trim() && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 1, fontStyle: 'italic' }}>
                      All available assessors are already assigned
                    </Typography>
                  )}
                </Box>
              )}

              {assessors.length === 0 && !showAssessorDropdown && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                  No assessors assigned yet.
                </Typography>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* ── INSTRUCTIONS ── */}
        <Accordion defaultExpanded disableGutters elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} sx={summaryLabelSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <InstructionsIcon sx={{ fontSize: 18, color: 'primary.light' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Assessor instructions</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
            <Divider sx={{ borderColor: 'rgba(96,165,250,0.08)', mb: 2 }} />

            <Stack spacing={2.5}>
              {/* Objective */}
              <Box>
                <Typography variant="caption" color="text.secondary"
                  sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.75 }}>
                  Objective
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                  {instructions.objective}
                </Typography>
              </Box>

              {/* Steps */}
              <Box>
                <Typography variant="caption" color="text.secondary"
                  sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.75 }}>
                  Assessment steps
                </Typography>
                <Stack spacing={0.75}>
                  {instructions.steps.map((step, i) => (
                    <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start">
                      <Box sx={{
                        width: 20, height: 20, borderRadius: '50%',
                        bgcolor: 'rgba(96,165,250,0.12)',
                        border: '1px solid rgba(96,165,250,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, mt: 0.1,
                      }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'primary.light' }}>
                          {i + 1}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.55, flex: 1 }}>{step}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              {/* Scoring scale — Likelihood */}
              <ScaleTable scale={likelihoodScale} title="Likelihood scale" />

              {/* Scoring scale — Impact */}
              <ScaleTable scale={impactScale} title="Impact scale" />

              {/* Documentation */}
              <Box>
                <Typography variant="caption" color="text.secondary"
                  sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.75 }}>
                  Documentation requirements
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                  {instructions.documentation}
                </Typography>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

      </Box>
    </Box>
  );
}

/** @deprecated Use AssessmentDetailPanel instead */
export const AssessmentDetailDrawer = AssessmentDetailPanel;
