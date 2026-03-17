import { Stack, Title, Text, Card, Alert } from '@mantine/core';
import { GoogleLogin as GoogleLoginButton, CredentialResponse } from '@react-oauth/google';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/';

export function Login() {
  const dispatch = useDispatch();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (response: CredentialResponse) => {
    setError(null);
    if (!response.credential) {
      setError('No credential received from Google');
      return;
    }

    try {
      const res = await fetch(`${API_URL}api/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.non_field_errors?.[0] ?? data.detail ?? 'Login failed');
        return;
      }

      const data = await res.json();
      dispatch(
        setCredentials({
          token: data.key,
          user: data.user ?? null,
        })
      );
    } catch {
      setError('Network error — could not reach the server');
    }
  };

  return (
    <Stack align="center" justify="center" mt="20vh" gap="lg">
      <Title order={1}>Workout Tracker</Title>
      <Text c="dimmed" size="sm">
        Sign in to log workouts and track your progress
      </Text>
      <Card withBorder p="xl" w={320}>
        <Stack align="center" gap="md">
          {error && (
            <Alert color="red" w="100%">
              {error}
            </Alert>
          )}
          <GoogleLoginButton
            onSuccess={handleSuccess}
            onError={() => setError('Google sign-in failed')}
            size="large"
            width="280"
          />
        </Stack>
      </Card>
    </Stack>
  );
}
