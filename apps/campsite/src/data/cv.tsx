import { Link } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { yearsSince } from "../components/blog/formatDate";
import RoleAnchorLink from "../components/blog/RoleAnchorLink";
import { blogPaths } from "../routing/blogPaths";
import type { Commendation, Cv, CvProject, Role } from "../types/cv";
import { slugify } from "./slug";

const roles: Role[] = [
  {
    org: "Lindus Health",
    url: "https://www.lindushealth.com",
    logo: "images/projects/lindus-health.webp",
    title: "Senior Software Engineer",
    start: "2024-01-01",
    summary:
      "Clinical trials software: the platform doctors, clinic staff, statisticians and participants run a study on, where a defect reaches patients and regulators.",
    achievements: [
      {
        name: "AI-native workflows",
        outcome:
          "PMs prototype in the live application and iterate in minutes rather than days, so engineering stopped being the bottleneck on exploring an idea.",
        feature:
          "The workflows the company now works in, including the component rubric that makes LLM-written UI predictable.",
        difficulty:
          "An LLM writing UI invents its own structure unless the rules it should follow are written down.",
        approach: "Designed them and rolled them out across the company.",
      },
      {
        name: "The Fire Team",
        outcome:
          "Roughly 85 production escalations answered across more than 25 sponsor studies, with the team\u2019s own workload shrinking as the causes went away.",
        difficulty: "Urgent work crowds out the fixes that would stop it recurring.",
        approach:
          "Founded and led it \u2014 nine people across engineering and deployment, working alongside study teams rather than behind a ticket queue \u2014 and deliberately interleaved permanent fixes with the urgent ones.",
      },
      {
        name: "Serious medical event reporting",
        outcome:
          "Doctors and clinic staff report serious events inside the deadlines regulators set, and I have owned drug safety on the platform for the two years since.",
        feature:
          "The reporting workflow, and AI-assisted coding against MedDRA, the dictionary regulators require those events to be classified in.",
        difficulty:
          "Every state the workflow can reach had to be defined and tested exhaustively, because an edit can land at any point and has to propagate from there. That took sustained work with the clinical domain experts.",
        approach:
          "Flow-charted every transition we should expect, then built it so the types carry those states \u2014 a later edit cannot be made without answering for the flows already there.",
      },
      {
        name: "The design system",
        outcome:
          "Designers make and review their own code changes without engineering, which removed weeks from each project and freed engineers for state, performance and correctness.",
        feature:
          "Semantic tokens, a primitive layer over Base UI, variant-driven components and Storybook documentation.",
        difficulty: "Application code will invent its own visual chrome unless something stops it.",
        approach:
          "Grew it across two generations of the platform, folding in each capability once it had earned its place, with linting and dependency rules holding the boundary.",
      },
      {
        name: "Form-level monitoring",
        outcome:
          "Cut the monitors\u2019 workload, and sponsors now ask for it by name when choosing us for a trial.",
        feature:
          "Decides which recorded answers a person must check against the original clinical record, and holds the trail of who checked what and when.",
        difficulty:
          "It had to reach a study that was already running, where a data migration is a risk nobody wants to take.",
        approach:
          "Built the plans as rules on the study-rule engine we already had rather than a second engine beside it, and made risk-based sampling select deterministically with no stored state.",
      },
      {
        name: "The form engine",
        outcome:
          "The slowest operation on a large form went from seconds to milliseconds, and submitting one went from minutes to seconds, with nothing it could previously do removed.",
        feature:
          "The platform\u2019s most complex and most used feature: what every questionnaire and clinical form is built from.",
        difficulty: "No off-the-shelf form library could carry what a trial form has to do.",
        approach:
          "Research and measurement rather than instinct, then changing where state lives and what has to re-render.",
      },
      {
        name: "E-signatures",
        outcome:
          "A doctor\u2019s sign-off on a participant\u2019s record stands up to inspection on its own.",
        feature:
          "Four properties holding at once: authentication, non-repudiation, an unbreakable link to the signed content, and a timestamp carrying date, time and time zone.",
        difficulty:
          "A signature has to break visibly the moment the data under it changes, and a stored flag would make every future write path responsible for that.",
        approach:
          "Designed the schema, domain logic and public API end to end. Signatures are append-only, and validity is recomputed on every read from the data covered.",
      },
      {
        name: "Correcting participant-reported data",
        outcome:
          "Recovered most of two hours a day of support-team time, and moved the audit trail into the platform.",
        feature:
          "A request-and-approval flow for changing data a participant submitted, recording the reason and the approver against the change.",
        difficulty:
          "Less the engineering than everything around it: the regulatory case, the rollout and the comms, and winning development time for a problem I had raised alongside other work. Clinicians are trained to scrutinise, and a tool that edits their data has to earn its way past that.",
        approach:
          "Wrote the proposal, designed the approval step as one engine other trial workflows could plug into, and phased it so two days of work removed a third of the overhead before any migration.",
      },
      {
        name: "Participant diaries",
        outcome:
          "Fewer support issues out of a running study, and clinic staff can keep participants on the study\u2019s plan with their data arriving when it should.",
        feature: "The schedule of questionnaires each participant works through over a trial.",
        difficulty: "[DRAFT \u2014 what made this hard.]",
        approach: "[DRAFT \u2014 how you went about it.]",
      },
      {
        name: "Study data for analysis",
        outcome:
          "Statisticians and data teams went from waiting on an engineer to assemble each dataset by hand to analysing a study in near-real time, so problems surface while there is still time to act on them.",
        feature: "An automated, standardised dataset derived from the platform\u2019s own data.",
        difficulty:
          "Agreeing the standard itself, and handling studies whose schedule changes version by version underneath it.",
        approach:
          "Built on the industry's existing data standards rather than inventing one, with our own additions where they fell short, and made every recorded value addressable so a dataset is derived rather than assembled.",
      },
      {
        name: "Visual review in CI",
        outcome: "Releases stopped finishing in a scramble of missed visual states.",
        feature:
          "A component change surfaces everything it alters across the application, and a designer approves it before it reaches main.",
        difficulty:
          "Visual QA was a treadmill where each fix broke an earlier one, and nobody saw it until release.",
        approach:
          "Diagnosed it as a feedback problem rather than a care problem, and moved the feedback in front of the merge.",
      },
    ],
    highlights: [
      "Taught modern React back to the engineers as a run of interactive workshops.",
      "Founded the Lindus running club, whose social runs raise money for charity and are among the best-attended events of the year.",
    ],
  },
  {
    org: "Gravity Sketch",
    url: "https://www.gravitysketch.com",
    logo: "images/projects/gravity-sketch.webp",
    title: "Full Stack Software Engineer",
    start: "2021-01-01",
    end: "2023-10-01",
    summary:
      "Collaborative 3D design software for VR and desktop, used by enterprise design teams.",
    highlights: [
      "Led a multi-discipline product team from ideation to delivery of a set of enterprise features the largest customers depended on.",
      "Worked directly with high-profile customers to integrate the product with their security infrastructure (single sign-on and access control).",
      "Established the team's coding practices to mitigate technical debt proactively and keep the user in view.",
      "Collaborated with UX designers and researchers to solve user pains with low-effort, high-value solutions.",
      "Led hiring and designed the interview loop that built a team of dedicated front-end engineers.",
      "Researched and prototyped candidate features using AI and 3D graphics technologies.",
    ],
  },
  {
    org: "Improbable",
    url: "https://www.improbable.io",
    title: "Graduate Engineer",
    start: "2020-09-01",
    end: "2021-01-01",
    highlights: [
      "Improved download-time estimates for a widely used playtest distribution tool using fine-grained analytics.",
      "Parallelised IO and network tasks, greatly reducing execution time.",
    ],
  },
  {
    org: "Skyscanner",
    url: "https://www.skyscanner.net",
    title: "Software Intern",
    start: "2019-06-01",
    end: "2020-08-01",
    highlights: [],
  },
  {
    org: "AMNiiS",
    title: "Lead Backend Engineer",
    start: "2018-05-01",
    end: "2019-05-01",
    highlights: [],
  },
  {
    org: "Imagine Software",
    title: "Tech Intern",
    start: "2018-06-01",
    end: "2018-09-01",
    highlights: [],
  },
  {
    org: "American Express",
    url: "https://www.americanexpress.com",
    title: "First Foundry Summer Analyst",
    start: "2017-06-01",
    end: "2017-08-01",
    highlights: [],
  },
];

