'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Badge,
  Chip,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Assignment as AssessmentIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  pendingApprovals?: number;
}

export function Sidebar({ pendingApprovals = 0 }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { href: '/', label: 'Risk Discovery', icon: <SearchIcon /> },
    { href: '/assessments', label: 'Assessments', icon: <AssessmentIcon /> },
    { href: '/risks', label: 'Risk Register', icon: <ShieldIcon />, badge: pendingApprovals },
    { href: '/history', label: 'History', icon: <HistoryIcon /> },
    { href: '/settings', label: 'Settings', icon: <SettingsIcon /> },
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
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 0 16px rgba(96, 165, 250, 0.4)',
          }}
        >
          <ShieldIcon fontSize="small" />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: '#e2e8f0' }}>
          Risk Agent
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(96, 165, 250, 0.1)' }} />

      <List sx={{ px: 1, py: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={isActive}
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    background: 'rgba(96, 165, 250, 0.15)',
                    boxShadow: 'inset 0 0 0 1px rgba(96, 165, 250, 0.2)',
                    '&:hover': {
                      background: 'rgba(96, 165, 250, 0.2)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#60a5fa',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#93c5fd',
                      fontWeight: 600,
                    },
                  },
                  '&:not(.Mui-selected):hover': {
                    background: 'rgba(96, 165, 250, 0.08)',
                  },
                  // #94a3b8 on sidebar bg → ~6.7:1 — passes WCAG 1.4.11
                  '& .MuiListItemIcon-root': {
                    color: '#94a3b8',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="warning" max={99}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
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
    </Drawer>
  );
}
