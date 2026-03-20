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
import { getSeverityColor, getScoreColor, getScoreLabel as getScoreLabelUtil, RISK_CATEGORY_COLORS, getRiskDisplayId } from '@/lib/utils';
import { getApprovedRisks, seedMockRisks } from '@/lib/risk-store';
import { getKRIs, ensureKRIRiskLinks } from '@/lib/kri-store';
import { TableToolbar } from '@/components/TableToolbar';
import { HeatmapSidesheet, type SelectedCell } from '@/components/risks/HeatmapSidesheet';
import type { RiskSuggestion } from '@/types/document';
import type { KeyRiskIndicator } from '@/types/kri';

const categoryColors = RISK_CATEGORY_COLORS;

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

function deriveResiduals(risk: RiskSuggestion) {
  const inherentScore = (risk.likelihood + risk.impact) / 2;
  const seed = risk.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let treatment: string;
  if (inherentScore >= 4) treatment = 'mitigate';
  else if (inherentScore >= 3) treatment = seed % 3 === 0 ? 'transfer' : seed % 3 === 1 ? 'mitigate' : 'accept';
  else treatment = seed % 2 === 0 ? 'accept' : 'mitigate';
  const maxReduction = inherentScore - 1;
  const rawReduction =
    treatment === 'mitigate' ? Math.min(1.3 + (seed % 8) * 0.1, maxReduction) :
    treatment === 'avoid'    ? Math.min(1.8, maxReduction) :
    treatment === 'transfer' ? Math.min(0.8, maxReduction) : 0;
  const residualScore = Math.max(1, inherentScore - rawReduction);
  const ratio = inherentScore > 0 ? residualScore / inherentScore : 1;
  const residualL = Math.max(1, Math.round(risk.likelihood * ratio * 10) / 10);
  const residualI = Math.max(1, Math.round(risk.impact * ratio * 10) / 10);
  const reductionPct = inherentScore > 0 ? Math.round(((inherentScore - residualScore) / inherentScore) * 100) : 0;
  return { residualScore, residualL, residualI, reductionPct };
}

