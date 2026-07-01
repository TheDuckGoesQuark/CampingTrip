# Architecture

## Overview

Jordan's Camp is a monorepo hosting multiple web apps under the `jordanscamp.site` domain. Each frontend app is a separate Vite project in `apps/`. They are currently **static SPAs** — there is no backend or database. All three are served as static files by Caddy on a single EC2 instance.

```
Browser
  |
  |-- jordanscamp.site               --> Campsite (static SPA)
  |-- digitaltwins.jordanscamp.site  --> Digital Twins (static SPA)
  |-- photobroom.jordanscamp.site    --> PhotoBroom landing page (static SPA)
  |
  v
Caddy (static file server + auto TLS)
  |
  |-- static files from /opt/jordanscamp/webapp/        (campsite)
  |-- static files from /opt/jordanscamp/digitaltwins/  (digital twins)
  |-- static files from /opt/jordanscamp/photobroom/    (photobroom landing page)
```

**PhotoBroom is more than the static site.** The site (`apps/photobroom`) is just
an install/usage landing page. The actual tool is a Chrome extension in
`extensions/photobroom` that injects an in-page overlay onto `photos.google.com`
to sweep search results into the bin — it runs entirely in the browser (not served
by Caddy). The overlay is built from `apps/photobroom` via `vite.overlay.config.ts`
into `extensions/photobroom/overlay.js`.

> **No backend today.** The platform previously ran a shared Django REST API on
> RDS PostgreSQL, used only by the (now retired) workout tracker. With that app
> gone the backend was orphaned, so the Django app, Redis, RDS, ECR and the
> `api.jordanscamp.site` subdomain were torn down to cut cost. See
> [Adding a backend later](#adding-a-backend-later).

## Repository structure

```
/
├── apps/
│   ├── campsite/           # 3D camping scene homepage
│   ├── digitaltwins/       # Scrollytelling blog with interactive visualizations
│   └── photobroom/         # PhotoBroom landing page + source of the extension overlay
├── extensions/
│   └── photobroom/         # Chrome extension (manifest + built overlay.js)
├── infra/                  # Terraform IaC
│   ├── main.tf
│   ├── ec2.tf
│   ├── route53.tf
│   ├── iam.tf
│   ├── Caddyfile           # Static reverse-proxy config (synced to EC2 on deploy)
│   └── templates/
│       └── user_data.sh    # EC2 bootstrap script
├── docs/
│   ├── architecture.md     # (this file)
│   └── planning/
│       ├── TODO.md
│       └── COMPLETED.md
├── .github/workflows/
│   ├── ci.yml              # Lint, test, build on PRs
│   ├── deploy.yml          # Build + deploy static sites on push to main
│   ├── terraform.yml       # Terraform plan/apply
│   └── infra-control.yml   # Start/stop EC2 instance
├── pnpm-workspace.yaml
├── package.json            # Workspace root (scripts only)
├── CLAUDE.md               # AI assistant instructions
└── README.md
```

## Infrastructure (AWS)

All infrastructure is managed by Terraform in `infra/`.

| Service | Purpose |
|---------|---------|
| **EC2** (t4g.micro, ARM64) | Runs Caddy serving the static frontends. Docker + Compose are installed but idle, ready for a future backend. |
| **S3** | Deploy artifacts (frontend tarballs), Terraform state |
| **Route53** | DNS for jordanscamp.site and subdomains |

The EC2 instance can be started/stopped via GitHub Actions (`infra-control.yml`) for cost management.

## CI/CD pipeline

```
Push to main
  |
  ├── ci.yml          pnpm install -> typecheck -> test -> build
  ├── deploy.yml      build static apps -> upload tarballs to S3 -> SSM deploy
  └── terraform.yml   terraform plan -> apply (infra/** changes only)
```

**Deploy flow**:
1. Frontend apps are built into tarballs and uploaded to S3
2. SSM sends commands to the EC2 instance to extract the frontend bundles and the Caddyfile, then restart Caddy

**PR flow**:
1. CI runs typecheck, tests, and build for all apps
2. Terraform plans are posted as PR comments (infra changes only)

---

## Adding a new (static) app

1. Create `apps/<name>/` with a standard Vite + React setup and a `package.json`
2. Add a Route53 record in `infra/route53.tf` pointing to the EC2 EIP
3. Add a Caddy server block in `infra/Caddyfile` and `infra/templates/user_data.sh`
4. Add build + deploy steps in `.github/workflows/deploy.yml`
5. Add a README in the app directory

## Adding a backend later

The EC2 box is kept backend-ready (Docker + Compose installed by `user_data.sh`). To add a
DB-backed backend in any language (Go, Rust, Spring, Haskell, …):

1. Write a `docker-compose.yml` in `/opt/jordanscamp` with your service container plus a
   co-located `postgres` container using a named volume. Co-locating Postgres on the existing
   EC2 instance avoids a separate always-on database bill (which is why RDS was removed).
2. Add a `reverse_proxy` block for an `api` subdomain to `infra/Caddyfile` and
   `infra/templates/user_data.sh`.
3. Add a Route53 A record for the `api` subdomain in `infra/route53.tf`.
4. Wire build/deploy (and any DB migration step) into `.github/workflows/deploy.yml`.
