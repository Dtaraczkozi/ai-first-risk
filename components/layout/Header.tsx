'use client';

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useState } from 'react';

interface HeaderProps {
  title?: string;
  alertCount?: number;
}

export function Header({ title = 'Risk Discovery', alertCount = 0 }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        ml: '240px',
        width: 'calc(100% - 240px)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end', minHeight: 56 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" aria-label="notifications">
            <Badge badgeContent={alertCount} color="error" max={99}>
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>

          <IconButton size="small" aria-label="settings">
            <SettingsIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            edge="end"
            aria-label="account"
            aria-controls="account-menu"
            aria-haspopup="true"
            onClick={handleMenuOpen}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 12 }}>
              U
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <PersonIcon sx={{ mr: 1 }} fontSize="small" />
            Profile
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose}>
            <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