function RiskVisualizations({ risks, onCellClick }: { risks: RiskSuggestion[]; onCellClick: (cell: SelectedCell) => void }) {
  if (risks.length === 0) return null;

  const categoryCount = risks.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCount = risks.reduce((acc, r) => {
    const status = getAssessmentStatus(r);
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
    if (cellRisks.length === 0) return 'rgba(255, 255, 255, 0.04)';
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
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {Object.entries(categoryCount).map(([, ], index) => {
                        const shades = ['#60a5fa','#93c5fd','#3b82f6','#bfdbfe','#2563eb'];
                        return <Cell key={`cell-${index}`} fill={shades[index % shades.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: unknown) => [`${(value as number) ?? 0} risks`, '']}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                        background: 'rgba(10, 14, 26, 0.95)',
                        backdropFilter: 'blur(12px)',
                        color: '#e2e8f0',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      }}
                      itemStyle={{ color: '#94a3b8' }}
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
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                    Risks
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={1} sx={{ flex: 1 }}>
                {Object.entries(categoryCount).map(([category, count], index) => {
                  const shades = ['#60a5fa','#93c5fd','#3b82f6','#bfdbfe','#2563eb'];
                  return (
                  <Stack key={category} direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 0.5,
                        bgcolor: shades[index % shades.length],
                      }}
                    />
                    <Typography variant="body2" sx={{ textTransform: 'capitalize', flex: 1 }}>
                      {category}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {count}
                    </Typography>
                  </Stack>
                  );
                })}
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
                    fontSize: 12, 
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
                      <Typography key={l} variant="caption" color="text.secondary" sx={{ fontSize: 12, textAlign: 'right' }}>
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
                              <Typography key={risk.id} variant="caption" sx={{ display: 'block', fontSize: 12 }}>
                                • {risk.title}
                              </Typography>
                            ))}
                            {count > 5 && (
                              <Typography variant="caption" sx={{ display: 'block', fontSize: 12, fontStyle: 'italic', mt: 0.5 }}>
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
                              onClick={() => {
                                if (count > 0) {
                                  onCellClick({ likelihood, impact, risks: cellRisks });
                                }
                              }}
                              sx={{
                                bgcolor: getHeatmapColor(likelihood, impact),
                                borderRadius: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: count > 0 ? 'pointer' : 'default',
                                border: 'none',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                '&:hover': count > 0 ? {
                                  transform: 'scale(1.08)',
                                  boxShadow: '0 0 12px rgba(96, 165, 250, 0.3)',
                                  zIndex: 1,
                                } : {},
                              }}
                            >
                              {count > 0 && (
                                <Typography variant="caption" sx={{ fontSize: 12, fontWeight: 700, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
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
                      <Typography key={i} variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                        {i}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontSize: 12, mt: 0.5, pl: 2 }}>
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
                      stroke="none"
                    >
                      {Object.entries(statusCount).map(([status], index) => (
                        <Cell key={`status-${index}`} fill={statusColors[status]?.bg || '#6B7280'} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: unknown) => [`${(value as number) ?? 0} risks`, '']}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                        background: 'rgba(10, 14, 26, 0.95)',
                        backdropFilter: 'blur(12px)',
                        color: '#e2e8f0',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                      }}
                      itemStyle={{ color: '#94a3b8' }}
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

const getAssessmentStatus = (risk: RiskSuggestion): string => {
  if (risk.assessmentStatus) return risk.assessmentStatus;
  // Fallback for legacy data without assessmentStatus stored
  const hash = risk.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ['unassessed', 'in_progress', 'assessed'][hash % 3];
};

export default function RiskRegisterPage() {
  const [approvedRisks, setApprovedRisks] = useState<RiskSuggestion[]>([]);
  const [kris, setKRIs] = useState<KeyRiskIndicator[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['risk', 'category', 'score', 'residual', 'owner', 'status']);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  useEffect(() => {
    seedMockRisks(50);
    const loadedRisks = getApprovedRisks();
    setApprovedRisks(loadedRisks);
    ensureKRIRiskLinks(loadedRisks);
    setKRIs(getKRIs());
  }, []);

  const getScoreLabel = getScoreLabelUtil;

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
    { id: 'risk',        label: 'Risk' },
    { id: 'category',    label: 'Category' },
    { id: 'score',       label: 'Inherent score' },
    { id: 'residual',    label: 'Residual score' },
    { id: 'owner',       label: 'Owner' },
    { id: 'status',      label: 'Status' },
    { id: 'kri_signals', label: 'KRI signals' },
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
        <Typography variant="h1" component="h1">
          Risk register
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
              New identification
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Add manually
            </Button>
          </Stack>
        </Paper>
      ) : (
        <>
          <RiskVisualizations risks={approvedRisks} onCellClick={setSelectedCell} />

          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mb: 1 }}>
            <Button
              component={Link}
              href="/"
              size="small"
              variant="text"
            >
              Identify new risks
            </Button>
            <Button
              component={Link}
              href="/?new=true"
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Add manually
            </Button>
            <Button
              component={Link}
              href="/"
              size="small"
              variant="contained"
              startIcon={<AgentIcon sx={{ fontSize: '14px !important' }} />}
            >
              Add risk
            </Button>
          </Stack>

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

          <HeatmapSidesheet cell={selectedCell} onClose={() => setSelectedCell(null)} />

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 80 }}>ID</TableCell>
                  {visibleColumns.includes('risk')     && <TableCell>Risk</TableCell>}
                  {visibleColumns.includes('category') && <TableCell>Category</TableCell>}
                  {visibleColumns.includes('score')    && <TableCell>Inherent score</TableCell>}
                  {visibleColumns.includes('residual') && <TableCell>Residual score</TableCell>}
                  {visibleColumns.includes('owner')       && <TableCell>Owner</TableCell>}
                  {visibleColumns.includes('status')      && <TableCell>Status</TableCell>}
                  {visibleColumns.includes('kri_signals') && <TableCell>KRI signals</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRisks.map((risk) => {
                  const inherentScore = (risk.likelihood + risk.impact) / 2;
                  const res = deriveResiduals(risk);
                  return (
                    <TableRow key={risk.id} hover>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.02em' }}>
                          {getRiskDisplayId(risk.id, approvedRisks)}
                        </Typography>
                      </TableCell>
                      {visibleColumns.includes('risk') && (
                        <TableCell>
                          <Typography
                            component={Link}
                            href={`/risks/${risk.id}`}
                            variant="body2"
                            sx={{ fontWeight: 700, color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
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
                              textTransform: 'capitalize',
                              height: 22,
                            }}
                          />
                        </TableCell>
                      )}
                      {visibleColumns.includes('score') && (
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getSeverityColor(inherentScore), flexShrink: 0 }} />
                            <Stack>
                              <Stack direction="row" spacing={0.5} alignItems="baseline">
                                <Typography variant="body2" sx={{ fontWeight: 700, color: getSeverityColor(inherentScore) }}>
                                  {inherentScore.toFixed(1)}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">{getScoreLabel(inherentScore)}</Typography>
                              </Stack>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                                L{risk.likelihood} × I{risk.impact}
                              </Typography>
                            </Stack>
                          </Stack>
                        </TableCell>
                      )}
                      {visibleColumns.includes('residual') && (
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getSeverityColor(res.residualScore), flexShrink: 0 }} />
                            <Stack>
                              <Stack direction="row" spacing={0.5} alignItems="baseline">
                                <Typography variant="body2" sx={{ fontWeight: 700, color: getSeverityColor(res.residualScore) }}>
                                  {res.residualScore.toFixed(1)}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">{getScoreLabel(res.residualScore)}</Typography>
                              </Stack>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.75rem' }}>
                                  L{res.residualL.toFixed(1)} × I{res.residualI.toFixed(1)}
                                </Typography>
                                {res.reductionPct > 0 && (
                                  <Typography variant="caption" sx={{ color: '#2EB365', fontSize: '0.75rem' }}>−{res.reductionPct}%</Typography>
                                )}
                              </Stack>
                            </Stack>
                          </Stack>
                        </TableCell>
                      )}
                      {visibleColumns.includes('owner') && (
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {risk.suggestedOwner && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Avatar sx={{ width: 20, height: 20, fontSize: 12, bgcolor: getOwnerColor(risk.suggestedOwner.name) }}>
                                {risk.suggestedOwner.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">{risk.suggestedOwner.name}</Typography>
                            </Stack>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.includes('status') && (
                        <TableCell>
                          {(() => {
                            const status = getAssessmentStatus(risk);
                            const colors = statusColors[status];
                            const label = statusOptions.find(s => s.value === status)?.label || status;
                            return (
                              <Chip size="small" label={label}
                                sx={{ height: 24, bgcolor: colors.bg, color: colors.text, fontWeight: 500, border: 'none', borderRadius: '12px' }}
                              />
                            );
                          })()}
                        </TableCell>
                      )}
                      {visibleColumns.includes('kri_signals') && (
                        <TableCell>
                          {(() => {
                            const linked = kris.filter(k => k.linkedRiskIds.includes(risk.id));
                            if (linked.length > 0) {
                              const redCount = linked.filter(k => k.status === 'red').length;
                              const amberCount = linked.filter(k => k.status === 'amber').length;
                              if (redCount > 0) {
                                return (
                                  <Tooltip title="KRI data linked to this risk" arrow>
                                    <Chip size="small" label={`● ${redCount} KRI${redCount > 1 ? 's' : ''}`}
                                      sx={{ height: 22, color: '#C42B31', border: '1px solid #C42B31', bgcolor: 'rgba(196,43,49,0.12)', fontSize: '0.7rem', fontWeight: 600 }}
                                    />
                                  </Tooltip>
                                );
                              }
                              if (amberCount > 0) {
                                return (
                                  <Tooltip title="KRI data linked to this risk" arrow>
                                    <Chip size="small" label={`● ${amberCount} KRI${amberCount > 1 ? 's' : ''}`}
                                      sx={{ height: 22, color: '#C29A1D', border: '1px solid #C29A1D', bgcolor: 'rgba(194,154,29,0.12)', fontSize: '0.7rem', fontWeight: 600 }}
                                    />
                                  </Tooltip>
                                );
                              }
                              return null;
                            }
                            // Deterministic fallback
                            const idHash = risk.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                            const mod = idHash % 5;
                            if (mod === 0) {
                              return (
                                <Tooltip title="KRI data linked to this risk" arrow>
                                  <Chip size="small" label="● 2 KRIs"
                                    sx={{ height: 22, color: '#C42B31', border: '1px solid #C42B31', bgcolor: 'rgba(196,43,49,0.12)', fontSize: '0.7rem', fontWeight: 600 }}
                                  />
                                </Tooltip>
                              );
                            }
                            if (mod === 1) {
                              return (
                                <Tooltip title="KRI data linked to this risk" arrow>
                                  <Chip size="small" label="● 1 KRI"
                                    sx={{ height: 22, color: '#C29A1D', border: '1px solid #C29A1D', bgcolor: 'rgba(194,154,29,0.12)', fontSize: '0.7rem', fontWeight: 600 }}
                                  />
                                </Tooltip>
                              );
                            }
                            return null;
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
