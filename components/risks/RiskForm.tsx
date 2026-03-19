'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Slider,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Risk, RiskCategory, RiskStatus } from '@/types/risk';

interface RiskFormProps {
  open: boolean;
  risk?: Risk;
  onClose: () => void;
  onSave: (risk: Partial<Risk>) => void;
}

const categories: { value: RiskCategory; label: string }[] = [
  { value: 'operational', label: 'Operational' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'financial', label: 'Financial' },
  { value: 'cyber', label: 'Cybersecurity' },
  { value: 'strategic', label: 'Strategic' },
];

const statuses: { value: RiskStatus; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'assessed', label: 'Assessed' },
  { value: 'mitigated', label: 'Mitigated' },
  { value: 'closed', label: 'Closed' },
];

export function RiskForm({ open, risk, onClose, onSave }: RiskFormProps) {
  const [formData, setFormData] = useState<Partial<Risk>>({
    title: risk?.title || '',
    description: risk?.description || '',
    category: risk?.category || 'operational',
    status: risk?.status || 'identified',
    severity: risk?.severity || 3,
    likelihood: risk?.likelihood || 3,
    impact: risk?.impact || 3,
    owner: risk?.owner || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const isEdit = !!risk;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="risk-form-title"
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2">
              {isEdit ? 'Edit Risk' : 'Add New Risk'}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                required
                label="Risk Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as RiskCategory })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as RiskStatus })}
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Risk Owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Risk Assessment
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" gutterBottom>
                Severity: {formData.severity}
              </Typography>
              <Slider
                value={formData.severity}
                min={1}
                max={5}
                step={1}
                marks
                onChange={(_, value) => setFormData({ ...formData, severity: value as 1 | 2 | 3 | 4 | 5 })}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Low</Typography>
                <Typography variant="caption" color="text.secondary">Critical</Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" gutterBottom>
                Likelihood: {formData.likelihood}
              </Typography>
              <Slider
                value={formData.likelihood}
                min={1}
                max={5}
                step={1}
                marks
                onChange={(_, value) => setFormData({ ...formData, likelihood: value as 1 | 2 | 3 | 4 | 5 })}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Rare</Typography>
                <Typography variant="caption" color="text.secondary">Almost Certain</Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body2" gutterBottom>
                Impact: {formData.impact}
              </Typography>
              <Slider
                value={formData.impact}
                min={1}
                max={5}
                step={1}
                marks
                onChange={(_, value) => setFormData({ ...formData, impact: value as 1 | 2 | 3 | 4 | 5 })}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Negligible</Typography>
                <Typography variant="caption" color="text.secondary">Severe</Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            {isEdit ? 'Save Changes' : 'Add Risk'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
