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
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Sort as SortIcon,
  AutoAwesome as AIBadgeIcon,
  Send as SendIcon,
  FlagOutlined as OutlierIcon,
  CompareArrows as DeltaIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import type { RiskSuggestion } from '@/types/document';
import { getApprovedRisks, updateApprovedRisk } from '@/lib/risk-store';
import { RISK_CATEGORY_COLORS, getRiskDisplayId } from '@/lib/utils';
import { AssessmentDetailPanel, type AssessmentGroup } from '@/components/assessment/AssessmentDetailDrawer';
import { getPersonas, updatePersona, addPersona } from '@/lib/persona-store';
import { getKRIs } from '@/lib/kri-store';
import { MOCK_SYNTHESISED_ASSESSMENTS } from '@/data/mock/synthesis';
import { MOCK_PERSONAS } from '@/data/mock/personas';
import type { AIAssessorPersona, AssessorOpinion } from '@/types/assessor-persona';
import type { KeyRiskIndicator } from '@/types/kri';

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

// KRI helpers — derived dynamically from the store (see component state)
function getKRIChipsForCategory(kris: KeyRiskIndicator[], category: string): Array<{ count: number; status: 'red' | 'amber' }> {
  const catKRIs = kris.filter((k) => k.category === category && k.status !== 'green');
  const red = catKRIs.filter((k) => k.status === 'red').length;
  const amber = catKRIs.filter((k) => k.status === 'amber').length;
  const result: Array<{ count: number; status: 'red' | 'amber' }> = [];
  if (red > 0) result.push({ count: red, status: 'red' });
  if (amber > 0) result.push({ count: amber, status: 'amber' });
  return result;
}

function getKRILinkageText(kris: KeyRiskIndicator[], category: string): string | null {
  const catKRIs = kris.filter((k) => k.category === category);
  const redKRIs = catKRIs.filter((k) => k.status === 'red');
  if (redKRIs.length === 0) return null;
  const names = redKRIs.slice(0, 2).map((k) => k.name).join(', ');
  return `↳ KRI signal${redKRIs.length > 1 ? 's' : ''}: ${names}${redKRIs.length > 2 ? ` +${redKRIs.length - 2} more` : ''} — currently RED`;
}

// Map category → MOCK_SYNTHESISED_ASSESSMENTS index
const RESULTS_BY_CATEGORY: Record<string, number> = {
  cyber: 0,
  financial: 1,
  compliance: 2,
};

