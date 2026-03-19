'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  AutoAwesome as AgentIcon,
  Send as SendIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssessmentIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  ArrowForward as ArrowForwardIcon,
  Lightbulb as LightbulbIcon,
  Description as ReportIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { getApprovedRisks, getDraftRisks } from '@/lib/risk-store';
import type { RiskSuggestion } from '@/types/document';

const aiGradient = 'linear-gradient(135deg, #5C6BC0 0%, #9C27B0 50%, #E91E63 100%)';

const suggestedPrompts = [
  'What are my highest priority risks right now?',
  'Which risks need assessment this week?',
  'Suggest controls for my cyber risks',
  'Show me risks without mitigation plans',
  'What compliance deadlines are coming up?',
];

function QuickStats({ approvedRisks, draftRisks }: { approvedRisks: RiskSuggestion[]; draftRisks: RiskSuggestion[] }) {
  const totalApproved = approvedRisks.length;
  const totalDrafts = draftRisks.length;
  const highSeverity = approvedRisks.filter(r => Math.round((r.likelihood + r.impact) / 2) >= 4).length;
  const needsAssessment = Math.floor(totalApproved * 0.4);
  const avgScore = totalApproved > 0 
    ? (approvedRisks.reduce((sum, r) => sum + Math.round((r.likelihood + r.impact) / 2), 0) / totalApproved).toFixed(1)
    : '0';

  const stats = [
    { label: 'Total risks', value: totalApproved, subtitle: 'In register', color: '#0060C7' },
    { label: 'Pending review', value: totalDrafts, subtitle: 'Draft risks', color: '#9530DC' },
    { label: 'Needs attention', value: needsAssessment, subtitle: 'Awaiting assessment', color: '#E54E54' },
    { label: 'High severity', value: highSeverity, subtitle: 'Score 4+', color: '#C29A1D' },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((stat) => (
        <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
          <Paper sx={{ p: 2.5, height: '100%' }} variant="outlined">
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  width: 4,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: stat.color,
                }}
              />
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

function ActionCard({ 
  title, 
  description, 
  count, 
  icon, 
  color, 
  actionLabel,
  actionHref,
  items,
}: {
  title: string;
  description: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  actionLabel: string;
  actionHref: string;
  items?: { label: string; value: number; color: string }[];
}) {
  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }} variant="outlined">
      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box
          sx={{
            color: '#282E37',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color }}>
          {count}
        </Typography>
      </Stack>

      {items && items.length > 0 && (
        <Stack spacing={1.5} sx={{ mb: 2, flex: 1 }}>
          {items.map((item) => (
            <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                <Typography variant="body2">{item.label}</Typography>
              </Stack>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
            </Stack>
          ))}
        </Stack>
      )}

      <Button
        component={Link}
        href={actionHref}
        variant="outlined"
        size="small"
        endIcon={<ArrowForwardIcon />}
        sx={{ mt: 'auto', alignSelf: 'flex-start' }}
      >
        {actionLabel}
      </Button>
    </Paper>
  );
}

