# Services on the box

The instance serves the site through Caddy and, beside it, runs GoatCounter,
the site's analytics. Neither is installed by hand: `user_data.sh` sets up a
fresh instance, and the scripts here are run over SSM on the live one, so the
two paths cannot disagree. This is the runbook for the second.

## GoatCounter

`goatcounter.sh` installs the pinned release, restores the database from the
last backup when the instance is new, creates the site when there is no backup
to restore, and writes the systemd units that run it on `localhost:8081` and
back it up nightly. Caddy proxies `stats.jordanscamp.site` to it. The script
is idempotent, so it is also how the version is bumped: change
`GOATCOUNTER_VERSION` in it, merge, run the workflow.

### Installing or upgrading

Actions, `Box`, `Run workflow`, service `goatcounter`. The workflow uploads the
script to the deploy bucket, which is where a rebuilt instance also takes it
from, and runs it over SSM. The log ends with `goatcounter is serving`.

### The dashboard login

The site is created with the address the workflow is given and a password the
script generates, kept root-only on the box and nowhere else:

```bash
AWS_PROFILE=catmaps aws ssm send-command --region eu-west-2 --targets "Key=tag:Project,Values=jordanscamp" --document-name AWS-RunShellScript --parameters 'commands=["cat /root/goatcounter-admin-password"]' --query Command.CommandId --output text
```

Then `aws ssm get-command-invocation` with that id and the instance id prints
it. Log in at `https://stats.jordanscamp.site`, and under the site's settings
tick the option that makes the dashboard public.

### Backups and restore

`goatcounter-backup.timer` snapshots the SQLite file with `.backup` (safe
while the service runs) at 03:10 UTC daily and copies it to
`s3://<deploy bucket>/_backup/goatcounter/`, dated and as `latest.sqlite3`.
Dated copies expire after thirty days by the bucket's lifecycle rule.

A rebuilt instance restores `latest.sqlite3` on its own during bootstrap. To
restore by hand, stop the service, copy the file over `/var/lib/goatcounter/db.sqlite3`
owned by `goatcounter`, and start it again.

### What is counted

The site loads `count.js` from the stats host with automatic counting off, and
counts a page view on the first scroll, click or keypress, then on every
route change after that. A visitor who lands and leaves is not counted, and
neither is a scraper that fetches a page without running a browser. GoatCounter
stores no IP address and no cookie; the privacy page says so.
