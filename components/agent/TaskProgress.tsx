'use client';

import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  Chip,
  Paper,
} from '@mui/material';
import {
  Search as IdentifyIcon,
  Assessment as AssessIcon,
  Security as ControlIcon,
  Visibility as MonitorIcon,
  Description as ReportIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  HourglassTop as PendingIcon,
} from '@mui/icons-material';
import type { AgentTask, AgentTaskType, AgentTaskStatus } from '@/types/agent';

interface TaskProgressProps {
  task: AgentTask;
}

const taskTypeIcons: Record<AgentTaskType, React.ReactNode> = {
  identify: <IdentifyIcon />,
  assess: <AssessIcon />,
  suggest_controls: <ControlIcon />,
  monitor: <MonitorIcon />,
  report: <ReportIcon />,
};

const taskTypeLabels: Record<AgentTaskType, string> = {
  identify: 'Risk Identification',
  assess: 'Risk Assessment',
  suggest_controls: 'Control Suggestion',
  monitor: 'Monitoring',
  report: 'Report Generation',
};

const statusConfig: Record<AgentTaskStatus, { color: 'default' | 'primary' | 'warning' | 'success' | 'error'; label: string; icon: React.ReactElement | undefined }> = {
  queued: { color: 'default', label: 'Queued', icon: <PendingIcon fontSize="small" /> },
  running: { color: 'primary', label: 'Running', icon: undefined },
  awaiting_approval: { color: 'warning', label: 'Awaiting Approval', icon: <PendingIcon fontSize="small" /> },
  completed: { color: 'success', label: 'Completed', icon: <CompletedIcon fontSize="small" /> },
  failed: { color: 'error', label: 'Failed', icon: <ErrorIcon fontSize="small" /> },
};

export function TaskProgress({ task }: TaskProgressProps) {
  const config = statusConfig[task.status];
  const isRunning = task.status === 'running';

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: isRunning ? 'primary.main' : 'divider',
        backgroundColor: isRunning ? 'primary.50' : 'background.paper',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 1,
            backgroundColor: isRunning ? 'primary.main' : 'grey.100',
            color: isRunning ? 'white' : 'grey.600',
          }}
        >
          {taskTypeIcons[task.type]}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2" noWrap>
              {taskTypeLabels[task.type]}
            </Typography>
            <Chip
              size="small"
              label={config.label}
              color={config.color}
              icon={config.icon}
              sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
            />
          </Stack>

          {isRunning && (
            <LinearProgress
              sx={{ mt: 1, borderRadius: 1 }}
            />
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Started: {task.startedAt ? formatTime(task.startedAt) : formatTime(task.createdAt)}
            </Typography>
            {task.completedAt && (
              <Typography variant="caption" color="text.secondary">
                Completed: {formatTime(task.completedAt)}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>

      {task.error && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: 'error.50',
            border: '1px solid',
            borderColor: 'error.200',
          }}
        >
          <Typography variant="body2" color="error.main">
            {task.error}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
