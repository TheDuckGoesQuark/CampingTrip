# The CV: one data module, three renderings

The site is a place to send people who might hire Jordan, as well as people who
might just enjoy it. The blog is prerendered, so anything that can be a blog page
is readable by a link unfurler, an AI crawler or a recruiter's tooling without
JavaScript, and is still shown inside the tent's CatOS browser for a person. The
CV rides that same pipeline. This note is the plan for it; the content comes
from a Google Doc and is not part of the plan.

## Who arrives, and what they must get

| Reader                                                 | Runs JavaScript      | Arrives at                                | Must get                                                                  |
| ------------------------------------------------------ | -------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| A person following a link                              | Yes                  | `/blog/cv.html`                           | The tent opens with the CV in the CatOS browser, interactive pieces alive |
| A recruiter's link preview (LinkedIn, Slack, iMessage) | No                   | The same URL                              | A card with Jordan's name, headline and pitch, not the campsite blurb     |
| An applicant tracking system                           | Not a browser at all | `/cv.pdf`                                 | A conventional, parseable document                                        |
| A search or AI crawler                                 | No                   | The same URL, `/sitemap.xml`, `/feed.xml` | The full text, plus a `schema.org/Person` block                           |
| A person with scripts off, or printing                 | No                   | The same URL                              | The prerendered reader, styled, with a print layout                       |

Every row is the same HTML file or a PDF made from it. Nothing is served
differently by user agent.

## The one source: `cv.ts`

A typed module under `src/data/`, beside `posts/` and `projects.ts`. Slugs, dates
and derived values follow the existing rule: computed from the source fields,
never stored twice.

| Field              | Type                                           | Notes                                                                                                                                 |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `headline` | string                                         | The headline is the one-line pitch; it becomes the meta description and the link-preview text                                         |
| `narrative`        | `ReactNode`                                    | TSX, like a post body. Written first on the page. May contain `Island`s                                                               |
| `links`            | `{ label, url }[]`                             | GitHub, LinkedIn, email. Become `sameAs` in the JSON-LD                                                                               |
| `experience`       | `Role[]`                                       | `{ org, title, start, end?, location?, summary, highlights: string[], tags }`, newest first by sorting on `start`, so no caller sorts |
| `skills`           | `{ group, items: string[] }[]`                 | Grouped, so the print form can lay them out in columns                                                                                |
| `education`        | `{ institution, qualification, start, end }[]` |                                                                                                                                       |
| `updated`          | ISO date                                       | Shown on the page and used as `dateModified`                                                                                          |

Bullets in `highlights` are plain strings, not TSX, so the PDF and the
`knowsAbout`/`description` fields can carry them without a renderer.

## Rendering one: the CatOS page

A new `BlogPage` kind, `cv`, at `blogPaths.cv` (`/blog/cv.html`). The
exhaustive switches in `blogPages.ts` and `BlogPageView.tsx` refuse to compile
until it has a resolver, a title, an icon, a page component and a
`metaOfBlogPage` case. `blogUrls()` gets one more entry, and the test over it
renders the page, so the static form is checked on every run.

`CvPage.tsx` lays the page out narrative first:

1. Name, headline, links, and a `Download PDF` link to `/cv.pdf`.
2. The narrative: how Jordan works and what they want next. This is where an
   interactive piece belongs, through `Island` with a fallback that is the
   complete content, because the fallback is what the PDF and the crawler get.
3. The conventional CV: experience, skills, education. Plain markup, so it
   prints and parses cleanly.

## Rendering two: the prerendered HTML

Nothing new to build. Being a `BlogPage`, the CV is written to
`dist/blog/cv.html` by `scripts/prerender.mjs` with the rest. Two additions to
the head builder:

- `PageMeta.kind` gains `profile`, so the Open Graph type is `profile` and the
  JSON-LD block is a `Person` (`name`, `jobTitle`, `url`, `sameAs` from `links`,
  `knowsAbout` from `skills`, `dateModified` from `updated`) rather than a
  `WebPage`.
- A `<link rel="alternate" type="application/pdf" href="/cv.pdf">`, and
  `/cv.pdf` listed in the sitemap.

`caddy` can also answer a short, sayable address for a paper CV or a slide:
`redir /cv /blog/cv.html permanent` in the Caddyfile.

## Rendering three: the PDF

A build-time file, `dist/cv.pdf`, produced from the prerendered HTML so the
document and the page cannot disagree.

- `scripts/render-cv-pdf.mjs` starts Vite's preview server on `dist`, opens
  `/blog/cv.html` in headless Chromium through Playwright **with JavaScript
  disabled**, so the reader is what renders and the tent never boots, and calls
  `page.pdf()` at A4 with print backgrounds.
- A print stylesheet on the page (`@media print`) hides the download link and
  any toggle, sets margins, and keeps each role together across a page break.
- Playwright and its Chromium are a devDependency of the campsite. The script is
  its own command, `pnpm --filter campsite build:pdf`, run as a separate step in
  `ci.yml` and in the `build-campsite` job of `deploy.yml`, rather than folded
  into `build`. A local `pnpm build` stays fast and needs no browser download;
  CI installs Chromium with `npx playwright install chromium --with-deps` and
  caches it.
- A test asserts the PDF exists and its extracted text contains the headline
  and the first role, so a layout change cannot silently produce a blank page.

## The toggle, and the constraints any design must respect

"Work with me? / Get to know me?" is going through a design cycle before it is
built. Whatever it becomes, three constraints hold, because they are what make
the CV work for the readers above:

1. **The two views are two URLs.** The CV is `/blog/cv.html`; getting to know
   Jordan is `/blog/index.html`. On a static host the query string cannot change
   which file is served, so a `?view=work` parameter would give every unfurler
   and crawler the same page. Two URLs give a shared link its own title and
   preview card, and make the back button behave.
2. **The toggle's state is derived from the URL, never stored.** It reads which
   page is open, the same way `BlogRoute` already decides what the laptop shows.
3. **The prerendered reader must not depend on the toggle.** Whatever control
   the design chooses, its static form is at most a pair of plain links, or
   nothing. The reader is a document, not an app.

Places the design cycle can consider, all compatible with the constraints: a
segmented control in the CatOS browser's page header; a `CV` icon on the CatOS
desktop; a bookmark in the browser's bar; the welcome screen at `/`, so a
visitor chooses before the tent opens and lands straight in the laptop.

## Sequence

Each step is a PR that leaves the site working.

1. **Draft flag on posts.** `draft: true` keeps a post out of `blogUrls()` and
   the feed while CatOS still shows it. A CV link is one click from the posts,
   and the seeded ones are placeholders.
2. **`cv.ts`, `CvPage`, the `cv` page kind, `profile` meta.** Built with a
   clearly marked placeholder CV so the pipeline is proven end to end. The
   prerender and sitemap pick it up with no further change.
3. **The PDF pipeline** and its CI steps.
4. **The content.** The Google Doc is read into `cv.ts` and the narrative
   written as TSX. This is the step that needs Jordan's words and the fresh
   conversation.
5. **The toggle**, after the design cycle.

## What to bring to the fresh conversation

- The Google Doc link.
- This note.
- Decisions already made: the PDF is a build-time file at `/cv.pdf`; the page
  is narrative first, conventional CV second; the toggle waits for design.
