import { useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  Button,
  Badge,
  Loader,
  SimpleGrid,
} from '@mantine/core';
import {
  useWorkoutDashboardListQuery,
  useWorkoutSessionsGenerateCreateMutation,
  type DashboardResponseRead,
} from '../api/generated-api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card withBorder p="sm">
      <Text size="xl" fw={700}>{value}</Text>
      <Text size="xs" c="dimmed">{label}</Text>
    </Card>
  );
}

export function Dashboard() {
  // The codegen types this as an array but the backend returns a single object
  const { data: rawData, isLoading } = useWorkoutDashboardListQuery();
  const data = rawData as unknown as DashboardResponseRead | undefined;
  const [generateSession, { isLoading: isGenerating }] =
    useWorkoutSessionsGenerateCreateMutation();
  const navigate = useNavigate();

  if (isLoading) return <Loader />;

  const today = new Date();
  const dayName = DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1];

  const handleStartWorkout = async () => {
    if (data?.today_session) {
      navigate(`/workout/${data.today_session.id}`);
    } else {
      try {
        const result = await generateSession({
          generateSessionRequestRequest: {},
        }).unwrap();
        navigate(`/workout/${result.id}`);
      } catch {
        // If no plan or no exercises today, navigate to workout page anyway
        navigate('/workout');
      }
    }
  };

  return (
    <Stack>
      <Title order={2}>Dashboard</Title>

      {/* Today's workout card */}
      <Card withBorder p="md">
        <Group justify="space-between" mb="sm">
          <div>
            <Text fw={600}>{dayName}'s Workout</Text>
            <Text size="sm" c="dimmed">
              {data?.today_plan_exercises?.length
                ? `${data.today_plan_exercises.length} exercises planned`
                : 'No exercises planned for today'}
            </Text>
          </div>
          {data?.today_session && (
            <Badge
              color={data.today_session.status === 'completed' ? 'green' : 'orange'}
              variant="light"
            >
              {data.today_session.status === 'completed' ? 'Done' : 'In Progress'}
            </Badge>
          )}
        </Group>

        {data?.today_plan_exercises && data.today_plan_exercises.length > 0 && (
          <Stack gap="xs" mb="sm">
            {data.today_plan_exercises.map((ex: Record<string, unknown>, i: number) => (
              <Group key={i} gap="xs">
                <Text size="sm">{String(ex.exercise_name)}</Text>
                {Boolean(ex.from_ladder) && (
                  <Badge size="xs" variant="light" color="orange">
                    {String(ex.ladder_name)}
                  </Badge>
                )}
              </Group>
            ))}
          </Stack>
        )}

        <Button
          fullWidth
          size="md"
          onClick={handleStartWorkout}
          loading={isGenerating}
          disabled={data?.today_session?.status === 'completed'}
        >
          {data?.today_session
            ? data.today_session.status === 'completed'
              ? 'Completed'
              : 'Continue Workout'
            : 'Start Workout'}
        </Button>
      </Card>

      {/* Stats */}
      <SimpleGrid cols={2}>
        <StatCard label="Total Sessions" value={data?.total_sessions ?? 0} />
        <StatCard label="Completed" value={data?.completed_sessions ?? 0} />
        <StatCard label="Ladders" value={data?.total_ladders ?? 0} />
        <StatCard label="Achievements" value={data?.achieved_nodes ?? 0} />
      </SimpleGrid>
    </Stack>
  );
}
