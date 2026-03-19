'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Button,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome as AgentIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import Link from 'next/link';
import { getSeverityColor } from '@/lib/utils';
import { getApprovedRisks, seedMockRisks } from '@/lib/risk-store';
import { TableToolbar } from '@/components/TableToolbar';
import type { RiskSuggestion } from '@/types/document';

const categoryColors: Record<string, string> = {
  operational: '#0060C7',
  compliance: '#9530DC',
  financial: '#009999',
  cyber: '#C42B31',
  strategic: '#C29A1D',
};

const ragColors = {
  positive: { 3: '#2EB365', 4: '#7ECDA0' },
  neutral: { 2: '#C29A1D' },
  negative: { 3: '#E54E54', 4: '#C42B31' },
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

function RiskVisualizations({ risks }: { risks: RiskSuggestion[] }) {
  if (risks.length === 0) return null;

  const categoryCount = risks.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCount = risks.reduce((acc, r) => {
    const status = getRandomStatus(r.id);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const heatmapData = risks.reduce((acc, r) => {
    const key = `${r.likelihood}-${r.impact}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, RiskSuggestion[]>);

  const getHeatmapColor = (likelihood: number, impact: number) => {
    const cellRisks = heatmapData[`${likelihood}-${impact}`] || [];
    if (cellRisks.length === 0) return '#F5F5F5';
    const score = Math.round((likelihood + impact) / 2);
    if (score <= 1) return ragColors.positive[4];
    if (score <= 2) return ragColors.positive[3];
    if (score <= 3) return ragColors.neutral[2];
    if (score <= 4) return ragColors.negative[3];
    return ragColors.negative[4];
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: 260 }} variant="outlined">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Risks by category
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', height: 190 }}>
              <Box sx={{ position: 'relative', width: '55%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(categoryCount).map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value,
                        color: categoryColors[name] || '#6B7280',
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {Object.entries(categoryCount).map(([name], index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[name] || '#6B7280'} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number | undefined) => [`${value ?? 0} risks`, '']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {risks.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                    Risks
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={1} sx={{ flex: 1 }}>
                {Object.entries(categoryCount).map(([category, count]) => (
                  <Stack key={category} direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 0.5,
                        bgcolor: categoryColors[category] || '#6B7280',
                      }}
                    />
                    <Typography variant="body2" sx={{ textTransform: 'capitalize', flex: 1 }}>
                      {category}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {count}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: 260, overflow: 'hidden' }} variant="outlined">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Risk heatmap
            </Typography>
            <Box sx={{ display: 'flex', height: 190 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 24 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: 10, 
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                  }}
                >
                  Likelihood
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <Box sx={{ display: 'flex', flex: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', pr: 0.5, width: 16 }}>
                    {[5, 4, 3, 2, 1].map(l => (
                      <Typography key={l} variant="caption" color="text.secondary" sx={{ fontSize: 10, textAlign: 'right' }}>
                        {l}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', gap: 0.5 }}>
                    {[5, 4, 3, 2, 1].map(likelihood => (
                      [1, 2, 3, 4, 5].map(impact => {
                        const cellRisks = heatmapData[`${likelihood}-${impact}`] || [];
                        const count = cellRisks.length;
                        const tooltipContent = count > 0 ? (
                          <Box sx={{ p: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                              L{likelihood} × I{impact} ({count} {count === 1 ? 'risk' : 'risks'})
                            </Typography>
                            {cellRisks.slice(0, 5).map((risk, idx) => (
                              <Typography key={risk.id} variant="caption" sx={{ display: 'block', fontSize: 11 }}>
                                • {risk.title}
                              </Typography>
                            ))}
                            {count > 5 && (
                              <Typography variant="caption" sx={{ display: 'block', fontSize: 11, fontStyle: 'italic', mt: 0.5 }}>
                                +{count - 5} more...
                              </Typography>
                            )}
                          </Box>
                        ) : `L${likelihood} × I${impact}`;
                        return (
                          <Tooltip 
                            key={`${likelihood}-${impact}`} 
                            title={tooltipContent}
                            arrow
                            slotProps={{
                              tooltip: {
                                sx: { 
                                  bgcolor: 'background.paper', 
                                  color: 'text.primary',
                                  boxShadow: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  maxWidth: 280,
                                },
                              },
                              arrow: {
                                sx: { color: 'background.paper' },
                              },
                            }}
                          >
                            <Box
                              sx={{
                                bgcolor: getHeatmapColor(likelihood, impact),
                                borderRadius: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: count > 0 ? 'pointer' : 'default',
                                border: count > 0 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                              }}
                            >
                              {count > 0 && (
                                <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, color: 'white', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                                  {count}
                                </Typography>
                              )}
                            </Box>
                          </Tooltip>
                        );
                      })
                    ))}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', pl: 2.5 }}>
                  <Stack direction="row" justifyContent="space-around" sx={{ flex: 1, mt: 0.5 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Typography key={i} variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                        {i}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontSize: 10, mt: 0.5, pl: 2 }}>
                  Impact
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: 260 }} variant="outlined">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Assessment status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', height: 190 }}>
              <Box sx={{ position: 'relative', width: '55%', height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(statusCount).map(([status, value]) => ({
                        name: statusOptions.find(s => s.value === status)?.label || status,
                        value,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {Object.entries(statusCount).map(([status], index) => (
                        <Cell key={`status-${index}`} fill={statusColors[status]?.bg || '#6B7280'} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number | undefined) => [`${value ?? 0} risks`, '']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Stack spacing={1.5} sx={{ flex: 1 }}>
                {Object.entries(statusCount).map(([status, count]) => (
                  <Stack key={status} direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: statusColors[status]?.bg || '#6B7280',
                      }}
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {statusOptions.find(s => s.value === status)?.label || status}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {count}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

const categories = ['operational', 'compliance', 'financial', 'cyber', 'strategic'];
const scoreOptions = [
  { value: 1, label: 'Very low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Very high' },
];
const statusOptions = [
  { value: 'unassessed', label: 'Unassessed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'assessed', label: 'Assessed' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  unassessed: { bg: '#FADF6B', text: '#1a1a1a' },
  in_progress: { bg: '#5DD3F3', text: '#1a1a1a' },
  assessed: { bg: '#9FE870', text: '#1a1a1a' },
};

const getRandomStatus = (riskId: string): string => {
  const hash = riskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const statuses = ['unassessed', 'in_progress', 'assessed'];
  return statuses[hash % statuses.length];
};

export default function RiskRegisterPage() {
  const [approvedRisks, setApprovedRisks] = useState<RiskSuggestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['risk', 'category', 'score', 'owner', 'status']);

  useEffect(() => {
    seedMockRisks(50);
    setApprovedRisks(getApprovedRisks());
  }, []);

  const getScoreLabel = (score: number) => {
    if (score >= 5) return 'Very high';
    if (score >= 4) return 'High';
    if (score >= 3) return 'Medium';
    if (score >= 2) return 'Low';
    return 'Very low';
  };

  const filterOptions = [
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
      type: 'multiselect' as const,
      options: statusOptions,
    },
  ];
  
  const columnOptions = [
    { id: 'risk', label: 'Risk' },
    { id: 'category', label: 'Category' },
    { id: 'score', label: 'Inherent score' },
    { id: 'owner', label: 'Owner' },
    { id: 'status', label: 'Status' },
  ];
  
  const handleFilterChange = (filterId: string, value: string | string[]) => {
    setActiveFilters(prev => ({ ...prev, [filterId]: value }));
  };
  
  const handleClearFilters = () => {
    setActiveFilters({});
  };
  
  const handleColumnToggle = (columnId: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(c => c !== columnId)
        : [...prev, columnId]
    );
  };

  const filteredRisks = approvedRisks.filter((risk) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        risk.title.toLowerCase().includes(search) ||
        risk.description.toLowerCase().includes(search) ||
        risk.category.toLowerCase().includes(search) ||
        risk.suggestedOwner?.name.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    
    const categoryFilter = activeFilters.category as string[];
    if (categoryFilter && categoryFilter.length > 0) {
      if (!categoryFilter.includes(risk.category)) return false;
    }
    
    const scoreFilter = activeFilters.score as string[];
    if (scoreFilter && scoreFilter.length > 0) {
      const inherentScore = Math.round((risk.likelihood + risk.impact) / 2);
      if (!scoreFilter.includes(String(inherentScore))) return false;
    }
    
    return true;
  });

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Risk Register
        </Typography>
      </Box>

      {approvedRisks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }} variant="outlined">
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            No risks in register
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Import organization data to discover and approve risks.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button
              component={Link}
              href="/?new=true"
              variant="contained"
              startIcon={<AgentIcon />}
            >
              New Identification
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Add Manually
            </Button>
          </Stack>
        </Paper>
      ) : (
        <>
          <RiskVisualizations risks={approvedRisks} />

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
          />

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {visibleColumns.includes('risk') && <TableCell>Risk</TableCell>}
                  {visibleColumns.includes('category') && <TableCell>Category</TableCell>}
                  {visibleColumns.includes('score') && <TableCell>Inherent score</TableCell>}
                  {visibleColumns.includes('owner') && <TableCell>Owner</TableCell>}
                  {visibleColumns.includes('status') && <TableCell>Status</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRisks.map((risk) => {
                  const inherentScore = Math.round((risk.likelihood + risk.impact) / 2);
                  return (
                    <TableRow key={risk.id} hover>
                      {visibleColumns.includes('risk') && (
                        <TableCell>
                          <Typography
                            component={Link}
                            href={`/risks/${risk.id}`}
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: 'text.primary',
                              textDecoration: 'underline',
                              '&:hover': {
                                color: 'primary.main',
                              },
                            }}
                          >
                            {risk.title}
                          </Typography>
                        </TableCell>
                      )}
                      {visibleColumns.includes('category') && (
                        <TableCell>
                          <Chip
                            size="small"
                            label={risk.category}
                            variant="outlined"
                            sx={{
                              color: 'text.secondary',
                              borderColor: 'grey.400',
                              textTransform: 'capitalize',
                              height: 22,
                            }}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.includes('score') && (
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: 0.5,
                                bgcolor: getSeverityColor(inherentScore),
                              }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {inherentScore}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {getScoreLabel(inherentScore)}
                            </Typography>
                          </Stack>
                        </TableCell>
                      )}
                      {visibleColumns.includes('owner') && (
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {risk.suggestedOwner && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Avatar sx={{ width: 20, height: 20, fontSize: 10, bgcolor: getOwnerColor(risk.suggestedOwner.name) }}>
                                {risk.suggestedOwner.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">
                                {risk.suggestedOwner.name}
                              </Typography>
                            </Stack>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.includes('status') && (
                        <TableCell>
                          {(() => {
                            const status = getRandomStatus(risk.id);
                            const colors = statusColors[status];
                            const label = statusOptions.find(s => s.value === status)?.label || status;
                            return (
                              <Chip 
                                size="small" 
                                label={label} 
                                sx={{ 
                                  height: 26,
                                  bgcolor: colors.bg,
                                  color: colors.text,
                                  fontWeight: 500,
                                  border: 'none',
                                  borderRadius: '13px',
                                }} 
                              />
                            );
                          })()}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
