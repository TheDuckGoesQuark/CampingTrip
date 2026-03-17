import { useState } from 'react';
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
  Textarea,
  Modal,
} from '@mantine/core';
import {
  useWorkoutLaddersListQuery,
  useWorkoutLaddersCreateMutation,
  useWorkoutLaddersDestroyMutation,
} from '../api/generated-api';

export function Ladders() {
  const { data, isLoading } = useWorkoutLaddersListQuery({});
  const [createLadder] = useWorkoutLaddersCreateMutation();
  const [deleteLadder] = useWorkoutLaddersDestroyMutation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [description, setDescription] = useState('');

  if (isLoading) return <Loader />;

  const ladders = data?.results ?? [];

  const handleCreate = async () => {
    await createLadder({
      ladderDetailRequest: { description },
    });
    setDescription('');
    setCreating(false);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteLadder({ id: String(id) });
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Ladders</Title>
        <Button size="xs" onClick={() => setCreating(true)}>
          + New Ladder
        </Button>
      </Group>

      <Modal
        opened={creating}
        onClose={() => setCreating(false)}
        title="Create Ladder"
        size="sm"
      >
        <Stack>
          <Textarea
            label="Description"
            placeholder="e.g. Pull-up progression"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
          <Text size="xs" c="dimmed">
            The ladder name is derived from its highest-level exercise node.
          </Text>
          <Button onClick={handleCreate}>Create</Button>
        </Stack>
      </Modal>

      {ladders.length === 0 ? (
        <Card withBorder p="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed">No ladders yet</Text>
            <Text size="sm" c="dimmed">
              Create a ladder to set up exercise progressions
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack gap="sm">
          {ladders.map((ladder) => (
            <Card
              key={ladder.id}
              withBorder
              p="sm"
              onClick={() => navigate(`/ladders/${ladder.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{ladder.name || 'Empty Ladder'}</Text>
                  {ladder.description && (
                    <Text size="sm" c="dimmed">{ladder.description}</Text>
                  )}
                </div>
                <Group gap="xs">
                  <Badge variant="light" color="orange">
                    {ladder.node_count ?? 0} node{ladder.node_count !== 1 ? 's' : ''}
                  </Badge>
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={(e) => handleDelete(ladder.id!, e)}
                  >
                    Delete
                  </Button>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
