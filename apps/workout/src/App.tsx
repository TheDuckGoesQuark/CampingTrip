import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Group, UnstyledButton, Text, Stack, Badge } from '@mantine/core';

import { Dashboard } from './pages/Dashboard';
import { LogWorkout } from './pages/LogWorkout';
import { History } from './pages/History';
import { Exercises } from './pages/Exercises';
import { Ladders } from './pages/Ladders';
import { LadderDetail } from './pages/LadderDetail';
import { WeeklyPlan } from './pages/WeeklyPlan';
import { useOfflineSync } from './hooks/useOfflineSync';

const navItems = [
  { path: '/', label: 'Home', icon: '~' },
  { path: '/workout', label: 'Workout', icon: '+' },
  { path: '/plan', label: 'Plan', icon: '#' },
  { path: '/ladders', label: 'Ladders', icon: '^' },
  { path: '/history', label: 'History', icon: '<' },
];

function isActive(pathname: string, itemPath: string) {
  if (itemPath === '/') return pathname === '/';
  return pathname.startsWith(itemPath);
}

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Group grow h="100%" px="xs">
      {navItems.map((item) => {
        const active = isActive(location.pathname, item.path);
        return (
          <UnstyledButton
            key={item.path}
            onClick={() => navigate(item.path)}
            py="xs"
          >
            <Stack align="center" gap={2}>
              <Text size="lg" fw={active ? 700 : 400} c={active ? 'orange' : 'dimmed'}>
                {item.icon}
              </Text>
              <Text size="xs" fw={active ? 700 : 400} c={active ? 'orange' : 'dimmed'}>
                {item.label}
              </Text>
            </Stack>
          </UnstyledButton>
        );
      })}
    </Group>
  );
}

function SyncStatus() {
  const { isOnline, pendingCount, isSyncing } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <Group justify="center" py={4} bg={isOnline ? 'dark.7' : 'dark.8'}>
      {!isOnline && (
        <Badge size="xs" color="red" variant="light">Offline</Badge>
      )}
      {pendingCount > 0 && (
        <Badge size="xs" color="orange" variant="light">
          {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
        </Badge>
      )}
    </Group>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell
        footer={{ height: 60 }}
        padding="md"
      >
        <AppShell.Main>
          <SyncStatus />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout" element={<LogWorkout />} />
            <Route path="/workout/:id" element={<LogWorkout />} />
            <Route path="/plan" element={<WeeklyPlan />} />
            <Route path="/ladders" element={<Ladders />} />
            <Route path="/ladders/:id" element={<LadderDetail />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </AppShell.Main>
        <AppShell.Footer>
          <BottomNav />
        </AppShell.Footer>
      </AppShell>
    </BrowserRouter>
  );
}
