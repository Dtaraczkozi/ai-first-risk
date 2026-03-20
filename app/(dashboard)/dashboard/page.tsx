'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Button,
  Chip,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome as AgentIcon,
  ArrowForward as ArrowForwardIcon,
  Description as ReportIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Assignment as AssessmentIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckIcon,
  FiberManualRecord as DotIcon,
  KeyboardArrowRight as ChevronIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell,
  Tooltip as ReTooltip, CartesianGrid,
} from 'recharts';
import { getApprovedRisks, getDraftRisks } from '@/lib/risk-store';
import { getKRIs } from '@/lib/kri-store';
import { getScoreColor, getScoreLabel, RISK_CATEGORY_COLORS, RISK_CATEGORY_LABELS, getRiskDisplayId } from '@/lib/utils';
import type { RiskSuggestion } from '@/types/document';
import type { KeyRiskIndicator } from '@/types/kri';

// ─── Constants ─────────────────────────────────────────────────────────────────

// Task type chips use neutral styling — label alone carries the distinction
const TASK_TYPE_LABELS: Record<string, string> = {
  ASSESS:       'Assess',
  IDENTIFY:     'Identify',
  SUGGEST_CTRL: 'Suggest control',
  MONITOR:      'Monitor',
  REPORT:       'Report',
};

const PENDING_TASKS = [
  { type: 'ASSESS',       title: 'CR-014 Cloud Infrastructure Exposure',  time: '2h ago',  href: '/assessments' },
  { type: 'IDENTIFY',     title: 'Batch upload — 14 risks extracted',      time: '1d ago',  href: '/'            },
  { type: 'SUGGEST_CTRL', title: 'FR-003 FX Concentration Risk',           time: '5h ago',  href: '/treatment'   },
  { type: 'ASSESS',       title: 'OP-007 Business Continuity Gaps',        time: '8h ago',  href: '/assessments' },
  { type: 'REPORT',       title: 'Q1 executive summary draft',             time: '2d ago',  href: '/reporting'   },
];

const ACTIVITY_LOG = [
  { type: 'ASSESS',       desc: 'Assessment drafted for CR-011 Ransomware Risk',   outcome: 'Approved', time: '3h ago' },
  { type: 'MONITOR',      desc: 'KRI-001 threshold breach detected — flagged',      outcome: 'Auto',     time: '6h ago' },
  { type: 'SUGGEST_CTRL', desc: '3 controls proposed for OP-003 Supply Chain',      outcome: 'Approved', time: '1d ago' },
  { type: 'IDENTIFY',     desc: 'Risk extraction from Q1 Board Report',             outcome: 'Approved', time: '1d ago' },
  { type: 'ASSESS',       desc: 'Assessment drafted for FN-002 Liquidity Risk',     outcome: 'Rejected', time: '2d ago' },
  { type: 'MONITOR',      desc: 'KRI-007 FX Hedge Ratio breach detected',          outcome: 'Auto',     time: '2d ago' },
];

// Outcome chips: approved/rejected use semantic color; auto is neutral
const OUTCOME_COLORS: Record<string, string> = {
  Approved: '#4ade80',
  Rejected: '#f87171',
  Auto:     '#94a3b8',
};

// ─── Pre-built AI responses ───────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'What are the top risks right now?',
  'Summarise KRI status',
  'What needs my attention today?',
  'Which risks are overdue for assessment?',
  'Show me the biggest residual score changes',
];

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

