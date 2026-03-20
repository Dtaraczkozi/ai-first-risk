'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Snackbar,
  Alert,
  Grid,
  Tooltip,
  Avatar,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RegenerateIcon,
  Publish as PushIcon,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning as WarningIcon,
  CheckCircle as GreenIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';
import { getScoreColor, RISK_CATEGORY_COLORS } from '@/lib/utils';

// ─── Mock data ────────────────────────────────────────────────────────────────

// Use the canonical app category colours from lib/utils
const CATEGORY_COLORS = RISK_CATEGORY_COLORS;

const TOP_RISKS = [
  { id: 'CR-014', name: 'Cloud Infrastructure Single Point of Failure', category: 'cyber',       inherent: 4.5, residual: 3.2, delta: +0.4, owner: 'J. Chen',   status: 'critical' },
  { id: 'FR-003', name: 'FX Concentration & Hedging Gap',               category: 'financial',   inherent: 4.0, residual: 3.8, delta: +0.6, owner: 'M. Torres', status: 'critical' },
  { id: 'CM-009', name: 'DORA Article 9 Non-Compliance',                category: 'compliance',  inherent: 3.8, residual: 3.5, delta: +0.3, owner: 'L. Park',   status: 'high' },
  { id: 'OP-007', name: 'Business Continuity — DR Test Overdue',        category: 'operational', inherent: 3.5, residual: 3.1, delta: +0.2, owner: 'R. Obi',    status: 'high' },
  { id: 'CR-021', name: 'Unpatched CVE Accumulation on Admin Nodes',    category: 'cyber',       inherent: 4.2, residual: 3.4, delta: +0.5, owner: 'J. Chen',   status: 'critical' },
  { id: 'ST-004', name: 'AI Vendor Concentration (Single LLM Provider)',category: 'strategic',   inherent: 3.2, residual: 2.8, delta: +0.1, owner: 'A. Nkosi',  status: 'high' },
  { id: 'FM-011', name: 'Liquidity Stress Under Rate Scenario',         category: 'financial',   inherent: 3.0, residual: 2.5, delta: 0,    owner: 'M. Torres', status: 'medium' },
  { id: 'OP-002', name: 'Key-Person Dependency — Risk Function',        category: 'operational', inherent: 2.8, residual: 2.6, delta: 0,    owner: 'S. Li',     status: 'medium' },
  { id: 'CM-014', name: 'Data Residency — Cross-Border Transfer Gap',   category: 'compliance',  inherent: 3.1, residual: 2.4, delta: -0.2, owner: 'L. Park',   status: 'medium' },
  { id: 'ST-008', name: 'Competitor AI Adoption Pace',                  category: 'strategic',   inherent: 2.6, residual: 2.6, delta: +0.1, owner: 'A. Nkosi',  status: 'medium' },
];

const TREND_DATA = [
  { month: 'Oct 25', avgInherent: 3.62, avgResidual: 2.71, critical: 1, high: 10, total: 44 },
  { month: 'Nov 25', avgInherent: 3.71, avgResidual: 2.78, critical: 2, high: 11, total: 46 },
  { month: 'Dec 25', avgInherent: 3.68, avgResidual: 2.82, critical: 2, high: 12, total: 47 },
  { month: 'Jan 26', avgInherent: 3.75, avgResidual: 2.95, critical: 3, high: 13, total: 48 },
  { month: 'Feb 26', avgInherent: 3.82, avgResidual: 3.04, critical: 3, high: 14, total: 49 },
  { month: 'Mar 26', avgInherent: 3.89, avgResidual: 3.12, critical: 4, high: 14, total: 50 },
];

const CATEGORY_DATA = [
  { category: 'Cyber',       count: 14, avgResidual: 3.3 },
  { category: 'Financial',   count: 11, avgResidual: 3.1 },
  { category: 'Operational', count: 10, avgResidual: 2.7 },
  { category: 'Compliance',  count: 9,  avgResidual: 2.9 },
  { category: 'Strategic',   count: 6,  avgResidual: 2.6 },
];

// [likelihood 5→1][impact 1→5] — risk count per cell
const HEATMAP: number[][] = [
  [0, 1, 2, 3, 2], // L=5
  [0, 1, 3, 4, 2], // L=4
  [1, 2, 5, 3, 1], // L=3
  [2, 3, 3, 2, 0], // L=2
  [3, 2, 1, 1, 0], // L=1
];

