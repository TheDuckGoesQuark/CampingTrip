import { Container, Title, Text, Card, Group, Stack, Anchor } from '@mantine/core';

const posts = [
  {
    title: 'Task Scheduling Algorithms',
    description:
      'How do different scheduling strategies handle your daily task list? An interactive queue simulation.',
    href: '/scheduling',
    status: 'wip' as const,
  },
];

export function Home() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Digital Twins
          </Title>
          <Text c="dimmed" size="lg">
            Interactive visualizations exploring cause and effect.
          </Text>
        </div>

        <Stack gap="md">
          {posts.map((post) => (
            <Anchor key={post.href} href={post.href} underline="never">
              <Card
                padding="lg"
                radius="md"
                style={{
                  background: 'var(--mantine-color-dark-7)',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--mantine-color-dark-6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--mantine-color-dark-7)';
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={600} size="lg">
                      {post.title}
                    </Text>
                    <Text c="dimmed" size="sm" mt={4}>
                      {post.description}
                    </Text>
                  </div>
                  {post.status === 'wip' && (
                    <Text size="xs" c="orange" fw={500}>
                      WIP
                    </Text>
                  )}
                </Group>
              </Card>
            </Anchor>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
