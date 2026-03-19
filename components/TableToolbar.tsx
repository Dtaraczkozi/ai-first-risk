'use client';

import { useState } from 'react';
import {
  Box,
  Stack,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  TextField,
  InputAdornment,
  Divider,
  Typography,
  Chip,
  FormControl,
  Select,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  ViewColumn as ColumnIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'multiselect';
  options: { value: string; label: string }[];
}

export interface ColumnOption {
  id: string;
  label: string;
}

interface TableToolbarProps {
  // Search
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  
  // Filters
  filters?: FilterOption[];
  activeFilters?: Record<string, string | string[]>;
  onFilterChange?: (filterId: string, value: string | string[]) => void;
  onClearFilters?: () => void;
  
  // Columns
  columns?: ColumnOption[];
  visibleColumns?: string[];
  onColumnToggle?: (columnId: string) => void;
  
  // Additional actions
  additionalActions?: React.ReactNode;
}

export function TableToolbar({
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  columns = [],
  visibleColumns = [],
  onColumnToggle,
  additionalActions,
}: TableToolbarProps) {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [columnAnchor, setColumnAnchor] = useState<null | HTMLElement>(null);
  
  const activeFilterCount = Object.values(activeFilters).filter(v => 
    Array.isArray(v) ? v.length > 0 : v && v !== 'all'
  ).length;

  return (
    <Stack 
      direction="row" 
      spacing={1} 
      alignItems="center" 
      justifyContent="space-between"
      sx={{ py: 1 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        {/* Search */}
        {showSearch && onSearchChange && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <CloseIcon 
                    sx={{ fontSize: 16, color: 'text.secondary', cursor: 'pointer' }} 
                    onClick={() => onSearchChange('')}
                  />
                </InputAdornment>
              ) : null,
            }}
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
              },
            }}
          />
        )}

        {/* Filter Button */}
        {filters.length > 0 && (
          <>
            <Button
              size="small"
              startIcon={<FilterIcon sx={{ fontSize: 18 }} />}
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Filter
              {activeFilterCount > 0 && (
                <Chip 
                  size="small" 
                  label={activeFilterCount} 
                  sx={{ 
                    ml: 0.5, 
                    height: 18, 
                    fontSize: '0.7rem',
                    bgcolor: 'primary.main',
                    color: 'white',
                  }} 
                />
              )}
            </Button>
            <Menu
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onClose={() => setFilterAnchor(null)}
              PaperProps={{
                sx: { minWidth: 280, maxHeight: 400 }
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Filters
                  </Typography>
                  {activeFilterCount > 0 && (
                    <Button 
                      size="small" 
                      onClick={() => {
                        onClearFilters?.();
                        setFilterAnchor(null);
                      }}
                      sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                    >
                      Clear all
                    </Button>
                  )}
                </Stack>
              </Box>
              <Divider />
              {filters.map((filter) => (
                <Box key={filter.id} sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5, display: 'block' }}>
                    {filter.label}
                  </Typography>
                  {filter.type === 'select' ? (
                    <FormControl size="small" fullWidth>
                      <Select
                        value={activeFilters[filter.id] || 'all'}
                        onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        <MenuItem value="all">All</MenuItem>
                        {filter.options.map((opt, optIdx) => (
                          <MenuItem key={`${filter.id}-${opt.value}-${optIdx}`} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Stack spacing={0.5}>
                      {filter.options.map((opt, optIdx) => {
                        const currentValues = (activeFilters[filter.id] as string[]) || [];
                        const isChecked = currentValues.includes(opt.value);
                        return (
                          <MenuItem
                            key={`${filter.id}-multi-${opt.value}-${optIdx}`}
                            dense
                            onClick={() => {
                              const newValues = isChecked
                                ? currentValues.filter(v => v !== opt.value)
                                : [...currentValues, opt.value];
                              onFilterChange?.(filter.id, newValues);
                            }}
                            sx={{ px: 0, minHeight: 32 }}
                          >
                            <Checkbox checked={isChecked} size="small" sx={{ p: 0.5 }} />
                            <ListItemText 
                              primary={opt.label} 
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </MenuItem>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              ))}
            </Menu>
          </>
        )}

        {/* Columns Button */}
        {columns.length > 0 && (
          <>
            <Button
              size="small"
              startIcon={<ColumnIcon sx={{ fontSize: 18 }} />}
              onClick={(e) => setColumnAnchor(e.currentTarget)}
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Columns
            </Button>
            <Menu
              anchorEl={columnAnchor}
              open={Boolean(columnAnchor)}
              onClose={() => setColumnAnchor(null)}
              PaperProps={{
                sx: { minWidth: 200 }
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Toggle columns
                </Typography>
              </Box>
              <Divider />
              {columns.map((col) => (
                <MenuItem 
                  key={col.id} 
                  onClick={() => onColumnToggle?.(col.id)}
                  dense
                >
                  <Checkbox 
                    checked={visibleColumns.includes(col.id)} 
                    size="small"
                    sx={{ p: 0.5, mr: 1 }}
                  />
                  <ListItemText primary={col.label} />
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
            {Object.entries(activeFilters).map(([filterId, value]) => {
              if (!value || value === 'all' || (Array.isArray(value) && value.length === 0)) return null;
              const filter = filters.find(f => f.id === filterId);
              if (!filter) return null;
              
              const displayValue = Array.isArray(value) 
                ? value.map(v => filter.options.find(o => o.value === v)?.label).join(', ')
                : filter.options.find(o => o.value === value)?.label;
              
              return (
                <Chip
                  key={filterId}
                  size="small"
                  label={`${filter.label}: ${displayValue}`}
                  onDelete={() => onFilterChange?.(filterId, Array.isArray(value) ? [] : 'all')}
                  sx={{ height: 24, fontSize: '0.75rem' }}
                />
              );
            })}
          </Stack>
        )}
      </Stack>

      {additionalActions && (
        <Stack direction="row" spacing={1} alignItems="center">
          {additionalActions}
        </Stack>
      )}
    </Stack>
  );
}
