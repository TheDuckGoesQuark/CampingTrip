import { useEffect, useState } from 'react';
import {
  Title,
  Text,
  Card,
  Group,
  Stack,
  Button,
  TextInput,
  Select,
  ActionIcon,
  Badge,
  Loader,
  Modal,
  SegmentedControl,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  useWorkoutPlansListQuery,
  useWorkoutPlansCreateMutation,
  useWorkoutPlansUpdateMutation,
  useWorkoutPlansRetrieveQuery,
  useWorkoutExercisesListQuery,
  useWorkoutLaddersListQuery,
  type PlanSlotRequest,
  type DayOfWeekEnum,
} from '../api/generated-api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function SlotEditor({
  slot,
  exercises,
  ladders,
  onChange,
  onRemove,
}: {
  slot: PlanSlotRequest;
  exercises: { value: string; label: string }[];
  ladders: { value: string; label: string }[];
  onChange: (slot: PlanSlotRequest) => void;
  onRemove: () => void;
}) {
  const sourceType = slot.ladder ? 'ladder' : 'exercise';

  return (
    <Card withBorder p="xs">
      <Group justify="space-between" mb="xs">
        <SegmentedControl
          size="xs"
          value={sourceType}
          onChange={(val) => {
            if (val === 'ladder') {
              onChange({ ...slot, ladder: null, exercise: null });
            } else {
              onChange({ ...slot, exercise: null, ladder: null });
            }
          }}
          data={[
            { label: 'Exercise', value: 'exercise' },
            { label: 'Ladder', value: 'ladder' },
          ]}
        />
        <ActionIcon variant="subtle" color="red" size="sm" onClick={onRemove}>
          x
        </ActionIcon>
      </Group>
      {sourceType === 'exercise' ? (
        <Select
          size="xs"
          placeholder="Select exercise"
          data={exercises}
          value={slot.exercise?.toString() ?? null}
          onChange={(val) => onChange({ ...slot, exercise: val ? Number(val) : null, ladder: null })}
          searchable
        />
      ) : (
        <Select
          size="xs"
          placeholder="Select ladder"
          data={ladders}
          value={slot.ladder?.toString() ?? null}
          onChange={(val) => onChange({ ...slot, ladder: val ? Number(val) : null, exercise: null })}
          searchable
        />
      )}
    </Card>
  );
}

function DayColumn({
  day,
  dayIndex,
  slots,
  exercises,
  ladders,
  onSlotsChange,
}: {
  day: string;
  dayIndex: DayOfWeekEnum;
  slots: PlanSlotRequest[];
  exercises: { value: string; label: string }[];
  ladders: { value: string; label: string }[];
  onSlotsChange: (dayIndex: DayOfWeekEnum, slots: PlanSlotRequest[]) => void;
}) {
  const daySlots = slots
    .filter((s) => s.day_of_week === dayIndex)
    .sort((a, b) => a.order - b.order);

  const addSlot = () => {
    const newSlot: PlanSlotRequest = {
      day_of_week: dayIndex,
      order: daySlots.length + 1,
      exercise: null,
      ladder: null,
    };
    onSlotsChange(dayIndex, [...daySlots, newSlot]);
  };

  const updateSlot = (index: number, updated: PlanSlotRequest) => {
    const newSlots = [...daySlots];
    newSlots[index] = updated;
    onSlotsChange(dayIndex, newSlots);
  };

  const removeSlot = (index: number) => {
    const newSlots = daySlots.filter((_, i) => i !== index);
    newSlots.forEach((s, i) => (s.order = i + 1));
    onSlotsChange(dayIndex, newSlots);
  };

  return (
    <Card withBorder p="sm">
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="sm">{day}</Text>
        <Badge size="xs" variant="light">{daySlots.length}</Badge>
      </Group>
      <Stack gap="xs">
        {daySlots.map((slot, i) => (
          <SlotEditor
            key={i}
            slot={slot}
            exercises={exercises}
            ladders={ladders}
            onChange={(s) => updateSlot(i, s)}
            onRemove={() => removeSlot(i)}
          />
        ))}
        <Button variant="subtle" size="xs" onClick={addSlot} fullWidth>
          + Add exercise
        </Button>
      </Stack>
    </Card>
  );
}

