'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Avatar,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Warning as SeverityIcon,
  Business as DepartmentIcon,
  PlayArrow as StartIcon,
  PriorityHigh as PriorityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';
import type { RiskSuggestion } from '@/types/document';
import { getApprovedRisks } from '@/lib/risk-store';

type GroupBy = 'category' | 'owner' | 'severity' | 'department';

interface AssessmentGroup {
  id: string;
  label: string;
  description: string;
  risks: RiskSuggestion[];
  color?: string;
}

const categoryColors: Record<string, string> = {
  operational: '#0060C7',
  compliance: '#9530DC',
  financial: '#009999',
  cyber: '#C42B31',
  strategic: '#C29A1D',
};

const severityLabels: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High',
};

const severityColors: Record<number, string> = {
  1: '#4caf50',
  2: '#8bc34a',
  3: '#ff9800',
  4: '#f44336',
  5: '#b71c1c',
};

const ownerColors: Record<string, string> = {
  'Sarah Chen': '#0060C7',
  'Michael Torres': '#C42B31',
  'Jennifer Walsh': '#9530DC',
  'David Park': '#009999',
  'Robert Kim': '#C29A1D',
};

export default function AssessmentsPage() {
  const [risks, setRisks] = useState<RiskSuggestion[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const approvedRisks = getApprovedRisks();
    setRisks(approvedRisks);
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleGroupByChange = (_: React.MouseEvent<HTMLElement>, newGroupBy: GroupBy | null) => {
    if (newGroupBy) {
      setGroupBy(newGroupBy);
      setExpandedGroup(null);
    }
  };

  const groupRisks = (): AssessmentGroup[] => {
    if (risks.length === 0) return [];

    switch (groupBy) {
      case 'category':
        const categoryGroups: Record<string, RiskSuggestion[]> = {};
        risks.forEach(risk => {
          const cat = risk.category || 'other';
          if (!categoryGroups[cat]) categoryGroups[cat] = [];
          categoryGroups[cat].push(risk);
        });
        return Object.entries(categoryGroups).map(([cat, catRisks]) => ({
          id: `cat-${cat}`,
          label: cat.charAt(0).toUpperCase() + cat.slice(1) + ' Risks',
          description: `Assessment for all ${cat} risks in your organization`,
          risks: catRisks,
          color: categoryColors[cat],
        }));

      case 'owner':
        const ownerGroups: Record<string, RiskSuggestion[]> = {};
        risks.forEach(risk => {
          const owner = risk.suggestedOwner?.name || 'Unassigned';
          if (!ownerGroups[owner]) ownerGroups[owner] = [];
          ownerGroups[owner].push(risk);
        });
        return Object.entries(ownerGroups).map(([owner, ownerRisks]) => ({
          id: `owner-${owner}`,
          label: owner === 'Unassigned' ? 'Unassigned Risks' : `${owner}'s Risks`,
          description: owner === 'Unassigned' 
            ? 'Risks that need an owner assigned'
            : `Assessment for risks owned by ${owner}`,
          risks: ownerRisks,
          color: ownerColors[owner] || '#6B7280',
        }));

      case 'severity':
        const severityGroups: Record<number, RiskSuggestion[]> = {};
        risks.forEach(risk => {
          const score = Math.round((risk.likelihood + risk.impact) / 2);
          if (!severityGroups[score]) severityGroups[score] = [];
          severityGroups[score].push(risk);
        });
        return Object.entries(severityGroups)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([score, sevRisks]) => ({
            id: `sev-${score}`,
            label: `${severityLabels[Number(score)]} Severity Risks`,
            description: `Assessment for risks with ${severityLabels[Number(score)].toLowerCase()} severity rating`,
            risks: sevRisks,
            color: severityColors[Number(score)],
          }));

      case 'department':
        const deptGroups: Record<string, RiskSuggestion[]> = {};
        risks.forEach(risk => {
          const dept = risk.suggestedOwner?.department || 'Unassigned';
          if (!deptGroups[dept]) deptGroups[dept] = [];
          deptGroups[dept].push(risk);
        });
        return Object.entries(deptGroups).map(([dept, deptRisks]) => ({
          id: `dept-${dept}`,
          label: dept === 'Unassigned' ? 'Unassigned Department' : dept,
          description: dept === 'Unassigned'
            ? 'Risks that need department assignment'
            : `Assessment for all risks in ${dept}`,
          risks: deptRisks,
        }));

      default:
        return [];
    }
  };

  const assessmentGroups = groupRisks();

  const getScoreLabel = (risk: RiskSuggestion) => {
    const score = Math.round((risk.likelihood + risk.impact) / 2);
    return `${score} - ${severityLabels[score]}`;
  };

  const getScoreColor = (risk: RiskSuggestion) => {
    const score = Math.round((risk.likelihood + risk.impact) / 2);
    return severityColors[score];
  };

  const highPriorityRisks = risks.filter(r => {
    const score = Math.round((r.likelihood + r.impact) / 2);
    return score >= 4;
  });

  const categoryDistribution = risks.reduce((acc, risk) => {
    const cat = risk.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCategories = Object.keys(categoryDistribution).length;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Assessments
          </Typography>
        </Box>
      </Stack>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ 
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none' },
        }}
      >
        <Tab label="Assessment suggestions" />
        <Tab label="Existing assessments" />
      </Tabs>

      {activeTab === 0 && (
        risks.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
              No approved risks yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approve risks from the Risk Discovery page to see assessment suggestions here.
            </Typography>
          </Paper>
        ) : (
          <>
          {/* Overview stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* High priority - primary attention card */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  borderColor: highPriorityRisks.length > 0 ? '#ed6c02' : 'divider',
                  borderWidth: highPriorityRisks.length > 0 ? 2 : 1,
                  bgcolor: highPriorityRisks.length > 0 ? 'rgba(237, 108, 2, 0.04)' : 'transparent',
                  height: '100%',
                }}
              >
                <Stack spacing={1} sx={{ height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PriorityIcon sx={{ fontSize: 18, color: '#C42B31' }} />
                    <Typography variant="caption" color="text.secondary">
                      High priority
                    </Typography>
                  </Stack>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#C42B31' }}>
                    {highPriorityRisks.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {highPriorityRisks.length === 1 ? 'risk requires' : 'risks require'} immediate attention
                  </Typography>
                  {highPriorityRisks.length > 0 && (
                    <Button 
                      size="small" 
                      variant="outlined"
                      color="warning"
                      onClick={() => setGroupBy('severity')}
                      sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                    >
                      View by severity
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ScheduleIcon sx={{ fontSize: 18, color: '#282E37' }} />
                    <Typography variant="caption" color="text.secondary">
                      Pending assessment
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                    {risks.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    risks need review
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CategoryIcon sx={{ fontSize: 18, color: '#282E37' }} />
                    <Typography variant="caption" color="text.secondary">
                      Categories
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#0060C7' }}>
                    {totalCategories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    risk categories
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CompletedIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
                    <Typography variant="caption" color="text.secondary">
                      Completed
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    0
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    assessments done
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Grouping controls */}
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
            Assessment suggestions
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Group assessments by:
              </Typography>
              <ToggleButtonGroup
                value={groupBy}
                exclusive
                onChange={handleGroupByChange}
                size="small"
                sx={{ '& .MuiToggleButton-root': { textTransform: 'none' } }}
              >
                <ToggleButton value="category">
                  <CategoryIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  Category
                </ToggleButton>
                <ToggleButton value="owner">
                  <PersonIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  Owner
                </ToggleButton>
                <ToggleButton value="severity">
                  <SeverityIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  Severity
                </ToggleButton>
                <ToggleButton value="department">
                  <DepartmentIcon sx={{ fontSize: 18, mr: 0.5 }} />
                  Department
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Paper>

          <Stack spacing={2}>
            {assessmentGroups.map((group) => (
              <Paper key={group.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                <Box
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                      {group.color && (
                        <Box
                          sx={{
                            width: 8,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: group.color,
                          }}
                        />
                      )}
                      <Box>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {group.label}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${group.risks.length} ${group.risks.length === 1 ? 'risk' : 'risks'}`}
                            sx={{ height: 22, fontSize: '0.75rem' }}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {group.description}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<StartIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        Start assessment
                      </Button>
                      {expandedGroup === group.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Stack>
                  </Stack>
                </Box>

                <Collapse in={expandedGroup === group.id}>
                  <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Risk</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Inherent score</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.risks.map((risk) => (
                            <TableRow key={risk.id} hover>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {risk.title}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={risk.category.charAt(0).toUpperCase() + risk.category.slice(1)}
                                  variant="outlined"
                                  sx={{ 
                                    height: 22, 
                                    fontSize: '0.75rem',
                                    borderColor: 'grey.300',
                                    color: 'text.secondary',
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: 0.5,
                                      bgcolor: getScoreColor(risk),
                                    }}
                                  />
                                  <Typography variant="body2">
                                    {getScoreLabel(risk)}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                {risk.suggestedOwner ? (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        fontSize: '0.75rem',
                                        bgcolor: ownerColors[risk.suggestedOwner.name] || '#6B7280',
                                      }}
                                    >
                                      {risk.suggestedOwner.name.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                    <Typography variant="body2">
                                      {risk.suggestedOwner.name}
                                    </Typography>
                                  </Stack>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Unassigned
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </Stack>
          </>
        )
      )}

      {activeTab === 1 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            No existing assessments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start an assessment from the suggestions tab to see it here.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
