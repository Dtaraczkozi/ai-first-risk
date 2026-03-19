'use client';

import { Box, Typography, Tooltip, Paper } from '@mui/material';
import type { Risk } from '@/types/risk';

interface RiskMatrixProps {
  risks: Risk[];
  onRiskClick?: (risk: Risk) => void;
}

const LIKELIHOOD_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const IMPACT_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'];

function getCellColor(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score <= 4) return '#4caf50';
  if (score <= 9) return '#8bc34a';
  if (score <= 12) return '#ffc107';
  if (score <= 16) return '#ff9800';
  return '#f44336';
}

export function RiskMatrix({ risks, onRiskClick }: RiskMatrixProps) {
  const getRisksInCell = (likelihood: number, impact: number) => {
    return risks.filter(r => r.likelihood === likelihood && r.impact === impact);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Risk Heat Map
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', pr: 1 }}>
          <Typography
            variant="caption"
            sx={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              fontWeight: 600,
            }}
          >
            LIKELIHOOD →
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, 1fr)', gap: 0.5 }}>
            <Box />
            {IMPACT_LABELS.map((label, i) => (
              <Box key={i} sx={{ textAlign: 'center', pb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {label}
                </Typography>
              </Box>
            ))}

            {[5, 4, 3, 2, 1].map((likelihood) => (
              <>
                <Box
                  key={`label-${likelihood}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pr: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {LIKELIHOOD_LABELS[likelihood - 1]}
                  </Typography>
                </Box>
                {[1, 2, 3, 4, 5].map((impact) => {
                  const cellRisks = getRisksInCell(likelihood, impact);
                  const cellColor = getCellColor(likelihood, impact);
                  
                  return (
                    <Tooltip
                      key={`${likelihood}-${impact}`}
                      title={
                        cellRisks.length > 0 ? (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {cellRisks.length} risk{cellRisks.length !== 1 ? 's' : ''}
                            </Typography>
                            {cellRisks.slice(0, 3).map((r) => (
                              <Typography key={r.id} variant="caption" display="block">
                                • {r.title}
                              </Typography>
                            ))}
                            {cellRisks.length > 3 && (
                              <Typography variant="caption" display="block">
                                + {cellRisks.length - 3} more
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          `Likelihood: ${LIKELIHOOD_LABELS[likelihood - 1]}, Impact: ${IMPACT_LABELS[impact - 1]}`
                        )
                      }
                    >
                      <Box
                        sx={{
                          aspectRatio: '1',
                          backgroundColor: cellColor,
                          opacity: cellRisks.length > 0 ? 1 : 0.3,
                          borderRadius: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: cellRisks.length > 0 ? 'pointer' : 'default',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': cellRisks.length > 0 ? {
                            transform: 'scale(1.05)',
                            boxShadow: 2,
                          } : {},
                        }}
                        onClick={() => {
                          if (cellRisks.length > 0 && onRiskClick) {
                            onRiskClick(cellRisks[0]);
                          }
                        }}
                      >
                        {cellRisks.length > 0 && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: 'white',
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            }}
                          >
                            {cellRisks.length}
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </>
            ))}

            <Box />
            <Box sx={{ gridColumn: 'span 5', textAlign: 'center', pt: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                IMPACT →
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {[
          { color: '#4caf50', label: 'Low' },
          { color: '#8bc34a', label: 'Low-Med' },
          { color: '#ffc107', label: 'Medium' },
          { color: '#ff9800', label: 'High' },
          { color: '#f44336', label: 'Critical' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: color, borderRadius: 0.5 }} />
            <Typography variant="caption">{label}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
