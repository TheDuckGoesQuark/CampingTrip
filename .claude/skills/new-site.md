---
description: "Scaffold a new subdomain site (frontend + optional Django backend + infra + CI/CD)"
allowed-tools: ["Bash", "Write", "Edit", "Read", "Glob", "Grep"]
---

# New Site Scaffold

Adds a new subdomain site to the jordanscamp monorepo. The argument is `<APP_NAME>` (lowercase, no hyphens — e.g. `photobroom`). Pass `--no-api` to skip backend creation.

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

### 1d. `infra/ec2.tf` — add template vars and CORS

In the `templatefile()` call inside `aws_instance.app`:

1. Add to the vars map: `<APP_NAME>_domain = local.<APP_NAME>_domain`
2. Append to the `cors_origins` string: `,https://${local.<APP_NAME>_domain}`

### 1e. `infra/templates/user_data.sh` — three edits

1. **Caddyfile template** (inside the `cat > /etc/caddy/Caddyfile` heredoc, after the last site block): add:

   ```
   ${<APP_NAME>_domain} {
       root * /opt/jordanscamp/<APP_NAME>
       try_files {path} /index.html
       file_server
   }
   ```

2. **mkdir -p** line (~line 220): add `"$APP_DIR/<APP_NAME>"` to the existing mkdir

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

## Step 2: Backend (skip if `--no-api`)

### 2a. Create Django app: `backend/apps/<APP_NAME>/`

Create these files following the `apps/workout/` pattern:

| File | Content |
|------|---------|
| `__init__.py` | empty |
| `apps.py` | `AppConfig` with `name = 'apps.<APP_NAME>'`, `verbose_name = '<APP_TITLE>'` |
| `models.py` | Docstring placeholder |
| `serializers.py` | `from rest_framework import serializers` |
| `views.py` | `from rest_framework import viewsets` |
| `urls.py` | `DefaultRouter()` with empty registrations, `urlpatterns = [path('', include(router.urls))]` |
| `admin.py` | `from django.contrib import admin` |
| `migrations/__init__.py` | empty |

### 2b. Register in `backend/campsite/settings.py`

Add `'apps.<APP_NAME>'` to the end of `INSTALLED_APPS`.

### 2c. Wire URLs in `backend/campsite/urls.py`

Add before the closing `]`:

```python
# <APP_TITLE>
path('api/<APP_NAME>/', include('apps.<APP_NAME>.urls')),
```

### 2d. Run migrations

```bash
cd backend && python manage.py makemigrations <APP_NAME> && python manage.py migrate
```

### 2e. Generate OpenAPI schema (once models exist)

```bash
cd backend && python manage.py spectacular --file ../apps/<APP_NAME>/openapi-schema.yml
```

Then in the frontend, run `pnpm --filter <APP_NAME> generate-api` to produce RTK Query hooks.

---

## Step 3: Frontend

### 3a. Create `apps/<APP_NAME>/`

Use the digitaltwins app as a starting template for the shell (Vite + React + Mantine + React Router), and the workout app as a template for API integration (RTK Query + Redux + codegen).

**Config files** (copy from digitaltwins, adjust name/title):

| File | Notes |
|------|-------|
| `package.json` | Set `name` to `<APP_NAME>`. Include `generate-api` script if API-backed. Deps: `@mantine/core`, `@mantine/hooks`, `react`, `react-dom`, `react-router-dom`. If API-backed, add: `@reduxjs/toolkit`, `react-redux`, `redux-persist`, `idb-keyval`. DevDeps: `@vitejs/plugin-react`, `postcss`, `postcss-preset-mantine`, `typescript`, `vite`, `vitest`. If API-backed, add devDep: `@rtk-query/codegen-openapi`. |
| `index.html` | Minimal shell, title = `<APP_TITLE>` |
| `vite.config.ts` | `react()` plugin, `base: '/'` |
| `tsconfig.json` | References pattern (app + node) |
| `tsconfig.app.json` | ES2020, strict, react-jsx |
| `tsconfig.node.json` | ES2022, strict |
| `postcss.config.cjs` | `postcss-preset-mantine` |
| `.env.production` | `VITE_API_URL=https://api.jordanscamp.site/` (API-backed only) |

**Source files**:

| File | Notes |
|------|-------|
| `src/vite-env.d.ts` | `/// <reference types="vite/client" />` |
| `src/theme.ts` | Copy from digitaltwins (orange Mantine theme) |
| `src/pages/Home.tsx` | Placeholder page with app title |
| `src/App.tsx` | `BrowserRouter` + `AppShell` with header + `Home` route (follow digitaltwins pattern) |
| `src/main.tsx` | If static: `MantineProvider` + `App`. If API-backed: wrap with Redux `Provider` + `PersistGate` + `MantineProvider` + `App`. |

**API files** (API-backed only, follow workout pattern):

| File | Notes |
|------|-------|
| `src/api/base-api.ts` | `createApi` with `reducerPath: '<APP_NAME>Api'`, `baseUrl` from `VITE_API_URL`, token auth in `prepareHeaders`, empty `tagTypes` |
| `src/api/rtk-query-codegen.config.js` | `filterEndpoints` for `/api/<APP_NAME>/` and `/api/auth/` |
| `src/store/store.ts` | `configureStore` with `baseApi.reducer` + `authSlice.reducer`, `redux-persist` with IndexedDB adapter, persist key `<APP_NAME>-root`, whitelist `['auth']` |
| `src/store/authSlice.ts` | Generic auth slice (copy from workout verbatim) |

### 3b. Root `package.json`

Add to `scripts`:

```json
"dev:<APP_NAME>": "pnpm --filter <APP_NAME> dev",
"build:<APP_NAME>": "pnpm --filter <APP_NAME> build",
"test:<APP_NAME>": "pnpm --filter <APP_NAME> test"
```

---

## Step 4: CI/CD

### 4a. `.github/workflows/deploy.yml`

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

## Step 5: Verify

```bash
pnpm install
pnpm --filter <APP_NAME> build
pnpm --filter <APP_NAME> dev   # check localhost
cd backend && python manage.py check   # if API-backed
```

---

## Step 6: Planning docs

1. Add a `<APP_TITLE>` section to `docs/planning/TODO.md` under **Backlog** for future work
2. Add a scaffold entry to `docs/planning/COMPLETED.md` with what was wired up
3. Update `README.md` apps table if one exists

---

## Backend API Development Pattern

Once the scaffold is in place, to add actual API features:

1. **Define models** in `backend/apps/<APP_NAME>/models.py` following the workout pattern (user-scoped via FK, `__str__`, `db_table` in Meta)
2. **Register in admin** in `admin.py` with `@admin.register(Model)`
3. **Create serializers** in `serializers.py` using `ModelSerializer`, with list/detail variants for nested relationships
4. **Create viewsets** in `views.py` — filter `get_queryset()` by user, set user in `perform_create()`, add `@action` for custom endpoints
5. **Register in router** in `urls.py`: `router.register(r'models', views.ModelViewSet, basename='model')`
6. **Run migrations**: `cd backend && python manage.py makemigrations <APP_NAME> && python manage.py migrate`
7. **Regenerate OpenAPI schema**: `cd backend && python manage.py spectacular --file ../apps/<APP_NAME>/openapi-schema.yml`
8. **Regenerate frontend hooks**: `pnpm --filter <APP_NAME> generate-api`
9. **Use hooks in components**: import from `src/api/generated-api.ts` (e.g. `useModelListQuery`, `useModelCreateMutation`)
