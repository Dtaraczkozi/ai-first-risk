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
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  TrendingUp as TrendIcon,
  Shield as ShieldIcon,
  AutoAwesome as AiIcon,
} from '@mui/icons-material';
import type { Risk } from '@/types/risk';
import { calculateRiskScore, getRiskLevel } from '@/types/risk';
import { getSeverityColor, getSeverityLabel } from '@/lib/utils';

interface RiskCardProps {
  risk: Risk;
  onClick?: () => void;
}

const categoryColors: Record<string, string> = {
  operational: '#0060C7',
  compliance: '#9530DC',
  financial: '#009999',
  cyber: '#C42B31',
  strategic: '#C29A1D',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  identified: { bg: '#e3f2fd', text: '#1565c0' },
  assessed: { bg: '#fff3e0', text: '#e65100' },
  mitigated: { bg: '#e8f5e9', text: '#2e7d32' },
  closed: { bg: '#f5f5f5', text: '#757575' },
};

export function RiskCard({ risk, onClick }: RiskCardProps) {
  const score = calculateRiskScore(risk);
  const level = getRiskLevel(score);
  const scoreColor = getSeverityColor(risk.severity);

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
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={risk.category}
              variant="outlined"
              sx={{
                color: 'text.secondary',
                borderColor: 'grey.400',
                textTransform: 'capitalize',
                fontWeight: 500,
              }}
            />
            {risk.createdBy === 'agent' && (
              <Tooltip title="Identified by AI Agent">
                <AiIcon fontSize="small" sx={{ color: 'primary.main' }} />
              </Tooltip>
            )}
          </Stack>
          <IconButton size="small" onClick={(e) => e.stopPropagation()}>
            <MoreIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.3 }}>
          {risk.title}
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
          {risk.description}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <Tooltip title={`Severity: ${getSeverityLabel(risk.severity)}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendIcon fontSize="small" sx={{ color: scoreColor }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: scoreColor }}>
                  {risk.severity}
                </Typography>
              </Box>
            </Tooltip>
            
            {risk.controlIds.length > 0 && (
              <Tooltip title={`${risk.controlIds.length} control(s) linked`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ShieldIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {risk.controlIds.length}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Stack>

          <Chip
            size="small"
            label={risk.status}
            sx={{
              backgroundColor: statusColors[risk.status]?.bg || '#f5f5f5',
              color: statusColors[risk.status]?.text || '#757575',
              textTransform: 'capitalize',
              fontSize: '0.7rem',
            }}
          />
        </Stack>

        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Risk Score
          </Typography>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: `${scoreColor}15`,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: scoreColor }}>
              {score} ({level})
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
