'use client';

import {
  Drawer,
  Box,
  Typography,
  Stack,
  Divider,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  AutoAwesome as AgentIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  NotificationImportant as EscalateIcon,
  MonitorHeart as MonitorIcon,
  CheckCircleOutline as AcceptIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import type { RiskSuggestion } from '@/types/document';

export interface SelectedCell {
  likelihood: number;
  impact: number;
  risks: RiskSuggestion[];
}

interface Action {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  primary?: boolean;
}

const aiGradient = 'linear-gradient(135deg, #5C6BC0 0%, #9C27B0 50%, #E91E63 100%)';

const severityConfig: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Very Low',  color: '#7ECDA0', bg: 'rgba(126, 205, 160, 0.12)' },
  2: { label: 'Low',       color: '#2EB365', bg: 'rgba(46, 179, 101, 0.12)'  },
  3: { label: 'Medium',    color: '#C29A1D', bg: 'rgba(194, 154, 29, 0.12)'  },
  4: { label: 'High',      color: '#E54E54', bg: 'rgba(229, 78, 84, 0.12)'   },
  5: { label: 'Critical',  color: '#C42B31', bg: 'rgba(196, 43, 49, 0.14)'   },
};

function getActions(score: number): Action[] {
  if (score <= 2) {
    return [
      {
        icon: <MonitorIcon fontSize="small" />,
        title: 'Set up monitoring',
        description: 'Configure automated alerts for changes in this risk profile',
        href: '/assessments',
        primary: true,
      },
      {
        icon: <AcceptIcon fontSize="small" />,
        title: 'Accept & document',
        description: 'Formally accept these risks with documented rationale and review date',
        href: '/assessments',
      },
    ];
  }

  if (score === 3) {
    return [
      {
        icon: <AssessmentIcon fontSize="small" />,
        title: 'Run assessment',
        description: 'Evaluate residual risk and existing treatment effectiveness',
        href: '/assessments',
        primary: true,
      },
      {
        icon: <SecurityIcon fontSize="small" />,
        title: 'Suggest controls',
        description: 'AI-generated control recommendations for medium-severity risks',
        href: '/?new=true',
      },
      {
        icon: <MonitorIcon fontSize="small" />,
        title: 'Schedule review',
        description: 'Set a periodic review cadence and monitoring triggers',
        href: '/assessments',
      },
    ];
  }

  if (score === 4) {
    return [
      {
        icon: <AssessmentIcon fontSize="small" />,
        title: 'Priority assessment',
        description: 'Immediate assessment required — these risks need active treatment plans',
        href: '/assessments',
        primary: true,
      },
      {
        icon: <SecurityIcon fontSize="small" />,
        title: 'Generate mitigations',
        description: 'AI-powered control and mitigation strategies for high-severity risks',
        href: '/?new=true',
      },
      {
        icon: <EscalateIcon fontSize="small" />,
        title: 'Escalate to leadership',
        description: 'Create an escalation report for executive or board review',
        href: '/assessments',
      },
    ];
  }

  return [
    {
      icon: <EscalateIcon fontSize="small" />,
      title: 'Escalate immediately',
      description: 'Critical risks require immediate leadership notification and response',
      href: '/assessments',
      primary: true,
    },
    {
      icon: <AssessmentIcon fontSize="small" />,
      title: 'Emergency assessment',
      description: 'Fast-track assessment with AI assistance and pre-filled templates',
      href: '/?new=true',
    },
    {
      icon: <SecurityIcon fontSize="small" />,
      title: 'Urgent controls',
      description: 'Identify immediate mitigation measures and critical control gaps',
      href: '/?new=true',
    },
  ];
}

const categoryColors: Record<string, string> = {
  operational: '#0060C7',
  compliance:  '#9530DC',
  financial:   '#009999',
  cyber:       '#C42B31',
  strategic:   '#C29A1D',
};

interface HeatmapSidesheetProps {
  cell: SelectedCell | null;
  onClose: () => void;
}

