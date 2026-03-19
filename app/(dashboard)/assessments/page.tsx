'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Avatar,
  AvatarGroup,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Divider,
  Drawer,
  Select,
  MenuItem,
  FormControl,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CompletedIcon,
  AccessTime as ClockIcon,
  ArrowForward as ArrowIcon,
  ErrorOutline as OverdueIcon,
  DonutLarge as ProgressIcon,
  AutoAwesome as SparkleIcon,
  Gavel as RegulationIcon,
  Article as NewsIcon,
  Loop as PeriodicIcon,
  Shield as ShieldIcon,
  OpenInNew as OpenInNewIcon,
  Warning as SeverityIcon,
  PriorityHigh as PriorityIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { RiskSuggestion } from '@/types/document';
import { getApprovedRisks } from '@/lib/risk-store';
import { RISK_CATEGORY_COLORS, getRiskDisplayId } from '@/lib/utils';
import { AssessmentDetailPanel, type AssessmentGroup } from '@/components/assessment/AssessmentDetailDrawer';
import { getPersonas, updatePersona, addPersona } from '@/lib/persona-store';
import { MOCK_SYNTHESISED_ASSESSMENTS } from '@/data/mock/synthesis';
import { MOCK_PERSONAS } from '@/data/mock/personas';
import type { AIAssessorPersona, AssessorOpinion } from '@/types/assessor-persona';

const categoryColors = RISK_CATEGORY_COLORS;

const severityLabels: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
};

const severityColors: Record<number, string> = {
  1: '#4caf50',
  2: '#8bc34a',
  3: '#ff9800',
  4: '#f44336',
  5: '#b71c1c',
};

const ownerColors: Record<string, string> = {
  'Sarah Chen': '#0060C7',
  'Michael Torres': '#C42B31',
  'Jennifer Walsh': '#9530DC',
  'David Park': '#009999',
  'Robert Kim': '#C29A1D',
};

const sourceLabels: Record<string, string> = {
  org_chart: 'Org chart',
  job_description: 'Job description',
  bu_data: 'BU data',
  manual: 'Manual',
};

const KRI_INDICATORS: Record<string, Array<{ count: number; status: 'red' | 'amber' }>> = {
  cyber: [{ count: 2, status: 'red' }],
  compliance: [{ count: 2, status: 'red' }, { count: 1, status: 'amber' }],
  financial: [{ count: 1, status: 'red' }],
};

const KRI_LINKAGES = [
  '↳ KRI: Unpatched CVEs — currently RED',
  '↳ KRI: Regulatory findings unresolved >30d — currently RED',
  '↳ KRI: FX Hedge Ratio — currently RED',
];

interface Recommendation {
  id: string;
  type: 'priority' | 'regulation' | 'news' | 'periodic';
  urgency: 'critical' | 'high' | 'medium';
  headline: string;
  reasoning: string;
  source: string;
  affectedCategory?: string;
  affectedCount?: number;
}

type EditPersonaForm = {
  name: string;
  role: string;
  perspective: string;
  biases: string[];
  newBias: string;
};

