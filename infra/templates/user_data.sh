#!/bin/bash
set -euo pipefail

# -----------------------------------------------------------------------------
# EC2 User Data — Bootstrap Caddy to serve the static frontends
# Template variables are injected by Terraform templatefile()
#
# There is no backend/database any more: campsite and the photobroom stub
# are static SPAs served directly by Caddy. Docker + Compose
# are still installed so a future backend can be added as a drop-in compose
# file (service container + co-located Postgres) without re-bootstrapping.
# -----------------------------------------------------------------------------

LOG="/var/log/user-data.log"
exec > >(tee -a "$LOG") 2>&1
echo "=== User data script started at $(date) ==="

# --- Swap (headroom for any future container builds on t4g.micro) ---
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

# --- Docker (kept ready for a future backend; no containers run by default) ---
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

# --- Application directory ---
APP_DIR="/opt/jordanscamp"
mkdir -p "$APP_DIR"

# --- Deploy static frontends from S3 ---
mkdir -p "$APP_DIR/webapp" "$APP_DIR/photobroom"

if aws s3 cp "s3://${s3_bucket}/_deploy/webapp.tar.gz" /tmp/webapp.tar.gz --region "${aws_region}" 2>/dev/null; then
  tar xzf /tmp/webapp.tar.gz -C "$APP_DIR/webapp/"
  rm /tmp/webapp.tar.gz
  echo "Webapp (campsite) deployed from S3"
else
  echo "No webapp tarball in S3 yet — will be deployed by CI"
fi

if aws s3 cp "s3://${s3_bucket}/_deploy/photobroom.tar.gz" /tmp/photobroom.tar.gz --region "${aws_region}" 2>/dev/null; then
  tar xzf /tmp/photobroom.tar.gz -C "$APP_DIR/photobroom/"
  rm /tmp/photobroom.tar.gz
  echo "PhotoBroom app deployed from S3"
else
  echo "No photobroom tarball in S3 yet — will be deployed by CI"
fi

# --- Start Caddy ---
systemctl start caddy

echo "=== User data script completed at $(date) ==="
