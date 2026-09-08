import type { Cv, Role } from "../types/cv";

const roles: Role[] = [
  {
    org: "Lindus Health",
    title: "Senior Software Engineer",
    start: "2024-01-01",
    highlights: [
      "Led data infrastructure initiatives to make clinical trial data consistently accessible and reliable for statisticians and data teams, enabling real-time study progress monitoring and adaptive trial management.",
      "Designed and implemented medical safety workflows for adverse event reporting, enabling doctors and site staff to efficiently report serious clinical events with regulatory compliance.",
      "Built a survey schedule management system to handle real-world variability in clinical trial execution, reducing friction when ground truth diverged from planned study models.",
      "Architected a design system and collaboration pipeline from scratch, including visual regression testing and QA tooling, improving feature quality and designer-developer collaboration.",
      "Founded and led an emergency response team to rapidly address critical study issues, prioritising speed, study integrity and participant experience over perfect solutions.",
    ],
    tags: ["clinical-trials", "data", "design-systems"],
  },
  {
    org: "Gravity Sketch",
    title: "Full Stack Software Engineer",
    start: "2021-01-01",
    end: "2023-10-01",
    highlights: [
      "Led a multi-discipline product team from ideation to delivery of a set of crucial enterprise features.",
      "Worked directly with high-profile customers to provide a smooth integration with their security infrastructure.",
      "Developed best coding practices within the team to proactively mitigate technical debt and increase user empathy.",
      "Collaborated regularly with UX designers and researchers to solve user pains with low-effort, high-value solutions.",
      "Led hiring and designed interviews to create a team of dedicated front-end engineers.",
      "Researched and created proofs of concept for possible innovative features, using AI and 3D graphics technologies.",
    ],
    tags: ["enterprise", "3d", "front-end"],
  },
  {
    org: "Improbable",
    title: "Graduate Engineer",
    start: "2020-09-01",
    end: "2021-01-01",
    highlights: [
      "Improved estimates of download times for a widely used playtest distribution tool using fine-grained analytics.",
      "Experimented with various approaches to parallelise IO and network tasks, greatly reducing execution time.",
    ],
    tags: ["analytics", "performance"],
  },
  {
    org: "Skyscanner",
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
    title: "First Foundry Summer Analyst",
    start: "2017-06-01",
    end: "2017-08-01",
    highlights: [],
    tags: [],
  },
];

export const cv: Cv = {
  name: "Jordan Mackie",
  headline:
    "Senior software engineer at Lindus Health, building the data infrastructure, safety workflows and design system behind clinical trials.",
  updated: "2026-09-08",
  links: [{ label: "GitHub", url: "https://github.com/TheDuckGoesQuark" }],
  narrative: (
    <>
      <p>
        I build software for clinical trials at Lindus Health. I have led the data infrastructure
        that makes trial data reliable enough for statisticians to watch a study as it runs,
        designed the safety workflows doctors use to report serious adverse events, and built the
        design system the product is drawn with. Before that I spent three years at Gravity Sketch,
        leading a product team through a set of enterprise features and working directly with large
        customers on their security integrations.
      </p>
      <p>[DRAFT — what you want next, so a reader can tell in a paragraph whether to write.]</p>
    </>
  ),
  experience: [...roles].sort((a, b) => b.start.localeCompare(a.start)),
  skills: [
    { group: "Languages", items: ["TypeScript", "JavaScript", "Java", "Python", "C", "Bash"] },
    {
      group: "Tools, frameworks and libraries",
      items: [
        "React",
        "Redux",
        "Scikit-learn",
        "Spring",
        "LWJGL",
        "JADE",
        "Git",
        "Terraform",
        "Docker",
        "AWS",
        "Linux",
      ],
    },
  ],
  education: [
    {
      institution: "University of St Andrews",
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
