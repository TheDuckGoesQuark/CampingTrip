import ClickCascade from "../../components/blog/formEngine/ClickCascade";
import ConcernedCat from "../../components/blog/formEngine/ConcernedCat";
import FiveArchitectures from "../../components/blog/formEngine/FiveArchitectures";
import { Footnote, FootnoteMark } from "../../components/blog/formEngine/Footnote";
import {
  graphCategories,
  graphMetrics,
  libraryCategories,
  libraryMetrics,
} from "../../components/blog/formEngine/formEngineResults";
import FormLayers from "../../components/blog/formEngine/FormLayers";
import { ResultsTable } from "../../components/blog/formEngine/ResultsChart";
import { Island } from "../../components/blog/Island";
import type { Post } from "../../types/post";

const loadChart = () => import("../../components/blog/formEngine/ResultsChart");
const loadDemo = () => import("../../components/blog/formEngine/FormSpeedDemo");
const loadBudget = () => import("../../components/blog/formEngine/RenderBudget");

const libraries = {
  title: "Round 1.xls",
  categories: libraryCategories,
  metrics: libraryMetrics,
};

const graph = {
  title: "Bonus round.xls",
  categories: graphCategories,
  metrics: graphMetrics,
};

export const ourFormsWereTooSlow: Post = {
  title: "Our forms were too slow, so we built five",
  date: "2026-10-20",
  standfirst: "It used to take two minutes to submit. Now it's so fast we had to slow it down.",
  tags: ["ai", "code", "react"],
  body: (
    <>
      <p>
        A participant in a clinical trial sits down to fill in a questionnaire about their PTSD
        symptoms. It's 309 questions long, and it is not a fun one to answer. They get to the end,
        press submit, and watch a spinner for two minutes. Then it says there was a network error.
      </p>

      <h2>Eighteen months of the same complaint</h2>
      <p>
        That wasn't one bad week. I work at a company that builds software for clinical trials, and
        for a year and a half the reports kept coming in from everyone who touched our biggest
        forms. A demographics form pinned the CPU at 100% while someone typed. Case report forms
        lagged in the dashboard. The PTSD assessment became unusable once a response existed, and
        then it couldn't be submitted at all. Computed scores showed up blank until you navigated
        away and back.
      </p>
      <ConcernedCat />
      <p>
        The PTSD assessment is what we call in the industry a "validated instrument". A.k.a. big
        scary strict form. What we'd built could barely calculate an age from a date of birth, and
        this form had 64 computed scores, 26 visibility rules, and several tiers of validation
        running on every single input.
      </p>
      <ClickCascade />

      <h2>What was actually going wrong</h2>
      <p>
        Our forms ran on react-hook-form, which keeps every field in one form-wide store. Most
        clinical forms are built from repeating groups (medications and existing conditions, for a
        start), so we read the library's source to see what a group does. Adding or removing a row
        broadcasts a deep clone of every value in the form, and if anything is watching, the whole
        form state goes out to every subscriber.
      </p>
      <p>
        Conditional questions made it worse. Every change ran one form-wide watcher that re-checked
        every question's visibility rule, then reset the list at the root, so the whole list
        re-rendered. Hidden questions never really left: they stayed mounted, tucked away with{" "}
        <code>display: none</code>, and hiding one wiped its value, which set off another round of
        renders.
      </p>
      <p>
        But the call was also coming from inside the house. Features had been bolted on for years
        that we swore we'd come back to polish, but had instead swept under the rug.{" "}
        <code>EditableQuestion</code>, a god component turned Cthulhu, was 1,164 lines: label, help
        text, input, errors, warnings, dialogs, permissions and edit checks, with five{" "}
        <code>useEffect</code>s of its own on top of whatever the form was doing. Nothing in the
        questionnaire was memoised, and nothing could usefully be, because every row subscribed to
        everything. One click on "symptom present" ripples into a severity score, then a cluster
        total, then a diagnosis. On that form, a single click re-rendered <strong>280</strong>{" "}
        components.
      </p>
      <p>
        So why not optimise what we had? Because this creature's tentacles interleaved a cursed
        core: the library's state model wasn't compatible with our constantly shapeshifting forms,
        and a 1,164-line component has no seam to cut along. Fixing one meant fixing both.
      </p>

      <h2>Settling it with an experiment</h2>
      <p>
        We were about to rebuild the platform from scratch, which is a once-in-a-product chance to
        pick the form layer on evidence rather than habit. The honest answer to "which form library
        should we use?" is usually whichever one the loudest person in the room already knows. I
        didn't want to win that argument. <b>I wanted to not have it.</b>
        <FootnoteMark />
      </p>
      <Footnote>Don't tell my therapist, I'll work on my conflict avoidance another time.</Footnote>
      <p>
        So I built the same form again. Three times, to start with. The real questionnaire went into
        a sandbox, adapted into one schema, and rendered through identical components on top of
        three interchangeable state layers:
      </p>
      <ul>
        <li>
          <strong>react-hook-form</strong>, what we already ran.
        </li>
        <li>
          <strong>TanStack Form</strong>, a store where each field selects its own slice.
        </li>
        <li>
          <strong>Jotai</strong>, an atom per field and derived atoms for everything else.
        </li>
      </ul>
      <FiveArchitectures backends={["react-hook-form", "TanStack Form", "Jotai"]} />
      <p>
        The DOM was identical in every version, so any difference could be blamed on the
        architecture and nothing else. Scientific method: reduce your variables. Playwright drove a
        production build in a fresh browser for each run, measuring how long the form took to open,
        how long it took to hide a section, how long each keystroke took to paint, and how many
        components woke up per click. Then I did it all again at twice and four times the size,
        because how each one coped as forms grew would tell us if we'd be having this same crisis in
        a couple of years' time.
      </p>
      <p>
        Building it so the state layer could be swapped out forced a separation of concerns we'd
        never had. It's my favourite kind of abstraction.
      </p>
      <FormLayers />
      <p>
        The separation of concerns also made memoisation powerful again. <code>memo</code> only
        helps when a component's inputs stop changing, and in the old form every row's inputs
        changed on every keystroke. Now each part reads one key, so a change elsewhere leaves it
        alone. These days React Compiler does the memoising for us, but no compiler could have
        helped a component that subscribed to the whole form.
      </p>
      <p>
        Six months ago, if I'd proposed a technical spike that involved several full implementations
        of a 309-question clinical form using different architectures (most of which we'd be
        binning), I think I might have had some employment difficulties.{" "}
        <strong>This took two hours</strong>, that Claude wrote whilst I worked on something with a
        deadline. My job was deciding what to measure, and reading the results with a healthy dose
        of suspicion. When prototypes are this cheap, why shouldn't you try out something new? You
        might be happily surprised, and that's when the innovation happens.
      </p>

      <h2>What the numbers said</h2>
      <Island load={loadChart} props={libraries} fallback={<ResultsTable {...libraries} />} />
      <p>
        No variant was perfect. TanStack Form re-rendered the least, but its types are built for
        forms whose shape you know at compile time, and a data-driven clinical form isn't one.
        Jotai's model was the most elegant of the lot, and its typing latency fell off a cliff as
        the form grew. react-hook-form went from 612 ms to open at our real size to 29 seconds at
        four times it. Fine on a flat form, but it grows super-linearly.
      </p>

      <h2>Bonus round: roll-your-own TanStack</h2>
      <p>
        At this point I'd got a bit too excited about the problem. While I was writing up the
        proposal, the benchmarks were pointing at the next thing slowing us down: every rule in the
        form being re-checked on every change, whatever it actually read. So I started seeing if we
        could do even more, and built two more variants.
      </p>
      <p>
        Both keep TanStack Form, but only for the answers. Everything derived from them (what's
        visible, what's required, what's in error, every computed score) moves out of the library
        into a small store of our own, where the rules are plain functions and components read the
        results through <code>useSyncExternalStore</code>. Because the rules are pure, the server
        can run exactly the same ones when the form is submitted.
      </p>
      <p>
        The difference between the two is one thing: a dependency graph. Each rule declares which
        fields it reads, so when the form opens we can build an index of which rules depend on which
        field. A change recomputes only those, in order, and everything else keeps its identity, so
        nothing reading it re-renders. The other variant is the control: the same store with the
        graph switched off, re-checking the whole form on every change. One difference, nothing
        else.
      </p>
      <p>
        They opened just as fast as each other. Then the control re-rendered 350 times as much on
        every click: 4,944 against 14, which is every question in the form, twice. The graph stays.
      </p>
      <Island load={loadChart} props={graph} fallback={<ResultsTable {...graph} />} />

      <h2>Taking the team with me</h2>
      <p>
        I skipped joyfully back to the team with my research in hand: what was going wrong, why, the
        data from every variant, and a proposal. Declare dependencies, recompute only what changed,
        and run one pure evaluator on both the client and the server. Every experiment could be
        re-run with a simple command, and the results were reproducible anywhere that could run
        JavaScript. A live demo let people flip between variants with a render counter on screen.
        It's hard to argue with a counter.
      </p>
      <p>
        Then another engineer on the team made a point that took production one better than my
        recommendation: in a world as heavily regulated as ours, we need to be able to validate the
        form's behaviour exhaustively. No form library guarantees that. So we landed on a plain
        reducer and no library at all, where we define every state transition ourselves. Defining
        them meant every rule we care about could be written as an invariant and checked against
        random sequences of events. It also meant the logic that runs on every keystroke validates
        the submission on the server, so the two can't drift. The benchmark's job was never to pick
        a dependency. It was to find the principles, and those carried straight over.
      </p>

      <h2>How it's looking</h2>
      <Island
        load={loadDemo}
        fallback={
          <p>
            <em>
              There's a side-by-side demo here of the same form filled in before and after. It only
              runs with JavaScript on.
            </em>
          </p>
        }
      />
      <p>
        In production, the team's own measurements tell the rest. Every edit used to re-check the
        form's entire rule set, 901 times over. Now an edit checks only the rules that read the
        field that changed, and the whole set gets scanned twice. A keystroke went from 104 ms to 16
        ms. I've never been so excited about a dependency graph before.
      </p>
      <p>
        Fast doesn't stay fast on its own, though. It decays one innocent PR at a time. So I added a
        CI check for profiling renders, with a hard ceiling on the number of renders and the wall
        clock time to paint, that keeps us performant even if our CI - or our users - run on a
        Raspberry Pi.
      </p>
      <Island
        load={loadBudget}
        fallback={
          <p>
            <em>
              There's an animation here of render time creeping up PR by PR until it crosses the
              budget line and the check fails. It only runs with JavaScript on.
            </em>
          </p>
        }
      />

      <h2>Is there such a thing as too fast?</h2>
      <p>
        We thought we'd nailed it. Our forms were so fast, surely everyone would be happy? But for a
        second we'd lost sight of the person pressing the button:{" "}
        <strong>submitting was now so quick that people thought it hadn't worked.</strong>
      </p>
      <p>
        We've all been conditioned to read a loading spinner as work being done, and anything faster
        as glitchy software. So for the first time in my career, adding a <code>sleep(1000)</code>{" "}
        was genuinely the right move. That hardcoded buffer is our performance crumple zone, and my
        job security for the next year.
      </p>
      <p>
        <em>
          (UPDATE: we actually just added a toast on submit as feedback instead of artificially
          slowing down the user. But I thought the sleep was too funny not to share.)
        </em>
      </p>
    </>
  ),
};
