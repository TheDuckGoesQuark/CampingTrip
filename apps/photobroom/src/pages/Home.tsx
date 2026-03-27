import { Container, Title, Text, Stack } from '@mantine/core';

export function Home() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={2}>PhotoBroom</Title>
        <Text c="dimmed">Coming soon.</Text>
      </Stack>
    </Container>
  );
}
