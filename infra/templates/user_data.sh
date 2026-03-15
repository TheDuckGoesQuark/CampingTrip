#!/bin/bash
set -euo pipefail

# -----------------------------------------------------------------------------
# EC2 User Data — Bootstrap Docker, Caddy, and web services
# Template variables are injected by Terraform templatefile()
# -----------------------------------------------------------------------------

LOG="/var/log/user-data.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== User data script started at $(date) ==="

# --- Swap (prevents OOM during Docker pulls on t4g.micro) ---
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
  echo "Swap enabled (1GB)"
fi

# --- Persistent journald (survives reboots for debugging) ---
mkdir -p /var/log/journal
systemd-tmpfiles --create --prefix /var/log/journal
systemctl restart systemd-journald

# --- System updates ---
dnf update -y
dnf install -y docker jq unzip

# --- Docker ---
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Docker Compose plugin (v2)
DOCKER_CONFIG=/usr/local/lib/docker/cli-plugins
mkdir -p "$DOCKER_CONFIG"
ARCH=$(uname -m)
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$ARCH" \
  -o "$DOCKER_CONFIG/docker-compose"
chmod +x "$DOCKER_CONFIG/docker-compose"

# --- Caddy ---
dnf install -y 'dnf-command(copr)' || true
dnf copr enable -y @caddy/caddy epel-9-$(uname -m) 2>/dev/null || true
# Fallback: install via binary if COPR isn't available on AL2023
if ! dnf install -y caddy 2>/dev/null; then
  curl -o /tmp/caddy.tar.gz -SL "https://caddyserver.com/api/download?os=linux&arch=arm64"
  tar -xzf /tmp/caddy.tar.gz -C /usr/bin caddy 2>/dev/null || mv /tmp/caddy.tar.gz /usr/bin/caddy
  chmod +x /usr/bin/caddy
  # Create caddy user and dirs
  useradd --system --home /var/lib/caddy --shell /usr/sbin/nologin caddy 2>/dev/null || true
  mkdir -p /etc/caddy /var/lib/caddy /var/log/caddy
  chown caddy:caddy /var/lib/caddy /var/log/caddy
fi

# Write Caddyfile
cat > /etc/caddy/Caddyfile <<'CADDYEOF'
${domain_name} {
    root * /opt/jordanscamp/webapp
    try_files {path} /index.html
    file_server
}

${api_domain} {
    reverse_proxy localhost:8000
}
CADDYEOF

# Caddy systemd service (if not installed via package manager)
if [ ! -f /usr/lib/systemd/system/caddy.service ]; then
cat > /etc/systemd/system/caddy.service <<'SVCEOF'
[Unit]
Description=Caddy
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=512
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
SVCEOF
fi

systemctl daemon-reload
systemctl enable caddy

# --- CloudWatch Agent (for user-data bootstrap log only) ---
dnf install -y amazon-cloudwatch-agent || true

cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'CWEOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "jordanscamp-prod/ec2",
            "log_stream_name": "{instance_id}/user-data"
          }
        ]
      }
    }
  }
}
CWEOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json -s || true

# --- Application directory ---
APP_DIR="/opt/jordanscamp"
mkdir -p "$APP_DIR"

# --- Pull secrets from Secrets Manager ---
SECRETS=$(aws secretsmanager get-secret-value \
  --region "${aws_region}" \
  --secret-id "${secret_arn}" \
  --query SecretString --output text)

SECRET_KEY=$(echo "$SECRETS" | jq -r '.SECRET_KEY')
DATABASE_URL=$(echo "$SECRETS" | jq -r '.DATABASE_URL')

# --- ECR login ---
aws ecr get-login-password --region "${aws_region}" | \
  docker login --username AWS --password-stdin "$(echo '${ecr_web_repo}' | cut -d/ -f1)"

# --- Write .env file ---
cat > "$APP_DIR/.env" <<ENVEOF
# Django
SECRET_KEY=$SECRET_KEY
DATABASE_URL=$DATABASE_URL
ALLOWED_HOSTS=${allowed_hosts}
CORS_ALLOWED_ORIGINS=${cors_origins}
DEBUG=0

# Redis (local container)
REDIS_URL=${redis_url}
ENVEOF

# Escape $ signs for Docker Compose .env parsing ($ → $$ = literal $)
sed -i 's/\$/\$\$/g' "$APP_DIR/.env"

chmod 600 "$APP_DIR/.env"

# --- Write docker-compose.prod.yml ---
cat > "$APP_DIR/docker-compose.prod.yml" <<COMPOSEEOF
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

  web:
    image: ${ecr_web_repo}:latest
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      redis:
        condition: service_healthy
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  redis_data:
COMPOSEEOF

# --- Deploy static frontend from S3 ---
mkdir -p "$APP_DIR/webapp"
if aws s3 cp "s3://${s3_bucket}/_deploy/webapp.tar.gz" /tmp/webapp.tar.gz 2>/dev/null; then
  tar xzf /tmp/webapp.tar.gz -C "$APP_DIR/webapp/"
  rm /tmp/webapp.tar.gz
  echo "Webapp deployed from S3"
else
  echo "No webapp tarball in S3 yet — will be deployed by CI"
fi

# --- Pull images ---
docker pull "${ecr_web_repo}:latest"

# --- Start services ---
cd "$APP_DIR"

# Run migrations
docker compose -f docker-compose.prod.yml run --rm web python3 manage.py migrate --no-input

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Start Caddy (needs services running first)
systemctl start caddy

echo "=== User data script completed at $(date) ==="
