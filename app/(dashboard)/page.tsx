'use client';

import { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Alert,
  Fade,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Grid,
  Tooltip,
  Drawer,
  TextField,
  Select,
  MenuItem,
  Snackbar,
  Skeleton,
  InputAdornment,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  Menu,
  Badge,
  Divider,
} from '@mui/material';
import {
  Celebration as CelebrationIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  AutoAwesome as AgentIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as CompetitorIcon,
  Article as NewsIcon,
  TrendingUp as TrendIcon,
  Gavel as RegulatoryIcon,
  Description as DocumentIcon,
  Lightbulb as NewRiskIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { DocumentUpload } from '@/components/agent/DocumentUpload';
import { AnalysisProgress } from '@/components/agent/AnalysisProgress';
import { TableToolbar } from '@/components/TableToolbar';
import type { AnalysisSession, UploadedDocument, RiskSuggestion, DataSource } from '@/types/document';
import {
  mockDocuments,
  mockDataSources,
  mockRiskSuggestions,
  analysisSteps,
  additionalMockRisks,
} from '@/data/mock/analysis-session';
import { getSeverityColor } from '@/lib/utils';
import { addApprovedRisk, getApprovedRisks } from '@/lib/risk-store';

type AppState = 'upload' | 'uploading' | 'analyzing' | 'review' | 'completed';

const STORAGE_KEY = 'risk-discovery-state';

const categoryColors: Record<string, string> = {
  operational: '#0060C7',
  compliance: '#9530DC',
  financial: '#009999',
  cyber: '#C42B31',
  strategic: '#C29A1D',
};

const sourceTypeLabels: Record<string, string> = {
  document: 'Internal',
  competitor: 'Competitor',
  '10k_filing': 'Regulatory',
  news: 'News',
  trend: 'Trends',
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

const availableOwners = [
  { name: 'Sarah Chen', role: 'VP of Operations', department: 'Operations' },
  { name: 'Michael Torres', role: 'CISO', department: 'Information Technology' },
  { name: 'Jennifer Walsh', role: 'Chief Compliance Officer', department: 'Legal & Compliance' },
  { name: 'David Park', role: 'VP of Human Resources', department: 'Human Resources' },
  { name: 'Robert Kim', role: 'Chief Strategy Officer', department: 'Strategy' },
];

const categories = ['operational', 'compliance', 'financial', 'cyber', 'strategic'];

const scoreOptions = [
  { value: 1, label: 'Very low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Very high' },
];

interface FieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

function Field({ label, children, required }: FieldProps) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="body2" component="label" sx={{ mb: 0.5, display: 'block' }}>
        {label}
        {required && <Typography component="span" color="error.main"> *</Typography>}
      </Typography>
      {children}
    </Box>
  );
}

function getScoreLabel(value: number) {
  if (value >= 5) return 'Very high';
  if (value >= 4) return 'High';
  if (value >= 3) return 'Medium';
  if (value >= 2) return 'Low';
  return 'Very low';
}

interface AddRiskSideSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (risk: RiskSuggestion) => void;
}

function AddRiskSideSheet({ open, onClose, onSave }: AddRiskSideSheetProps) {
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [owner, setOwner] = useState('');
  const [category, setCategory] = useState('operational');
  const [orgUnit, setOrgUnit] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    const newRisk: RiskSuggestion = {
      id: `manual-${Date.now()}`,
      title: name,
      description,
      category: category as RiskSuggestion['category'],
      severity: 3 as 1 | 2 | 3 | 4 | 5,
      likelihood: 3 as 1 | 2 | 3 | 4 | 5,
      impact: 3 as 1 | 2 | 3 | 4 | 5,
      reasoning: 'Manually created risk',
      sources: [],
      status: 'pending',
      suggestedOwner: owner ? { name: owner, role: '', department: orgUnit } : undefined,
      createdAt: new Date(),
    };
    onSave(newRisk);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setCustomId('');
    setOwner('');
    setCategory('operational');
    setOrgUnit('');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 480 }, p: 3 }
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Add risk manually
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <RejectIcon />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Field label="Name" required>
          <TextField
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter risk name"
          />
        </Field>

        <Field label="Custom id">
          <TextField
            fullWidth
            size="small"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="e.g., R-1001"
          />
        </Field>

        <Field label="Owner">
          <TextField
            fullWidth
            size="small"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Enter owner name"
          />
        </Field>

        <Field label="Risk category">
          <Select
            fullWidth
            size="small"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <MenuItem value="operational">Operational</MenuItem>
            <MenuItem value="compliance">Compliance</MenuItem>
            <MenuItem value="financial">Financial</MenuItem>
            <MenuItem value="cyber">Cyber</MenuItem>
            <MenuItem value="strategic">Strategic</MenuItem>
          </Select>
        </Field>

        <Field label="Org unit">
          <TextField
            fullWidth
            size="small"
            value={orgUnit}
            onChange={(e) => setOrgUnit(e.target.value)}
            placeholder="Enter organizational unit"
          />
        </Field>

        <Field label="Description">
          <TextField
            fullWidth
            size="small"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the risk"
          />
        </Field>

        <Field label="Attachments">
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Drag files here or <Typography component="span" sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}>select files</Typography>
            </Typography>
          </Paper>
        </Field>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button variant="outlined" onClick={handleClose} fullWidth>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          fullWidth
          disabled={!name.trim()}
        >
          Save risk
        </Button>
      </Stack>
    </Drawer>
  );
}

