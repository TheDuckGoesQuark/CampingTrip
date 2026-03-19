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
      {/* 0 — Intro */}
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

      {/* 1 — The tension */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          You can&apos;t do everything
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          You only have so much time. You want to make sure urgent matters are
          taken care of, but if you always put off the less pressing things,
          they&apos;ll never get done no matter how valuable they might be long
          term. If you prioritise work over health, you might get a promotion
          but you&apos;ll start to feel terrible. If you focus a little too much
          on your peace, you&apos;ll get fined for not paying your taxes.
        </Text>
      </ScrollySection>

      {/* 2 — Introduce the selector */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Choosing what&apos;s next
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          There&apos;s two parts to this. First, you have to select from all
          your TODO lists which thing to tackle first. Assuming you already have
          a sense of what&apos;s high priority from those areas, you look at the
          next thing in each list. Which one do you select?
        </Text>
      </ScrollySection>

      {/* 3 — Round Robin */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Round Robin
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          You could pick one thing from work first, then one thing from your
          life admin list next, one thing for your personal growth next, and go
          round in circles so that everything makes a little bit of progress
          every day. That&apos;s the round robin approach.
        </Text>
      </ScrollySection>

      {/* 4 — Priority */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Priority
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          You could shortlist the highest priority from every list at this time
          and pit them against each other. You have an urgent report from work
          due tomorrow, but you haven&apos;t been to the gym in a while.
          What&apos;s more important to you? Pick that one.
        </Text>
      </ScrollySection>

      {/* 5 — Introduce the executor */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          How long do you give it?
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          There&apos;s only so much time in the day, so how long should you give
          to each task you pick up? Some tasks are bigger than others, no matter
          how good your estimations might be. So how do we tackle this
          variation?
        </Text>
      </ScrollySection>

      {/* 6 — Run to finish */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Run to completion
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          You can pick something up, and keep going until it&apos;s done. Large
          tasks will cause your todo lists to accumulate, but you&apos;re
          guaranteed to get that big project done. Phew. But then you come back
          to your todo list and it&apos;s <i>grown</i>.
        </Text>
      </ScrollySection>

      {/* 7 — Time-boxed */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Time-boxing
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          So you protect yourself next time. &ldquo;I&apos;ll spend two hours on
          this, and move on.&rdquo; If the job isn&apos;t done, you put it back
          half complete. You&apos;ll get to it next time. Return to your
          selector and see what to move on to. Every list gets a chance to make
          progress, but momentum is lost, context switching has a cost.
        </Text>
      </ScrollySection>

      {/* 8 — Interruptions */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Interruptions
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          You&apos;re in the middle of writing the next chapter of your book,
          and your phone rings. Your friend is in a crisis, they need your help.
          You can&apos;t tell them &ldquo;wait until your slot in my
          schedule&rdquo;. So you close your laptop and coach them through it.
        </Text>
      </ScrollySection>

      {/* 9 — Back to it */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Back to it
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          Breakup avoided. They won&apos;t be packing up and running away to
          New Zealand after all. Well done. So you run your selector, and pick
          up what you were doing again. Repeat ad nauseum. But always with a
          nagging feeling that you could be handling things better.
        </Text>
      </ScrollySection>

      {/* 10 — Optimise Everything */}
      <ScrollySection>
        <Title order={3} mb="sm" style={{ color: INK }}>
          Optimise Everything
        </Title>
        <Text style={{ color: INK_LIGHT }} size="lg">
          Your energy day to day fluctuates. Life is full of surprises.
          Sometimes you can do it all in a day, sometimes you can barely brush
          your teeth. So what is the best approach to keeping on top of things?
          Or is a combination needed? Today&apos;s digital twin &mdash; both of
          these approaches, simulated.
        </Text>
      </ScrollySection>
      {/* 11 — Simulator takeover (last child = full-viewport card) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f5f0e4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Title order={2} ta="center" style={{ color: INK, fontFamily: "'Caveat', cursive", fontSize: 34 }}>
          Try it yourself
        </Title>
      </div>
    </ScrollyLayout>
  );
}
