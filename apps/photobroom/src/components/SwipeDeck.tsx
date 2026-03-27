import { useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Box, Button, Group, Progress, Stack, Text } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { SwipeCard } from './SwipeCard';
import {
  sweepActions,
  selectCurrentPhoto,
  selectNextPhoto,
  selectStats,
  selectIsComplete,
} from '../store/sweepSlice';
import type { Decision } from '../types';
import type { AppDispatch } from '../store/store';

export interface SwipeDeckProps {
  onComplete: () => void;
}

export function SwipeDeck({ onComplete }: SwipeDeckProps) {
  const dispatch = useDispatch<AppDispatch>();
  const currentPhoto = useSelector(selectCurrentPhoto);
  const nextPhoto = useSelector(selectNextPhoto);
  const stats = useSelector(selectStats);
  const isComplete = useSelector(selectIsComplete);
  const currentIndex = useSelector(
    (state: { sweep: { currentIndex: number } }) => state.sweep.currentIndex
  );

  const handleSwipe = useCallback(
    (direction: 'left' | 'right' | 'up') => {
      if (!currentPhoto) return;
      const decisionMap: Record<string, Decision> = {
        right: 'keep',
        left: 'trash',
        up: 'skip',
      };
      dispatch(
        sweepActions.decide({
          id: currentPhoto.id,
          decision: decisionMap[direction]!,
        })
      );
    },
    [currentPhoto, dispatch]
  );

  const handleUndo = useCallback(() => {
    dispatch(sweepActions.undo());
  }, [dispatch]);

  // When all cards are swiped, navigate to review
  if (isComplete) {
    return (
      <Stack align="center" justify="center" h="100%" gap="lg" p="xl">
        <Text size="xl" fw={600}>
          All done!
        </Text>
        <Text c="dimmed" ta="center">
          {stats.trashed} to trash, {stats.kept} to keep, {stats.skipped}{' '}
          skipped
        </Text>
        <Button size="lg" onClick={onComplete}>
          Review decisions
        </Button>
      </Stack>
    );
  }

  const progressPct =
    stats.total > 0 ? (currentIndex / stats.total) * 100 : 0;

  return (
    <Stack h="100%" gap={0}>
      {/* Progress header */}
      <Box p="sm">
        <Group justify="space-between" mb={4}>
          <Text size="sm" c="dimmed">
            {currentIndex + 1} of {stats.total}
          </Text>
          <Group gap="xs">
            <Text size="xs" c="green">
              {stats.kept} kept
            </Text>
            <Text size="xs" c="red">
              {stats.trashed} trashed
            </Text>
          </Group>
        </Group>
        <Progress value={progressPct} size="xs" color="orange" />
      </Box>

      {/* Card stack */}
      <Box style={{ flex: 1, position: 'relative', overflow: 'hidden' }} p="md">
        <AnimatePresence mode="popLayout">
          {/* Next card (behind) */}
          {nextPhoto && (
            <SwipeCard
              key={nextPhoto.id}
              photo={nextPhoto}
              onSwipe={() => {}}
              isTop={false}
            />
          )}

          {/* Current card (on top, draggable) */}
          {currentPhoto && (
            <SwipeCard
              key={currentPhoto.id}
              photo={currentPhoto}
              onSwipe={handleSwipe}
              isTop
            />
          )}
        </AnimatePresence>
      </Box>

      {/* Action buttons */}
      <Group justify="center" p="md" gap="xl">
        <Button
          variant="subtle"
          color="gray"
          size="sm"
          onClick={handleUndo}
          disabled={currentIndex === 0}
        >
          Undo
        </Button>
        <Button
          variant="outline"
          color="red"
          size="lg"
          radius="xl"
          onClick={() => handleSwipe('left')}
        >
          Trash
        </Button>
        <Button
          variant="outline"
          color="gray"
          size="md"
          radius="xl"
          onClick={() => handleSwipe('up')}
        >
          Skip
        </Button>
        <Button
          variant="outline"
          color="green"
          size="lg"
          radius="xl"
          onClick={() => handleSwipe('right')}
        >
          Keep
        </Button>
      </Group>
    </Stack>
  );
}
