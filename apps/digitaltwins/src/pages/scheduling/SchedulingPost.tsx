import { Box, Text, Title } from '@mantine/core';
import { ScrollyLayout } from '../../components/ScrollyLayout';
import { ScrollySection } from '../../components/ScrollySection';
import { SchedulingSimulation } from './SchedulingSimulation';

const INK = '#2c3e6b';
const INK_LIGHT = '#5a7299';

export function SchedulingPost() {
  return (
    <ScrollyLayout
      renderTitle={() => (
        <Box ta="center" py="sm" className="notebook-text">
          <Text fw={700} style={{ fontSize: 34, color: INK, fontFamily: "'Caveat', cursive" }}>
            Task Scheduling
          </Text>
          <Text style={{ fontSize: 15, color: INK_LIGHT, fontFamily: "'Caveat', cursive" }}>
            How do you decide what to do next?
          </Text>
        </Box>
      )}
      renderVisualization={(activeStep) => (
        <SchedulingSimulation activeStep={activeStep} />
      )}
    >
      {(activeStep) => (
        <>
          <ScrollySection index={0} active={activeStep === 0}>
            <Title order={2} mb="sm" style={{ color: INK }}>
              You have a pile of tasks...
            </Title>
            <Text style={{ color: INK_LIGHT }} size="lg">
              Every day, tasks arrive from different parts of your life. Work.
              Personal errands. Health. Admin. They pile up in separate queues,
              each with their own priorities.
            </Text>
          </ScrollySection>

          <ScrollySection index={1} active={activeStep === 1}>
            <Title order={3} mb="sm" style={{ color: INK }}>
              Two machines, two decisions
            </Title>
            <Text style={{ color: INK_LIGHT }} size="lg">
              Every scheduling system has two parts. The <b>Selector</b> picks
              which queue to pull from next. The <b>Executor</b> decides how long
              you spend on that task before moving on.
            </Text>
          </ScrollySection>

          <ScrollySection index={2} active={activeStep === 2}>
            <Title order={3} mb="sm" style={{ color: INK }}>
              Run to completion
            </Title>
            <Text style={{ color: INK_LIGHT }} size="lg">
              The simplest executor: start a task, finish it, move on. No context
              switching. But what if a 2-hour task blocks everything else?
            </Text>
          </ScrollySection>

          <ScrollySection index={3} active={activeStep === 3}>
            <Title order={3} mb="sm" style={{ color: INK }}>
              Time-boxing
            </Title>
            <Text style={{ color: INK_LIGHT }} size="lg">
              Give each task a fixed time slice. When the timer rings, put it back
              and grab the next one. Fair, but nothing finishes quickly.
            </Text>
          </ScrollySection>

          <ScrollySection index={4} active={activeStep === 4}>
            <Title order={3} mb="sm" style={{ color: INK }}>
              Then your phone buzzes...
            </Title>
            <Text style={{ color: INK_LIGHT }} size="lg">
              Preemptive scheduling: a high-priority task arrives and immediately
              interrupts whatever you&apos;re doing. Great for emergencies. Terrible
              for focus.
            </Text>
          </ScrollySection>

          <ScrollySection index={5} active={activeStep === 5}>
            <Title order={3} mb="sm" style={{ color: INK }}>
              Racing the clock
            </Title>
            <Text style={{ color: INK_LIGHT }} size="lg">
              Deadline-driven: always work on whatever&apos;s due soonest. But some
              tasks have hard deadlines, some soft, and some have no deadline at
              all...
            </Text>
          </ScrollySection>

          <ScrollySection index={6} active={activeStep === 6}>
            <Title order={3} mb="sm" style={{ color: INK }}>
              Your turn
            </Title>
            <Text style={{ color: INK_LIGHT }} size="lg">
              Now you control both machines. Pick a selector strategy, an executor
              policy, crank up the interruption rate — and see what happens to your
              day.
            </Text>
          </ScrollySection>
        </>
      )}
    </ScrollyLayout>
  );
}
