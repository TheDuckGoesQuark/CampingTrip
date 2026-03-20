import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Title,
  Text,
  Stack,
  Button,
  RingProgress,
  NumberInput,
  Group,
  Loader,
  Badge,
  Select,
  Progress,
} from '@mantine/core';
import {
  useWorkoutSessionsRetrieveQuery,
  useWorkoutSessionsPartialUpdateMutation,
  useWorkoutSessionsCompleteCreateMutation,
  type ExerciseSetRequest,
  type SessionExerciseRequest,
  type ExerciseSetTypeEnum,
} from '../api/generated-api';
import { useTimer } from '../hooks/useTimer';
import { playCountdownBeep, playGoSound, playCompleteSound } from '../audio/sounds';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetState {
  set_number: number;
  is_warmup_set: boolean;
  type: ExerciseSetTypeEnum;
  value: Record<string, number>;
  completed: boolean;
  rest_seconds: number;
}

interface ExerciseItem {
  id?: number;
  exercise: number;
  exercise_name: string;
  ladder_node: number | null;
  order: number;
  is_warmup: boolean;
  warmup_duration_seconds: number | null;
  sets: SetState[];
}

type Phase =
  | { type: 'countdown'; count: number }
  | { type: 'warmup'; index: number }
  | { type: 'exercise'; index: number; setIndex: number }
  | { type: 'rest'; exerciseIndex: number; setIndex: number; seconds: number }
  | { type: 'complete' };

type Action =
  | { type: 'TICK' }
  | { type: 'COUNTDOWN_DONE' }
  | { type: 'WARMUP_DONE' }
  | { type: 'SET_LOGGED'; restSeconds: number }
  | { type: 'REST_DONE' }
  | { type: 'SKIP' };

interface GuidedState {
  phase: Phase;
  warmupCount: number;
  mainCount: number;
}

