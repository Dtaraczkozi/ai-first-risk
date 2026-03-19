'use client';

import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  RadioButtonUnchecked as PendingIcon,
} from '@mui/icons-material';
import type { AnalysisSession } from '@/types/document';

interface AnalysisProgressProps {
  session: AnalysisSession;
}

const steps = [
  { key: 'uploading', label: 'Processing documents' },
  { key: 'analyzing_documents', label: 'Extracting data' },
  { key: 'researching_external', label: 'Gathering sources' },
  { key: 'generating_risks', label: 'Identifying risks' },
  { key: 'deduplicating', label: 'Deduplicating' },
  { key: 'ready_for_review', label: 'Complete' },
];

export function AnalysisProgress({ session }: AnalysisProgressProps) {
  const currentStepIndex = steps.findIndex(s => s.key === session.status);
  const isComplete = session.status === 'ready_for_review' || session.status === 'completed';

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {session.currentStep}
        </Typography>
        <Chip
          size="small"
          label={`${session.progress}%`}
          color={isComplete ? 'success' : 'primary'}
        />
      </Stack>

      <LinearProgress
        variant="determinate"
        value={session.progress}
        sx={{
          height: 6,
          borderRadius: 3,
          mb: 2,
        }}
      />

      <Stack direction="row" spacing={2}>
        {steps.map((step, index) => {
          const isStepComplete = index < currentStepIndex || isComplete;
          const isCurrent = index === currentStepIndex && !isComplete;
          
          return (
            <Stack key={step.key} direction="row" spacing={0.5} alignItems="center">
              {isStepComplete ? (
                <CompleteIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <PendingIcon sx={{ fontSize: 16, color: isCurrent ? 'primary.main' : 'grey.400' }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: isStepComplete ? 'success.main' : isCurrent ? 'primary.main' : 'text.secondary',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {step.label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}