function buildAgentResponse(
  query: string,
  risks: RiskSuggestion[],
  kris: KeyRiskIndicator[],
): string {
  const q = query.toLowerCase();
  const highSev = risks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4);
  const unassessed = risks.filter(r => r.assessmentStatus === 'unassessed');
  const redKRIs = kris.filter(k => k.status === 'red');
  const amberKRIs = kris.filter(k => k.status === 'amber');

  if (q.includes('top risk') || q.includes('biggest risk') || q.includes('critical')) {
    const top3 = highSev.slice(0, 3);
    if (top3.length === 0) return 'No high-severity risks in the current register. The portfolio is within acceptable boundaries.';
    const list = top3.map((r, i) => `${i + 1}. **${r.title}** (${r.category}, score ${Math.round((r.likelihood + r.impact) / 2)}/5)`).join('\n');
    return `The top ${top3.length} risks by severity are:\n${list}\n\nAll have inherent scores of 4 or above and are flagged for priority assessment. Recommend reviewing the Assessment queue.`;
  }

  if (q.includes('kri') || q.includes('indicator')) {
    if (kris.length === 0) return 'No KRI data loaded yet. Navigate to the KRIs page to set up indicators.';
    return `Portfolio KRI status: **${redKRIs.length} RED** (threshold breached), **${amberKRIs.length} AMBER** (approaching limit), ${kris.filter(k => k.status === 'green').length} GREEN.\n\nMost urgent: ${redKRIs[0]?.name ?? 'none'} — currently at ${redKRIs[0]?.currentValue}${redKRIs[0]?.threshold.unit ?? ''}. Recommend reviewing full KRI dashboard.`;
  }

  if (q.includes('attention') || q.includes('today') || q.includes('pending') || q.includes('action')) {
    return `You have **${PENDING_TASKS.length} pending approvals** in the agent queue:\n- ${PENDING_TASKS[0].title} (${PENDING_TASKS[0].type})\n- ${PENDING_TASKS[1].title} (${PENDING_TASKS[1].type})\n+ ${PENDING_TASKS.length - 2} more items awaiting sign-off.\n\nAlso: ${unassessed.length} risks remain unassessed — ${highSev.filter(r => r.assessmentStatus === 'unassessed').length} of which are high severity.`;
  }

  if (q.includes('overdue') || q.includes('assessment')) {
    const overdue = risks.filter(r => {
      const days = Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return r.assessmentStatus !== 'assessed' && days > 14;
    });
    if (overdue.length === 0) return 'No risks are currently overdue for assessment. All active cycles are within the 14-day SLA.';
    const names = overdue.slice(0, 3).map(r => `**${r.title}**`).join(', ');
    return `${overdue.length} risk${overdue.length > 1 ? 's are' : ' is'} overdue for assessment (>14 days without progress): ${names}${overdue.length > 3 ? ` and ${overdue.length - 3} more` : ''}. Navigate to the Assessments page to start or continue.`;
  }

  if (q.includes('residual') || q.includes('score') || q.includes('change')) {
    return 'Average residual score across the portfolio has increased to **3.1** (+0.4 vs Q4 2025). The largest movements are in Cyber (+0.5) and Compliance (+0.3), primarily driven by CVE accumulation and DORA enforcement findings. Financial risks have stabilised.';
  }

  if (q.includes('report') || q.includes('summary')) {
    return 'Q1 2026 Executive Summary is ready. Key findings: 50 active risks, 4 critical, 14 high. Average residual score 3.1, above the 3.0 risk appetite threshold. 4 KRI breaches active. Recommend immediate focus on cyber remediation and FX hedging renewal. Navigate to Reporting for the full document.';
  }

  return `Analysing your risk portfolio… I found ${risks.length} active risks, ${highSev.length} high-severity, and ${unassessed.length} unassessed. ${redKRIs.length} KRIs are currently in RED status. Is there a specific area you'd like me to elaborate on?`;
}

// ─── AI Chat component ────────────────────────────────────────────────────────

