'use client';

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
  Button,
} from '@mui/material';
import {
  Upload as UploadIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface AnalysisHistoryItem {
  id: string;
  date: Date;
  documentsCount: number;
  risksFound: number;
  risksApproved: number;
  status: 'completed' | 'in_progress';
}

const analysisHistory: AnalysisHistoryItem[] = [];

export default function HistoryPage() {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Past discovery sessions
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/"
          variant="contained"
          size="small"
          startIcon={<UploadIcon />}
        >
          New Session
        </Button>
      </Stack>

      {analysisHistory.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }} variant="outlined">
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            No history yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Complete a discovery session to see history.
          </Typography>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            size="small"
            startIcon={<UploadIcon />}
          >
            Start First Session
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Risks Found</TableCell>
                <TableCell>Approved</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysisHistory.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {session.date.toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{session.documentsCount}</TableCell>
                  <TableCell>{session.risksFound}</TableCell>
                  <TableCell>{session.risksApproved}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={session.status === 'completed' ? 'Complete' : 'In Progress'}
                      color={session.status === 'completed' ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ height: 22 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
