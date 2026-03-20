'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Stack, Grid, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Divider, Tooltip, IconButton, Collapse, LinearProgress,
  Snackbar, Alert, CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon,
  MonitorHeart as MonitorIcon,
  Link as LinkIcon,
  InfoOutlined as InfoIcon,
  OpenInNew as OpenInNewIcon,
  AutoAwesome as AgentIcon,
  Assignment as AssignmentIcon,
  Adjust as AdjustIcon,
  Add as AddIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as ReTooltip, ReferenceLine, Cell, Legend,
  ComposedChart, Line, Area, ScatterChart, Scatter, ReferenceArea, ZAxis,
  LineChart,
} from 'recharts';
import { getApprovedRisks } from '@/lib/risk-store';
import { getScoreColor, getScoreLabel, RISK_CATEGORY_COLORS, RISK_CATEGORY_LABELS, getRiskDisplayId } from '@/lib/utils';
import type { RiskSuggestion } from '@/types/document';
import { getKRIs, seedKRIs } from '@/lib/kri-store';
import type { KeyRiskIndicator } from '@/types/kri';

// ─── Constants ────────────────────────────────────────────────────────────────

const APPETITE_THRESHOLD = 2;
const TOLERANCE_THRESHOLD = 3.5;

const CATEGORY_LABELS = RISK_CATEGORY_LABELS;
const CATEGORY_COLORS = RISK_CATEGORY_COLORS;

const MOCK_CONTROLS: Control[] = [
  { id: 'c1',  name: 'Access Control Policy',        type: 'preventive',  status: 'implemented', effectiveness: 4, categories: ['cyber'] },
  { id: 'c2',  name: 'Security Awareness Training',   type: 'preventive',  status: 'implemented', effectiveness: 3, categories: ['cyber', 'operational'] },
  { id: 'c3',  name: 'Incident Response Plan',        type: 'corrective',  status: 'implemented', effectiveness: 4, categories: ['operational', 'cyber'] },
  { id: 'c4',  name: 'Compliance Monitoring',         type: 'detective',   status: 'implemented', effectiveness: 4, categories: ['compliance'] },
  { id: 'c5',  name: 'Business Continuity Plan',      type: 'corrective',  status: 'in_progress', effectiveness: 3, categories: ['operational'] },
  { id: 'c6',  name: 'Vendor Risk Assessment',        type: 'detective',   status: 'implemented', effectiveness: 3, categories: ['financial', 'operational'] },
  { id: 'c7',  name: 'Data Encryption Standards',     type: 'preventive',  status: 'implemented', effectiveness: 5, categories: ['cyber'] },
  { id: 'c8',  name: 'Financial Controls Review',     type: 'detective',   status: 'implemented', effectiveness: 4, categories: ['financial'] },
  { id: 'c9',  name: 'Change Management Process',     type: 'preventive',  status: 'in_progress', effectiveness: 3, categories: ['operational', 'strategic'] },
  { id: 'c10', name: 'Insurance Coverage',            type: 'corrective',  status: 'implemented', effectiveness: 4, categories: ['financial'] },
  { id: 'c11', name: 'Regulatory Reporting Process',  type: 'detective',   status: 'planned',     effectiveness: 4, categories: ['compliance'] },
  { id: 'c12', name: 'Strategic Risk Review Board',   type: 'detective',   status: 'implemented', effectiveness: 3, categories: ['strategic'] },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type TreatmentStrategy = 'mitigate' | 'accept' | 'transfer' | 'avoid';
type AppetiteStatus = 'within' | 'approaching' | 'exceeded';
type Trend = 'improving' | 'stable' | 'worsening';
type ControlStatus = 'implemented' | 'in_progress' | 'planned';

interface Control {
  id: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective';
  status: ControlStatus;
  effectiveness: number;
  categories: string[];
}

interface EnrichedRisk extends RiskSuggestion {
  inherentScore: number;
  residualScore: number;
  treatment: TreatmentStrategy;
  controlIds: string[];
  vsAppetite: AppetiteStatus;
  trend: Trend;
  reductionPct: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreHash(id: string): number {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

function deriveMetrics(risk: RiskSuggestion): EnrichedRisk {
  const inherentScore = (risk.likelihood + risk.impact) / 2;
  const seed = scoreHash(risk.id);

  let treatment: TreatmentStrategy;
  if (inherentScore >= 4) treatment = 'mitigate';
  else if (inherentScore >= 3) treatment = seed % 3 === 0 ? 'transfer' : seed % 3 === 1 ? 'mitigate' : 'accept';
  else treatment = seed % 2 === 0 ? 'accept' : 'mitigate';

  const controlCount = treatment === 'mitigate' ? 2 + (seed % 3) : treatment === 'transfer' ? 1 : 0;
  const maxReduction = inherentScore - 1;
  const rawReduction =
    treatment === 'mitigate' ? Math.min(1.3 + (seed % 8) * 0.1, maxReduction) :
    treatment === 'transfer' ? Math.min(0.8, maxReduction) : 0;
  const residualScore = Math.max(1, Math.round((inherentScore - rawReduction) * 10) / 10);

  const vsAppetite: AppetiteStatus =
    residualScore <= APPETITE_THRESHOLD ? 'within' :
    residualScore <= TOLERANCE_THRESHOLD ? 'approaching' : 'exceeded';

  const trendSeed = seed % 10;
  const trend: Trend = trendSeed < 4 ? 'improving' : trendSeed < 7 ? 'stable' : 'worsening';

  const controlIds: string[] = [];
  for (let i = 0; i < controlCount; i++) {
    controlIds.push(`c${(seed + i) % 12 + 1}`);
  }

  const reductionPct = inherentScore > 0 ? Math.round(((inherentScore - residualScore) / inherentScore) * 100) : 0;

  return { ...risk, inherentScore, residualScore, treatment, controlIds, vsAppetite, trend, reductionPct };
}

const scoreColor = getScoreColor;
const scoreLabel = getScoreLabel;

// Strategy and control type chips are neutral — they classify, not indicate severity
function treatmentColor(_t: TreatmentStrategy): string {
  return '#60a5fa';
}

function controlTypeColor(_t: string): string {
  return '#60a5fa';
}

function controlStatusColor(s: ControlStatus): string {
  return s === 'implemented' ? '#4ade80' : s === 'in_progress' ? '#fbbf24' : '#94a3b8';
}

function kriStatusColor(status: string): string {
  return status === 'red' ? '#C42B31' : status === 'amber' ? '#C29A1D' : '#2EB365';
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreChip({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ fontWeight: 700, color, lineHeight: 1 }}>
        {score.toFixed(1)}
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1 }}>
        {scoreLabel(score)}
      </Typography>
    </Stack>
  );
}

function AppetiteIcon({ status }: { status: AppetiteStatus }) {
  if (status === 'within')
    return <Tooltip title="Within appetite" arrow><CheckCircleIcon sx={{ fontSize: 16, color: '#2EB365' }} /></Tooltip>;
  if (status === 'approaching')
    return <Tooltip title="Above appetite — within tolerance" arrow><WarningIcon sx={{ fontSize: 16, color: '#C29A1D' }} /></Tooltip>;
  return <Tooltip title="Exceeds tolerance — action required" arrow><WarningIcon sx={{ fontSize: 16, color: '#E54E54' }} /></Tooltip>;
}

