#!/bin/bash
# GoatCounter on the box: install or upgrade the binary, restore the database
# from the last backup on a fresh instance, create the site on a truly new one,
# and keep it running and backed up under systemd. Idempotent: every step
# checks before it acts, so the same script is the install, the upgrade and
# the rebuild. Run as root, over SSM or from user-data. See README.md here.
set -euo pipefail

: "${ADMIN_EMAIL:?the dashboard login address}"
: "${BUCKET:?the deploy bucket, for backups}"
: "${AWS_REGION:=eu-west-2}"
: "${SITE_HOST:=stats.jordanscamp.site}"
: "${GOATCOUNTER_VERSION:=2.7.0}"

BIN=/usr/local/bin/goatcounter
DATA=/var/lib/goatcounter
DB="$DATA/db.sqlite3"
DSN="sqlite+$DB"
PASSWORD_FILE=/root/goatcounter-admin-password
RELEASE="https://github.com/arp242/goatcounter/releases/download/v${GOATCOUNTER_VERSION}/goatcounter-v${GOATCOUNTER_VERSION}-linux-arm64.gz"

dnf install -y -q sqlite >/dev/null

id goatcounter >/dev/null 2>&1 || useradd --system --home "$DATA" --shell /usr/sbin/nologin goatcounter
mkdir -p "$DATA"
chown goatcounter:goatcounter "$DATA"
chmod 750 "$DATA"

if [ ! -f "$DATA/version" ] || [ "$(cat "$DATA/version")" != "$GOATCOUNTER_VERSION" ]; then
  curl -fsSL "$RELEASE" | gunzip > /tmp/goatcounter
  install -m 755 /tmp/goatcounter "$BIN"
  rm -f /tmp/goatcounter
  echo "$GOATCOUNTER_VERSION" > "$DATA/version"
  echo "goatcounter $GOATCOUNTER_VERSION installed"
fi

# A rebuilt instance has no database; the nightly backup is where it went.
if [ ! -f "$DB" ]; then
  if aws s3 cp "s3://$BUCKET/_backup/goatcounter/latest.sqlite3" "$DB" --region "$AWS_REGION" >/dev/null 2>&1; then
    chown goatcounter:goatcounter "$DB"
    echo "database restored from the last backup"
  else
    password=$(openssl rand -base64 24)
    printf '%s' "$password" | sudo -u goatcounter "$BIN" db create site -createdb -db "$DSN" \
      -vhost "$SITE_HOST" -user.email "$ADMIN_EMAIL" -user.password -
    (umask 077; printf '%s\n' "$password" > "$PASSWORD_FILE")
    echo "site $SITE_HOST created; the login password is in $PASSWORD_FILE"
  fi
fi

cat > /etc/systemd/system/goatcounter.service <<UNIT
[Unit]
Description=GoatCounter
After=network-online.target
Wants=network-online.target

[Service]
User=goatcounter
Group=goatcounter
WorkingDirectory=$DATA
ExecStart=$BIN serve -listen localhost:8081 -tls none -db $DSN -automigrate
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

cat > /usr/local/bin/goatcounter-backup <<BACKUP
#!/bin/bash
set -euo pipefail
snapshot=\$(mktemp /tmp/goatcounter-XXXXXX.sqlite3)
sqlite3 $DB ".backup '\$snapshot'"
aws s3 cp "\$snapshot" "s3://$BUCKET/_backup/goatcounter/db-\$(date -u +%F).sqlite3" --region $AWS_REGION --quiet
aws s3 cp "\$snapshot" "s3://$BUCKET/_backup/goatcounter/latest.sqlite3" --region $AWS_REGION --quiet
rm -f "\$snapshot"
BACKUP
chmod 755 /usr/local/bin/goatcounter-backup

cat > /etc/systemd/system/goatcounter-backup.service <<UNIT
[Unit]
Description=Back up GoatCounter's database to S3

[Service]
Type=oneshot
ExecStart=/usr/local/bin/goatcounter-backup
UNIT

cat > /etc/systemd/system/goatcounter-backup.timer <<UNIT
[Unit]
Description=Nightly GoatCounter backup

[Timer]
OnCalendar=*-*-* 03:10:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now goatcounter-backup.timer
systemctl enable goatcounter
systemctl restart goatcounter

for i in 1 2 3 4 5 6; do
  if curl -fsS -o /dev/null -H "Host: $SITE_HOST" http://localhost:8081/count.js; then
    echo "goatcounter is serving $SITE_HOST"
    exit 0
  fi
  sleep 2
done
echo "goatcounter did not answer on localhost:8081" >&2
systemctl --no-pager status goatcounter >&2 || true
exit 1
