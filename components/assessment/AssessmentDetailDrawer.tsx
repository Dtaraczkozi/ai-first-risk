'use client';

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
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as StartIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  MenuBook as InstructionsIcon,
  Adjust as ScopeIcon,
  FiberManualRecord as DotIcon,
  Email as EmailIcon,
  List as RisksIcon,
} from '@mui/icons-material';
import type { RiskSuggestion, SuggestedOwner } from '@/types/document';

export interface AssessmentGroup {
  id: string;
  label: string;
  description: string;
  risks: RiskSuggestion[];
  color?: string;
}

interface AssessmentDetailPanelProps {
  group: AssessmentGroup | null;
  onClose: () => void;
  onStart: () => void;
}

const severityLabels: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High',
};
const severityColors: Record<number, string> = {
  1: '#4caf50', 2: '#8bc34a', 3: '#ff9800', 4: '#f44336', 5: '#b71c1c',
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
  const isCategory = group.id.startsWith('cat-');
  const isSeverity = group.id.startsWith('sev-');
  const isOwner = group.id.startsWith('owner-');

  const cat = isCategory ? group.label.split(' ')[0].toLowerCase() : '';

  const objectives: Record<string, string> = {
    operational: 'Evaluate the likelihood and effectiveness of existing controls for operational risks, and identify gaps in business continuity and process resilience.',
    compliance: 'Assess regulatory exposure and control adequacy across compliance obligations. Determine whether current controls meet required standards.',
    financial: 'Review financial risk indicators, exposure levels, and hedging effectiveness. Quantify potential monetary impact.',
    cyber: 'Evaluate technical controls, threat landscape, and incident response readiness for cyber and information security risks.',
    strategic: 'Assess strategic risk posture, market positioning threats, and alignment of risk appetite with business objectives.',
  };

  const objective = isCategory
    ? objectives[cat] || `Evaluate the residual risk level for all ${group.label.toLowerCase()} and determine the effectiveness of existing controls.`
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
        sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, display: 'block', mb: 0.75 }}>
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
              <Typography variant="caption" sx={{ fontSize: '0.62rem', fontWeight: 700, color: level.color, lineHeight: 1 }}>
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

