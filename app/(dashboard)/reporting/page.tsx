'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon, PictureAsPdf as PdfIcon, Refresh as RegenerateIcon } from '@mui/icons-material';

const KRI_ROWS = [
  { kri: 'Unpatched CVEs', start: '1', end: '4', trend: '↑', statusChange: 'Green → Red', trendColor: '#E54E54' },
  { kri: 'FX Hedge Ratio', start: '92%', end: '74%', trend: '↓', statusChange: 'Green → Red', trendColor: '#E54E54' },
  { kri: 'Regulatory Findings >30d', start: '0%', end: '12%', trend: '↑', statusChange: 'Green → Red', trendColor: '#E54E54' },
  { kri: 'Failed Auth Attempts/wk', start: '12', end: '18', trend: '↑', statusChange: 'Green → Amber', trendColor: '#C29A1D' },
  { kri: 'DR Test (days since)', start: '45', end: '214', trend: '↑', statusChange: 'Green → Red', trendColor: '#E54E54' },
];

const HISTORY_ROWS = [
  { type: 'Executive summary', period: 'Q4 2025', generatedBy: 'Agent', date: 'Dec 15, 2025' },
  { type: 'Detailed', period: 'Q3 2025', generatedBy: 'Agent', date: 'Sep 22, 2025' },
  { type: 'Board pack', period: 'Q3 2025', generatedBy: 'Sarah Chen', date: 'Sep 30, 2025' },
  { type: 'Executive summary', period: 'Q2 2025', generatedBy: 'Agent', date: 'Jun 18, 2025' },
];

interface SectionProps {
  borderColor: string;
  title: string;
  children: React.ReactNode;
}

function ReportSection({ borderColor, title, children }: SectionProps) {
  return (
    <Box sx={{ pl: 2, borderLeft: `3px solid ${borderColor}`, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '0.975rem' }}>{title}</Typography>
      {children}
    </Box>
  );
}

export default function ReportingPage() {
  const [reportType, setReportType] = useState('executive_summary');
  const [timeRange, setTimeRange] = useState('last_quarter');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  useEffect(() => {
    if (isGenerating) {
      const timer = setTimeout(() => {
        setIsGenerating(false);
        setReportGenerated(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating]);

  const handleRunAgent = () => {
    setReportGenerated(false);
    setIsGenerating(true);
  };

  return (
    <Box>
      {/* Page header */}
      <Stack sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Reporting
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI-generated risk summaries and portfolio reports
        </Typography>
      </Stack>

      {/* Report Generator */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Generate report</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Report type</InputLabel>
            <Select
              value={reportType}
              label="Report type"
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="executive_summary">Executive summary</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
              <MenuItem value="board_pack">Board pack</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Time range</InputLabel>
            <Select
              value={timeRange}
              label="Time range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="last_quarter">Last quarter</MenuItem>
              <MenuItem value="last_year">Last year</MenuItem>
              <MenuItem value="custom">Custom range</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleRunAgent}
            disabled={isGenerating}
          >
            Run agent
          </Button>
        </Stack>
        {isGenerating && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Generating report…
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </Paper>

      {/* Generated Report */}
      {reportGenerated && (
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          {/* Report header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Q1 2026 Executive Risk Summary</Typography>
              <Chip size="small" label="Executive summary" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PdfIcon />}
                onClick={() => setToast({ open: true, message: 'Exporting...' })}
              >
                Export PDF
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RegenerateIcon />}
                onClick={handleRunAgent}
              >
                Regenerate
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Section 1: What happened */}
          <ReportSection borderColor="#1976d2" title="What happened">
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              In Q1 2026, the risk portfolio expanded from 47 to 50 active risks following a successful agent-led
              identification pass on Q1 board materials and external regulatory filings. Four risks were escalated to
              critical severity, driven primarily by deteriorating KRI signals in the cyber and compliance categories.
              The FX hedge ratio decline (KRI-007) and unpatched CVE accumulation (KRI-001) were the primary drivers
              of portfolio risk score increase.
            </Typography>
          </ReportSection>

          {/* Section 2: Why it happened */}
          <ReportSection borderColor="#9c27b0" title="Why it happened">
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              Two root causes dominated: (1) treasury capacity constraints prevented renewal of three FX hedging
              instruments as they matured in Q4 2025, and (2) the MFA remediation programme on cloud admin endpoints
              was delayed by 6 weeks due to vendor scheduling conflicts. Combined with DORA&apos;s full enforcement from
              January 2025, compliance-related risk scores increased materially.
            </Typography>
          </ReportSection>

          {/* Section 3: Decisions taken */}
          <ReportSection borderColor="#009688" title="Decisions taken">
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {[
                'ASSESS CR-014 (Cloud Infrastructure) — Agent draft approved by J. Chen, Mar 8',
                'SUGGEST_CTRL FR-003 (FX Concentration) — 3 controls approved, 1 rejected, Mar 12',
                'IDENTIFY Batch Q1 upload — 14 risks extracted, 12 approved, 2 rejected as duplicates, Mar 15',
                'ASSESS OP-007 (Business Continuity) — Deferred to Q2 cycle by risk manager, Mar 18',
              ].map((item, i) => (
                <Box component="li" key={i} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{item}</Typography>
                </Box>
              ))}
            </Box>
          </ReportSection>

          {/* Section 4: KRI evolution */}
          <ReportSection borderColor="#ed6c02" title="KRI evolution">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>KRI</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Start (Oct 2025)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>End (Mar 2026)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trend</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {KRI_ROWS.map((row) => (
                    <TableRow key={row.kri}>
                      <TableCell>{row.kri}</TableCell>
                      <TableCell>{row.start}</TableCell>
                      <TableCell>{row.end}</TableCell>
                      <TableCell sx={{ color: row.trendColor, fontWeight: 600 }}>{row.trend}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{row.statusChange}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ReportSection>

          {/* Section 5: Risk portfolio delta */}
          <ReportSection borderColor="#9e9e9e" title="Risk portfolio delta">
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              50 risks active (+3 net). 12 newly identified · 9 previously closed or accepted · 4 escalated to critical · 2 de-escalated to medium
            </Typography>
          </ReportSection>

          {/* Section 6: Recommendations */}
          <ReportSection borderColor="#2e7d32" title="Recommendations for next quarter">
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {[
                'Complete MFA deployment on admin endpoints — estimated KRI-001 reduction from RED to GREEN',
                'Renew FX hedging instruments — treasury to prioritise Q2, targets KRI-007 recovery to ≥80%',
                'Close DORA Art. 9 audit findings — assign dedicated compliance resource',
                'Schedule DR test before end of Q2 — KRI-006 now 214 days, tolerance is 180',
                'Initiate Q2 identification survey for Operations department',
              ].map((item, i) => (
                <Box component="li" key={i} sx={{ mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{item}</Typography>
                </Box>
              ))}
            </Box>
          </ReportSection>
        </Paper>
      )}

      {/* Report History */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Report history</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Generated by</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {HISTORY_ROWS.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.period}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {row.generatedBy === 'Agent' && (
                        <AutoAwesomeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                      )}
                      <Typography variant="body2">{row.generatedBy}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{row.date}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setToast({ open: true, message: 'Report loading...' })}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast({ open: false, message: '' })} severity="info" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
