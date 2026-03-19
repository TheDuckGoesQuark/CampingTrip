import { Text, Title } from '@mantine/core';
import { ScrollyLayout } from '../../components/ScrollyLayout';
import { ScrollySection } from '../../components/ScrollySection';
import { SchedulingSimulation } from './SchedulingSimulation';

const INK = '#2c3e6b';
const INK_LIGHT = '#5a7299';

export function SchedulingPost() {
  return (
    <ScrollyLayout
      title="Task Scheduling"
      subtitle="How do you decide what to do next?"
      visualization={(progress) => <SchedulingSimulation scrollProgress={progress} />}
    >
      <ScrollySection>
        <Title order={2} mb="sm" style={{ color: INK }}>
          You have a pile of tasks...
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          Every day, tasks arrive from different parts of your life. Work.
          Personal errands. Health. Admin. They pile up in separate queues, each
          with their own priorities.
        </Text>
      </ScrollySection>

      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Two machines, two decisions
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          Every scheduling system has two parts. The <b>Selector</b> picks which
          queue to pull from next. The <b>Executor</b> decides how long you
          spend on that task before moving on.
        </Text>
      </ScrollySection>

    </ScrollyLayout>
  );
}
