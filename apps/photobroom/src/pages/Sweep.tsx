import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Group } from '@mantine/core';
import { useSelector } from 'react-redux';
import { SwipeDeck } from '../components/SwipeDeck';

export function Sweep() {
  const navigate = useNavigate();
  const hasPhotos = useSelector(
    (state: { sweep: { photos: unknown[] } }) => state.sweep.photos.length > 0
  );

  const handleComplete = useCallback(() => {
    navigate('/sweep/review');
  }, [navigate]);

  // If no photos loaded (e.g. direct navigation), redirect home
  if (!hasPhotos) {
    return (
      <Box p="xl" ta="center">
        <Button onClick={() => navigate('/')}>Go back home</Button>
      </Box>
    );
  }

  return (
    <Box h="calc(100vh - 48px)" style={{ display: 'flex', flexDirection: 'column' }}>
      <Group justify="flex-end" px="md" pt="xs">
        <Button
          variant="subtle"
          size="xs"
          color="gray"
          onClick={handleComplete}
        >
          Skip to review
        </Button>
      </Group>
      <Box style={{ flex: 1 }}>
        <SwipeDeck onComplete={handleComplete} />
      </Box>
    </Box>
  );
}
