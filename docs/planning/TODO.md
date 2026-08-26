# TODO

All planned and deferred work, organised by priority.

---

## Next Up

### terraform.yml never runs on a stacked PR

`terraform.yml` filters `pull_request` on `branches: [main]`, and that filter
matches the PR's **base** branch. In a Graphite stack every PR's base is its
parent branch, so an `infra/**` change reviewed as part of a stack gets no
`terraform fmt -check`, no `terraform validate`, and no plan-preview comment —
the first time Terraform runs against it is `apply -auto-approve` after the
merge.

This was found the practical way: the five infra PRs implementing the isolation
plan (#66–#70) all skipped the workflow entirely. It also invalidates that
plan's §5 assumption that "the PR plan job on the next PR is the check".

Options, roughly in order of preference:

- Add `infra/**` PRs to the trigger regardless of base — e.g. drop the
  `branches` filter from the `pull_request` event and instead gate the `apply`
  job on `github.ref == 'refs/heads/main'` (it already is).
- Keep the filter and rely on laptop applies for stacked work, but then say so
  explicitly in the workflow's comments so the gap is not rediscovered.

Note the read-only plan job is additionally gated on
`vars.AWS_PLAN_ROLE_ARN != ''`, so check that repo variable is set before
concluding the trigger is the only problem.

---

## Backlog

### Campsite — tent open/close mechanic

- Add tent flap open/close interaction (click or swipe to unzip/zip)
- Different ambient environment when tent is open vs closed
  - Open: brighter interior, outdoor sounds more prominent, wider camera range
  - Closed: cosier, muffled rain, warmer lighting
- Animate tent flap mesh (morph target or bone-based)
- Deferred loading of outdoor models — PicnicArea, Campfire, WalkingCat GLBs don't need to load until the tent is first opened. Load them lazily on first open (R3F Suspense boundary around outdoor group) so initial tent load is faster. OutdoorScene (sky/stars/clouds) is procedural so it's cheap either way.

### Campsite — sound & visual polish

- Sound changes when tent opens (rain gets louder, campfire crackle fades in)
- Visual transition effect when opening tent (light spill, blur fade)

### Digital Twins — scheduling simulator polish & storytelling

- Scrollytelling narrative content for the algorithm explanation cards
- Phase 1 scroll-driven animation engine (keyframe interpolation, anchor system, task tokens) — see plan file
- Easing curves for smoother scroll interpolation (Phase 2 in plan)
- Wait time chart (avg wait time per project over time)
- Per-project throughput breakdown chart

### PhotoBroom — polish & robustness

- Error recovery: report which photos failed to bin (e.g. shared/partner items Google won't delete) rather than silently skipping
- Surface the `inspectPage()` health check in the UI as a "Google's layout may have changed" warning when selectors stop matching
- Loading skeleton / nicer progress while scanning very large result sets
- Code-split / shrink the overlay bundle (currently ~290KB)

---

## Future

_(nothing queued)_