// KRI status uses numeric scale 1–5 with qualitative labels; no RAG text
const KRI_ROWS = [
  { kri: 'Unpatched CVEs',          start: '1 — Very low', end: '4 — High',      trend: 'up',   fromScore: 1, toScore: 4 },
  { kri: 'FX Hedge Ratio',          start: '1 — Very low', end: '4 — High',      trend: 'down', fromScore: 1, toScore: 4 },
  { kri: 'Regulatory findings >30d',start: '1 — Very low', end: '4 — High',      trend: 'up',   fromScore: 1, toScore: 4 },
  { kri: 'Failed auth attempts/wk', start: '2 — Low',      end: '3 — Medium',    trend: 'up',   fromScore: 2, toScore: 3 },
  { kri: 'DR test (days since)',     start: '1 — Very low', end: '5 — Critical',  trend: 'up',   fromScore: 1, toScore: 5 },
  { kri: 'Control test coverage',   start: '1 — Very low', end: '3 — Medium',    trend: 'down', fromScore: 1, toScore: 3 },
];

const HISTORY_ROWS = [
  { type: 'Executive summary', period: 'Q4 2025', generatedBy: 'Agent',     date: 'Dec 15, 2025' },
  { type: 'Detailed',          period: 'Q3 2025', generatedBy: 'Agent',     date: 'Sep 22, 2025' },
  { type: 'Board pack',        period: 'Q3 2025', generatedBy: 'Sarah Chen', date: 'Sep 30, 2025' },
  { type: 'Executive summary', period: 'Q2 2025', generatedBy: 'Agent',     date: 'Jun 18, 2025' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Map L×I product → app score colour (same palette used across all pages)
function heatmapColor(l: number, i: number): string {
  const product = l * i;
  if (product >= 15) return '#C42B31'; // score 5
  if (product >= 10) return '#E54E54'; // score 4
  if (product >= 6)  return '#C29A1D'; // score 3
  if (product >= 3)  return '#2EB365'; // score 2
  return '#7ECDA0';                     // score 1
}

function statusColor(status: string): string {
  if (status === 'critical') return '#C42B31';
  if (status === 'high')     return '#E54E54';
  if (status === 'medium')   return '#C29A1D';
  return '#94a3b8';
}

function scoreColor(score: number): string {
  return getScoreColor(score);
}

interface SectionProps {
  borderColor: string;
  title: string;
  children: React.ReactNode;
}

function ReportSection({ title, children }: Omit<SectionProps, 'borderColor'>) {
  return (
    <Box sx={{ pl: 2, borderLeft: '3px solid rgba(96,165,250,0.4)', mb: 3.5 }}>
      <Typography variant="h3" component="h3" sx={{ mb: 1.5, color: 'text.primary' }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

// ─── Risk Heatmap ─────────────────────────────────────────────────────────────

function RiskHeatmap() {
  return (
    <Box>
      {/* Column headers (Impact) */}
      <Stack direction="row" sx={{ mb: 0.5, pl: '36px' }}>
        <Typography variant="caption" color="text.disabled" sx={{ width: '100%', textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Impact →
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ mb: 0.25, pl: '36px' }} spacing={0.5}>
        {[1, 2, 3, 4, 5].map(i => (
          <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>{i}</Typography>
          </Box>
        ))}
      </Stack>

      {/* Rows (Likelihood 5→1) */}
      {[5, 4, 3, 2, 1].map((l, rowIdx) => (
        <Stack key={l} direction="row" spacing={0.5} sx={{ mb: 0.5 }} alignItems="center">
          {/* Y-axis label */}
          <Box sx={{ width: 28, flexShrink: 0, textAlign: 'right', pr: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600 }}>{l}</Typography>
          </Box>
          {[0, 1, 2, 3, 4].map(colIdx => {
            const count = HEATMAP[rowIdx][colIdx];
            const impact = colIdx + 1;
            const color = heatmapColor(l, impact);
            return (
              <Tooltip
                key={colIdx}
                title={`L${l} × I${impact}: ${count} risk${count !== 1 ? 's' : ''}`}
                placement="top"
                arrow
              >
                <Box
                  sx={{
                    flex: 1,
                    aspectRatio: '1',
                    bgcolor: `${color}2a`,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${color}70`,
                    cursor: 'default',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: `${color}45`, borderColor: color },
                    minHeight: 40,
                  }}
                >
                  {count > 0 && (
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color }}>
                      {count}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      ))}

      {/* Legend */}
      <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
        {[
          { label: 'Critical', color: '#C42B31' },
          { label: 'High',     color: '#E54E54' },
          { label: 'Medium',   color: '#C29A1D' },
          { label: 'Low',      color: '#2EB365' },
          { label: 'Very low', color: '#7ECDA0' },
        ].map(l => (
          <Stack key={l.label} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 10, height: 10, bgcolor: `${l.color}2a`, borderRadius: 0.5, border: `1px solid ${l.color}70` }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{l.label}</Typography>
          </Stack>
        ))}
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', ml: 'auto !important' }}>
          Y = Likelihood · X = Impact
        </Typography>
      </Stack>
    </Box>
  );
}

// ─── Editable text fields ─────────────────────────────────────────────────────

function EditableParagraph({
  value,
  onChange,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
}) {
  const [focused, setFocused] = useState(false);
  return focused ? (
    <TextField
      fullWidth
      multiline
      autoFocus
      variant="standard"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={() => setFocused(false)}
      sx={{
        '& .MuiInput-root': { fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.8, alignItems: 'flex-start' },
        '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.06)' },
        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: 'rgba(255,255,255,0.18)' },
        '& .MuiInput-underline:after': { borderBottomColor: accentColor },
      }}
    />
  ) : (
    <Typography
      variant="body2"
      color="text.secondary"
      onClick={() => setFocused(true)}
      sx={{
        lineHeight: 1.8,
        cursor: 'text',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        pb: 0.5,
        '&:hover': { borderBottomColor: 'rgba(255,255,255,0.18)' },
      }}
    >
      {value}
    </Typography>
  );
}

// ─── Editable list field ──────────────────────────────────────────────────────

function EditableList({
  value,
  onChange,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
}) {
  const [focused, setFocused] = useState(false);
  const lines = value.split('\n').filter(Boolean);

  return (
    <Box>
      {!focused ? (
        /* Read view — rendered bullet list, click to edit */
        <Box
          onClick={() => setFocused(true)}
          sx={{
            cursor: 'text',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            pb: 0.5,
            '&:hover': { borderBottomColor: 'rgba(255,255,255,0.18)' },
          }}
        >
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {lines.map((item, i) => (
              <Box component="li" key={i} sx={{ mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        /* Edit view — raw textarea, one item per line */
        <Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5, fontSize: '0.68rem' }}>
            One item per line · click away to preview
          </Typography>
          <TextField
            fullWidth
            multiline
            autoFocus
            variant="standard"
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={() => setFocused(false)}
            sx={{
              '& .MuiInput-root': { fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.85, alignItems: 'flex-start' },
              '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.06)' },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: 'rgba(255,255,255,0.18)' },
              '& .MuiInput-underline:after': { borderBottomColor: accentColor },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportingPage() {
  const [reportType, setReportType] = useState('executive_summary');
  const [timeRange, setTimeRange] = useState('last_quarter');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(true);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [pushingToBoards, setPushingToBoards] = useState(false);

  // Editable qualitative sections
  const [whatHappened, setWhatHappened] = useState(
    `In Q1 2026 the risk portfolio expanded from 47 to 50 active risks following an agent-led identification pass on Q1 board materials and external regulatory filings. Four risks were escalated to critical severity — driven primarily by deteriorating KRI signals in cyber and compliance. The FX hedge ratio decline (KRI-007, now 74%) and unpatched CVE accumulation (KRI-001, now 4 open critical CVEs) were the primary drivers of the portfolio residual score increase from 2.71 to 3.12.`,
  );
  const [rootCauses, setRootCauses] = useState(
    `Treasury capacity constraints prevented renewal of three FX hedging instruments as they matured in Q4 2025, leaving 26% of FX exposure unhedged.\nMFA remediation on cloud admin endpoints was delayed 6 weeks due to vendor scheduling conflict — directly contributing to CVE accumulation.\nDORA full enforcement from January 2026 surfaced 3 new compliance findings (>30-day open) not previously tracked in the register.\nDR test has not been conducted since Sep 2025 (214 days) — KRI-006 breach now at 214 vs 180-day tolerance.`,
  );
  const [decisions, setDecisions] = useState(
    `ASSESS CR-014 (Cloud Infrastructure) — Agent draft approved by J. Chen, Mar 8\nSUGGEST_CTRL FR-003 (FX Concentration) — 3 controls approved, 1 rejected, Mar 12\nIDENTIFY Batch Q1 upload — 14 risks extracted, 12 approved, 2 rejected as duplicates, Mar 15\nASSESS OP-007 (Business Continuity) — Deferred to Q2 cycle by risk manager, Mar 18\nACCEPT ST-004 (AI Vendor Concentration) — Risk accepted at current score pending vendor diversification assessment`,
  );
  const [recommendations, setRecommendations] = useState(
    `Complete MFA deployment on all cloud admin endpoints by Apr 30 — projected to move KRI-001 from RED to GREEN\nRenew FX hedging instruments — treasury to prioritise in April, target hedge ratio ≥85% to recover KRI-007\nClose DORA Art. 9 audit findings — assign dedicated compliance resource; target zero findings >30d by May 31\nSchedule and complete DR test before end of Q2 — KRI-006 at 214 days against 180-day tolerance\nInitiate Q2 identification survey for Operations and IT departments via agent-scheduled distribution\nReview AI vendor concentration ST-004 — engage secondary LLM provider as contingency before Q2 board meeting`,
  );

  function handlePushToBoards() {
    setPushingToBoards(true);
    setTimeout(() => {
      setPushingToBoards(false);
      setToast({ open: true, message: 'Report pushed to board portal successfully' });
    }, 1500);
  }

  useEffect(() => {
    if (isGenerating) {
      const timer = setTimeout(() => { setIsGenerating(false); setReportGenerated(true); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating]);

  return (
    <Box>
      {/* Page header */}
      <Stack sx={{ mb: 3 }}>
        <Typography variant="h1" component="h1">Reporting</Typography>
        <Typography variant="body2" color="text.secondary">AI-generated risk summaries and portfolio reports</Typography>
      </Stack>

      {/* Generator */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h2" component="h2">Generate report</Typography>
          <Chip size="small" label="Latest: Q1 2026 · Mar 19"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.7rem' }} />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Report type</InputLabel>
            <Select value={reportType} label="Report type" onChange={(e) => setReportType(e.target.value)}>
              <MenuItem value="executive_summary">Executive summary</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
              <MenuItem value="board_pack">Board pack</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Time range</InputLabel>
            <Select value={timeRange} label="Time range" onChange={(e) => setTimeRange(e.target.value)}>
              <MenuItem value="last_quarter">Last quarter</MenuItem>
              <MenuItem value="last_year">Last year</MenuItem>
              <MenuItem value="custom">Custom range</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<RegenerateIcon />} onClick={() => { setReportGenerated(false); setIsGenerating(true); }} disabled={isGenerating}>
            Regenerate
          </Button>
        </Stack>
        {isGenerating && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Generating report…</Typography>
            <LinearProgress />
          </Box>
        )}
      </Paper>

      {/* Generated Report */}
      {reportGenerated && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          {/* Report header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Q1 2026 — Enterprise Risk Report</Typography>
                <Chip size="small" label="Executive summary" variant="outlined" sx={{ height: 20, fontSize: '0.72rem' }} />
                <Chip size="small" label="Agent-generated" variant="outlined"
                  sx={{ height: 20, fontSize: '0.72rem' }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">Period: Oct 2025 – Mar 2026 · Generated: Mar 19, 2026</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="text"
                size="small"
                startIcon={<PdfIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => setToast({ open: true, message: 'Exporting PDF…' })}
                sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RegenerateIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => { setReportGenerated(false); setIsGenerating(true); }}
              >
                Regenerate
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={pushingToBoards
                  ? <CircularProgress size={12} sx={{ color: 'white' }} />
                  : <PushIcon sx={{ fontSize: '14px !important' }} />}
                onClick={handlePushToBoards}
                disabled={pushingToBoards}
              >
                {pushingToBoards ? 'Pushing…' : 'Push to boards'}
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* ── 1. Portfolio snapshot ────────────────────────────────────── */}
          <ReportSection title="Portfolio snapshot">
            <Grid container spacing={2} sx={{ mb: 0 }}>
              {[
                { label: 'Total active risks', value: '50', sub: '+3 vs Q4 2025',   color: '#e2e8f0' },
                { label: 'Critical',            value: '4',  sub: '+2 vs Q4 2025',  color: '#C42B31' },
                { label: 'High',                value: '14', sub: '+2 vs Q4 2025',  color: '#E54E54' },
                { label: 'Avg residual score',  value: '3.1', sub: '↑ 0.4 vs Q4',  color: '#C29A1D' },
                { label: 'Controls active',     value: '38', sub: '92% test-passed', color: '#2EB365' },
                { label: 'Open KRI breaches',   value: '4',  sub: '+3 RED this qtr', color: '#C42B31' },
              ].map(card => (
                <Grid key={card.label} size={{ xs: 6, sm: 4, md: 2 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: card.color, lineHeight: 1.1 }}>{card.value}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem' }}>{card.label}</Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: card.color, opacity: 0.8 }}>{card.sub}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </ReportSection>

          {/* ── 2. Heatmap + Category breakdown ─────────────────────────── */}
          <ReportSection title="Risk distribution">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  Inherent risk heatmap (50 risks)
                </Typography>
                <RiskHeatmap />
              </Grid>
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  Risks by category · count &amp; avg residual score
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.08)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} />
                    <ReTooltip
                      contentStyle={{ background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                      itemStyle={{ color: '#94a3b8' }}
                      cursor={{ fill: 'rgba(96,165,250,0.05)' }}
                    />
                    <Bar dataKey="count" name="Risk count" radius={[0, 4, 4, 0]}>
                      {CATEGORY_DATA.map((entry) => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category.toLowerCase()] ?? '#60a5fa'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Residual score bars */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 1, fontWeight: 600 }}>
                  Avg residual score by category
                </Typography>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.08)" horizontal={false} />
                    <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} />
                    <ReTooltip
                      contentStyle={{ background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                      itemStyle={{ color: '#94a3b8' }}
                      cursor={{ fill: 'rgba(96,165,250,0.05)' }}
                      formatter={(v: unknown) => [`${(v as number).toFixed(1)}`, 'Avg residual']}
                    />
                    <ReferenceLine x={2.5} stroke="rgba(194,154,29,0.45)" strokeDasharray="4 4" />
                    <Bar dataKey="avgResidual" name="Avg residual" radius={[0, 4, 4, 0]}>
                      {CATEGORY_DATA.map((entry) => (
                        <Cell key={entry.category} fill={getScoreColor(entry.avgResidual)} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </ReportSection>

          {/* ── 3. Top risks ─────────────────────────────────────────────── */}
          <ReportSection title="Top 10 risks by residual score">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 72 }}>ID</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="center">Inherent</TableCell>
                    <TableCell align="center">Residual</TableCell>
                    <TableCell align="center">QoQ Δ</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {TOP_RISKS.map((risk) => (
                    <TableRow key={risk.id} hover>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary' }}>{risk.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{risk.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={risk.category} variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#94a3b8' }}>{risk.inherent.toFixed(1)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: getScoreColor(risk.residual) }}>
                          {risk.residual.toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
                          {risk.delta > 0 && <TrendingUp sx={{ fontSize: 14, color: '#C42B31' }} />}
                          {risk.delta < 0 && <TrendingDown sx={{ fontSize: 14, color: '#2EB365' }} />}
                          {risk.delta === 0 && <TrendingFlat sx={{ fontSize: 14, color: '#94a3b8' }} />}
                          <Typography variant="caption" sx={{ fontWeight: 600, color: risk.delta > 0 ? '#C42B31' : risk.delta < 0 ? '#2EB365' : '#94a3b8', fontSize: '0.72rem' }}>
                            {risk.delta > 0 ? `+${risk.delta.toFixed(1)}` : risk.delta < 0 ? risk.delta.toFixed(1) : '—'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: 'rgba(0,96,199,0.3)' }}>
                            {risk.owner.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="caption">{risk.owner}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={risk.status}
                          sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize',
                            bgcolor: `${statusColor(risk.status)}22`,
                            color: statusColor(risk.status),
                            border: `1px solid ${statusColor(risk.status)}44` }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ReportSection>

          {/* ── 4. Portfolio trend ───────────────────────────────────────── */}
          <ReportSection title="Portfolio risk trend — Oct 2025 to Mar 2026">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  Avg inherent vs residual score
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={TREND_DATA} margin={{ top: 4, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[2, 5]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <ReTooltip
                      contentStyle={{ background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                      itemStyle={{ color: '#94a3b8' }}
                      formatter={(v: unknown, name: unknown) => [`${(v as number).toFixed(2)}`, name as string]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                    <ReferenceLine y={3.0} stroke="rgba(194,154,29,0.5)" strokeDasharray="4 4" label={{ value: 'Appetite', position: 'right', fontSize: 10, fill: '#C29A1D' }} />
                    <Line type="monotone" dataKey="avgInherent" name="Avg inherent" stroke="#C42B31" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="avgResidual" name="Avg residual" stroke="#0060C7" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  Critical &amp; high risk count
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={TREND_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.08)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <ReTooltip contentStyle={{ background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8, fontSize: 12, color: '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }} itemStyle={{ color: '#94a3b8' }} />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
                    <Bar dataKey="critical" name="Critical" stackId="a" fill="#C42B31" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high" name="High" stackId="a" fill="#C29A1D" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </ReportSection>

          {/* ── 5. KRI evolution ─────────────────────────────────────────── */}
          <ReportSection title="KRI evolution">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>KRI</TableCell>
                    <TableCell align="center">Start (Oct 2025)</TableCell>
                    <TableCell align="center">End (Mar 2026)</TableCell>
                    <TableCell align="center">Trend</TableCell>
                    <TableCell align="center">Status change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {KRI_ROWS.map((row) => (
                    <TableRow key={row.kri} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{row.kri}</Typography></TableCell>
                      <TableCell align="center"><Typography variant="body2" color="text.secondary">{row.start}</Typography></TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: scoreColor(row.toScore) }}>{row.end}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        {row.trend === 'up'
                          ? <TrendingUp sx={{ fontSize: 16, color: '#C42B31' }} />
                          : <TrendingDown sx={{ fontSize: 16, color: '#2EB365' }} />}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                          <Chip size="small" label={`${row.fromScore}/5`} sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${scoreColor(row.fromScore)}22`, color: scoreColor(row.fromScore), border: `1px solid ${scoreColor(row.fromScore)}44` }} />
                          <Typography variant="caption" color="text.disabled">→</Typography>
                          <Chip size="small" label={`${row.toScore}/5`} sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${scoreColor(row.toScore)}22`, color: scoreColor(row.toScore), border: `1px solid ${scoreColor(row.toScore)}44` }} />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ReportSection>

          {/* ── 6. What happened ─────────────────────────────────────────── */}
          <ReportSection title="What happened">
            <EditableParagraph value={whatHappened} onChange={setWhatHappened} accentColor="#60a5fa" />
          </ReportSection>

          {/* ── 7. Why it happened ───────────────────────────────────────── */}
          <ReportSection title="Root cause analysis">
            <EditableList value={rootCauses} onChange={setRootCauses} accentColor="#60a5fa" />
          </ReportSection>

          {/* ── 8. Decisions taken ───────────────────────────────────────── */}
          <ReportSection title="Decisions taken this quarter">
            <EditableList value={decisions} onChange={setDecisions} accentColor="#60a5fa" />
          </ReportSection>

          {/* ── 9. Recommendations ───────────────────────────────────────── */}
          <ReportSection title="Recommendations for Q2 2026">
            <EditableList value={recommendations} onChange={setRecommendations} accentColor="#60a5fa" />
          </ReportSection>
        </Paper>
      )}

      {/* Report History */}
      <Box>
        <Typography variant="h2" component="h2" sx={{ mb: 2 }}>Report history</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Generated by</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {HISTORY_ROWS.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.period}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.generatedBy}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{row.date}</Typography></TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => setToast({ open: true, message: 'Report loading…' })}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ open: false, message: '' })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({ open: false, message: '' })} severity="info" sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
