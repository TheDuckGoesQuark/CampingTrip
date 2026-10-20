import type { Post } from "../../types/post";

export const ourFormsWereTooSlow: Post = {
  title: "Our forms were too slow, so we built five",
  date: "2026-10-20",
  standfirst: "It used to take two minutes to submit. Now it's so fast we had to slow it down.",
  tags: ["ai", "code", "react"],
  draft: true,
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
      <p>
        The PTSD assessment is a validated instrument, and that matters. It has 64 computed scores
        and 26 visibility rules, and validation means every conditional question has to render. Skip
        logic is the usual way a big form hides its cost, and we weren't allowed to use it.
      </p>
      <p>
        So what was actually happening? Our forms ran on react-hook-form, where every field
        registers into one form-wide store. One click on "symptom present" ripples into a severity
        score, then a cluster total, then a diagnosis. On that form, a single click re-rendered{" "}
        <strong>280</strong> components.
      </p>

      <h2>Blame the library, or blame us?</h2>
      <p>
        We were about to rebuild the platform from scratch, which is a once-in-a-product chance to
        pick the form layer on evidence rather than habit. The honest answer to "which form library
        should we use?" is usually whichever one the loudest person in the room already knows. I
        didn't want to win that argument. I wanted to not have it.
      </p>
      <p>
        So I built the same form five times. The real questionnaire went into a sandbox, adapted
        into one schema, and rendered through identical components on top of five interchangeable
        state layers:
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
        <li>
          <strong>A shared evaluator</strong>, where every rule declares what it reads, and a
          dependency graph recomputes only what a change affects.
        </li>
        <li>
          <strong>The same evaluator without the graph</strong>, re-running the whole form on every
          change. This one was never a candidate. It's the control: the winner's exact code with one
          piece taken out.
        </li>
      </ul>
      <p>
        The DOM was identical in every version, so any difference could be blamed on the
        architecture and nothing else. Scientific method: reduce your variables. Playwright drove a
        production build in a fresh browser for each run, measuring how long the form took to open,
        how many components re-rendered per click, and how long each keystroke took to paint. Then I
        did it all again at twice and four times the size, because how each one coped as forms grew
        would tell us if we'd be having this same crisis in a couple of years' time.
      </p>
      <p>
        Five full implementations of a 309-question clinical form used to be more than anyone would
        sign off on, knowing four of them were headed for the bin. This took two hours, with Claude
        writing most of the code. My job was deciding what to measure, and reading the results with
        a healthy dose of suspicion. When prototypes are this cheap, you can afford to build the
        ones you expect to lose, and that's where the evidence comes from.
      </p>

      <h2>What the numbers said</h2>
      <table>
        <caption>The same questionnaire at four times its size: 1,236 questions.</caption>
        <thead>
          <tr>
            <th scope="col">State layer</th>
            <th scope="col">Time to open</th>
            <th scope="col">Re-renders per click</th>
            <th scope="col">Per keystroke</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">react-hook-form</th>
            <td>29.2 s</td>
            <td>859</td>
            <td>84.8 ms</td>
          </tr>
          <tr>
            <th scope="row">TanStack Form</th>
            <td>1.25 s</td>
            <td>5</td>
            <td>9.1 ms</td>
          </tr>
          <tr>
            <th scope="row">Jotai</th>
            <td>469 ms</td>
            <td>1,041</td>
            <td>75.9 ms</td>
          </tr>
          <tr>
            <th scope="row">Shared evaluator</th>
            <td>253 ms</td>
            <td>14</td>
            <td>6.2 ms</td>
          </tr>
          <tr>
            <th scope="row">Shared evaluator, no graph</th>
            <td>257 ms</td>
            <td>4,944</td>
            <td>19.6 ms</td>
          </tr>
        </tbody>
      </table>
      <p>
        No variant won every column. TanStack Form re-rendered the least, but its types are built
        for forms whose shape you know at compile time, and a data-driven clinical form isn't one.
        Jotai's model was the most elegant of the lot, and its typing latency fell off a cliff as
        the form grew. react-hook-form went from 612 ms to open at our real size to 29 seconds at
        four times it. Fine on a flat form, but grows super-linearly.
      </p>
      <p>
        We read react-hook-form's source to be sure it wasn't our fault. Adding or removing a row in
        a repeating group broadcasts a deep clone of every value in the form, and if anything is
        watching, the whole form state goes out to every subscriber. That's the library's state
        model, and most clinical forms are made of repeating groups: medications and adverse events,
        for a start.
      </p>
      <p>
        The last row is the control. It runs exactly the same code as the shared evaluator with the
        dependency graph switched off, so the gap between those two rows is what the graph buys. It
        opened just as fast, then re-rendered 350 times as much on every click. That settled whether
        the graph was worth building.
      </p>

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
      <p>
        In production, the team's own measurements tell the rest. Every edit used to re-check the
        form's entire rule set, 901 times over. Now an edit checks only the rules that read the
        field that changed, and the whole set gets scanned twice. A keystroke went from 104 ms to 16
        ms. That's the dependency graph, landing for real. Later fixes brought a keystroke that used
        to freeze the browser for most of a second down to about 4 ms.
      </p>
      <p>
        Fast doesn't stay fast on its own, though. It decays one innocent PR at a time. So I built a
        render profiler that runs the whole end-to-end suite on every PR and fails the build when a
        render blows its budget. Render counts are deterministic, so they're gated tightly. CI
        milliseconds don't transfer between machines, so durations get a generous ceiling. Revert
        the performance work today and the check goes red:{" "}
        <code>slowest render 930.6ms exceeds budget 255.5ms</code>.
      </p>
      <p>
        We thought we'd nailed it. Our forms were so fast, surely everyone would be happy? But for a
        second we'd lost sight of the person pressing the button: submitting was now so quick that
        people thought it hadn't worked. We've all been conditioned to read a loading spinner as
        work being done, and anything faster as glitchy software. So for the first time in my
        career, adding a <code>wait()</code> was genuinely the right move. And if submission time
        ever starts crawling back up, that hardcoded buffer is there to absorb it.
      </p>
    </>
  ),
};
