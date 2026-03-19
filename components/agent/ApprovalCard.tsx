'use client';

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
  Box,
  IconButton,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import type { ApprovalRequest, AgentTaskType } from '@/types/agent';

interface ApprovalCardProps {
  request: ApprovalRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const taskTypeConfig: Record<AgentTaskType, { label: string; icon: React.ReactElement; color: string }> = {
  identify: { label: 'Risk Identified', icon: <AddIcon fontSize="small" />, color: '#1976d2' },
  assess: { label: 'Assessment', icon: <AssessmentIcon fontSize="small" />, color: '#ed6c02' },
  suggest_controls: { label: 'Control Suggestion', icon: <SecurityIcon fontSize="small" />, color: '#2e7d32' },
  monitor: { label: 'Monitoring Alert', icon: <WarningIcon fontSize="small" />, color: '#d32f2f' },
  report: { label: 'Report Ready', icon: <AssessmentIcon fontSize="small" />, color: '#9c27b0' },
};

export function ApprovalCard({ request, onApprove, onReject, onViewDetails }: ApprovalCardProps) {
  const config = taskTypeConfig[request.taskType];
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card 
      sx={{ 
        position: 'relative',
        borderLeft: `4px solid ${config.color}`,
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: `${config.color}15`,
              color: config.color,
            }}
          >
            <AiIcon />
          </Box>
        }
        action={
          <IconButton aria-label="More options" size="small">
            <MoreIcon />
          </IconButton>
        }
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {request.title}
            </Typography>
          </Stack>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
            <Chip
              size="small"
              icon={config.icon}
              label={config.label}
              sx={{ 
                backgroundColor: `${config.color}15`,
                color: config.color,
                '& .MuiChip-icon': { color: config.color },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(request.createdAt)}
            </Typography>
          </Stack>
        }
      />
      
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {request.description}
        </Typography>
        
        <Box sx={{ backgroundColor: 'grey.50', borderRadius: 1, p: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            AI Reasoning
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {request.reasoning}
          </Typography>
        </Box>

        {request.evidence && request.evidence.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Evidence
            </Typography>
            <Stack spacing={0.5}>
              {request.evidence.slice(0, 3).map((item, index) => (
                <Typography key={index} variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>•</Box>
                  {item}
                </Typography>
              ))}
              {request.evidence.length > 3 && (
                <Typography variant="body2" color="primary.main" sx={{ cursor: 'pointer' }}>
                  +{request.evidence.length - 3} more items
                </Typography>
              )}
            </Stack>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
        <Button
          variant="text"
          size="small"
          onClick={() => onViewDetails(request.id)}
        >
          View Details
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => onReject(request.id)}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => onApprove(request.id)}
          >
            Approve
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}
