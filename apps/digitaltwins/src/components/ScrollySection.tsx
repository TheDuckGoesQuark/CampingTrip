import { Paper } from '@mantine/core';
import type { ReactNode } from 'react';

/**
 * A narrative card. Just a styled container — all scroll/position
 * logic is handled by ScrollyLayout.
 */
export function ScrollySection({ children }: { children: ReactNode }) {
  return (
    <Paper
      radius="md"
      w="100%"
      style={{
        padding: 'var(--mantine-spacing-lg)',
        background: 'rgba(245, 240, 228, 0.95)',
        backdropFilter: 'blur(6px)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#2c3e6b',
        border: '1px solid rgba(44, 62, 107, 0.15)',
        boxShadow: '2px 3px 8px rgba(44, 62, 107, 0.08)',
      }}
    >
      {children}
    </Paper>
  );
}
