'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Badge,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Assignment as AssessmentIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  MonitorHeart as TreatmentIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  TuneOutlined as GlobalIcon,
  GavelOutlined as RulesIcon,
  AccountTreeOutlined as TaxonomyIcon,
  SourceOutlined as SourcesIcon,
  PeopleOutlined as UsersIcon,
  ExtensionOutlined as IntegrationsIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 264;

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  pendingApprovals?: number;
}

const navItemSx = {
  borderRadius: 1.5,
  py: 1,
  transition: 'all 0.2s ease',
  '&.Mui-selected': {
    background: 'rgba(96, 165, 250, 0.15)',
    boxShadow: 'inset 0 0 0 1px rgba(96, 165, 250, 0.2)',
    '&:hover': { background: 'rgba(96, 165, 250, 0.2)' },
    '& .MuiListItemIcon-root': { color: '#60a5fa' },
    '& .MuiListItemText-primary': { color: '#93c5fd', fontWeight: 600 },
  },
  '&:not(.Mui-selected):hover': { background: 'rgba(96, 165, 250, 0.08)' },
  '& .MuiListItemIcon-root': { color: '#94a3b8' },
};

export function Sidebar({ pendingApprovals = 0 }: SidebarProps) {
  const pathname = usePathname();
  const isSettingsArea = pathname?.startsWith('/settings');
  const [settingsOpen, setSettingsOpen] = useState(isSettingsArea);

  const mainNavItems: NavItem[] = [
    { href: '/dashboard',   label: 'Dashboard',            icon: <DashboardIcon /> },
    { href: '/',            label: 'Risk Discovery',        icon: <SearchIcon /> },
    { href: '/assessments', label: 'Assessments',           icon: <AssessmentIcon /> },
    { href: '/treatment',   label: 'Treatment & Monitoring',icon: <TreatmentIcon /> },
    { href: '/risks',       label: 'Risk Register',         icon: <ShieldIcon />, badge: pendingApprovals },
    { href: '/reporting',   label: 'Reporting',             icon: <HistoryIcon /> },
  ];

  // Settings sub-items: only "Sources" is a real link; others are placeholders
  const settingsSubItems: { label: string; icon: React.ReactNode; href?: string }[] = [
    { label: 'Global settings',       icon: <GlobalIcon sx={{ fontSize: 16 }} /> },
    { label: 'Rules & constitution',  icon: <RulesIcon sx={{ fontSize: 16 }} /> },
    { label: 'Taxonomy',              icon: <TaxonomyIcon sx={{ fontSize: 16 }} /> },
    { label: 'Sources',               icon: <SourcesIcon sx={{ fontSize: 16 }} />, href: '/settings' },
    { label: 'Users & permissions',   icon: <UsersIcon sx={{ fontSize: 16 }} /> },
    { label: 'Integrations',          icon: <IntegrationsIcon sx={{ fontSize: 16 }} /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid rgba(96, 165, 250, 0.1)',
          boxShadow: '4px 0 32px rgba(0, 0, 0, 0.4)',
        },
      }}
    >
      {/* Brand */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 1.5,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: '0 0 16px rgba(96, 165, 250, 0.4)',
          }}
        >
          <ShieldIcon fontSize="small" />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: '#e2e8f0' }}>
          Risk Agent
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(96, 165, 250, 0.1)' }} />

      {/* Main nav */}
      <List sx={{ px: 1, py: 1 }}>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton component={Link} href={item.href} selected={isActive} sx={navItemSx}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="warning" max={99}>{item.icon}</Badge>
                  ) : item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#93c5fd' : '#94a3b8',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(96, 165, 250, 0.1)', mx: 1 }} />

      {/* Settings expandable group */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <ListItemButton
            onClick={() => setSettingsOpen(o => !o)}
            selected={isSettingsArea && !settingsOpen}
            sx={navItemSx}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: isSettingsArea ? 600 : 400,
                color: isSettingsArea ? '#93c5fd' : '#94a3b8',
              }}
            />
            {settingsOpen
              ? <ExpandLessIcon sx={{ fontSize: 16, color: '#64748b' }} />
              : <ExpandMoreIcon sx={{ fontSize: 16, color: '#64748b' }} />}
          </ListItemButton>
        </ListItem>

        <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ pl: 1.5, mb: 0.5 }}>
            {settingsSubItems.map((sub) => {
              const isActive = sub.href ? pathname === sub.href : false;
              const inner = (
                <ListItemButton
                  selected={isActive}
                  disabled={!sub.href}
                  {...(sub.href ? { component: Link, href: sub.href } : {})}
                  sx={{
                    borderRadius: 1,
                    py: 0.65,
                    pl: 1.25,
                    minHeight: 32,
                    '&.Mui-selected': {
                      background: 'rgba(96, 165, 250, 0.15)',
                      '& .MuiListItemIcon-root': { color: '#60a5fa' },
                      '& .MuiListItemText-primary': { color: '#93c5fd', fontWeight: 600 },
                    },
                    '&:not(.Mui-selected):not(.Mui-disabled):hover': {
                      background: 'rgba(96, 165, 250, 0.06)',
                    },
                    '&.Mui-disabled': { opacity: 0.45 },
                    '& .MuiListItemIcon-root': { color: '#64748b' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>{sub.icon}</ListItemIcon>
                  <ListItemText
                    primary={sub.label}
                    primaryTypographyProps={{
                      variant: 'caption',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#93c5fd' : '#64748b',
                      sx: { lineHeight: 1.4 },
                    }}
                  />
                </ListItemButton>
              );
              return (
                <ListItem key={sub.label} disablePadding sx={{ mb: 0.125 }}>
                  {inner}
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
}