export default function AssessmentsPage() {
  const [risks, setRisks] = useState<RiskSuggestion[]>([]);
  const [deferredRiskIds, setDeferredRiskIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState(0);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [detailGroup, setDetailGroup] = useState<AssessmentGroup | null>(null);
  const [existingFilter, setExistingFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Draft drawer state
  const [draftRisk, setDraftRisk] = useState<RiskSuggestion | null>(null);
  const [draftRiskIndex, setDraftRiskIndex] = useState(0);
  const [showOverrideL, setShowOverrideL] = useState(false);
  const [showOverrideI, setShowOverrideI] = useState(false);
  const [overrideLValue, setOverrideLValue] = useState(3);
  const [overrideIValue, setOverrideIValue] = useState(3);
  const [expandedRationale, setExpandedRationale] = useState<string | null>(null);

  // Persona state
  const [personas, setPersonas] = useState<AIAssessorPersona[]>([]);
  const [personasRefreshing, setPersonasRefreshing] = useState(false);
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditPersonaForm>({
    name: '', role: '', perspective: '', biases: [], newBias: '',
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPersonaForm, setNewPersonaForm] = useState({
    name: '', role: '', department: '', perspective: '', biasesText: '',
  });

  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  useEffect(() => { setRisks(getApprovedRisks()); }, []);
  useEffect(() => { setPersonas(getPersonas()); }, []);

  // Priority queue: unassessed risks sorted by score, top 10
  const priorityQueue = useMemo(() =>
    risks
      .filter(r => r.assessmentStatus !== 'assessed' && !deferredRiskIds.has(r.id))
      .sort((a, b) => (b.likelihood + b.impact) - (a.likelihood + a.impact))
      .slice(0, 10),
    [risks, deferredRiskIds],
  );

  // Opinions to display in the draft drawer
  const draftOpinions = useMemo((): AssessorOpinion[] => {
    if (!draftRisk) return [];
    if (draftRiskIndex < 3) return MOCK_SYNTHESISED_ASSESSMENTS[0].opinions;
    const clamp = (v: number): 1 | 2 | 3 | 4 | 5 =>
      Math.max(1, Math.min(5, Math.round(v))) as 1 | 2 | 3 | 4 | 5;
    const offsets: [number, number][] = [[1, 0], [-1, 1], [0, -1]];
    return MOCK_PERSONAS.slice(0, 3).map((persona, idx) => ({
      assessorId: persona.id,
      assessorName: persona.name,
      assessorType: 'ai_persona' as const,
      personaId: persona.id,
      likelihood: clamp(draftRisk.likelihood + offsets[idx][0]),
      impact: clamp(draftRisk.impact + offsets[idx][1]),
      rationale: `${persona.perspective.slice(0, 100)}...`,
      confidence: 'medium' as const,
      submittedAt: new Date(),
    }));
  }, [draftRisk, draftRiskIndex]);

  const draftSynthesised = useMemo(() => {
    if (!draftRisk) return null;
    if (draftRiskIndex < 3) {
      return {
        likelihood: MOCK_SYNTHESISED_ASSESSMENTS[0].synthesisedLikelihood,
        impact: MOCK_SYNTHESISED_ASSESSMENTS[0].synthesisedImpact,
        confidenceLevel: MOCK_SYNTHESISED_ASSESSMENTS[0].confidenceLevel,
        whatChanged: MOCK_SYNTHESISED_ASSESSMENTS[0].whatChangedSinceLastTime,
      };
    }
    const n = draftOpinions.length || 1;
    return {
      likelihood: draftOpinions.reduce((s, o) => s + o.likelihood, 0) / n,
      impact: draftOpinions.reduce((s, o) => s + o.impact, 0) / n,
      confidenceLevel: 'medium' as const,
      whatChanged: 'Inherent likelihood increased from 3.0 to 3.8 since Q3 2025 assessment.',
    };
  }, [draftRisk, draftRiskIndex, draftOpinions]);

  // Existing assessment groups (same as before)
  const existingAssessmentGroups = useMemo(() => {
    const groups: Record<string, RiskSuggestion[]> = {};
    risks.forEach(r => {
      if (r.assessmentStatus === 'in_progress' || r.assessmentStatus === 'assessed') {
        const cat = r.category || 'other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(r);
      }
    });
    return Object.entries(groups).map(([cat, catRisks]) => {
      const assessed = catRisks.filter(r => r.assessmentStatus === 'assessed').length;
      const inProgress = catRisks.filter(r => r.assessmentStatus === 'in_progress').length;
      const total = catRisks.length;
      const progress = Math.round((assessed / total) * 100);
      const highSevCount = catRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length;
      const uniqueAssessors = [...new Map(
        catRisks.filter(r => r.suggestedOwner).map(r => [r.suggestedOwner!.name, r.suggestedOwner!]),
      ).values()];
      const oldestDate = new Date(Math.min(...catRisks.map(r => new Date(r.createdAt).getTime())));
      const daysSinceStart = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
      const isCompleted = assessed === total && total > 0;
      const isOverdue = !isCompleted && daysSinceStart > 14;
      return {
        id: cat,
        category: cat as RiskSuggestion['category'],
        label: cat.charAt(0).toUpperCase() + cat.slice(1) + ' Risk Assessment',
        description: `Assessing ${total} ${cat} risk${total !== 1 ? 's' : ''} across the organization`,
        color: categoryColors[cat] || '#6B7280',
        risks: catRisks,
        assessed, inProgress, total, progress, highSevCount,
        assessors: uniqueAssessors, startedAt: oldestDate, daysSinceStart, isCompleted, isOverdue,
      };
    }).sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return b.highSevCount - a.highSevCount;
    });
  }, [risks]);

  // Recommendations (same logic, returned alongside derived data for use in renders)
  const { recommendations, unassessedRisks, highSevUnassessed } = useMemo(() => {
    const unassessed = risks.filter(r => !r.assessmentStatus || r.assessmentStatus === 'unassessed');
    const highSev = risks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4 && r.assessmentStatus !== 'assessed');
    const present = new Set(risks.map(r => r.category));
    const recs: Recommendation[] = [];

    const unassessedByCat = unassessed.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1; return acc;
    }, {});
    const topCat = Object.entries(unassessedByCat).sort(([, a], [, b]) => b - a)[0];

    if (highSev.length > 0) {
      recs.push({
        id: 'prio-high', type: 'priority',
        urgency: highSev.length >= 5 ? 'critical' : 'high',
        headline: `${highSev.length} high-severity risks unassessed`,
        reasoning: `Your register contains ${highSev.length} risks rated high or critical with no assessment started. Assessing these first reduces your greatest areas of exposure and is required under most risk frameworks before treatment can begin.`,
        source: 'Risk register analysis',
        affectedCount: highSev.length,
      });
    }

    if (topCat) {
      recs.push({
        id: 'top-cat', type: 'priority', urgency: 'high',
        headline: `${topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1)} risks have the most gaps`,
        reasoning: `${topCat[1]} of your ${topCat[0]} risks are currently unassessed — more than any other category. Completing this assessment would deliver the biggest single improvement to your overall coverage.`,
        source: 'Risk register analysis',
        affectedCategory: topCat[0],
        affectedCount: topCat[1],
      });
    }

    if (present.has('compliance')) {
      recs.push({
        id: 'reg-dora', type: 'regulation', urgency: 'high',
        headline: 'DORA operational resilience requirements',
        reasoning: 'The EU Digital Operational Resilience Act (DORA) entered full enforcement in January 2025. Financial entities must demonstrate ICT risk assessments are up to date. Any compliance or operational risks related to third-party ICT providers should be formally assessed and documented.',
        source: 'EU Regulation 2022/2554',
        affectedCategory: 'compliance',
      });
    }
    if (present.has('cyber')) {
      recs.push({
        id: 'reg-sec-cyber', type: 'regulation', urgency: 'high',
        headline: 'SEC cybersecurity disclosure rules',
        reasoning: "The SEC's cybersecurity disclosure rules require publicly traded companies to assess and disclose material cyber risks within 4 business days of a determination. Unassessed cyber risks create liability if a reportable incident occurs before an assessment is completed.",
        source: 'SEC Release 33-11216',
        affectedCategory: 'cyber',
      });
    }
    if (present.has('financial')) {
      recs.push({
        id: 'reg-ifrs9', type: 'regulation', urgency: 'medium',
        headline: 'IFRS 9 credit loss provisioning update',
        reasoning: 'Recent IASB guidance clarifies forward-looking ECL model requirements under IFRS 9. Changes to macroeconomic scenarios should trigger a reassessment of credit and liquidity risk ratings to ensure provisioning levels remain adequate.',
        source: 'IASB IFRS 9 Update Q1 2026',
        affectedCategory: 'financial',
      });
    }
    if (present.has('cyber')) {
      recs.push({
        id: 'news-ransomware', type: 'news', urgency: 'high',
        headline: 'Ransomware attacks up 38% this quarter',
        reasoning: 'Threat intelligence reports a 38% increase in ransomware incidents targeting mid-market enterprises in Q1 2026, with healthcare and professional services most affected. Peer benchmarks suggest organizations with unassessed cyber risks take 2.4× longer to contain incidents.',
        source: 'CrowdStrike Global Threat Report Q1 2026',
        affectedCategory: 'cyber',
      });
    }
    if (present.has('operational')) {
      recs.push({
        id: 'news-supply', type: 'news', urgency: 'medium',
        headline: 'Red Sea shipping disruptions continue',
        reasoning: 'Ongoing maritime disruptions are extending lead times by 3–6 weeks for goods transiting through the Suez Canal. Organizations with supplier concentration in Asia or Europe should review operational and supply chain risk ratings for updated likelihood scores.',
        source: 'Reuters Supply Chain Monitor, Mar 2026',
        affectedCategory: 'operational',
      });
    }
    if (present.has('strategic')) {
      recs.push({
        id: 'news-ai', type: 'news', urgency: 'medium',
        headline: 'AI adoption accelerating competitive pressure',
        reasoning: 'Gartner research shows 62% of enterprises have deployed AI in at least one core business process. Organizations that have not yet assessed strategic risks related to digital transformation and competitive disruption risk falling behind the assessment cycle.',
        source: 'Gartner Technology Trends 2026',
        affectedCategory: 'strategic',
      });
    }
    recs.push({
      id: 'periodic-q1', type: 'periodic', urgency: 'medium',
      headline: 'Q1 2026 periodic review cycle',
      reasoning: 'Risk frameworks including ISO 31000 and COSO ERM recommend a full risk reassessment at least quarterly. Completing a periodic review now ensures that risk ratings reflect current operating conditions and any changes since the last cycle.',
      source: 'ISO 31000:2018 · COSO ERM 2017',
    });

    return { recommendations: recs, unassessedRisks: unassessed, highSevUnassessed: highSev };
  }, [risks]);

  const typeConfig: Record<string, { label: string; Icon: React.ElementType }> = {
    priority: { label: 'Risk priority', Icon: ShieldIcon },
    regulation: { label: 'Regulation', Icon: RegulationIcon },
    news: { label: 'Industry news', Icon: NewsIcon },
    periodic: { label: 'Periodic review', Icon: PeriodicIcon },
  };

  const urgencyConfig: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    high: { label: 'High', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)' },
    medium: { label: 'Medium', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
  };

  const getScoreLabel = (risk: RiskSuggestion) => {
    const score = Math.round((risk.likelihood + risk.impact) / 2);
    return `${score} - ${severityLabels[score] || ''}`;
  };

  const getScoreColor = (risk: RiskSuggestion) => {
    const score = Math.round((risk.likelihood + risk.impact) / 2);
    return severityColors[score] || '#6B7280';
  };

  const openDraft = (risk: RiskSuggestion, idx: number) => {
    setDraftRisk(risk);
    setDraftRiskIndex(idx);
    setShowOverrideL(false);
    setShowOverrideI(false);
    setExpandedRationale(null);
    setOverrideLValue(risk.likelihood);
    setOverrideIValue(risk.impact);
  };

  // Persona handlers
  const handleEditPersona = (persona: AIAssessorPersona) => {
    if (editingPersonaId === persona.id) {
      setEditingPersonaId(null);
    } else {
      setEditingPersonaId(persona.id);
      setEditForm({ name: persona.name, role: persona.role, perspective: persona.perspective, biases: [...persona.biases], newBias: '' });
    }
  };

  const handleSavePersona = (personaId: string) => {
    updatePersona(personaId, { name: editForm.name, role: editForm.role, perspective: editForm.perspective, biases: editForm.biases, customisedByUser: true });
    setPersonas(getPersonas());
    setEditingPersonaId(null);
    setSnackMessage('Persona updated');
  };

  const handleTogglePersonaActive = (persona: AIAssessorPersona) => {
    updatePersona(persona.id, { active: !persona.active });
    setPersonas(getPersonas());
  };

  const handleRefreshPersonas = () => {
    setPersonasRefreshing(true);
    setTimeout(() => {
      setPersonasRefreshing(false);
      setSnackMessage('Personas refreshed from org chart data');
    }, 2000);
  };

  const handleAddPersona = () => {
    const biases = newPersonaForm.biasesText.split(',').map(b => b.trim()).filter(Boolean);
    const newP: AIAssessorPersona = {
      id: `persona-${Date.now()}`,
      name: newPersonaForm.name,
      role: newPersonaForm.role,
      department: newPersonaForm.department,
      perspective: newPersonaForm.perspective,
      biases,
      sourceContext: ['manual'],
      createdByAgent: false,
      customisedByUser: true,
      active: true,
      createdAt: new Date(),
    };
    addPersona(newP);
    setPersonas(getPersonas());
    setAddDialogOpen(false);
    setNewPersonaForm({ name: '', role: '', department: '', perspective: '', biasesText: '' });
    setSnackMessage('Persona added successfully');
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 0,
      mx: detailGroup ? { xs: -2, sm: '-4%', md: '-6%', lg: '-8%', xl: '-10%' } : 0,
      transition: 'margin 0.25s ease',
    }}>
      {/* ── Main content column ── */}
      <Box sx={{ flex: 1, minWidth: 0, pl: detailGroup ? 2 : 0, pr: detailGroup ? 2 : 0, transition: 'padding 0.2s ease' }}>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Assessments
          </Typography>
        </Stack>

        <Tabs
          value={activeTab}
          onChange={(_: React.SyntheticEvent, v: number) => setActiveTab(v)}
          sx={{
            mb: 3,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none' },
          }}
        >
          <Tab label="Assessment Queue" />
          <Tab label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <span>AI Assessor Personas</span>
              <Chip
                size="small"
                label="MANAGER ONLY"
                color="warning"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, pointerEvents: 'none' }}
              />
            </Stack>
          } />
          <Tab label="Existing assessments" />
        </Tabs>

        {/* ═══════════════════════════════════════════════
            TAB 0 — Assessment Queue
        ═══════════════════════════════════════════════ */}
        {activeTab === 0 && (
          risks.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                No approved risks yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approve risks from the Risk Discovery page to see assessment suggestions here.
              </Typography>
            </Paper>
          ) : (
            <>
              {/* A) Coverage metrics — compact single-line row */}
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
              >
                <Typography variant="body2" color="text.secondary">Assessment coverage:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>62%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={62}
                  sx={{
                    width: 120, height: 6, borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.08)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#60a5fa', borderRadius: 3 },
                  }}
                />
                <Typography variant="body2" color="text.disabled">·</Typography>
                <Typography variant="body2" color="text.secondary">
                  <Box component="span" sx={{ color: '#f87171', fontWeight: 700 }}>4</Box> high-priority gaps
                </Typography>
                <Typography variant="body2" color="text.disabled">·</Typography>
                <Typography variant="body2" color="text.secondary">
                  <Box component="span" sx={{ color: '#fbbf24', fontWeight: 700 }}>2</Box> overdue
                </Typography>
                <Typography variant="body2" color="text.disabled">·</Typography>
                <Typography variant="body2" color="text.secondary">
                  <Box component="span" sx={{ color: '#60a5fa', fontWeight: 700 }}>3</Box> awaiting synthesis
                </Typography>
              </Stack>

              {/* D) Smart recommendations (with KRI linkages) */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                <SparkleIcon sx={{ fontSize: 18, color: 'primary.light' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Recommended assessments
                </Typography>
                <Chip size="small" label={`${recommendations.length} triggers`} sx={{ height: 20, fontSize: '0.7rem' }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Based on your risk register, active regulations, and industry intelligence — sorted by urgency.
              </Typography>

              <Stack spacing={1} sx={{ mb: 3 }}>
                {recommendations.map((rec, recIdx) => {
                  const tc = typeConfig[rec.type];
                  const uc = urgencyConfig[rec.urgency];
                  const TypeIcon = tc.Icon;
                  const isOpen = expandedRec === rec.id;
                  const kriLinkage = recIdx < KRI_LINKAGES.length ? KRI_LINKAGES[recIdx] : null;

                  let recRisks = risks;
                  if (rec.affectedCategory) {
                    recRisks = risks.filter(r => r.category === rec.affectedCategory);
                  } else if (rec.id === 'prio-high' || rec.urgency === 'critical') {
                    recRisks = highSevUnassessed;
                  } else {
                    recRisks = unassessedRisks;
                  }

                  return (
                    <Paper key={rec.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                      <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          onClick={() => setExpandedRec(isOpen ? null : rec.id)}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0, cursor: 'pointer' }}
                        >
                          <TypeIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{rec.headline}</Typography>
                              <Chip
                                size="small"
                                label={uc.label}
                                sx={{ height: 17, fontSize: '0.75rem', fontWeight: 600, bgcolor: uc.bg, color: uc.color, flexShrink: 0 }}
                              />
                            </Stack>
                            <Typography variant="caption" color="text.disabled">{tc.label}</Typography>
                            {kriLinkage && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#f87171', mt: 0.25 }}>
                                {kriLinkage}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailGroup({
                                id: `rec-${rec.id}`,
                                label: rec.headline,
                                description: rec.reasoning,
                                risks: recRisks,
                                source: rec.source,
                                urgency: rec.urgency,
                                recType: rec.type,
                              });
                            }}
                          >
                            Show details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => setSnackMessage('Assessment added to queue')}
                          >
                            Start assessment
                          </Button>
                          <Box
                            onClick={() => setExpandedRec(isOpen ? null : rec.id)}
                            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'text.secondary', pl: 0.5 }}
                          >
                            {isOpen ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
                          </Box>
                        </Stack>
                      </Box>

                      <Collapse in={isOpen}>
                        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <Box sx={{ px: 2, pt: 1.5, pb: 1.25 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 1 }}>
                              {rec.reasoning}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                {rec.source}
                              </Typography>
                              {rec.affectedCount !== undefined && (
                                <Chip size="small" label={`${rec.affectedCount} risk${rec.affectedCount !== 1 ? 's' : ''} affected`} sx={{ height: 18, fontSize: '0.75rem' }} />
                              )}
                              {rec.affectedCategory && (
                                <Chip size="small" label={rec.affectedCategory.charAt(0).toUpperCase() + rec.affectedCategory.slice(1)} sx={{ height: 18, fontSize: '0.75rem' }} />
                              )}
                            </Stack>
                          </Box>
                          {recRisks.length > 0 && (
                            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'rgba(13,17,23,0.5)' }}>
                                      <TableCell sx={{ fontWeight: 600, width: 80 }}>ID</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Risk</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Inherent score</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {recRisks.map(risk => (
                                      <TableRow key={risk.id} hover>
                                        <TableCell>
                                          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.02em' }}>
                                            {getRiskDisplayId(risk.id, risks)}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{risk.title}</Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Chip size="small" label={risk.category.charAt(0).toUpperCase() + risk.category.slice(1)} variant="outlined"
                                            sx={{ height: 22, fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }} />
                                        </TableCell>
                                        <TableCell>
                                          <Stack direction="row" spacing={1} alignItems="center">
                                            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: getScoreColor(risk) }} />
                                            <Typography variant="body2">{getScoreLabel(risk)}</Typography>
                                          </Stack>
                                        </TableCell>
                                        <TableCell>
                                          {risk.suggestedOwner ? (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: ownerColors[risk.suggestedOwner.name] || '#6B7280' }}>
                                                {risk.suggestedOwner.name.split(' ').map(n => n[0]).join('')}
                                              </Avatar>
                                              <Typography variant="body2">{risk.suggestedOwner.name}</Typography>
                                            </Stack>
                                          ) : (
                                            <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Stack>

              {/* C) Priority Assessment Queue */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Priority Assessment Queue</Typography>
                <Typography variant="caption" color="text.secondary">
                  Ranked by risk score · Top {priorityQueue.length}
                </Typography>
              </Stack>

              <Stack spacing={1.5}>
                {priorityQueue.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      All risks have been assessed or deferred.
                    </Typography>
                  </Paper>
                ) : (
                  priorityQueue.map((risk, idx) => (
                    <Paper
                      key={risk.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderColor: idx < 3 ? 'rgba(96,165,250,0.2)' : 'divider',
                        borderLeft: idx < 3 ? '3px solid rgba(96,165,250,0.4)' : '1px solid',
                        borderLeftColor: idx < 3 ? 'rgba(96,165,250,0.4)' : 'divider',
                      }}
                    >
                      <Stack spacing={1}>
                        {/* Header row */}
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5, flex: 1, mr: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', minWidth: 26 }}>
                              #{idx + 1}
                            </Typography>
                            <Chip
                              size="small"
                              label={risk.category.charAt(0).toUpperCase() + risk.category.slice(1)}
                              variant="outlined"
                              sx={{
                                height: 20, fontSize: '0.7rem',
                                borderColor: (categoryColors[risk.category] as string | undefined) ? `${categoryColors[risk.category]}60` : 'rgba(255,255,255,0.2)',
                                color: categoryColors[risk.category] || 'text.secondary',
                              }}
                            />
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}>
                              {getRiskDisplayId(risk.id, risks)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{risk.title}</Typography>
                          </Stack>
                          {idx < 3 && (
                            <Chip
                              size="small"
                              label="AGENT DRAFTED"
                              sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                                bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa',
                                border: '1px solid rgba(96,165,250,0.3)',
                              }}
                            />
                          )}
                        </Stack>

                        {/* Priority reason */}
                        <Typography variant="caption" color="text.secondary">
                          Priority reason:{' '}
                          <Box component="span" sx={{ color: idx < 3 ? '#f87171' : 'text.secondary', fontWeight: 600 }}>
                            {idx < 3 ? 'KRI signal: RED' : '90d unassessed'}
                          </Box>
                          {' · '}
                          {idx < 3 ? '14d since last assessment' : 'Never assessed'}
                        </Typography>

                        {/* Inherent + Owner */}
                        <Typography variant="caption" color="text.secondary">
                          Inherent:{' '}
                          <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>L:{risk.likelihood}</Box>
                          {' × '}
                          <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>I:{risk.impact}</Box>
                          {'  ·  '}
                          Owner: {risk.suggestedOwner?.name || 'Unassigned'}
                        </Typography>

                        {/* Actions */}
                        <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openDraft(risk, idx)}
                          >
                            Review draft
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => setSnackMessage('Assessment approved')}
                          >
                            Approve draft
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            sx={{ color: 'text.secondary' }}
                            onClick={() => {
                              setDeferredRiskIds(prev => new Set([...prev, risk.id]));
                              setSnackMessage('Deferred from this cycle');
                            }}
                          >
                            Defer
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </>
          )
        )}

        {/* ═══════════════════════════════════════════════
            TAB 1 — AI Assessor Personas
        ═══════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <>
            {/* Header row */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Assessors</Typography>
                <Typography variant="body2" color="text.secondary">
                  {personas.filter(p => p.active).length} active personas
                </Typography>
                <Typography variant="body2" color="text.secondary">Last refreshed by agent: 2d ago</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                >
                  Add persona manually
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={personasRefreshing}
                  startIcon={personasRefreshing
                    ? <CircularProgress size={14} color="inherit" />
                    : <RefreshIcon sx={{ fontSize: 16 }} />
                  }
                  onClick={handleRefreshPersonas}
                >
                  Run agent: refresh personas
                </Button>
              </Stack>
            </Stack>

            {/* Persona cards — 2-column grid */}
            <Grid container spacing={2}>
              {personas.map(persona => (
                <Grid key={persona.id} size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.02)' }}>
                    {/* Card header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label="AI"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{persona.name}</Typography>
                      </Stack>
                      <Chip
                        size="small"
                        label={persona.active ? 'ACTIVE' : 'INACTIVE'}
                        sx={{
                          height: 20, fontSize: '0.65rem', fontWeight: 700,
                          bgcolor: persona.active ? 'rgba(76,175,80,0.15)' : 'rgba(148,163,184,0.1)',
                          color: persona.active ? '#4caf50' : '#94a3b8',
                          border: `1px solid ${persona.active ? 'rgba(76,175,80,0.3)' : 'rgba(148,163,184,0.2)'}`,
                        }}
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>{persona.role}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1.5 }}>{persona.department}</Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Perspective</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>{persona.perspective}</Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>Known biases</Typography>
                    <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5, mb: 1.5 }}>
                      {persona.biases.map(b => (
                        <Chip key={b} size="small" label={b} variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem', color: 'text.secondary', borderColor: 'rgba(255,255,255,0.12)' }} />
                      ))}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>Source context</Typography>
                    <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5, mb: 2 }}>
                      {persona.sourceContext.map(s => (
                        <Chip key={s} size="small" label={sourceLabels[s] || s}
                          sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.06)', color: 'text.secondary' }} />
                      ))}
                    </Stack>

                    {/* Action row */}
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.5 }}>
                      <Button size="small" variant="outlined" onClick={() => handleEditPersona(persona)}>
                        {editingPersonaId === persona.id ? 'Cancel edit' : 'Edit persona'}
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => handleTogglePersonaActive(persona)}>
                        {persona.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => setSnackMessage('Persona applied to current assessment cycle')}>
                        Apply to cycle
                      </Button>
                    </Stack>

                    {/* Inline edit section */}
                    <Collapse in={editingPersonaId === persona.id}>
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <Stack spacing={1.5}>
                          <TextField
                            label="Name" size="small" fullWidth
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                          />
                          <TextField
                            label="Role" size="small" fullWidth
                            value={editForm.role}
                            onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                          />
                          <TextField
                            label="Perspective" size="small" fullWidth multiline rows={3}
                            value={editForm.perspective}
                            onChange={e => setEditForm(f => ({ ...f, perspective: e.target.value }))}
                          />

                          {/* Biases tag editor */}
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
                              Biases
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5, mb: 1 }}>
                              {editForm.biases.map(b => (
                                <Chip
                                  key={b}
                                  size="small"
                                  label={b}
                                  variant="outlined"
                                  onDelete={() => setEditForm(f => ({ ...f, biases: f.biases.filter(x => x !== b) }))}
                                  sx={{ height: 24, fontSize: '0.7rem', color: 'text.secondary', borderColor: 'rgba(255,255,255,0.15)' }}
                                />
                              ))}
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <TextField
                                size="small"
                                placeholder="Add a bias tag..."
                                value={editForm.newBias}
                                onChange={e => setEditForm(f => ({ ...f, newBias: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && editForm.newBias.trim()) {
                                    setEditForm(f => ({ ...f, biases: [...f.biases, f.newBias.trim()], newBias: '' }));
                                  }
                                }}
                                sx={{ flex: 1 }}
                              />
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  if (editForm.newBias.trim()) {
                                    setEditForm(f => ({ ...f, biases: [...f.biases, f.newBias.trim()], newBias: '' }));
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </Stack>
                          </Box>

                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" onClick={() => handleSavePersona(persona.id)}>
                              Save changes
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => setEditingPersonaId(null)}>
                              Cancel
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                    </Collapse>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* ═══════════════════════════════════════════════
            TAB 2 — Existing Assessments
        ═══════════════════════════════════════════════ */}
        {activeTab === 2 && (() => {
          const inProgressCount = existingAssessmentGroups.filter(g => !g.isCompleted).length;
          const completedCount = existingAssessmentGroups.filter(g => g.isCompleted).length;
          const overdueCount = existingAssessmentGroups.filter(g => g.isOverdue).length;
          const totalAssessed = existingAssessmentGroups.reduce((s, g) => s + g.assessed, 0);
          const totalInExisting = existingAssessmentGroups.reduce((s, g) => s + g.total, 0);
          const highPriorityInProgress = existingAssessmentGroups.filter(g => !g.isCompleted && g.highSevCount > 0);

          const filtered = existingAssessmentGroups.filter(g => {
            if (existingFilter === 'in_progress') return !g.isCompleted;
            if (existingFilter === 'completed') return g.isCompleted;
            return true;
          });

          if (existingAssessmentGroups.length === 0) {
            return (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  No assessments in progress yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start an assessment from the suggestions tab and it will appear here.
                </Typography>
              </Paper>
            );
          }

          return (
            <>
              {/* Stats row */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ClockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">In progress</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{inProgressCount}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        active assessment{inProgressCount !== 1 ? 's' : ''}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CompletedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">Completed</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{completedCount}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        assessment{completedCount !== 1 ? 's' : ''} done
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%', borderColor: overdueCount > 0 ? 'rgba(248,113,113,0.3)' : undefined }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <OverdueIcon sx={{ fontSize: 18, color: overdueCount > 0 ? '#f87171' : 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">Overdue</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: overdueCount > 0 ? '#f87171' : undefined }}>
                        {overdueCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">past target date</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ProgressIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">Overall progress</Typography>
                      </Stack>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {totalInExisting > 0 ? Math.round((totalAssessed / totalInExisting) * 100) : 0}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {totalAssessed} of {totalInExisting} risks assessed
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* High priority spotlight */}
              {highPriorityInProgress.length > 0 && (
                <Box sx={{
                  mb: 3, p: 2, borderRadius: 2,
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderLeft: '3px solid #f87171',
                  background: 'rgba(248,113,113,0.03)',
                }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                    <PriorityIcon sx={{ color: '#f87171', fontSize: 16 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Needs immediate attention</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {highPriorityInProgress.reduce((s, g) => s + g.highSevCount, 0)} high-severity risks across in-progress assessments
                    </Typography>
                  </Stack>
                  <Stack spacing={0.75}>
                    {highPriorityInProgress.slice(0, 3).map(g => (
                      <Box key={g.id} sx={{ px: 1.5, py: 1, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,13,24,0.4)' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{g.label}</Typography>
                              {g.isOverdue && (
                                <Chip size="small" label="Overdue" sx={{ height: 17, fontSize: '0.75rem', bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171' }} />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {g.highSevCount} high/critical · {g.progress}% assessed · {g.total} in scope
                            </Typography>
                          </Box>
                          <Button size="small" variant="outlined" endIcon={<ArrowIcon />} sx={{ flexShrink: 0 }}>
                            Continue
                          </Button>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Filter chips */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>Show:</Typography>
                {(['all', 'in_progress', 'completed'] as const).map(f => (
                  <Chip
                    key={f}
                    label={f === 'all' ? `All (${existingAssessmentGroups.length})` : f === 'in_progress' ? `In progress (${inProgressCount})` : `Completed (${completedCount})`}
                    size="small"
                    onClick={() => setExistingFilter(f)}
                    variant={existingFilter === f ? 'filled' : 'outlined'}
                    sx={{
                      height: 28, cursor: 'pointer',
                      ...(existingFilter === f
                        ? { bgcolor: 'rgba(96,165,250,0.18)', color: 'primary.light', border: '1px solid rgba(96,165,250,0.35)' }
                        : { color: 'text.secondary' }),
                    }}
                  />
                ))}
              </Stack>

              {/* Assessment group cards */}
              {filtered.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No {existingFilter === 'in_progress' ? 'in-progress' : 'completed'} assessments.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {filtered.map(g => {
                    const statusChip = g.isOverdue
                      ? { label: 'Overdue', bg: 'rgba(244,67,54,0.15)', color: '#f44336', border: 'rgba(244,67,54,0.35)' }
                      : g.isCompleted
                        ? { label: 'Completed', bg: 'rgba(76,175,80,0.15)', color: '#4caf50', border: 'rgba(76,175,80,0.35)' }
                        : { label: 'In progress', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' };
                    const barColor = g.isOverdue ? '#f87171' : g.isCompleted ? '#34d399' : '#60a5fa';
                    const kriIndicators = KRI_INDICATORS[g.id] || [];

                    return (
                      <Paper key={g.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                        <Box sx={{ p: 2.5 }}>
                          {/* Header row */}
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                            <Box sx={{ flex: 1, mr: 2 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{g.label}</Typography>
                                <Chip
                                  size="small"
                                  label={statusChip.label}
                                  sx={{ height: 20, fontSize: '0.7rem', bgcolor: statusChip.bg, color: statusChip.color, border: `1px solid ${statusChip.border}` }}
                                />
                                {g.highSevCount > 0 && !g.isCompleted && (
                                  <Chip
                                    size="small"
                                    icon={<SeverityIcon sx={{ fontSize: '11px !important', color: '#f87171 !important' }} />}
                                    label={`${g.highSevCount} high severity`}
                                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171' }}
                                  />
                                )}
                                {/* KRI chips */}
                                {kriIndicators.map((kri, ki) => (
                                  <Chip
                                    key={ki}
                                    size="small"
                                    label={`● ${kri.count} ${kri.status} KRI${kri.count > 1 ? 's' : ''}`}
                                    sx={{
                                      height: 20, fontSize: '0.7rem', fontWeight: 600,
                                      bgcolor: kri.status === 'red' ? 'rgba(244,67,54,0.1)' : 'rgba(255,152,0,0.1)',
                                      color: kri.status === 'red' ? '#f44336' : '#ff9800',
                                    }}
                                  />
                                ))}
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {g.description}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, mt: 0.25 }}>
                              {g.daysSinceStart === 0 ? 'Started today' : `Started ${g.daysSinceStart}d ago`}
                            </Typography>
                          </Stack>

                          {/* Progress bar */}
                          <Box sx={{ mb: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                              <Typography variant="caption" color="text.secondary">Assessment progress</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {g.assessed} of {g.total} risks assessed · {g.progress}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={g.progress}
                              sx={{
                                height: 5, borderRadius: 3,
                                bgcolor: 'rgba(255,255,255,0.06)',
                                '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 },
                              }}
                            />
                          </Box>

                          <Divider sx={{ borderColor: 'rgba(96,165,250,0.07)', mb: 2 }} />

                          {/* Footer row */}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AvatarGroup
                                max={4}
                                sx={{
                                  '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, border: '2px solid rgba(14,20,35,0.8)' },
                                  '& .MuiAvatarGroup-avatar': { bgcolor: 'rgba(96,165,250,0.2)', color: 'primary.light', fontSize: '0.75rem' },
                                }}
                              >
                                {g.assessors.map(a => (
                                  <Tooltip key={a.name} title={`${a.name} · ${a.role}`} arrow>
                                    <Avatar sx={{ bgcolor: ownerColors[a.name] || '#6B7280' }}>
                                      {a.name.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                  </Tooltip>
                                ))}
                              </AvatarGroup>
                              <Typography variant="caption" color="text.secondary">
                                {g.assessors.length} assessor{g.assessors.length !== 1 ? 's' : ''}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              {g.isCompleted ? (
                                <>
                                  <Button size="small" variant="text">Archive</Button>
                                  <Button size="small" variant="outlined" endIcon={<ArrowIcon />}>Review results</Button>
                                </>
                              ) : (
                                <>
                                  <Button size="small" variant="text">View risks</Button>
                                  <Button size="small" variant="contained" endIcon={<ArrowIcon />}>Continue</Button>
                                </>
                              )}
                            </Stack>
                          </Stack>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </>
          );
        })()}

      </Box>{/* end main content column */}

      {/* ── Docked detail panel ── */}
      {detailGroup && (
        <Box sx={{
          width: '50%',
          flexShrink: 0,
          position: 'sticky',
          top: '56px',
          mt: '-24px',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          borderLeft: '1px solid rgba(96,165,250,0.1)',
          background: 'rgba(10, 16, 30, 0.70)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}>
          <AssessmentDetailPanel
            group={detailGroup}
            onClose={() => setDetailGroup(null)}
            onStart={() => setDetailGroup(null)}
            allRisks={risks}
          />
        </Box>
      )}

      {/* ── Assessment Draft Drawer ── */}
      <Drawer
        anchor="right"
        open={draftRisk !== null}
        onClose={() => setDraftRisk(null)}
        PaperProps={{ sx: { width: 640, p: 3 } }}
      >
        {draftRisk && (
          <Box sx={{ height: '100%', overflowY: 'auto', pb: 4 }}>
            {/* Drawer header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Review Assessment Draft</Typography>
              <IconButton size="small" onClick={() => setDraftRisk(null)}><CloseIcon /></IconButton>
            </Stack>

            {/* ── Section 1: Pre-filled assessment ── */}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 1.5 }}>
              Pre-filled Assessment
            </Typography>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: 'rgba(255,255,255,0.03)' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{draftRisk.title}</Typography>
                <Chip
                  size="small"
                  label={draftRisk.category.charAt(0).toUpperCase() + draftRisk.category.slice(1)}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem', color: 'text.secondary' }}
                />
              </Stack>

              <Grid container spacing={3}>
                {/* Likelihood */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                    LIKELIHOOD
                  </Typography>
                  {showOverrideL ? (
                    <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                      <Select
                        value={overrideLValue}
                        onChange={e => setOverrideLValue(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5].map(v => (
                          <MenuItem key={v} value={v}>{v} — {severityLabels[v]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}>
                      {draftRisk.likelihood}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
                    Agent basis: KRI trend + prior incidents
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => { setShowOverrideL(!showOverrideL); if (!showOverrideL) setOverrideLValue(draftRisk.likelihood); }}
                  >
                    {showOverrideL ? 'Revert' : 'Override'}
                  </Button>
                </Grid>

                {/* Impact */}
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                    IMPACT
                  </Typography>
                  {showOverrideI ? (
                    <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                      <Select
                        value={overrideIValue}
                        onChange={e => setOverrideIValue(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5].map(v => (
                          <MenuItem key={v} value={v}>{v} — {severityLabels[v]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}>
                      {draftRisk.impact}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
                    Agent basis: system criticality + exposure scope
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => { setShowOverrideI(!showOverrideI); if (!showOverrideI) setOverrideIValue(draftRisk.impact); }}
                  >
                    {showOverrideI ? 'Revert' : 'Override'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* ── Section 2: Assessor opinions ── */}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 1.5 }}>
              Assessor Opinions
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(13,17,23,0.5)' }}>
                    <TableCell sx={{ fontWeight: 700 }}>ASSESSOR</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 40, textAlign: 'center' }}>L</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 40, textAlign: 'center' }}>I</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>CONFIDENCE</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>RATIONALE</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draftOpinions.map(opinion => (
                    <TableRow
                      key={opinion.assessorId}
                      sx={opinion.assessorType === 'ai_persona'
                        ? { borderLeft: '2px solid rgba(96,165,250,0.4)' }
                        : {}
                      }
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{opinion.assessorName}</Typography>
                      </TableCell>
                      <TableCell>
                        {opinion.assessorType === 'ai_persona' ? (
                          <Chip size="small" label="AI" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }} />
                        ) : (
                          <Chip size="small" label="Human" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.06)', color: 'text.secondary' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{opinion.likelihood}</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{opinion.impact}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={opinion.confidence}
                          sx={{
                            height: 18, fontSize: '0.65rem',
                            bgcolor: opinion.confidence === 'high' ? 'rgba(76,175,80,0.12)' : opinion.confidence === 'medium' ? 'rgba(255,152,0,0.12)' : 'rgba(244,67,54,0.12)',
                            color: opinion.confidence === 'high' ? '#4caf50' : opinion.confidence === 'medium' ? '#ff9800' : '#f44336',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: expandedRationale === opinion.assessorId ? 'unset' : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {opinion.rationale}
                        </Typography>
                        <Box
                          component="span"
                          onClick={() => setExpandedRationale(expandedRationale === opinion.assessorId ? null : opinion.assessorId)}
                          sx={{ cursor: 'pointer', color: 'primary.light', fontSize: '0.7rem', display: 'block', mt: 0.25 }}
                        >
                          {expandedRationale === opinion.assessorId ? 'Collapse' : 'Expand'}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Synthesised result row */}
                  {draftSynthesised && (
                    <TableRow sx={{ borderLeft: '2px solid rgba(96,165,250,0.4)', bgcolor: 'rgba(96,165,250,0.04)' }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Synthesised result</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#60a5fa' }}>
                          {draftSynthesised.likelihood.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#60a5fa' }}>
                          {draftSynthesised.impact.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={draftSynthesised.confidenceLevel}
                          sx={{
                            height: 18, fontSize: '0.65rem',
                            bgcolor: draftSynthesised.confidenceLevel === 'high' ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)',
                            color: draftSynthesised.confidenceLevel === 'high' ? '#4caf50' : '#ff9800',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Spread indicator */}
            {draftSynthesised && (
              <Box sx={{ mb: 2.5, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1.5 }}>
                  Spread indicator
                </Typography>
                {[
                  { label: 'L', values: draftOpinions.map(o => o.likelihood), synthesised: draftSynthesised.likelihood, color: '#60a5fa' },
                  { label: 'I', values: draftOpinions.map(o => o.impact), synthesised: draftSynthesised.impact, color: '#fbbf24' },
                ].map(({ label, values, synthesised, color }) => (
                  <Stack key={label} direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', width: 12, textAlign: 'center' }}>
                      {label}
                    </Typography>
                    <Box sx={{ position: 'relative', width: 80, height: 14 }}>
                      <svg width="80" height="14" style={{ overflow: 'visible' }}>
                        <line x1="0" y1="7" x2="80" y2="7" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                        {values.map((v, i) => (
                          <circle key={i} cx={(v - 1) * 20} cy="7" r="3" fill={color} fillOpacity="0.6" />
                        ))}
                        <circle cx={Math.min(80, Math.max(0, (synthesised - 1) * 20))} cy="7" r="4.5" fill={color} stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                      </svg>
                    </Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.62rem' }}>1 ─── 5</Typography>
                  </Stack>
                ))}
              </Box>
            )}

            {/* What changed */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                What changed since last assessment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {draftSynthesised?.whatChanged || 'Inherent likelihood increased from 3.0 to 3.8 since Q3 2025 assessment.'}
              </Typography>
            </Box>

            {/* Confidence level */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Confidence level:</Typography>
              <Chip
                size="small"
                label={draftSynthesised?.confidenceLevel
                  ? draftSynthesised.confidenceLevel.charAt(0).toUpperCase() + draftSynthesised.confidenceLevel.slice(1)
                  : 'Medium'
                }
                sx={{
                  height: 22,
                  bgcolor: draftSynthesised?.confidenceLevel === 'high' ? 'rgba(76,175,80,0.15)' : draftSynthesised?.confidenceLevel === 'low' ? 'rgba(244,67,54,0.15)' : 'rgba(255,152,0,0.15)',
                  color: draftSynthesised?.confidenceLevel === 'high' ? '#4caf50' : draftSynthesised?.confidenceLevel === 'low' ? '#f44336' : '#ff9800',
                }}
              />
            </Stack>

            {/* ── Section 3: Actions ── */}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 1.5 }}>
              Actions
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Button
                variant="contained"
                onClick={() => { setSnackMessage('Assessment approved'); setDraftRisk(null); }}
              >
                Approve synthesised result
              </Button>
              <Button
                variant="outlined"
                onClick={() => { setSnackMessage('Rating overridden and saved'); setDraftRisk(null); }}
              >
                Override rating
              </Button>
              <Button
                variant="outlined"
                onClick={() => { setSnackMessage('Re-assessment requested'); setDraftRisk(null); }}
              >
                Request re-assessment
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* ── Add Persona Dialog ── */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'rgba(16,22,36,0.98)' } }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Add Persona Manually</Typography>
            <IconButton size="small" onClick={() => setAddDialogOpen(false)}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name" size="small" fullWidth required
              value={newPersonaForm.name}
              onChange={e => setNewPersonaForm(f => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Role" size="small" fullWidth required
              value={newPersonaForm.role}
              onChange={e => setNewPersonaForm(f => ({ ...f, role: e.target.value }))}
            />
            <TextField
              label="Department" size="small" fullWidth required
              value={newPersonaForm.department}
              onChange={e => setNewPersonaForm(f => ({ ...f, department: e.target.value }))}
            />
            <TextField
              label="Perspective" size="small" fullWidth multiline rows={3}
              value={newPersonaForm.perspective}
              onChange={e => setNewPersonaForm(f => ({ ...f, perspective: e.target.value }))}
              helperText="Describe how this persona evaluates risks"
            />
            <TextField
              label="Biases" size="small" fullWidth
              value={newPersonaForm.biasesText}
              onChange={e => setNewPersonaForm(f => ({ ...f, biasesText: e.target.value }))}
              helperText="Comma-separated list of known biases"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddPersona}
            disabled={!newPersonaForm.name || !newPersonaForm.role}
          >
            Add Persona
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackMessage !== null}
        autoHideDuration={3000}
        onClose={() => setSnackMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnackMessage(null)} sx={{ width: '100%' }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