const SCORE_LABEL: Record<number, string> = { 1: 'Very low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very high' };
const SCORE_COLOR: Record<number, string> = { 1: '#4ade80', 2: '#86efac', 3: '#fbbf24', 4: '#f97316', 5: '#f87171' };
const CONF_COLOR: Record<string, string> = { high: '#4ade80', medium: '#fbbf24', low: '#f87171' };

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
  const [kris, setKRIs] = useState<KeyRiskIndicator[]>([]);
  const [deferredRiskIds, setDeferredRiskIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState(0);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [expandedPersonaId, setExpandedPersonaId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'recommendation' | 'category' | 'owner' | 'urgency'>('recommendation');
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);
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
  // Results panel state for Tab 1
  const [expandedResultGroupId, setExpandedResultGroupId] = useState<string | null>(null);
  const [expandedRiskResultId, setExpandedRiskResultId] = useState<string | null>(null);
  // AI prompt for persona editing
  const [personaAIPrompt, setPersonaAIPrompt] = useState('');
  const [personaAIApplying, setPersonaAIApplying] = useState(false);

  useEffect(() => {
    setRisks(getApprovedRisks());
    setKRIs(getKRIs());
  }, []);
  useEffect(() => { setPersonas(getPersonas()); }, []);

  // ── Start assessment handler ─────────────────────────────────────────────
  function startAssessment(affectedCategory?: string, specificRisks?: RiskSuggestion[]) {
    const toStart = specificRisks
      ?? (affectedCategory
        ? risks.filter(r => r.category === affectedCategory && r.assessmentStatus === 'unassessed')
        : risks.filter(r => r.assessmentStatus === 'unassessed').slice(0, 5));
    if (toStart.length === 0) {
      setSnackMessage('No unassessed risks to start');
      return;
    }
    toStart.forEach(r => updateApprovedRisk(r.id, { assessmentStatus: 'in_progress' }));
    const updated = getApprovedRisks();
    setRisks(updated);
    setActiveTab(1);
    // Auto-expand the newly started category
    if (affectedCategory) setExpandedResultGroupId(affectedCategory);
    setSnackMessage(`Assessment started for ${toStart.length} risk${toStart.length !== 1 ? 's' : ''} — ${affectedCategory ? affectedCategory + ' category' : 'selected risks'}`);
  }

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

  // ── Group-by derived data ─────────────────────────────────────────────────
  const categoryGroups = useMemo(() => {
    const map: Record<string, RiskSuggestion[]> = {};
    unassessedRisks.forEach(r => {
      const key = r.category || 'other';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map)
      .map(([cat, catRisks]) => ({
        key: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        risks: [...catRisks].sort((a, b) => (b.likelihood + b.impact) - (a.likelihood + a.impact)),
        color: (categoryColors[cat] as string | undefined) || '#6B7280',
        highSevCount: catRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length,
      }))
      .sort((a, b) => b.highSevCount - a.highSevCount || b.risks.length - a.risks.length);
  }, [unassessedRisks]);

  const ownerGroups = useMemo(() => {
    const map: Record<string, RiskSuggestion[]> = {};
    unassessedRisks.forEach(r => {
      const key = r.suggestedOwner?.name || 'Unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map)
      .map(([owner, ownerRisks]) => ({
        key: owner,
        label: owner,
        role: ownerRisks.find(r => r.suggestedOwner?.name === owner)?.suggestedOwner?.role || '',
        risks: [...ownerRisks].sort((a, b) => (b.likelihood + b.impact) - (a.likelihood + a.impact)),
        highSevCount: ownerRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length,
      }))
      .sort((a, b) => b.highSevCount - a.highSevCount || b.risks.length - a.risks.length);
  }, [unassessedRisks]);

  const urgencyGroups = useMemo(() => {
    const bands = [
      { key: 'critical', label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', min: 5, max: 5 },
      { key: 'high',     label: 'High',     color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.3)',  min: 4, max: 4 },
      { key: 'medium',   label: 'Medium',   color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.2)', min: 3, max: 3 },
      { key: 'low',      label: 'Low',      color: '#4ade80', bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)',  min: 1, max: 2 },
    ];
    return bands
      .map(b => ({
        ...b,
        risks: unassessedRisks
          .filter(r => { const s = Math.round((r.likelihood + r.impact) / 2); return s >= b.min && s <= b.max; })
          .sort((a, b) => (b.likelihood + b.impact) - (a.likelihood + a.impact)),
      }))
      .filter(b => b.risks.length > 0);
  }, [unassessedRisks]);

  // ── Overview stats + priority actions ───────────────────────────────────
  const overviewStats = useMemo(() => {
    const assessed    = risks.filter(r => r.assessmentStatus === 'assessed').length;
    const inProgress  = risks.filter(r => r.assessmentStatus === 'in_progress').length;
    const overdueGroups = existingAssessmentGroups.filter(g => g.isOverdue);
    const coverage    = risks.length > 0 ? Math.round((assessed / risks.length) * 100) : 0;
    const aiDrafts    = Math.min(priorityQueue.length, 3);

    type Action = {
      id: string;
      urgency: 'critical' | 'high' | 'medium';
      Icon: React.ElementType;
      title: string;
      subtitle: string;
      cta: string;
      tab: number;
    };
    const actions: Action[] = [];

    if (highSevUnassessed.length > 0) {
      actions.push({
        id: 'high-sev',
        urgency: highSevUnassessed.length >= 5 ? 'critical' : 'high',
        Icon: SeverityIcon,
        title: `${highSevUnassessed.length} high-severity risk${highSevUnassessed.length !== 1 ? 's' : ''} unassessed`,
        subtitle: 'Highest inherent exposure — required before treatment can begin',
        cta: 'Start assessment',
        tab: 0,
      });
    }

    if (aiDrafts > 0) {
      actions.push({
        id: 'ai-drafts',
        urgency: 'high',
        Icon: SparkleIcon,
        title: `${aiDrafts} AI-drafted assessment${aiDrafts !== 1 ? 's' : ''} awaiting sign-off`,
        subtitle: 'Agent has prepared drafts for top-priority risks — review and approve',
        cta: 'Review drafts',
        tab: 0,
      });
    }

    if (overdueGroups.length > 0) {
      actions.push({
        id: 'overdue',
        urgency: 'high',
        Icon: OverdueIcon,
        title: `${overdueGroups.length} assessment${overdueGroups.length !== 1 ? 's' : ''} overdue`,
        subtitle: overdueGroups.slice(0, 2).map(g => g.label).join(', ') + (overdueGroups.length > 2 ? ` +${overdueGroups.length - 2} more` : ''),
        cta: 'View assessments',
        tab: 1,
      });
    }

    const regRec = recommendations.find(r => r.type === 'regulation' && r.urgency === 'high');
    if (regRec) {
      actions.push({
        id: 'reg',
        urgency: 'medium',
        Icon: RegulationIcon,
        title: regRec.headline,
        subtitle: regRec.source,
        cta: 'View queue',
        tab: 0,
      });
    }

    return {
      total: risks.length,
      assessed,
      inProgress,
      unassessed: unassessedRisks.length,
      overdueCount: overdueGroups.length,
      aiDrafts,
      coverage,
      actions: actions.slice(0, 4),
    };
  }, [risks, existingAssessmentGroups, highSevUnassessed, priorityQueue, recommendations, unassessedRisks]);

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
      setPersonaAIPrompt('');
    } else {
      setEditingPersonaId(persona.id);
      setExpandedPersonaId(persona.id);
      setEditForm({ name: persona.name, role: persona.role, perspective: persona.perspective, biases: [...persona.biases], newBias: '' });
      setPersonaAIPrompt('');
    }
  };

  const handleSavePersona = (personaId: string) => {
    updatePersona(personaId, { name: editForm.name, role: editForm.role, perspective: editForm.perspective, biases: editForm.biases, customisedByUser: true });
    setPersonas(getPersonas());
    setEditingPersonaId(null);
    setPersonaAIPrompt('');
    setSnackMessage('Persona updated');
  };

  const handleApplyPersonaPrompt = () => {
    const p = personaAIPrompt.trim();
    if (!p || personaAIApplying) return;
    setPersonaAIApplying(true);

    setTimeout(() => {
      const lower = p.toLowerCase();
      let updatedPerspective = editForm.perspective;
      let updatedBiases = [...editForm.biases];
      let updatedName = editForm.name;
      let updatedRole = editForm.role;

      // Name / role changes
      const renameMatch = lower.match(/rename\s+to\s+["']?([^"']+)["']?/);
      if (renameMatch) updatedName = renameMatch[1].trim();
      const roleMatch = lower.match(/(?:change|set|update)\s+role\s+to\s+["']?([^"',.]+)/);
      if (roleMatch) updatedRole = roleMatch[1].trim();

      // Bias additions
      if (lower.includes('conserv') || lower.includes('risk-averse') || lower.includes('cautious')) {
        if (!updatedBiases.includes('Risk-averse')) updatedBiases.push('Risk-averse');
        updatedBiases = updatedBiases.filter(b => b !== 'Risk-tolerant');
      }
      if (lower.includes('risk-tolerant') || lower.includes('aggressive') || lower.includes('growth-oriented')) {
        if (!updatedBiases.includes('Risk-tolerant')) updatedBiases.push('Risk-tolerant');
        updatedBiases = updatedBiases.filter(b => b !== 'Risk-averse');
      }
      if (lower.includes('cost') || lower.includes('financ') || lower.includes('budget')) {
        if (!updatedBiases.includes('Cost-conscious')) updatedBiases.push('Cost-conscious');
      }
      if (lower.includes('regulat') || lower.includes('compliance') || lower.includes('legal')) {
        if (!updatedBiases.includes('Regulatory focus')) updatedBiases.push('Regulatory focus');
      }
      if (lower.includes('operational') || lower.includes('process') || lower.includes('continuity')) {
        if (!updatedBiases.includes('Operational continuity')) updatedBiases.push('Operational continuity');
      }
      if (lower.includes('data') || lower.includes('privacy') || lower.includes('cyber')) {
        if (!updatedBiases.includes('Data-centric')) updatedBiases.push('Data-centric');
      }
      if (lower.includes('strateg') || lower.includes('long-term') || lower.includes('competitive')) {
        if (!updatedBiases.includes('Strategic outlook')) updatedBiases.push('Strategic outlook');
      }

      // Bias removals
      const removeMatch = lower.match(/remove\s+["']?([^"',.\n]+?)["']?\s+bias/);
      if (removeMatch) {
        const toRemove = removeMatch[1].trim().toLowerCase();
        updatedBiases = updatedBiases.filter(b => !b.toLowerCase().includes(toRemove));
      }

      // Perspective rewrite based on focus keywords
      const perspectivePrefix = (() => {
        if (lower.includes('focus on regulatory') || lower.includes('more compliance')) {
          return `${updatedName} approaches every risk through a regulatory and compliance lens, ensuring organisational obligations are front-of-mind before operational or financial considerations. `;
        }
        if (lower.includes('focus on operational') || lower.includes('more operational')) {
          return `${updatedName} grounds risk assessments in operational reality — evaluating process resilience, workforce capacity, and system continuity as the primary determinants of risk severity. `;
        }
        if (lower.includes('focus on financial') || lower.includes('more financial')) {
          return `${updatedName} evaluates risk severity primarily through quantified financial impact, applying scenario-based loss modelling and cost-benefit framing to all assessments. `;
        }
        if (lower.includes('focus on cyber') || lower.includes('more cyber')) {
          return `${updatedName} leads with a cyber-security lens, weighting technical threat vectors, vulnerability exposure, and attack surface as primary risk drivers. `;
        }
        if (lower.includes('less') && lower.includes('more')) {
          return `${updatedName} has been recalibrated to shift emphasis as instructed, updating assessment weighting accordingly. `;
        }
        if (lower.includes('senior') || lower.includes('executive') || lower.includes('board')) {
          return `${updatedName} takes an executive-level view, translating technical and operational risk detail into strategic significance and board-level language. `;
        }
        return null;
      })();

      if (perspectivePrefix) {
        // Prepend new framing, keep original as supporting detail
        const stripped = updatedPerspective.replace(/^[^.]+\.\s*/, '');
        updatedPerspective = perspectivePrefix + stripped;
      } else {
        // Generic — append agent note
        updatedPerspective = updatedPerspective + ` [Agent update: ${p.charAt(0).toUpperCase() + p.slice(1, 80)}${p.length > 80 ? '…' : ''}.]`;
      }

      setEditForm(f => ({
        ...f,
        name: updatedName,
        role: updatedRole,
        perspective: updatedPerspective,
        biases: updatedBiases,
      }));
      setPersonaAIPrompt('');
      setPersonaAIApplying(false);
      setSnackMessage('Agent applied instructions — review and save changes');
    }, 1100);
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

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Assessments
          </Typography>
        </Stack>

        {/* ══════════════════════════════════════════════════════════════════
            OVERVIEW — stats strip + priority actions (always above tabs)
        ══════════════════════════════════════════════════════════════════ */}
        {risks.length > 0 && (() => {
          const urgencyColor = { critical: '#f87171', high: '#fbbf24', medium: '#94a3b8' };
          const urgencyBg    = { critical: 'rgba(248,113,113,0.1)', high: 'rgba(251,191,36,0.08)', medium: 'rgba(148,163,184,0.08)' };
          const urgencyBorder = { critical: 'rgba(248,113,113,0.28)', high: 'rgba(251,191,36,0.25)', medium: 'rgba(148,163,184,0.18)' };

          return (
            <Box sx={{ mb: 3 }}>
              {/* Stats strip */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {[
                  {
                    label: 'Total risks',
                    value: overviewStats.total,
                    sub: 'in register',
                    color: 'text.primary',
                    accent: 'rgba(255,255,255,0.06)',
                  },
                  {
                    label: 'Assessed',
                    value: overviewStats.assessed,
                    sub: `${overviewStats.coverage}% coverage`,
                    color: '#4ade80',
                    accent: 'rgba(74,222,128,0.06)',
                    progress: overviewStats.coverage,
                  },
                  {
                    label: 'In progress',
                    value: overviewStats.inProgress,
                    sub: 'active cycles',
                    color: '#60a5fa',
                    accent: 'rgba(96,165,250,0.06)',
                  },
                  {
                    label: 'Unassessed',
                    value: overviewStats.unassessed,
                    sub: 'need attention',
                    color: overviewStats.unassessed > 0 ? '#fbbf24' : '#4ade80',
                    accent: overviewStats.unassessed > 0 ? 'rgba(251,191,36,0.06)' : 'transparent',
                  },
                  {
                    label: 'Overdue',
                    value: overviewStats.overdueCount,
                    sub: 'past target date',
                    color: overviewStats.overdueCount > 0 ? '#f87171' : '#4ade80',
                    accent: overviewStats.overdueCount > 0 ? 'rgba(248,113,113,0.06)' : 'transparent',
                  },
                  {
                    label: 'AI drafts ready',
                    value: overviewStats.aiDrafts,
                    sub: 'awaiting sign-off',
                    color: '#93c5fd',
                    accent: 'rgba(96,165,250,0.06)',
                  },
                ].map(stat => (
                  <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 2 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: stat.accent, height: '100%' }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: stat.color, lineHeight: 1.15 }}>
                        {stat.value}
                        {stat.progress !== undefined && (
                          <Typography component="span" variant="caption" sx={{ ml: 0.75, fontWeight: 400, color: stat.color, opacity: 0.8 }}>
                            {stat.progress}%
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.primary', mt: 0.25 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">{stat.sub}</Typography>
                      {stat.progress !== undefined && (
                        <LinearProgress
                          variant="determinate"
                          value={stat.progress}
                          sx={{ mt: 0.75, height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar': { bgcolor: stat.color, borderRadius: 2 } }}
                        />
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Priority actions */}
              {overviewStats.actions.length > 0 && (
                <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <PriorityIcon sx={{ fontSize: 15, color: '#f87171' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Priority actions</Typography>
                    <Chip size="small" label={overviewStats.actions.length}
                      sx={{ height: 18, fontSize: '0.68rem', bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }} />
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto !important' }}>
                      Requires your attention
                    </Typography>
                  </Stack>
                  {overviewStats.actions.map((action, idx) => {
                    const color  = urgencyColor[action.urgency];
                    const bg     = urgencyBg[action.urgency];
                    const border = urgencyBorder[action.urgency];
                    const ActionIcon = action.Icon;
                    return (
                      <Stack
                        key={action.id}
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{
                          px: 2, py: 1.25,
                          borderBottom: idx < overviewStats.actions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                        }}
                      >
                        {/* Urgency accent bar */}
                        <Box sx={{ width: 3, alignSelf: 'stretch', borderRadius: 1, bgcolor: color, flexShrink: 0, minHeight: 32 }} />

                        <ActionIcon sx={{ fontSize: 16, color, flexShrink: 0 }} />

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{action.title}</Typography>
                          <Typography variant="caption" color="text.disabled">{action.subtitle}</Typography>
                        </Box>

                        <Chip
                          size="small"
                          label={action.urgency.charAt(0).toUpperCase() + action.urgency.slice(1)}
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: bg, color, border: `1px solid ${border}`, flexShrink: 0 }}
                        />

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ArrowIcon sx={{ fontSize: '14px !important' }} />}
                          onClick={() => setActiveTab(action.tab)}
                          sx={{ flexShrink: 0 }}
                        >
                          {action.cta}
                        </Button>
                      </Stack>
                    );
                  })}
                </Paper>
              )}
            </Box>
          );
        })()}

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
          <Tab label="Assessment queue" />
          <Tab label="Existing assessments" />
          <Tab label="AI assessors" />
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
              {/* Section header + grouping toolbar */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <SparkleIcon sx={{ fontSize: 18, color: 'primary.light' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Assessment queue
                </Typography>
                <Chip size="small" label={`${recommendations.length} recommendations`} sx={{ height: 20, fontSize: '0.7rem' }} />
                <Chip size="small" label={`${priorityQueue.length} in queue`} sx={{ height: 20, fontSize: '0.7rem' }} />
              </Stack>

              {/* Group-by selector */}
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 2 }}>
                <SortIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, mr: 0.25 }}>
                  Group by:
                </Typography>
                {([
                  { key: 'recommendation', label: 'Recommendation', icon: SparkleIcon },
                  { key: 'category',       label: 'Category',       icon: CategoryIcon },
                  { key: 'owner',          label: 'Owner',          icon: PersonIcon },
                  { key: 'urgency',        label: 'Urgency',        icon: SeverityIcon },
                ] as const).map(({ key, label, icon: Icon }) => {
                  const active = groupBy === key;
                  return (
                    <Chip
                      key={key}
                      size="small"
                      icon={<Icon sx={{ fontSize: '13px !important' }} />}
                      label={label}
                      onClick={() => { setGroupBy(key); setExpandedGroupKey(null); setExpandedRec(null); }}
                      sx={{
                        height: 24, fontSize: '0.72rem', cursor: 'pointer',
                        bgcolor: active ? 'rgba(96,165,250,0.15)' : 'transparent',
                        color: active ? '#93c5fd' : 'text.secondary',
                        border: active ? '1px solid rgba(96,165,250,0.38)' : '1px solid rgba(255,255,255,0.1)',
                        '& .MuiChip-icon': { color: active ? '#60a5fa' : 'inherit' },
                        '&:hover': { bgcolor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)' },
                      }}
                    />
                  );
                })}
              </Stack>

              {/* ── Recommendation grouping (default) ── */}
              {groupBy === 'recommendation' && (
              <Stack spacing={1}>
                {recommendations.map((rec, recIdx) => {
                  const tc = typeConfig[rec.type];
                  const uc = urgencyConfig[rec.urgency];
                  const TypeIcon = tc.Icon;
                  const isOpen = expandedRec === rec.id;
                  const kriLinkage = getKRILinkageText(kris, rec.affectedCategory ?? '');

                  // Resolve affected risks for this recommendation
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
                      {/* ── Card header — full row clickable, chevron rightmost ── */}
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        onClick={() => setExpandedRec(isOpen ? null : rec.id)}
                        sx={{ px: 2, py: 1.5, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <TypeIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />

                        {/* Title + meta */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{rec.headline}</Typography>
                            <Chip
                              size="small"
                              label={uc.label}
                              sx={{ height: 17, fontSize: '0.68rem', fontWeight: 600, bgcolor: uc.bg, color: uc.color, flexShrink: 0 }}
                            />
                            {rec.affectedCount !== undefined && (
                              <Chip size="small" label={`${rec.affectedCount} risks`}
                                sx={{ height: 17, fontSize: '0.68rem' }} />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                            <Typography variant="caption" color="text.disabled">
                              {tc.label} · {rec.source}
                            </Typography>
                            {kriLinkage && (
                              <Typography variant="caption" sx={{ color: '#f87171' }}>{kriLinkage}</Typography>
                            )}
                          </Stack>
                        </Box>

                        {/* Actions — stop propagation so clicking doesn't toggle card */}
                        <Stack direction="row" spacing={0.75} alignItems="center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                            onClick={() => setDetailGroup({
                              id: `rec-${rec.id}`,
                              label: rec.headline,
                              description: rec.reasoning,
                              risks: recRisks,
                              source: rec.source,
                              urgency: rec.urgency,
                              recType: rec.type,
                            })}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => startAssessment(rec.affectedCategory, rec.id === 'prio-high' ? highSevUnassessed : undefined)}
                          >
                            Start
                          </Button>
                        </Stack>

                        {/* Rightmost: rotating chevron */}
                        <ExpandMoreIcon
                          sx={{
                            fontSize: 18,
                            color: 'text.secondary',
                            flexShrink: 0,
                            transition: 'transform 0.2s',
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                          }}
                        />
                      </Stack>

                      {/* ── Expanded body ── */}
                      <Collapse in={isOpen}>
                        <Divider />

                        {/* Reasoning + source chips */}
                        <Box sx={{ px: 2, py: 1.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 1 }}>
                            {rec.reasoning}
                          </Typography>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5 }}>
                            <Chip size="small" icon={<SparkleIcon sx={{ fontSize: '12px !important' }} />}
                              label={rec.source}
                              sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(96,165,250,0.08)', color: 'primary.light', border: '1px solid rgba(96,165,250,0.2)' }} />
                            {rec.affectedCategory && (
                              <Chip size="small" label={rec.affectedCategory.charAt(0).toUpperCase() + rec.affectedCategory.slice(1)}
                                sx={{ height: 20, fontSize: '0.68rem',
                                  bgcolor: `${categoryColors[rec.affectedCategory] || '#6B7280'}18`,
                                  color: categoryColors[rec.affectedCategory] || 'text.secondary',
                                  border: `1px solid ${categoryColors[rec.affectedCategory] || '#6B7280'}40` }} />
                            )}
                          </Stack>
                        </Box>

                        {/* Affected risks — with inline queue actions */}
                        {recRisks.length > 0 && (
                          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {recRisks.map((risk, rIdx) => {
                              const queueIdx = priorityQueue.findIndex(q => q.id === risk.id);
                              const inQueue = queueIdx >= 0;
                              const hasDraft = inQueue && queueIdx < 3;

                              return (
                                <Box
                                  key={risk.id}
                                  sx={{
                                    px: 2, py: 1.25,
                                    borderBottom: rIdx < recRisks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                                  }}
                                >
                                  <Stack direction="row" alignItems="center" spacing={1.5}>
                                    {/* Queue rank badge */}
                                    {inQueue && (
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>
                                        #{queueIdx + 1}
                                      </Typography>
                                    )}

                                    {/* Risk identity */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.disabled', flexShrink: 0 }}>
                                          {getRiskDisplayId(risk.id, risks)}
                                        </Typography>
                                        <Chip
                                          size="small"
                                          label={risk.category.charAt(0).toUpperCase() + risk.category.slice(1)}
                                          sx={{
                                            height: 18, fontSize: '0.65rem', flexShrink: 0,
                                            bgcolor: `${categoryColors[risk.category] || '#6B7280'}18`,
                                            color: categoryColors[risk.category] || 'text.secondary',
                                            border: `1px solid ${categoryColors[risk.category] || '#6B7280'}35`,
                                          }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{risk.title}</Typography>
                                        {hasDraft && (
                                          <Chip size="small" label="AGENT DRAFTED"
                                            sx={{ height: 17, fontSize: '0.62rem', fontWeight: 700,
                                              bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa',
                                              border: '1px solid rgba(96,165,250,0.3)', flexShrink: 0 }} />
                                        )}
                                      </Stack>
                                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.25 }}>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                          <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: getScoreColor(risk), flexShrink: 0 }} />
                                          <Typography variant="caption" color="text.secondary">
                                            {getScoreLabel(risk)}
                                          </Typography>
                                        </Stack>
                                        {inQueue && (
                                          <Typography variant="caption" sx={{ color: hasDraft ? '#f87171' : 'text.disabled' }}>
                                            {hasDraft ? 'KRI signal: RED' : '90d unassessed'}
                                          </Typography>
                                        )}
                                        {risk.suggestedOwner && (
                                          <Stack direction="row" spacing={0.5} alignItems="center">
                                            <Avatar sx={{ width: 16, height: 16, fontSize: '0.55rem', bgcolor: ownerColors[risk.suggestedOwner.name] || '#6B7280' }}>
                                              {risk.suggestedOwner.name.split(' ').map(n => n[0]).join('')}
                                            </Avatar>
                                            <Typography variant="caption" color="text.secondary">{risk.suggestedOwner.name}</Typography>
                                          </Stack>
                                        )}
                                      </Stack>
                                    </Box>

                                    {/* Row-level actions */}
                                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                      {inQueue ? (
                                        <>
                                          <Button size="small" variant="outlined"
                                            onClick={() => openDraft(risk, queueIdx)}>
                                            Review draft
                                          </Button>
                                          <Button size="small" variant="contained" startIcon={<CheckIcon />}
                                            onClick={() => setSnackMessage('Assessment approved')}>
                                            Approve
                                          </Button>
                                          <Button size="small" variant="text" sx={{ color: 'text.secondary' }}
                                            onClick={() => { setDeferredRiskIds(prev => new Set([...prev, risk.id])); setSnackMessage('Deferred'); }}>
                                            Defer
                                          </Button>
                                        </>
                                      ) : (
                                        <Button size="small" variant="outlined" startIcon={<PlayArrowIcon />}
                                          onClick={() => setSnackMessage('Assessment started')}>
                                          Assess
                                        </Button>
                                      )}
                                    </Stack>
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      </Collapse>
                    </Paper>
                  );
                })}
              </Stack>
              )}

              {/* ── Category grouping ── */}
              {groupBy === 'category' && (
                <Stack spacing={1}>
                  {categoryGroups.map(g => {
                    const isOpen = expandedGroupKey === g.key;
                    return (
                      <Paper key={g.key} variant="outlined" sx={{ overflow: 'hidden' }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}
                          onClick={() => setExpandedGroupKey(isOpen ? null : g.key)}
                          sx={{ px: 2, py: 1.5, cursor: 'pointer', userSelect: 'none' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: g.color, flexShrink: 0 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{g.label}</Typography>
                              <Chip size="small" label={`${g.risks.length} risks`} sx={{ height: 17, fontSize: '0.68rem' }} />
                              {g.highSevCount > 0 && (
                                <Chip size="small" label={`${g.highSevCount} high severity`}
                                  sx={{ height: 17, fontSize: '0.68rem', bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }} />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.disabled">Category</Typography>
                          </Box>
                          <Stack direction="row" spacing={0.75} onClick={e => e.stopPropagation()}>
                            <Button size="small" variant="contained" startIcon={<PlayArrowIcon />}
                              onClick={() => setSnackMessage('Assessment started')}>Start</Button>
                          </Stack>
                          <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                        </Stack>
                        <Collapse in={isOpen}>
                          <Divider />
                          {g.risks.map((risk, rIdx) => {
                            const queueIdx = priorityQueue.findIndex(q => q.id === risk.id);
                            const inQueue = queueIdx >= 0;
                            const hasDraft = inQueue && queueIdx < 3;
                            return (
                              <Box key={risk.id} sx={{ px: 2, py: 1.25, borderBottom: rIdx < g.risks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  {inQueue && <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>#{queueIdx + 1}</Typography>}
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.disabled', flexShrink: 0 }}>{getRiskDisplayId(risk.id, risks)}</Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{risk.title}</Typography>
                                      {hasDraft && <Chip size="small" label="AGENT DRAFTED" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', flexShrink: 0 }} />}
                                    </Stack>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.25 }}>
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: getScoreColor(risk), flexShrink: 0 }} />
                                        <Typography variant="caption" color="text.secondary">{getScoreLabel(risk)}</Typography>
                                      </Stack>
                                      {inQueue && <Typography variant="caption" sx={{ color: hasDraft ? '#f87171' : 'text.disabled' }}>{hasDraft ? 'KRI signal: RED' : '90d unassessed'}</Typography>}
                                      {risk.suggestedOwner && <Stack direction="row" spacing={0.5} alignItems="center"><Avatar sx={{ width: 16, height: 16, fontSize: '0.55rem', bgcolor: ownerColors[risk.suggestedOwner.name] || '#6B7280' }}>{risk.suggestedOwner.name.split(' ').map(n => n[0]).join('')}</Avatar><Typography variant="caption" color="text.secondary">{risk.suggestedOwner.name}</Typography></Stack>}
                                    </Stack>
                                  </Box>
                                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                    {inQueue ? (<><Button size="small" variant="outlined" onClick={() => openDraft(risk, queueIdx)}>Review draft</Button><Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={() => setSnackMessage('Assessment approved')}>Approve</Button><Button size="small" variant="text" sx={{ color: 'text.secondary' }} onClick={() => { setDeferredRiskIds(prev => new Set([...prev, risk.id])); setSnackMessage('Deferred'); }}>Defer</Button></>) : (<Button size="small" variant="outlined" startIcon={<PlayArrowIcon />} onClick={() => setSnackMessage('Assessment started')}>Assess</Button>)}
                                  </Stack>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* ── Owner grouping ── */}
              {groupBy === 'owner' && (
                <Stack spacing={1}>
                  {ownerGroups.map(g => {
                    const isOpen = expandedGroupKey === g.key;
                    const initials = g.key !== 'Unassigned' ? g.key.split(' ').map(n => n[0]).join('') : '?';
                    return (
                      <Paper key={g.key} variant="outlined" sx={{ overflow: 'hidden' }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}
                          onClick={() => setExpandedGroupKey(isOpen ? null : g.key)}
                          sx={{ px: 2, py: 1.5, cursor: 'pointer', userSelect: 'none' }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.65rem', fontWeight: 700, bgcolor: ownerColors[g.key] || '#6B7280', flexShrink: 0 }}>{initials}</Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{g.label}</Typography>
                              <Chip size="small" label={`${g.risks.length} risks`} sx={{ height: 17, fontSize: '0.68rem' }} />
                              {g.highSevCount > 0 && <Chip size="small" label={`${g.highSevCount} high severity`} sx={{ height: 17, fontSize: '0.68rem', bgcolor: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }} />}
                            </Stack>
                            <Typography variant="caption" color="text.disabled">{g.role || 'Owner'}</Typography>
                          </Box>
                          <Stack direction="row" spacing={0.75} onClick={e => e.stopPropagation()}>
                            <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setSnackMessage('Assessment started')}>Start</Button>
                          </Stack>
                          <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                        </Stack>
                        <Collapse in={isOpen}>
                          <Divider />
                          {g.risks.map((risk, rIdx) => {
                            const queueIdx = priorityQueue.findIndex(q => q.id === risk.id);
                            const inQueue = queueIdx >= 0;
                            const hasDraft = inQueue && queueIdx < 3;
                            return (
                              <Box key={risk.id} sx={{ px: 2, py: 1.25, borderBottom: rIdx < g.risks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  {inQueue && <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>#{queueIdx + 1}</Typography>}
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.disabled', flexShrink: 0 }}>{getRiskDisplayId(risk.id, risks)}</Typography>
                                      <Chip size="small" label={risk.category.charAt(0).toUpperCase() + risk.category.slice(1)} sx={{ height: 18, fontSize: '0.65rem', bgcolor: `${(categoryColors[risk.category] as string | undefined) || '#6B7280'}18`, color: (categoryColors[risk.category] as string | undefined) || 'text.secondary', border: `1px solid ${(categoryColors[risk.category] as string | undefined) || '#6B7280'}35` }} />
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{risk.title}</Typography>
                                      {hasDraft && <Chip size="small" label="AGENT DRAFTED" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', flexShrink: 0 }} />}
                                    </Stack>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.25 }}>
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: getScoreColor(risk), flexShrink: 0 }} />
                                        <Typography variant="caption" color="text.secondary">{getScoreLabel(risk)}</Typography>
                                      </Stack>
                                      {inQueue && <Typography variant="caption" sx={{ color: hasDraft ? '#f87171' : 'text.disabled' }}>{hasDraft ? 'KRI signal: RED' : '90d unassessed'}</Typography>}
                                    </Stack>
                                  </Box>
                                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                    {inQueue ? (<><Button size="small" variant="outlined" onClick={() => openDraft(risk, queueIdx)}>Review draft</Button><Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={() => setSnackMessage('Assessment approved')}>Approve</Button><Button size="small" variant="text" sx={{ color: 'text.secondary' }} onClick={() => { setDeferredRiskIds(prev => new Set([...prev, risk.id])); setSnackMessage('Deferred'); }}>Defer</Button></>) : (<Button size="small" variant="outlined" startIcon={<PlayArrowIcon />} onClick={() => setSnackMessage('Assessment started')}>Assess</Button>)}
                                  </Stack>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Stack>
              )}

              {/* ── Urgency grouping ── */}
              {groupBy === 'urgency' && (
                <Stack spacing={1}>
                  {urgencyGroups.map(g => {
                    const isOpen = expandedGroupKey === g.key;
                    return (
                      <Paper key={g.key} variant="outlined" sx={{ overflow: 'hidden' }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}
                          onClick={() => setExpandedGroupKey(isOpen ? null : g.key)}
                          sx={{ px: 2, py: 1.5, cursor: 'pointer', userSelect: 'none' }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                              <Chip size="small" label={g.label} sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700, bgcolor: g.bg, color: g.color, border: `1px solid ${g.border}` }} />
                              <Chip size="small" label={`${g.risks.length} risks`} sx={{ height: 17, fontSize: '0.68rem' }} />
                            </Stack>
                            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>Inherent score {g.key === 'critical' ? '5' : g.key === 'high' ? '4' : g.key === 'medium' ? '3' : '1–2'} / 5</Typography>
                          </Box>
                          <Stack direction="row" spacing={0.75} onClick={e => e.stopPropagation()}>
                            <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setSnackMessage('Assessment started')}>Start</Button>
                          </Stack>
                          <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                        </Stack>
                        <Collapse in={isOpen}>
                          <Divider />
                          {g.risks.map((risk, rIdx) => {
                            const queueIdx = priorityQueue.findIndex(q => q.id === risk.id);
                            const inQueue = queueIdx >= 0;
                            const hasDraft = inQueue && queueIdx < 3;
                            return (
                              <Box key={risk.id} sx={{ px: 2, py: 1.25, borderBottom: rIdx < g.risks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  {inQueue && <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>#{queueIdx + 1}</Typography>}
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.disabled', flexShrink: 0 }}>{getRiskDisplayId(risk.id, risks)}</Typography>
                                      <Chip size="small" label={risk.category.charAt(0).toUpperCase() + risk.category.slice(1)} sx={{ height: 18, fontSize: '0.65rem', bgcolor: `${(categoryColors[risk.category] as string | undefined) || '#6B7280'}18`, color: (categoryColors[risk.category] as string | undefined) || 'text.secondary', border: `1px solid ${(categoryColors[risk.category] as string | undefined) || '#6B7280'}35` }} />
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{risk.title}</Typography>
                                      {hasDraft && <Chip size="small" label="AGENT DRAFTED" sx={{ height: 17, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', flexShrink: 0 }} />}
                                    </Stack>
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.25 }}>
                                      <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: getScoreColor(risk), flexShrink: 0 }} />
                                        <Typography variant="caption" color="text.secondary">{getScoreLabel(risk)}</Typography>
                                      </Stack>
                                      {inQueue && <Typography variant="caption" sx={{ color: hasDraft ? '#f87171' : 'text.disabled' }}>{hasDraft ? 'KRI signal: RED' : '90d unassessed'}</Typography>}
                                      {risk.suggestedOwner && <Stack direction="row" spacing={0.5} alignItems="center"><Avatar sx={{ width: 16, height: 16, fontSize: '0.55rem', bgcolor: ownerColors[risk.suggestedOwner.name] || '#6B7280' }}>{risk.suggestedOwner.name.split(' ').map(n => n[0]).join('')}</Avatar><Typography variant="caption" color="text.secondary">{risk.suggestedOwner.name}</Typography></Stack>}
                                    </Stack>
                                  </Box>
                                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                    {inQueue ? (<><Button size="small" variant="outlined" onClick={() => openDraft(risk, queueIdx)}>Review draft</Button><Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={() => setSnackMessage('Assessment approved')}>Approve</Button><Button size="small" variant="text" sx={{ color: 'text.secondary' }} onClick={() => { setDeferredRiskIds(prev => new Set([...prev, risk.id])); setSnackMessage('Deferred'); }}>Defer</Button></>) : (<Button size="small" variant="outlined" startIcon={<PlayArrowIcon />} onClick={() => setSnackMessage('Assessment started')}>Assess</Button>)}
                                  </Stack>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </>
          )
        )}

        {/* ═══════════════════════════════════════════════
            TAB 2 — AI Assessors
        ═══════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <>
            {/* Header row */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>AI assessors</Typography>
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

            {/* Persona accordions — full-width stacked */}
            <Stack spacing={0.75}>
              {personas.map(persona => {
                const isExpanded = expandedPersonaId === persona.id;
                const isEditing = editingPersonaId === persona.id;
                return (
                  <Paper key={persona.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                    {/* ── Accordion header — full row clickable, actions + chevron rightmost ── */}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      onClick={() => {
                        const next = isExpanded ? null : persona.id;
                        setExpandedPersonaId(next);
                        if (!next) setEditingPersonaId(null);
                      }}
                      sx={{ px: 2, py: 1.5, cursor: 'pointer', userSelect: 'none' }}
                    >
                      {/* AI badge */}
                      <Chip
                        size="small"
                        label="AI"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, flexShrink: 0,
                          bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}
                      />

                      {/* Identity */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{persona.name}</Typography>
                          <Chip
                            size="small"
                            label={persona.active ? 'ACTIVE' : 'INACTIVE'}
                            sx={{
                              height: 17, fontSize: '0.62rem', fontWeight: 700,
                              bgcolor: persona.active ? 'rgba(76,175,80,0.12)' : 'rgba(148,163,184,0.08)',
                              color: persona.active ? '#4caf50' : '#94a3b8',
                              border: `1px solid ${persona.active ? 'rgba(76,175,80,0.25)' : 'rgba(148,163,184,0.15)'}`,
                            }}
                          />
                          {persona.customisedByUser && (
                            <Chip size="small" label="EDITED"
                              sx={{ height: 17, fontSize: '0.62rem', fontWeight: 700,
                                bgcolor: 'rgba(251,191,36,0.08)', color: '#fbbf24',
                                border: '1px solid rgba(251,191,36,0.2)' }} />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.disabled">
                          {persona.role}{persona.department ? ` · ${persona.department}` : ''}
                        </Typography>
                      </Box>

                      {/* Bias preview chips — visible when collapsed */}
                      {!isExpanded && (
                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, display: { xs: 'none', sm: 'flex' } }}
                          onClick={e => e.stopPropagation()}>
                          {persona.biases.slice(0, 2).map(b => (
                            <Chip key={b} size="small" label={b} variant="outlined"
                              sx={{ height: 18, fontSize: '0.62rem', color: 'text.disabled', borderColor: 'rgba(255,255,255,0.1)' }} />
                          ))}
                          {persona.biases.length > 2 && (
                            <Chip size="small" label={`+${persona.biases.length - 2}`} variant="outlined"
                              sx={{ height: 18, fontSize: '0.62rem', color: 'text.disabled', borderColor: 'rgba(255,255,255,0.1)' }} />
                          )}
                        </Stack>
                      )}

                      {/* Action buttons — stop propagation */}
                      <Stack direction="row" spacing={0.75} alignItems="center" onClick={e => e.stopPropagation()}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={isEditing ? <CloseIcon sx={{ fontSize: '13px !important' }} /> : <RefreshIcon sx={{ fontSize: '13px !important' }} />}
                          onClick={() => handleEditPersona(persona)}
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={persona.active
                            ? <CloseIcon sx={{ fontSize: '13px !important' }} />
                            : <CheckIcon sx={{ fontSize: '13px !important' }} />}
                          onClick={() => handleTogglePersonaActive(persona)}
                        >
                          {persona.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrowIcon sx={{ fontSize: '13px !important' }} />}
                          onClick={() => setSnackMessage('Persona applied to current assessment cycle')}
                        >
                          Apply to cycle
                        </Button>
                      </Stack>

                      {/* Rightmost: rotating chevron */}
                      <ExpandMoreIcon
                        sx={{
                          fontSize: 18, color: 'text.secondary', flexShrink: 0,
                          transition: 'transform 0.2s',
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </Stack>

                    {/* ── Expanded body ── */}
                    <Collapse in={isExpanded}>
                      <Divider />
                      <Box sx={{ px: 2, py: 2 }}>
                        {!isEditing ? (
                          <Stack spacing={2}>
                            {/* Perspective */}
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                Perspective
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                {persona.perspective}
                              </Typography>
                            </Box>

                            {/* Biases + Source side by side */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                  Known biases
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5 }}>
                                  {persona.biases.map(b => (
                                    <Chip key={b} size="small" label={b} variant="outlined"
                                      sx={{ height: 20, fontSize: '0.7rem', color: 'text.secondary', borderColor: 'rgba(255,255,255,0.12)' }} />
                                  ))}
                                </Stack>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                  Source context
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5 }}>
                                  {persona.sourceContext.map(s => (
                                    <Chip key={s} size="small" label={sourceLabels[s] || s}
                                      sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.06)', color: 'text.secondary' }} />
                                  ))}
                                </Stack>
                              </Box>
                            </Stack>
                          </Stack>
                        ) : (
                          /* ── Inline edit form ── */
                          <Stack spacing={1.5}>

                            {/* ── AI prompt box ── */}
                            <Box sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              background: 'linear-gradient(135deg, rgba(91,103,192,0.08) 0%, rgba(156,39,176,0.08) 100%)',
                              border: '1px solid rgba(96,165,250,0.18)',
                            }}>
                              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                <Box sx={{
                                  width: 20, height: 20, borderRadius: 0.75,
                                  background: 'linear-gradient(135deg,#5C6BC0,#9C27B0)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                  <AIBadgeIcon sx={{ fontSize: 11, color: 'white' }} />
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#93c5fd' }}>
                                  Instruct the agent
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                  Tell the agent what to change about this persona
                                </Typography>
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="flex-end">
                                <TextField
                                  size="small"
                                  fullWidth
                                  multiline
                                  minRows={2}
                                  maxRows={4}
                                  placeholder={`e.g. "Make this persona more focused on regulatory compliance and less on operational risk. Add a cost-conscious bias."`}
                                  value={personaAIPrompt}
                                  onChange={e => setPersonaAIPrompt(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && e.ctrlKey) handleApplyPersonaPrompt();
                                  }}
                                  disabled={personaAIApplying}
                                  sx={{
                                    '& .MuiOutlinedInput-root': {
                                      fontSize: '0.82rem',
                                      bgcolor: 'rgba(0,0,0,0.2)',
                                      '& fieldset': { borderColor: 'rgba(96,165,250,0.2)' },
                                      '&:hover fieldset': { borderColor: 'rgba(96,165,250,0.35)' },
                                      '&.Mui-focused fieldset': { borderColor: 'rgba(96,165,250,0.5)' },
                                    },
                                  }}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={personaAIApplying
                                    ? <CircularProgress size={12} sx={{ color: 'white' }} />
                                    : <SendIcon sx={{ fontSize: '13px !important' }} />}
                                  onClick={handleApplyPersonaPrompt}
                                  disabled={!personaAIPrompt.trim() || personaAIApplying}
                                  sx={{
                                    flexShrink: 0,
                                    background: 'linear-gradient(135deg,#5C6BC0,#9C27B0)',
                                    '&:hover': { background: 'linear-gradient(135deg,#6d7bce,#ab47bc)' },
                                    '&.Mui-disabled': { opacity: 0.45 },
                                    px: 1.5, py: 0.875,
                                    minWidth: 'auto',
                                    fontSize: '0.78rem',
                                    alignSelf: 'flex-end',
                                  }}
                                >
                                  {personaAIApplying ? 'Applying…' : 'Apply'}
                                </Button>
                              </Stack>
                              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, fontSize: '0.62rem' }}>
                                Ctrl+Enter to apply · Agent will update the fields below — review before saving
                              </Typography>
                            </Box>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
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
                            </Stack>
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
                                    key={b} size="small" label={b} variant="outlined"
                                    onDelete={() => setEditForm(f => ({ ...f, biases: f.biases.filter(x => x !== b) }))}
                                    sx={{ height: 24, fontSize: '0.7rem', color: 'text.secondary', borderColor: 'rgba(255,255,255,0.15)' }}
                                  />
                                ))}
                              </Stack>
                              <Stack direction="row" spacing={1}>
                                <TextField
                                  size="small"
                                  placeholder="Add bias tag…"
                                  value={editForm.newBias}
                                  onChange={e => setEditForm(f => ({ ...f, newBias: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && editForm.newBias.trim()) {
                                      setEditForm(f => ({ ...f, biases: [...f.biases, f.newBias.trim()], newBias: '' }));
                                    }
                                  }}
                                  sx={{ flex: 1 }}
                                />
                                <Button size="small" variant="outlined" startIcon={<AddIcon />}
                                  onClick={() => {
                                    if (editForm.newBias.trim()) {
                                      setEditForm(f => ({ ...f, biases: [...f.biases, f.newBias.trim()], newBias: '' }));
                                    }
                                  }}>
                                  Add
                                </Button>
                              </Stack>
                            </Box>

                            {/* Save / cancel */}
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="contained" startIcon={<SaveIcon />}
                                onClick={() => handleSavePersona(persona.id)}>
                                Save changes
                              </Button>
                              <Button size="small" variant="outlined" startIcon={<CloseIcon sx={{ fontSize: '13px !important' }} />}
                                onClick={() => { setEditingPersonaId(null); setPersonaAIPrompt(''); }}>
                                Cancel
                              </Button>
                            </Stack>
                          </Stack>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Stack>
          </>
        )}

        {/* ═══════════════════════════════════════════════
            TAB 1 — Existing Assessments
        ═══════════════════════════════════════════════ */}
        {activeTab === 1 && (() => {
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
                    const kriIndicators = getKRIChipsForCategory(kris, g.id);
                    const resultsExpanded = expandedResultGroupId === g.id;

                    // Pull mock synthesis for this category (or generate from index)
                    const mockResultIdx = RESULTS_BY_CATEGORY[g.category] ?? (Object.keys(RESULTS_BY_CATEGORY).length % MOCK_SYNTHESISED_ASSESSMENTS.length);
                    const mockSynthesis = MOCK_SYNTHESISED_ASSESSMENTS[mockResultIdx];

                    // Map each risk in the group to an assessor opinion (assessed risks get opinions, pending don't)
                    const assessedRisks = g.risks.filter(r => r.assessmentStatus === 'assessed');
                    const pendingRisks = g.risks.filter(r => r.assessmentStatus !== 'assessed');

                    return (
                      <Paper key={g.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                        <Box sx={{ p: 2.5 }}>
                          {/* Header row */}
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                            <Box sx={{ flex: 1, mr: 2 }}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{g.label}</Typography>
                                <Chip size="small" label={statusChip.label}
                                  sx={{ height: 20, fontSize: '0.7rem', bgcolor: statusChip.bg, color: statusChip.color, border: `1px solid ${statusChip.border}` }} />
                                {g.highSevCount > 0 && !g.isCompleted && (
                                  <Chip size="small"
                                    icon={<SeverityIcon sx={{ fontSize: '11px !important', color: '#f87171 !important' }} />}
                                    label={`${g.highSevCount} high severity`}
                                    sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171' }} />
                                )}
                                {kriIndicators.map((kri, ki) => (
                                  <Chip key={ki} size="small"
                                    label={`● ${kri.count} ${kri.status} KRI${kri.count > 1 ? 's' : ''}`}
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600,
                                      bgcolor: kri.status === 'red' ? 'rgba(244,67,54,0.1)' : 'rgba(255,152,0,0.1)',
                                      color: kri.status === 'red' ? '#f44336' : '#ff9800' }} />
                                ))}
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{g.description}</Typography>
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
                            <LinearProgress variant="determinate" value={g.progress}
                              sx={{ height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)',
                                '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 } }} />
                          </Box>

                          {/* Assessors + footer row */}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AvatarGroup max={4} sx={{
                                '& .MuiAvatar-root': { width: 26, height: 26, fontSize: '0.65rem', fontWeight: 700, border: '2px solid rgba(14,20,35,0.8)' },
                                '& .MuiAvatarGroup-avatar': { bgcolor: 'rgba(96,165,250,0.2)', color: 'primary.light' },
                              }}>
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
                              {mockSynthesis.opinions.filter(o => o.assessorType === 'ai_persona').length > 0 && (
                                <Chip size="small"
                                  icon={<AIBadgeIcon sx={{ fontSize: '10px !important' }} />}
                                  label={`${mockSynthesis.opinions.filter(o => o.assessorType === 'ai_persona').length} AI`}
                                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', '& .MuiChip-icon': { ml: 0.5 } }} />
                              )}
                            </Stack>
                            <Stack direction="row" spacing={1}>
                              <Button size="small" variant="outlined"
                                startIcon={<ExpandMoreIcon sx={{ fontSize: '14px !important', transform: resultsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                                onClick={() => setExpandedResultGroupId(resultsExpanded ? null : g.id)}>
                                {resultsExpanded ? 'Hide results' : `View results (${assessedRisks.length + pendingRisks.length})`}
                              </Button>
                              {!g.isCompleted && (
                                <Button size="small" variant="contained" startIcon={<ArrowIcon />}
                                  onClick={() => setDetailGroup({ id: g.id, label: g.label, description: g.description, risks: g.risks, source: 'In progress', urgency: 'high', recType: 'priority' })}>
                                  Continue
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </Box>

                        {/* ─── Results panel ─────────────────────────────────── */}
                        <Collapse in={resultsExpanded} timeout="auto" unmountOnExit>
                          <Divider />
                          <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>

                            {/* Synthesized score header */}
                            {assessedRisks.length > 0 && (
                              <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(96,165,250,0.04)' }}>
                                <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" gap={1}>
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    <VerifiedIcon sx={{ fontSize: 14, color: CONF_COLOR[mockSynthesis.confidenceLevel] }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Synthesized score</Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: SCORE_COLOR[Math.round(mockSynthesis.synthesisedLikelihood)] }}>
                                      L {mockSynthesis.synthesisedLikelihood.toFixed(1)}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">×</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: SCORE_COLOR[Math.round(mockSynthesis.synthesisedImpact)] }}>
                                      I {mockSynthesis.synthesisedImpact.toFixed(1)}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">=</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: SCORE_COLOR[Math.round((mockSynthesis.synthesisedLikelihood + mockSynthesis.synthesisedImpact) / 2)] }}>
                                      {((mockSynthesis.synthesisedLikelihood + mockSynthesis.synthesisedImpact) / 2).toFixed(1)}
                                    </Typography>
                                  </Stack>
                                  <Chip size="small" label={`${mockSynthesis.confidenceLevel} confidence`}
                                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600,
                                      bgcolor: `${CONF_COLOR[mockSynthesis.confidenceLevel]}18`,
                                      color: CONF_COLOR[mockSynthesis.confidenceLevel],
                                      border: `1px solid ${CONF_COLOR[mockSynthesis.confidenceLevel]}40` }} />
                                  {mockSynthesis.outlierFlags.length > 0 && (
                                    <Chip size="small"
                                      icon={<OutlierIcon sx={{ fontSize: '10px !important' }} />}
                                      label={`${mockSynthesis.outlierFlags.length} outlier${mockSynthesis.outlierFlags.length > 1 ? 's' : ''} flagged`}
                                      sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', '& .MuiChip-icon': { ml: 0.5 } }} />
                                  )}
                                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto !important' }}>
                                    <DeltaIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.disabled">{mockSynthesis.whatChangedSinceLastTime}</Typography>
                                  </Stack>
                                </Stack>
                                {mockSynthesis.anomalyNotes.length > 0 && (
                                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                                    <OutlierIcon sx={{ fontSize: 13, color: '#fbbf24', flexShrink: 0 }} />
                                    <Typography variant="caption" sx={{ color: '#fbbf24', lineHeight: 1.5 }}>
                                      {mockSynthesis.anomalyNotes[0]}
                                    </Typography>
                                  </Stack>
                                )}
                              </Box>
                            )}

                            {/* Per-risk results */}
                            {g.risks.map((risk, rIdx) => {
                              const isAssessed = risk.assessmentStatus === 'assessed';
                              const riskResultOpen = expandedRiskResultId === risk.id;
                              // Rotate through opinions from mock data based on risk index
                              const opinions = mockSynthesis.opinions.map((op, opIdx) => ({
                                ...op,
                                likelihood: Math.max(1, Math.min(5, Math.round(op.likelihood + (rIdx * 0.3 - 0.15)))) as 1|2|3|4|5,
                                impact: Math.max(1, Math.min(5, Math.round(op.impact + (rIdx * 0.2 - 0.1)))) as 1|2|3|4|5,
                              }));

                              return (
                                <Box key={risk.id} sx={{ borderBottom: rIdx < g.risks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                  {/* Risk header row */}
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1.5}
                                    sx={{
                                      px: 2.5, py: 1.25,
                                      cursor: isAssessed ? 'pointer' : 'default',
                                      '&:hover': isAssessed ? { bgcolor: 'rgba(255,255,255,0.025)' } : {},
                                    }}
                                    onClick={() => isAssessed && setExpandedRiskResultId(riskResultOpen ? null : risk.id)}
                                  >
                                    <Box sx={{
                                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                      bgcolor: isAssessed ? '#4ade80' : '#64748b',
                                    }} />
                                    <Typography variant="body2" sx={{ flex: 1, fontWeight: isAssessed ? 600 : 400, color: isAssessed ? 'text.primary' : 'text.secondary' }}>
                                      {risk.title}
                                    </Typography>
                                    <Chip size="small"
                                      label={isAssessed ? 'Assessed' : risk.assessmentStatus === 'in_progress' ? 'In progress' : 'Pending'}
                                      sx={{
                                        height: 18, fontSize: '0.65rem', flexShrink: 0,
                                        bgcolor: isAssessed ? 'rgba(74,222,128,0.1)' : risk.assessmentStatus === 'in_progress' ? 'rgba(96,165,250,0.1)' : 'rgba(100,116,139,0.1)',
                                        color: isAssessed ? '#4ade80' : risk.assessmentStatus === 'in_progress' ? '#60a5fa' : '#64748b',
                                      }} />
                                    {isAssessed && (
                                      <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0, transform: riskResultOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    )}
                                  </Stack>

                                  {/* Assessor opinions for this risk */}
                                  <Collapse in={riskResultOpen} timeout="auto" unmountOnExit>
                                    <Box sx={{ px: 2.5, pb: 1.5 }}>
                                      {/* Opinion table */}
                                      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
                                        {opinions.map((op, opIdx) => {
                                          const isAI = op.assessorType === 'ai_persona';
                                          const score = Math.round((op.likelihood + op.impact) / 2);
                                          const isOutlier = mockSynthesis.outlierFlags.includes(op.assessorId);
                                          return (
                                            <Box key={op.assessorId} sx={{
                                              p: 1.5,
                                              borderRadius: 1.5,
                                              bgcolor: isAI ? 'rgba(96,165,250,0.04)' : 'rgba(255,255,255,0.03)',
                                              border: isOutlier
                                                ? '1px solid rgba(251,191,36,0.25)'
                                                : `1px solid ${isAI ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.07)'}`,
                                            }}>
                                              <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                                {/* Avatar + name */}
                                                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 160, flexShrink: 0 }}>
                                                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', bgcolor: isAI ? '#1e3a5f' : ownerColors[op.assessorName] || '#374151' }}>
                                                    {isAI ? '✦' : op.assessorName.split(' ').map(n => n[0]).join('')}
                                                  </Avatar>
                                                  <Box>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>
                                                        {op.assessorName.replace(' Persona', '')}
                                                      </Typography>
                                                      {isOutlier && (
                                                        <Tooltip title="Outlier — score diverges from consensus" arrow>
                                                          <OutlierIcon sx={{ fontSize: 11, color: '#fbbf24' }} />
                                                        </Tooltip>
                                                      )}
                                                    </Stack>
                                                    <Stack direction="row" spacing={0.4} alignItems="center">
                                                      {isAI && <AIBadgeIcon sx={{ fontSize: 9, color: '#60a5fa' }} />}
                                                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                                        {isAI ? 'AI assessor' : 'Human assessor'}
                                                      </Typography>
                                                    </Stack>
                                                  </Box>
                                                </Stack>

                                                {/* Scores */}
                                                <Stack spacing={0.5} sx={{ minWidth: 160, flexShrink: 0 }}>
                                                  {[{ label: 'Likelihood', value: op.likelihood }, { label: 'Impact', value: op.impact }].map(s => (
                                                    <Stack key={s.label} direction="row" alignItems="center" spacing={0.75}>
                                                      <Typography variant="caption" color="text.disabled" sx={{ width: 60, fontSize: '0.65rem' }}>{s.label}</Typography>
                                                      <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                                        <Box sx={{ width: `${(s.value / 5) * 100}%`, height: '100%', bgcolor: SCORE_COLOR[s.value], borderRadius: 3 }} />
                                                      </Box>
                                                      <Typography variant="caption" sx={{ fontWeight: 700, color: SCORE_COLOR[s.value], minWidth: 10, fontSize: '0.72rem' }}>
                                                        {s.value}
                                                      </Typography>
                                                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', minWidth: 46 }}>
                                                        {SCORE_LABEL[s.value]}
                                                      </Typography>
                                                    </Stack>
                                                  ))}
                                                </Stack>

                                                {/* Score + confidence */}
                                                <Stack spacing={0.25} sx={{ minWidth: 64, flexShrink: 0 }}>
                                                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>Score</Typography>
                                                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1, color: SCORE_COLOR[score] }}>{score}</Typography>
                                                  <Chip size="small" label={op.confidence}
                                                    sx={{ height: 15, fontSize: '0.58rem', bgcolor: `${CONF_COLOR[op.confidence]}18`, color: CONF_COLOR[op.confidence], border: `1px solid ${CONF_COLOR[op.confidence]}40`, '& .MuiChip-label': { px: 0.75 } }} />
                                                </Stack>

                                                {/* Rationale */}
                                                <Typography variant="caption" color="text.secondary" sx={{ flex: 1, lineHeight: 1.6, fontSize: '0.78rem', minWidth: 0 }}>
                                                  {op.rationale}
                                                </Typography>
                                              </Stack>
                                            </Box>
                                          );
                                        })}
                                      </Stack>

                                      {/* Benchmark + what changed */}
                                      {mockSynthesis.benchmarkComparison && (
                                        <Stack direction="row" spacing={0.75} alignItems="flex-start"
                                          sx={{ px: 1.25, py: 0.875, borderRadius: 1.25, bgcolor: 'rgba(96,165,250,0.05)', border: '1px solid rgba(96,165,250,0.12)', mb: 1 }}>
                                          <InfoIcon sx={{ fontSize: 13, color: '#60a5fa', mt: 0.1, flexShrink: 0 }} />
                                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                            {mockSynthesis.benchmarkComparison}
                                          </Typography>
                                        </Stack>
                                      )}

                                      {mockSynthesis.uncertainties.length > 0 && (
                                        <Stack spacing={0.25}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', fontSize: '0.65rem' }}>Open uncertainties</Typography>
                                          {mockSynthesis.uncertainties.map((u, ui) => (
                                            <Stack key={ui} direction="row" spacing={0.5} alignItems="flex-start">
                                              <Typography variant="caption" color="text.disabled">·</Typography>
                                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{u}</Typography>
                                            </Stack>
                                          ))}
                                        </Stack>
                                      )}
                                    </Box>
                                  </Collapse>
                                </Box>
                              );
                            })}

                            {/* Past assessment note for completed groups */}
                            {g.isCompleted && (
                              <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'rgba(74,222,128,0.04)', borderTop: '1px solid rgba(74,222,128,0.12)' }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <VerifiedIcon sx={{ fontSize: 14, color: '#4ade80' }} />
                                  <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: 600 }}>Assessment completed</Typography>
                                  <Typography variant="caption" color="text.disabled">·</Typography>
                                  <Typography variant="caption" color="text.disabled">
                                    All {g.total} risks assessed · Final score: {((mockSynthesis.synthesisedLikelihood + mockSynthesis.synthesisedImpact) / 2).toFixed(1)} avg
                                  </Typography>
                                  <Box sx={{ flex: 1 }} />
                                  <Button size="small" variant="text" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Archive</Button>
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
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
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Review assessment draft</Typography>
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
                  <TableRow>
                    <TableCell>Assessor</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell sx={{ width: 40, textAlign: 'center' }}>L</TableCell>
                    <TableCell sx={{ width: 40, textAlign: 'center' }}>I</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Rationale</TableCell>
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
                startIcon={<CheckIcon />}
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
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Add persona manually</Typography>
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
            startIcon={<AddIcon />}
            onClick={handleAddPersona}
            disabled={!newPersonaForm.name || !newPersonaForm.role}
          >
            Add persona
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
