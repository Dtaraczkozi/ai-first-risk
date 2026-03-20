'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  IconButton,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Collapse,
  Tooltip,
  LinearProgress,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  KeyboardArrowDown as ChevronDownIcon,
  KeyboardArrowUp as ChevronUpIcon,
  Search as SearchIcon,
  Sync as SyncIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AutoAwesome as AgentIcon,
  Warning as WarningIcon,
  CheckCircle as OkIcon,
  LinkOutlined as LinkIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  ReferenceLine,
} from 'recharts';
import { getKRIs, updateKRI, updateKRIValue, saveKRIs } from '@/lib/kri-store';
import { getApprovedRisks } from '@/lib/risk-store';
import type { KeyRiskIndicator, KRIStatus } from '@/types/kri';
import type { RiskSuggestion } from '@/types/document';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<KRIStatus, string> = {
  red:   '#f87171',
  amber: '#fbbf24',
  green: '#4ade80',
};

const STATUS_BG: Record<KRIStatus, string> = {
  red:   'rgba(248,113,113,0.12)',
  amber: 'rgba(251,191,36,0.1)',
  green: 'rgba(74,222,128,0.1)',
};

const STATUS_BORDER: Record<KRIStatus, string> = {
  red:   'rgba(248,113,113,0.3)',
  amber: 'rgba(251,191,36,0.25)',
  green: 'rgba(74,222,128,0.25)',
};

const CATEGORY_LABEL: Record<string, string> = {
  cyber:       'Cyber',
  compliance:  'Compliance',
  operational: 'Operational',
  financial:   'Financial',
  strategic:   'Strategic',
};

