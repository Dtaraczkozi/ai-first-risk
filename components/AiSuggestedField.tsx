'use client';

import { useState } from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import { AutoAwesome as SparkleIcon } from '@mui/icons-material';

interface AiSuggestedFieldProps {
  children: React.ReactNode;
  isAccepted?: boolean;
  onAccept?: () => void;
}

export function AiSuggestedField({ children, isAccepted = false, onAccept }: AiSuggestedFieldProps) {
  const [accepted, setAccepted] = useState(isAccepted);

  const handleAccept = () => {
    setAccepted(true);
    onAccept?.();
  };

  if (accepted) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -2,
          borderRadius: 1.5,
          padding: '2px',
          background: 'linear-gradient(135deg, #5C6BC0 0%, #9C27B0 50%, #E91E63 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        },
      }}
      onClick={handleAccept}
    >
      {children}
      <Tooltip title="AI suggestion - click to accept" arrow placement="top">
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: -12,
            right: -12,
            width: 24,
            height: 24,
            background: 'linear-gradient(135deg, #5C6BC0 0%, #9C27B0 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #3F51B5 0%, #7B1FA2 100%)',
            },
            zIndex: 1,
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <SparkleIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
