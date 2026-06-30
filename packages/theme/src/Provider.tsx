import type { ReactNode } from 'react';
import { MantineProvider, type MantineColorScheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { theme } from './theme';

/**
 * Drop-in wrapper that applies the shared theme + Mantine's styles. Apps render
 * `<ThemeProvider><App/></ThemeProvider>` instead of wiring MantineProvider and
 * importing styles themselves.
 */
export function ThemeProvider({
  children,
  defaultColorScheme = 'dark',
}: {
  children: ReactNode;
  defaultColorScheme?: MantineColorScheme;
}) {
  return (
    <MantineProvider theme={theme} defaultColorScheme={defaultColorScheme}>
      {children}
    </MantineProvider>
  );
}