const CATEGORY_COLOR: Record<string, string> = {
  cyber:       '#60a5fa',
  compliance:  '#a78bfa',
  operational: '#fb923c',
  financial:   '#34d399',
  strategic:   '#f472b6',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// ─── Sparkline component ──────────────────────────────────────────────────────

function Sparkline({ kri, width = 80, height = 28 }: { kri: KeyRiskIndicator; width?: number; height?: number }) {
  const color = STATUS_COLOR[kri.status];
  const data = kri.history.map((h) => ({ value: h.value }));
  return (
    <LineChart width={width} height={height} data={data}>
      <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
    </LineChart>
  );
}

// ─── Trend chart (expanded) ───────────────────────────────────────────────────

function TrendChart({ kri }: { kri: KeyRiskIndicator }) {
  const color = STATUS_COLOR[kri.status];
  const now = new Date();

  const data = kri.history.map((h, i) => {
    const monthOffset = kri.history.length - 1 - i;
    const d = new Date(now.getTime() - monthOffset * 30 * 24 * 60 * 60 * 1000);
    return {
      month: MONTHS[d.getMonth()],
      value: h.value,
    };
  });

  return (
    <Box sx={{ width: '100%', height: 120 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <RechartsTooltip
            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11 }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <ReferenceLine y={kri.threshold.greenMax} stroke="#4ade80" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine y={kri.threshold.amberMax} stroke="#fbbf24" strokeDasharray="3 3" strokeWidth={1} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <Stack direction="row" spacing={2} sx={{ px: 1, mt: 0.5 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 20, height: 1.5, bgcolor: '#4ade80', opacity: 0.6 }} />
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#4ade80', opacity: 0.7 }}>
            Green threshold ({kri.threshold.direction === 'lower_is_better' ? '≤' : '≥'}{kri.threshold.greenMax})
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 20, height: 1.5, bgcolor: '#fbbf24', opacity: 0.6 }} />
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#fbbf24', opacity: 0.7 }}>
            Amber threshold ({kri.threshold.direction === 'lower_is_better' ? '≤' : '≥'}{kri.threshold.amberMax})
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

// ─── Threshold bar ────────────────────────────────────────────────────────────

function ThresholdBar({ kri }: { kri: KeyRiskIndicator }) {
  const { greenMax, amberMax, direction } = kri.threshold;
  const maxRange = direction === 'lower_is_better' ? amberMax * 1.5 : greenMax * 1.2;
  const clampedValue = Math.min(kri.currentValue, maxRange);

  const pct = maxRange > 0 ? (clampedValue / maxRange) * 100 : 0;
  const barColor = STATUS_COLOR[kri.status];

  return (
    <Tooltip
      title={
        direction === 'lower_is_better'
          ? `Green ≤${greenMax} · Amber ≤${amberMax} · Red >${amberMax}`
          : `Green ≥${greenMax} · Amber ≥${amberMax} · Red <${amberMax}`
      }
      arrow
    >
      <Box sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', overflow: 'hidden', cursor: 'default' }}>
        <Box sx={{ width: `${Math.min(pct, 100)}%`, height: '100%', bgcolor: barColor, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </Box>
    </Tooltip>
  );
}

// ─── KRI row ──────────────────────────────────────────────────────────────────

function KRIRow({
  kri,
  risks,
  expanded,
  onToggle,
  onUpdate,
}: {
  kri: KeyRiskIndicator;
  risks: RiskSuggestion[];
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (id: string, updates: Partial<KeyRiskIndicator>) => void;
}) {
  const [editValue, setEditValue] = useState(false);
  const [draftValue, setDraftValue] = useState(String(kri.currentValue));
  const [editThreshold, setEditThreshold] = useState(false);
  const [draftGreen, setDraftGreen] = useState(String(kri.threshold.greenMax));
  const [draftAmber, setDraftAmber] = useState(String(kri.threshold.amberMax));

  const color = STATUS_COLOR[kri.status];
  const catColor = CATEGORY_COLOR[kri.category] ?? '#94a3b8';

  const TrendIcon = kri.trend === 'improving' ? TrendingDownIcon
    : kri.trend === 'worsening' ? TrendingUpIcon : TrendingFlatIcon;
  const trendColor = kri.trend === 'improving' ? '#4ade80'
    : kri.trend === 'worsening' ? '#f87171' : '#94a3b8';

  const linkedRisks = risks.filter((r) => kri.linkedRiskIds.includes(r.id));

  function saveValue() {
    const v = parseFloat(draftValue);
    if (!isNaN(v)) {
      updateKRIValue(kri.id, v);
      onUpdate(kri.id, { currentValue: v, lastUpdatedAt: new Date() });
    }
    setEditValue(false);
  }

  function saveThreshold() {
    const g = parseFloat(draftGreen);
    const a = parseFloat(draftAmber);
    if (!isNaN(g) && !isNaN(a)) {
      const newThreshold = { ...kri.threshold, greenMax: g, amberMax: a };
      updateKRI(kri.id, { threshold: newThreshold });
      onUpdate(kri.id, { threshold: newThreshold });
    }
    setEditThreshold(false);
  }

  return (
    <>
      <TableRow
        hover
        onClick={onToggle}
        sx={{ cursor: 'pointer', '& td': { borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : undefined } }}
      >
        {/* Status */}
        <TableCell sx={{ width: 40, pr: 0 }}>
          <Tooltip title={kri.status.toUpperCase()} arrow>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, mx: 'auto', boxShadow: `0 0 6px ${color}` }} />
          </Tooltip>
        </TableCell>

        {/* Name + agent badge */}
        <TableCell>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{kri.name}</Typography>
            {kri.agentGenerated && (
              <Chip size="small" icon={<AgentIcon sx={{ fontSize: '10px !important' }} />} label="AI"
                sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', '& .MuiChip-icon': { ml: 0.5 } }} />
            )}
          </Stack>
        </TableCell>

        {/* Category */}
        <TableCell>
          <Chip size="small" label={CATEGORY_LABEL[kri.category] ?? kri.category}
            sx={{ height: 18, fontSize: '0.68rem', bgcolor: `${catColor}18`, color: catColor }} />
        </TableCell>

        {/* Current value */}
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
            {kri.currentValue}<Typography component="span" variant="caption" sx={{ ml: 0.4, color: 'text.disabled', fontWeight: 400 }}>{kri.threshold.unit}</Typography>
          </Typography>
        </TableCell>

        {/* Threshold */}
        <TableCell>
          <Typography variant="caption" color="text.disabled" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            {kri.threshold.direction === 'lower_is_better' ? '≤' : '≥'}{kri.threshold.greenMax} / {kri.threshold.direction === 'lower_is_better' ? '≤' : '≥'}{kri.threshold.amberMax}
          </Typography>
        </TableCell>

        {/* Sparkline */}
        <TableCell>
          <Sparkline kri={kri} />
        </TableCell>

        {/* Trend */}
        <TableCell>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <TrendIcon sx={{ fontSize: 14, color: trendColor }} />
            <Typography variant="caption" sx={{ color: trendColor }}>{kri.trend}</Typography>
          </Stack>
        </TableCell>

        {/* Owner */}
        <TableCell>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {kri.owner.split(' ').map(n => n[0]).join('.')}. {kri.owner.split(' ').slice(-1)[0]}
          </Typography>
        </TableCell>

        {/* Updated */}
        <TableCell>
          <Typography variant="caption" color="text.disabled">{timeAgo(kri.lastUpdatedAt)}</Typography>
        </TableCell>

        {/* Expand */}
        <TableCell sx={{ width: 36, pl: 0 }} onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          <IconButton size="small" sx={{ color: 'text.disabled' }}>
            {expanded ? <ChevronUpIcon sx={{ fontSize: 16 }} /> : <ChevronDownIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expanded detail row */}
      <TableRow>
        <TableCell colSpan={10} sx={{ p: 0, border: 'none' }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ px: 3, py: 2.5, bgcolor: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Grid container spacing={3}>

                {/* Left: description + agent note + links */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Description</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{kri.description}</Typography>
                    </Box>

                    {kri.agentNote && (
                      <Box sx={{ p: 1.5, bgcolor: 'rgba(96,165,250,0.06)', borderRadius: 1.5, border: '1px solid rgba(96,165,250,0.15)' }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                          <AgentIcon sx={{ fontSize: 12, color: '#60a5fa' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#60a5fa' }}>Agent note</Typography>
                          {kri.updatedByAgentAt && (
                            <Typography variant="caption" color="text.disabled">· {timeAgo(kri.updatedByAgentAt)}</Typography>
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>{kri.agentNote}</Typography>
                      </Box>
                    )}

                    {/* Linked risks */}
                    <Box>
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                        <LinkIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          Linked risks ({linkedRisks.length})
                        </Typography>
                      </Stack>
                      {linkedRisks.length > 0 ? (
                        <Stack spacing={0.5}>
                          {linkedRisks.map((r) => (
                            <Stack key={r.id} direction="row" spacing={0.75} alignItems="center">
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: catColor, flexShrink: 0 }} />
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>{r.title}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.disabled">No risks explicitly linked — signals derived by category</Typography>
                      )}
                    </Box>
                  </Stack>
                </Grid>

                {/* Middle: 6-month trend chart */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>6-month trend</Typography>
                  <TrendChart kri={kri} />
                </Grid>

                {/* Right: edit controls */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Stack spacing={2}>
                    {/* Update value */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Current value</Typography>
                        {!editValue && (
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditValue(true); setDraftValue(String(kri.currentValue)); }}
                            sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                            <EditIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        )}
                      </Stack>
                      {editValue ? (
                        <Stack direction="row" spacing={0.75} onClick={(e) => e.stopPropagation()}>
                          <TextField
                            size="small"
                            value={draftValue}
                            onChange={(e) => setDraftValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') saveValue(); if (e.key === 'Escape') setEditValue(false); }}
                            InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.disabled">{kri.threshold.unit}</Typography></InputAdornment> }}
                            sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5 } }}
                            autoFocus
                          />
                          <IconButton size="small" onClick={saveValue} sx={{ color: '#4ade80' }}><CheckIcon sx={{ fontSize: 14 }} /></IconButton>
                          <IconButton size="small" onClick={() => setEditValue(false)} sx={{ color: 'text.disabled' }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} alignItems="baseline">
                          <Typography variant="h5" sx={{ fontWeight: 700, color }}>{kri.currentValue}</Typography>
                          <Typography variant="caption" color="text.disabled">{kri.threshold.unit}</Typography>
                        </Stack>
                      )}
                      <ThresholdBar kri={kri} />
                    </Box>

                    {/* Edit thresholds */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Thresholds</Typography>
                        {!editThreshold && (
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditThreshold(true); setDraftGreen(String(kri.threshold.greenMax)); setDraftAmber(String(kri.threshold.amberMax)); }}
                            sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
                            <EditIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        )}
                      </Stack>
                      {editThreshold ? (
                        <Stack spacing={0.75} onClick={(e) => e.stopPropagation()}>
                          <TextField size="small" label="Green max" value={draftGreen} onChange={(e) => setDraftGreen(e.target.value)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5 }, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }} />
                          <TextField size="small" label="Amber max" value={draftAmber} onChange={(e) => setDraftAmber(e.target.value)}
                            sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5 }, '& .MuiInputLabel-root': { fontSize: '0.75rem' } }} />
                          <Stack direction="row" spacing={0.75}>
                            <Button size="small" variant="contained" startIcon={<CheckIcon sx={{ fontSize: '12px !important' }} />} onClick={saveThreshold} sx={{ flex: 1, fontSize: '0.72rem', py: 0.5 }}>Save</Button>
                            <Button size="small" variant="outlined" onClick={() => setEditThreshold(false)} sx={{ fontSize: '0.72rem', py: 0.5 }}>Cancel</Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Stack spacing={0.5}>
                          {[
                            { label: 'Green', color: '#4ade80', value: `${kri.threshold.direction === 'lower_is_better' ? '≤' : '≥'}${kri.threshold.greenMax} ${kri.threshold.unit}` },
                            { label: 'Amber', color: '#fbbf24', value: `${kri.threshold.direction === 'lower_is_better' ? '≤' : '≥'}${kri.threshold.amberMax} ${kri.threshold.unit}` },
                            { label: 'Red', color: '#f87171', value: kri.threshold.direction === 'lower_is_better' ? `>${kri.threshold.amberMax} ${kri.threshold.unit}` : `<${kri.threshold.amberMax} ${kri.threshold.unit}` },
                          ].map((t) => (
                            <Stack key={t.label} direction="row" spacing={1} alignItems="center">
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: t.color, flexShrink: 0 }} />
                              <Typography variant="caption" sx={{ fontWeight: 600, color: t.color, width: 36 }}>{t.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{t.value}</Typography>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Grid>

              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ─── Add KRI dialog ───────────────────────────────────────────────────────────

function AddKRIDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (kri: KeyRiskIndicator) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<KeyRiskIndicator['category']>('operational');
  const [unit, setUnit] = useState('count');
  const [direction, setDirection] = useState<'lower_is_better' | 'higher_is_better'>('lower_is_better');
  const [greenMax, setGreenMax] = useState('');
  const [amberMax, setAmberMax] = useState('');
  const [owner, setOwner] = useState('');

  function handleAdd() {
    if (!name || !greenMax || !amberMax || !owner) return;
    const g = parseFloat(greenMax), a = parseFloat(amberMax);
    if (isNaN(g) || isNaN(a)) return;

    const newKRI: KeyRiskIndicator = {
      id: `kri-${Date.now()}`,
      name,
      description,
      category,
      currentValue: 0,
      threshold: { greenMax: g, amberMax: a, unit, direction },
      status: 'green',
      trend: 'stable',
      history: [{ value: 0, recordedAt: new Date() }],
      linkedRiskIds: [],
      owner,
      lastUpdatedAt: new Date(),
      agentGenerated: false,
    };
    onAdd(newKRI);
    onClose();
    setName(''); setDescription(''); setGreenMax(''); setAmberMax(''); setOwner('');
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', pb: 1.5 }}>
        Add KRI
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          <TextField label="KRI name" value={name} onChange={(e) => setName(e.target.value)} size="small" fullWidth required />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} size="small" fullWidth multiline rows={2} />
          <Stack direction="row" spacing={1.5}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary' }}>Category</Typography>
              <Select value={category} onChange={(e) => setCategory(e.target.value as KeyRiskIndicator['category'])}>
                {Object.entries(CATEGORY_LABEL).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary' }}>Direction</Typography>
              <Select value={direction} onChange={(e) => setDirection(e.target.value as 'lower_is_better' | 'higher_is_better')}>
                <MenuItem value="lower_is_better">Lower is better</MenuItem>
                <MenuItem value="higher_is_better">Higher is better</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} size="small" sx={{ flex: 1 }} placeholder="count, %, days…" />
            <TextField label="Green threshold" value={greenMax} onChange={(e) => setGreenMax(e.target.value)} size="small" sx={{ flex: 1 }} type="number" />
            <TextField label="Amber threshold" value={amberMax} onChange={(e) => setAmberMax(e.target.value)} size="small" sx={{ flex: 1 }} type="number" />
          </Stack>
          <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} size="small" fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button size="small" onClick={onClose}>Cancel</Button>
        <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />} onClick={handleAdd} disabled={!name || !greenMax || !amberMax || !owner}>
          Add KRI
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KRIsPage() {
  const [kris, setKRIs] = useState<KeyRiskIndicator[]>([]);
  const [risks, setRisks] = useState<RiskSuggestion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setKRIs(getKRIs());
    setRisks(getApprovedRisks());
  }, []);

  const owners = useMemo(() => [...new Set(kris.map((k) => k.owner))].sort(), [kris]);

  const filtered = useMemo(() => {
    return kris.filter((k) => {
      if (filterCategory !== 'all' && k.category !== filterCategory) return false;
      if (filterStatus !== 'all' && k.status !== filterStatus) return false;
      if (filterOwner !== 'all' && k.owner !== filterOwner) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!k.name.toLowerCase().includes(s) && !k.description.toLowerCase().includes(s) && !k.owner.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [kris, filterCategory, filterStatus, filterOwner, search]);

  const summary = useMemo(() => ({
    red: kris.filter((k) => k.status === 'red').length,
    amber: kris.filter((k) => k.status === 'amber').length,
    green: kris.filter((k) => k.status === 'green').length,
    total: kris.length,
  }), [kris]);

  // KRIs needing attention (not green)
  const attentionRequired = useMemo(
    () => kris.filter((k) => k.status !== 'green').length,
    [kris]
  );

  function handleKRIUpdate(id: string, updates: Partial<KeyRiskIndicator>) {
    setKRIs((prev) => prev.map((k) => (k.id === id ? { ...k, ...updates } : k)));
  }

  function handleAddKRI(kri: KeyRiskIndicator) {
    const updated = [...kris, kri];
    saveKRIs(updated);
    setKRIs(updated);
  }

  function simulateAgentSync() {
    setSyncing(true);
    setTimeout(() => {
      // Simulate agent updating a few KRI values
      const updated = kris.map((k, i) => {
        if (i % 3 !== 0) return k;
        const delta = k.trend === 'worsening' ? 1 : k.trend === 'improving' ? -1 : 0;
        const newVal = Math.max(0, k.currentValue + delta);
        return {
          ...k,
          currentValue: newVal,
          lastUpdatedAt: new Date(),
          updatedByAgentAt: new Date(),
          history: [...k.history, { value: newVal, recordedAt: new Date() }],
        };
      });
      saveKRIs(updated);
      setKRIs(updated);
      setSyncing(false);
    }, 1400);
  }

  return (
    <Box>
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
        <Box>
          <Typography variant="h1" component="h1">
            Key risk indicators
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Monitor leading signals and early warnings across the risk portfolio
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SyncIcon sx={{ fontSize: '14px !important', animation: syncing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />}
            onClick={simulateAgentSync}
            disabled={syncing}
          >
            {syncing ? 'Syncing…' : 'Agent sync'}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '14px !important' }} />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add KRI
          </Button>
        </Stack>
      </Stack>

      {/* ── Stats strip ── */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          {
            label: 'Total KRIs',
            value: summary.total,
            sub: 'across all categories',
            color: 'text.primary',
            accent: 'rgba(255,255,255,0.03)',
          },
          {
            label: 'Red',
            value: summary.red,
            sub: 'breached threshold',
            color: '#f87171',
            accent: 'rgba(248,113,113,0.06)',
            icon: <WarningIcon sx={{ fontSize: 14, color: '#f87171', opacity: 0.8 }} />,
          },
          {
            label: 'Amber',
            value: summary.amber,
            sub: 'at risk — monitor closely',
            color: '#fbbf24',
            accent: 'rgba(251,191,36,0.06)',
          },
          {
            label: 'Green',
            value: summary.green,
            sub: 'within tolerance',
            color: '#4ade80',
            accent: 'rgba(74,222,128,0.05)',
            icon: <OkIcon sx={{ fontSize: 14, color: '#4ade80', opacity: 0.8 }} />,
          },
          {
            label: 'Coverage',
            value: `${risks.length > 0 ? Math.round((kris.filter(k => k.linkedRiskIds.length > 0).length / Math.max(kris.length, 1)) * 100) : 0}%`,
            sub: 'KRIs linked to risks',
            color: '#60a5fa',
            accent: 'rgba(96,165,250,0.05)',
          },
          {
            label: 'Needs attention',
            value: attentionRequired,
            sub: 'red or amber status',
            color: attentionRequired > 0 ? '#fbbf24' : '#4ade80',
            accent: attentionRequired > 0 ? 'rgba(251,191,36,0.05)' : 'transparent',
          },
        ].map((stat) => (
          <Grid key={stat.label} size={{ xs: 6, sm: 4, md: 2 }}>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: stat.accent, height: '100%' }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography sx={{ fontSize: '32px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                  {stat.value}
                </Typography>
                {stat.icon}
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: 'text.primary', mt: 0.25 }}>
                {stat.label}
              </Typography>
              <Typography variant="caption" color="text.disabled">{stat.sub}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Filter toolbar ── */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search KRIs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
            sx={{ minWidth: 200, '& .MuiInputBase-input': { fontSize: '0.82rem' } }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} displayEmpty
              sx={{ fontSize: '0.82rem' }}>
              <MenuItem value="all">All categories</MenuItem>
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} displayEmpty
              sx={{ fontSize: '0.82rem' }}>
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="red">Red</MenuItem>
              <MenuItem value="amber">Amber</MenuItem>
              <MenuItem value="green">Green</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} displayEmpty
              sx={{ fontSize: '0.82rem' }}>
              <MenuItem value="all">All owners</MenuItem>
              {owners.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ flex: 1 }} />

          <Stack direction="row" spacing={0.75}>
            {(['red', 'amber', 'green'] as KRIStatus[]).map((s) => (
              <Chip
                key={s}
                size="small"
                label={`${summary[s]} ${s}`}
                onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  bgcolor: filterStatus === s ? STATUS_BG[s] : 'transparent',
                  color: STATUS_COLOR[s],
                  border: `1px solid ${STATUS_BORDER[s]}`,
                  cursor: 'pointer',
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* ── KRI table ── */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.disabled">No KRIs match the current filters</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40, pr: 0 }} />
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Current</TableCell>
                <TableCell>Thresholds</TableCell>
                <TableCell>Trend (6mo)</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell sx={{ width: 36, pl: 0 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((kri) => (
                <KRIRow
                  key={kri.id}
                  kri={kri}
                  risks={risks}
                  expanded={expandedId === kri.id}
                  onToggle={() => setExpandedId((prev) => (prev === kri.id ? null : kri.id))}
                  onUpdate={handleKRIUpdate}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* ── Legend ── */}
      <Stack direction="row" spacing={3} sx={{ mt: 1.5, px: 0.5 }}>
        <Typography variant="caption" color="text.disabled">
          Click any row to expand details, edit values, and view the 6-month trend.
        </Typography>
        <Stack direction="row" spacing={1.5}>
          {[
            { label: 'Below tolerance', color: '#4ade80' },
            { label: 'Approaching threshold', color: '#fbbf24' },
            { label: 'Threshold breached', color: '#f87171' },
          ].map((l) => (
            <Stack key={l.label} direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: l.color }} />
              <Typography variant="caption" color="text.disabled">{l.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <AddKRIDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={handleAddKRI} />
    </Box>
  );
}