export function HeatmapSidesheet({ cell, onClose }: HeatmapSidesheetProps) {
  const score = cell ? Math.round((cell.likelihood + cell.impact) / 2) : 1;
  const config = severityConfig[Math.max(1, Math.min(5, score))];
  const actions = cell ? getActions(score) : [];

  return (
    <Drawer
      anchor="right"
      open={!!cell}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100vw', sm: 420 },
          background: 'rgba(10, 14, 26, 0.97)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderLeft: '1px solid rgba(96, 165, 250, 0.12)',
          boxShadow: '-16px 0 64px rgba(0, 0, 0, 0.55)',
        },
      }}
    >
      {cell && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Header ── */}
          <Box sx={{ p: 3, pb: 2.5, borderBottom: '1px solid rgba(96, 165, 250, 0.1)', flexShrink: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.3,
                      borderRadius: 1,
                      background: config.bg,
                      border: `1px solid ${config.color}40`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: config.color, fontWeight: 700, letterSpacing: '0.03em' }}>
                      {config.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    L{cell.likelihood} × I{cell.impact}
                  </Typography>
                </Stack>

                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {cell.risks.length} {cell.risks.length === 1 ? 'Risk' : 'Risks'} in this zone
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Likelihood {cell.likelihood}/5 · Impact {cell.impact}/5
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={onClose}
                sx={{ mt: -0.5, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                aria-label="Close panel"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* ── Scrollable body ── */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>

            {/* Risk list */}
            <Typography
              variant="caption"
              sx={{ letterSpacing: '0.04em', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.5 }}
            >
              Risks in zone
            </Typography>

            <Stack spacing={1} sx={{ mb: 3 }}>
              {cell.risks.map((risk) => (
                <Box
                  key={risk.id}
                  component={Link}
                  href={`/risks/${risk.id}`}
                  onClick={onClose}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: '1px solid rgba(96, 165, 250, 0.1)',
                    background: 'rgba(22, 27, 39, 0.5)',
                    textDecoration: 'none',
                    display: 'block',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      background: 'rgba(96, 165, 250, 0.08)',
                      borderColor: 'rgba(96, 165, 250, 0.3)',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                    {risk.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      label={risk.category}
                      sx={{
                        height: 18,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        borderRadius: 0.75,
                        color: 'text.secondary',
                      }}
                    />
                    {risk.suggestedOwner && (
                      <Typography variant="caption" color="text.secondary">
                        {risk.suggestedOwner.name}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ borderColor: 'rgba(96, 165, 250, 0.08)', mb: 2.5 }} />

            {/* Suggested actions */}
            <Typography
              variant="caption"
              sx={{ letterSpacing: '0.04em', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.5 }}
            >
              Suggested actions
            </Typography>

            <Stack spacing={1.5}>
              {actions.map((action, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    border: `1px solid ${action.primary ? 'rgba(96, 165, 250, 0.22)' : 'rgba(96, 165, 250, 0.08)'}`,
                    background: action.primary ? 'rgba(96, 165, 250, 0.07)' : 'rgba(22, 27, 39, 0.4)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ color: action.primary ? 'primary.light' : 'text.secondary', mt: 0.15, flexShrink: 0 }}>
                      {action.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, lineHeight: 1.5 }}>
                        {action.description}
                      </Typography>
                      <Button
                        component={Link}
                        href={action.href}
                        onClick={onClose}
                        size="small"
                        variant={action.primary ? 'contained' : 'outlined'}
                        startIcon={<AgentIcon sx={{ fontSize: '14px !important' }} />}
                        endIcon={<ArrowForwardIcon sx={{ fontSize: '12px !important' }} />}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.5,
                          ...(action.primary && {
                            background: aiGradient,
                            border: 'none',
                            '&:hover': { background: aiGradient, opacity: 0.88, border: 'none' },
                          }),
                        }}
                      >
                        Start with agent
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
