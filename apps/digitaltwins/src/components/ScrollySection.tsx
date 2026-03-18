import { Box, Paper } from '@mantine/core';
import type { ReactNode } from 'react';

interface ScrollySectionProps {
  index: number;
  active: boolean;
  children: ReactNode;
}

export function ScrollySection({ index, active, children }: ScrollySectionProps) {
  return (
    <Box
      id={`step-${index}`}
      data-step={index}
      style={{
        // Each section needs enough height to scroll through
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'var(--mantine-spacing-md)',
        // First card starts lower (below title), rest have normal spacing
        paddingTop: index === 0 ? '12vh' : 'var(--mantine-spacing-md)',
      }}
    >
      <Paper
        p="lg"
        radius="md"
        maw={480}
        w="100%"
        style={{
          background: 'rgba(245, 240, 228, 0.95)',
          backdropFilter: 'blur(6px)',
          transition: 'opacity 400ms ease',
          opacity: active ? 1 : 0.15,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#2c3e6b',
          border: '1px solid rgba(44, 62, 107, 0.15)',
          boxShadow: '2px 3px 8px rgba(44, 62, 107, 0.08)',
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}
