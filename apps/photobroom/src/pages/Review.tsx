import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Group,
  Image,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import {
  sweepActions,
  selectTrashIds,
  selectStats,
} from '../store/sweepSlice';
import { useExtension } from '../hooks/useExtension';
import type { ScrapedPhoto, Decision } from '../types';
import type { AppDispatch, RootState } from '../store/store';

export function Review() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { deletePhotos } = useExtension();

  const photos = useSelector((state: RootState) => state.sweep.photos);
  const decisions = useSelector((state: RootState) => state.sweep.decisions);
  const deleting = useSelector((state: RootState) => state.sweep.deleting);
  const deleteProgress = useSelector(
    (state: RootState) => state.sweep.deleteProgress
  );
  const deleteResults = useSelector(
    (state: RootState) => state.sweep.deleteResults
  );
  const trashIds = useSelector(selectTrashIds);
  const stats = useSelector(selectStats);

  // Group photos by decision
  const grouped = useMemo(() => {
    const groups: Record<Decision, ScrapedPhoto[]> = {
      trash: [],
      keep: [],
      skip: [],
    };
    for (const photo of photos) {
      const decision = decisions[photo.id];
      if (decision) {
        groups[decision].push(photo);
      }
    }
    return groups;
  }, [photos, decisions]);

  const handleFlip = useCallback(
    (id: string) => {
      if (!deleting) {
        dispatch(sweepActions.flipDecision(id));
      }
    },
    [dispatch, deleting]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (trashIds.length === 0) return;

    dispatch(sweepActions.deleteStart());

    try {
      const response = await deletePhotos(trashIds);
      for (const result of response.results) {
        dispatch(sweepActions.deleteProgress(result));
      }
      dispatch(sweepActions.deleteComplete());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Deletion failed';
      dispatch(sweepActions.deleteError(msg));
    }
  }, [trashIds, deletePhotos, dispatch]);

  const isComplete =
    !deleting && deleteResults.length > 0;
  const successCount = deleteResults.filter((r) => r.success).length;
  const failCount = deleteResults.filter((r) => !r.success).length;

  // Completion screen
  if (isComplete) {
    return (
      <Container size="xs" py="xl">
        <Stack align="center" gap="lg">
          <Title order={2}>Cleanup complete</Title>
          <Text size="xl" c="green" fw={600}>
            {successCount} photo{successCount !== 1 ? 's' : ''} trashed
          </Text>
          {failCount > 0 && (
            <Text size="sm" c="red">
              {failCount} failed to delete
            </Text>
          )}
          <Text c="dimmed" ta="center">
            {stats.kept} photos kept. Trashed photos are in your Google
            Photos trash for 60 days.
          </Text>
          <Button size="lg" onClick={() => {
            dispatch(sweepActions.reset());
            navigate('/');
          }}>
            Sweep another day
          </Button>
        </Stack>
      </Container>
    );
  }

  // Deletion in progress
  if (deleting) {
    const pct =
      deleteProgress.total > 0
        ? (deleteProgress.done / deleteProgress.total) * 100
        : 0;
    return (
      <Container size="xs" py="xl">
        <Stack align="center" gap="lg">
          <Title order={3}>Deleting photos...</Title>
          <Text c="dimmed">
            {deleteProgress.done} of {deleteProgress.total}
          </Text>
          <Progress value={pct} size="lg" color="red" w="100%" />
          <Text size="xs" c="dimmed">
            The extension is navigating Google Photos and deleting each
            photo. This may take a moment.
          </Text>
        </Stack>
      </Container>
    );
  }

  // Review grid
  return (
    <Container size="md" py="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>Review</Title>
          <Button
            variant="subtle"
            size="xs"
            onClick={() => navigate('/sweep')}
          >
            Back to swiping
          </Button>
        </Group>

        <Text c="dimmed" size="sm">
          Tap a photo to flip its decision. Then confirm when ready.
        </Text>

        {/* Trash section */}
        {grouped.trash.length > 0 && (
          <>
            <Text fw={600} c="red" size="sm">
              Trashing ({grouped.trash.length})
            </Text>
            <PhotoGrid
              photos={grouped.trash}
              borderColor="red"
              dimmed
              onFlip={handleFlip}
            />
          </>
        )}

        {/* Keep section */}
        {grouped.keep.length > 0 && (
          <>
            <Text fw={600} c="green" size="sm">
              Keeping ({grouped.keep.length})
            </Text>
            <PhotoGrid
              photos={grouped.keep}
              borderColor="green"
              onFlip={handleFlip}
            />
          </>
        )}

        {/* Skip section */}
        {grouped.skip.length > 0 && (
          <>
            <Text fw={600} c="gray" size="sm">
              Skipped ({grouped.skip.length})
            </Text>
            <PhotoGrid
              photos={grouped.skip}
              borderColor="gray"
              onFlip={handleFlip}
            />
          </>
        )}

        {/* Confirm button */}
        <Box
          style={{
            position: 'sticky',
            bottom: 0,
            padding: '16px 0',
            background: 'var(--mantine-color-dark-7)',
          }}
        >
          <Button
            fullWidth
            size="lg"
            color="red"
            onClick={handleConfirmDelete}
            disabled={trashIds.length === 0}
          >
            {trashIds.length > 0
              ? `Confirm: trash ${trashIds.length} photo${trashIds.length !== 1 ? 's' : ''}`
              : 'No photos to trash'}
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}

// ---------------------------------------------------------------------------
// Photo grid sub-component
// ---------------------------------------------------------------------------

function PhotoGrid({
  photos,
  borderColor,
  dimmed,
  onFlip,
}: {
  photos: ScrapedPhoto[];
  borderColor: string;
  dimmed?: boolean;
  onFlip: (id: string) => void;
}) {
  return (
    <Grid gutter="xs">
      {photos.map((photo) => (
        <Grid.Col key={photo.id} span={{ base: 4, sm: 3 }}>
          <Box
            onClick={() => onFlip(photo.id)}
            style={{
              cursor: 'pointer',
              borderRadius: 'var(--mantine-radius-sm)',
              border: `2px solid var(--mantine-color-${borderColor}-6)`,
              overflow: 'hidden',
              opacity: dimmed ? 0.5 : 1,
              aspectRatio: '1',
            }}
          >
            <Image
              src={photo.thumbnailUrl}
              alt={photo.ariaLabel}
              h="100%"
              w="100%"
              fit="cover"
            />
          </Box>
        </Grid.Col>
      ))}
    </Grid>
  );
}
