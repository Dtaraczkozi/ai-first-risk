'use client';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
  Box,
  Divider,
  Avatar,
} from '@mui/material';
import {
  OpenInNew as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import type { RiskSuggestion } from '@/types/document';
import { getSeverityColor, getSeverityLabel } from '@/lib/utils';

interface RiskSuggestionCardProps {
  suggestion: RiskSuggestion;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  operational: '#0060C7',
  compliance: '#9530DC',
  financial: '#009999',
  cyber: '#C42B31',
  strategic: '#C29A1D',
};

export function RiskSuggestionCard({ suggestion, onApprove, onReject }: RiskSuggestionCardProps) {
  const riskScore = suggestion.likelihood * suggestion.impact;
  const scoreColor = getSeverityColor(Math.ceil(riskScore / 5));

  if (suggestion.status !== 'pending') {
    return (
      <Card
        variant="outlined"
        sx={{
          opacity: 0.6,
          borderLeft: '3px solid',
          borderLeftColor: suggestion.status === 'approved' ? 'success.main' : 'error.main',
        }}
      >
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {suggestion.title}
            </Typography>
            <Chip
              size="small"
              label={suggestion.status === 'approved' ? 'Approved' : 'Rejected'}
              color={suggestion.status === 'approved' ? 'success' : 'error'}
              variant="outlined"
            />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip
                size="small"
                label={suggestion.category}
                variant="outlined"
                sx={{
                  color: 'text.secondary',
                  borderColor: 'grey.400',
                  textTransform: 'capitalize',
                  height: 22,
                  fontSize: 11,
                }}
              />
              <Chip
                size="small"
                label={`Score: ${riskScore}`}
                sx={{
                  backgroundColor: `${scoreColor}20`,
                  color: scoreColor,
                  fontWeight: 600,
                  height: 22,
                  fontSize: 11,
                }}
              />
            </Stack>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {suggestion.title}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
          {suggestion.description.length > 150 
            ? suggestion.description.substring(0, 150) + '...' 
            : suggestion.description}
        </Typography>

        <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Likelihood</Typography>
            <Typography variant="body2" fontWeight={600}>{suggestion.likelihood}/5</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Impact</Typography>
            <Typography variant="body2" fontWeight={600}>{suggestion.impact}/5</Typography>
          </Box>
          {suggestion.suggestedOwner && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Suggested Owner</Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Avatar sx={{ width: 18, height: 18, fontSize: 10 }}>
                  {suggestion.suggestedOwner.name.charAt(0)}
                </Avatar>
                <Typography variant="body2" fontWeight={500}>
                  {suggestion.suggestedOwner.name}
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>

        {suggestion.mitigation && (
          <Box sx={{ backgroundColor: 'grey.50', p: 1.5, borderRadius: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Mitigation ({suggestion.mitigation.controls.length} controls)
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {suggestion.mitigation.plan.length > 100 
                ? suggestion.mitigation.plan.substring(0, 100) + '...'
                : suggestion.mitigation.plan}
            </Typography>
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Button
          component={Link}
          href={`/risks/${suggestion.id}`}
          size="small"
          startIcon={<ViewIcon />}
        >
          View Details
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => onReject(suggestion.id)}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<ApproveIcon />}
            onClick={() => onApprove(suggestion.id)}
          >
            Approve
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}
