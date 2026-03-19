'use client';

import {
  Box,
  Paper,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  Description as DocIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  CheckCircle as CheckIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material';
import type { UploadedDocument } from '@/types/document';

interface DocumentUploadProps {
  documents: UploadedDocument[];
  isUploading: boolean;
  uploadProgress: number;
  onStartUpload: () => void;
  loadingDocIds?: Set<string>;
}

const fileIcons: Record<string, React.ReactNode> = {
  pdf: <PdfIcon color="error" />,
  doc: <DocIcon color="primary" />,
  docx: <DocIcon color="primary" />,
  txt: <DocIcon />,
  xlsx: <ExcelIcon color="success" />,
};

const categoryLabels: Record<string, string> = {
  org_structure: 'Organization',
  reports: 'Reports',
  register: 'Risk Register',
  other: 'Other',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function DocumentUpload({ documents, isUploading, uploadProgress, onStartUpload, loadingDocIds = new Set() }: DocumentUploadProps) {
  const groupedDocs = documents.reduce((acc, doc) => {
    const category = doc.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, UploadedDocument[]>);

  if (documents.length === 0 && !isUploading) {
    return (
      <Paper
        onClick={onStartUpload}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50',
          },
        }}
      >
        <FolderIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Click to import organization data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Org charts, employee data, reports, and existing risk registers
        </Typography>
      </Paper>
    );
  }

  if (documents.length === 0 && isUploading) {
    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Importing files... {uploadProgress}%
        </Typography>
        <LinearProgress variant="determinate" value={uploadProgress} />
      </Box>
    );
  }

  return (
    <Box>
      {isUploading && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            Importing files... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      <Stack spacing={1}>
        {Object.entries(groupedDocs).map(([category, docs]) => {
          const loadingCount = docs.filter(d => loadingDocIds.has(d.id)).length;
          const loadedCount = docs.length - loadingCount;
          
          return (
            <Paper key={category} variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ px: 1.5, py: 0.75, backgroundColor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {categoryLabels[category]} ({loadedCount > 0 ? `${loadedCount} files` : 'loading...'})
                </Typography>
              </Box>
              <List dense disablePadding>
                {docs.map((doc, index) => {
                  const isLoading = loadingDocIds.has(doc.id);
                  
                  if (isLoading) {
                    return (
                      <ListItem
                        key={doc.id}
                        divider={index < docs.length - 1}
                        sx={{ py: 0.5, px: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Skeleton variant="circular" width={20} height={20} />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Skeleton variant="text" width="70%" height={18} />}
                          secondary={<Skeleton variant="text" width="30%" height={12} />}
                        />
                      </ListItem>
                    );
                  }
                  
                  return (
                    <ListItem
                      key={doc.id}
                      divider={index < docs.length - 1}
                      sx={{ py: 0.5, px: 1.5 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {fileIcons[doc.type] || <DocIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={formatFileSize(doc.size)}
                        primaryTypographyProps={{ variant: 'body2', fontSize: '0.8125rem' }}
                        secondaryTypographyProps={{ variant: 'caption', fontSize: '0.7rem' }}
                      />
                      {doc.status === 'analyzed' && (
                        <Chip
                          size="small"
                          icon={<CheckIcon />}
                          label="Processed"
                          color="success"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
