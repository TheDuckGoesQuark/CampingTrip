import { Island } from "../../components/blog/Island";
import type { Post } from "../../types/post";

export const whatVibeCodingChanged: Post = {
  title: "What vibe coding actually changed",
  date: "2026-09-25",
  standfirst: "I expected to miss trawling the docs. Reader, I do not.",
  tags: ["code", "making"],
  body: (
    <>
      <p>
        The thing nobody warned me about is how much of my after-hours energy went on friction. Not
        the idea (the idea was always cheap, I have dozens) but the forty minutes between having it
        and being allowed to try it. Which version of the library. Which config key moved. Which
        build step needs a flag it didn't need last year. Forty minutes of negotiating with
        machines, before I could even see a sapling of my idea.
      </p>
      <p>
        That changed very suddenly. The gap between “what if the laptop in the tent had a working
        browser” and clicking around a whole pretend operating system collapsed to about an evening.
        And an idea you can test in an evening is a completely different kind of idea to one you can
        test in a fortnight. You'll try the stupid ones.
      </p>
      <h2>The stupid ones are the point</h2>
      <p>
        Most of what I like about this site came from a thought I would never have paid a fortnight
        for. A cat strolling past in the background. A bin with incriminating things in it. A
        convincing facade of a 1990s email client. None of them is a good idea by any measure I'd
        defend in a design review. All of them are the reason anyone stays longer than nine seconds.
      </p>
      <p>Here is one: An innocuous button.</p>
      <Island
        load={() => import("../../components/interactive/UselessMachine")}
        fallback={
          <p>
            <em>
              There's a switch here, and a cat who turns it back off. It only works in the tent.
            </em>
          </p>
        }
      />
      <p>
        Drawing it, the peeking, the claws when you push your luck: none of it does anything, and
        it's still rough at the edges. It is also the only part of this page built for the person
        reading it rather than the machine serving it.
      </p>
      <h2>Where the hours went</h2>
      <p>
        Everything around us pushes for the minimum viable product, and when the constraint is real,
        fair enough. But it is worth asking which constraint. When device memory was measured in
        megabytes, game developers still hid easter eggs. The egg cost a few bytes and an afternoon,
        and they had the afternoon. Somewhere since, the afternoon became the thing nobody had, and
        a joke now costs exactly that. That is where the humanity went. Not because anyone stopped
        caring, but because caring was billed by the hour.
      </p>
      <p>
        One of the engineers on my team had some tokens left over at the end of the week, and spent
        them on holiday theming for our login page. A year ago that isn't a request anyone would
        have made, and nobody would have blamed the PM for saying no. This time it went in between
        two real tickets, and nobody had to ask. That little animated Christmas tree won't help
        anyone monitor patients any quicker. But it might put a smile on a doctor's face after a
        long day, and the smile says something no feature can: we know there is a person on the
        other end of this.
      </p>
      <p>
        So that is what I'd tell anyone who hasn't tried it yet. The forty minutes didn't disappear.
        They came back to you, and you get to choose what they are for. Spend them on the stupid
        one. AI might actually put the humanity <strong>back</strong> into software that way.
      </p>
    </>
  ),
};