function AIChat({ risks, kris }: { risks: RiskSuggestion[]; kris: KeyRiskIndicator[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function send(text: string) {
    if (!text.trim() || thinking) return;
    const userMsg: ChatMessage = { role: 'user', text: text.trim(), timestamp: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const reply = buildAgentResponse(text, risks, kris);
      setMessages(prev => [...prev, { role: 'agent', text: reply, timestamp: getTime() }]);
      setThinking(false);
    }, delay);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function renderText(text: string) {
    // Simple bold markdown support
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <Typography key={i} variant="body2" sx={{ lineHeight: 1.7, fontSize: '0.85rem' }}>
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <Box component="span" key={j} sx={{ fontWeight: 700, color: 'text.primary' }}>{part.slice(2, -2)}</Box>
              : part
          )}
        </Typography>
      );
    });
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderColor: 'rgba(96,165,250,0.25)',
        boxShadow: '0 0 0 1px rgba(96,165,250,0.08), 0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)', bgcolor: 'rgba(96,165,250,0.04)' }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: 1,
          background: 'linear-gradient(135deg,#5C6BC0,#9C27B0,#E91E63)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <AgentIcon sx={{ fontSize: 15, color: 'white' }} />
        </Box>
        <Typography variant="h3" component="h2" sx={{ fontWeight: 700 }}>Risk Agent</Typography>
        <Chip size="small" label="Online" icon={<DotIcon sx={{ fontSize: '8px !important', color: '#4ade80 !important' }} />}
          sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', '& .MuiChip-icon': { ml: 0.75 } }} />
        <Box sx={{ flex: 1 }} />
        <Button component={Link} href="/reporting" size="small" variant="text"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 12 }} />}
          sx={{ fontSize: '0.72rem', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
          Full reports
        </Button>
      </Stack>

      {/* Message area */}
      {messages.length > 0 && (
        <Box sx={{ px: 2, py: 1.5, maxHeight: 340, overflowY: 'auto', bgcolor: 'rgba(0,0,0,0.15)' }}>
          <Stack spacing={1.5}>
            {messages.map((msg, i) => (
              <Stack key={i} direction={msg.role === 'user' ? 'row-reverse' : 'row'} spacing={1} alignItems="flex-start">
                {msg.role === 'agent' && (
                  <Box sx={{ width: 22, height: 22, borderRadius: 0.75, background: 'linear-gradient(135deg,#5C6BC0,#9C27B0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                    <AgentIcon sx={{ fontSize: 12, color: 'white' }} />
                  </Box>
                )}
                <Box sx={{
                  maxWidth: '82%',
                  px: 1.5, py: 1,
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  bgcolor: msg.role === 'user' ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  {msg.role === 'agent' ? renderText(msg.text) : (
                    <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: '0.85rem', color: '#93c5fd' }}>{msg.text}</Typography>
                  )}
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25, fontSize: '0.62rem', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp}
                  </Typography>
                </Box>
              </Stack>
            ))}
            {thinking && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 22, height: 22, borderRadius: 0.75, background: 'linear-gradient(135deg,#5C6BC0,#9C27B0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AgentIcon sx={{ fontSize: 12, color: 'white' }} />
                </Box>
                <Box sx={{ px: 1.5, py: 0.75, borderRadius: '12px 12px 12px 4px', bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {[0, 1, 2].map(d => (
                      <Box key={d} sx={{
                        width: 5, height: 5, borderRadius: '50%', bgcolor: '#94a3b8',
                        animation: 'pulse 1.2s ease-in-out infinite',
                        animationDelay: `${d * 0.2}s`,
                        '@keyframes pulse': { '0%, 100%': { opacity: 0.3 }, '50%': { opacity: 1 } },
                      }} />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            )}
            <div ref={bottomRef} />
          </Stack>
        </Box>
      )}

      {/* Suggested prompts (only when empty) */}
      {messages.length === 0 && (
        <Box sx={{ px: 2, py: 1.25, bgcolor: 'rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1, fontSize: '0.68rem' }}>
            Try asking:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {SUGGESTED_PROMPTS.map((p) => (
              <Chip
                key={p}
                size="small"
                label={p}
                onClick={() => send(p)}
                sx={{
                  height: 22, fontSize: '0.7rem', cursor: 'pointer',
                  bgcolor: 'rgba(96,165,250,0.07)',
                  border: '1px solid rgba(96,165,250,0.15)',
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(96,165,250,0.12)', color: 'text.primary' },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Input row */}
      <Box sx={{ px: 2, py: 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Ask about risks, KRIs, assessments, trends…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            disabled={thinking}
            sx={{
              '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: 2 },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
            }}
          />
          <IconButton
            size="small"
            onClick={() => send(input)}
            disabled={!input.trim() || thinking}
            sx={{
              width: 34, height: 34, borderRadius: 1.5,
              background: input.trim() && !thinking ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.06)',
              color: input.trim() && !thinking ? 'white' : 'text.disabled',
              flexShrink: 0,
              transition: 'all 0.2s',
              '&:hover': { opacity: 0.85 },
            }}
          >
            <SendIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Stack>
      </Box>
    </Paper>
  );
}

// ─── Quick stats ──────────────────────────────────────────────────────────────

function QuickStats({ approvedRisks, draftRisks, kris }: { approvedRisks: RiskSuggestion[]; draftRisks: RiskSuggestion[]; kris: KeyRiskIndicator[] }) {
  const totalApproved  = approvedRisks.length;
  const highSeverity   = approvedRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length;
  const unassessed     = approvedRisks.filter(r => r.assessmentStatus === 'unassessed').length;
  const kriBreaches    = kris.filter(k => k.status === 'red').length;

  const stats = [
    { label: 'Total risks',     value: totalApproved,         subtitle: 'In register',         severity: null,                      href: '/risks',       Icon: ShieldIcon },
    { label: 'High severity',   value: highSeverity,          subtitle: 'Score 4–5',            severity: highSeverity > 0 ? 'high' as const : null, href: '/risks', Icon: WarningIcon },
    { label: 'Unassessed',      value: unassessed,            subtitle: 'Need assessment',      severity: unassessed > 0 ? 'med' as const : null,   href: '/assessments', Icon: AssessmentIcon },
    { label: 'KRI breaches',    value: kriBreaches,           subtitle: 'Threshold breached',   severity: kriBreaches > 0 ? 'high' as const : null, href: '/kris', Icon: TrendingUpIcon },
    { label: 'Pending review',  value: draftRisks.length,     subtitle: 'Draft risks',          severity: null,                      href: '/',            Icon: CheckIcon },
    { label: 'Agent actions',   value: PENDING_TASKS.length,  subtitle: 'Awaiting approval',    severity: null,                      href: '/assessments', Icon: AgentIcon },
  ];

  const severityColor = (s: 'high' | 'med' | null) =>
    s === 'high' ? '#f87171' : s === 'med' ? '#fbbf24' : '#60a5fa';

  return (
    <Grid container spacing={1.5}>
      {stats.map((stat) => {
        const color = severityColor(stat.severity);
        return (
          <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 2 }}>
            <Paper
              component={Link}
              href={stat.href}
              variant="outlined"
              sx={{ p: 1.5, height: '100%', display: 'block', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s', '&:hover': { bgcolor: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.15)' } }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                <stat.Icon sx={{ fontSize: 13, color: 'text.disabled', opacity: 0.8 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{stat.label}</Typography>
              </Stack>
              <Typography sx={{ fontSize: '32px', fontWeight: 700, color, lineHeight: 1 }}>{stat.value}</Typography>
              <Typography variant="caption" color="text.disabled">{stat.subtitle}</Typography>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

// ─── KRI strip ────────────────────────────────────────────────────────────────

function KRIStatusStrip({ kris }: { kris: KeyRiskIndicator[] }) {
  const sorted = [...kris].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    return order[a.status] - order[b.status];
  });

  const statusColor: Record<string, string> = {
    red:   '#f87171',
    amber: '#fbbf24',
    green: '#4ade80',
  };

  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.25 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', flexShrink: 0, fontSize: '0.65rem' }}>
          KRIs
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ flex: 1 }}>
          {sorted.map((kri) => {
            const color = statusColor[kri.status];
            const name = kri.name.length > 24 ? kri.name.slice(0, 24) + '…' : kri.name;
            return (
              <Tooltip key={kri.id} title={kri.agentNote ?? kri.description} arrow>
                <Chip
                  size="small"
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center" component="span">
                      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, display: 'inline-block', flexShrink: 0 }} />
                      <span>{name} — {kri.currentValue}{kri.threshold.unit}</span>
                    </Stack>
                  }
                  sx={{
                    height: 24,
                    bgcolor: `${color}1a`,
                    border: `1px solid ${color}55`,
                    '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                  }}
                />
              </Tooltip>
            );
          })}
        </Stack>
        <Button
          component={Link}
          href="/kris"
          size="small"
          variant="text"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap', fontSize: '0.72rem', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          View all
        </Button>
      </Stack>
    </Paper>
  );
}

// ─── Agent queue panel ────────────────────────────────────────────────────────

function AgentQueuePanel({ onApprove }: { onApprove: () => void }) {
  return (
    <Paper variant="outlined">
      <Grid container>
        {/* Pending approvals */}
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{ p: 2.5, borderRight: { md: '1px solid' }, borderColor: { md: 'divider' }, borderBottom: { xs: '1px solid', md: 'none' }, borderBottomColor: { xs: 'divider' } }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h3" component="h3">Pending approvals</Typography>
            <Chip size="small" label={PENDING_TASKS.length}
              variant="outlined"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
          </Stack>
          <Stack spacing={1}>
            {PENDING_TASKS.map((task, idx) => {
              return (
                <Stack key={idx} direction="row" spacing={1} alignItems="center"
                  sx={{ py: 0.75, px: 1, borderRadius: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                  <Chip size="small" label={TASK_TYPE_LABELS[task.type] ?? task.type}
                    variant="outlined"
                    sx={{ height: 18, fontWeight: 600, fontSize: '0.6rem', flexShrink: 0, '& .MuiChip-label': { px: 0.75 } }} />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    {task.title}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, fontSize: '0.7rem' }}>{task.time}</Typography>
                  <Button size="small" variant="outlined" onClick={onApprove}
                    sx={{ flexShrink: 0, fontSize: '0.68rem', py: 0.2, px: 0.875, minWidth: 'auto' }}>
                    Approve
                  </Button>
                  <IconButton component={Link} href={task.href} size="small" sx={{ flexShrink: 0, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                    <OpenInNewIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
          <Button component={Link} href="/assessments" size="small" variant="text"
            endIcon={<ChevronIcon sx={{ fontSize: 14 }} />}
            sx={{ mt: 1.5, fontSize: '0.72rem', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            View all pending
          </Button>
        </Grid>

        {/* Recent agent activity */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ p: 2.5 }}>
          <Typography variant="h3" component="h3" sx={{ mb: 2 }}>Recent agent activity</Typography>
          <Stack spacing={1}>
            {ACTIVITY_LOG.map((item, idx) => {
              const oc = OUTCOME_COLORS[item.outcome];
              return (
                <Stack key={idx} direction="row" spacing={0.75} alignItems="flex-start"
                  sx={{ py: 0.5, borderBottom: idx < ACTIVITY_LOG.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <Chip size="small" label={TASK_TYPE_LABELS[item.type] ?? item.type}
                    variant="outlined"
                    sx={{ height: 16, fontSize: '0.58rem', flexShrink: 0, mt: 0.2, '& .MuiChip-label': { px: 0.6 } }} />
                  <Typography variant="caption" sx={{ flex: 1, lineHeight: 1.45, fontSize: '0.78rem' }}>{item.desc}</Typography>
                  <Chip size="small" label={item.outcome} variant="outlined"
                    sx={{ height: 16, fontSize: '0.58rem', color: oc, borderColor: oc, flexShrink: 0, '& .MuiChip-label': { px: 0.6 } }} />
                  <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, fontSize: '0.62rem', mt: 0.1 }}>{item.time}</Typography>
                </Stack>
              );
            })}
          </Stack>
          <Button component={Link} href="/reporting" size="small" variant="text"
            endIcon={<ChevronIcon sx={{ fontSize: 14 }} />}
            sx={{ mt: 1.5, fontSize: '0.72rem', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            View full history
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}

// ─── Top priority risks ───────────────────────────────────────────────────────

function TopPriorityRisks({ risks }: { risks: RiskSuggestion[] }) {
  const priority = useMemo(() => {
    return [...risks]
      .map(r => {
        const score = (r.likelihood + r.impact) / 2;
        const urgency =
          (r.assessmentStatus === 'unassessed' && score >= 4) ? 4 :
          (score >= 4) ? 3 :
          (r.assessmentStatus === 'unassessed' && score >= 3) ? 2 :
          (score >= 3) ? 1 : 0;
        return { ...r, score, urgency };
      })
      .sort((a, b) => b.urgency - a.urgency || b.score - a.score)
      .slice(0, 6);
  }, [risks]);

  if (priority.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <Typography variant="h3" component="h3" sx={{ flex: 1 }}>Priority risks</Typography>
        <Chip size="small" label={`${risks.filter(r => (r.likelihood + r.impact) / 2 >= 4).length} critical`}
          sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }} />
        <Button component={Link} href="/risks" size="small" variant="text"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 11 }} />}
          sx={{ fontSize: '0.7rem', color: 'text.secondary', '&:hover': { color: 'text.primary' }, minWidth: 'auto' }}>
          All risks
        </Button>
      </Stack>

      <Stack sx={{ flex: 1 }}>
        {priority.map((risk, idx) => {
          const color = getScoreColor(risk.score);
          const isUnassessed = risk.assessmentStatus === 'unassessed';
          const isInProgress = risk.assessmentStatus === 'in_progress';
          const displayId = getRiskDisplayId(risk.id, risks);
          return (
            <Stack
              key={risk.id}
              direction="row"
              spacing={1.25}
              alignItems="center"
              component={Link}
              href={`/risks/${risk.id}`}
              sx={{
                px: 2, py: 1,
                textDecoration: 'none',
                borderLeft: `2px solid ${color}`,
                borderBottom: idx < priority.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'background 0.12s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' },
              }}
            >
              {/* Score bubble */}
              <Box sx={{
                width: 30, height: 30, borderRadius: 1, flexShrink: 0,
                bgcolor: `${color}18`, border: `1px solid ${color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color, fontSize: '0.78rem', lineHeight: 1 }}>
                  {risk.score.toFixed(1)}
                </Typography>
              </Box>

              {/* ID + title */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, flexShrink: 0, fontSize: '0.68rem' }}>
                    {displayId}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {risk.title}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.2 }}>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                    {RISK_CATEGORY_LABELS[risk.category] ?? risk.category}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>·</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color }}>
                    {getScoreLabel(risk.score)}
                  </Typography>
                </Stack>
              </Box>

              {/* Status chip */}
              {isUnassessed && (
                <Chip size="small" label="Unassessed" sx={{
                  height: 18, fontSize: '0.62rem', flexShrink: 0,
                  bgcolor: 'rgba(251,191,36,0.08)', color: '#fbbf24',
                  border: '1px solid rgba(251,191,36,0.2)',
                }} />
              )}
              {isInProgress && (
                <Chip size="small" label="In progress" sx={{
                  height: 18, fontSize: '0.62rem', flexShrink: 0,
                  bgcolor: 'rgba(96,165,250,0.08)', color: '#60a5fa',
                  border: '1px solid rgba(96,165,250,0.2)',
                }} />
              )}

              <ChevronIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

// ─── Risk landscape charts ─────────────────────────────────────────────────────

function RiskLandscapeCharts({ risks }: { risks: RiskSuggestion[] }) {
  const scoreDistribution = useMemo(() => [
    { name: 'Critical', count: risks.filter(r => (r.likelihood + r.impact) / 2 >= 4).length,                                                             color: '#f87171' },
    { name: 'High',     count: risks.filter(r => { const s = (r.likelihood + r.impact) / 2; return s >= 3 && s < 4; }).length,                           color: '#fbbf24' },
    { name: 'Medium',   count: risks.filter(r => { const s = (r.likelihood + r.impact) / 2; return s >= 2 && s < 3; }).length,                           color: '#34d399' },
    { name: 'Low',      count: risks.filter(r => (r.likelihood + r.impact) / 2 < 2).length,                                                              color: '#94a3b8' },
  ].filter(d => d.count > 0), [risks]);

  const categoryExposure = useMemo(() => {
    const cats = ['cyber', 'compliance', 'financial', 'operational', 'strategic'];
    return cats.map(cat => {
      const cr = risks.filter(r => r.category === cat);
      const avg = cr.length > 0 ? cr.reduce((s, r) => s + (r.likelihood + r.impact) / 2, 0) / cr.length : 0;
      return {
        name: (RISK_CATEGORY_LABELS[cat] ?? cat).slice(0, 9),
        count: cr.length,
        avg: parseFloat(avg.toFixed(1)),
        color: RISK_CATEGORY_COLORS[cat] ?? '#60a5fa',
      };
    }).filter(d => d.count > 0).sort((a, b) => b.avg - a.avg);
  }, [risks]);

  const TOOLTIP_STYLE = {
    background: 'rgba(10,14,26,0.97)',
    border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: 8, fontSize: 12, color: '#e2e8f0',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  };

  return (
    <Stack spacing={1.5} sx={{ height: '100%' }}>
      {/* Severity distribution */}
      <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.5 }}>
          Severity distribution
        </Typography>
        <Box sx={{ height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistribution} layout="vertical" barCategoryGap="22%"
              margin={{ top: 0, right: 28, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={54} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <ReTooltip cursor={{ fill: 'rgba(96,165,250,0.05)' }} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#94a3b8' }}
                formatter={(v: unknown) => [`${v} risks`, '']} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {scoreDistribution.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Category exposure */}
      <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.5 }}>
          Category exposure — avg score
        </Typography>
        <Box sx={{ height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryExposure} layout="vertical" barCategoryGap="22%"
              margin={{ top: 0, right: 28, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={54} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <ReTooltip cursor={{ fill: 'rgba(96,165,250,0.05)' }} contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#94a3b8' }}
                formatter={(v: unknown, _: unknown, props: { payload?: { count?: number } }) => [`${v}/5 avg (${props.payload?.count ?? 0} risks)`, '']} />
              <Bar dataKey="avg" radius={[0, 3, 3, 0]}>
                {categoryExposure.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Stack>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [approvedRisks, setApprovedRisks] = useState<RiskSuggestion[]>([]);
  const [draftRisks, setDraftRisks]       = useState<RiskSuggestion[]>([]);
  const [kris, setKRIs]                   = useState<KeyRiskIndicator[]>([]);
  const [approveSnackbar, setApproveSnackbar] = useState(false);

  useEffect(() => {
    setApprovedRisks(getApprovedRisks());
    setDraftRisks(getDraftRisks());
    setKRIs(getKRIs());
  }, []);

  const highSev    = approvedRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4);
  const redKRIs    = kris.filter(k => k.status === 'red');
  const unassessed = approvedRisks.filter(r => r.assessmentStatus === 'unassessed');

  function buildSummary(): string {
    if (approvedRisks.length === 0) return 'No risks in the register yet — start by running the identification agent.';

    const parts: string[] = [];
    if (highSev.length > 0)    parts.push(`${highSev.length} high-severity risk${highSev.length > 1 ? 's' : ''} active`);
    if (redKRIs.length > 0)    parts.push(`${redKRIs.length} KRI${redKRIs.length > 1 ? 's' : ''} in RED`);
    if (unassessed.length > 0) parts.push(`${unassessed.length} unassessed`);
    if (PENDING_TASKS.length > 0) parts.push(`${PENDING_TASKS.length} pending approvals`);

    if (parts.length === 0) return 'Risk portfolio is healthy — all indicators within tolerance.';
    return parts.join(' · ') + '.';
  }

  const summaryUrgent = highSev.length > 0 || redKRIs.length > 0;

  return (
    <Box>
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
        <Typography variant="h1" component="h1">Dashboard</Typography>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/reporting" variant="text" size="small">
            Reports
          </Button>
          <Button component={Link} href="/reporting" variant="contained" size="small">
            New report
          </Button>
        </Stack>
      </Stack>

      {/* ── AI chat ── */}
      <Box
        sx={{
          mb: 6,
          p: 2,
          borderRadius: 2,
          background: 'linear-gradient(180deg, rgba(96,165,250,0.07) 0%, transparent 100%)',
          border: '1px solid rgba(96,165,250,0.18)',
        }}
      >
        <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>Ask the agent</Typography>
        <AIChat risks={approvedRisks} kris={kris} />
      </Box>

      {/* ── AI summary banner ── */}
      <Paper
        variant="outlined"
        sx={{
          mb: 6,
          px: 2.5, py: 1.5,
          borderLeft: `3px solid ${summaryUrgent ? '#f87171' : '#4ade80'}`,
          bgcolor: summaryUrgent ? 'rgba(248,113,113,0.04)' : 'rgba(74,222,128,0.03)',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{
            width: 28, height: 28, borderRadius: 1,
            background: 'linear-gradient(135deg,#5C6BC0,#9C27B0,#E91E63)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AgentIcon sx={{ fontSize: 14, color: 'white' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.5 }}>
              {buildSummary()}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Risk Agent · Last updated: just now
            </Typography>
          </Box>
          {summaryUrgent && (
            <Chip size="small" label="Attention required"
              sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', flexShrink: 0 }} />
          )}
        </Stack>
      </Paper>

      {/* ── Stats ── */}
      <Box sx={{ mb: 6 }}>
        <QuickStats approvedRisks={approvedRisks} draftRisks={draftRisks} kris={kris} />
      </Box>

      {/* ── Priority risks + landscape charts ── */}
      {approvedRisks.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <TopPriorityRisks risks={approvedRisks} />
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <RiskLandscapeCharts risks={approvedRisks} />
          </Grid>
        </Grid>
      )}

      {/* ── KRI strip ── */}
      {kris.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <KRIStatusStrip kris={kris} />
        </Box>
      )}

      {/* ── Agent queue ── */}
      <Box sx={{ mb: 6 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h2" component="h2">Agent queue</Typography>
          <Chip size="small" label={`${PENDING_TASKS.length} pending`}
            variant="outlined"
            sx={{ height: 18, fontSize: '0.65rem' }} />
        </Stack>
        <AgentQueuePanel onApprove={() => setApproveSnackbar(true)} />
      </Box>

      <Snackbar open={approveSnackbar} autoHideDuration={3000} onClose={() => setApproveSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setApproveSnackbar(false)} severity="success" variant="filled" sx={{ width: '100%' }}>Approved</Alert>
      </Snackbar>
    </Box>
  );
}
