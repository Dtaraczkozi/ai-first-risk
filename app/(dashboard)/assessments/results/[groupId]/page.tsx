'use client';

import { use } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Avatar,
  Grid,
  Divider,
  Button,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  FlagOutlined as OutlierIcon,
  Info as InfoIcon,
  AutoAwesome as AIBadgeIcon,
  AttachFile as FileAttachIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ScatterChart,
  Scatter,
  Cell,
  ReferenceDot,
} from 'recharts';
import { MOCK_SYNTHESISED_ASSESSMENTS } from '@/data/mock/synthesis';
import { getApprovedRisks } from '@/lib/risk-store';

const RESULTS_BY_CATEGORY: Record<string, number> = {
  cyber: 0,
  financial: 1,
  compliance: 2,
};

const SCORE_COLOR: Record<number, string> = {
  1: '#7ECDA0',
  2: '#4ade80',
  3: '#C29A1D',
  4: '#E54E54',
  5: '#C42B31',
};

const SCORE_LABEL: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very high',
};

const ownerColors: Record<string, string> = {
  'Sarah Chen': '#0060C7',
  'Michael Torres': '#C42B31',
  'Jennifer Walsh': '#9530DC',
  'David Park': '#009999',
  'Robert Kim': '#C29A1D',
};

const TOOLTIP_STYLE = {
  background: 'rgba(10,14,26,0.97)',
  border: '1px solid rgba(96,165,250,0.2)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
};

function getScoreColor(v: number): string {
  if (v >= 4.5) return '#C42B31';
  if (v >= 3.5) return '#E54E54';
  if (v >= 2.5) return '#C29A1D';
  if (v >= 1.5) return '#4ade80';
  return '#7ECDA0';
}

