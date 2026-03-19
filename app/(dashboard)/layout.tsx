'use client';

import { Box } from '@mui/material';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/lib/theme';

const HEADER_HEIGHT = 56;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Header />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            mt: `${HEADER_HEIGHT}px`,
            backgroundColor: 'grey.50',
            minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
            px: { xs: 2, sm: '4%', md: '6%', lg: '8%', xl: '10%' },
            py: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
