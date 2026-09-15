import { Link } from "@jordanscamp/ds";
import { Link as RouterLink } from "react-router-dom";

import { yearsSince } from "../components/blog/formatDate";
import RoleAnchorLink from "../components/blog/RoleAnchorLink";
import { blogPaths } from "../routing/blogPaths";
import type { Cv, CvProject, Role } from "../types/cv";
import { slugify } from "./slug";

const roles: Role[] = [
  {
    org: "Lindus Health",
    url: "https://www.lindushealth.com",
    logo: "images/projects/lindus-health.webp",
    title: "Senior Software Engineer",
    start: "2024-01-01",
    summary:
      "Clinical trials software: the platform doctors, site staff, statisticians and participants run a study on, where a defect reaches patients and regulators.",
    highlights: [
      "Led the data infrastructure that makes clinical trial data consistently accessible and reliable for statisticians and data teams, so a study's progress can be watched in real time and the trial adapted while it runs.",
      "Designed and shipped the medical safety workflows for adverse event reporting, so doctors and site staff can report serious clinical events quickly and within regulatory requirements.",
      "Built the survey schedule management system that absorbs the real-world variability of a running trial, where ground truth diverges from the planned study model.",
      "Architected the design system and the designer–developer pipeline from scratch, including visual regression testing and QA tooling.",
      "Founded and led the emergency response team for critical study issues, prioritising speed, study integrity and participant experience over perfect solutions.",
      "Designed and rolled out AI-native workflows that let designers ship production-ready UI and PMs prototype directly in the live application, cutting iteration from days to minutes and freeing engineering to focus on correctness and safety.",
      "[DRAFT — Regulatory compliance: which frameworks (GCP, 21 CFR Part 11, GDPR, MHRA / FDA inspection readiness?), what you delivered (audit trails, validation, e-signatures, access control?), and its outcome.]",
    ],
    tags: [
      "Clinical trials",
      "Data infrastructure",
      "Regulatory compliance",
      "AI workflows",
      "Design systems",
      "Incident response",
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
    tags: ["Enterprise", "VR", "3D", "Front end", "Team lead", "Hiring"],
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
    tags: ["Analytics", "Performance"],
  },
  {
    org: "Skyscanner",
    url: "https://www.skyscanner.net",
    title: "Software Intern",
    start: "2019-06-01",
    end: "2020-08-01",
    highlights: [],
    tags: [],
  },
  {
    org: "AMNiiS",
    title: "Lead Backend Engineer",
    start: "2018-05-01",
    end: "2019-05-01",
    highlights: [],
    tags: [],
  },
  {
    org: "Imagine Software",
    title: "Tech Intern",
    start: "2018-06-01",
    end: "2018-09-01",
    highlights: [],
    tags: [],
  },
  {
    org: "American Express",
    url: "https://www.americanexpress.com",
    title: "First Foundry Summer Analyst",
    start: "2017-06-01",
    end: "2017-08-01",
    highlights: [],
    tags: [],
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
    tags: ["Rust", "React Native", "Product", "Work in progress"],
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
    tags: ["React", "Design systems", "Accessibility", "CI"],
  },
  {
    name: "PhotoBroom",
    summary:
      "A Chrome extension for keyboard-driven bulk review and deletion in Google Photos, where the official API cannot delete.",
    url: "https://jordanscamp.site/blog/photobroom",
    start: "2026-06-01",
    highlights: [],
    tags: ["Chrome extension", "Tools"],
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
      items: ["Regulatory compliance", "GDPR", "Audit trails", "LLM safety", "Security"],
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
