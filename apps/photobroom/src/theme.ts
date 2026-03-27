import { createTheme, MantineColorsTuple } from '@mantine/core';

const orange: MantineColorsTuple = [
  '#fff8e1',
  '#ffefcc',
  '#ffdd9b',
  '#ffca64',
  '#ffba38',
  '#ffb01b',
  '#ffab09',
  '#e39500',
  '#ca8400',
  '#af7100',
];

export const theme = createTheme({
  primaryColor: 'orange',
  colors: {
    orange,
  },
  fontFamily: 'system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  other: {
    backgroundDark: '#0a0612',
    accentOrange: '#ffb347',
  },
});