export default function AssessmentResultsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const decodedId = decodeURIComponent(groupId);

  // Match to a synthesised assessment — use category mapping or fallback
  const synthIdx = RESULTS_BY_CATEGORY[decodedId] ??
    (decodedId.includes('cyber') ? 0 : decodedId.includes('financial') ? 1 : decodedId.includes('compliance') ? 2 : 0);
  const synthesis = MOCK_SYNTHESISED_ASSESSMENTS[synthIdx] ?? MOCK_SYNTHESISED_ASSESSMENTS[0];

  // Build display name from groupId
  const approvedRisks = getApprovedRisks();
  const label = decodedId.charAt(0).toUpperCase() + decodedId.slice(1).replace(/-/g, ' ') + ' risk assessment results';

  // Distribution data
  const lDistribution = [1, 2, 3, 4, 5].map(v => ({
    score: v,
    count: synthesis.opinions.filter(o => o.likelihood === v).length,
    label: SCORE_LABEL[v],
  }));
  const iDistribution = [1, 2, 3, 4, 5].map(v => ({
    score: v,
    count: synthesis.opinions.filter(o => o.impact === v).length,
    label: SCORE_LABEL[v],
  }));

  // Scatter data
  const scatterData = synthesis.opinions.map(op => ({
    x: op.likelihood,
    y: op.impact,
    name: op.assessorName.replace(' Persona', ''),
    isAI: op.assessorType === 'ai_persona',
    isOutlier: synthesis.outlierFlags.includes(op.assessorId),
  }));

  const synthScore = (synthesis.synthesisedLikelihood + synthesis.synthesisedImpact) / 2;

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb + header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Button component={Link} href="/assessments" variant="text" size="small" startIcon={<BackIcon />}>
          Assessments
        </Button>
        <Typography variant="caption" color="text.disabled">/</Typography>
        <Typography variant="caption" color="text.secondary">Results</Typography>
      </Stack>

      <Typography variant="h1" component="h1" sx={{ mb: 6 }}>
        {label}
      </Typography>

      {/* ── Distribution visualizations ── */}
      <Paper variant="outlined" sx={{ p: 3, mb: 6 }}>
        <Typography variant="h2" component="h2" sx={{ mb: 3 }}>Score distributions</Typography>
        <Grid container spacing={3}>
          {/* Likelihood distribution */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h3" sx={{ mb: 1.5 }}>Likelihood distribution</Typography>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={lDistribution} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.07)" vertical={false} />
                <XAxis dataKey="score" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ReTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#94a3b8' }}
                  formatter={(v: unknown, _: unknown, props: { payload?: { label?: string } }) => [`${v} assessor${(v as number) !== 1 ? 's' : ''}`, props.payload?.label ?? '']} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {lDistribution.map(d => (
                    <Cell key={d.score} fill={SCORE_COLOR[d.score]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Grid>

          {/* Impact distribution */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h3" sx={{ mb: 1.5 }}>Impact distribution</Typography>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={iDistribution} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.07)" vertical={false} />
                <XAxis dataKey="score" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <ReTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#94a3b8' }}
                  formatter={(v: unknown, _: unknown, props: { payload?: { label?: string } }) => [`${v} assessor${(v as number) !== 1 ? 's' : ''}`, props.payload?.label ?? '']} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {iDistribution.map(d => (
                    <Cell key={d.score} fill={SCORE_COLOR[d.score]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Grid>

          {/* Scatter: Likelihood vs Impact */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h3" sx={{ mb: 1.5 }}>Assessor spread (L × I)</Typography>
            <ResponsiveContainer width="100%" height={160}>
              <ScatterChart margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(96,165,250,0.07)" />
                <XAxis type="number" dataKey="x" name="Likelihood" domain={[0.5, 5.5]} tickCount={5}
                  tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} label={{ value: 'L', position: 'insideRight', fontSize: 11, fill: '#64748b' }} />
                <YAxis type="number" dataKey="y" name="Impact" domain={[0.5, 5.5]} tickCount={5}
                  tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} label={{ value: 'I', position: 'insideTop', fontSize: 11, fill: '#64748b', angle: -90 }} />
                <ReTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#94a3b8' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as typeof scatterData[0];
                    return (
                      <Box sx={{ ...TOOLTIP_STYLE, p: 1.25, borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>{d.name}</Typography>
                        <Typography variant="caption" color="text.secondary">L {d.x} · I {d.y}</Typography>
                      </Box>
                    );
                  }} />
                <Scatter data={scatterData} fill="#60a5fa">
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={d.isOutlier ? '#fbbf24' : d.isAI ? '#60a5fa' : '#94a3b8'} fillOpacity={0.85} />
                  ))}
                </Scatter>
                <ReferenceDot x={synthesis.synthesisedLikelihood} y={synthesis.synthesisedImpact}
                  r={7} fill={getScoreColor(synthScore)} stroke="white" strokeWidth={1.5} />
              </ScatterChart>
            </ResponsiveContainer>
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#60a5fa' }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>AI assessor</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>Human</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#fbbf24' }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>Outlier</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getScoreColor(synthScore), border: '1.5px solid white' }} />
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>Synthesized</Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Synthesized result summary ── */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 6 }}>
        <Typography variant="h2" component="h2" sx={{ mb: 2 }}>Synthesized result</Typography>
        <Stack direction="row" spacing={3} alignItems="flex-start" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedIcon sx={{ fontSize: 16, color: '#60a5fa' }} />
            <Box>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Likelihood</Typography>
              <Typography variant="h3" sx={{ color: getScoreColor(synthesis.synthesisedLikelihood) }}>
                {synthesis.synthesisedLikelihood.toFixed(1)} <Typography component="span" variant="caption" color="text.disabled">/ 5</Typography>
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedIcon sx={{ fontSize: 16, color: '#60a5fa' }} />
            <Box>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Impact</Typography>
              <Typography variant="h3" sx={{ color: getScoreColor(synthesis.synthesisedImpact) }}>
                {synthesis.synthesisedImpact.toFixed(1)} <Typography component="span" variant="caption" color="text.disabled">/ 5</Typography>
              </Typography>
            </Box>
          </Stack>
          <Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Overall score</Typography>
            <Typography variant="h3" sx={{ color: getScoreColor(synthScore) }}>
              {synthScore.toFixed(1)} <Typography component="span" variant="caption" color="text.disabled">/ 5</Typography>
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>Confidence</Typography>
            <Chip size="small" label={synthesis.confidenceLevel} variant="outlined"
              sx={{ height: 22, fontSize: '0.78rem' }} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>Assessors</Typography>
            <Typography variant="body2">{synthesis.opinions.length} assessors</Typography>
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
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)' }}>
            <Stack direction="row" spacing={0.75} alignItems="flex-start">
              <InfoIcon sx={{ fontSize: 14, color: '#60a5fa', mt: 0.1, flexShrink: 0 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.secondary' }}>Change since last assessment</Typography>
                <Typography variant="caption" color="text.secondary">{synthesis.whatChangedSinceLastTime}</Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {synthesis.benchmarkComparison && (
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.disabled', mb: 0.25 }}>Benchmark comparison</Typography>
            <Typography variant="caption" color="text.secondary">{synthesis.benchmarkComparison}</Typography>
          </Box>
        )}

        {synthesis.uncertainties.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', display: 'block', mb: 0.5 }}>Open uncertainties</Typography>
            <Stack spacing={0.5}>
              {synthesis.uncertainties.map((u, i) => (
                <Stack key={i} direction="row" spacing={0.75} alignItems="flex-start">
                  <Typography variant="caption" color="text.disabled">·</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{u}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* ── Per-assessor detailed cards ── */}
      <Typography variant="h2" component="h2" sx={{ mb: 3 }}>Individual assessor results</Typography>
      <Stack spacing={3}>
        {synthesis.opinions.map((op, opIdx) => {
          const isAI = op.assessorType === 'ai_persona';
          const score = Math.round((op.likelihood + op.impact) / 2);
          const isOutlier = synthesis.outlierFlags.includes(op.assessorId);

          return (
            <Paper key={op.assessorId} variant="outlined" sx={{
              p: 2.5,
              border: isOutlier ? '1px solid rgba(251,191,36,0.3)' : isAI ? '1px solid rgba(96,165,250,0.15)' : undefined,
              bgcolor: isAI ? 'rgba(96,165,250,0.03)' : undefined,
            }}>
              {/* Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{
                    width: 36, height: 36, fontSize: '0.8rem',
                    bgcolor: isAI ? '#1e3a5f' : ownerColors[op.assessorName] || '#374151',
                  }}>
                    {isAI ? '✦' : op.assessorName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h4">{op.assessorName.replace(' Persona', '')}</Typography>
                      {isOutlier && (
                        <Chip size="small" label="Outlier"
                          icon={<OutlierIcon sx={{ fontSize: '11px !important', color: '#fbbf24 !important' }} />}
                          sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }} />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {isAI && <AIBadgeIcon sx={{ fontSize: 11, color: '#60a5fa' }} />}
                      <Typography variant="caption" color="text.disabled">
                        {isAI ? 'AI assessor' : 'Human assessor'}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Score</Typography>
                    <Typography variant="h3" sx={{ color: SCORE_COLOR[score] }}>{score}</Typography>
                  </Box>
                  <Chip size="small" label={op.confidence} variant="outlined" sx={{ height: 24 }} />
                </Stack>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Scores */}
              <Grid container spacing={3} sx={{ mb: 2 }}>
                {[{ label: 'Likelihood', value: op.likelihood }, { label: 'Impact', value: op.impact }].map(s => (
                  <Grid key={s.label} size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', display: 'block', mb: 0.75 }}>
                      {s.label}
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <Box sx={{ width: `${(s.value / 5) * 100}%`, height: '100%', bgcolor: SCORE_COLOR[s.value], borderRadius: 4 }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: SCORE_COLOR[s.value], minWidth: 20 }}>
                        {s.value}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ minWidth: 60 }}>
                        {SCORE_LABEL[s.value]}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>

              {/* Written assessment */}
              <Box sx={{ mb: 2, p: 2, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', display: 'block', mb: 1 }}>
                  Written assessment
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {op.rationale}
                </Typography>
              </Box>

              {/* Attachments */}
              {isAI && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', display: 'block', mb: 0.75 }}>
                    Attachments
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {[
                      `${op.assessorName.replace(' Persona', '').replace(' ', '_')}_Analysis_Q1_2026.pdf`,
                      ...(opIdx % 2 === 0 ? [`${op.assessorName.replace(' Persona', '').replace(' ', '_')}_Supporting_Notes.pdf`] : []),
                    ].map(f => (
                      <Chip key={f} size="small" label={f}
                        icon={<FileAttachIcon sx={{ fontSize: '12px !important' }} />}
                        variant="outlined"
                        sx={{ height: 24, fontSize: '0.72rem', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(96,165,250,0.06)' } }} />
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
