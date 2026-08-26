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

### Delete the orphaned jordanscamp.site hosted zone

`Z0321657TI5MQR8EEVXL` is a second, unused `jordanscamp.site` zone. Identified
26 Aug 2026 — it is **the zone Route53 Registrar created automatically when the
domain was registered** (`CallerReference: RISWorkflow-RD:...`,
`Comment: "HostedZone created by Route53 Registrar"`, domain registered
2026-02-22). Its records still describe the pre-Terraform site on GitHub Pages:
`A` -> `185.199.108-111.153`, `AAAA` -> `2606:50c0:800x::153`, and
`www` -> `TheDuckGoesQuark.github.io`. Terraform later created its own zone for
the same domain and the registrar's delegation was repointed at it, leaving this
one behind.

It only _looked_ more authoritative because GitHub Pages needs A + AAAA + a
`www` CNAME (5 records) where the live zone needs one A record (3).

**Verified safe to delete.** Its delegation set — `ns-1163.awsdns-17.org`,
`ns-1572.awsdns-04.co.uk`, `ns-800.awsdns-36.net`, `ns-164.awsdns-20.com` —
appears nowhere in the registrar's configuration, so nothing on the internet
resolves through it. All three sources agree the live zone is
`Z094957516GTOTOWK1PS3`: `dig NS jordanscamp.site`,
`route53domains get-domain-detail`, and Terraform state.

Deletion needs the non-required records removed first (the `www` CNAME, the A and
the AAAA); Route53 removes the zone's own NS and SOA with it. Not in Terraform
state, so this is a manual call, and it is irreversible.

### Decide whether www.jordanscamp.site should work

Found while investigating the zone above: **`www.jordanscamp.site` does not
resolve at all today.** The only `www` record anywhere in the account is the
stale GitHub Pages CNAME inside the orphaned zone, which nothing queries.

If www should work, it is an A record for `www` -> `aws_eip.app.public_ip` in
`infra/route53.tf` plus a matching Caddy vhost in `infra/Caddyfile` and
`infra/templates/user_data.sh`. If it should not, no action — but delete the
orphan knowing it takes the last trace of the old www config with it.

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
