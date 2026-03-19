'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Avatar,
  IconButton,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Close as CloseIcon,
  AutoAwesome as SparkleIcon,
  Check as ApproveIcon,
} from '@mui/icons-material';
import { mockRiskSuggestions, additionalMockRisks } from '@/data/mock/analysis-session';
import { getSeverityColor } from '@/lib/utils';
import { getApprovedRisks, addApprovedRisk, getRiskById, updateDraftRisk, updateApprovedRisk } from '@/lib/risk-store';

const AI_GRADIENT = 'linear-gradient(135deg, #5C6BC0 0%, #9C27B0 50%, #E91E63 100%)';

const categoryColors: Record<string, string> = {
  operational: '#0060C7',
  compliance: '#9530DC',
  financial: '#009999',
  cyber: '#C42B31',
  strategic: '#C29A1D',
};

const ownerColors: Record<string, string> = {
  'Sarah Chen': '#0060C7',
  'Michael Torres': '#C42B31',
  'Jennifer Walsh': '#9530DC',
  'David Park': '#009999',
  'Robert Kim': '#C29A1D',
};

const getOwnerColor = (name: string): string => {
  return ownerColors[name] || '#6B7280';
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface AiFieldProps {
  label: string;
  children: React.ReactNode;
  accepted: boolean;
  onAccept: () => void;
  updating?: boolean;
  required?: boolean;
}

function AiField({ label, children, accepted, onAccept, updating, required }: AiFieldProps) {
  const showAi = !accepted || updating;

  return (
    <Box>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="body2" component="label">
          {label}
          {required && <Typography component="span" color="error.main"> *</Typography>}
        </Typography>
        {showAi && (
          <Tooltip title={updating ? "Updating suggestion..." : "AI suggestion"} arrow placement="top">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {updating ? (
                <CircularProgress size={14} sx={{ color: '#9C27B0' }} />
              ) : (
                <SparkleIcon 
                  sx={{ 
                    fontSize: 16,
                    background: AI_GRADIENT,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }} 
                />
              )}
            </Box>
          </Tooltip>
        )}
      </Stack>
      <Box
        onClick={onAccept}
        sx={{
          position: 'relative',
          cursor: showAi ? 'pointer' : 'default',
          '&::before': showAi ? {
            content: '""',
            position: 'absolute',
            inset: -2,
            borderRadius: 1,
            padding: '2px',
            background: updating 
              ? 'linear-gradient(135deg, #7B1FA2 0%, #5C6BC0 50%, #7B1FA2 100%)'
              : AI_GRADIENT,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
            animation: updating ? 'pulse 1s ease-in-out infinite' : 'none',
          } : {},
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 },
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

function Field({ label, children, required }: FieldProps) {
  return (
    <Box>
      <Typography variant="body2" component="label" sx={{ mb: 0.5, display: 'block' }}>
        {label}
        {required && <Typography component="span" color="error.main"> *</Typography>}
      </Typography>
      {children}
    </Box>
  );
}

function getTreatmentForScore(score: number): { type: string; plan: string } {
  if (score <= 2) {
    return {
      type: 'accept',
      plan: 'Accept this low-level risk as the potential impact is minimal and within acceptable tolerance levels. Continue monitoring for any changes.',
    };
  } else if (score <= 3) {
    return {
      type: 'remediate',
      plan: 'Implement standard controls and monitoring procedures to reduce risk exposure. Review quarterly and adjust as needed.',
    };
  } else if (score <= 4) {
    return {
      type: 'transfer',
      plan: 'Consider transferring this risk through insurance or contractual arrangements. Implement additional controls to reduce exposure.',
    };
  } else {
    return {
      type: 'avoid',
      plan: 'This high-severity risk requires immediate attention. Consider avoiding the activity entirely or implementing comprehensive controls to significantly reduce exposure.',
    };
  }
}

export default function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [isApproved, setIsApproved] = useState(false);
  const [risk, setRisk] = useState<typeof mockRiskSuggestions[0] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRisk = getRiskById(id);
      if (storedRisk) {
        setRisk(storedRisk);
        setIsApproved(storedRisk.status === 'approved');
      } else {
        const mockRisk = [...mockRiskSuggestions, ...additionalMockRisks].find(r => r.id === id);
        if (mockRisk) {
          setRisk(mockRisk);
        }
        const approvedRisks = getApprovedRisks();
        setIsApproved(approvedRisks.some(r => r.id === id));
      }
      setIsLoaded(true);
    }
  }, [id]);
  
  const initialLikelihood = risk?.likelihood || 3;
  const initialImpact = risk?.impact || 3;
  const initialScore = Math.round((initialLikelihood + initialImpact) / 2);
  const initialTreatment = getTreatmentForScore(initialScore);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [treatmentType, setTreatmentType] = useState(initialTreatment.type);
  const [treatmentPlan, setTreatmentPlan] = useState(initialTreatment.plan);
  
  useEffect(() => {
    if (risk) {
      setTitle(risk.title);
      setCategory(risk.category);
      setDescription(risk.description);
      setOriginalDescription(risk.description);
      const score = Math.round((risk.likelihood + risk.impact) / 2);
      const treatment = getTreatmentForScore(score);
      setTreatmentType(treatment.type);
      setTreatmentPlan(treatment.plan);
    }
  }, [risk]);
  
  const [likelihood, setLikelihood] = useState<number>(initialLikelihood);
  const [impact, setImpact] = useState<number>(initialImpact);
  const [score, setScore] = useState<number>(initialScore);

  const [acceptedFields, setAcceptedFields] = useState<Record<string, boolean>>({});
  const [updatingFields, setUpdatingFields] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  
  const lastProcessedDescription = useRef(description);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const scoreUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  const acceptField = (field: string) => {
    setAcceptedFields(prev => ({ ...prev, [field]: true }));
  };

  const saveToStorage = useCallback((updates: Record<string, unknown>) => {
    if (!risk) return;
    
    const updateFn = isApproved ? updateApprovedRisk : updateDraftRisk;
    updateFn(id, updates as Partial<typeof risk>);
  }, [id, isApproved, risk]);

  const isDescriptionModifiedConsiderably = useCallback((desc: string) => {
    if (!originalDescription) return false;
    const originalWords = originalDescription.split(' ').length;
    const currentWords = desc.split(' ').length;
    const wordDiff = Math.abs(originalWords - currentWords);
    const charDiff = Math.abs(originalDescription.length - desc.length);
    return wordDiff > 5 || charDiff > 50;
  }, [originalDescription]);

  const updateTreatmentForScore = useCallback((newScore: number) => {
    const treatment = getTreatmentForScore(newScore);
    setTreatmentType(treatment.type);
    setTreatmentPlan(treatment.plan);
    setUpdatingFields(prev => ({ ...prev, treatment: false, treatmentType: false }));
    setAcceptedFields(prev => ({ ...prev, treatment: false, treatmentType: false }));
  }, []);

  const updateAiSuggestions = useCallback(() => {
    const newLikelihood = Math.min(5, Math.max(1, likelihood + (Math.random() > 0.5 ? 1 : -1)));
    const newImpact = Math.min(5, Math.max(1, impact + (Math.random() > 0.5 ? 1 : -1)));
    const newScore = Math.round((newLikelihood + newImpact) / 2);
    
    setLikelihood(newLikelihood);
    setImpact(newImpact);
    setScore(newScore);
    
    updateTreatmentForScore(newScore);
    
    setUpdatingFields({});
    lastProcessedDescription.current = description;
  }, [likelihood, impact, description, updateTreatmentForScore]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (
      isDescriptionModifiedConsiderably(description) && 
      description !== lastProcessedDescription.current
    ) {
      debounceTimer.current = setTimeout(() => {
        setUpdatingFields({ likelihood: true, impact: true, treatment: true, treatmentType: true, score: true });
        setAcceptedFields(prev => ({
          ...prev,
          likelihood: false,
          impact: false,
          treatment: false,
          treatmentType: false,
          score: false,
        }));

        setTimeout(() => {
          updateAiSuggestions();
        }, 500);
      }, 2000);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [description, isDescriptionModifiedConsiderably, updateAiSuggestions]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    saveToStorage({ title: value });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    acceptField('category');
    saveToStorage({ category: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    saveToStorage({ description: value });
  };

  const handleLikelihoodChange = (value: number) => {
    setLikelihood(value);
    const newScore = Math.round((value + impact) / 2);
    setScore(newScore);
    acceptField('likelihood');
    acceptField('score');
    saveToStorage({ likelihood: value as 1|2|3|4|5 });
    
    if (scoreUpdateTimer.current) {
      clearTimeout(scoreUpdateTimer.current);
    }
    setUpdatingFields(prev => ({ ...prev, treatment: true, treatmentType: true }));
    scoreUpdateTimer.current = setTimeout(() => {
      updateTreatmentForScore(newScore);
    }, 500);
  };

  const handleImpactChange = (value: number) => {
    setImpact(value);
    const newScore = Math.round((likelihood + value) / 2);
    setScore(newScore);
    acceptField('impact');
    acceptField('score');
    saveToStorage({ impact: value as 1|2|3|4|5 });
    
    if (scoreUpdateTimer.current) {
      clearTimeout(scoreUpdateTimer.current);
    }
    setUpdatingFields(prev => ({ ...prev, treatment: true, treatmentType: true }));
    scoreUpdateTimer.current = setTimeout(() => {
      updateTreatmentForScore(newScore);
    }, 500);
  };

  const handleScoreChange = (value: number) => {
    setScore(value);
    acceptField('score');
    saveToStorage({ likelihood: value as 1|2|3|4|5, impact: value as 1|2|3|4|5 });
    
    if (scoreUpdateTimer.current) {
      clearTimeout(scoreUpdateTimer.current);
    }
    setUpdatingFields(prev => ({ ...prev, treatment: true, treatmentType: true }));
    scoreUpdateTimer.current = setTimeout(() => {
      updateTreatmentForScore(value);
    }, 500);
  };

  const handleTreatmentTypeChange = (value: string) => {
    setTreatmentType(value);
    acceptField('treatmentType');
  };

  const handleApprove = () => {
    addApprovedRisk(risk!);
    setIsApproved(true);
    setToast({ open: true, message: `"${risk!.title}" has been approved and is ready for assessment.` });
  };

  const handleReject = () => {
    router.back();
  };
  
  if (!risk) {
    return (
      <Box>
        <Typography>Risk not found</Typography>
        <Button startIcon={<BackIcon />} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    );
  }

  const scoreColor = getSeverityColor(score);
  const isDraft = !isApproved;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getScoreLabel = (value: number) => {
    if (value >= 5) return 'Very high';
    if (value >= 4) return 'High';
    if (value >= 3) return 'Medium';
    if (value >= 2) return 'Low';
    return 'Very low';
  };

  const draftTabs = [
    { label: 'Details', index: 0 },
    { label: 'Relationships', index: 1 },
  ];

  const approvedTabs = [
    { label: 'Details', index: 0 },
    { label: 'Relationships', index: 1 },
    { label: 'Risk assessments', index: 2 },
    { label: 'Risk mitigations', index: 3 },
  ];

  const tabs = isDraft ? draftTabs : approvedTabs;

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary">
              Risk manager
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 0.5 }}>
              <IconButton onClick={() => router.back()} size="small" sx={{ ml: -1 }}>
                <BackIcon />
              </IconButton>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                {title || risk.title}
              </Typography>
              <Chip
                size="small"
                label={isDraft ? 'Draft' : 'Approved'}
                sx={isDraft 
                  ? { bgcolor: 'grey.300', color: 'grey.700' }
                  : { bgcolor: 'success.main', color: 'white' }
                }
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 0.5, ml: 5 }}>
              <Typography variant="caption" color="text.secondary">
                Id: RSK-{id.split('-')[1] || '001'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created at: {new Date().toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created by: {risk.suggestedOwner?.name || 'System'}
              </Typography>
            </Stack>
          </Box>
          {isDraft && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                onClick={handleReject}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={handleApprove}
              >
                Approve
              </Button>
            </Stack>
          )}
        </Stack>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          {tabs.map((tab) => (
            <Tab 
              key={tab.index} 
              label={tab.label} 
              sx={{ textTransform: 'none' }}
            />
          ))}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 9 }}>
            <AiField 
              label="Name" 
              required 
              accepted={acceptedFields.name || false} 
              onAccept={() => acceptField('name')}
            >
              <TextField
                fullWidth
                value={title}
                size="small"
                onChange={(e) => { handleTitleChange(e.target.value); acceptField('name'); }}
              />
            </AiField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Field label="Custom id">
              <TextField
                fullWidth
                defaultValue={`R-${id.split('-')[1]?.toUpperCase() || '1001'}`}
                size="small"
              />
            </Field>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <AiField 
              label="Owners" 
              accepted={acceptedFields.owner || false} 
              onAccept={() => acceptField('owner')}
            >
              <Select
                fullWidth
                size="small"
                defaultValue={risk.suggestedOwner?.name || ''}
                onChange={() => acceptField('owner')}
                renderValue={(value) => (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      avatar={<Avatar sx={{ width: 20, height: 20, bgcolor: getOwnerColor(String(value)) }}>{String(value).charAt(0)}</Avatar>}
                      label={value}
                      onDelete={() => {}}
                      deleteIcon={<CloseIcon />}
                    />
                  </Stack>
                )}
              >
                <MenuItem value={risk.suggestedOwner?.name}>{risk.suggestedOwner?.name}</MenuItem>
              </Select>
            </AiField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AiField 
              label="Risk category" 
              accepted={acceptedFields.category || false} 
              onAccept={() => acceptField('category')}
            >
              <Select 
                fullWidth 
                size="small" 
                value={category || risk.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <MenuItem value="operational">Operational</MenuItem>
                <MenuItem value="compliance">Compliance</MenuItem>
                <MenuItem value="financial">Financial</MenuItem>
                <MenuItem value="cyber">Cyber</MenuItem>
                <MenuItem value="strategic">Strategic</MenuItem>
              </Select>
            </AiField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <AiField 
            label="Org unit" 
            accepted={acceptedFields.orgUnit || false} 
            onAccept={() => acceptField('orgUnit')}
          >
            <Select 
              fullWidth 
              size="small" 
              defaultValue={risk.suggestedOwner?.department || ''}
              onChange={() => acceptField('orgUnit')}
            >
              <MenuItem value={risk.suggestedOwner?.department}>{risk.suggestedOwner?.department}</MenuItem>
              <MenuItem value="Operations">Operations</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="IT">Information Technology</MenuItem>
            </Select>
          </AiField>
        </Box>

        <Box sx={{ mt: 3 }}>
          <AiField 
            label="Description" 
            accepted={acceptedFields.description || false} 
            onAccept={() => acceptField('description')}
          >
            <TextField
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              size="small"
              placeholder="Modify the description to see AI suggestions update..."
            />
          </AiField>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Field label="Attachments">
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Drag files here or <Typography component="span" sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}>select files to upload</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Max. file size: 50 MB
              </Typography>
            </Paper>
          </Field>
        </Box>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Inherent score</Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <AiField 
              label="Likelihood"
              accepted={acceptedFields.likelihood || false} 
              onAccept={() => acceptField('likelihood')}
              updating={updatingFields.likelihood}
            >
              <Select
                fullWidth
                size="small"
                value={likelihood}
                onChange={(e) => handleLikelihoodChange(Number(e.target.value))}
                renderValue={(value) => (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, bgcolor: getSeverityColor(Number(value)), borderRadius: 0.5 }} />
                    <span>{value} - {getScoreLabel(Number(value))}</span>
                  </Stack>
                )}
              >
                {[1, 2, 3, 4, 5].map(v => (
                  <MenuItem key={v} value={v}>{v} - {getScoreLabel(v)}</MenuItem>
                ))}
              </Select>
            </AiField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <AiField 
              label="Impact"
              accepted={acceptedFields.impact || false} 
              onAccept={() => acceptField('impact')}
              updating={updatingFields.impact}
            >
              <Select
                fullWidth
                size="small"
                value={impact}
                onChange={(e) => handleImpactChange(Number(e.target.value))}
                renderValue={(value) => (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, bgcolor: getSeverityColor(Number(value)), borderRadius: 0.5 }} />
                    <span>{value} - {getScoreLabel(Number(value))}</span>
                  </Stack>
                )}
              >
                {[1, 2, 3, 4, 5].map(v => (
                  <MenuItem key={v} value={v}>{v} - {getScoreLabel(v)}</MenuItem>
                ))}
              </Select>
            </AiField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <AiField 
              label="Score"
              accepted={acceptedFields.score || false} 
              onAccept={() => acceptField('score')}
              updating={updatingFields.score}
            >
              <Select
                fullWidth
                size="small"
                value={score}
                onChange={(e) => handleScoreChange(Number(e.target.value))}
                renderValue={(value) => (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 12, height: 12, bgcolor: scoreColor, borderRadius: 0.5 }} />
                    <span>{value} - {getScoreLabel(Number(value))}</span>
                  </Stack>
                )}
              >
                {[1, 2, 3, 4, 5].map(v => (
                  <MenuItem key={v} value={v}>{v} - {getScoreLabel(v)}</MenuItem>
                ))}
              </Select>
            </AiField>
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Treatment</Typography>
        
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" component="label">
              Treatment type
            </Typography>
            {(!acceptedFields.treatmentType && !updatingFields.treatmentType) && (
              <Tooltip title="AI suggestion" arrow placement="top">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SparkleIcon 
                    sx={{ 
                      fontSize: 16,
                      background: AI_GRADIENT,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }} 
                  />
                </Box>
              </Tooltip>
            )}
            {updatingFields.treatmentType && (
              <Tooltip title="Updating suggestion..." arrow placement="top">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={14} sx={{ color: '#9C27B0' }} />
                </Box>
              </Tooltip>
            )}
          </Stack>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              row
              value={treatmentType}
              onChange={(e) => handleTreatmentTypeChange(e.target.value)}
            >
              <FormControlLabel value="accept" control={<Radio size="small" />} label="Accept" />
              <FormControlLabel value="remediate" control={<Radio size="small" />} label="Remediate" />
              <FormControlLabel value="transfer" control={<Radio size="small" />} label="Transfer" />
              <FormControlLabel value="avoid" control={<Radio size="small" />} label="Avoid" />
            </RadioGroup>
          </FormControl>
        </Box>
        
        <Box sx={{ mt: 3, mb: 3 }}>
          <AiField 
            label="Treatment plan"
            accepted={acceptedFields.treatment || false} 
            onAccept={() => acceptField('treatment')}
            updating={updatingFields.treatment}
          >
            <TextField
              fullWidth
              multiline
              rows={3}
              value={treatmentPlan}
              onChange={(e) => {
                setTreatmentPlan(e.target.value);
                acceptField('treatment');
              }}
              size="small"
            />
          </AiField>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No relationships configured yet.
          </Typography>
        </Paper>
      </TabPanel>

      {!isDraft && (
        <>
          <TabPanel value={tabValue} index={2}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No assessments configured yet.
              </Typography>
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {risk.mitigation && (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Linked Controls ({risk.mitigation.controls.length})
                </Typography>
                <Stack spacing={1}>
                  {risk.mitigation.controls.map((control) => (
                    <Stack
                      key={control.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {control.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {control.id}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={control.type}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}
          </TabPanel>
        </>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToast({ open: false, message: '' })} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
