'use client';

import { Box, Typography, Chip, Stack, CircularProgress } from '@mui/material';
import {
  AutoAwesome as AiIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as RunningIcon,
} from '@mui/icons-material';

interface AgentStatusIndicatorProps {
  stats: {
    queued: number;
    running: number;
    awaitingApproval: number;
    completed: number;
    failed: number;
  };
  compact?: boolean;
}

export function AgentStatusIndicator({ stats, compact = false }: AgentStatusIndicatorProps) {
  const isActive = stats.queued > 0 || stats.running > 0;
  const hasApprovals = stats.awaitingApproval > 0;

  if (compact) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: isActive ? 'primary.light' : 'grey.200',
            color: isActive ? 'white' : 'grey.600',
            position: 'relative',
          }}
        >
          <AiIcon fontSize="small" />
          {isActive && (
            <CircularProgress
              size={36}
              thickness={2}
              sx={{
                position: 'absolute',
                color: 'primary.main',
              }}
            />
          )}
        </Box>
        {hasApprovals && (
          <Chip
            size="small"
            label={`${stats.awaitingApproval} pending`}
            color="warning"
          />
        )}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: isActive 
              ? 'linear-gradient(135deg, #5C6BC0 0%, #9C27B0 100%)'
              : 'grey.200',
            color: isActive ? 'white' : 'grey.600',
            position: 'relative',
          }}
        >
          <AiIcon />
          {isActive && (
            <CircularProgress
              size={56}
              thickness={2}
              sx={{
                position: 'absolute',
                color: 'rgba(255,255,255,0.5)',
              }}
            />
          )}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            AI Agent
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isActive ? 'Processing tasks...' : 'Idle'}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {stats.running > 0 && (
          <Chip
            size="small"
            icon={<RunningIcon />}
            label={`${stats.running} running`}
            color="primary"
          />
        )}
        {stats.queued > 0 && (
          <Chip
            size="small"
            icon={<PendingIcon />}
            label={`${stats.queued} queued`}
            color="default"
          />
        )}
        {stats.awaitingApproval > 0 && (
          <Chip
            size="small"
            icon={<PendingIcon />}
            label={`${stats.awaitingApproval} awaiting approval`}
            color="warning"
          />
        )}
        {stats.completed > 0 && (
          <Chip
            size="small"
            icon={<CompletedIcon />}
            label={`${stats.completed} completed`}
            color="success"
          />
        )}
        {stats.failed > 0 && (
          <Chip
            size="small"
            icon={<ErrorIcon />}
            label={`${stats.failed} failed`}
            color="error"
          />
        )}
      </Stack>
    </Box>
  );
}