const projects: CvProject[] = [
  {
    name: "Catmaps",
    summary:
      "An app for reuniting lost pets with their owners: photograph an animal you have found and match it against the animals reported missing nearby.",
    url: "https://catmaps.me",
    start: "2026-02-01",
    highlights: [
      "Rust backend and a React Native app, chosen to learn systems programming on a product with real stakes for its users.",
      "[DRAFT — what is built and running today, what is next, and how you are making it exhaustive and reliable (typed API contracts, property tests, observability?).]",
    ],
  },
  {
    name: "Jordan's Camp",
    summary:
      "This site: a personal platform built in the open as a monorepo with its own design system.",
    url: "https://jordanscamp.site",
    start: "2025-01-01",
    highlights: [
      "React 19 and Mantine, with a Storybook-documented design system shared across the apps.",
      "Every blog page, this CV and its PDF are prerendered and readable without JavaScript, and structural accessibility rules are asserted over the shipped HTML in CI.",
    ],
  },
  {
    name: "PhotoBroom",
    summary:
      "A Chrome extension for keyboard-driven bulk review and deletion in Google Photos, where the official API cannot delete.",
    url: "https://jordanscamp.site/blog/photobroom",
    start: "2026-06-01",
    highlights: [],
  },
];

const commendations: Commendation[] = [
  {
    quote:
      "We tested it LIVE in a real monitoring visit together and it is so so nice. The CRA team thanks you 1000x over \u2014 this will absolutely improve our ability to deliver trials faster as we are able to monitor and track data so much more efficiently.",
    attribution: "A clinical research lead, on form-level monitoring",
  },
  {
    quote:
      "\u2026 running a hands-on workshop for PMs and Designers to be able to contribute to the [platform\u2019s] code base directly, empowering us to make small fixes, whilst ensuring guardrails are in place so we don\u2019t do anything silly.",
    attribution: "A product designer, on the AI-native workflows",
  },
  {
    quote:
      "You bring clarity to the chaos and keep things moving when it matters most \u2026 This week has been our busiest in the past 12 months and we\u2019ve managed to keep on top of things despite being down an engineer.",
    attribution: "The lead of the incident response team",
  },
  {
    quote:
      "I thought I would have to do a scary manual process; instead it took 5 minutes and automatically verified the state was correct afterwards.",
    attribution: "An engineer, on a migration written to run itself",
  },
  {
    quote:
      "This was a chonky one so great work getting it in. Any follow up is super clearly documented and I think we\u2019re in a really good place.",
    attribution: "An engineer, on the study-rule refactor",
  },
  {
    quote:
      "\u2026 organising the Jumpstart 5k event (and smashing it with his run time). And to everyone for the great team spirit.",
    attribution: "A product designer, on the running club",
  },
];

