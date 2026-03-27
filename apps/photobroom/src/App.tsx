import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell, Anchor, Group, Title } from '@mantine/core';
import { Home } from './pages/Home';
import { Sweep } from './pages/Sweep';
import { Review } from './pages/Review';

export function App() {
  return (
    <BrowserRouter>
      <AppShell header={{ height: 48 }} padding={0}>
        <AppShell.Header
          style={{ background: 'var(--mantine-color-dark-8)', borderBottom: 'none' }}
        >
          <Group h="100%" px="md" justify="space-between">
            <Anchor href="/" underline="never" c="dimmed" size="sm">
              <Title order={5} c="dimmed">
                PhotoBroom
              </Title>
            </Anchor>
            <Anchor
              href="https://jordanscamp.site"
              target="_blank"
              size="xs"
              c="dimmed"
            >
              jordanscamp.site
            </Anchor>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sweep" element={<Sweep />} />
            <Route path="/sweep/review" element={<Review />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </BrowserRouter>
  );
}
