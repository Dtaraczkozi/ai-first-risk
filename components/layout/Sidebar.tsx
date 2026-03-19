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
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <ShieldIcon fontSize="small" />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Risk Agent
        </Typography>
      </Box>

      <Divider />

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
                  borderRadius: 1,
                  py: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.50',
                    '&:hover': {
                      backgroundColor: 'primary.100',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
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
