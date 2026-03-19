import { Box, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import '../pages/scheduling/notebook.css';

const INK = '#2c3e6b';
const INK_LIGHT = '#5a7299';

interface ScrollyLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function ScrollyLayout({ title, subtitle, children }: ScrollyLayoutProps) {
  return (
    <Stack
      className="notebook-page"
      gap={0}
      style={{ height: 'calc(100vh - 48px)' }}
    >
      <Box ta="center" py="sm">
        <Text
          fw={700}
          style={{ fontSize: 34, color: INK, fontFamily: "'Caveat', cursive" }}
        >
          {title}
        </Text>
        <Text
          style={{ fontSize: 15, color: INK_LIGHT, fontFamily: "'Caveat', cursive" }}
        >
          {subtitle}
        </Text>
      </Box>

      <Box style={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Stack>
  );
}
