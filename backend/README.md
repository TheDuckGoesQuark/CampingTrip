# Backend

Django REST API serving all frontend apps, hosted at [api.jordanscamp.site](https://api.jordanscamp.site).

## Running locally

```bash
docker compose up          # starts Django + Postgres
```

Or without Docker:

```bash
poetry install
python manage.py migrate
python manage.py runserver
```

## Django apps

| App | URL prefix | Description |
|-----|-----------|-------------|
| `apps.core` | `/api/` | Health check, status, shared utilities |
| `apps.workout` | `/api/workout/` | Workout tracker API (scaffold — no models yet) |

## Tech stack

- Django 5.2 + Django REST Framework
- PostgreSQL (RDS in production, Docker locally)
- dj-rest-auth + django-allauth for authentication
- Poetry for dependency management
- Gunicorn in production (via Docker)

## Key endpoints

| Endpoint | Description |
|----------|-------------|
| `/health/` | Health check (used by deploy verification) |
| `/manage-campsite/` | Django admin |
| `/api/auth/` | Authentication (login, logout, user details) |
| `/api/auth/registration/` | User registration |
