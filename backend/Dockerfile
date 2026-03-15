FROM python:3.12-slim AS python-base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH=/root/.local/bin:$PATH

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    git \
    gettext \
    postgresql-client \
    build-essential \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
ADD https://raw.githubusercontent.com/python-poetry/install.python-poetry.org/main/install-poetry.py get-poetry.py
RUN python3 get-poetry.py -y --version 2.0.1 \
    && poetry self add poetry-plugin-export@^1.9.0 \
    && poetry config virtualenvs.create false

FROM python-base AS development

WORKDIR /home/app

# Copy poetry files first for better layer caching
COPY pyproject.toml poetry.lock ./

# Export requirements and install with pip (cache mount survives across builds)
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes
RUN --mount=type=cache,target=/root/.cache/pip \
    pip3 install --break-system-packages --ignore-installed -r requirements.txt

# Copy application code
COPY . .

# Create media directory for file uploads
RUN mkdir -p /home/app/media

# Create app user and set permissions
RUN addgroup --system app && adduser --system app && adduser app app
RUN chown -R app:app /home/app

USER app

EXPOSE 8000

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]

FROM python-base AS production

ARG COMMIT_HASH=dev
ENV COMMIT_HASH=${COMMIT_HASH}

WORKDIR /home/app

COPY pyproject.toml poetry.lock ./

RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --only=main
RUN --mount=type=cache,target=/root/.cache/pip \
    pip3 install --break-system-packages --ignore-installed -r requirements.txt

COPY . .

# Create static files
RUN python3 manage.py collectstatic --no-input || echo "Collectstatic skipped"

RUN addgroup --system app && adduser --system app && adduser app app
RUN chown -R app:app /home/app

USER app

EXPOSE 8000

CMD ["gunicorn", "campsite.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--threads", "2", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
