import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  Button,
  NumberInput,
  Badge,
  Loader,
  Select,
  Progress,
  RingProgress,
} from '@mantine/core';
import {
  useWorkoutSessionsRetrieveQuery,
  useWorkoutSessionsPartialUpdateMutation,
  useWorkoutSessionsCompleteCreateMutation,
  type ExerciseSetRequest,
  type SessionExerciseRequest,
  type ExerciseSetTypeEnum,
} from '../api/generated-api';

function RestTimer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  const progress = ((seconds - remaining) / seconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Card withBorder p="md" bg="dark.8">
      <Stack align="center" gap="sm">
        <Text size="sm" c="dimmed">Rest Timer</Text>
        <RingProgress
          size={120}
          thickness={8}
          roundCaps
          sections={[{ value: progress, color: 'orange' }]}
          label={
            <Text ta="center" fw={700} size="xl">
              {mins}:{secs.toString().padStart(2, '0')}
            </Text>
          }
        />
        <Button variant="subtle" size="xs" onClick={onComplete}>
          Skip Rest
        </Button>
      </Stack>
    </Card>
  );
}

interface SetState {
  set_number: number;
  type: ExerciseSetTypeEnum;
  value: Record<string, number>;
  completed: boolean;
  rest_seconds: number;
}

interface ExerciseState {
  exercise: number;
  exercise_name: string;
  ladder_node: number | null;
  order: number;
  sets: SetState[];
}

function SetRow({
  set,
  onChange,
  onComplete,
}: {
  set: SetState;
  onChange: (s: SetState) => void;
  onComplete: () => void;
}) {
  const renderInputs = () => {
    switch (set.type) {
      case 'reps_weight':
        return (
          <Group gap="xs" grow>
            <NumberInput
              size="xs"
              placeholder="Reps"
              value={set.value.reps ?? ''}
              onChange={(val) => onChange({ ...set, value: { ...set.value, reps: Number(val) } })}
              min={0}
            />
            <NumberInput
              size="xs"
              placeholder="Weight (kg)"
              value={set.value.weight ?? ''}
              onChange={(val) => onChange({ ...set, value: { ...set.value, weight: Number(val) } })}
              min={0}
              decimalScale={1}
            />
          </Group>
        );
      case 'reps_only':
        return (
          <NumberInput
            size="xs"
            placeholder="Reps"
            value={set.value.reps ?? ''}
            onChange={(val) => onChange({ ...set, value: { ...set.value, reps: Number(val) } })}
            min={0}
          />
        );
      case 'duration':
        return (
          <NumberInput
            size="xs"
            placeholder="Seconds"
            value={set.value.seconds ?? ''}
            onChange={(val) => onChange({ ...set, value: { ...set.value, seconds: Number(val) } })}
            min={0}
          />
        );
      case 'distance':
        return (
          <NumberInput
            size="xs"
            placeholder="Meters"
            value={set.value.meters ?? ''}
            onChange={(val) => onChange({ ...set, value: { ...set.value, meters: Number(val) } })}
            min={0}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card withBorder p="xs" bg={set.completed ? 'dark.7' : undefined}>
      <Group justify="space-between">
        <Badge size="xs" variant="light" color={set.completed ? 'green' : 'gray'}>
          Set {set.set_number}
        </Badge>
        {renderInputs()}
        <Button
          size="xs"
          variant={set.completed ? 'light' : 'filled'}
          color={set.completed ? 'green' : 'orange'}
          onClick={onComplete}
          disabled={set.completed}
        >
          {set.completed ? 'Done' : 'Log'}
        </Button>
      </Group>
    </Card>
  );
}

function ExerciseCard({
  exercise,
  onUpdate,
  onSetComplete,
}: {
  exercise: ExerciseState;
  onUpdate: (e: ExerciseState) => void;
  onSetComplete: (exerciseOrder: number, setNumber: number) => void;
}) {
  const completedSets = exercise.sets.filter((s) => s.completed).length;
  const totalSets = exercise.sets.length;

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1] as SetState | undefined;
    const defaultType: ExerciseSetTypeEnum = lastSet?.type ?? 'reps_weight';
    const defaultValue = lastSet ? { ...lastSet.value } : {};
    const defaultRest = lastSet?.rest_seconds ?? 90;

    const newSet: SetState = {
      set_number: exercise.sets.length + 1,
      type: defaultType,
      value: defaultValue,
      completed: false,
      rest_seconds: defaultRest,
    };
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const updateSet = (index: number, set: SetState) => {
    const newSets = [...exercise.sets];
    newSets[index] = set;
    onUpdate({ ...exercise, sets: newSets });
  };

  const handleSetTypeChange = (val: string | null) => {
    if (!val) return;
    const newType = val as ExerciseSetTypeEnum;
    const newSets = exercise.sets.map((s) => ({ ...s, type: newType, value: {} }));
    onUpdate({ ...exercise, sets: newSets });
  };

  return (
    <Card withBorder p="sm">
      <Group justify="space-between" mb="xs">
        <div>
          <Text fw={600}>{exercise.exercise_name}</Text>
          {exercise.ladder_node && (
            <Badge size="xs" variant="light" color="orange">Ladder</Badge>
          )}
        </div>
        <Text size="sm" c="dimmed">{completedSets}/{totalSets} sets</Text>
      </Group>

      {totalSets > 0 && (
        <Progress
          value={(completedSets / totalSets) * 100}
          color="orange"
          size="xs"
          mb="xs"
        />
      )}

      <Group gap="xs" mb="xs">
        <Select
          size="xs"
          value={exercise.sets[0]?.type ?? 'reps_weight'}
          onChange={handleSetTypeChange}
          data={[
            { value: 'reps_weight', label: 'Reps & Weight' },
            { value: 'reps_only', label: 'Reps Only' },
            { value: 'duration', label: 'Duration' },
            { value: 'distance', label: 'Distance' },
          ]}
          w={140}
        />
        <NumberInput
          size="xs"
          placeholder="Rest (s)"
          value={exercise.sets[0]?.rest_seconds ?? 90}
          onChange={(val) => {
            const rest = Number(val);
            const newSets = exercise.sets.map((s) => ({ ...s, rest_seconds: rest }));
            onUpdate({ ...exercise, sets: newSets });
          }}
          min={0}
          max={600}
          w={90}
        />
      </Group>

      <Stack gap="xs">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.set_number}
            set={set}
            onChange={(s) => updateSet(i, s)}
            onComplete={() => onSetComplete(exercise.order, set.set_number)}
          />
        ))}
        <Button variant="subtle" size="xs" onClick={addSet} fullWidth>
          + Add Set
        </Button>
      </Stack>
    </Card>
  );
}

