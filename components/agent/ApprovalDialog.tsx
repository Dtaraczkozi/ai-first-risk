'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Box,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  AutoAwesome as AiIcon,
} from '@mui/icons-material';
import type { ApprovalRequest } from '@/types/agent';

interface ApprovalDialogProps {
  open: boolean;
  request: ApprovalRequest | null;
  action: 'approve' | 'reject' | null;
  onClose: () => void;
  onConfirm: (feedback?: string) => void;
}

export function ApprovalDialog({ open, request, action, onClose, onConfirm }: ApprovalDialogProps) {
  const [feedback, setFeedback] = useState('');

  const handleConfirm = () => {
    onConfirm(feedback || undefined);
    setFeedback('');
  };

  const handleClose = () => {
    setFeedback('');
    onClose();
  };

  if (!request || !action) return null;

  const isApprove = action === 'approve';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="approval-dialog-title"
      aria-describedby="approval-dialog-description"
    >
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {isApprove ? 'Approve Action' : 'Reject Action'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isApprove 
                ? 'This will execute the AI-proposed action'
                : 'This will cancel the AI-proposed action'
              }
            </Typography>
          </Box>
          <IconButton
            aria-label="Close"
            onClick={handleClose}
            size="small"
            sx={{ mt: -0.5, mr: -1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'primary.light',
                color: 'white',
              }}
            >
              <AiIcon fontSize="small" />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {request.title}
            </Typography>
          </Stack>

          <Chip
            size="small"
            label={request.taskType.replace('_', ' ')}
            sx={{ mb: 2, textTransform: 'capitalize' }}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {request.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Proposed Changes
          </Typography>
          <Box
            sx={{
              backgroundColor: 'grey.50',
              borderRadius: 1,
              p: 2,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
              maxHeight: 150,
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(request.proposedChanges, null, 2)}
            </pre>
          </Box>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label={isApprove ? 'Approval Notes (Optional)' : 'Rejection Reason (Optional)'}
          placeholder={isApprove 
            ? 'Add any notes for this approval...'
            : 'Explain why this action is being rejected...'
          }
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          variant="outlined"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={isApprove ? 'primary' : 'error'}
          onClick={handleConfirm}
          autoFocus
        >
          {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