function ConversationalInput() {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
      setInputValue('');
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, rgba(92, 107, 192, 0.03) 0%, rgba(156, 39, 176, 0.03) 50%, rgba(233, 30, 99, 0.03) 100%)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: aiGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <AgentIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Ask the Risk Agent
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Get insights, recommendations, or take actions with natural language
          </Typography>
        </Box>
      </Stack>

      <TextField
        fullWidth
        placeholder="Ask about your risks, request analysis, or give instructions..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
            borderRadius: 2,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderImage: aiGradient,
              borderImageSlice: 1,
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton 
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                sx={{
                  background: inputValue.trim() ? aiGradient : 'grey.200',
                  color: inputValue.trim() ? 'white' : 'grey.500',
                  '&:hover': {
                    background: inputValue.trim() ? aiGradient : 'grey.300',
                    opacity: 0.9,
                  },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {isTyping && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: aiGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AgentIcon sx={{ fontSize: 14, color: 'white' }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Analyzing your risk data...
            </Typography>
          </Stack>
          <LinearProgress 
            sx={{ 
              height: 2, 
              borderRadius: 1,
              '& .MuiLinearProgress-bar': {
                background: aiGradient,
              },
            }} 
          />
        </Box>
      )}

      <Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <LightbulbIcon sx={{ fontSize: 16, color: '#282E37' }} />
          <Typography variant="caption" color="text.secondary">
            Try asking
          </Typography>
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {suggestedPrompts.map((prompt) => (
            <Chip
              key={prompt}
              label={prompt}
              size="small"
              onClick={() => handlePromptClick(prompt)}
              sx={{
                cursor: 'pointer',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                },
              }}
            />
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const [approvedRisks, setApprovedRisks] = useState<RiskSuggestion[]>([]);
  const [draftRisks, setDraftRisks] = useState<RiskSuggestion[]>([]);

  useEffect(() => {
    setApprovedRisks(getApprovedRisks());
    setDraftRisks(getDraftRisks());
  }, []);

  const totalRisks = approvedRisks.length;
  const needsAssessment = Math.floor(totalRisks * 0.4);
  const inProgress = Math.floor(totalRisks * 0.25);
  const mitigated = Math.floor(totalRisks * 0.25);
  const monitoring = totalRisks - needsAssessment - inProgress - mitigated;

  const treatmentAccept = Math.floor(totalRisks * 0.2);
  const treatmentMitigate = Math.floor(totalRisks * 0.5);
  const treatmentTransfer = Math.floor(totalRisks * 0.2);
  const treatmentAvoid = totalRisks - treatmentAccept - treatmentMitigate - treatmentTransfer;

  const controlsImplemented = Math.floor(totalRisks * 2.3);
  const controlsPending = Math.floor(totalRisks * 0.8);

  const getSummaryMessage = () => {
    if (totalRisks === 0 && draftRisks.length === 0) {
      return "Your risk register is ready to be populated";
    }
    if (totalRisks === 0 && draftRisks.length > 0) {
      return "Your risk register has drafts awaiting approval";
    }
    return "Your risk register is healthy and well mitigated";
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
          <Button
            variant="contained"
            startIcon={<ReportIcon />}
          >
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
        <ConversationalInput />
      </Box>

      <Box sx={{ mb: 3 }}>
        <QuickStats approvedRisks={approvedRisks} draftRisks={draftRisks} />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 3 }} variant="outlined">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Quick actions
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Button
                component={Link}
                href="/?new=true"
                variant="outlined"
                fullWidth
                startIcon={<AgentIcon sx={{ color: '#282E37' }} />}
                sx={{ py: 1.5, justifyContent: 'flex-start', color: '#282E37', borderColor: 'divider' }}
              >
                Run AI analysis
              </Button>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Button
                component={Link}
                href="/risks"
                variant="outlined"
                fullWidth
                startIcon={<WarningIcon sx={{ color: '#282E37' }} />}
                sx={{ py: 1.5, justifyContent: 'flex-start', color: '#282E37', borderColor: 'divider' }}
              >
                Review high risks
              </Button>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Button
                component={Link}
                href="/risks"
                variant="outlined"
                fullWidth
                startIcon={<AssessmentIcon sx={{ color: '#282E37' }} />}
                sx={{ py: 1.5, justifyContent: 'flex-start', color: '#282E37', borderColor: 'divider' }}
              >
                Pending assessments
              </Button>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Button
                component={Link}
                href="/history"
                variant="outlined"
                fullWidth
                startIcon={<TrendingUpIcon sx={{ color: '#282E37' }} />}
                sx={{ py: 1.5, justifyContent: 'flex-start', color: '#282E37', borderColor: 'divider' }}
              >
                View history
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ActionCard
            title="Assessments"
            description="Risk assessments requiring attention"
            count={needsAssessment}
            icon={<AssessmentIcon />}
            color="#E54E54"
            actionLabel="View assessments"
            actionHref="/risks"
            items={[
              { label: 'Needs Assessment', value: needsAssessment, color: '#E54E54' },
              { label: 'In Progress', value: inProgress, color: '#C29A1D' },
              { label: 'Completed', value: mitigated + monitoring, color: '#2EB365' },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ActionCard
            title="Treatment Plans"
            description="Active treatment strategies"
            count={treatmentMitigate + treatmentAccept}
            icon={<SecurityIcon />}
            color="#0060C7"
            actionLabel="Manage treatments"
            actionHref="/risks"
            items={[
              { label: 'Mitigate', value: treatmentMitigate, color: '#0060C7' },
              { label: 'Accept', value: treatmentAccept, color: '#2EB365' },
              { label: 'Transfer', value: treatmentTransfer, color: '#9530DC' },
              { label: 'Avoid', value: treatmentAvoid, color: '#C29A1D' },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ActionCard
            title="Controls"
            description="Control implementation status"
            count={controlsImplemented + controlsPending}
            icon={<CheckCircleIcon />}
            color="#2EB365"
            actionLabel="View controls"
            actionHref="/risks"
            items={[
              { label: 'Implemented', value: controlsImplemented, color: '#2EB365' },
              { label: 'Pending', value: controlsPending, color: '#C29A1D' },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
