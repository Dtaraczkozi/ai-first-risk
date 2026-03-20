'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  TextField,
  InputAdornment,
  Collapse,
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
  Add as AddIcon,
  AutoAwesome as AgentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ShowChart as KRIIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import type { RiskSuggestion, SuggestedOwner } from '@/types/document';
import type { AIAssessorPersona } from '@/types/assessor-persona';
import type { KeyRiskIndicator } from '@/types/kri';
import { getActivePersonas } from '@/lib/persona-store';
import { getKRIsByCategory } from '@/lib/kri-store';
import { getSeverityColor, getScoreLabel, getRiskDisplayId } from '@/lib/utils';

type AssessorEntry = SuggestedOwner & { isAI?: boolean; personaId?: string };

const CATEGORY_PERSONA_MAP: Record<string, string> = {
  cyber:       'persona-001',
  financial:   'persona-002',
  operational: 'persona-003',
  strategic:   'persona-003',
  compliance:  'persona-004',
};

function getRelevantPersonas(
  risks: RiskSuggestion[],
  personas: AIAssessorPersona[],
): AssessorEntry[] {
  const categories = new Set(risks.map(r => r.category));
  const relevantIds = new Set([...categories].map(c => CATEGORY_PERSONA_MAP[c]).filter(Boolean));
  return personas
    .filter(p => relevantIds.has(p.id))
    .map(p => ({ name: p.name, role: p.role, department: p.department, isAI: true, personaId: p.id }));
}

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
  const isCategory    = group.id.startsWith('cat-');
  const isSeverity    = group.id.startsWith('sev-');
  const isOwner       = group.id.startsWith('owner-');
  const isRec         = group.id.startsWith('rec-');
  const isRegRec      = group.id.startsWith('rec-reg-');
  const isPeriodicRec = group.id.startsWith('rec-periodic-');
  const isNewsRec     = group.id.startsWith('rec-news-');
  const isPrioRec     = group.id === 'rec-prio-high' || group.id === 'rec-top-cat';

  const cat = isCategory ? group.label.split(' ')[0].toLowerCase() : '';

  const categoryObjectives: Record<string, string> = {
    operational: 'Evaluate the likelihood and effectiveness of existing controls for operational risks, and identify gaps in business continuity and process resilience.',
    compliance:  'Assess regulatory exposure and control adequacy across compliance obligations. Determine whether current controls meet required standards.',
    financial:   'Review financial risk indicators, exposure levels, and hedging effectiveness. Quantify potential monetary impact.',
    cyber:       'Evaluate technical controls, threat landscape, and incident response readiness for cyber and information security risks.',
    strategic:   'Assess strategic risk posture, market positioning threats, and alignment of risk appetite with business objectives.',
  };

  if (isRec) {
    const objective = group.description;
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
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, mt: 0.15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: `${level.color}22`, border: `1px solid ${level.color}55`,
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700, color: level.color, lineHeight: 1 }}>
                {level.score}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, width: 70, flexShrink: 0, ml: 1, mt: 0.2, color: level.color }}>
              {level.label}
            </Typography>
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

