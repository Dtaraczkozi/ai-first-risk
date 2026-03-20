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
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Close as CloseIcon,
  AutoAwesome as SparkleIcon,
  Check as ApproveIcon,
  FlagOutlined as OutlierIcon,
  AutoAwesome as AIBadgeIcon,
  AttachFile as FileAttachIcon,
  Verified as VerifiedIcon,
  Info as InfoIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { mockRiskSuggestions, additionalMockRisks } from '@/data/mock/analysis-session';
import { getSeverityColor, RISK_CATEGORY_COLORS } from '@/lib/utils';
import { getApprovedRisks, addApprovedRisk, getRiskById, updateDraftRisk, updateApprovedRisk } from '@/lib/risk-store';
import { MOCK_SYNTHESISED_ASSESSMENTS } from '@/data/mock/synthesis';
import type { SynthesisedAssessment } from '@/types/assessor-persona';

const AI_GRADIENT = 'linear-gradient(135deg, #5C6BC0 0%, #9C27B0 50%, #E91E63 100%)';

const categoryColors = RISK_CATEGORY_COLORS;

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

  // When the risk is already approved every field is considered accepted —
  // there are no pending AI suggestions to act on.
  const fieldAccepted = (field: string) => isApproved || (acceptedFields[field] ?? false);
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
          Go back
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
      <Box sx={{ mb: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <IconButton onClick={() => router.back()} size="small" sx={{ ml: -0.5 }}>
                <BackIcon />
              </IconButton>
              <Typography variant="caption" color="text.secondary">
                Risk manager
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h1" component="h1">
                {title || risk.title}
              </Typography>
              {(() => {
                const assessmentStatusConfig = {
                  unassessed: { label: 'Unassessed', bg: '#FADF6B', text: '#1a1a1a' },
                  in_progress: { label: 'In progress', bg: '#5DD3F3', text: '#1a1a1a' },
                  assessed:    { label: 'Assessed',    bg: '#9FE870', text: '#1a1a1a' },
                };
                const aStatus = risk?.assessmentStatus ?? 'unassessed';
                const aConfig = assessmentStatusConfig[aStatus];
                return (
                  <Chip
                    size="small"
                    label={isDraft ? 'Draft' : aConfig.label}
                    sx={isDraft
                      ? { bgcolor: 'rgba(100,116,139,0.2)', color: '#94a3b8' }
                      : { bgcolor: aConfig.bg, color: aConfig.text, fontWeight: 500 }
                    }
                  />
                );
              })()}
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 0.75, ml: 0 }}>
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
              accepted={fieldAccepted('name')} 
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
              accepted={fieldAccepted('owner')} 
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
              accepted={fieldAccepted('category')} 
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
            accepted={fieldAccepted('orgUnit')} 
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
            accepted={fieldAccepted('description')} 
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
              accepted={fieldAccepted('likelihood')} 
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
              accepted={fieldAccepted('impact')} 
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
              accepted={fieldAccepted('score')} 
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
            {(!fieldAccepted('treatmentType') && !updatingFields.treatmentType) && (
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
            accepted={fieldAccepted('treatment')} 
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
            {(() => {
              const RESULTS_BY_CATEGORY: Record<string, number> = { cyber: 0, financial: 1, compliance: 2 };
              const synthIdx = RESULTS_BY_CATEGORY[risk.category] ?? 0;
              const synthesis: SynthesisedAssessment = MOCK_SYNTHESISED_ASSESSMENTS[synthIdx] ?? MOCK_SYNTHESISED_ASSESSMENTS[0];
              const synthScore = (synthesis.synthesisedLikelihood + synthesis.synthesisedImpact) / 2;
              const SCORE_COLOR: Record<number, string> = { 1: '#7ECDA0', 2: '#4ade80', 3: '#C29A1D', 4: '#E54E54', 5: '#C42B31' };
              const SCORE_LABEL: Record<number, string> = { 1: 'Very low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very high' };
              const getScoreColor = (v: number) => v >= 4.5 ? '#C42B31' : v >= 3.5 ? '#E54E54' : v >= 2.5 ? '#C29A1D' : v >= 1.5 ? '#4ade80' : '#7ECDA0';

              return (
                <Stack spacing={3}>
                  {/* Summary card */}
                  <Paper variant="outlined" sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Typography variant="h3">Assessment summary</Typography>
                      <Button component={Link} href={`/assessments/results/${encodeURIComponent(risk.category)}`}
                        variant="outlined" size="small" endIcon={<OpenInNewIcon />}>
                        Full results
                      </Button>
                    </Stack>
                    <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25 }}>Likelihood</Typography>
                        <Typography variant="h3" sx={{ color: getScoreColor(synthesis.synthesisedLikelihood) }}>
                          {synthesis.synthesisedLikelihood.toFixed(1)}
                          <Typography component="span" variant="caption" color="text.disabled"> / 5</Typography>
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25 }}>Impact</Typography>
                        <Typography variant="h3" sx={{ color: getScoreColor(synthesis.synthesisedImpact) }}>
                          {synthesis.synthesisedImpact.toFixed(1)}
                          <Typography component="span" variant="caption" color="text.disabled"> / 5</Typography>
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25 }}>Overall</Typography>
                        <Typography variant="h3" sx={{ color: getScoreColor(synthScore) }}>
                          {synthScore.toFixed(1)}
                          <Typography component="span" variant="caption" color="text.disabled"> / 5</Typography>
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>Confidence</Typography>
                        <Chip size="small" label={synthesis.confidenceLevel} variant="outlined" sx={{ height: 24 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.25 }}>Assessors</Typography>
                        <Typography variant="body2">{synthesis.opinions.length}</Typography>
                      </Box>
                      {synthesis.outlierFlags.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>Outliers</Typography>
                          <Chip size="small" label={`${synthesis.outlierFlags.length} flagged`}
                            icon={<OutlierIcon sx={{ fontSize: '11px !important', color: '#fbbf24 !important' }} />}
                            sx={{ height: 22, fontSize: '0.72rem', bgcolor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }} />
                        </Box>
                      )}
                    </Stack>
                    {synthesis.whatChangedSinceLastTime && (
                      <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)' }}>
                        <Stack direction="row" spacing={0.75} alignItems="flex-start">
                          <InfoIcon sx={{ fontSize: 14, color: '#60a5fa', mt: 0.1, flexShrink: 0 }} />
                          <Typography variant="caption" color="text.secondary">{synthesis.whatChangedSinceLastTime}</Typography>
                        </Stack>
                      </Box>
                    )}
                  </Paper>

                  {/* Per-assessor cards */}
                  <Typography variant="h3">Individual assessor opinions</Typography>
                  {synthesis.opinions.map((op) => {
                    const isAI = op.assessorType === 'ai_persona';
                    const score = Math.round((op.likelihood + op.impact) / 2);
                    const isOutlier = synthesis.outlierFlags.includes(op.assessorId);
                    const aiOwnerColors: Record<string, string> = { 'Sarah Chen': '#0060C7', 'Michael Torres': '#C42B31', 'Jennifer Walsh': '#9530DC', 'David Park': '#009999', 'Robert Kim': '#C29A1D' };

                    return (
                      <Paper key={op.assessorId} variant="outlined" sx={{
                        p: 2,
                        border: isOutlier ? '1px solid rgba(251,191,36,0.3)' : isAI ? '1px solid rgba(96,165,250,0.15)' : undefined,
                        bgcolor: isAI ? 'rgba(96,165,250,0.03)' : undefined,
                      }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.72rem', bgcolor: isAI ? '#1e3a5f' : aiOwnerColors[op.assessorName] || '#374151' }}>
                              {isAI ? '✦' : op.assessorName.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Box>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="h4">{op.assessorName.replace(' Persona', '')}</Typography>
                                {isOutlier && (
                                  <Chip size="small" label="Outlier"
                                    icon={<OutlierIcon sx={{ fontSize: '11px !important', color: '#fbbf24 !important' }} />}
                                    sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }} />
                                )}
                              </Stack>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                {isAI && <AIBadgeIcon sx={{ fontSize: 10, color: '#60a5fa' }} />}
                                <Typography variant="caption" color="text.disabled">{isAI ? 'AI assessor' : 'Human assessor'}</Typography>
                              </Stack>
                            </Box>
                          </Stack>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {[{ l: 'L', v: op.likelihood }, { l: 'I', v: op.impact }].map(s => (
                              <Box key={s.l} sx={{ textAlign: 'center' }}>
                                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: '0.65rem' }}>{s.l}</Typography>
                                <Typography variant="h5" sx={{ color: SCORE_COLOR[s.v], fontWeight: 700 }}>{s.v}</Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>{SCORE_LABEL[s.v]}</Typography>
                              </Box>
                            ))}
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: '0.65rem' }}>Score</Typography>
                              <Typography variant="h4" sx={{ color: SCORE_COLOR[score], fontWeight: 700 }}>{score}</Typography>
                              <Chip size="small" label={op.confidence} variant="outlined" sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }} />
                            </Box>
                          </Stack>
                        </Stack>
                        <Divider sx={{ mb: 1.5 }} />
                        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', display: 'block', mb: 0.5 }}>Written assessment</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{op.rationale}</Typography>
                        </Box>
                        {isAI && (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            <FileAttachIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            <Chip size="small" label={`${op.assessorName.replace(' Persona', '').replace(' ', '_')}_Analysis.pdf`}
                              variant="outlined" sx={{ height: 20, fontSize: '0.65rem', cursor: 'pointer' }} />
                          </Stack>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              );
            })()}
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
                      sx={{ p: 1.5, bgcolor: 'rgba(13, 17, 23, 0.5)', borderRadius: 1, border: '1px solid rgba(96, 165, 250, 0.08)' }}
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
