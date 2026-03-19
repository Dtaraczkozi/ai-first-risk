'use client';

import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Shield as ShieldIcon,
  CheckCircle as EffectiveIcon,
  Warning as IneffectiveIcon,
} from '@mui/icons-material';
import type { Control } from '@/types/control';

interface ControlCardProps {
  control: Control;
  onClick?: () => void;
}

const typeColors: Record<string, string> = {
  preventive: '#2e7d32',
  detective: '#1976d2',
  corrective: '#ed6c02',
  directive: '#9c27b0',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  proposed: { bg: '#fff3e0', text: '#e65100' },
  implemented: { bg: '#e3f2fd', text: '#1565c0' },
  effective: { bg: '#e8f5e9', text: '#2e7d32' },
  ineffective: { bg: '#ffebee', text: '#c62828' },
  retired: { bg: '#f5f5f5', text: '#757575' },
};

export function ControlCard({ control, onClick }: ControlCardProps) {
  const effectivenessPercentage = (control.effectiveness / 5) * 100;

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': onClick ? {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Chip
            size="small"
            icon={<ShieldIcon fontSize="small" />}
            label={control.type}
            sx={{
              backgroundColor: `${typeColors[control.type]}15`,
              color: typeColors[control.type],
              textTransform: 'capitalize',
              '& .MuiChip-icon': { color: typeColors[control.type] },
            }}
          />
          <IconButton size="small" onClick={(e) => e.stopPropagation()}>
            <MoreIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
          {control.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {control.description}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Chip
            size="small"
            label={control.status}
            sx={{
              backgroundColor: statusColors[control.status]?.bg || '#f5f5f5',
              color: statusColors[control.status]?.text || '#757575',
              textTransform: 'capitalize',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {control.frequency}
          </Typography>
        </Stack>

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Effectiveness
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {control.effectiveness >= 4 ? (
                <EffectiveIcon fontSize="small" sx={{ color: 'success.main' }} />
              ) : control.effectiveness <= 2 ? (
                <IneffectiveIcon fontSize="small" sx={{ color: 'warning.main' }} />
              ) : null}
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {control.effectiveness}/5
              </Typography>
            </Stack>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={effectivenessPercentage}
            sx={{
              height: 6,
              borderRadius: 1,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  control.effectiveness >= 4
                    ? 'success.main'
                    : control.effectiveness >= 3
                    ? 'warning.main'
                    : 'error.main',
              },
            }}
          />
        </Box>

        {control.linkedRiskIds.length > 0 && (
          <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Linked to {control.linkedRiskIds.length} risk{control.linkedRiskIds.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