function PlanEditor({
  planId,
  onClose,
}: {
  planId?: string;
  onClose: () => void;
}) {
  const { data: plan } = useWorkoutPlansRetrieveQuery(
    { id: planId! },
    { skip: !planId }
  );
  const { data: exercisesData } = useWorkoutExercisesListQuery({});
  const { data: laddersData } = useWorkoutLaddersListQuery({});
  const [createPlan, { isLoading: isCreating }] = useWorkoutPlansCreateMutation();
  const [updatePlan, { isLoading: isUpdating }] = useWorkoutPlansUpdateMutation();

  const [name, setName] = useState('');
  const [slots, setSlots] = useState<PlanSlotRequest[]>([]);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setSlots(
        plan.slots.map((s) => ({
          day_of_week: s.day_of_week,
          order: s.order,
          ladder: s.ladder ?? null,
          exercise: s.exercise ?? null,
          exercise_params: s.exercise_params ?? null,
        }))
      );
    }
  }, [plan]);

  const exercises = (exercisesData?.results ?? []).map((e) => ({
    value: String(e.id),
    label: e.name,
  }));

  const ladders = (laddersData?.results ?? []).map((l) => ({
    value: String(l.id),
    label: l.name ?? 'Unnamed Ladder',
  }));

  const handleSlotsChange = (dayIndex: DayOfWeekEnum, daySlots: PlanSlotRequest[]) => {
    setSlots((prev) => [
      ...prev.filter((s) => s.day_of_week !== dayIndex),
      ...daySlots,
    ]);
  };

  const handleSave = async () => {
    const validSlots = slots.filter((s) => s.ladder || s.exercise);
    const payload = { name, active: true, slots: validSlots };

    if (planId) {
      await updatePlan({ id: planId, weeklyPlanDetailRequest: payload });
    } else {
      await createPlan({ weeklyPlanDetailRequest: payload });
    }
    onClose();
  };

  return (
    <Stack>
      <TextInput
        label="Plan name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        placeholder="e.g. Push/Pull/Legs"
      />
      <Stack gap="sm">
        {DAYS.map((day, i) => (
          <DayColumn
            key={day}
            day={day}
            dayIndex={i as DayOfWeekEnum}
            slots={slots}
            exercises={exercises}
            ladders={ladders}
            onSlotsChange={handleSlotsChange}
          />
        ))}
      </Stack>
      <Button onClick={handleSave} loading={isCreating || isUpdating}>
        {planId ? 'Update Plan' : 'Create Plan'}
      </Button>
    </Stack>
  );
}

export function WeeklyPlan() {
  const { data, isLoading } = useWorkoutPlansListQuery({});
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  if (isLoading) return <Loader />;

  const plans = data?.results ?? [];

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Weekly Plans</Title>
        <Button
          size="sm"
          onClick={() => {
            setEditingId(undefined);
            open();
          }}
        >
          New Plan
        </Button>
      </Group>

      {plans.length === 0 ? (
        <Card withBorder p="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed">No plans yet</Text>
            <Text size="sm" c="dimmed">
              Create a weekly plan to schedule your workouts
            </Text>
            <Button onClick={open}>Create your first plan</Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap="sm">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              withBorder
              p="sm"
              onClick={() => {
                setEditingId(String(plan.id));
                open();
              }}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{plan.name}</Text>
                  <Text size="sm" c="dimmed">
                    {plan.slot_count} exercises scheduled
                  </Text>
                </div>
                {plan.active && (
                  <Badge color="green" variant="light">Active</Badge>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? 'Edit Plan' : 'New Plan'}
        fullScreen
      >
        <PlanEditor planId={editingId} onClose={close} />
      </Modal>
    </>
  );
}
