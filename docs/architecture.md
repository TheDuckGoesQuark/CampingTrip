# Architecture

## Overview

Jordan's Camp is a monorepo hosting multiple web apps under the `jordanscamp.site` domain. Each frontend app is a separate Vite project in `apps/`, sharing a single Django backend and AWS infrastructure.

```
Browser
  |
  |-- jordanscamp.site          --> Campsite (static SPA)
  |-- workout.jordanscamp.site  --> Workout Tracker (PWA)
  |-- api.jordanscamp.site      --> Django REST API
  |
  v
Caddy (reverse proxy + auto TLS)
  |
  |-- static files from /opt/jordanscamp/webapp/    (campsite)
  |-- static files from /opt/jordanscamp/workout/   (workout)
  |-- proxy to localhost:8000                       (Django via Gunicorn)
```

## Repository structure

```
/
├── apps/
│   ├── campsite/           # 3D camping scene homepage
│   └── workout/            # Workout tracker PWA
├── backend/
│   ├── apps/
│   │   ├── core/           # Shared API (health, status)
│   │   └── workout/        # Workout tracker API
│   ├── campsite/           # Django project settings
│   └── docker-compose.yml
├── infra/                  # Terraform IaC
│   ├── main.tf
│   ├── ec2.tf
│   ├── rds.tf
│   ├── route53.tf
│   ├── iam.tf
│   └── templates/
│       └── user_data.sh    # EC2 bootstrap script
├── docs/
│   ├── architecture.md     # (this file)
│   └── planning/
│       ├── TODO.md
│       └── COMPLETED.md
├── .github/workflows/
│   ├── ci.yml              # Lint, test, build on PRs
│   ├── deploy.yml          # Build + deploy on push to main
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
| **EC2** (t4g.micro, ARM64) | Runs Caddy, Docker (Django + Gunicorn) |
| **RDS** (db.t4g.micro, Postgres 16) | Database for all Django apps |
| **S3** | Deploy artifacts (frontend tarballs), Terraform state |
| **ECR** | Docker image registry for the backend |
| **Route53** | DNS for jordanscamp.site and subdomains |
| **Secrets Manager** | Django secret key, database credentials |

The EC2 instance is started/stopped via GitHub Actions (`infra-control.yml`) for cost management — it's not running 24/7.

## CI/CD pipeline

```
Push to main
  |
  ├── ci.yml          pnpm install -> typecheck -> test -> build
  ├── deploy.yml      build artifacts -> push Docker image -> SSM deploy
  └── terraform.yml   terraform plan -> apply (infra/** changes only)
```

**Deploy flow**:
1. Frontend apps are built into tarballs and uploaded to S3
2. Backend Docker image is pushed to ECR
3. SSM sends commands to the EC2 instance to pull the new image, run migrations, extract frontend bundles, and restart services

**PR flow**:
1. CI runs typecheck, tests, and build for all apps
2. Terraform plans are posted as PR comments (infra changes only)

## Adding a new app

1. Create `apps/<name>/` with a standard Vite + React setup and a `package.json`
2. Create `backend/apps/<name>/` if it needs API endpoints; wire into `campsite/urls.py` and `INSTALLED_APPS`
3. Add a Route53 record in `infra/route53.tf` pointing to the EC2 EIP
4. Add a Caddy server block in `infra/templates/user_data.sh`
5. Add build + deploy steps in `.github/workflows/deploy.yml`
6. Add a README in both the frontend and backend app directories
