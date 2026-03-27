import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Container,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useExtension } from '../hooks/useExtension';
import { sweepActions } from '../store/sweepSlice';
import type { AppDispatch } from '../store/store';

/** Format today as "March 27" for the default search. */
function todayDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

export function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { status, fetchPhotos } = useExtension();

  const [date, setDate] = useState(todayDateString);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    dispatch(sweepActions.fetchStart(date));

    try {
      const photos = await fetchPhotos(date);
      dispatch(sweepActions.fetchSuccess(photos));

      if (photos.length === 0) {
        setError(`No photos found for "${date}".`);
        setLoading(false);
        return;
      }

      setLoading(false);
      navigate('/sweep');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      dispatch(sweepActions.fetchError(msg));
      setError(msg);
      setLoading(false);
    }
  }, [date, dispatch, fetchPhotos, navigate]);

  return (
    <Container size="xs" py="xl">
      <Stack gap="lg" align="center">
        <Title order={2}>PhotoBroom</Title>
        <Text c="dimmed" ta="center" maw={400}>
          Clean up your Google Photos. See what you took on this day in
          previous years, then swipe to keep or trash.
        </Text>

        {/* Extension status */}
        {status === 'checking' && (
          <Badge color="gray" variant="outline" size="lg">
            Checking extension...
          </Badge>
        )}
        {status === 'connected' && (
          <Badge color="green" variant="outline" size="lg">
            Extension connected
          </Badge>
        )}
        {status === 'not-found' && (
          <Alert color="orange" title="Extension not detected" maw={400}>
            <Text size="sm">
              The PhotoBroom Chrome extension is required. Load it as an
              unpacked extension from{' '}
              <Text span ff="monospace" size="xs">
                extensions/photobroom/
              </Text>{' '}
              in{' '}
              <Text span ff="monospace" size="xs">
                chrome://extensions
              </Text>
              . Then reload this page.
            </Text>
          </Alert>
        )}

        {/* Date input */}
        <TextInput
          label="Search date"
          description='Date to search in Google Photos (e.g. "March 27", "December 25 2023")'
          value={date}
          onChange={(e) => setDate(e.currentTarget.value)}
          size="md"
          w="100%"
          maw={400}
        />

        {/* Fetch button */}
        <Button
          size="lg"
          onClick={handleFetch}
          loading={loading}
          disabled={status !== 'connected' || !date.trim()}
          leftSection={loading ? <Loader size="xs" /> : null}
        >
          {loading ? 'Scanning Google Photos...' : `Show me "${date}" photos`}
        </Button>

        {error && (
          <Alert color="red" maw={400}>
            {error}
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