function TrendIcon({ trend, delta }: { trend: Trend; delta?: number }) {
  const label = delta !== undefined ? `${Math.abs(delta).toFixed(1)} point ${trend}` : trend;
  if (trend === 'improving')
    return <Tooltip title={label} arrow><TrendingDownIcon sx={{ fontSize: 16, color: '#2EB365' }} /></Tooltip>;
  if (trend === 'worsening')
    return <Tooltip title={label} arrow><TrendingUpIcon sx={{ fontSize: 16, color: '#E54E54' }} /></Tooltip>;
  return <Tooltip title={label} arrow><TrendingFlatIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></Tooltip>;
}

function EffectivenessDots({ value }: { value: number }) {
  return (
    <Stack direction="row" spacing={0.35} alignItems="center">
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: i < value ? '#60a5fa' : 'rgba(255,255,255,0.12)' }} />
      ))}
    </Stack>
  );
}

// ─── KRI Card ─────────────────────────────────────────────────────────────────

function KRICard({ kri }: { kri: KeyRiskIndicator }) {
  const color = kriStatusColor(kri.status);
  const statusLabel = kri.status.toUpperCase();
  const sparklineData = kri.history.map(h => ({ value: h.value }));

  const greenWidth = kri.threshold.amberMax > 0
    ? Math.min((kri.threshold.greenMax / kri.threshold.amberMax) * 60, 60)
    : 0;
  const amberWidth = 25;
  const redWidth = 100 - greenWidth - amberWidth;

  const segments = kri.threshold.direction === 'lower_is_better'
    ? [
        { color: '#2EB365', width: `${greenWidth}%` },
        { color: '#C29A1D', width: `${amberWidth}%` },
        { color: '#C42B31', width: `${redWidth}%` },
      ]
    : [
        { color: '#C42B31', width: `${redWidth}%` },
        { color: '#C29A1D', width: `${amberWidth}%` },
        { color: '#2EB365', width: `${greenWidth}%` },
      ];

  const TrendIconComp = kri.trend === 'improving' ? TrendingDownIcon
    : kri.trend === 'worsening' ? TrendingUpIcon : TrendingFlatIcon;
  const trendColor = kri.trend === 'improving' ? '#2EB365'
    : kri.trend === 'worsening' ? '#C42B31' : '#94a3b8';

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Chip
          label={CATEGORY_LABELS[kri.category] ?? kri.category}
          size="small"
          sx={{ height: 18, fontSize: '0.7rem', bgcolor: `${CATEGORY_COLORS[kri.category]}18`, color: CATEGORY_COLORS[kri.category] }}
        />
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box component="span" sx={{ fontSize: 10, color, lineHeight: 1 }}>●</Box>
          <Typography variant="caption" sx={{ color, fontWeight: 700 }}>{statusLabel}</Typography>
        </Stack>
      </Stack>

      <Typography variant="body1" sx={{ fontWeight: 600, mt: 1, lineHeight: 1.3 }}>{kri.name}</Typography>

      <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.75 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>{kri.currentValue}</Typography>
        <Typography variant="body2" color="text.secondary">{kri.threshold.unit}</Typography>
      </Stack>

      <Box sx={{ width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', mt: 1 }}>
        {segments.map((seg, i) => (
          <Box key={i} sx={{ width: seg.width, bgcolor: seg.color, height: '100%' }} />
        ))}
      </Box>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
        <TrendIconComp sx={{ fontSize: 14, color: trendColor }} />
        <Typography variant="caption" sx={{ color: trendColor, flex: 1 }}>{kri.trend}</Typography>
        <LineChart width={80} height={28} data={sparklineData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </Stack>

      {kri.agentNote && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
          {kri.agentNote}
        </Typography>
      )}

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
        <Typography variant="caption" color="text.secondary">{kri.owner}</Typography>
        <Typography variant="caption" color="text.secondary">{timeAgo(kri.lastUpdatedAt)}</Typography>
      </Stack>
    </Paper>
  );
}

// ─── Agent Action Panel ───────────────────────────────────────────────────────

function AgentActionPanel({ onClose, onAccept }: { onClose: () => void; onAccept: () => void }) {
  const actions = [
    { Icon: AssignmentIcon, text: 'Create issue: "Deploy MFA on admin endpoints"', meta: 'Owner: J. Chen' },
    { Icon: LinkIcon,       text: 'Link control: Access Control Policy (existing)', meta: '' },
    { Icon: TrendingDownIcon, text: 'Update KRI-001 threshold: amber ≤3 → ≤2',    meta: '' },
    { Icon: AdjustIcon,    text: 'Set residual target: L:2 × I:4 post-implementation', meta: '' },
  ];

  return (
    <Paper
      variant="outlined"
      sx={{ mt: 3, p: 2.5, borderLeft: '3px solid #3b82f6', bgcolor: 'rgba(59, 130, 246, 0.05)' }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <AgentIcon sx={{ fontSize: 18, color: '#60a5fa' }} />
        <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>Agent: Proposed actions</Typography>
        <Chip
          label="CR-014 Cloud Infrastructure Exposure"
          size="small"
          sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
        />
      </Stack>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />

      <Stack spacing={1.25} sx={{ mb: 2 }}>
        {actions.map((action, i) => (
          <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start">
            <action.Icon sx={{ fontSize: 16, color: '#60a5fa', mt: 0.15, flexShrink: 0 }} />
            <Box>
              <Typography variant="body2">{action.text}</Typography>
              {action.meta && (
                <Typography variant="caption" color="text.secondary">{action.meta}</Typography>
              )}
            </Box>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" spacing={1}>
        <Button variant="text" size="small" onClick={onClose} sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button variant="outlined" size="small" sx={{ fontSize: '0.75rem' }}>
          Review individually
        </Button>
        <Button variant="contained" size="small" startIcon={<DoneAllIcon />} onClick={onAccept} sx={{ fontSize: '0.75rem' }}>
          Accept all
        </Button>
      </Stack>
    </Paper>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TreatmentPage() {
  const [risks, setRisks] = useState<EnrichedRisk[]>([]);
  const [kris, setKris] = useState<KeyRiskIndicator[]>([]);
  const [tab, setTab] = useState(0);
  const [expandedStrategy, setExpandedStrategy] = useState<TreatmentStrategy | null>('mitigate');
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [expandedControl, setExpandedControl] = useState<string | null>(null);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [kriReviewLoading, setKriReviewLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    seedKRIs();
    const raw = getApprovedRisks();
    const enriched = raw.map(deriveMetrics).sort((a, b) => {
      if (a.trend === 'worsening' && b.trend !== 'worsening') return -1;
      if (b.trend === 'worsening' && a.trend !== 'worsening') return 1;
      return b.inherentScore - a.inherentScore;
    });
    setRisks(enriched);
    setKris(getKRIs());
  }, []);

  // ── Derived stats ──
  const stats = useMemo(() => {
    const total = risks.length;
    const highPriority = risks.filter(r => r.inherentScore >= 4).length;
    const withinAppetite = risks.filter(r => r.vsAppetite === 'within').length;
    const exceededTolerance = risks.filter(r => r.vsAppetite === 'exceeded').length;
    const avgReduction = total > 0
      ? Math.round(risks.reduce((s, r) => s + r.reductionPct, 0) / total)
      : 0;
    return { total, highPriority, withinAppetite, exceededTolerance, avgReduction };
  }, [risks]);

  // ── KRI status summary ──
  const kriSummary = useMemo(() => ({
    red: kris.filter(k => k.status === 'red').length,
    amber: kris.filter(k => k.status === 'amber').length,
    green: kris.filter(k => k.status === 'green').length,
  }), [kris]);

  // ── Risks grouped by treatment strategy ──
  const byStrategy = useMemo(() =>
    (['mitigate', 'accept', 'transfer', 'avoid'] as TreatmentStrategy[]).map(s => ({
      strategy: s,
      risks: risks.filter(r => r.treatment === s),
      avgInherent: risks.filter(r => r.treatment === s).length
        ? risks.filter(r => r.treatment === s).reduce((a, r) => a + r.inherentScore, 0) / risks.filter(r => r.treatment === s).length
        : 0,
      avgResidual: risks.filter(r => r.treatment === s).length
        ? risks.filter(r => r.treatment === s).reduce((a, r) => a + r.residualScore, 0) / risks.filter(r => r.treatment === s).length
        : 0,
      controlCoverage: risks.filter(r => r.treatment === s).length
        ? Math.round((risks.filter(r => r.treatment === s).filter(r => r.controlIds.length > 0).length / risks.filter(r => r.treatment === s).length) * 100)
        : 0,
    })).filter(g => g.risks.length > 0),
    [risks]);

  // ── Category chart data ──
  const categoryChartData = useMemo(() => {
    const cats = ['operational', 'compliance', 'financial', 'cyber', 'strategic'];
    return cats.map(cat => {
      const catRisks = risks.filter(r => r.category === cat);
      const avgInherent = catRisks.length > 0 ? catRisks.reduce((s, r) => s + r.inherentScore, 0) / catRisks.length : 0;
      const avgResidual = catRisks.length > 0 ? catRisks.reduce((s, r) => s + r.residualScore, 0) / catRisks.length : 0;
      return {
        name: CATEGORY_LABELS[cat],
        inherent: parseFloat(avgInherent.toFixed(1)),
        residual: parseFloat(avgResidual.toFixed(1)),
        color: CATEGORY_COLORS[cat],
      };
    }).filter(d => d.inherent > 0);
  }, [risks]);

  // ── Controls with linked risks ──
  const controlsWithRisks = useMemo(() =>
    MOCK_CONTROLS.map(control => ({
      ...control,
      linkedRisks: risks.filter(r => r.controlIds.includes(control.id)),
    })).sort((a, b) => b.linkedRisks.length - a.linkedRisks.length),
    [risks]);

  // ── Trend summary ──
  const trendSummary = useMemo(() => ({
    improving: risks.filter(r => r.trend === 'improving').length,
    stable: risks.filter(r => r.trend === 'stable').length,
    worsening: risks.filter(r => r.trend === 'worsening').length,
  }), [risks]);

  // ── 6-month simulated trend history ──
  const trendHistory = useMemo(() => {
    if (risks.length === 0) return [];
    const avgI = risks.reduce((s, r) => s + r.inherentScore, 0) / risks.length;
    const avgR = risks.reduce((s, r) => s + r.residualScore, 0) / risks.length;
    const excNow = risks.filter(r => r.vsAppetite === 'exceeded').length;
    return [
      { month: 'Oct', inherent: +(avgI + 0.28).toFixed(2), residual: +(avgR + 0.60).toFixed(2), exceeding: Math.round(excNow * 1.5) },
      { month: 'Nov', inherent: +(avgI + 0.20).toFixed(2), residual: +(avgR + 0.44).toFixed(2), exceeding: Math.round(excNow * 1.35) },
      { month: 'Dec', inherent: +(avgI + 0.14).toFixed(2), residual: +(avgR + 0.30).toFixed(2), exceeding: Math.round(excNow * 1.22) },
      { month: 'Jan', inherent: +(avgI + 0.08).toFixed(2), residual: +(avgR + 0.18).toFixed(2), exceeding: Math.round(excNow * 1.12) },
      { month: 'Feb', inherent: +(avgI + 0.03).toFixed(2), residual: +(avgR + 0.08).toFixed(2), exceeding: Math.round(excNow * 1.04) },
      { month: 'Mar', inherent: +avgI.toFixed(2),           residual: +avgR.toFixed(2),           exceeding: excNow },
    ];
  }, [risks]);

  // ── Scatter: each risk as (inherent, residual) with category colour ──
  const scatterData = useMemo(() =>
    risks.map(r => ({
      inherent: r.inherentScore,
      residual: r.residualScore,
      name: r.title,
      category: r.category,
      fill: CATEGORY_COLORS[r.category] ?? '#60a5fa',
    })),
    [risks]);

  // ── Treatment strategy effectiveness ──
  const treatmentEffectivenessData = useMemo(() =>
    (['mitigate', 'accept', 'transfer', 'avoid'] as TreatmentStrategy[]).map(s => {
      const sr = risks.filter(r => r.treatment === s);
      if (sr.length === 0) return null;
      const avgI = sr.reduce((a, r) => a + r.inherentScore, 0) / sr.length;
      const avgR = sr.reduce((a, r) => a + r.residualScore, 0) / sr.length;
      return {
        name: s.charAt(0).toUpperCase() + s.slice(1),
        'Avg inherent': +avgI.toFixed(1),
        'Avg residual': +avgR.toFixed(1),
        reduction: +(((avgI - avgR) / avgI) * 100).toFixed(0),
        count: sr.length,
        color: treatmentColor(s),
      };
    }).filter(Boolean) as { name: string; 'Avg inherent': number; 'Avg residual': number; reduction: number; count: number; color: string }[],
    [risks]);

  // ── Control effectiveness chart data ──
  const controlEffectivenessData = useMemo(() =>
    MOCK_CONTROLS
      .map(c => ({
        name: c.name.length > 22 ? c.name.slice(0, 22) + '…' : c.name,
        effectiveness: c.effectiveness,
        linkedRisks: risks.filter(r => r.controlIds.includes(c.id)).length,
        color: controlTypeColor(c.type),
        type: c.type,
        status: c.status,
      }))
      .sort((a, b) => b.effectiveness - a.effectiveness),
    [risks]);

  return (
    <Box>
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <MonitorIcon sx={{ color: '#60a5fa', fontSize: 22 }} />
            <Typography variant="h1" component="h1">Treatment & monitoring</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track residual risk, treatment strategies, controls, and performance against appetite
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            href="/assessments"
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{ fontSize: '0.8rem' }}
          >
            Run assessment
          </Button>
        </Stack>
      </Stack>

      {/* ── Stats row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Tracked risks', value: stats.total,               sub: 'In register',            color: '#60a5fa' },
          { label: 'High priority',  value: stats.highPriority,        sub: 'Inherent score ≥ 4',     color: '#E54E54' },
          { label: 'Avg. reduction', value: `${stats.avgReduction}%`,  sub: 'Inherent → residual',    color: '#2EB365' },
          { label: 'Within appetite',value: stats.withinAppetite,      sub: `${stats.exceededTolerance} exceed tolerance`, color: '#C29A1D' },
        ].map(s => (
          <Grid key={s.label} size={{ xs: 6, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box sx={{ width: 4, height: 36, borderRadius: 1, bgcolor: s.color, flexShrink: 0, mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.disabled">{s.sub}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Appetite reference banner ── */}
      <Paper variant="outlined" sx={{ p: 1.75, mb: 3, bgcolor: 'rgba(10,16,30,0.4)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <InfoIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Risk appetite thresholds</Typography>
          </Stack>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2EB365' }} />
              <Typography variant="caption" color="text.secondary">Within appetite — score ≤ {APPETITE_THRESHOLD}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#C29A1D' }} />
              <Typography variant="caption" color="text.secondary">Above appetite, within tolerance — score ≤ {TOLERANCE_THRESHOLD}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#E54E54' }} />
              <Typography variant="caption" color="text.secondary">Exceeds tolerance — immediate action required</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* ══════════════════════════════════════════════════════════════════════
          ALWAYS-VISIBLE CHARTS — 6-month trend + inherent vs residual by category
      ══════════════════════════════════════════════════════════════════════ */}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/* ── 6-month residual risk trend ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Residual risk trend — last 6 months</Typography>
                <Typography variant="caption" color="text.secondary">
                  Average inherent (dashed) vs residual score over time. Shaded area = risks exceeding tolerance.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} flexShrink={0} sx={{ pt: 0.25 }}>
                {[
                  { color: 'rgba(255,255,255,0.3)', dash: true,  label: 'Avg inherent' },
                  { color: '#60a5fa',               dash: false, label: 'Avg residual' },
                  { color: 'rgba(229,78,84,0.35)',  dash: false, label: 'Exceeding tolerance', area: true },
                ].map(l => (
                  <Stack key={l.label} direction="row" spacing={0.6} alignItems="center">
                    {l.area
                      ? <Box sx={{ width: 12, height: 8, borderRadius: 1, bgcolor: l.color }} />
                      : <Box sx={{ width: 18, height: 2, borderRadius: 1, bgcolor: l.color, ...(l.dash ? { borderBottom: '1px dashed' } : {}) }} />
                    }
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{l.label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
            <Box sx={{ height: 155, mt: 1.5 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendHistory} margin={{ top: 6, right: 44, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="score" domain={[0, 5]} tickCount={6} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={28} />
                  <YAxis yAxisId="count" orientation="right" domain={[0, 'dataMax + 3']} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={28} />
                  <ReTooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
                    contentStyle={{ background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} itemStyle={{ color: '#94a3b8' }}
                    formatter={(v: unknown, name: unknown) => name === 'exceeding'
                      ? [`${v} risks`, 'Exceeding tolerance']
                      : [`${(v as number).toFixed(2)}`, name === 'inherent' ? 'Avg inherent' : 'Avg residual']}
                  />
                  <ReferenceArea yAxisId="score" y1={0} y2={APPETITE_THRESHOLD}   fill="rgba(46,179,101,0.04)" />
                  <ReferenceArea yAxisId="score" y1={APPETITE_THRESHOLD} y2={TOLERANCE_THRESHOLD} fill="rgba(194,154,29,0.04)" />
                  <ReferenceArea yAxisId="score" y1={TOLERANCE_THRESHOLD} y2={5} fill="rgba(229,78,84,0.04)" />
                  <ReferenceLine yAxisId="score" y={APPETITE_THRESHOLD}  stroke="#2EB365" strokeDasharray="3 3" strokeOpacity={0.5}
                    label={{ value: 'Appetite',  position: 'insideTopRight', fill: '#2EB365',  fontSize: 12 }} />
                  <ReferenceLine yAxisId="score" y={TOLERANCE_THRESHOLD} stroke="#E54E54" strokeDasharray="3 3" strokeOpacity={0.5}
                    label={{ value: 'Tolerance', position: 'insideTopRight', fill: '#E54E54', fontSize: 12 }} />
                  <Area yAxisId="count" dataKey="exceeding" fill="rgba(229,78,84,0.1)" stroke="rgba(229,78,84,0.4)" strokeWidth={1} dot={false} />
                  <Line yAxisId="score" dataKey="inherent" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeDasharray="5 3"
                    dot={{ r: 2.5, fill: 'rgba(255,255,255,0.4)', strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  <Line yAxisId="score" dataKey="residual" stroke="#60a5fa" strokeWidth={2}
                    dot={{ r: 3, fill: '#60a5fa', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* ── Inherent vs residual by category ── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>Inherent vs residual by category</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Average inherent (light) and residual (coloured) scores per risk category.
            </Typography>
            <Box sx={{ height: 155 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} barCategoryGap="28%" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={24} />
                  <ReTooltip
                    cursor={{ fill: 'rgba(96,165,250,0.05)' }}
                    contentStyle={{ background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} itemStyle={{ color: '#94a3b8' }}
                    formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(1)}`, name === 'inherent' ? 'Avg inherent' : 'Avg residual']}
                  />
                  <ReferenceLine y={APPETITE_THRESHOLD} stroke="#2EB365" strokeDasharray="4 4" strokeOpacity={0.5}
                    label={{ value: 'Appetite', position: 'insideTopRight', fill: '#2EB365', fontSize: 11 }} />
                  <ReferenceLine y={TOLERANCE_THRESHOLD} stroke="#E54E54" strokeDasharray="4 4" strokeOpacity={0.5}
                    label={{ value: 'Tolerance', position: 'insideTopRight', fill: '#E54E54', fontSize: 11 }} />
                  <Bar dataKey="inherent" fill="rgba(255,255,255,0.1)" radius={[3, 3, 0, 0]} name="inherent" />
                  <Bar dataKey="residual" radius={[3, 3, 0, 0]} name="residual">
                    {categoryChartData.map((d, i) => (
                      <Cell key={`cat-${i}`} fill={d.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

      </Grid>

      {/* ── Tabs ── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2.5, '& .MuiTab-root': { fontSize: '0.8125rem', minHeight: 40, py: 0 } }}
      >
        <Tab label="Monitoring" />
        <Tab label="Risk treatment" />
        <Tab label="Controls" />
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 – Treatment plans (grouped by strategy)
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Box>
          {/* Treatment strategy effectiveness chart + strategy summary — side by side */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>Treatment strategy effectiveness</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Average inherent vs residual score per treatment strategy.
                </Typography>
                <Box sx={{ height: 178 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={treatmentEffectivenessData} barCategoryGap="30%" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={24} />
                      <ReTooltip
                        cursor={{ fill: 'rgba(96,165,250,0.05)' }}
                        contentStyle={{ background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} itemStyle={{ color: '#94a3b8' }}
                        formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(1)}`, name as string]}
                      />
                      <ReferenceLine y={APPETITE_THRESHOLD} stroke="#2EB365" strokeDasharray="4 4" strokeOpacity={0.5}
                        label={{ value: 'Appetite', position: 'insideTopRight', fill: '#2EB365', fontSize: 11 }} />
                      <Bar dataKey="Avg inherent" fill="rgba(255,255,255,0.1)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Avg residual" radius={[3, 3, 0, 0]}>
                        {treatmentEffectivenessData.map((d, i) => (
                          <Cell key={`te-${i}`} fill={d.color} fillOpacity={0.82} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Grid container spacing={1} sx={{ height: '100%' }}>
                {byStrategy.map(g => (
                  <Grid key={g.strategy} size={{ xs: 6 }}>
                    <Paper
                      variant="outlined"
                      onClick={() => setExpandedStrategy(expandedStrategy === g.strategy ? null : g.strategy)}
                      sx={{
                        p: 1.5, cursor: 'pointer', height: '100%',
                        borderColor: expandedStrategy === g.strategy ? treatmentColor(g.strategy) : undefined,
                        bgcolor: expandedStrategy === g.strategy ? `${treatmentColor(g.strategy)}08` : undefined,
                        transition: 'all 0.18s',
                        '&:hover': { borderColor: treatmentColor(g.strategy), bgcolor: `${treatmentColor(g.strategy)}06` },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Box sx={{ width: 3, height: 24, borderRadius: 1, bgcolor: treatmentColor(g.strategy), flexShrink: 0 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {g.strategy.charAt(0).toUpperCase() + g.strategy.slice(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{g.risks.length} risks</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <ScoreChip score={g.avgInherent} />
                        <ArrowForwardIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                        <ScoreChip score={g.avgResidual} />
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#2EB365', display: 'block', mt: 0.5 }}>
                        {g.controlCoverage}% control coverage
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>

          {/* Agent actions toggle */}
          <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<AgentIcon sx={{ fontSize: 14 }} />}
              onClick={() => setShowActionPanel(v => !v)}
              sx={{ fontSize: '0.75rem', color: '#60a5fa', textTransform: 'none' }}
            >
              {showActionPanel ? 'Hide agent actions for CR-014' : 'Show agent actions for CR-014'}
            </Button>
          </Stack>

          {/* Strategy detail accordion */}
          {byStrategy.map(g => (
            <Paper key={g.strategy} variant="outlined" sx={{ mb: 1.5, overflow: 'hidden' }}>
              {/* Header */}
              <Stack
                direction="row" spacing={1.5} alignItems="center"
                sx={{ px: 2, py: 1.5, cursor: 'pointer', bgcolor: expandedStrategy === g.strategy ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                onClick={() => setExpandedStrategy(expandedStrategy === g.strategy ? null : g.strategy)}
              >
                <Box sx={{ width: 3, height: 32, borderRadius: 1, bgcolor: treatmentColor(g.strategy), flexShrink: 0 }} />
                <Chip
                  label={g.strategy.charAt(0).toUpperCase() + g.strategy.slice(1)}
                  size="small"
                  sx={{ height: 22, fontSize: '0.75rem', bgcolor: `${treatmentColor(g.strategy)}18`, color: treatmentColor(g.strategy), border: `1px solid ${treatmentColor(g.strategy)}40`, fontWeight: 700 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  {g.risks.length} risk{g.risks.length !== 1 ? 's' : ''}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.disabled">Avg</Typography>
                  <ScoreChip score={g.avgInherent} />
                  <ArrowForwardIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <ScoreChip score={g.avgResidual} />
                  <Typography variant="caption" sx={{ color: '#2EB365', minWidth: 36 }}>
                    −{Math.round(((g.avgInherent - g.avgResidual) / g.avgInherent) * 100)}%
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                  {g.controlCoverage}% covered
                </Typography>
                <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary', transition: 'transform 0.2s', transform: expandedStrategy === g.strategy ? 'rotate(180deg)' : 'none' }} />
              </Stack>

              <Collapse in={expandedStrategy === g.strategy} unmountOnExit>
                <Divider />
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 72 }}>ID</TableCell>
                      <TableCell>Risk</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Inherent</TableCell>
                      <TableCell>Controls</TableCell>
                      <TableCell>Residual</TableCell>
                      <TableCell align="center">vs Appetite</TableCell>
                      <TableCell align="center">Trend</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {g.risks.map(risk => {
                      const controls = MOCK_CONTROLS.filter(c => risk.controlIds.includes(c.id));
                      const riskExpanded = expandedRisk === risk.id;
                      const kriMod = scoreHash(risk.id) % 8;
                      const kriSignal =
                        kriMod === 0 ? { label: 'FX Hedge Ratio 74%',        status: 'RED' } :
                        kriMod === 1 ? { label: 'Unpatched CVEs 4',           status: 'RED' } :
                        kriMod === 2 ? { label: 'Regulatory Findings 12%',    status: 'RED' } :
                        kriMod === 3 ? { label: 'DR Test 214d',               status: 'RED' } :
                        null;
                      return (
                        <React.Fragment key={risk.id}>
                          <TableRow
                            hover
                            sx={{ cursor: 'pointer', bgcolor: risk.trend === 'worsening' ? 'rgba(229,78,84,0.04)' : 'transparent', '& .MuiTableCell-body': { py: 0.85 } }}
                            onClick={() => setExpandedRisk(riskExpanded ? null : risk.id)}
                          >
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                                {getRiskDisplayId(risk.id, risks)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 220 }}>
                              <Typography
                                component={Link} href={`/risks/${risk.id}`} variant="body2"
                                sx={{ fontWeight: 600, textDecoration: 'none', color: 'text.primary', '&:hover': { color: '#60a5fa' },
                                  display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                onClick={e => e.stopPropagation()}
                              >
                                {risk.title}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={CATEGORY_LABELS[risk.category] ?? risk.category} size="small"
                                sx={{ height: 18, fontSize: '0.75rem', color: 'text.secondary' }}
                              />
                            </TableCell>
                            <TableCell><ScoreChip score={risk.inherentScore} /></TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <LinkIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">{controls.length}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.2}>
                                <ScoreChip score={risk.residualScore} />
                                {risk.reductionPct > 0 && (
                                  <Typography variant="caption" sx={{ color: '#2EB365', fontSize: '0.75rem' }}>−{risk.reductionPct}%</Typography>
                                )}
                                {kriSignal && (
                                  <Stack direction="row" spacing={0.4} alignItems="center">
                                    <WarningIcon sx={{ fontSize: 11, color: '#C42B31' }} />
                                    <Typography variant="caption" sx={{ color: '#C42B31', fontSize: '0.7rem' }}>
                                      ↳ KRI: {kriSignal.label} [{kriSignal.status}]
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="center"><AppetiteIcon status={risk.vsAppetite} /></TableCell>
                            <TableCell align="center"><TrendIcon trend={risk.trend} /></TableCell>
                            <TableCell align="right">
                              <IconButton size="small">
                                <ExpandMoreIcon sx={{ fontSize: 15, color: 'text.secondary', transition: 'transform 0.2s', transform: riskExpanded ? 'rotate(180deg)' : 'none' }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>

                          <TableRow key={`${risk.id}-detail`}>
                            <TableCell colSpan={9} sx={{ p: 0, border: riskExpanded ? undefined : 'none' }}>
                              <Collapse in={riskExpanded} unmountOnExit>
                                <Box sx={{ px: 3, py: 2, bgcolor: 'rgba(10,16,30,0.5)', borderTop: '1px solid rgba(96,165,250,0.06)' }}>
                                  <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 5 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>Description</Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{risk.description}</Typography>
                                      <Stack direction="row" spacing={0.75} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
                                        <Chip size="small" label={`Likelihood: ${risk.likelihood}/5`} sx={{ height: 18, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.05)' }} />
                                        <Chip size="small" label={`Impact: ${risk.impact}/5`} sx={{ height: 18, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.05)' }} />
                                        {risk.suggestedOwner && <Chip size="small" label={risk.suggestedOwner.name} sx={{ height: 18, fontSize: '0.75rem', bgcolor: 'rgba(255,255,255,0.05)' }} />}
                                      </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 4 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>Controls ({controls.length})</Typography>
                                      {controls.length === 0
                                        ? <Typography variant="caption" color="text.disabled">No controls assigned — consider adding mitigating controls</Typography>
                                        : <Stack spacing={0.6}>{controls.map(c => (
                                            <Stack key={c.id} direction="row" spacing={0.75} alignItems="center">
                                              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: controlTypeColor(c.type), flexShrink: 0 }} />
                                              <Typography variant="caption" sx={{ flex: 1 }}>{c.name}</Typography>
                                              <Chip label={c.type} size="small" sx={{ height: 15, fontSize: '0.6rem', bgcolor: `${controlTypeColor(c.type)}18`, color: controlTypeColor(c.type), border: 'none' }} />
                                            </Stack>
                                          ))}</Stack>
                                      }
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 3 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>Score reduction</Typography>
                                      <Stack spacing={0.9}>
                                        {[
                                          { label: 'Inherent', score: risk.inherentScore },
                                          { label: 'Residual', score: risk.residualScore },
                                        ].map(row => (
                                          <Box key={row.label}>
                                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                                              <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                                              <Typography variant="caption" sx={{ color: scoreColor(row.score), fontWeight: 700 }}>{row.score.toFixed(1)}</Typography>
                                            </Stack>
                                            <LinearProgress variant="determinate" value={(row.score / 5) * 100}
                                              sx={{ height: 4, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar': { bgcolor: scoreColor(row.score) } }}
                                            />
                                          </Box>
                                        ))}
                                        <Typography variant="caption" sx={{ color: '#2EB365' }}>{risk.reductionPct}% reduction</Typography>
                                      </Stack>
                                    </Grid>
                                  </Grid>
                                  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                                    <Button component={Link} href={`/risks/${risk.id}`} size="small" variant="text"
                                      endIcon={<OpenInNewIcon sx={{ fontSize: '12px !important' }} />}
                                      sx={{ fontSize: '0.75rem', color: 'text.secondary', '&:hover': { color: '#60a5fa' } }}
                                    >
                                      View full risk detail
                                    </Button>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </Collapse>
            </Paper>
          ))}

          {/* Agent action panel */}
          {showActionPanel && (
            <AgentActionPanel
              onClose={() => setShowActionPanel(false)}
              onAccept={() => {
                setShowActionPanel(false);
                setSnackbar({ open: true, message: 'Actions accepted — agent will execute' });
              }}
            />
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 – Controls register
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Control</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Effectiveness</TableCell>
                  <TableCell>Linked risks</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {controlsWithRisks.map(control => {
                  const expanded = expandedControl === control.id;
                  return (
                    <React.Fragment key={control.id}>
                      <TableRow
                        hover
                        sx={{ cursor: 'pointer', '& .MuiTableCell-body': { py: 1 } }}
                        onClick={() => setExpandedControl(expanded ? null : control.id)}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{control.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={control.type.charAt(0).toUpperCase() + control.type.slice(1)}
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.75rem',
                              bgcolor: `${controlTypeColor(control.type)}18`,
                              color: controlTypeColor(control.type),
                              border: `1px solid ${controlTypeColor(control.type)}40`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={control.status === 'in_progress' ? 'In progress' : control.status.charAt(0).toUpperCase() + control.status.slice(1)}
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.75rem',
                              bgcolor: `${controlStatusColor(control.status)}18`,
                              color: controlStatusColor(control.status),
                              border: `1px solid ${controlStatusColor(control.status)}40`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <EffectivenessDots value={control.effectiveness} />
                            <Typography variant="caption" color="text.secondary">{control.effectiveness}/5</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LinkIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {control.linkedRisks.length} risk{control.linkedRisks.length !== 1 ? 's' : ''}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      <TableRow key={`${control.id}-exp`}>
                        <TableCell colSpan={6} sx={{ p: 0, border: expanded ? undefined : 'none' }}>
                          <Collapse in={expanded} unmountOnExit>
                            <Box sx={{ px: 3, py: 2, bgcolor: 'rgba(10,16,30,0.5)', borderTop: '1px solid rgba(96,165,250,0.08)' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                                Linked risks
                              </Typography>
                              {control.linkedRisks.length === 0 ? (
                                <Typography variant="caption" color="text.disabled">No risks currently linked to this control</Typography>
                              ) : (
                                <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75 }}>
                                  {control.linkedRisks.map(r => (
                                    <Chip
                                      key={r.id}
                                      component={Link}
                                      href={`/risks/${r.id}`}
                                      label={r.title}
                                      size="small"
                                      clickable
                                      icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: scoreColor(r.inherentScore), ml: '8px !important' }} />}
                                      sx={{
                                        height: 22, fontSize: '0.75rem',
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        '&:hover': { bgcolor: 'rgba(96,165,250,0.12)', borderColor: '#60a5fa' },
                                      }}
                                    />
                                  ))}
                                </Stack>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                                Applies to categories: {control.categories.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}
                              </Typography>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 – Monitoring
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (() => {
        const monitoringUrgent = kriSummary.red > 0 || stats.exceededTolerance > 0;
        const monitoringWarning = !monitoringUrgent && (kriSummary.amber > 0 || trendSummary.worsening > 0);
        const monitoringBorderColor = monitoringUrgent ? '#f87171' : monitoringWarning ? '#fbbf24' : '#4ade80';
        const monitoringBannerBg = monitoringUrgent
          ? 'rgba(248,113,113,0.04)' : monitoringWarning
          ? 'rgba(251,191,36,0.03)' : 'rgba(74,222,128,0.03)';

        const summaryParts: string[] = [];
        if (kriSummary.red > 0) summaryParts.push(`${kriSummary.red} KRI${kriSummary.red > 1 ? 's' : ''} in red`);
        if (stats.exceededTolerance > 0) summaryParts.push(`${stats.exceededTolerance} risk${stats.exceededTolerance > 1 ? 's' : ''} exceeding tolerance`);
        if (trendSummary.worsening > 0) summaryParts.push(`${trendSummary.worsening} risk${trendSummary.worsening > 1 ? 's' : ''} trending upward`);
        if (kriSummary.amber > 0) summaryParts.push(`${kriSummary.amber} KRI${kriSummary.amber > 1 ? 's' : ''} in amber`);
        const monitoringBannerText = summaryParts.length === 0
          ? 'All KRIs green and risks within appetite. Portfolio is in good standing.'
          : (summaryParts.slice(0, 3).join(', ') + '. ' + (monitoringUrgent ? 'Review priority actions below.' : 'Monitor closely.'));

        const exceededRisks = risks.filter(r => r.vsAppetite === 'exceeded');
        const redKRIs = kris.filter(k => k.status === 'red');
        const worseningRisks = risks.filter(r => r.trend === 'worsening' && r.vsAppetite !== 'exceeded');
        const totalPriority = exceededRisks.length + redKRIs.length + worseningRisks.length + 1;

        return (
        <Box>
          {/* ── Monitoring summary banner ── */}
          <Paper variant="outlined" sx={{
            mb: 2.5, px: 2.5, py: 1.75,
            borderLeft: `3px solid ${monitoringBorderColor}`,
            bgcolor: monitoringBannerBg,
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 28, height: 28, borderRadius: 1, flexShrink: 0,
                background: 'linear-gradient(135deg,#5C6BC0,#9C27B0,#E91E63)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AgentIcon sx={{ fontSize: 14, color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
                  {monitoringBannerText}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Risk Agent · Monitoring · Updated just now
                </Typography>
              </Box>
              {(monitoringUrgent || monitoringWarning) && (
                <Chip size="small"
                  label={monitoringUrgent ? 'Action required' : 'Review recommended'}
                  sx={{
                    height: 20, fontSize: '0.68rem', flexShrink: 0,
                    bgcolor: monitoringUrgent ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                    color: monitoringUrgent ? '#f87171' : '#fbbf24',
                    border: `1px solid ${monitoringUrgent ? 'rgba(248,113,113,0.25)' : 'rgba(251,191,36,0.25)'}`,
                  }}
                />
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={kriReviewLoading
                  ? <CircularProgress size={11} sx={{ color: 'inherit' }} />
                  : <AgentIcon sx={{ fontSize: '13px !important' }} />}
                disabled={kriReviewLoading}
                sx={{ flexShrink: 0, fontSize: '0.78rem' }}
                onClick={() => {
                  setKriReviewLoading(true);
                  setTimeout(() => {
                    setKriReviewLoading(false);
                    setSnackbar({ open: true, message: 'KRI values updated from latest data' });
                  }, 1800);
                }}
              >
                {kriReviewLoading ? 'Reviewing…' : 'Run agent review'}
              </Button>
            </Stack>
          </Paper>

          {/* ── Priority actions ── */}
          <Box sx={{ mb: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Priority actions</Typography>
              <Chip
                size="small"
                label={`${totalPriority} pending`}
                sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}
              />
            </Stack>

            <Stack spacing={0.75}>
              {/* Tolerance-exceeded risks */}
              {exceededRisks.slice(0, 3).map(risk => (
                <Paper
                  key={risk.id}
                  variant="outlined"
                  sx={{ px: 2, py: 1.25, borderLeft: '2px solid #E54E54', bgcolor: 'rgba(229,78,84,0.025)' }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip label="TOLERANCE EXCEEDED" size="small" sx={{
                      height: 19, fontSize: '0.66rem', fontWeight: 700, flexShrink: 0,
                      bgcolor: 'rgba(229,78,84,0.12)', color: '#E54E54',
                      border: '1px solid rgba(229,78,84,0.3)',
                    }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{risk.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Residual {risk.residualScore.toFixed(1)} — exceeds tolerance of {TOLERANCE_THRESHOLD}
                        {risk.trend === 'worsening' ? ' · Trend worsening' : ''}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} flexShrink={0}>
                      <Button
                        component={Link}
                        href={`/risks/${risk.id}`}
                        variant="outlined"
                        size="small"
                        startIcon={<ArrowForwardIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{ fontSize: '0.75rem', py: 0.375 }}
                      >
                        Review treatment
                      </Button>
                      <Button variant="text" size="small"
                        sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 0.375 }}
                        onClick={() => setSnackbar({ open: true, message: 'Alert dismissed' })}>
                        Dismiss
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              {/* Red KRIs */}
              {redKRIs.slice(0, 2).map(kri => (
                <Paper
                  key={kri.id}
                  variant="outlined"
                  sx={{ px: 2, py: 1.25, borderLeft: '2px solid #C42B31', bgcolor: 'rgba(196,43,49,0.025)' }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip label="KRI BREACH" size="small" sx={{
                      height: 19, fontSize: '0.66rem', fontWeight: 700, flexShrink: 0,
                      bgcolor: 'rgba(196,43,49,0.12)', color: '#E54E54',
                      border: '1px solid rgba(196,43,49,0.3)',
                    }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{kri.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Current value {kri.currentValue} {kri.threshold.unit} has breached red threshold
                        {kri.agentNote ? ` · ${kri.agentNote}` : ''}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} flexShrink={0}>
                      <Button
                        component={Link}
                        href="/kris"
                        variant="outlined"
                        size="small"
                        startIcon={<ArrowForwardIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{ fontSize: '0.75rem', py: 0.375 }}
                      >
                        View KRI
                      </Button>
                      <Button
                        component={Link}
                        href="/assessments"
                        variant="outlined"
                        size="small"
                        startIcon={<ArrowForwardIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{ fontSize: '0.75rem', py: 0.375 }}
                      >
                        Trigger reassessment
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              {/* Worsening trends */}
              {worseningRisks.slice(0, 2).map(risk => (
                <Paper
                  key={risk.id}
                  variant="outlined"
                  sx={{ px: 2, py: 1.25, borderLeft: '2px solid #C29A1D', bgcolor: 'rgba(194,154,29,0.025)' }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip label="TREND ALERT" size="small" sx={{
                      height: 19, fontSize: '0.66rem', fontWeight: 700, flexShrink: 0,
                      bgcolor: 'rgba(194,154,29,0.12)', color: '#C29A1D',
                      border: '1px solid rgba(194,154,29,0.3)',
                    }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{risk.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Score trending upward — residual {risk.residualScore.toFixed(1)} approaching tolerance
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} flexShrink={0}>
                      <Button
                        component={Link}
                        href="/assessments"
                        variant="outlined"
                        size="small"
                        startIcon={<ArrowForwardIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{ fontSize: '0.75rem', py: 0.375 }}
                      >
                        Schedule review
                      </Button>
                      <Button variant="text" size="small"
                        sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 0.375 }}
                        onClick={() => setSnackbar({ open: true, message: 'Alert dismissed' })}>
                        Dismiss
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              {/* Static agent recommendation */}
              <Paper
                variant="outlined"
                sx={{ px: 2, py: 1.25, borderLeft: '2px solid #3b82f6', bgcolor: 'rgba(59,130,246,0.025)' }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip label="AGENT RECOMMENDATION" size="small" sx={{
                    height: 19, fontSize: '0.66rem', fontWeight: 700, flexShrink: 0,
                    bgcolor: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Cloud infrastructure exposure — 90 days unassessed
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      KRI-001 currently RED · Agent recommends reassessment to validate control effectiveness
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.75} flexShrink={0}>
                    <Button
                      component={Link}
                      href="/assessments"
                      variant="contained"
                      size="small"
                      startIcon={<ArrowForwardIcon sx={{ fontSize: '12px !important' }} />}
                      sx={{ fontSize: '0.75rem', py: 0.375 }}
                    >
                      Start assessment
                    </Button>
                    <Button variant="text" size="small"
                      sx={{ fontSize: '0.75rem', color: 'text.secondary', py: 0.375 }}
                      onClick={() => setSnackbar({ open: true, message: 'Alert dismissed' })}>
                      Dismiss
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Box>

          {/* ── KRI section ── */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Key risk indicators</Typography>
            {kriSummary.red > 0 && (
              <Chip size="small" label={`${kriSummary.red} red`} sx={{ height: 19, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(196,43,49,0.15)', color: '#E54E54', border: '1px solid rgba(196,43,49,0.3)' }} />
            )}
            {kriSummary.amber > 0 && (
              <Chip size="small" label={`${kriSummary.amber} amber`} sx={{ height: 19, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(194,154,29,0.12)', color: '#C29A1D', border: '1px solid rgba(194,154,29,0.3)' }} />
            )}
            {kriSummary.green > 0 && (
              <Chip size="small" label={`${kriSummary.green} green`} sx={{ height: 19, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(46,179,101,0.1)', color: '#2EB365', border: '1px solid rgba(46,179,101,0.25)' }} />
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              component={Link}
              href="/kris"
              variant="outlined"
              size="small"
              startIcon={<OpenInNewIcon sx={{ fontSize: '13px !important' }} />}
              sx={{ fontSize: '0.78rem' }}
            >
              Manage KRIs
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: '13px !important' }} />}
              sx={{ fontSize: '0.78rem' }}
              onClick={() => setSnackbar({ open: true, message: 'KRI creation — visit the KRI management page' })}
            >
              Add KRI
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {kris.map(kri => (
              <Grid key={kri.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                <KRICard kri={kri} />
              </Grid>
            ))}
          </Grid>

          {/* ── Risk position map + score reduction + status overview ── */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>Risk position map</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Each dot is one risk. Below the diagonal = reduced by controls. Bands show appetite zones.
                </Typography>
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 8, right: 16, bottom: 20, left: 8 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <ReferenceArea y1={0.5} y2={APPETITE_THRESHOLD} fill="rgba(46,179,101,0.07)" />
                      <ReferenceArea y1={APPETITE_THRESHOLD} y2={TOLERANCE_THRESHOLD} fill="rgba(194,154,29,0.07)" />
                      <ReferenceArea y1={TOLERANCE_THRESHOLD} y2={5.5} fill="rgba(229,78,84,0.07)" />
                      <XAxis type="number" dataKey="inherent" name="Inherent" domain={[0.5, 5.5]}
                        tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false}
                        label={{ value: 'Inherent', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }} />
                      <YAxis type="number" dataKey="residual" name="Residual" domain={[0.5, 5.5]}
                        tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false}
                        label={{ value: 'Residual', angle: -90, position: 'insideLeft', offset: 14, fill: '#64748b', fontSize: 12 }} />
                      <ZAxis range={[28, 28]} />
                      <ReferenceLine segment={[{ x: 0.5, y: 0.5 }, { x: 5.5, y: 5.5 }]}
                        stroke="rgba(255,255,255,0.15)" strokeDasharray="5 4"
                        label={{ value: 'No reduction', position: 'insideTopLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} />
                      <ReferenceLine y={APPETITE_THRESHOLD} stroke="#2EB365" strokeDasharray="3 3" strokeOpacity={0.55}
                        label={{ value: 'Appetite', position: 'insideTopRight', fill: '#2EB365', fontSize: 12 }} />
                      <ReferenceLine y={TOLERANCE_THRESHOLD} stroke="#E54E54" strokeDasharray="3 3" strokeOpacity={0.55}
                        label={{ value: 'Tolerance', position: 'insideTopRight', fill: '#E54E54', fontSize: 12 }} />
                      <ReTooltip
                        cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
                        contentStyle={{ background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} itemStyle={{ color: '#94a3b8' }}
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <Box sx={{ p: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>{d.name}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Inherent: {d.inherent.toFixed(1)}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Residual: {d.residual.toFixed(1)}</Typography>
                              <Typography variant="caption" sx={{ color: CATEGORY_COLORS[d.category], display: 'block', mt: 0.5 }}>
                                {CATEGORY_LABELS[d.category]}
                              </Typography>
                            </Box>
                          );
                        }}
                      />
                      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                        <Scatter key={cat} name={label}
                          data={scatterData.filter(d => d.category === cat)}
                          fill={CATEGORY_COLORS[cat]} fillOpacity={0.75} />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 4 }}
                        formatter={v => <span style={{ color: '#94a3b8' }}>{v}</span>} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>Score reduction — top 10 risks</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Faded bar = inherent. Coloured bar = residual after treatment.
                </Typography>
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...risks].sort((a, b) => b.inherentScore - a.inherentScore).slice(0, 10).map(r => ({
                        name: r.title.split(' ').slice(0, 3).join(' '),
                        inherent: parseFloat(r.inherentScore.toFixed(1)),
                        residual: parseFloat(r.residualScore.toFixed(1)),
                        color: scoreColor(r.residualScore),
                      }))}
                      layout="vertical" barCategoryGap="22%"
                      margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={96}
                        tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                        tickFormatter={v => v.length > 16 ? v.slice(0, 16) + '…' : v} />
                      <ReTooltip
                        cursor={{ fill: 'rgba(96,165,250,0.05)' }}
                        contentStyle={{ background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} itemStyle={{ color: '#94a3b8' }}
                        formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(1)}`, name === 'inherent' ? 'Inherent' : 'Residual']}
                      />
                      <ReferenceLine x={APPETITE_THRESHOLD} stroke="#2EB365" strokeDasharray="4 4" strokeOpacity={0.6}
                        label={{ value: 'Appetite', position: 'insideTopRight', fill: '#2EB365', fontSize: 12 }} />
                      <ReferenceLine x={TOLERANCE_THRESHOLD} stroke="#E54E54" strokeDasharray="4 4" strokeOpacity={0.6}
                        label={{ value: 'Tolerance', position: 'insideTopRight', fill: '#E54E54', fontSize: 12 }} />
                      <Bar dataKey="inherent" name="inherent" fill="rgba(255,255,255,0.08)" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="residual" name="residual" radius={[0, 3, 3, 0]}>
                        {[...risks].sort((a, b) => b.inherentScore - a.inherentScore).slice(0, 10).map((_, i) => (
                          <Cell key={`sr-${i}`} fill={scoreColor([...risks].sort((a, b) => b.inherentScore - a.inherentScore)[i].residualScore)} fillOpacity={0.82} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Paper variant="outlined" sx={{ height: '100%', overflow: 'hidden' }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.25 }}>Residual trend</Typography>
                  <Stack spacing={1}>
                    {([
                      { label: 'Improving', count: trendSummary.improving, color: '#2EB365', Icon: TrendingDownIcon },
                      { label: 'Stable',    count: trendSummary.stable,    color: '#94a3b8', Icon: TrendingFlatIcon },
                      { label: 'Worsening', count: trendSummary.worsening, color: '#E54E54', Icon: TrendingUpIcon },
                    ] as const).map(t => (
                      <Stack key={t.label} direction="row" spacing={1} alignItems="center">
                        <t.Icon sx={{ fontSize: 14, color: t.color, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>{t.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: t.color }}>{t.count}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.25 }}>Vs appetite</Typography>
                  <Stack spacing={1}>
                    {([
                      { label: 'Within',   count: stats.withinAppetite,                                     color: '#2EB365' },
                      { label: 'Above',    count: risks.filter(r => r.vsAppetite === 'approaching').length, color: '#C29A1D' },
                      { label: 'Exceeded', count: stats.exceededTolerance,                                  color: '#E54E54' },
                    ] as const).map(s => (
                      <Box key={s.label}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                          <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: s.color }}>{s.count}</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={stats.total > 0 ? (s.count / stats.total) * 100 : 0}
                          sx={{ height: 3, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: s.color } }} />
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.25 }}>
                    <WarningIcon sx={{ fontSize: 13, color: '#E54E54' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Needs attention</Typography>
                  </Stack>
                  {risks.filter(r => r.trend === 'worsening' || r.vsAppetite === 'exceeded').length === 0 ? (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <CheckCircleIcon sx={{ fontSize: 13, color: '#2EB365' }} />
                      <Typography variant="caption" color="text.secondary">All within tolerance</Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={0.5}>
                      {risks.filter(r => r.trend === 'worsening' || r.vsAppetite === 'exceeded').slice(0, 4).map(r => (
                        <Stack key={r.id} direction="row" spacing={0.75} alignItems="center">
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: scoreColor(r.residualScore), flexShrink: 0 }} />
                          <Typography component={Link} href={`/risks/${r.id}`} variant="caption"
                            sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: '#60a5fa' }, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.title}
                          </Typography>
                          <TrendIcon trend={r.trend} />
                        </Stack>
                      ))}
                      {risks.filter(r => r.trend === 'worsening' || r.vsAppetite === 'exceeded').length > 4 && (
                        <Typography variant="caption" color="text.disabled">
                          +{risks.filter(r => r.trend === 'worsening' || r.vsAppetite === 'exceeded').length - 4} more
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        );
      })()}

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity="success"
          variant="filled"
          sx={{ fontSize: '0.85rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
