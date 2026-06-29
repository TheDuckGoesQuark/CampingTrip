import {
  Anchor,
  Badge,
  Box,
  Card,
  Code,
  Container,
  Divider,
  Group,
  List,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';

const REPO = 'https://github.com/TheDuckGoesQuark/CampingTrip';
const EXT_DIR = 'extensions/photobroom';

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <Group align="flex-start" wrap="nowrap" gap="md">
      <ThemeIcon radius="xl" size={28} variant="light" color="blue">
        <Text size="sm" fw={700}>
          {n}
        </Text>
      </ThemeIcon>
      <Box style={{ flex: 1, paddingTop: 2 }}>{children}</Box>
    </Group>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="md">
      <Title order={2} size="h3">
        {title}
      </Title>
      {children}
    </Stack>
  );
}

export function App() {
  return (
    <Box bg="dark.9" mih="100vh" c="gray.0">
      {/* Header */}
      <Box
        component="header"
        style={{
          borderBottom: '1px solid var(--mantine-color-dark-5)',
          background: 'var(--mantine-color-dark-8)',
        }}
      >
        <Container size="md">
          <Group h={52} justify="space-between">
            <Text fw={700}>🧹 PhotoBroom</Text>
            <Group gap="lg">
              <Anchor href={REPO} target="_blank" size="sm" c="dimmed">
                Source
              </Anchor>
              <Anchor href="https://jordanscamp.site" target="_blank" size="sm" c="dimmed">
                jordanscamp.site
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>

      <Container size="md" py={48}>
        <Stack gap={48}>
          {/* Hero */}
          <Stack gap="sm">
            <Badge variant="light" color="orange" size="lg" radius="sm">
              Chrome extension
            </Badge>
            <Title order={1} style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1 }}>
              Sweep your Google Photos clutter into the bin.
            </Title>
            <Text size="lg" c="dimmed" maw={620}>
              PhotoBroom overlays a fast, keyboard-driven review on top of Google Photos
              search results. Flick through photos — keep, skip, or bin — then send the binned
              ones to Google's bin in one go. Nothing is deleted until you confirm, and the bin
              is recoverable for 60 days.
            </Text>
          </Stack>

          {/* Why */}
          <Section title="Why a browser extension?">
            <Text c="dimmed">
              Google Photos has no bulk "delete everything from this search" button, and its API
              can't delete photos at all. So PhotoBroom works the only way that's actually
              possible: as an extension that drives the Google Photos web page itself — using
              Google's own multi-select and "Move to bin", just faster and with a nicer review UI.
            </Text>
            <Card withBorder bg="dark.7" radius="md" padding="md">
              <Group gap="sm" wrap="nowrap" align="flex-start">
                <Text size="lg">🔒</Text>
                <Text size="sm" c="dimmed">
                  It runs entirely in your browser, on <Code>photos.google.com</Code>, while
                  you're logged in. No photos, tokens, or data are ever sent anywhere — there's no
                  PhotoBroom server.
                </Text>
              </Group>
            </Card>
          </Section>

          {/* Install */}
          <Section title="Install it (load unpacked)">
            <Text c="dimmed">
              PhotoBroom isn't on the Chrome Web Store (see below), so you load it yourself — a
              one-time, two-minute setup.
            </Text>
            <Stack gap="lg">
              <Step n={1}>
                <Text>Clone the repo and build the extension bundle:</Text>
                <Code block mt={6}>
                  {`git clone ${REPO}\ncd CampingTrip\npnpm install\npnpm --filter photobroom build:overlay`}
                </Code>
              </Step>
              <Step n={2}>
                <Text>
                  Open <Code>chrome://extensions</Code> and turn on <b>Developer mode</b>{' '}
                  (top-right toggle).
                </Text>
              </Step>
              <Step n={3}>
                <Text>
                  Click <b>Load unpacked</b> and select the <Code>{EXT_DIR}</Code> folder from the
                  repo.
                </Text>
              </Step>
              <Step n={4}>
                <Text>
                  That's it — PhotoBroom is now active on Google Photos. After pulling updates,
                  re-run the build command and hit <b>reload</b> ↻ on the extension.
                </Text>
              </Step>
            </Stack>
          </Section>

          {/* Use */}
          <Section title="How to use it">
            <Stack gap="lg">
              <Step n={1}>
                <Text>
                  Go to <Anchor href="https://photos.google.com" target="_blank">photos.google.com</Anchor>{' '}
                  and search for what you want to thin out — a date like <Code>June 29</Code>, a
                  place, or anything else.
                </Text>
              </Step>
              <Step n={2}>
                <Text>
                  In the <b>🧹 PhotoBroom</b> panel (bottom-right), click <b>Sweep this search</b>.
                  It scans the whole result set.
                </Text>
              </Step>
              <Step n={3}>
                <Text>Review each photo with your keyboard (or the buttons):</Text>
                <Group gap="xs" mt={8}>
                  <Badge color="red" variant="light" radius="sm" size="lg">← Bin</Badge>
                  <Badge color="gray" variant="light" radius="sm" size="lg">↑ Skip</Badge>
                  <Badge color="green" variant="light" radius="sm" size="lg">→ Keep</Badge>
                  <Badge color="dark" variant="light" radius="sm" size="lg">⌫ Undo</Badge>
                </Group>
              </Step>
              <Step n={4}>
                <Text>
                  Hit <b>Review →</b>, check the counts, then <b>Move N to bin</b>. PhotoBroom
                  selects exactly those photos and moves them to Google's bin.
                </Text>
              </Step>
              <Step n={5}>
                <Text>
                  Changed your mind mid-run? The red <b>■ Stop</b> button aborts instantly and
                  clears the selection. Binned photos sit in Google's bin for 60 days, so nothing
                  is gone for good.
                </Text>
              </Step>
            </Stack>
          </Section>

          {/* How it works */}
          <Section title="How it works">
            <List spacing="sm" c="dimmed" listStyleType="disc">
              <List.Item>
                A content script injects the review UI into a <b>shadow root</b> on the Google
                Photos tab, so its styles stay isolated from (and don't disturb) Google's page.
              </List.Item>
              <List.Item>
                It reads the photo grid directly and scrolls it to load every result, then drives
                Google's <b>native multi-select</b> checkboxes and the built-in <b>Move to bin</b>{' '}
                action.
              </List.Item>
              <List.Item>
                All the Google-Photos-specific selectors live in one place, so if Google changes
                their markup it's a quick, single-spot fix — and a test suite guards the contract.
              </List.Item>
              <List.Item>
                Nothing leaves your browser, and nothing is deleted until you press{' '}
                <b>Move to bin</b>.
              </List.Item>
            </List>
          </Section>

          {/* ToS */}
          <Section title="Why it's not on the Chrome Web Store">
            <Text c="dimmed">
              Automating another site's interface almost certainly runs against Google's Terms of
              Service, and the Web Store wouldn't accept it. PhotoBroom is a personal tool: you run
              it on your own account, at your own discretion. Because Google's "Move to bin" is
              fully reversible for 60 days, the blast radius of a mistake is small — but treat it as
              the unofficial, use-at-your-own-risk helper that it is.
            </Text>
          </Section>

          <Divider color="dark.5" />
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Part of{' '}
              <Anchor href="https://jordanscamp.site" target="_blank" c="dimmed">
                jordanscamp.site
              </Anchor>
            </Text>
            <Anchor href={REPO} target="_blank" size="sm" c="dimmed">
              View source on GitHub
            </Anchor>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