// "CatMap": the title in `projects.ts`, kept as the one spelling so a rename there does not silently 404 here.
const CATMAPS_PROJECT_SLUG = slugify("CatMap");

/* Read at build, not at the visit: a deploy is what moves the count on. */
const YEARS_BUILDING = yearsSince("2014-09-01");

export const cv: Cv = {
  name: "Jordan Mackie",
  headline:
    "Senior full-stack product engineer who loves building reliable systems for regulated, high-stakes domains, to solve real user problems and build powerful, trustworthy tools.",
  location: "London, UK · Valencia, Spain (remote)",
  updated: "2026-09-15",
  /* The address is its own label: a link that only says "Email" hides the one
     thing a reader might want to copy rather than click. */
  links: [
    { label: "jmackie97@hotmail.com", url: "mailto:jmackie97@hotmail.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/jordan-mackie/" },
    { label: "GitHub", url: "https://github.com/TheDuckGoesQuark" },
  ],
  narrative: (
    <>
      <p>
        I am a senior software engineer with {YEARS_BUILDING} years of experience building products,
        nearly three of them in clinical trials at{" "}
        <RoleAnchorLink org="Lindus Health">Lindus Health</RoleAnchorLink>, where a defect reaches
        patients and regulators.{" "}
        <strong>
          I build software to be exhaustive and reliable: typed end to end, tested against the cases
          that actually happen, and designed with the people who will use it under pressure.
        </strong>
      </p>
      <p>
        I take pride in owning entire systems from discovery to operation. I have run research with
        clinicians and site staff, written the specifications, shipped the systems and owned them in
        production, including founding the team that answers when a live study breaks. Over the past
        year,{" "}
        <strong>
          I have lifted our entire company's productivity by designing AI-native workflows
        </strong>{" "}
        that have enabled everyone to contribute productively to the application, and removing
        engineering as a bottleneck. Designers are able to ship production ready UI, PMs are able to
        prototype and explore ideas within a real environment and iterate in minutes rather than
        days, ultimately allowing everyone to focus on what really matters: that our software does
        what it does safely and correctly, every time.
      </p>
      <p>
        <strong>I want to work on systems where correctness is the product:</strong> energy,
        climate, scientific tooling, and safety-critical software. To prepare me for this goal, I'm
        solving a real-world problem using tools and systems that make it easy to do things
        correctly.{" "}
        <Link render={<RouterLink to={blogPaths.project(CATMAPS_PROJECT_SLUG)} />}>CatMaps</Link>{" "}
        aims to be a missing pet finder, with user safety and system reliability as core tenets
        rather than afterthoughts.
      </p>
    </>
  ),
  experience: [...roles].sort((a, b) => b.start.localeCompare(a.start)),
  projects,
  skills: [
    {
      group: "Research",
      items: [
        "User research",
        "Feature discovery",
        "Gap analysis",
        "Regulatory research",
        "Data analysis",
        "Resourcing",
        "Project management",
      ],
    },
    {
      group: "Design",
      items: [
        "Specification writing",
        "Domain modelling",
        "API design",
        "Design systems",
        "Risk assessment",
      ],
    },
    {
      group: "Build",
      items: [
        "TypeScript",
        "React",
        "React Native",
        "Node.js",
        "PostgreSQL",
        "Python",
        "Django",
        "Rust",
        "LLM integration",
        "Java",
        "Spring",
      ],
    },
    {
      group: "Test",
      items: [
        "Vitest",
        "Playwright",
        "Visual regression",
        "Accessibility (WCAG)",
        "i18n",
        "Storybook",
        "Invariant testing",
        "CI",
      ],
    },
    {
      group: "Validate",
      items: [
        "Good Clinical Practice",
        "21 CFR Part 11",
        "ICH E6(R3)",
        "EMA Annex 11",
        "MHRA GxP data integrity",
        "ALCOA++",
        "GDPR",
        "Audit trails",
        "E-signatures",
        "LLM safety",
        "Security",
      ],
    },
    {
      group: "Operate",
      items: [
        "AWS",
        "Terraform",
        "Docker",
        "GitHub Actions",
        "Incident response",
        "Linux",
        "Sentry",
        "Monitoring",
        "Alerting",
      ],
    },
    {
      group: "Collaboration",
      items: ["Workshops", "Lectures", "Teambuilding", "Mentoring", "Positive vibe"],
      fullWidth: true,
    },
  ],
  commendations,
  commendationsNote:
    "A selection of shout-outs from colleagues across engineering, design, clinical operations, and leadership.",
  education: [
    {
      institution: "University of St Andrews",
      url: "https://www.st-andrews.ac.uk",
      logo: "images/projects/st-andrews.webp",
      qualification: "MSc Computer Science, First Class",
      start: "2015-08-01",
      end: "2020-06-01",
      highlights: [
        "Machine Learning: evaluated regression and classification models using CART and gradient descent algorithms.",
        "Data Ethics: performed critical analysis of GDPR and the DPIA process with reference to case studies.",
        "Networking: developed a zone-based routed protocol for IoT devices using a locator-identifier address scheme.",
        "Signal Analysis: researched image compression, and determined a person's heart rate from video.",
        "AI: created a strategy game for collaborative agents with personality and humorous dialogue.",
        "Distributed Systems: implemented a three-tier distributed token-ring social network with failure recovery.",
        "Computer Graphics: experimented with shading and projection methods to model faces with OpenGL.",
      ],
    },
  ],
};
