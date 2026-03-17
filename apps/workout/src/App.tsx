import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, Group, UnstyledButton, Text, Stack } from '@mantine/core';

import { Dashboard } from './pages/Dashboard';
import { LogWorkout } from './pages/LogWorkout';
import { History } from './pages/History';
import { Exercises } from './pages/Exercises';
import { Ladders } from './pages/Ladders';
import { WeeklyPlan } from './pages/WeeklyPlan';

const navItems = [
  { path: '/', label: 'Home', icon: '~' },
  { path: '/workout', label: 'Workout', icon: '+' },
  { path: '/plan', label: 'Plan', icon: '#' },
  { path: '/ladders', label: 'Ladders', icon: '^' },
  { path: '/history', label: 'History', icon: '<' },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Group grow h="100%" px="xs">
      {navItems.map((item) => (
        <UnstyledButton
          key={item.path}
          onClick={() => navigate(item.path)}
          py="xs"
        >
          <Stack align="center" gap={2}>
            <Text
              size="lg"
              fw={location.pathname === item.path ? 700 : 400}
              c={location.pathname === item.path ? 'orange' : 'dimmed'}
            >
              {item.icon}
            </Text>
            <Text
              size="xs"
              fw={location.pathname === item.path ? 700 : 400}
              c={location.pathname === item.path ? 'orange' : 'dimmed'}
            >
              {item.label}
            </Text>
          </Stack>
        </UnstyledButton>
      ))}
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout" element={<LogWorkout />} />
            <Route path="/plan" element={<WeeklyPlan />} />
            <Route path="/ladders" element={<Ladders />} />
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