function createReducer(warmupCount: number, mainCount: number) {
  return function reducer(state: GuidedState, action: Action): GuidedState {
    const { phase } = state;

    switch (action.type) {
      case 'TICK': {
        if (phase.type === 'countdown') {
          if (phase.count <= 1) {
            return { ...state, phase: { type: 'countdown', count: 0 } };
          }
          return { ...state, phase: { type: 'countdown', count: phase.count - 1 } };
        }
        return state;
      }

      case 'COUNTDOWN_DONE': {
        if (warmupCount > 0) {
          return { ...state, phase: { type: 'warmup', index: 0 } };
        }
        if (mainCount > 0) {
          return { ...state, phase: { type: 'exercise', index: 0, setIndex: 0 } };
        }
        return { ...state, phase: { type: 'complete' } };
      }

      case 'WARMUP_DONE': {
        if (phase.type !== 'warmup') return state;
        const nextIndex = phase.index + 1;
        if (nextIndex < warmupCount) {
          return { ...state, phase: { type: 'warmup', index: nextIndex } };
        }
        if (mainCount > 0) {
          return { ...state, phase: { type: 'exercise', index: 0, setIndex: 0 } };
        }
        return { ...state, phase: { type: 'complete' } };
      }

      case 'SET_LOGGED': {
        if (phase.type !== 'exercise') return state;
        if (action.restSeconds > 0) {
          return {
            ...state,
            phase: {
              type: 'rest',
              exerciseIndex: phase.index,
              setIndex: phase.setIndex,
              seconds: action.restSeconds,
            },
          };
        }
        // No rest — advance to next set
        return {
          ...state,
          phase: { type: 'exercise', index: phase.index, setIndex: phase.setIndex + 1 },
        };
      }

      case 'REST_DONE': {
        if (phase.type !== 'rest') return state;
        return {
          ...state,
          phase: {
            type: 'exercise',
            index: phase.exerciseIndex,
            setIndex: phase.setIndex + 1,
          },
        };
      }

      case 'SKIP': {
        if (phase.type === 'warmup') {
          return reducer(state, { type: 'WARMUP_DONE' });
        }
        if (phase.type === 'rest') {
          return reducer(state, { type: 'REST_DONE' });
        }
        return state;
      }

      default:
        return state;
    }
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CountdownScreen({ count, onDone }: { count: number; onDone: () => void }) {
  useEffect(() => {
    if (count === 0) {
      playGoSound();
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    playCountdownBeep();
    const t = setTimeout(() => {
      // Parent will TICK via reducer
    }, 1000);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return (
    <Stack align="center" justify="center" h="100%">
      <Text
        fw={900}
        style={{ fontSize: count === 0 ? 80 : 120, lineHeight: 1 }}
        c={count === 0 ? 'orange' : 'white'}
      >
        {count === 0 ? 'GO!' : count}
      </Text>
    </Stack>
  );
}

function WarmupScreen({
  exercise,
  index,
  total,
  onDone,
  onSkip,
}: {
  exercise: ExerciseItem;
  index: number;
  total: number;
  onDone: () => void;
  onSkip: () => void;
}) {
  const duration = exercise.warmup_duration_seconds ?? 30;
  const { remaining, progress } = useTimer(duration, {
    onComplete: onDone,
    autoStart: true,
    beepAtSeconds: 5,
  });

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Stack align="center" justify="center" h="100%" gap="xl">
      <Badge size="lg" variant="light" color="gray">
        Warm-up {index + 1} of {total}
      </Badge>
      <Title order={1} ta="center" style={{ fontSize: 36 }}>
        {exercise.exercise_name}
      </Title>
      <RingProgress
        size={200}
        thickness={10}
        roundCaps
        sections={[{ value: progress, color: 'orange' }]}
        label={
          <Text ta="center" fw={700} style={{ fontSize: 32 }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </Text>
        }
      />
      <Button variant="subtle" color="gray" onClick={onSkip}>
        Skip
      </Button>
    </Stack>
  );
}

function SetInputs({
  set,
  onChange,
}: {
  set: SetState;
  onChange: (s: SetState) => void;
}) {
  switch (set.type) {
    case 'reps_weight':
      return (
        <Group gap="sm" grow>
          <NumberInput
            size="lg"
            placeholder="Reps"
            value={set.value.reps ?? ''}
            onChange={(val) => onChange({ ...set, value: { ...set.value, reps: Number(val) } })}
            min={0}
          />
          <NumberInput
            size="lg"
            placeholder="kg"
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
          size="lg"
          placeholder="Reps"
          value={set.value.reps ?? ''}
          onChange={(val) => onChange({ ...set, value: { ...set.value, reps: Number(val) } })}
          min={0}
        />
      );
    case 'duration':
      return (
        <NumberInput
          size="lg"
          placeholder="Seconds"
          value={set.value.seconds ?? ''}
          onChange={(val) => onChange({ ...set, value: { ...set.value, seconds: Number(val) } })}
          min={0}
        />
      );
    case 'distance':
      return (
        <NumberInput
          size="lg"
          placeholder="Meters"
          value={set.value.meters ?? ''}
          onChange={(val) => onChange({ ...set, value: { ...set.value, meters: Number(val) } })}
          min={0}
        />
      );
    default:
      return null;
  }
}

function WorkoutProgressBar({
  phase,
  warmupsDone,
  warmupsTotal,
  exerciseStates,
  currentExerciseIndex,
  currentSetIndex,
}: {
  phase: Phase['type'];
  warmupsDone: number;
  warmupsTotal: number;
  exerciseStates: ExerciseItem[];
  currentExerciseIndex: number;
  currentSetIndex: number;
}) {
  // Total steps: all warmup phases + all sets across all exercises
  const totalSets = exerciseStates.reduce((sum, e) => sum + e.sets.length, 0);
  const totalSteps = warmupsTotal + totalSets;
  if (totalSteps === 0) return null;

  // Completed steps: finished warmups + completed sets + current progress
  let completedSteps = warmupsDone;
  for (let i = 0; i < exerciseStates.length; i++) {
    const ex = exerciseStates[i];
    if (i < currentExerciseIndex) {
      completedSteps += ex.sets.length;
    } else if (i === currentExerciseIndex) {
      completedSteps += ex.sets.filter((s) => s.completed).length;
    }
  }

  const pct = Math.round((completedSteps / totalSteps) * 100);

  // Figure out what's next
  let nextLabel = '';
  if (phase === 'warmup') {
    if (exerciseStates.length > 0) {
      nextLabel = `Next: ${exerciseStates[0].exercise_name}`;
    }
  } else if (phase === 'exercise' || phase === 'rest') {
    const currentEx = exerciseStates[currentExerciseIndex];
    const allSetsDone = currentEx && currentSetIndex >= currentEx.sets.length;
    if (allSetsDone && currentExerciseIndex < exerciseStates.length - 1) {
      nextLabel = `Next: ${exerciseStates[currentExerciseIndex + 1].exercise_name}`;
    } else if (!allSetsDone && currentEx) {
      const workingSetsLeft = currentEx.sets.filter((s, i) => i >= currentSetIndex && !s.is_warmup_set).length;
      if (workingSetsLeft > 0) {
        nextLabel = `${workingSetsLeft} set${workingSetsLeft > 1 ? 's' : ''} left`;
      }
    }
  }

  return (
    <Box pos="absolute" top={0} left={0} right={0} style={{ zIndex: 1002 }} px="md" pt={8}>
      <Group gap="xs" mb={4}>
        <Text size="xs" c="dimmed" style={{ flex: 1 }}>{nextLabel}</Text>
        <Text size="xs" c="dimmed">{pct}%</Text>
      </Group>
      <Progress value={pct} size="sm" color="orange" radius="xl" />
    </Box>
  );
}

function ExerciseScreen({
  exercise,
  exerciseIndex,
  totalExercises,
  setIndex,
  canPostpone,
  onLogSet,
  onAddSet,
  onUpdateSet,
  onNextExercise,
  onPostpone,
  onFinish,
}: {
  exercise: ExerciseItem;
  exerciseIndex: number;
  totalExercises: number;
  setIndex: number;
  canPostpone: boolean;
  onLogSet: (restSeconds: number) => void;
  onAddSet: () => void;
  onUpdateSet: (setIdx: number, set: SetState) => void;
  onNextExercise: () => void;
  onPostpone: () => void;
  onFinish: () => void;
}) {
  const currentSet = exercise.sets[setIndex];
  const allSetsLogged = setIndex >= exercise.sets.length;
  const isLastExercise = exerciseIndex >= totalExercises - 1;

  const setType = exercise.sets[0]?.type ?? 'reps_weight';

  return (
    <Stack align="center" justify="center" h="100%" gap="lg" px="md">
      <Badge size="lg" variant="light" color="orange">
        Exercise {exerciseIndex + 1} of {totalExercises}
      </Badge>
      <Title order={1} ta="center" style={{ fontSize: 32 }}>
        {exercise.exercise_name}
      </Title>

      {!allSetsLogged && currentSet ? (
        <>
          {currentSet.is_warmup_set ? (
            <Badge size="md" variant="light" color="gray">
              Warm-up Set {setIndex + 1}
            </Badge>
          ) : (
            <Text c="dimmed" size="lg">
              Set {setIndex + 1 - exercise.sets.filter((s, i) => i < setIndex && s.is_warmup_set).length} of{' '}
              {exercise.sets.filter((s) => !s.is_warmup_set).length}
            </Text>
          )}

          {setIndex === 0 && exercise.sets.length > 0 && !currentSet.is_warmup_set && (
            <Select
              size="sm"
              value={setType}
              onChange={(val) => {
                if (!val) return;
                const newType = val as ExerciseSetTypeEnum;
                exercise.sets.forEach((s, i) => {
                  onUpdateSet(i, { ...s, type: newType, value: {} });
                });
              }}
              data={[
                { value: 'reps_weight', label: 'Reps & Weight' },
                { value: 'reps_only', label: 'Reps Only' },
                { value: 'duration', label: 'Duration' },
                { value: 'distance', label: 'Distance' },
              ]}
              w={180}
            />
          )}

          <Box w="100%" maw={360}>
            <SetInputs
              set={currentSet}
              onChange={(s) => onUpdateSet(setIndex, s)}
            />
          </Box>

          <Button
            size="lg"
            color="orange"
            fullWidth
            maw={360}
            onClick={() => onLogSet(currentSet.rest_seconds)}
          >
            Log Set
          </Button>
          {canPostpone && (
            <Button variant="subtle" color="gray" size="sm" onClick={onPostpone}>
              Postpone — someone's using this
            </Button>
          )}
        </>
      ) : (
        <Stack align="center" gap="md">
          <Text c="green" fw={600} size="lg">
            All {exercise.sets.length} sets logged
          </Text>
          <Button variant="subtle" size="sm" onClick={onAddSet}>
            + Add another set
          </Button>
          {isLastExercise ? (
            <Button size="lg" color="green" fullWidth maw={360} onClick={onFinish}>
              Finish Workout
            </Button>
          ) : (
            <Button size="lg" color="orange" fullWidth maw={360} onClick={onNextExercise}>
              Next Exercise
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
}

function RestScreen({
  seconds,
  nextExerciseName,
  onDone,
  onSkip,
}: {
  seconds: number;
  nextExerciseName: string;
  onDone: () => void;
  onSkip: () => void;
}) {
  const { remaining, progress } = useTimer(seconds, {
    onComplete: onDone,
    autoStart: true,
    beepAtSeconds: 5,
  });

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <Stack align="center" justify="center" h="100%" gap="xl">
      <Text c="dimmed" size="lg">Rest</Text>
      <RingProgress
        size={200}
        thickness={10}
        roundCaps
        sections={[{ value: progress, color: 'orange' }]}
        label={
          <Text ta="center" fw={700} style={{ fontSize: 32 }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </Text>
        }
      />
      <Text c="dimmed">Next: {nextExerciseName}</Text>
      <Button variant="subtle" color="gray" onClick={onSkip}>
        Skip Rest
      </Button>
    </Stack>
  );
}

function CompleteScreen({
  totalSets,
  onDone,
}: {
  totalSets: number;
  onDone: () => void;
}) {
  useEffect(() => {
    playCompleteSound();
  }, []);

  return (
    <Stack align="center" justify="center" h="100%" gap="xl">
      <Title order={1} c="green">Workout Complete</Title>
      <Text size="xl" c="dimmed">{totalSets} sets logged</Text>
      <Button size="lg" color="orange" onClick={onDone} maw={360} fullWidth>
        Done
      </Button>
    </Stack>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function GuidedWorkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useWorkoutSessionsRetrieveQuery(
    { id: id! },
    { skip: !id },
  );
  const [updateSession] = useWorkoutSessionsPartialUpdateMutation();
  const [completeSession] = useWorkoutSessionsCompleteCreateMutation();

  // Split exercises into warmups and main
  const { warmups, mainExercises } = useMemo(() => {
    if (!session?.exercises) return { warmups: [] as ExerciseItem[], mainExercises: [] as ExerciseItem[] };
    const all = session.exercises.map((e): ExerciseItem => ({
      id: e.id,
      exercise: e.exercise,
      exercise_name: e.exercise_name ?? `Exercise ${e.exercise}`,
      ladder_node: e.ladder_node ?? null,
      order: e.order,
      is_warmup: e.is_warmup ?? false,
      warmup_duration_seconds: e.warmup_duration_seconds ?? null,
      sets: e.sets.map((s) => ({
        set_number: s.set_number,
        is_warmup_set: s.is_warmup_set ?? false,
        type: s.type,
        value: s.value as Record<string, number>,
        completed: s.completed ?? false,
        rest_seconds: s.rest_seconds ?? 90,
      })),
    }));
    return {
      warmups: all.filter((e) => e.is_warmup),
      mainExercises: all.filter((e) => !e.is_warmup),
    };
  }, [session]);

  // Local mutable state for main exercise sets
  const [exerciseStates, setExerciseStates] = useState<ExerciseItem[]>([]);
  useEffect(() => {
    if (mainExercises.length > 0) {
      setExerciseStates(mainExercises.map((e) => ({
        ...e,
        // Ensure each exercise has at least 1 empty set for logging
        sets: e.sets.length > 0 ? e.sets : [{
          set_number: 1,
          is_warmup_set: false,
          type: 'reps_weight' as ExerciseSetTypeEnum,
          value: {},
          completed: false,
          rest_seconds: 90,
        }],
      })));
    }
  }, [mainExercises]);

  // State machine
  const reducer = useMemo(
    () => createReducer(warmups.length, mainExercises.length),
    [warmups.length, mainExercises.length],
  );

  const [state, dispatch] = useReducer(reducer, {
    phase: { type: 'countdown', count: 3 },
    warmupCount: warmups.length,
    mainCount: mainExercises.length,
  });

  // Countdown ticker
  useEffect(() => {
    if (state.phase.type !== 'countdown' || state.phase.count === 0) return;
    const t = setTimeout(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearTimeout(t);
  }, [state.phase]);

  // Auto-advance from countdown 0 → next phase
  useEffect(() => {
    if (state.phase.type === 'countdown' && state.phase.count === 0) {
      const t = setTimeout(() => dispatch({ type: 'COUNTDOWN_DONE' }), 800);
      return () => clearTimeout(t);
    }
  }, [state.phase]);

  // Track exercise/set index and warmup progress in local state alongside reducer
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [warmupsDone, setWarmupsDone] = useState(0);

  const handleWarmupDone = useCallback(() => {
    setWarmupsDone((n) => n + 1);
    dispatch({ type: 'WARMUP_DONE' });
  }, []);
  const handleSkip = useCallback(() => {
    if (state.phase.type === 'warmup') setWarmupsDone((n) => n + 1);
    dispatch({ type: 'SKIP' });
  }, [state.phase.type]);

  // Postpone: swap current exercise with the next one
  const handlePostpone = useCallback(() => {
    setExerciseStates((prev) => {
      const next = [...prev];
      const i = currentExerciseIndex;
      if (i >= next.length - 1) return prev;
      const tmp = next[i]!;
      next[i] = next[i + 1]!;
      next[i + 1] = tmp;
      return next;
    });
    setCurrentSetIndex(0);
  }, [currentExerciseIndex]);

  // Save exercises to backend
  const saveExercises = useCallback(async (exercises: ExerciseItem[]) => {
    if (!id) return;
    const payload: SessionExerciseRequest[] = [
      // Include warmups unchanged
      ...warmups.map((e) => ({
        exercise: e.exercise,
        ladder_node: e.ladder_node,
        order: e.order,
        sets: [] as ExerciseSetRequest[],
      })),
      // Include main exercises with current set data
      ...exercises.map((e) => ({
        exercise: e.exercise,
        ladder_node: e.ladder_node,
        order: e.order,
        sets: e.sets.map((s): ExerciseSetRequest => ({
          set_number: s.set_number,
          is_warmup_set: s.is_warmup_set,
          type: s.type,
          value: s.value,
          completed: s.completed,
          rest_seconds: s.rest_seconds,
        })),
      })),
    ];
    await updateSession({
      id,
      patchedWorkoutSessionDetailRequest: { exercises: payload },
    });
  }, [id, warmups, updateSession]);

  const handleFinish = useCallback(async () => {
    if (!id) return;
    await saveExercises(exerciseStates);
    const payload: SessionExerciseRequest[] = [
      ...warmups.map((e) => ({
        exercise: e.exercise,
        ladder_node: e.ladder_node,
        order: e.order,
        sets: [] as ExerciseSetRequest[],
      })),
      ...exerciseStates.map((e) => ({
        exercise: e.exercise,
        ladder_node: e.ladder_node,
        order: e.order,
        sets: e.sets.map((s): ExerciseSetRequest => ({
          set_number: s.set_number,
          type: s.type,
          value: s.value,
          completed: s.completed,
          rest_seconds: s.rest_seconds,
          is_warmup_set: s.is_warmup_set,
        })),
      })),
    ];
    await completeSession({
      id,
      workoutSessionDetailRequest: {
        date: session?.date ?? new Date().toISOString().slice(0, 10),
        exercises: payload,
      },
    });
    navigate('/');
  }, [id, session, exerciseStates, warmups, saveExercises, completeSession, navigate]);

  if (!id || isLoading) {
    return (
      <Box pos="fixed" top={0} left={0} right={0} bottom={0} bg="#0a0612" style={{ zIndex: 1000 }}>
        <Stack align="center" justify="center" h="100%">
          <Loader color="orange" />
        </Stack>
      </Box>
    );
  }

  const totalLoggedSets = exerciseStates.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length, 0,
  );

  // ─── Render based on phase ─────────────────────────────────────────────────

  const renderPhase = () => {
    const { phase } = state;

    switch (phase.type) {
      case 'countdown':
        return (
          <CountdownScreen
            count={phase.count}
            onDone={() => dispatch({ type: 'COUNTDOWN_DONE' })}
          />
        );

      case 'warmup': {
        const wu = warmups[phase.index];
        if (!wu) return null;
        return (
          <WarmupScreen
            key={`warmup-${phase.index}`}
            exercise={wu}
            index={phase.index}
            total={warmups.length}
            onDone={handleWarmupDone}
            onSkip={handleSkip}
          />
        );
      }

      case 'exercise': {
        const ex = exerciseStates[currentExerciseIndex];
        if (!ex) {
          return <CompleteScreen totalSets={totalLoggedSets} onDone={() => navigate('/')} />;
        }
        return (
          <ExerciseScreen
            key={`exercise-${currentExerciseIndex}`}
            exercise={ex}
            exerciseIndex={currentExerciseIndex}
            totalExercises={exerciseStates.length}
            setIndex={currentSetIndex}
            canPostpone={currentExerciseIndex < exerciseStates.length - 1}
            onPostpone={handlePostpone}
            onLogSet={(restSeconds) => {
              setExerciseStates((prev) => {
                const next = [...prev];
                const src = next[currentExerciseIndex];
                if (!src) return prev;
                const sets = [...src.sets];
                const currentSet = sets[currentSetIndex];
                if (currentSet) sets[currentSetIndex] = { ...currentSet, completed: true };
                next[currentExerciseIndex] = { ...src, sets };
                saveExercises(next);
                return next;
              });
              if (restSeconds > 0) {
                dispatch({ type: 'SET_LOGGED', restSeconds });
              } else {
                setCurrentSetIndex((i) => i + 1);
              }
            }}
            onAddSet={() => {
              setExerciseStates((prev) => {
                const next = [...prev];
                const src = next[currentExerciseIndex];
                if (!src) return prev;
                const sets = [...src.sets];
                const lastSet = sets[sets.length - 1];
                sets.push({
                  set_number: sets.length + 1,
                  is_warmup_set: false,
                  type: lastSet?.type ?? 'reps_weight',
                  value: lastSet ? { ...lastSet.value } : {},
                  completed: false,
                  rest_seconds: lastSet?.rest_seconds ?? 90,
                });
                next[currentExerciseIndex] = { ...src, sets };
                return next;
              });
            }}
            onUpdateSet={(setIdx, set) => {
              setExerciseStates((prev) => {
                const next = [...prev];
                const src = next[currentExerciseIndex];
                if (!src) return prev;
                const sets = [...src.sets];
                sets[setIdx] = set;
                next[currentExerciseIndex] = { ...src, sets };
                return next;
              });
            }}
            onNextExercise={() => {
              setCurrentExerciseIndex((i) => i + 1);
              setCurrentSetIndex(0);
            }}
            onFinish={handleFinish}
          />
        );
      }

      case 'rest': {
        const currentEx = exerciseStates[currentExerciseIndex];
        return (
          <RestScreen
            key={`rest-${currentExerciseIndex}-${currentSetIndex}`}
            seconds={phase.seconds}
            nextExerciseName={currentEx?.exercise_name ?? 'Next'}
            onDone={() => {
              setCurrentSetIndex((i) => i + 1);
              dispatch({ type: 'REST_DONE' });
            }}
            onSkip={() => {
              setCurrentSetIndex((i) => i + 1);
              dispatch({ type: 'SKIP' });
            }}
          />
        );
      }

      case 'complete':
        return <CompleteScreen totalSets={totalLoggedSets} onDone={() => navigate('/')} />;

      default:
        return null;
    }
  };

  const showProgressBar = state.phase.type !== 'countdown' && state.phase.type !== 'complete';

  return (
    <Box pos="fixed" top={0} left={0} right={0} bottom={0} bg="#0a0612" style={{ zIndex: 1000 }}>
      {/* Progress bar */}
      {showProgressBar && (
        <WorkoutProgressBar
          phase={state.phase.type}
          warmupsDone={warmupsDone}
          warmupsTotal={warmups.length}
          exerciseStates={exerciseStates}
          currentExerciseIndex={currentExerciseIndex}
          currentSetIndex={currentSetIndex}
        />
      )}
      {/* Exit button */}
      <Button
        variant="subtle"
        color="gray"
        size="xs"
        pos="absolute"
        top={showProgressBar ? 40 : 16}
        right={16}
        style={{ zIndex: 1001 }}
        onClick={() => navigate(`/workout/${id}`)}
      >
        Exit to Log View
      </Button>
      {renderPhase()}
    </Box>
  );
}
