import { ScrollyLayout } from '../../components/ScrollyLayout';
import { SchedulingSimulation } from './SchedulingSimulation';

export function SchedulingPost() {
  return (
    <ScrollyLayout
      title="Task Scheduling"
      subtitle="How do you decide what to do next?"
    >
      <SchedulingSimulation />
    </ScrollyLayout>
  );
}