/* ── Reusable section header ─────────────────────────────────────── */
function SectionHeader({
  icon,
  title,
  expanded,
  onToggle,
  meta,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
      {meta}
      {action && <Box sx={{ ml: 0.5 }}>{action}</Box>}
      <IconButton
        size="small"
        onClick={onToggle}
        sx={{ ml: 'auto !important', p: 0.4, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
      >
        <ExpandMoreIcon sx={{
          fontSize: 18,
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'none',
        }} />
      </IconButton>
    </Stack>
  );
}

export function AssessmentDetailPanel({ group, onClose, onStart, allRisks = [] }: AssessmentDetailPanelProps) {
  const [localRisks, setLocalRisks] = useState<RiskSuggestion[]>(group?.risks ?? []);
  const [activePersonas, setActivePersonas] = useState<AIAssessorPersona[]>([]);
  const [localAssessors, setLocalAssessors] = useState<AssessorEntry[]>([]);

  const [riskSearch, setRiskSearch] = useState('');
  const [assessorSearch, setAssessorSearch] = useState('');
  const [showAssessorDropdown, setShowAssessorDropdown] = useState(false);

  // Section expand/collapse state
  const [scopeExpanded, setScopeExpanded] = useState(true);
  const [assessorsExpanded, setAssessorsExpanded] = useState(true);
  const [instructionsExpanded, setInstructionsExpanded] = useState(true);
  const [kriExpanded, setKriExpanded] = useState(true);

  // KRI signals (loaded on mount, derived from category of first risk in scope)
  const [categoryKRIs, setCategoryKRIs] = useState<KeyRiskIndicator[]>([]);

  // Editable instructions state
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [editObjective, setEditObjective] = useState('');
  const [editSteps, setEditSteps] = useState<string[]>([]);
  const [editDocumentation, setEditDocumentation] = useState('');
  const [savedObjective, setSavedObjective] = useState<string | null>(null);
  const [savedSteps, setSavedSteps] = useState<string[] | null>(null);
  const [savedDocumentation, setSavedDocumentation] = useState<string | null>(null);

  useEffect(() => {
    const personas = getActivePersonas();
    setActivePersonas(personas);
  }, []);

  useEffect(() => {
    if (!group) return;
    const firstRisk = group.risks[0];
    if (firstRisk?.category) {
      setCategoryKRIs(getKRIsByCategory(firstRisk.category));
    }
  }, [group]);

  useEffect(() => {
    if (!group) return;
    setLocalRisks(group.risks);
    const seen = new Set<string>();
    const humans = group.risks.reduce<AssessorEntry[]>((acc, r) => {
      if (r.suggestedOwner && !seen.has(r.suggestedOwner.name)) {
        seen.add(r.suggestedOwner.name);
        acc.push(r.suggestedOwner);
      }
      return acc;
    }, []);
    const aiEntries = getRelevantPersonas(group.risks, activePersonas).filter(
      p => !seen.has(p.name),
    );
    setLocalAssessors([...humans, ...aiEntries]);
    setRiskSearch('');
    setAssessorSearch('');
    setShowAssessorDropdown(false);
    // Reset instructions state when group changes
    setSavedObjective(null);
    setSavedSteps(null);
    setSavedDocumentation(null);
    setEditingInstructions(false);
  }, [group?.id, activePersonas]);

  if (!group) return null;

  type Assessor = AssessorEntry & { riskCount: number };
  const assessors: Assessor[] = localAssessors
    .map(a => ({ ...a, riskCount: localRisks.filter(r => r.suggestedOwner?.name === a.name).length }))
    .sort((a, b) => (a.isAI === b.isAI ? b.riskCount - a.riskCount : a.isAI ? 1 : -1));

  const aiPersonaCount = assessors.filter(a => a.isAI).length;
  const highSeverityCount = localRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length;

  const sortedRisks = [...localRisks].sort((a, b) => {
    const scoreA = Math.round((a.likelihood + a.impact) / 2);
    const scoreB = Math.round((b.likelihood + b.impact) / 2);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.impact - a.impact;
  });

  const localRiskIds = new Set(localRisks.map(r => r.id));
  const searchableRisks = allRisks.filter(r => !localRiskIds.has(r.id));
  const filteredSearchRisks = riskSearch.trim()
    ? searchableRisks.filter(r =>
        r.title.toLowerCase().includes(riskSearch.toLowerCase()) ||
        r.description.toLowerCase().includes(riskSearch.toLowerCase()))
    : [];

  const localAssessorNames = new Set(localAssessors.map(a => a.name));
  const availableHumans: AssessorEntry[] = allRisks
    .filter(r => r.suggestedOwner && !localAssessorNames.has(r.suggestedOwner.name))
    .map(r => r.suggestedOwner!)
    .filter((owner, idx, arr) => arr.findIndex(o => o.name === owner.name) === idx);
  const assignedPersonaIds = new Set(localAssessors.map(a => a.personaId).filter(Boolean));
  const availableAIPersonas: AssessorEntry[] = activePersonas
    .filter(p => !localAssessorNames.has(p.name) && !assignedPersonaIds.has(p.id))
    .map(p => ({ name: p.name, role: p.role, department: p.department, isAI: true, personaId: p.id }));

  const allAvailable = [...availableHumans, ...availableAIPersonas];
  const filteredAssessors = assessorSearch.trim()
    ? allAvailable.filter(a =>
        a.name.toLowerCase().includes(assessorSearch.toLowerCase()) ||
        a.role.toLowerCase().includes(assessorSearch.toLowerCase()))
    : allAvailable;

  const baseInstructions = getInstructions(group);
  const instructions = {
    objective:     savedObjective     ?? baseInstructions.objective,
    steps:         savedSteps         ?? baseInstructions.steps,
    documentation: savedDocumentation ?? baseInstructions.documentation,
  };

  const handleEditInstructions = () => {
    setEditObjective(instructions.objective);
    setEditSteps([...instructions.steps]);
    setEditDocumentation(instructions.documentation);
    setEditingInstructions(true);
    setInstructionsExpanded(true);
  };

  const handleSaveInstructions = () => {
    setSavedObjective(editObjective);
    setSavedSteps(editSteps.filter(s => s.trim()));
    setSavedDocumentation(editDocumentation);
    setEditingInstructions(false);
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

      {/* ── Stats bar ── */}
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
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5 }}>
        <Stack spacing={3.5}>

          {/* ══════════════════════ SCOPE ══════════════════════ */}
          <Box>
            <SectionHeader
              icon={<ScopeIcon sx={{ fontSize: 16, color: 'primary.light' }} />}
              title="Scope"
              expanded={scopeExpanded}
              onToggle={() => setScopeExpanded(v => !v)}
            />
            <Divider sx={{ mb: 1.75 }} />

            <Collapse in={scopeExpanded}>
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
                                  <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{r.title}</Typography>
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
            </Collapse>
          </Box>

          {/* ══════════════════════ KRI SIGNALS ══════════════════════ */}
          {categoryKRIs.length > 0 && (
            <Box>
              <SectionHeader
                icon={<KRIIcon sx={{ fontSize: 16, color: 'primary.light' }} />}
                title="KRI signals"
                expanded={kriExpanded}
                onToggle={() => setKriExpanded(v => !v)}
                meta={
                  <Stack direction="row" spacing={0.5}>
                    {(['red', 'amber', 'green'] as const).map((s) => {
                      const count = categoryKRIs.filter(k => k.status === s).length;
                      if (!count) return null;
                      const c = s === 'red' ? '#f87171' : s === 'amber' ? '#fbbf24' : '#4ade80';
                      return (
                        <Chip key={s} size="small" label={count}
                          sx={{ height: 16, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${c}18`, color: c, border: `1px solid ${c}44`, '& .MuiChip-label': { px: 0.75 } }} />
                      );
                    })}
                  </Stack>
                }
              />
              <Divider sx={{ mb: 1.75 }} />
              <Collapse in={kriExpanded}>
                <Stack spacing={1}>
                  {categoryKRIs.map((kri) => {
                    const statusColor = kri.status === 'red' ? '#f87171' : kri.status === 'amber' ? '#fbbf24' : '#4ade80';
                    const TrendComp = kri.trend === 'improving' ? TrendingDownIcon : kri.trend === 'worsening' ? TrendingUpIcon : TrendingFlatIcon;
                    const trendColor = kri.trend === 'improving' ? '#4ade80' : kri.trend === 'worsening' ? '#f87171' : '#94a3b8';
                    return (
                      <Box key={kri.id} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: `${statusColor}0a`, border: `1px solid ${statusColor}22` }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0, boxShadow: `0 0 4px ${statusColor}` }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{kri.name}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                            <TrendComp sx={{ fontSize: 12, color: trendColor }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, color: statusColor }}>
                              {kri.currentValue}{kri.threshold.unit}
                            </Typography>
                            <Chip size="small" label={kri.status.toUpperCase()}
                              sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`, '& .MuiChip-label': { px: 0.75 } }} />
                          </Stack>
                        </Stack>
                        {kri.agentNote && (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, ml: 1.75, lineHeight: 1.4, fontStyle: 'italic' }}>
                            {kri.agentNote}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Collapse>
            </Box>
          )}

          {/* ══════════════════════ ASSESSORS ══════════════════════ */}
          <Box>
            <SectionHeader
              icon={<PeopleIcon sx={{ fontSize: 16, color: 'primary.light' }} />}
              title="Assessors"
              expanded={assessorsExpanded}
              onToggle={() => setAssessorsExpanded(v => !v)}
              meta={
                <Stack direction="row" spacing={0.5}>
                  <Chip size="small" label={assessors.length} sx={{ height: 18, fontSize: '0.7rem' }} />
                  {aiPersonaCount > 0 && (
                    <Chip
                      size="small"
                      icon={<AgentIcon sx={{ fontSize: '11px !important' }} />}
                      label={`${aiPersonaCount} AI`}
                      sx={{
                        height: 18, fontSize: '0.68rem',
                        bgcolor: 'rgba(59,130,246,0.12)', color: '#93c5fd',
                        border: '1px solid rgba(59,130,246,0.28)',
                        '& .MuiChip-icon': { color: '#60a5fa' },
                      }}
                    />
                  )}
                </Stack>
              }
            />
            <Divider sx={{ mb: 1.75 }} />

            <Collapse in={assessorsExpanded}>
              <Stack spacing={1}>
                {/* Search bar */}
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search assessors…"
                  value={assessorSearch}
                  onChange={(e) => { setAssessorSearch(e.target.value); setShowAssessorDropdown(true); }}
                  onFocus={() => setShowAssessorDropdown(true)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: assessorSearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setAssessorSearch(''); setShowAssessorDropdown(false); }}>
                          <CloseIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.8rem', height: 32 } }}
                />

                {/* Dropdown */}
                {showAssessorDropdown && (
                  <Box sx={{
                    borderRadius: 1.5, border: '1px solid rgba(96,165,250,0.12)',
                    background: 'rgba(10,16,30,0.85)', backdropFilter: 'blur(12px)',
                    maxHeight: 180, overflowY: 'auto',
                  }}>
                    {filteredAssessors.length > 0 ? filteredAssessors.map(a => {
                      const c = ownerColors[a.name] || '#6B7280';
                      const ini = a.name.split(' ').map(n => n[0]).join('');
                      return (
                        <Stack
                          key={a.name}
                          direction="row"
                          spacing={1.25}
                          alignItems="center"
                          onClick={() => {
                            setLocalAssessors(prev =>
                              prev.some(x => x.name === a.name) ? prev : [...prev, a],
                            );
                            setAssessorSearch('');
                            setShowAssessorDropdown(false);
                          }}
                          sx={{
                            px: 1.5, py: 0.75, cursor: 'pointer',
                            borderBottom: '1px solid rgba(96,165,250,0.06)',
                            '&:last-child': { borderBottom: 'none' },
                            '&:hover': { bgcolor: a.isAI ? 'rgba(59,130,246,0.08)' : 'rgba(96,165,250,0.07)' },
                          }}
                        >
                          {a.isAI ? (
                            <Box sx={{
                              width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              bgcolor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', flexShrink: 0,
                            }}>
                              <AgentIcon sx={{ fontSize: 12, color: '#60a5fa' }} />
                            </Box>
                          ) : (
                            <Avatar sx={{ width: 22, height: 22, fontSize: '0.55rem', fontWeight: 700, bgcolor: c, flexShrink: 0 }}>
                              {ini}
                            </Avatar>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.25, color: a.isAI ? '#93c5fd' : 'text.primary' }}>
                                {a.name.replace(' Persona', '')}
                              </Typography>
                              {a.isAI && (
                                <Chip size="small" label="AI" sx={{ height: 13, fontSize: '0.58rem', bgcolor: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }} />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{a.role} · {a.department}</Typography>
                          </Box>
                          <AddIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
                        </Stack>
                      );
                    }) : (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 1, fontStyle: 'italic' }}>
                        {assessorSearch.trim() ? 'No matching assessors found' : 'All available assessors are already assigned'}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Assigned chips */}
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {assessors.map((assessor) => {
                    const color = ownerColors[assessor.name] || '#6B7280';
                    const initials = assessor.name.split(' ').map(n => n[0]).join('');
                    return (
                      <Tooltip
                        key={assessor.name}
                        placement="top"
                        arrow
                        title={<AssessorTooltipContent assessor={assessor} />}
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: 'rgba(14,22,38,0.97)', backdropFilter: 'blur(20px)',
                              border: '1px solid rgba(96,165,250,0.12)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                              borderRadius: 2, p: 1.5, maxWidth: 320,
                            },
                          },
                          arrow: { sx: { color: 'rgba(14,22,38,0.97)' } },
                        }}
                      >
                        {assessor.isAI ? (
                          <Chip
                            size="small"
                            icon={<AgentIcon sx={{ fontSize: '13px !important' }} />}
                            label={assessor.name.replace(' Persona', '')}
                            onDelete={() => setLocalAssessors(prev => prev.filter(a => a.name !== assessor.name))}
                            sx={{
                              height: 26, fontSize: '0.75rem',
                              bgcolor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.28)', color: '#93c5fd',
                              '&:hover': { borderColor: 'rgba(59,130,246,0.5)', bgcolor: 'rgba(59,130,246,0.15)' },
                              '& .MuiChip-icon': { color: '#60a5fa' },
                              '& .MuiChip-deleteIcon': { fontSize: 13, color: 'rgba(96,165,250,0.45)', '&:hover': { color: '#f87171' } },
                            }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            avatar={
                              <Avatar sx={{ bgcolor: `${color} !important`, fontSize: '0.6rem !important', fontWeight: 700 }}>
                                {initials}
                              </Avatar>
                            }
                            label={assessor.name}
                            onDelete={() => setLocalAssessors(prev => prev.filter(a => a.name !== assessor.name))}
                            sx={{
                              height: 26, fontSize: '0.75rem',
                              bgcolor: 'rgba(14,20,35,0.5)', border: '1px solid rgba(96,165,250,0.12)', color: 'text.primary',
                              '&:hover': { borderColor: 'rgba(96,165,250,0.28)', bgcolor: 'rgba(14,20,35,0.7)' },
                              '& .MuiChip-deleteIcon': { fontSize: 13, color: 'text.disabled', '&:hover': { color: '#f87171' } },
                            }}
                          />
                        )}
                      </Tooltip>
                    );
                  })}
                </Stack>

                {assessors.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                    No assessors assigned yet.
                  </Typography>
                )}
              </Stack>
            </Collapse>
          </Box>

          {/* ══════════════════════ ASSESSOR INSTRUCTIONS ══════════════════════ */}
          <Box>
            <SectionHeader
              icon={<InstructionsIcon sx={{ fontSize: 16, color: 'primary.light' }} />}
              title="Assessor instructions"
              expanded={instructionsExpanded}
              onToggle={() => setInstructionsExpanded(v => !v)}
              action={
                !editingInstructions ? (
                  <Tooltip title="Edit instructions" placement="top">
                    <IconButton
                      size="small"
                      onClick={handleEditInstructions}
                      sx={{ p: 0.4, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                    >
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Stack direction="row" spacing={0.25}>
                    <Tooltip title="Save instructions" placement="top">
                      <IconButton
                        size="small"
                        onClick={handleSaveInstructions}
                        sx={{ p: 0.4, color: '#60a5fa', '&:hover': { color: '#93c5fd' } }}
                      >
                        <SaveIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Discard changes" placement="top">
                      <IconButton
                        size="small"
                        onClick={() => setEditingInstructions(false)}
                        sx={{ p: 0.4, color: 'text.secondary', '&:hover': { color: '#f87171' } }}
                      >
                        <CloseIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )
              }
            />
            <Divider sx={{ mb: 1.75 }} />

            <Collapse in={instructionsExpanded}>
              {!editingInstructions ? (
                /* ── Read view ── */
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.75 }}>
                      Objective
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                      {instructions.objective}
                    </Typography>
                  </Box>

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
                            bgcolor: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)',
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

                  <ScaleTable scale={likelihoodScale} title="Likelihood scale" />
                  <ScaleTable scale={impactScale} title="Impact scale" />

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
              ) : (
                /* ── Edit view ── */
                <Stack spacing={2.5}>
                  {/* Objective */}
                  <Box>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.75 }}>
                      Objective
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      value={editObjective}
                      onChange={e => setEditObjective(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
                    />
                  </Box>

                  {/* Steps */}
                  <Box>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.75 }}>
                      Assessment steps
                    </Typography>
                    <Stack spacing={0.75}>
                      {editSteps.map((step, i) => (
                        <Stack key={i} direction="row" spacing={0.75} alignItems="center">
                          <Box sx={{
                            width: 20, height: 20, borderRadius: '50%',
                            bgcolor: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'primary.light' }}>
                              {i + 1}
                            </Typography>
                          </Box>
                          <TextField
                            size="small"
                            fullWidth
                            value={step}
                            onChange={e => setEditSteps(prev => prev.map((s, idx) => idx === i ? e.target.value : s))}
                            sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.82rem' } }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => setEditSteps(prev => prev.filter((_, idx) => idx !== i))}
                            sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: '#f87171' }, flexShrink: 0 }}
                          >
                            <CloseIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setEditSteps(prev => [...prev, ''])}
                        sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                      >
                        Add step
                      </Button>
                    </Stack>
                  </Box>

                  {/* Documentation */}
                  <Box>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ letterSpacing: '0.04em', fontWeight: 700, display: 'block', mb: 0.75 }}>
                      Documentation requirements
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      multiline
                      rows={3}
                      value={editDocumentation}
                      onChange={e => setEditDocumentation(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem' } }}
                    />
                  </Box>

                  {/* Save / discard row */}
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSaveInstructions}>
                      Save instructions
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<CloseIcon sx={{ fontSize: '13px !important' }} />}
                      onClick={() => setEditingInstructions(false)}>
                      Discard
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Collapse>
          </Box>

        </Stack>
      </Box>
    </Box>
  );
}

/** @deprecated Use AssessmentDetailPanel instead */
export const AssessmentDetailDrawer = AssessmentDetailPanel;
