import { useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  Badge,
  Loader,
} from '@mantine/core';
import { useWorkoutSessionsListQuery } from '../api/generated-api';

const STATUS_COLORS: Record<string, string> = {
  completed: 'green',
  in_progress: 'orange',
  planned: 'blue',
  skipped: 'gray',
};

export function History() {
  const { data, isLoading } = useWorkoutSessionsListQuery({});
  const navigate = useNavigate();

  if (isLoading) return <Loader />;

  const sessions = data?.results ?? [];

  return (
    <Stack>
      <Title order={2}>History</Title>

      {sessions.length === 0 ? (
        <Card withBorder p="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed">No workouts yet</Text>
            <Text size="sm" c="dimmed">
              Complete a workout session and it will show up here
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack gap="sm">
          {sessions.map((session) => (
            <Card
              key={session.id}
              withBorder
              p="sm"
              onClick={() => navigate(`/workout/${session.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{session.date}</Text>
                  <Text size="sm" c="dimmed">
                    {session.exercise_count} exercise{session.exercise_count !== 1 ? 's' : ''}
                  </Text>
                </div>
                <Badge
                  color={STATUS_COLORS[session.status ?? 'planned'] ?? 'gray'}
                  variant="light"
                >
                  {session.status?.replace('_', ' ') ?? 'planned'}
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
