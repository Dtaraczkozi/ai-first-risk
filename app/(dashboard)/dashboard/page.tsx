'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  AutoAwesome as AgentIcon,
  ArrowForward as ArrowForwardIcon,
  Description as ReportIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { getApprovedRisks, getDraftRisks } from '@/lib/risk-store';
import { getKRIs } from '@/lib/kri-store';
import type { RiskSuggestion } from '@/types/document';
import type { KeyRiskIndicator } from '@/types/kri';

const TASK_TYPE_COLORS: Record<string, string> = {
  ASSESS: '#3b82f6',
  IDENTIFY: '#9530DC',
  SUGGEST_CTRL: '#009999',
  MONITOR: '#C29A1D',
  REPORT: '#0060C7',
};

const PENDING_TASKS = [
  { type: 'ASSESS',       title: 'CR-014 Cloud Infrastructure Exposure',  time: '2h ago',  href: '/assessments' },
  { type: 'IDENTIFY',     title: 'Batch upload — 14 risks extracted',      time: '1d ago',  href: '/' },
  { type: 'SUGGEST_CTRL', title: 'FR-003 FX Concentration Risk',           time: '5h ago',  href: '/treatment' },
  { type: 'ASSESS',       title: 'OP-007 Business Continuity Gaps',        time: '8h ago',  href: '/assessments' },
  { type: 'REPORT',       title: 'Q1 executive summary draft',             time: '2d ago',  href: '/reporting' },
];

const ACTIVITY_LOG = [
  { type: 'ASSESS',       desc: 'Assessment drafted for CR-011 Ransomware Risk',        outcome: 'Approved', time: '3h ago' },
  { type: 'MONITOR',      desc: 'KRI-001 threshold breach detected — flagged',           outcome: 'Auto',     time: '6h ago' },
  { type: 'SUGGEST_CTRL', desc: '3 controls proposed for OP-003 Supply Chain',           outcome: 'Approved', time: '1d ago' },
  { type: 'IDENTIFY',     desc: 'Risk extraction from Q1 Board Report',                  outcome: 'Approved', time: '1d ago' },
  { type: 'ASSESS',       desc: 'Assessment drafted for FN-002 Liquidity Risk',          outcome: 'Rejected', time: '2d ago' },
  { type: 'MONITOR',      desc: 'KRI-007 FX Hedge Ratio breach detected',               outcome: 'Auto',     time: '2d ago' },
  { type: 'REPORT',       desc: 'Q4 2025 board pack generated',                          outcome: 'Approved', time: '5d ago' },
  { type: 'SUGGEST_CTRL', desc: 'Controls proposed for CY-005 Phishing',                outcome: 'Approved', time: '6d ago' },
];

const OUTCOME_COLORS: Record<string, string> = {
  Approved: '#2EB365',
  Rejected: '#C42B31',
  Auto:     '#94a3b8',
};

function QuickStats({ approvedRisks, draftRisks }: { approvedRisks: RiskSuggestion[]; draftRisks: RiskSuggestion[] }) {
  const totalApproved = approvedRisks.length;
  const totalDrafts = draftRisks.length;
  const highSeverity = approvedRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length;
  const needsAssessment = Math.floor(totalApproved * 0.4);

  const stats = [
    { label: 'Total risks',     value: totalApproved,   subtitle: 'In register',          color: '#0060C7' },
    { label: 'Pending review',  value: totalDrafts,     subtitle: 'Draft risks',           color: '#9530DC' },
    { label: 'Needs attention', value: needsAssessment, subtitle: 'Awaiting assessment',   color: '#E54E54' },
    { label: 'High severity',   value: highSeverity,    subtitle: 'Score 4+',              color: '#C29A1D' },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat) => (
        <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, height: '100%' }} variant="outlined">
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ width: 4, height: 40, borderRadius: 1, bgcolor: stat.color }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.subtitle}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function KRIStatusStrip({ kris }: { kris: KeyRiskIndicator[] }) {
  const sorted = [...kris].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    return order[a.status] - order[b.status];
  });

  const statusColor: Record<string, string> = {
    red:   '#C42B31',
    amber: '#C29A1D',
    green: '#2EB365',
  };

  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.25 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', flexShrink: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
          KRIs
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ flex: 1 }}>
          {sorted.map((kri) => {
            const color = statusColor[kri.status];
            const name = kri.name.length > 22 ? kri.name.slice(0, 22) + '…' : kri.name;
            return (
              <Chip
                key={kri.id}
                size="small"
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center" component="span">
                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, display: 'inline-block', flexShrink: 0 }} />
                    <span>{name} — {kri.currentValue}{kri.threshold.unit}</span>
                  </Stack>
                }
                sx={{
                  height: 24,
                  bgcolor: `${color}26`,
                  border: `1px solid ${color}`,
                  '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                }}
              />
            );
          })}
        </Stack>
        <Button
          component={Link}
          href="/treatment"
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

