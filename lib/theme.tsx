'use client';

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';

const glassBase = {
  background: 'rgba(14, 20, 35, 0.65)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(96, 165, 250, 0.1)',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#60a5fa',
      light: '#93c5fd',
      dark: '#3b82f6',
    },
    secondary: {
      main: '#a78bfa',
      light: '#c4b5fd',
      dark: '#7c3aed',
    },
    error: {
      main: '#f87171',
      light: '#fca5a5',
      dark: '#ef4444',
    },
    warning: {
      main: '#fbbf24',
      light: '#fcd34d',
      dark: '#f59e0b',
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
    },
    info: {
      main: '#38bdf8',
      light: '#7dd3fc',
      dark: '#0ea5e9',
    },
    background: {
      default: '#0d1117',
      paper: '#161b27',
    },
    divider: 'rgba(96, 165, 250, 0.12)',
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: [
            'radial-gradient(ellipse 110% 70% at 50% 42%, rgba(20, 48, 105, 0.48) 0%, transparent 62%)',
            'radial-gradient(ellipse 55% 40% at 14% 10%, rgba(50, 100, 210, 0.12) 0%, transparent 55%)',
            'radial-gradient(ellipse 50% 45% at 86% 90%, rgba(80, 55, 190, 0.09) 0%, transparent 55%)',
            '#0d1117',
          ].join(', '),
          backgroundAttachment: 'fixed',
          scrollbarColor: '#3b82f6 #0d1117',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: '#0d1117' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(96, 165, 250, 0.3)',
            borderRadius: 3,
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          // Consistent focus ring for all interactive elements — WCAG 2.4.7 / 2.4.11
          '&.Mui-focusVisible': {
            outline: '2px solid #60a5fa',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          whiteSpace: 'nowrap',
        },
        // ── Primary: filled gradient, white text (WCAG: #2563eb ≥4.95:1 with #fff) ──
        contained: {
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)',
            boxShadow: '0 4px 16px rgba(37,99,235,0.5)',
          },
          '&:active': {
            background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
            boxShadow: '0 1px 4px rgba(37,99,235,0.2)',
          },
          // Override any colour-specific contained variants back to white
          '&.MuiButton-containedError': {
            background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
            boxShadow: '0 2px 8px rgba(185,28,28,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #991b1c 0%, #7f1d1d 100%)',
              boxShadow: '0 4px 16px rgba(185,28,28,0.55)',
            },
          },
        },
        // ── Secondary: outlined steel-blue border, primary-light text ──
        outlined: {
          // #3b6aa8 on #161b27 → 3.37:1, passes WCAG 1.4.11
          borderColor: '#3b6aa8',
          '&:hover': {
            borderColor: 'rgba(96,165,250,0.65)',
            background: 'rgba(96,165,250,0.05)',
          },
          '&:active': {
            background: 'rgba(96,165,250,0.09)',
          },
        },
        // ── Tertiary: text-only, subdued secondary colour ──
        // #94a3b8 on #0d1117 → 6.6:1 (WCAG AA ✓)
        text: {
          color: '#94a3b8',
          '&:hover': {
            background: 'rgba(148,163,184,0.08)',
            color: '#e2e8f0',
          },
          '&:active': {
            background: 'rgba(148,163,184,0.12)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          ...glassBase,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(10, 16, 30, 0.62)',
          backdropFilter: 'blur(20px) saturate(170%)',
          WebkitBackdropFilter: 'blur(20px) saturate(170%)',
        },
        outlined: {
          background: 'rgba(8, 13, 24, 0.40)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(13, 17, 23, 0.75)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid rgba(96, 165, 250, 0.1)',
          boxShadow: '4px 0 32px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          ...glassBase,
          color: '#e2e8f0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          fontSize: '0.8125rem',
        },
        arrow: {
          color: 'rgba(18, 24, 38, 0.9)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          // #3b6aa8 → same steel-blue as all other outlines for consistency
          '&.MuiChip-outlined': {
            borderColor: '#3b6aa8',
          },
          '&.Mui-focusVisible': {
            outline: '2px solid #60a5fa',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(96, 165, 250, 0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            background: 'rgba(13, 17, 23, 0.6)',
            borderBottom: '1px solid rgba(96, 165, 250, 0.15)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(96, 165, 250, 0.07)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          // #3b6aa8 on #161b27 → 3.37:1, same steel-blue used across all outlines
          borderColor: '#3b6aa8',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(96, 165, 250, 0.65)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            // Solid primary at full opacity → 7.7:1 — passes WCAG 1.4.11
            borderColor: '#60a5fa',
          },
          '&.Mui-focused': {
            // Secondary focus ring for extra visibility without drastically changing the layout
            boxShadow: '0 0 0 3px rgba(96, 165, 250, 0.12)',
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: '#f87171',
          },
          // Placeholder: #8ba4c8 on #161b27 → ~5.4:1 — passes WCAG 1.4.3
          '& input::placeholder, & textarea::placeholder': {
            color: '#8ba4c8',
            opacity: 1,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            background: 'rgba(96, 165, 250, 0.08)',
          },
          '&:active': {
            background: 'rgba(96, 165, 250, 0.12)',
          },
          '&.Mui-selected': {
            background: 'rgba(96, 165, 250, 0.15)',
            '&:hover': {
              background: 'rgba(96, 165, 250, 0.2)',
            },
            '&:active': {
              background: 'rgba(96, 165, 250, 0.22)',
            },
          },
          // Focus ring is handled by MuiButtonBase, but reinforce here for list context
          '&.Mui-focusVisible': {
            outline: '2px solid #60a5fa',
            outlineOffset: '-2px',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: 'rgba(18, 24, 38, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(96, 165, 250, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(18, 24, 38, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(96, 165, 250, 0.15)',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.6)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          // #94a3b8 on #161b27 → ~6:1 — passes WCAG 1.4.3
          color: '#94a3b8',
          '&.Mui-focused': {
            color: '#60a5fa',
          },
          '&.Mui-error': {
            color: '#f87171',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          background: 'rgba(96, 165, 250, 0.1)',
        },
      },
    },
  },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export { theme };
