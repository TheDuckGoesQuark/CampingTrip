---
description: "Scaffold a new static subdomain site (frontend + infra + CI/CD)"
allowed-tools: ["Bash", "Write", "Edit", "Read", "Glob", "Grep"]
---

# New Site Scaffold

Adds a new static subdomain site to the jordanscamp monorepo. The argument is
`<APP_NAME>` (lowercase, no hyphens — e.g. `photobroom`).

The platform is static-only: each app is a Vite SPA served by Caddy on the EC2
box. There is no backend. (If a site ever needs an API, see "Adding a backend
later" in `docs/architecture.md` — it's a drop-in Docker Compose service, not
part of this scaffold.)

## Variables

Derive these from the argument:

- `APP_NAME`: the argument (e.g. `photobroom`)
- `APP_DOMAIN`: `<APP_NAME>.jordanscamp.site`
- `APP_TITLE`: title-cased display name (e.g. `PhotoBroom`)

---

## Step 1: Infrastructure

### 1a. `infra/main.tf` — add domain local

Add to the `locals` block:

```hcl
<APP_NAME>_domain = "<APP_NAME>.${var.domain_name}"
```

### 1b. `infra/route53.tf` — add Route53 A record

Add a new resource block (follow the digitaltwins pattern):

```hcl
# <APP_NAME>.jordanscamp.site → EC2 Elastic IP (<APP_TITLE> via Caddy)
resource "aws_route53_record" "<APP_NAME>" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.<APP_NAME>_domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}
```

### 1c. `infra/Caddyfile` — add site block

Append a new site block:

```
<APP_NAME>.jordanscamp.site {
    root * /opt/jordanscamp/<APP_NAME>
    try_files {path} /index.html
    file_server
}
```

### 1d. `infra/ec2.tf` — add template var

In the `templatefile()` call inside `aws_instance.app`, add to the vars map:
`<APP_NAME>_domain = local.<APP_NAME>_domain`

### 1e. `infra/templates/user_data.sh` — three edits

1. **Caddyfile template** (inside the `cat > /etc/caddy/Caddyfile` heredoc, after the last site block): add:

   ```
   ${<APP_NAME>_domain} {
       root * /opt/jordanscamp/<APP_NAME>
       try_files {path} /index.html
       file_server
   }
   ```

2. **mkdir -p** line: add `"$APP_DIR/<APP_NAME>"` to the existing mkdir

3. **S3 download block** (after the last `if aws s3 cp ...` block): add:

   ```bash
   if aws s3 cp "s3://${s3_bucket}/_deploy/<APP_NAME>.tar.gz" /tmp/<APP_NAME>.tar.gz 2>/dev/null; then
     tar xzf /tmp/<APP_NAME>.tar.gz -C "$APP_DIR/<APP_NAME>/"
     rm /tmp/<APP_NAME>.tar.gz
     echo "<APP_TITLE> app deployed from S3"
   else
     echo "No <APP_NAME> tarball in S3 yet — will be deployed by CI"
   fi
   ```

---

## Step 2: Frontend

### 2a. Create `apps/<APP_NAME>/`

Use the **digitaltwins** app as the starting template (Vite + React + Mantine
+ React Router).

**Config files** (copy from digitaltwins, adjust name/title):

| File | Notes |
|------|-------|
| `package.json` | Set `name` to `<APP_NAME>`. Deps: `@mantine/core`, `@mantine/hooks`, `react`, `react-dom`, `react-router-dom` (drop router if single-page). DevDeps: `@vitejs/plugin-react`, `postcss`, `postcss-preset-mantine`, `typescript`, `vite`, `vitest`. |
| `index.html` | Minimal shell, title = `<APP_TITLE>` |
| `vite.config.ts` | `react()` plugin, `base: '/'` |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | References pattern (app + node) |
| `postcss.config.cjs` | `postcss-preset-mantine` |

**Source files**:

| File | Notes |
|------|-------|
| `src/vite-env.d.ts` | `/// <reference types="vite/client" />` |
| `src/theme.ts` | Copy from digitaltwins (orange Mantine theme) — each app keeps its own theme |
| `src/App.tsx` | The page(s); follow digitaltwins' shell |
| `src/main.tsx` | `MantineProvider` + `App` |

### 2b. Root `package.json`

Add to `scripts` (optional convenience aliases):

```json
"dev:<APP_NAME>": "pnpm --filter <APP_NAME> dev",
"build:<APP_NAME>": "pnpm --filter <APP_NAME> build",
"test:<APP_NAME>": "pnpm --filter <APP_NAME> test"
```

---

## Step 3: CI/CD

### 3a. `.github/workflows/deploy.yml`

**Add build job** (clone `build-digitaltwins`, change filter):

```yaml
build-<APP_NAME>:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: pnpm/action-setup@v4
      with:
        version: 10
    - uses: actions/setup-node@v6
      with:
        node-version: '22'
        cache: pnpm
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Build <APP_NAME>
      run: pnpm --filter <APP_NAME> build
    - name: Upload <APP_NAME> artifact
      uses: actions/upload-artifact@v6
      with:
        name: <APP_NAME>
        path: apps/<APP_NAME>/dist/
        retention-days: 1
```

**Update deploy job**:

1. Add `build-<APP_NAME>` to the `needs` array
2. Add download artifact step:
   ```yaml
   - name: Download <APP_NAME> artifact
     uses: actions/download-artifact@v7
     with:
       name: <APP_NAME>
       path: <APP_NAME>
   ```
3. Add to "Upload deploy artifacts" step:
   ```bash
   tar czf <APP_NAME>.tar.gz -C <APP_NAME> .
   aws s3 cp <APP_NAME>.tar.gz s3://${{ vars.S3_DEPLOY_BUCKET }}/_deploy/<APP_NAME>.tar.gz
   ```
4. Add to SSM deploy command (after the last tar extract block):
   ```bash
   'aws s3 cp s3://$S3_BUCKET/_deploy/<APP_NAME>.tar.gz /tmp/<APP_NAME>.tar.gz',
   'mkdir -p /opt/jordanscamp/<APP_NAME>',
   'rm -rf /opt/jordanscamp/<APP_NAME>/*',
   'tar xzf /tmp/<APP_NAME>.tar.gz -C /opt/jordanscamp/<APP_NAME>/',
   'rm /tmp/<APP_NAME>.tar.gz',
   ```

---

## Step 4: Verify

```bash
pnpm install
pnpm --filter <APP_NAME> build
pnpm --filter <APP_NAME> dev   # check localhost
```

---

## Step 5: Planning docs

1. Add a `<APP_TITLE>` section to `docs/planning/TODO.md` under **Backlog** for future work
2. Add a scaffold entry to `docs/planning/COMPLETED.md` with what was wired up
3. Update the `README.md` apps table
