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

${workout_domain} {
    root * /opt/jordanscamp/workout
    try_files {path} /index.html
    file_server
}

${digitaltwins_domain} {
    root * /opt/jordanscamp/digitaltwins
    try_files {path} /index.html
    file_server
}

${photobroom_domain} {
    root * /opt/jordanscamp/photobroom
    try_files {path} /index.html
    file_server
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

# --- Dynamic DNS: update Route53 with current public IP ---
# Create the update script
cat > /usr/local/bin/update-dns.sh <<'DNSSCRIPT'
#!/bin/bash
set -euo pipefail

ZONE_ID="PLACEHOLDER_ZONE_ID"
DOMAINS="PLACEHOLDER_DOMAINS"
REGION="PLACEHOLDER_REGION"

# Wait for public IP to be assigned (IMDSv2)
for i in $(seq 1 30); do
  TOKEN=$(curl -sf -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 21600") || true
  PUBLIC_IP=$(curl -sf -H "X-aws-ec2-metadata-token: $TOKEN" \
    http://169.254.169.254/latest/meta-data/public-ipv4) && break
  sleep 2
done

if [ -z "$${PUBLIC_IP:-}" ]; then
  echo "ERROR: Could not determine public IP after 60s"
  exit 1
fi

echo "Public IP: $PUBLIC_IP"

# Build Route53 change batch
CHANGES=""
for DOMAIN in $DOMAINS; do
  CHANGES="$${CHANGES}{\"Action\":\"UPSERT\",\"ResourceRecordSet\":{\"Name\":\"$DOMAIN\",\"Type\":\"A\",\"TTL\":60,\"ResourceRecords\":[{\"Value\":\"$PUBLIC_IP\"}]}},"
done
CHANGES="$${CHANGES%,}"

aws route53 change-resource-record-sets \
  --region "$REGION" \
  --hosted-zone-id "$ZONE_ID" \
  --change-batch "{\"Changes\":[$CHANGES]}"

echo "DNS updated: all domains → $PUBLIC_IP"
DNSSCRIPT

# Inject actual values into the script
sed -i "s|PLACEHOLDER_ZONE_ID|${route53_zone_id}|" /usr/local/bin/update-dns.sh
sed -i "s|PLACEHOLDER_DOMAINS|${domain_name} ${api_domain} ${workout_domain} ${digitaltwins_domain} ${photobroom_domain}|" /usr/local/bin/update-dns.sh
sed -i "s|PLACEHOLDER_REGION|${aws_region}|" /usr/local/bin/update-dns.sh
chmod +x /usr/local/bin/update-dns.sh

# Create systemd service to run DNS update on every boot
cat > /etc/systemd/system/update-dns.service <<'DNSSVCEOF'
[Unit]
Description=Update Route53 DNS with current public IP
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/update-dns.sh
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
DNSSVCEOF

systemctl daemon-reload
systemctl enable update-dns.service

# Run DNS update now
/usr/local/bin/update-dns.sh || echo "WARNING: DNS update failed (will retry on next boot)"

# --- Application directory ---
APP_DIR="/opt/jordanscamp"
mkdir -p "$APP_DIR"

# --- Pull secrets from SSM Parameter Store ---
SECRETS=$(aws ssm get-parameter \
  --region "${aws_region}" \
  --name "${ssm_parameter_name}" \
  --with-decryption \
  --query Parameter.Value --output text)

SECRET_KEY=$(echo "$SECRETS" | jq -r '.SECRET_KEY')
GOOGLE_OAUTH_CLIENT_ID=$(echo "$SECRETS" | jq -r '.GOOGLE_OAUTH_CLIENT_ID // empty')
GOOGLE_OAUTH_CLIENT_SECRET=$(echo "$SECRETS" | jq -r '.GOOGLE_OAUTH_CLIENT_SECRET // empty')

# --- Generate local database password ---
DB_PASSWORD=$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
echo -n "$DB_PASSWORD" > "$APP_DIR/.db_password"
chmod 600 "$APP_DIR/.db_password"

# --- ECR login ---
aws ecr get-login-password --region "${aws_region}" | \
  docker login --username AWS --password-stdin "$(echo '${ecr_web_repo}' | cut -d/ -f1)"

# --- Write .env file ---
cat > "$APP_DIR/.env" <<ENVEOF
# Django
SECRET_KEY=$SECRET_KEY
DATABASE_URL=postgresql://campsite:$DB_PASSWORD@db:5432/campsite
ALLOWED_HOSTS=${allowed_hosts}
CORS_ALLOWED_ORIGINS=${cors_origins}
DEBUG=0

# Redis (local container)
REDIS_URL=${redis_url}

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=$GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET=$GOOGLE_OAUTH_CLIENT_SECRET
ENVEOF

# Escape $ signs for Docker Compose .env parsing ($ → $$ = literal $)
# Use character class [$] to match literal $, not end-of-line
sed -i 's/[$]/\$\$/g' "$APP_DIR/.env"

chmod 600 "$APP_DIR/.env"

# --- Write docker-compose.prod.yml ---
cat > "$APP_DIR/docker-compose.prod.yml" <<COMPOSEEOF
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: campsite
      POSTGRES_USER: campsite
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    secrets:
      - db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U campsite"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

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
      db:
        condition: service_healthy
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

secrets:
  db_password:
    file: /opt/jordanscamp/.db_password

volumes:
  postgres_data:
  redis_data:
COMPOSEEOF

# --- Deploy static frontends from S3 ---
mkdir -p "$APP_DIR/webapp" "$APP_DIR/workout" "$APP_DIR/digitaltwins" "$APP_DIR/photobroom"

if aws s3 cp "s3://${s3_bucket}/_deploy/webapp.tar.gz" /tmp/webapp.tar.gz 2>/dev/null; then
  tar xzf /tmp/webapp.tar.gz -C "$APP_DIR/webapp/"
  rm /tmp/webapp.tar.gz
  echo "Webapp (campsite) deployed from S3"
else
  echo "No webapp tarball in S3 yet — will be deployed by CI"
fi

if aws s3 cp "s3://${s3_bucket}/_deploy/workout.tar.gz" /tmp/workout.tar.gz 2>/dev/null; then
  tar xzf /tmp/workout.tar.gz -C "$APP_DIR/workout/"
  rm /tmp/workout.tar.gz
  echo "Workout app deployed from S3"
else
  echo "No workout tarball in S3 yet — will be deployed by CI"
fi

if aws s3 cp "s3://${s3_bucket}/_deploy/digitaltwins.tar.gz" /tmp/digitaltwins.tar.gz 2>/dev/null; then
  tar xzf /tmp/digitaltwins.tar.gz -C "$APP_DIR/digitaltwins/"
  rm /tmp/digitaltwins.tar.gz
  echo "Digital Twins app deployed from S3"
else
  echo "No digitaltwins tarball in S3 yet — will be deployed by CI"
fi

if aws s3 cp "s3://${s3_bucket}/_deploy/photobroom.tar.gz" /tmp/photobroom.tar.gz 2>/dev/null; then
  tar xzf /tmp/photobroom.tar.gz -C "$APP_DIR/photobroom/"
  rm /tmp/photobroom.tar.gz
  echo "PhotoBroom app deployed from S3"
else
  echo "No photobroom tarball in S3 yet — will be deployed by CI"
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

# --- Daily PostgreSQL backup to S3 ---
cat > /etc/cron.daily/pg-backup <<'CRONEOF'
#!/bin/bash
set -euo pipefail
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/tmp/campsite_$TIMESTAMP.sql.gz"

docker compose -f /opt/jordanscamp/docker-compose.prod.yml exec -T db \
  pg_dump -U campsite campsite | gzip > "$BACKUP_FILE"

aws s3 cp "$BACKUP_FILE" \
  "s3://jordanscamp-prod-deploy/_backups/campsite_$TIMESTAMP.sql.gz"

rm -f "$BACKUP_FILE"

# Clean up old backups from S3 (keep last 7 days)
CUTOFF=$(date -d '7 days ago' +%Y%m%d 2>/dev/null || date -v-7d +%Y%m%d)
aws s3 ls s3://jordanscamp-prod-deploy/_backups/ | while read -r line; do
  FILE=$(echo "$line" | awk '{print $4}')
  FILE_DATE=$(echo "$FILE" | grep -oP '\d{8}' | head -1)
  if [ -n "$FILE_DATE" ] && [ "$FILE_DATE" -lt "$CUTOFF" ]; then
    aws s3 rm "s3://jordanscamp-prod-deploy/_backups/$FILE"
  fi
done

echo "Backup completed: campsite_$TIMESTAMP.sql.gz"
CRONEOF
chmod +x /etc/cron.daily/pg-backup

echo "=== User data script completed at $(date) ==="
