import { createTheme, type MantineColorsTuple } from '@mantine/core';
import { orange, fontFamily, radius, surface, accent } from './tokens';

/**
 * The shared Mantine theme, built from the design tokens. Consume via the
 * `ThemeProvider` wrapper, or pass `theme` to your own `<MantineProvider>`.
 */
export const theme = createTheme({
  primaryColor: 'orange',
  colors: {
    orange: orange as unknown as MantineColorsTuple,
  },
  fontFamily,
  defaultRadius: radius.default,
  other: {
    backgroundDark: surface.page,
    accentOrange: accent.brand,
  },
});
