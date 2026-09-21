import type { Project } from "../types/project";

/* Strava's own share cards, so the pace and distance are burnt into the image
   rather than restated here, where they would drift from it. Ordered by when
   the run happened. */
const CATMAPS_RUNS = [
  {
    href: "https://www.strava.com/activities/18215976928",
    src: "/images/projects/catmaps/evening-run.webp",
    alt: "A tabby cat squeezing out past the railings of a black front door, over Strava figures for a 6.76km evening run.",
  },
  {
    href: "https://www.strava.com/activities/18332111463",
    src: "/images/projects/catmaps/lunch-run.webp",
    alt: "A black and white cat sitting on a path by a garden gate, over Strava figures for an 18.29km lunch run.",
  },
  {
    href: "https://www.strava.com/activities/18541253411",
    src: "/images/projects/catmaps/morning-run.webp",
    alt: "A tuxedo cat rolling on its back on sunlit pavement, over Strava figures for a 10.32km morning run.",
  },
];

/** Every project with a page. `listedProjects` is the subset the homepage shows. */
export const projects: Project[] = [
  {
    title: "JordansCamp.Site",
    url: "https://jordanscamp.site/",
    description:
      "December 2025, the middle of a bad winter, and I kept catching myself somewhere else. Inside a tent, rain going on the flysheet, nothing to do and nowhere to be. That particular white noise that finally switches my head off. It's my happy place and I couldn't get to it, so I built it instead, and then filled it with everything else I love: my music, my nonsense scribbles, the projects I keep starting, and Smittens, my animal familiar.\n\nThis was the first thing I made by describing it rather than typing it, and what caught me off guard was how much of my evenings used to go before the making even started. Which version of the library. Which config key moved. I assumed I'd miss that. I don't. What came back was the part I liked in the first place, which is watching something exist that didn't an hour ago.\n\nSo have a poke about. The laptop turns on, and I'd like it on record that it was meant to be a static image. I followed my nose and came back up for air with an entire operating system, which is also roughly how the notepad ended up full of poems I'm not sure about. The site borrows its manners from Firewatch, and from the home menus of old games and DVDs, back when a screen was content to sit there and be looked at.\n\nMostly I wanted to make something that doesn't want anything from you. Sit by the fire a minute, listen to the rain. Go and put a part of yourself out there too.",
    year: 2025,
    icon: "images/projects/jordanscamp-site.webp",
    color: "#4a9eff",
    tags: ["React", "Three.js", "Creative"],
    addedAt: "2026-01-15",
  },
  {
    title: "CatMaps",
    url: "https://catmaps.me",
    description: (
      <>
        <p>
          I know every cat on my cycle to work. Not their names, but where they sit and roughly
          when: the one on the wall by the lights, the one that's always in the same window, the one
          who comes out to the pavement if you slow down. When one of them stops being there I
          notice, and I worry, and there's nothing I can do with the worry. You can't ask a street
          whether its cat is alright.
        </p>
        <p>
          CatMaps, now in the queue for the app store, is me trying to build the thing you'd check.
          You photograph an animal you've seen, and it gets matched against the ones people have
          reported missing nearby.
        </p>
        <p>
          It's less obvious than it sounds. I've picked up affectionate cats with no collar before,
          and the instinct is to take them to a vet and have the chip read. But an affectionate cat
          with no collar is usually just a cat at home in its own territory, and carrying it across
          town is the thing that actually loses it. I had no way to tell those two apart, and
          neither does anyone else, so the app has to be as good at talking you out of acting as it
          is at getting you to report.
        </p>
        <p>
          That kind of question turned out to be most of the design. I went through the scenarios
          one at a time: it can't ask people to hand over personal details to take part, it can't
          publish where somebody's pet reliably is at four in the afternoon, and it can't become a
          catalogue for anyone minded to steal one. Almost every feature that would obviously help
          you find a cat fails at least one of those.
        </p>
        <p>
          And it still has to be worth opening when nothing is wrong. A map of sightings only exists
          if people contribute to it, and people only contribute to something they already had a
          reason to look at. What I landed on starts with the posters that are already on the
          lampposts: a QR code on the poster, so whoever prints it registers their pet while they're
          at it, and the stranger who stops to read it can join the search from the pavement.
        </p>
        <p>
          Staying is a different problem from arriving. If a cat you photographed gets home, you
          hear that you helped. If an animal you've snapped before is reported missing, you hear
          that too, because you're the one most likely to see it again. Everyone already knows a few
          cats on their own street. This is what tells them it counted.
        </p>
        <p>
          Before any of it existed I just did this by hand. A photo of every cat I passed, a photo
          of every missing poster, and me trying to cross-reference the two out of my own camera
          roll. Putting the runs on Strava got closer, because a run carries its route with it, so a
          sighting turns up already knowing where it happened. The problem is who's looking. The
          person who would recognise that cat is in a local Facebook group, not in my tiny Strava
          following.
        </p>
        <figure className="run-strip">
          <ul>
            {CATMAPS_RUNS.map((run) => (
              <li key={run.href}>
                <a href={run.href} target="_blank" rel="noopener noreferrer">
                  <img src={run.src} alt={run.alt} width={480} height={853} loading="lazy" />
                </a>
              </li>
            ))}
          </ul>
          <figcaption>
            Friendly neighbourhood cats who might be stressing out their owners with their
            adventures
          </figcaption>
        </figure>
        <p>
          When I told people I was doing this, I realised a pile of sightings is worth more than one
          cat at a time. Everyone I know with an outdoor cat wonders where it goes and what other
          lives it's living. I put a Tractive tracker on mine and learned exactly where he was and
          nothing whatsoever about what he did, and he got it off his neck constantly anyway. What I
          wanted was the bit only other people can see.
        </p>
        <p>
          Underneath all of that: Rust, React Native, as little state as I could get away with, and
          the logic written as deterministic state machines. Partly that's so behaviour can be
          tested exhaustively rather than hopefully, and partly it's that a codebase shaped like
          that is one an AI-assisted workflow can be held to, because there's a right answer to
          check the work against. If people are going to lean on this for an animal's safety, and
          sometimes for their own, I want to be able to say that it works, not that it seems to.
        </p>
        <p>
          Widen it out and it stops being about any one animal. Once enough people are looking, the
          same pile of sightings is the thing shelters keep wishing they had: where the colonies
          actually are, which streets keep losing dogs, the sort of picture policy currently gets
          made without because nobody has ever had it.
        </p>
        <p>
          Mostly though it's the cat on the wall by the lights. I'd like to be able to check they're
          safe.
        </p>
      </>
    ),
    year: 2026,
    // The same logo the laptop in the tent shows on its screen.
    icon: "images/logo.webp",
    // Light, because the mark is dark and unreadable on the tile's own dark fill.
    color: "#ffffff",
    tags: ["Rust", "React-Native", "Product"],
    addedAt: "2026-02-01",
  },
  {
    title: "PhotoBroom",
    url: "https://jordanscamp.site/blog/photobroom",
    github: "https://github.com/TheDuckGoesQuark/CampingTrip",
    description:
      "Google Photos quietly took away the ability to bulk-delete photos from a search, and their API can't delete at all, which drove me up the wall every time I wanted to clear out a day's worth of near-identical shots. So PhotoBroom is my answer: a Chrome extension that overlays a fast, keyboard-driven review right on top of Google Photos. Search a date, flick through with the arrow keys (keep, skip, or bin), then send the whole pile to the bin in one go.\n\nIt drives Google's own interface (the only way that's actually possible), runs entirely in your browser, and nothing's gone for good since the bin holds onto things for 60 days. A small, stubborn little tool born purely out of being annoyed at not being able to do a basic thing.",
    year: 2026,
    color: "#ffb347",
    tags: ["Chrome-Extension", "Tools"],
    addedAt: "2026-06-29",
    listed: false,
  },
  {
    title: "Music Production",
    description:
      "The tent is full of kit for a reason: the guitar, the MIDI controller, the interface and the mic are the same set that lives next to my desk. I play guitar and drums, and I'm learning to turn the noodling into finished tracks in Ableton.\n\nNothing to listen to yet. When there is, it will live here.",
    year: 2026,
    glyph: "note",
    color: "#8a5cf6",
    tags: ["Guitar", "Drums", "Ableton"],
    addedAt: "2026-09-14",
  },
];

export const listedProjects: Project[] = projects.filter((project) => project.listed !== false);
