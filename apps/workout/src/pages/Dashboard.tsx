import { useMemo } from 'react';
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
  Select,
} from '@mantine/core';
import { BarChart, LineChart } from '@mantine/charts';
import { useState } from 'react';
import {
  useWorkoutDashboardListQuery,
  useWorkoutDashboardChartsRetrieveQuery,
  useWorkoutSessionsGenerateCreateMutation,
  type DashboardResponseRead,
} from '../api/generated-api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Chart color palette
const COLORS = ['orange', 'cyan', 'grape', 'teal', 'pink', 'indigo', 'yellow', 'lime'];

interface VolumePoint {
  date: string;
  volume: number;
}

interface WeightPoint {
  date: string;
  weight: number;
}

interface ExerciseWeightSeries {
  exercise: string;
  data: WeightPoint[];
}

export function Dashboard() {
  const { data: rawData, isLoading } = useWorkoutDashboardListQuery();
  const data = rawData as unknown as DashboardResponseRead | undefined;
  const { data: chartData } = useWorkoutDashboardChartsRetrieveQuery();
  const [generateSession, { isLoading: isGenerating }] =
    useWorkoutSessionsGenerateCreateMutation();
  const navigate = useNavigate();

  const volumeData = (chartData?.volume_per_session ?? []) as VolumePoint[];
  const weightSeries = (chartData?.weight_per_exercise ?? []) as ExerciseWeightSeries[];

  // For weight chart: allow selecting which exercise to view, or show all
  const exerciseNames = useMemo(() => weightSeries.map((s) => s.exercise), [weightSeries]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Transform weight data for LineChart: merge all exercises into [{date, Ex1, Ex2, ...}]
  const weightChartData = useMemo(() => {
    const series = selectedExercise
      ? weightSeries.filter((s) => s.exercise === selectedExercise)
      : weightSeries;

    // Collect all dates across all exercises
    const dateMap = new Map<string, Record<string, number>>();
    for (const s of series) {
      for (const point of s.data) {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: 0 }); // placeholder
        }
        dateMap.get(point.date)![s.exercise] = point.weight;
      }
    }

    // Sort by date and format
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: formatDate(date),
        ...values,
      }));
  }, [weightSeries, selectedExercise]);

  const weightChartSeries = useMemo(() => {
    const series = selectedExercise
      ? weightSeries.filter((s) => s.exercise === selectedExercise)
      : weightSeries;
    return series.map((s, i) => ({
      name: s.exercise,
      color: COLORS[i % COLORS.length],
    }));
  }, [weightSeries, selectedExercise]);

  if (isLoading) return <Loader />;

  const today = new Date();
  const dayName = DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1];

  const handleStartWorkout = async () => {
    if (data?.today_session) {
      navigate(`/workout/${data.today_session.id}/guided`);
    } else {
      try {
        const result = await generateSession({
          generateSessionRequestRequest: {},
        }).unwrap();
        navigate(`/workout/${result.id}/guided`);
      } catch {
        navigate('/workout');
      }
    }
  };

  const formattedVolume = volumeData.map((v) => ({
    date: formatDate(v.date),
    Volume: v.volume,
  }));

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

      {/* Volume per session chart */}
      {formattedVolume.length > 1 && (
        <Card withBorder p="md">
          <Text fw={600} mb="sm">Session Volume</Text>
          <Text size="xs" c="dimmed" mb="md">Total weight moved per session (reps x kg)</Text>
          <BarChart
            h={200}
            data={formattedVolume}
            dataKey="date"
            series={[{ name: 'Volume', color: 'orange' }]}
            tickLine="y"
            gridAxis="y"
          />
        </Card>
      )}

      {/* Weight progression per exercise */}
      {weightChartSeries.length > 0 && weightChartData.length > 0 && (
        <Card withBorder p="md">
          <Group justify="space-between" mb="sm">
            <div>
              <Text fw={600}>Weight Progression</Text>
              <Text size="xs" c="dimmed">Max working weight per session (kg)</Text>
            </div>
            {exerciseNames.length > 1 && (
              <Select
                size="xs"
                placeholder="All exercises"
                clearable
                value={selectedExercise}
                onChange={setSelectedExercise}
                data={exerciseNames}
                w={180}
              />
            )}
          </Group>
          <LineChart
            h={200}
            data={weightChartData}
            dataKey="date"
            series={weightChartSeries}
            curveType="monotone"
            connectNulls
            tickLine="y"
            gridAxis="y"
          />
        </Card>
      )}

      {/* Fallback if no chart data yet */}
      {formattedVolume.length <= 1 && weightChartSeries.length === 0 && (
        <Card withBorder p="md">
          <Text c="dimmed" ta="center" size="sm">
            Complete a few workouts to see your progress charts here
          </Text>
        </Card>
      )}
    </Stack>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