export function AssessmentDetailPanel({ group, onClose, onStart }: AssessmentDetailPanelProps) {
  if (!group) return null;

  type Assessor = SuggestedOwner & { riskCount: number };
  const assessors = group.risks.reduce<Assessor[]>((acc, risk) => {
    if (risk.suggestedOwner) {
      const existing = acc.find(a => a.name === risk.suggestedOwner!.name);
      if (existing) { existing.riskCount++; }
      else { acc.push({ ...risk.suggestedOwner, riskCount: 1 }); }
    }
    return acc;
  }, []).sort((a, b) => b.riskCount - a.riskCount);

  const categoryBreakdown = group.risks.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});
  const severityBreakdown = group.risks.reduce<Record<number, number>>((acc, r) => {
    const score = Math.round((r.likelihood + r.impact) / 2);
    acc[score] = (acc[score] || 0) + 1;
    return acc;
  }, {});
  const highSeverityCount = group.risks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length;

  const sortedRisks = [...group.risks].sort((a, b) => {
    const scoreA = Math.round((a.likelihood + a.impact) / 2);
    const scoreB = Math.round((b.likelihood + b.impact) / 2);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.impact - a.impact;
  });

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
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1, mr: 1 }}>
            <Typography variant="caption" color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Assessment details
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
              {group.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {group.description}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' }, mt: -0.5 }}
            aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
          <Button variant="contained" size="small" startIcon={<StartIcon />}
            onClick={() => { onStart(); onClose(); }}>
            Start assessment
          </Button>
          <Chip size="small" label={`${group.risks.length} risks`} sx={{ height: 24 }} />
          {highSeverityCount > 0 && (
            <Chip size="small" label={`${highSeverityCount} high severity`} sx={{
              height: 24, bgcolor: 'rgba(229,78,84,0.15)', color: '#E54E54', border: '1px solid rgba(229,78,84,0.3)',
            }} />
          )}
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
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total risks</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{group.risks.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Assessors</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{assessors.length || '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Methodology</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>Qualitative 5-point</Typography>
                </Box>
              </Stack>

              {Object.keys(categoryBreakdown).length > 1 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Risk categories in scope
                  </Typography>
                  <Stack spacing={0.75}>
                    {Object.entries(categoryBreakdown).map(([cat, count]) => (
                      <Box key={cat}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.3 }}>
                          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{cat}</Typography>
                          <Typography variant="caption" color="text.secondary">{count}</Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(count / group.risks.length) * 100}
                          sx={{
                            height: 4, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            '& .MuiLinearProgress-bar': { bgcolor: categoryColors[cat] || '#6B7280', borderRadius: 2 },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Severity distribution
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {Object.entries(severityBreakdown)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([score, count]) => (
                      <Chip key={score} size="small"
                        icon={<DotIcon sx={{ fontSize: '10px !important', color: `${severityColors[Number(score)]} !important` }} />}
                        label={`${severityLabels[Number(score)]} · ${count}`}
                        sx={{
                          height: 22, fontSize: '0.72rem',
                          bgcolor: `${severityColors[Number(score)]}18`,
                          border: `1px solid ${severityColors[Number(score)]}40`,
                          color: 'text.primary',
                        }}
                      />
                    ))}
                </Stack>
              </Box>

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

        {/* ── RISKS IN SCOPE ── */}
        <Accordion defaultExpanded disableGutters elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} sx={summaryLabelSx}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <RisksIcon sx={{ fontSize: 18, color: 'primary.light' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Risks in scope</Typography>
              <Chip size="small" label={sortedRisks.length} sx={{ height: 18, fontSize: '0.7rem', ml: 0.5 }} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
            <Divider sx={{ borderColor: 'rgba(96,165,250,0.08)', mb: 1.5, mx: 0.5 }} />
            <Stack spacing={1}>
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
                          <Box sx={{
                            width: 8, height: 8, borderRadius: '50%',
                            bgcolor: color, flexShrink: 0,
                          }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                            {risk.title}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary"
                          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                          {risk.description}
                        </Typography>
                      </Box>
                      <Stack spacing={0.5} sx={{ flexShrink: 0, alignItems: 'flex-end' }}>
                        <Stack direction="row" spacing={0.4}>
                          <Chip size="small" label={`L ${risk.likelihood}`} sx={{
                            height: 18, fontSize: '0.62rem', fontWeight: 600,
                            bgcolor: 'rgba(255,255,255,0.06)', border: 'none',
                          }} />
                          <Chip size="small" label={`I ${risk.impact}`} sx={{
                            height: 18, fontSize: '0.62rem', fontWeight: 600,
                            bgcolor: 'rgba(255,255,255,0.06)', border: 'none',
                          }} />
                        </Stack>
                        <Chip size="small" label={`${score} · ${severityLabels[score]}`} sx={{
                          height: 18, fontSize: '0.62rem', fontWeight: 600,
                          bgcolor: `${color}1a`, color, border: `1px solid ${color}44`,
                        }} />
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

            {assessors.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No assessors assigned yet. Assign risk owners before starting this assessment.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {assessors.map((assessor) => {
                  const email = deriveEmail(assessor.name);
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
                      <Box sx={{
                        p: 1.5, borderRadius: 1.5, cursor: 'default',
                        border: '1px solid rgba(96, 165, 250, 0.08)',
                        background: 'rgba(14, 20, 35, 0.4)',
                        transition: 'border-color 0.15s',
                        '&:hover': { borderColor: 'rgba(96,165,250,0.22)' },
                      }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, bgcolor: color, flexShrink: 0 }}>
                            {initials}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{assessor.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{assessor.role}</Typography>
                              </Box>
                              <Chip size="small"
                                label={`${assessor.riskCount} ${assessor.riskCount === 1 ? 'risk' : 'risks'}`}
                                sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(96,165,250,0.1)', border: 'none', flexShrink: 0, ml: 1 }}
                              />
                            </Stack>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
                              <EmailIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                                {email}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                              {assessor.department}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Stack>
            )}
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
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, display: 'block', mb: 0.75 }}>
                  Objective
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                  {instructions.objective}
                </Typography>
              </Box>

              {/* Steps */}
              <Box>
                <Typography variant="caption" color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, display: 'block', mb: 0.75 }}>
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
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'primary.light' }}>
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
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, display: 'block', mb: 0.75 }}>
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