function AgentQueuePanel({ onApprove }: { onApprove: () => void }) {
  return (
    <Paper variant="outlined">
      <Grid container>
        {/* Left: pending approvals */}
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{ p: 2.5, borderRight: { md: '1px solid' }, borderColor: { md: 'divider' }, borderBottom: { xs: '1px solid', md: 'none' }, borderBottomColor: { xs: 'divider' } }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Pending approvals
          </Typography>
          <Stack spacing={1.25}>
            {PENDING_TASKS.map((task, idx) => {
              const color = TASK_TYPE_COLORS[task.type];
              return (
                <Stack key={idx} direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={task.type}
                    sx={{
                      height: 20,
                      bgcolor: `${color}22`,
                      color,
                      border: `1px solid ${color}66`,
                      fontWeight: 700,
                      fontSize: '0.6rem',
                      flexShrink: 0,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {task.time}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={onApprove}
                    sx={{ flexShrink: 0, fontSize: '0.68rem', py: 0.25, px: 1, minWidth: 'auto' }}
                  >
                    Approve
                  </Button>
                  <Button
                    component={Link}
                    href={task.href}
                    size="small"
                    variant="text"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 11 }} />}
                    sx={{ flexShrink: 0, fontSize: '0.68rem', py: 0.25, px: 0.5, whiteSpace: 'nowrap', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                  >
                    Review
                  </Button>
                </Stack>
              );
            })}
          </Stack>
          <Button
            component={Link}
            href="/assessments"
            size="small"
            variant="text"
            sx={{ mt: 2, fontSize: '0.72rem', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            View all pending →
          </Button>
        </Grid>

        {/* Right: recent agent activity */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Recent agent activity
          </Typography>
          <Stack spacing={1.25}>
            {ACTIVITY_LOG.map((item, idx) => {
              const color = TASK_TYPE_COLORS[item.type];
              const outcomeColor = OUTCOME_COLORS[item.outcome];
              return (
                <Stack key={idx} direction="row" spacing={1} alignItems="flex-start">
                  <Chip
                    size="small"
                    label={item.type}
                    sx={{
                      height: 18,
                      bgcolor: `${color}1A`,
                      color,
                      border: `1px solid ${color}55`,
                      fontWeight: 700,
                      fontSize: '0.58rem',
                      flexShrink: 0,
                      mt: 0.2,
                      '& .MuiChip-label': { px: 0.6 },
                    }}
                  />
                  <Typography variant="caption" sx={{ flex: 1, lineHeight: 1.45 }}>
                    {item.desc}
                  </Typography>
                  <Chip
                    size="small"
                    label={item.outcome}
                    variant="outlined"
                    sx={{
                      height: 18,
                      fontSize: '0.58rem',
                      color: outcomeColor,
                      borderColor: outcomeColor,
                      flexShrink: 0,
                      '& .MuiChip-label': { px: 0.6 },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.62rem', mt: 0.1 }}>
                    {item.time}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
          <Button
            component={Link}
            href="/reporting"
            size="small"
            variant="text"
            sx={{ mt: 2, fontSize: '0.72rem', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            View full history →
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default function DashboardPage() {
  const [approvedRisks, setApprovedRisks] = useState<RiskSuggestion[]>([]);
  const [draftRisks, setDraftRisks] = useState<RiskSuggestion[]>([]);
  const [kris, setKRIs] = useState<KeyRiskIndicator[]>([]);
  const [approveSnackbar, setApproveSnackbar] = useState(false);

  useEffect(() => {
    setApprovedRisks(getApprovedRisks());
    setDraftRisks(getDraftRisks());
    setKRIs(getKRIs());
  }, []);

  const totalRisks = approvedRisks.length;

  const getSummaryMessage = () => {
    if (totalRisks === 0 && draftRisks.length === 0) return 'Your risk register is ready to be populated';
    if (totalRisks === 0 && draftRisks.length > 0) return 'Your risk register has drafts awaiting approval';
    return 'Your risk register is healthy and well mitigated';
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Dashboard
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<ReportIcon />}>
            New report
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {getSummaryMessage()}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <QuickStats approvedRisks={approvedRisks} draftRisks={draftRisks} />
      </Box>

      {kris.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <KRIStatusStrip kris={kris} />
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <AgentIcon sx={{ fontSize: 18, background: 'linear-gradient(135deg,#5C6BC0,#9C27B0,#E91E63)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Agent queue</Typography>
        </Stack>
        <AgentQueuePanel onApprove={() => setApproveSnackbar(true)} />
      </Box>

      <Snackbar
        open={approveSnackbar}
        autoHideDuration={3000}
        onClose={() => setApproveSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setApproveSnackbar(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          Approved
        </Alert>
      </Snackbar>
    </Box>
  );
}
