import Code from "../../components/blog/Code";
import LayerWalk from "../../components/blog/LayerWalk";
import LogoEquation from "../../components/blog/LogoEquation";
import { offsiteLinkProps } from "../../components/blog/offsiteLink";
import type { Post } from "../../types/post";

const DEVELOPERWAY_URL = "https://www.developerway.com/";
const JOSH_COMEAU_URL = "https://www.joshwcomeau.com/";

const COMPOUND_RECIPE = `const FooContext = createContext<FooCtx | null>(null);

function Root({ children }: RootProps) {
  return (
    <FooContext.Provider value={{ /* shared state */ }}>
      <div className={slots.root()}>{children}</div>
    </FooContext.Provider>
  );
}

function Header({ children }: { children: ReactNode }) {
  /* reads ctx */
}

function Body({ children }: { children: ReactNode }) {
  /* reads ctx */
}

export const Foo = Object.assign(Root, { Header, Body });`;

export const ourDesignersWriteTheUi: Post = {
  title: "How I got our designers writing production code",
  date: "2026-09-21",
  standfirst: "Creativity loves constraints, and it turns out so does Claude.",
  tags: ["react", "ai", "design-systems"],
  body: (
    <>
      <p>
        In the olden days, designers built flows in Figma. Every state would be there: the empty
        one, the error one, the one where the name is too long. Then it went into a ticket, and the
        ticket went into a queue, and a fortnight later an engineer built something that was{" "}
        <b>nearly</b> it. Priorities moved on before the polish did, so the polish was the first
        thing to go, then sometimes the flow itself.
      </p>
      <p>
        Everyone in that story was doing their job well. The design was good, the ticket was clear,
        the engineer was fast. But nobody was fully satisfied with the end result.
      </p>
      <p>
        At Lindus Health, we build software to run clinical trials. A fortnight spent perfecting
        keyboard navigation on a complex form is a fortnight not spent enabling a medical monitor to
        assess if an adverse event is related to the treatment or not.
      </p>
      <p>
        After two years of shipping the bare minimum, things started to hurt. Users stopped
        tolerating our inconsistencies. There were five different modals that could take weeks to
        consolidate. Some screens would break when the viewport halved, and fixing one would likely
        break another.
      </p>

      <h2>Hypothesis:</h2>
      <LogoEquation />
      <p>Our first experiment:</p>
      <blockquote>
        <p>"Claude, build a multiselect input component according to these designs."</p>
      </blockquote>
      <p>
        We even threw in some popular React skills from the community. If all the hype were true,
        that's the whole post, job done, engineers quietly updating their CVs.
      </p>

      <h2>So why didn't this work?</h2>
      <p>
        If you give a model complete freedom to implement a solution, it reaches for whatever's
        popular, not what's already idiomatic in your codebase. You can sprinkle your{" "}
        <code>CLAUDE.md</code> with "avoid overly long functions" and "minimise state", but real
        code runs on tribal knowledge and domain terms, not LeetCode affirmations.
      </p>
      <p>
        Remember: LLMs were trained on the full spectrum of code quality. And we all have our repos
        full of skeletons.
      </p>
      <p>
        Then it hit me: what if we were so strict about what we asked for, that Claude had no excuse
        to deviate? What if we had linters screaming if an import reached across layers? What if we
        took separation of concerns to a level that even Sonnet could do things right?
      </p>
      <h2>What did we actually want?</h2>
      <p>
        I sat down with everyone that could benefit from this idea. As always, the best solution
        came from the merging of many wonderful minds.
      </p>
      <p>
        Our designers told me they worked in layers - raw tokens, semantic tokens, primitives,
        components, patterns. I experimented with what I'd learned from incredible devs like{" "}
        <a href={DEVELOPERWAY_URL} {...offsiteLinkProps(DEVELOPERWAY_URL)}>
          developerway
        </a>{" "}
        and{" "}
        <a href={JOSH_COMEAU_URL} {...offsiteLinkProps(JOSH_COMEAU_URL)}>
          Josh Comeau
        </a>
        . And the end result?
      </p>
      <LayerWalk />
      <p>This project wasn't without its difficulties:</p>
      <ul>
        <li>
          <strong>The migration took some time</strong>. Though it did progress exponentially, with
          Claude translating the old to the new with ease.
        </li>
        <li>
          <strong>Standards required alignment</strong>. Convincing yourself a rule is useful is
          easier than convincing your entire team. This was a fantastic exercise in knowledge
          sharing as everyone's instincts became codified in skills.
        </li>
        <li>
          <strong>The ROI needed to be visible</strong>. The business value of a refactor is rarely
          obvious, so we needed to demonstrate positive outcomes quickly. We prioritised building
          the foundations so <strong>everyone</strong> could start building components. Feature work
          was accelerating - there was excitement!
        </li>
      </ul>
      <h2>Did it work?</h2>
      <p>Boy did it.</p>
      <p>
        Velocity and quality grew in tandem - an insane feat. Within weeks our designers completely
        owned the design system. They're able to build, polish, and maintain components, with a just
        a quick scan from engineers and automated review skills.
      </p>
      <p>
        Engineers could focus on modelling the data and the API, and stop worrying about which
        tailwind class they're meant to be using for a primary button on a table.
      </p>
      <p>
        We stopped having to worry about the tools, and put all our time and energy into the problem
        to solve. And isn't that what it's all about?
      </p>

      <h2>Why did this work?</h2>
      <ul>
        <li>
          <strong>Claude listens to linters.</strong> When claude would try to import across layers,
          use a <code>className</code> in application code, or use raw <code>px</code> to position
          something, a virtual slap on the wrist put it back in line.
        </li>
        <li>
          <strong>Visual regressions were localised and loud.</strong> Every component had a story
          for every state. Changing a token would highlight every altered interface, allowing
          designers and engineers to understand the extent of their change.
        </li>
        <li>
          <strong>The rubric ships in the skill file, not in someone's head.</strong> It loads with
          every prompt targeting the design system. It turns a judgement call into a deterministic
          lookup, and a lookup is the one thing a model never talks itself out of.
          <table>
            <caption>
              Applied in order, stopping at the first match. Five of the six answers are some form
              of "you already have what you need".
            </caption>
            <thead>
              <tr>
                <th scope="col">Situation</th>
                <th scope="col">Decision</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Content change inside a fixed layout</td>
                <td>
                  Slot (<code>children</code>)
                </td>
              </tr>
              <tr>
                <td>Visual variant within a closed, bounded set</td>
                <td>
                  Enumerated prop (<code>size</code>, <code>tone</code>)
                </td>
              </tr>
              <tr>
                <td>Caller needs named parts in a flexible arrangement</td>
                <td>
                  Compound subcomponent (<code>Foo.Header</code>)
                </td>
              </tr>
              <tr>
                <td>Different ARIA role, focus return, or semantic</td>
                <td>New component beside the existing one</td>
              </tr>
              <tr>
                <td>Three or more booleans controlling layout or behaviour</td>
                <td>Refactor to a discriminated union or compound</td>
              </tr>
              <tr>
                <td>Only one or two consumers want it</td>
                <td>
                  <strong>Wait.</strong> Rule of three before promotion
                </td>
              </tr>
            </tbody>
          </table>
        </li>
        <li>
          <strong>Every component is the same shape.</strong> Multi-part components are always a
          root that holds the context and named subparts that read it, exported with{" "}
          <code>Object.assign</code>. One shape means a review is a diff against a pattern rather
          than a fresh argument, and a component whose content changes later grows a subpart instead
          of another boolean.
          <Code code={COMPOUND_RECIPE} />
        </li>
      </ul>
      <h2>The guardrails were the feature</h2>
      <p>
        I ran a workshop with a suite of non-technical users to truly stress test this new way of
        working. You never know what a real user is going to do, so I held my breath. Someone wanted
        to build a new dashboard, another wanted to add a filter menu to our tables. Complex
        problems with so many variables.
      </p>
      <p>But the feedback says it all:</p>
      <blockquote>
        <p>
          [we were] able to contribute to the code base directly, empowering us to make small fixes,
          whilst ensuring guardrails are in place so we don't do anything silly.
        </p>
      </blockquote>
      <p>
        These brilliant minds were no longer constrained by engineering capacity. They still didn't
        know their <code>var</code>'s from their <code>const</code>'s, but they didn't need to.
      </p>
      <p>If you teach a man to fish etc. etc.</p>

      <p>
        Today a designer handed me the finished screen instead of a ticket. The pressure's on to
        make my code as good as theirs.
      </p>
    </>
  ),
};