export function LogWorkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useWorkoutSessionsRetrieveQuery(
    { id: id! },
    { skip: !id }
  );
  const [updateSession] = useWorkoutSessionsPartialUpdateMutation();
  const [completeSession] = useWorkoutSessionsCompleteCreateMutation();

  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number }>({
    active: false,
    seconds: 0,
  });

  useEffect(() => {
    if (session?.exercises) {
      setExercises(
        session.exercises.map((e) => ({
          exercise: e.exercise,
          exercise_name: e.exercise_name ?? `Exercise ${e.exercise}`,
          ladder_node: e.ladder_node ?? null,
          order: e.order,
          sets: e.sets.map((s) => ({
            set_number: s.set_number,
            type: s.type,
            value: s.value as Record<string, number>,
            completed: s.completed ?? false,
            rest_seconds: s.rest_seconds ?? 90,
          })),
        }))
      );
    }
  }, [session]);

  const handleRestComplete = useCallback(() => {
    setRestTimer({ active: false, seconds: 0 });
  }, []);

  const handleSetComplete = (exerciseOrder: number, setNumber: number) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.order !== exerciseOrder) return e;
        const newSets = e.sets.map((s) => {
          if (s.set_number !== setNumber) return s;
          return { ...s, completed: true };
        });
        return { ...e, sets: newSets };
      })
    );

    // Find the rest time and start timer
    const exercise = exercises.find((e) => e.order === exerciseOrder);
    const set = exercise?.sets.find((s) => s.set_number === setNumber);
    if (set && set.rest_seconds > 0) {
      setRestTimer({ active: true, seconds: set.rest_seconds });
    }
  };

  const handleUpdateExercise = (updated: ExerciseState) => {
    setExercises((prev) =>
      prev.map((e) => (e.order === updated.order ? updated : e))
    );
  };

  const handleSave = async () => {
    if (!id) return;

    const exercisesPayload: SessionExerciseRequest[] = exercises.map((e) => ({
      exercise: e.exercise,
      ladder_node: e.ladder_node,
      order: e.order,
      sets: e.sets.map((s): ExerciseSetRequest => ({
        set_number: s.set_number,
        type: s.type,
        value: s.value,
        completed: s.completed,
        rest_seconds: s.rest_seconds,
      })),
    }));

    await updateSession({
      id,
      patchedWorkoutSessionDetailRequest: {
        exercises: exercisesPayload,
      },
    });
  };

  const handleFinish = async () => {
    if (!id) return;

    const exercisesPayload: SessionExerciseRequest[] = exercises.map((e) => ({
      exercise: e.exercise,
      ladder_node: e.ladder_node,
      order: e.order,
      sets: e.sets.map((s): ExerciseSetRequest => ({
        set_number: s.set_number,
        type: s.type,
        value: s.value,
        completed: s.completed,
        rest_seconds: s.rest_seconds,
      })),
    }));

    // Save current set data first
    await updateSession({
      id,
      patchedWorkoutSessionDetailRequest: {
        exercises: exercisesPayload,
      },
    });

    // Complete session and evaluate ladder progression
    await completeSession({
      id,
      workoutSessionDetailRequest: {
        date: session?.date ?? new Date().toISOString().slice(0, 10),
        exercises: exercisesPayload,
      },
    });

    navigate('/');
  };

  if (!id) {
    return (
      <Stack align="center" mt="xl">
        <Title order={2}>Workout</Title>
        <Text c="dimmed">No active workout session</Text>
        <Text size="sm" c="dimmed">
          Start a workout from the Dashboard or create one manually
        </Text>
        <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
      </Stack>
    );
  }

  if (isLoading) return <Loader />;

  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const completedSets = exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Workout</Title>
          <Text size="sm" c="dimmed">
            {session?.date} — {completedSets}/{totalSets} sets complete
          </Text>
        </div>
        <Group gap="xs">
          <Button variant="subtle" size="xs" onClick={handleSave}>
            Save
          </Button>
          <Button size="xs" color="green" onClick={handleFinish}>
            Finish
          </Button>
        </Group>
      </Group>

      {totalSets > 0 && (
        <Progress
          value={(completedSets / totalSets) * 100}
          color="orange"
          size="sm"
        />
      )}

      {restTimer.active && (
        <RestTimer seconds={restTimer.seconds} onComplete={handleRestComplete} />
      )}

      <Stack gap="sm">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.order}
            exercise={exercise}
            onUpdate={handleUpdateExercise}
            onSetComplete={handleSetComplete}
          />
        ))}
      </Stack>
    </Stack>
  );
}
