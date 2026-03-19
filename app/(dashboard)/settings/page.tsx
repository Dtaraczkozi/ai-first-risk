'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  OpenInNew as ExternalLinkIcon,
  Folder as FolderIcon,
  Language as WebIcon,
  Business as CompetitorIcon,
  Article as NewsIcon,
  TrendingUp as TrendIcon,
  Gavel as RegulatoryIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import type { DataSource, UploadedDocument } from '@/types/document';
import { mockDocuments, mockDataSources } from '@/data/mock/analysis-session';

const SOURCES_STORAGE_KEY = 'intelligence-sources';

export default function SettingsPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', type: 'news', url: '', description: '' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SOURCES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDocuments(parsed.documents || mockDocuments);
        setDataSources(parsed.dataSources || mockDataSources);
      } else {
        setDocuments(mockDocuments);
        setDataSources(mockDataSources);
      }
    }
  }, []);

  useEffect(() => {
    if (documents.length > 0 || dataSources.length > 0) {
      localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify({ documents, dataSources }));
    }
  }, [documents, dataSources]);

  const removeSource = (sourceId: string) => {
    setDataSources(prev => prev.filter(s => s.id !== sourceId));
  };

  const updateSource = (sourceId: string, updates: Partial<DataSource>) => {
    setDataSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, ...updates } : s
    ));
  };

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const addSource = () => {
    if (!newSource.name.trim()) return;
    const source: DataSource = {
      id: `src-${Date.now()}`,
      name: newSource.name,
      type: newSource.type as DataSource['type'],
      url: newSource.url || undefined,
      description: newSource.description,
      relevance: 'medium',
      extractedAt: new Date(),
    };
    setDataSources(prev => [...prev, source]);
    setNewSource({ name: '', type: 'news', url: '', description: '' });
    setIsAddingSource(false);
  };

  const typeIcons: Record<string, React.ReactNode> = {
    competitor: <CompetitorIcon sx={{ fontSize: 20, color: '#282E37' }} />,
    news: <NewsIcon sx={{ fontSize: 20, color: '#282E37' }} />,
    '10k_filing': <RegulatoryIcon sx={{ fontSize: 20, color: '#282E37' }} />,
    trend: <TrendIcon sx={{ fontSize: 20, color: '#282E37' }} />,
    document: <FileIcon sx={{ fontSize: 20, color: '#282E37' }} />,
  };

  const typeLabels: Record<string, string> = {
    competitor: 'Competitor',
    news: 'News',
    '10k_filing': 'Regulatory',
    trend: 'Trend',
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage intelligence sources and application preferences
          </Typography>
        </Box>
      </Stack>

      {/* Uploaded Documents Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <FolderIcon sx={{ fontSize: 24, color: '#282E37' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Uploaded Documents
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Internal documents used for risk analysis
              </Typography>
            </Box>
          </Stack>
          <Button size="small" startIcon={<AddIcon />} variant="outlined">
            Upload
          </Button>
        </Stack>

        <Stack spacing={1}>
          {documents.map((doc) => (
            <Paper
              key={doc.id}
              variant="outlined"
              sx={{
                p: 2,
                '&:hover': { bgcolor: 'grey.50' },
                '&:hover .doc-actions': { opacity: 1 },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                  <FileIcon sx={{ fontSize: 20, color: '#282E37' }} />
                  <Box sx={{ flex: 1 }}>
                    {editingDocId === doc.id ? (
                      <TextField
                        value={doc.name}
                        size="small"
                        fullWidth
                        autoFocus
                        onBlur={() => setEditingDocId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            setEditingDocId(null);
                          }
                        }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {doc.name}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        label={doc.category === 'org_structure' ? 'Organization' : doc.category === 'reports' ? 'Reports' : 'Risk Register'}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {(doc.size / 1024 / 1024).toFixed(1)} MB
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
                <Stack 
                  direction="row" 
                  spacing={0.5} 
                  className="doc-actions"
                  sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                >
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => setEditingDocId(doc.id)}>
                      <EditIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => removeDocument(doc.id)} color="error">
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
          {documents.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No documents uploaded
            </Typography>
          )}
        </Stack>
      </Box>

      {/* External Sources Section */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <WebIcon sx={{ fontSize: 24, color: '#282E37' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                External Sources
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Competitors, news, regulatory filings, and trend sources
              </Typography>
            </Box>
          </Stack>
          <Button 
            size="small" 
            startIcon={<AddIcon />} 
            variant="outlined"
            onClick={() => setIsAddingSource(true)}
          >
            Add Source
          </Button>
        </Stack>

        {/* Add new source form */}
        {isAddingSource && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Add New Source
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Name"
                  size="small"
                  value={newSource.name}
                  onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={newSource.type}
                    label="Type"
                    onChange={(e) => setNewSource(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <MenuItem value="competitor">Competitor</MenuItem>
                    <MenuItem value="news">News</MenuItem>
                    <MenuItem value="10k_filing">Regulatory</MenuItem>
                    <MenuItem value="trend">Trend</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <TextField
                label="Url"
                size="small"
                value={newSource.url}
                onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Description"
                size="small"
                value={newSource.description}
                onChange={(e) => setNewSource(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={2}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" onClick={() => setIsAddingSource(false)}>
                  Cancel
                </Button>
                <Button size="small" variant="contained" onClick={addSource} disabled={!newSource.name.trim()}>
                  Add
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        <Stack spacing={1}>
          {dataSources.filter(s => s.type !== 'document').map((source) => (
            <Paper
              key={source.id}
              variant="outlined"
              sx={{
                p: 2,
                '&:hover': { bgcolor: 'grey.50' },
                '&:hover .source-actions': { opacity: 1 },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
                  <Box sx={{ mt: 0.25 }}>
                    {typeIcons[source.type] || <WebIcon sx={{ fontSize: 20, color: '#282E37' }} />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    {editingSourceId === source.id ? (
                      <Stack spacing={1.5}>
                        <TextField
                          value={source.name}
                          size="small"
                          fullWidth
                          label="Name"
                          onChange={(e) => updateSource(source.id, { name: e.target.value })}
                        />
                        <TextField
                          value={source.url || ''}
                          size="small"
                          fullWidth
                          label="Url"
                          onChange={(e) => updateSource(source.id, { url: e.target.value })}
                        />
                        <TextField
                          value={source.description}
                          size="small"
                          fullWidth
                          label="Description"
                          multiline
                          rows={2}
                          onChange={(e) => updateSource(source.id, { description: e.target.value })}
                        />
                        <Stack direction="row" justifyContent="flex-end">
                          <Button size="small" onClick={() => setEditingSourceId(null)}>
                            Done
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {source.name}
                          </Typography>
                          {source.url && (
                            <IconButton
                              size="small"
                              component="a"
                              href={source.url}
                              target="_blank"
                              sx={{ p: 0.25 }}
                            >
                              <ExternalLinkIcon sx={{ fontSize: 14, color: '#282E37' }} />
                            </IconButton>
                          )}
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                          <Chip
                            size="small"
                            label={typeLabels[source.type] || source.type}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {source.description}
                          </Typography>
                        </Stack>
                      </>
                    )}
                  </Box>
                </Stack>
                {editingSourceId !== source.id && (
                  <Stack 
                    direction="row" 
                    spacing={0.5} 
                    className="source-actions"
                    sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                  >
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => setEditingSourceId(source.id)}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => removeSource(source.id)} color="error">
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </Stack>
            </Paper>
          ))}
          {dataSources.filter(s => s.type !== 'document').length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No external sources configured
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