function RiskSummaryStats({ suggestions, approvedCount }: { suggestions: RiskSuggestion[]; approvedCount: number }) {
  const totalIdentified = suggestions.length + approvedCount;
  const pendingCount = suggestions.length;
  const highSeverityCount = suggestions.filter(r => r.likelihood * r.impact >= 15).length;

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 3, height: 96, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} variant="outlined">
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1, color: '#1976d2' }}>
              {totalIdentified}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Risks Identified
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 3, height: 96, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} variant="outlined">
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1, color: '#ed6c02' }}>
              {pendingCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending Review
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 3, height: 96, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} variant="outlined">
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1, color: '#2e7d32' }}>
              {approvedCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Approved
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper sx={{ p: 3, height: 96, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} variant="outlined">
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1, color: '#9e9e9e' }}>
              {highSeverityCount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              High Severity
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function RiskDiscoveryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [appState, setAppState] = useState<AppState>('upload');
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [suggestions, setSuggestions] = useState<RiskSuggestion[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [identificationRuns, setIdentificationRuns] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sideSheetOpen, setSideSheetOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [loadingRiskIds, setLoadingRiskIds] = useState<Set<string>>(new Set());
  const [pendingRisks, setPendingRisks] = useState<RiskSuggestion[]>([]);
  const [showUploadUI, setShowUploadUI] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [loadingDocIds, setLoadingDocIds] = useState<Set<string>>(new Set());
  
  // Toolbar state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const tableRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['risk', 'category', 'score', 'owner', 'sources', 'status', 'actions']);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [filterNewRisks, setFilterNewRisks] = useState(false);

  // Single source of truth for external source groups (used by section cards and table filter)
  const externalSourceGroups = [
    { key: 'competitor' as const, types: ['competitor'] as const },
    { key: 'news' as const, types: ['news'] as const },
    { key: 'regulatory' as const, types: ['10k_filing', 'trend'] as const },
  ];
  
  // Filter and column definitions for the toolbar
  const filterOptions = [
    {
      id: 'source',
      label: 'Source',
      type: 'select' as const,
      options: [
        { value: 'internal', label: 'Internal only' },
        { value: 'external', label: 'External only' },
        { value: 'external_competitor', label: 'Competitor intelligence' },
        { value: 'external_news', label: 'News & media' },
        { value: 'external_regulatory', label: 'Regulatory & market trends' },
      ],
    },
    {
      id: 'category',
      label: 'Category',
      type: 'multiselect' as const,
      options: categories.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
    },
    {
      id: 'score',
      label: 'Inherent Score',
      type: 'multiselect' as const,
      options: scoreOptions.map(s => ({ value: String(s.value), label: s.label })),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'approved', label: 'Approved' },
      ],
    },
  ];
  
  const columnOptions = [
    { id: 'risk', label: 'Risk' },
    { id: 'category', label: 'Category' },
    { id: 'score', label: 'Inherent score' },
    { id: 'owner', label: 'Owner' },
    { id: 'sources', label: 'Sources' },
    { id: 'status', label: 'Status' },
  ];
  
  const handleFilterChange = (filterId: string, value: string | string[]) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };
  
  const handleClearFilters = () => {
    setActiveFilters({});
    setFilterNewRisks(false);
  };
  
  const handleColumnToggle = (columnId: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(c => c !== columnId)
        : [...prev, columnId]
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEY);
      let hasExistingData = false;
      
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.appState === 'review' || parsed.appState === 'completed') {
            hasExistingData = true;
            setAppState(parsed.appState);
            setDocuments(parsed.documents || mockDocuments);
            
            const approvedRisks = getApprovedRisks();
            const approvedTitles = new Set(approvedRisks.map(r => r.title.toLowerCase()));
            const savedSuggestions = parsed.suggestions || mockRiskSuggestions;
            const filteredSuggestions = savedSuggestions.filter(
              (r: RiskSuggestion) => !approvedTitles.has(r.title.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
            
            setDataSources(parsed.dataSources || mockDataSources);
            setApprovedCount(parsed.approvedCount || 0);
            setRejectedCount(parsed.rejectedCount || 0);
            setIdentificationRuns(parsed.identificationRuns || 1);
          }
        } catch (e) {
          console.error('Failed to parse saved state', e);
        }
      }
      
      if (searchParams.get('new') === 'true' && hasExistingData) {
        setShowUploadUI(true);
        router.replace('/', { scroll: false });
      }
      
      setIsInitialized(true);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (isInitialized && (appState === 'review' || appState === 'completed')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        appState,
        documents,
        suggestions,
        dataSources,
        approvedCount,
        rejectedCount,
        identificationRuns,
      }));
    }
  }, [appState, documents, suggestions, dataSources, approvedCount, rejectedCount, identificationRuns, isInitialized]);

  const handleNewIdentification = useCallback(() => {
    setShowUploadUI(true);
  }, []);

  const startUpload = useCallback(() => {
    setShowUploadUI(false);
    setAppState('uploading');
    setUploadProgress(0);
    
    const allDocIds = new Set(mockDocuments.map(d => d.id));
    setLoadingDocIds(allDocIds);
    setDocuments(mockDocuments);
    
    let progress = 0;
    let revealedDocs = 0;
    const docsPerStep = Math.ceil(mockDocuments.length / 5);
    
    const uploadInterval = setInterval(() => {
      progress += 10;
      setUploadProgress(Math.min(progress, 100));
      
      if (progress >= 30 && revealedDocs < mockDocuments.length) {
        const toReveal = mockDocuments.slice(revealedDocs, revealedDocs + docsPerStep);
        setLoadingDocIds(prev => {
          const newSet = new Set(prev);
          toReveal.forEach(d => newSet.delete(d.id));
          return newSet;
        });
        revealedDocs += docsPerStep;
      }
      
      if (progress >= 100) {
        clearInterval(uploadInterval);
        setLoadingDocIds(new Set());
        setTimeout(() => startAnalysis(), 800);
      }
    }, 500);
  }, []);

  const startAnalysis = useCallback(() => {
    setAppState('analyzing');
    
    const newSession: AnalysisSession = {
      id: `session-${Date.now()}`,
      status: 'uploading',
      documents: mockDocuments,
      dataSources: [],
      suggestions: [],
      progress: 0,
      currentStep: 'Processing uploaded documents',
      startedAt: new Date(),
    };
    setSession(newSession);

    const existingTitles = new Set(suggestions.map(r => r.title.toLowerCase()));
    const approvedRisks = getApprovedRisks();
    const approvedTitles = new Set(approvedRisks.map(r => r.title.toLowerCase()));
    
    let newRisksToAdd: RiskSuggestion[];
    const risksPerRun = 6;
    if (identificationRuns === 0) {
      newRisksToAdd = mockRiskSuggestions;
    } else {
      const risksToAdd: RiskSuggestion[] = [];
      for (let i = 0; i < risksPerRun; i++) {
        const idx = ((identificationRuns - 1) * risksPerRun + i) % additionalMockRisks.length;
        risksToAdd.push(additionalMockRisks[idx]);
      }
      newRisksToAdd = risksToAdd.map(r => ({
        ...r,
        id: `${r.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));
    }
    
    const uniqueNewRisks = newRisksToAdd.filter(r => 
      !existingTitles.has(r.title.toLowerCase()) && 
      !approvedTitles.has(r.title.toLowerCase())
    );
    
    setPendingRisks(uniqueNewRisks);
    let revealedCount = 0;

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex >= analysisSteps.length) {
        clearInterval(progressInterval);
        return;
      }

      const step = analysisSteps[stepIndex];
      const progress = Math.min(100, Math.round(((stepIndex + 1) / analysisSteps.length) * 100));

      setSession(prev => prev ? {
        ...prev,
        status: step.status as AnalysisSession['status'],
        currentStep: step.label,
        progress,
      } : null);

      if (stepIndex >= 2) {
        setDataSources(mockDataSources.slice(0, stepIndex));
      }

      if (step.status === 'researching_external') {
        const skeletonIds = new Set(uniqueNewRisks.map(r => r.id));
        setLoadingRiskIds(skeletonIds);
        setSuggestions(prev => [...uniqueNewRisks, ...prev]);
      }

      if (step.status === 'generating_risks') {
        const revealCount = Math.ceil(uniqueNewRisks.length / 2);
        const toReveal = uniqueNewRisks.slice(0, revealCount);
        setLoadingRiskIds(prev => {
          const newSet = new Set(prev);
          toReveal.forEach(r => newSet.delete(r.id));
          return newSet;
        });
        revealedCount = revealCount;
      }

      if (step.status === 'deduplicating') {
        const remaining = uniqueNewRisks.slice(revealedCount);
        setLoadingRiskIds(prev => {
          const newSet = new Set(prev);
          remaining.forEach(r => newSet.delete(r.id));
          return newSet;
        });
      }

      if (step.status === 'ready_for_review') {
        setTimeout(() => {
          setAppState('review');
          setLoadingRiskIds(new Set());
          setPendingRisks([]);
          setDataSources(mockDataSources);
          setIdentificationRuns(prev => prev + 1);
          setToast({ 
            open: true, 
            message: `${uniqueNewRisks.length} risks have been identified from ${mockDataSources.length} sources.` 
          });
        }, 800);
      }

      stepIndex++;
    }, 2500);

    return () => clearInterval(progressInterval);
  }, [identificationRuns, suggestions]);

  const handleApprove = (id: string) => {
    const risk = suggestions.find(s => s.id === id);
    if (risk) {
      addApprovedRisk(risk);
      setToast({ open: true, message: `"${risk.title}" has been approved and is ready for assessment.` });
    }
    setSuggestions(prev => prev.filter(s => s.id !== id));
    setApprovedCount(prev => prev + 1);
  };

  const handleReject = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleAddManualRisk = (risk: RiskSuggestion) => {
    setSuggestions(prev => [...prev, risk]);
    if (appState === 'upload') {
      setAppState('review');
      setDocuments([]);
      setDataSources([]);
    }
  };

  const updateRisk = (id: string, updates: Partial<RiskSuggestion>) => {
    setSuggestions(prev => prev.map(risk => 
      risk.id === id ? { ...risk, ...updates } : risk
    ));
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const allProcessed = suggestions.length > 0 && pendingSuggestions.length === 0;

  useEffect(() => {
    if (allProcessed && appState === 'review') {
      setAppState('completed');
    }
  }, [allProcessed, appState]);

  const resetApp = () => {
    setAppState('upload');
    setDocuments([]);
    setUploadProgress(0);
    setSession(null);
    setSuggestions([]);
    setDataSources([]);
    setApprovedCount(0);
    setRejectedCount(0);
    setIdentificationRuns(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasExistingRisks = suggestions.length > 0 || approvedCount > 0;
  const isProcessing = appState === 'uploading' || appState === 'analyzing';

  return (
    <Box>
      <AddRiskSideSheet 
        open={sideSheetOpen} 
        onClose={() => setSideSheetOpen(false)}
        onSave={handleAddManualRisk}
      />

      {/* Header - always visible */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Risk Discovery
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<AgentIcon />}
            onClick={handleNewIdentification}
            disabled={isProcessing || showUploadUI}
          >
            New Identification
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setSideSheetOpen(true)}
          >
            Add Manually
          </Button>
        </Stack>
      </Stack>

      {/* Upload UI - shown when user clicks New Identification */}
      <Collapse in={showUploadUI && !isProcessing} timeout={400}>
        <Paper 
          sx={{ 
            p: 3, 
            mb: 3, 
            position: 'relative',
            transition: 'all 0.3s ease',
          }} 
          variant="outlined"
        >
          <IconButton
            size="small"
            onClick={() => setShowUploadUI(false)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Import organization data
          </Typography>
          <DocumentUpload
            documents={[]}
            isUploading={false}
            uploadProgress={0}
            onStartUpload={startUpload}
            loadingDocIds={loadingDocIds}
          />
        </Paper>
      </Collapse>

      {/* Upload/Analysis section - shown when processing or when no existing risks */}
      <Collapse in={(appState === 'upload' || appState === 'uploading' || appState === 'analyzing') && !hasExistingRisks && !showUploadUI} timeout={400}>
        <Box sx={{ transition: 'all 0.3s ease' }}>
          {appState === 'upload' && (
            <DocumentUpload
              documents={documents}
              isUploading={false}
              uploadProgress={uploadProgress}
              onStartUpload={startUpload}
              loadingDocIds={loadingDocIds}
            />
          )}
          
          {(appState === 'uploading' || appState === 'analyzing') && (
            <Stack spacing={3}>
              <Fade in={appState === 'uploading'} timeout={300} unmountOnExit>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Importing documents
                  </Typography>
                  <DocumentUpload
                    documents={documents}
                    isUploading={true}
                    uploadProgress={uploadProgress}
                    onStartUpload={startUpload}
                    loadingDocIds={loadingDocIds}
                  />
                </Paper>
              </Fade>
              
              <Fade in={appState === 'analyzing'} timeout={500}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Analyzing data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Processing documents and gathering external sources.
                  </Typography>
                  
                  {session && <AnalysisProgress session={session} />}

                  {dataSources.length > 0 && (
                    <Fade in timeout={400}>
                      <Paper sx={{ mt: 2, p: 2 }} variant="outlined">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          External sources found
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {dataSources.map((source, srcIdx) => (
                            <Chip
                              key={`source-${source.id}-${srcIdx}`}
                              size="small"
                              label={source.name}
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </Paper>
                    </Fade>
                  )}
                </Box>
              </Fade>
            </Stack>
          )}
        </Box>
      </Collapse>

      {/* Processing overlay when there are existing risks */}
      <Collapse in={isProcessing && hasExistingRisks} timeout={400}>
        <Paper sx={{ p: 2, mb: 3, transition: 'all 0.3s ease' }} variant="outlined">
          <Fade in={appState === 'uploading'} timeout={300} unmountOnExit>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Importing documents
              </Typography>
              <DocumentUpload
                documents={documents}
                isUploading={true}
                uploadProgress={uploadProgress}
                onStartUpload={startUpload}
                loadingDocIds={loadingDocIds}
              />
            </Box>
          </Fade>
          <Fade in={appState === 'analyzing' && session !== null} timeout={500}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Analyzing data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Processing documents and gathering external sources.
              </Typography>
              
              {session && <AnalysisProgress session={session} />}

              {dataSources.length > 0 && (
                <Fade in timeout={400}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                      External sources found
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {dataSources.map((source, srcIdx) => (
                        <Chip
                          key={`source-${source.id}-${srcIdx}`}
                          size="small"
                          label={source.name}
                          variant="outlined"
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Fade>
              )}
            </Box>
          </Fade>
        </Paper>
      </Collapse>

      {/* Existing risks section - always visible when there are risks */}
      <Collapse in={hasExistingRisks} timeout={400}>
        <Box sx={{ transition: 'all 0.3s ease' }}>
          <Collapse in={appState === 'completed'} timeout={300}>
            <Alert
              severity="success"
              icon={<CelebrationIcon />}
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={handleNewIdentification}>
                  Start New
                </Button>
              }
            >
              Review complete. {approvedCount} risks added to register.
            </Alert>
          </Collapse>

            <RiskSummaryStats suggestions={suggestions} approvedCount={approvedCount} />

            {/* Intelligence Overview Section */}
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1.5, mt: 1 }}>
              Intelligence overview
            </Typography>
            {dataSources.length > 0 && (
              <Paper 
                variant="outlined"
                sx={{ 
                  mb: 2, 
                  overflow: 'hidden',
                  p: 3,
                }}
              >
                <Box 
                  sx={{ 
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    if (sourcesExpanded) {
                      setSourcesExpanded(false);
                      setFilterNewRisks(false);
                    } else {
                      setSourcesExpanded(true);
                    }
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                        Emerging external risks
                      </Typography>
                      
                      {/* Aggregated overview - always visible */}
                      {(() => {
                        const competitorRisks = suggestions.filter(s => s.sources?.some(src => src.type === 'competitor')).length;
                        const newsRisks = suggestions.filter(s => s.sources?.some(src => src.type === 'news')).length;
                        const regulatoryRisks = suggestions.filter(s => s.sources?.some(src => src.type === '10k_filing' || src.type === 'trend')).length;
                        
                        return (
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 4 }}>
                              <Stack spacing={0.5}>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                  <CompetitorIcon sx={{ fontSize: 16, color: '#282E37' }} />
                                  <Typography variant="caption" color="text.secondary">Competitors</Typography>
                                </Stack>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {competitorRisks}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <Stack spacing={0.5}>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                  <NewsIcon sx={{ fontSize: 16, color: '#282E37' }} />
                                  <Typography variant="caption" color="text.secondary">News</Typography>
                                </Stack>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {newsRisks}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <Stack spacing={0.5}>
                                <Stack direction="row" spacing={0.75} alignItems="center">
                                  <RegulatoryIcon sx={{ fontSize: 16, color: '#282E37' }} />
                                  <Typography variant="caption" color="text.secondary">Regulatory</Typography>
                                </Stack>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {regulatoryRisks}
                                </Typography>
                              </Stack>
                            </Grid>
                          </Grid>
                        );
                      })()}
                    </Box>
                    <IconButton size="small" sx={{ ml: 1 }}>
                      {sourcesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Stack>
                </Box>
                
                <Collapse in={sourcesExpanded}>
                  <Box sx={{ mt: 3 }}>
                  {/* Expanded details - source group list */}
                  {(() => {
                    const externalRisks = suggestions.filter(s => s.sources?.some(src => src.type !== 'document'));
                    const sourceGroupLabels: Record<string, { label: string; icon: React.ReactNode }> = {
                      competitor: { label: 'Competitor intelligence', icon: <CompetitorIcon sx={{ fontSize: 18, color: '#282E37' }} /> },
                      news: { label: 'News & media', icon: <NewsIcon sx={{ fontSize: 18, color: '#282E37' }} /> },
                      regulatory: { label: 'Regulatory & market trends', icon: <RegulatoryIcon sx={{ fontSize: 18, color: '#282E37' }} /> },
                    };
                    const sourceGroups = externalSourceGroups.map(group => ({
                      ...group,
                      ...sourceGroupLabels[group.key],
                    }));
                    
                    const groupedRisks = sourceGroups.map(group => ({
                      ...group,
                      risks: externalRisks.filter(r => r.sources?.some(s => (group.types as readonly string[]).includes(s.type))),
                    })).filter(g => g.risks.length > 0);
                    
                    if (groupedRisks.length === 0) {
                      return (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                          No risks from external sources yet. External sources are continuously monitored.
                        </Typography>
                      );
                    }
                    
                    return (
                      <Stack spacing={2}>
                        {groupedRisks.map(({ key, types, label, icon, risks }, groupIdx) => {
                          const isSelected = activeFilters.source === `external_${key}`;
                          return (
                          <Paper
                            key={`external-source-${key}-${groupIdx}`}
                            variant="outlined"
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              ...(isSelected && {
                                bgcolor: 'primary.50',
                                borderColor: 'primary.main',
                                borderWidth: 2,
                              }),
                              '&:hover': { 
                                bgcolor: isSelected ? 'primary.50' : 'grey.50',
                                borderColor: 'primary.main',
                              },
                            }}
                            onClick={() => {
                              setActiveFilters(prev => ({ ...prev, source: `external_${key}` }));
                              setTimeout(() => {
                                tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 100);
                            }}
                          >
                            <Stack direction="row" spacing={2} alignItems="center">
                              {icon}
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {risks.length} {risks.length === 1 ? 'risk' : 'risks'} identified
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                          );
                        })}
                      </Stack>
                    );
                  })()}
                  </Box>
                </Collapse>
              </Paper>
            )}

            {/* Risk Suggestions Section */}
            <Box ref={tableRef}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1.5, mt: 2 }}>
                Risk suggestions
              </Typography>
            </Box>

            {/* Toolbar */}
            <TableToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search risks..."
              filters={filterOptions}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              columns={columnOptions}
              visibleColumns={visibleColumns}
              onColumnToggle={handleColumnToggle}
              additionalActions={
                filterNewRisks ? (
                  <Chip
                    size="small"
                    label="New risks"
                    onDelete={() => setFilterNewRisks(false)}
                    color="primary"
                    sx={{ height: 24, fontSize: '0.75rem' }}
                  />
                ) : undefined
              }
            />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {visibleColumns.includes('risk') && <TableCell>Risk</TableCell>}
                    {visibleColumns.includes('category') && <TableCell>Category</TableCell>}
                    {visibleColumns.includes('score') && <TableCell>Inherent score</TableCell>}
                    {visibleColumns.includes('owner') && <TableCell>Owner</TableCell>}
                    {visibleColumns.includes('sources') && <TableCell>Sources</TableCell>}
                    {visibleColumns.includes('status') && <TableCell>Status</TableCell>}
                    {visibleColumns.includes('actions') && <TableCell width={80} align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const filtered = suggestions.filter((risk) => {
                      // Search filter
                      if (searchTerm) {
                        const search = searchTerm.toLowerCase();
                        const matchesSearch = 
                          risk.title.toLowerCase().includes(search) ||
                          risk.description.toLowerCase().includes(search) ||
                          risk.category.toLowerCase().includes(search) ||
                          risk.suggestedOwner?.name.toLowerCase().includes(search);
                        if (!matchesSearch) return false;
                      }
                      
                      // Source filter (must match logic used by external source cards above)
                      const sourceFilter = activeFilters.source as string;
                      if (sourceFilter && sourceFilter !== 'all') {
                        const hasInternal = risk.sources?.some(s => s?.type === 'document');
                        const hasExternal = risk.sources?.some(s => s?.type !== 'document');
                        if (sourceFilter === 'internal' && !hasInternal) return false;
                        if (sourceFilter === 'external' && !hasExternal) return false;
                        const externalGroup = externalSourceGroups.find(g => sourceFilter === `external_${g.key}`);
                        if (externalGroup) {
                          const hasMatchingSource = risk.sources?.some(s => s?.type && (externalGroup.types as readonly string[]).includes(s.type));
                          if (!hasMatchingSource) return false;
                        }
                      }
                      
                      // Category filter
                      const categoryFilter = activeFilters.category as string[];
                      if (categoryFilter && categoryFilter.length > 0) {
                        if (!categoryFilter.includes(risk.category)) return false;
                      }
                      
                      // Score filter
                      const scoreFilter = activeFilters.score as string[];
                      if (scoreFilter && scoreFilter.length > 0) {
                        const inherentScore = Math.round((risk.likelihood + risk.impact) / 2);
                        if (!scoreFilter.includes(String(inherentScore))) return false;
                      }
                      
                      // New risks filter (shows first 6 most recent)
                      if (filterNewRisks) {
                        const recentIds = suggestions.slice(0, 6).map(r => r.id);
                        if (!recentIds.includes(risk.id)) return false;
                      }
                      
                      return true;
                    });
                    // Dedupe by risk.id so React never sees duplicate keys
                    const seenIds = new Set<string>();
                    const deduped = filtered.filter((risk) => {
                      if (seenIds.has(risk.id)) return false;
                      seenIds.add(risk.id);
                      return true;
                    });
                    return deduped;
                  })().map((risk) => {
                    const inherentScore = Math.round((risk.likelihood + risk.impact) / 2);
                    const isLoading = loadingRiskIds.has(risk.id);
                    
                    if (isLoading) {
                      return (
                        <TableRow key={risk.id}>
                          {visibleColumns.includes('risk') && (
                            <TableCell sx={{ minWidth: 200 }}>
                              <Skeleton variant="text" width="80%" height={24} />
                            </TableCell>
                          )}
                          {visibleColumns.includes('category') && (
                            <TableCell sx={{ minWidth: 120 }}>
                              <Skeleton variant="rounded" width={80} height={22} />
                            </TableCell>
                          )}
                          {visibleColumns.includes('score') && (
                            <TableCell sx={{ minWidth: 140 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Skeleton variant="circular" width={10} height={10} />
                                <Skeleton variant="text" width={60} height={20} />
                              </Stack>
                            </TableCell>
                          )}
                          {visibleColumns.includes('owner') && (
                            <TableCell>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Skeleton variant="circular" width={20} height={20} />
                                <Skeleton variant="text" width={80} height={20} />
                              </Stack>
                            </TableCell>
                          )}
                          {visibleColumns.includes('sources') && (
                            <TableCell>
                              <Stack direction="row" spacing={0.5}>
                                <Skeleton variant="rounded" width={50} height={20} />
                                <Skeleton variant="rounded" width={50} height={20} />
                              </Stack>
                            </TableCell>
                          )}
                          {visibleColumns.includes('status') && (
                            <TableCell>
                              <Skeleton variant="rounded" width={50} height={22} />
                            </TableCell>
                          )}
                          {visibleColumns.includes('actions') && (
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <Skeleton variant="circular" width={24} height={24} />
                                <Skeleton variant="circular" width={24} height={24} />
                              </Stack>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    }
                    
                    return (
                      <TableRow key={risk.id} hover>
                        {visibleColumns.includes('risk') && (
                          <TableCell sx={{ minWidth: 200 }}>
                            {editingTitleId === risk.id ? (
                              <TextField
                                value={risk.title}
                                onChange={(e) => updateRisk(risk.id, { title: e.target.value })}
                                onBlur={() => setEditingTitleId(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Escape') {
                                    setEditingTitleId(null);
                                  }
                                }}
                                variant="standard"
                                fullWidth
                                size="small"
                                autoFocus
                                InputProps={{
                                  disableUnderline: true,
                                }}
                                sx={{
                                  '& .MuiInputBase-input': {
                                    py: 0.5,
                                    px: 0.5,
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    bgcolor: 'grey.100',
                                    borderRadius: 0.5,
                                  },
                                }}
                              />
                            ) : (
                              <Stack 
                                direction="row" 
                                alignItems="center" 
                                spacing={0.5}
                                sx={{
                                  '& .edit-icon': {
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                  },
                                  '&:hover .edit-icon': {
                                    opacity: 1,
                                  },
                                }}
                              >
                                <Typography
                                  component={Link}
                                  href={`/risks/${risk.id}`}
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    textDecoration: 'underline',
                                    '&:hover': {
                                      color: 'primary.main',
                                    },
                                  }}
                                >
                                  {risk.title}
                                </Typography>
                                <IconButton
                                  className="edit-icon"
                                  size="small"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingTitleId(risk.id);
                                  }}
                                  sx={{ 
                                    p: 0.25,
                                    ml: 0.5,
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                </IconButton>
                              </Stack>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.includes('category') && (
                          <TableCell sx={{ minWidth: 130 }}>
                          <Select
                            value={risk.category}
                            onChange={(e) => updateRisk(risk.id, { category: e.target.value })}
                            variant="outlined"
                            size="small"
                            fullWidth
                            sx={{
                              borderRadius: 2,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.300' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.400' },
                              '& .MuiSelect-select': {
                                py: 1,
                                px: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                              },
                            }}
                            renderValue={(value) => (
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {value}
                              </Typography>
                            )}
                          >
                            {categories.map((cat, catIdx) => (
                              <MenuItem key={`cat-${catIdx}-${cat}`} value={cat} sx={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>
                                {cat}
                              </MenuItem>
                            ))}
                          </Select>
                          </TableCell>
                        )}
                        {visibleColumns.includes('score') && (
                          <TableCell sx={{ minWidth: 140 }}>
                            <Select
                              value={inherentScore}
                              onChange={(e) => {
                                const newScore = e.target.value as number;
                                updateRisk(risk.id, { 
                                  likelihood: newScore as 1 | 2 | 3 | 4 | 5, 
                                  impact: newScore as 1 | 2 | 3 | 4 | 5 
                                });
                              }}
                              variant="outlined"
                              size="small"
                              fullWidth
                              sx={{
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.300' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.400' },
                                '& .MuiSelect-select': {
                                  py: 1,
                                  px: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                },
                              }}
                              renderValue={(value) => (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: 0.5,
                                      bgcolor: getSeverityColor(value as number),
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography variant="body2">
                                    {scoreOptions.find(s => s.value === value)?.label}
                                  </Typography>
                                </Stack>
                              )}
                            >
                              {scoreOptions.map((option, scoreOptIdx) => (
                                <MenuItem key={`score-${option.value}-${scoreOptIdx}`} value={option.value}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Box
                                      sx={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 0.5,
                                        bgcolor: getSeverityColor(option.value),
                                      }}
                                    />
                                    <Typography variant="body2">
                                      {option.label}
                                    </Typography>
                                  </Stack>
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                        )}
                        {visibleColumns.includes('owner') && (
                          <TableCell sx={{ minWidth: 180 }}>
                          <Select
                            value={risk.suggestedOwner?.name || ''}
                            onChange={(e) => {
                              const owner = availableOwners.find(o => o.name === e.target.value);
                              if (owner) {
                                updateRisk(risk.id, { suggestedOwner: owner });
                              }
                            }}
                            variant="outlined"
                            size="small"
                            fullWidth
                            displayEmpty
                            sx={{
                              borderRadius: 2,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.300' },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.400' },
                              '& .MuiSelect-select': {
                                py: 1,
                                px: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                              },
                            }}
                            renderValue={(value) => {
                              if (!value) return <Typography variant="body2" color="text.secondary">Select owner</Typography>;
                              return (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: getOwnerColor(value as string) }}>
                                    {(value as string).charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2">{value}</Typography>
                                </Stack>
                              );
                            }}
                          >
                            {availableOwners.map((owner, ownerIdx) => (
                              <MenuItem key={`owner-${ownerIdx}-${owner.name}`} value={owner.name}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: getOwnerColor(owner.name) }}>
                                    {owner.name.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2">{owner.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{owner.role}</Typography>
                                  </Box>
                                </Stack>
                              </MenuItem>
                            ))}
                          </Select>
                          </TableCell>
                        )}
                        {visibleColumns.includes('sources') && (
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {risk.sources.map((source, sourceIdx) => {
                                const chipLabel = source.type === 'document' 
                                  ? source.name 
                                  : sourceTypeLabels[source.type] || source.type;
                                return (
                                  <Tooltip 
                                    key={`${risk.id}-source-${sourceIdx}`} 
                                    title={
                                      <Box sx={{ whiteSpace: 'pre-line' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                          {source.name}
                                        </Typography>
                                        {source.description && (
                                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {source.description}
                                          </Typography>
                                        )}
                                        {source.url && (
                                          <Typography variant="caption" sx={{ color: 'primary.light', wordBreak: 'break-all', display: 'block', mt: 0.5 }}>
                                            {source.url}
                                          </Typography>
                                        )}
                                      </Box>
                                    } 
                                    arrow
                                  >
                                    <Chip
                                      size="small"
                                      label={chipLabel}
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: 10, maxWidth: 150 }}
                                    />
                                  </Tooltip>
                                );
                              })}
                            </Stack>
                          </TableCell>
                        )}
                        {visibleColumns.includes('status') && (
                          <TableCell>
                            <Chip size="small" label="Draft" sx={{ height: 22, bgcolor: 'grey.200', color: 'grey.700' }} />
                          </TableCell>
                        )}
                        {visibleColumns.includes('actions') && (
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(risk.id)}
                                title="Approve"
                              >
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReject(risk.id)}
                                title="Reject"
                              >
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
        </Box>
      </Collapse>

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

export default function RiskDiscoveryPage() {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>}>
      <RiskDiscoveryContent />
    </Suspense>
  );
}
