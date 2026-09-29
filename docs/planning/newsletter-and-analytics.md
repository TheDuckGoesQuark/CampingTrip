# Newsletter and analytics: owned end to end

Readers of the blog can leave an email address and be told when there is a new
post. Jordan can see how the blog is read. Both run on infrastructure this repo
already owns: the newsletter on SES, Lambda, DynamoDB and SQS beside the contact
endpoint, and analytics as GoatCounter on the box that serves the site. Nothing
about a reader leaves the London region, and nothing is paid for beyond
metered pennies.

The choices below were made against three constraints, in this order: cheap,
compliant, and under Jordan's control, with the whole thing stable once built.

## Who touches it, and what they must get

| Who                           | Arrives at                                  | Must get                                                                           |
| ----------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| A reader at the end of a post | A subscribe form, and a preview of an issue | One field, one sentence of consent, a privacy link, a working form without scripts |
| That reader's inbox           | A confirmation email                        | One link; nothing is sent to them until it is clicked                              |
| A subscriber                  | Each issue                                  | A short note, the post's summary and link, a one-click way out in every message    |
| Jordan, before an issue       | The `Newsletter` workflow in test mode      | The exact email, in his own inbox, with nothing recorded against the issue         |
| Jordan, sending an issue      | The same workflow in send mode              | A pause for his approval, then a count that matches the active list, or an alarm   |
| Jordan, any time              | `stats.jordanscamp.site`                    | Which posts are read, from where, without a consent banner on the site             |
| Anyone curious                | `/privacy`                                  | What is held, why, where, and how to leave                                         |

## The newsletter

### Infrastructure, as a module under `infra/newsletter/`

| Piece       | Resource                                                                                | The decision behind it                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity    | `aws_sesv2_email_identity` for the apex, Easy DKIM                                      | The From domain readers see is the site. DKIM alignment alone passes DMARC, since the signature's domain equals the From domain. Three CNAMEs from the identity's tokens go into Route53. |
| Bounce path | Custom MAIL FROM on `mail.jordanscamp.site`                                             | SES publishes one MX to its regional feedback endpoint and one SPF TXT there. The subdomain does nothing else, which SES requires.                                                        |
| Policy      | `_dmarc` TXT at `p=none`, no report address                                             | Monitoring mode first, as AWS advises; quarantine once a few issues have gone out clean. Reports are XML digests nobody here will read.                                                   |
| Events      | A configuration set, default for the identity, publishing bounces and complaints to SNS | The `events` function marks the subscriber. Account-level suppression is switched on as the second line.                                                                                  |
| List        | One DynamoDB table, on-demand, point-in-time recovery                                   | The functions have to reach it and the box's disk is not reachable from a Lambda. It is backed up by a setting rather than a cron.                                                        |
| Fan-out     | One SQS queue with a dead-letter queue                                                  | One message per recipient, so a crash mid-send loses nothing and a redelivery is a no-op.                                                                                                 |
| Functions   | `api`, `send`, `worker`, `events`                                                       | Plain `.mjs` on the runtime's SDK, zipped by the archive provider, tested with `node --test`, the shape `contact` set. Nothing a reader typed is logged.                                  |
| Approval    | A `newsletter` GitHub environment with Jordan as required reviewer                      | A real send waits for a click in the Actions UI. The repo is public, which is what makes the rule available on the free plan.                                                             |
| Alerts      | An `alerts` SNS topic emailing Jordan, alarms on it                                     | Same shape as the sibling project: one topic, plain-English messages. Function errors, dead-letter depth, the confirmation cap, and SES bounce and complaint rates each raise one.        |
| Caddy       | `handle /api/newsletter/*` proxied to the `api` function URL                            | Same-origin, so the form posts without CORS, and the Function URL is pasted from the Terraform output as `contact`'s is.                                                                  |

Both CI roles widen in the same change as the resources: the apply role for
SES, DynamoDB, SQS and CloudWatch alarms scoped to the project prefix, and the
plan role for the matching reads. The apply role already holds `lambda:*` on
project functions, which is what lets a workflow invoke `send`.

### The table

One table, keyed `pk` and `sk`.

| Item                           | Holds                                                                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUB#<email>` / `META`         | `status` (pending, active, unsubscribed, bounced, complained), `confirm_token`, `unsubscribe_token`, `subscribed_at`, `confirmed_at`, `consent_version`, `ttl` while pending |
| `ISSUE#<slug>` / `META`        | `claimed_at`, `mode`, `active_at_claim`, `sent`                                                                                                                              |
| `ISSUE#<slug>` / `SUB#<email>` | `sent_at`, `message_id`                                                                                                                                                      |
| `CAP#confirm#<date>` / `META`  | The day's count of confirmation emails sent                                                                                                                                  |

Two global secondary indexes, one per token, so a link's token is a key lookup.
The email is the address lowercased, so a reader who subscribes twice is one
row. A pending row expires on its own after two days.

Consent is evidenced the way the ICO describes a record of consent: the address
submitted, the timestamps of the form post and of the confirm click, and the
version of the consent sentence and privacy page in force at the time. No IP
address is held; the confirm click is the act of consent and the timestamp is
its record.

### Subscribing and leaving

1. The form on the blog posts email, honeypot and dwell time to
   `/api/newsletter/subscribe`. It is a plain form and works with scripts off.
2. `api` refuses anything the honeypot or dwell floor catches, exactly as
   `contact` does, then writes the pending row and sends the confirmation email
   itself. An address already pending gets a fresh confirmation, not a second
   row. An active address gets nothing and the same response.
3. Before sending a confirmation, `api` increments the day's `CAP#confirm`
   counter. Past the cap it refuses the signup and the alarm on that metric
   fires. A bot flooding the form can therefore pause sign-ups for a day, and
   cannot make the domain email strangers at scale.
4. The confirm link is a GET to `/api/newsletter/confirm?t=…`. It sets the row
   active, stamps `confirmed_at`, and redirects to the prerendered
   `/blog/subscribed` page. A stale or unknown token lands on a page that says
   so and offers the form again.
5. The unsubscribe link in every footer is a GET to a page with one button.
   Only the button's POST changes the row. Mail security products prefetch every
   link in a message, and a GET that unsubscribed would remove readers who never
   clicked. The `List-Unsubscribe-Post` one-click path is a POST by
   specification and lands on the same handler.
6. A bounce or complaint event marks the row, and SES's suppression list holds
   the address regardless.

### Sending an issue

An issue is a file under `apps/campsite/src/data/newsletters/`: a subject, a
date, the posts it points at, and a short note in Jordan's voice. The build
renders it twice, as an email (plain text, and HTML in table layout with inline
styles, the post's summary and a link carrying `utm_source=newsletter` and
`utm_campaign=<slug>`) and as a page at `/newsletter/<slug>` once it has been
sent, so an archive exists and each post can show a preview of the issue that
announced it, framed as a MouseMail window.

The `Newsletter` workflow is dispatched by hand with an issue slug and a mode.

1. It builds, and uploads the rendered email files to the private deploy bucket
   under `_newsletter/<slug>/`.
2. `test` invokes `send` with Jordan's address as the only recipient and a
   `[TEST]` subject prefix. Nothing is written against the issue. In the SES
   sandbox this is the only send that can succeed, which is the point of doing
   it first.
3. `send` targets the `newsletter` environment and waits for approval. `send`
   then claims `ISSUE#<slug>` with a conditional write before enqueuing anything,
   queries the active rows, and enqueues one message each. A re-run finds the
   claim and stops.
4. `worker` builds each message with its recipient's unsubscribe token and the
   `List-Unsubscribe` headers, sends it through SES, and records
   `ISSUE#<slug>/SUB#<email>` with a conditional put. A redelivered queue message
   finds the record and stops.
5. The workflow polls `send` in `status` mode until `sent` equals
   `active_at_claim`, and fails if they still differ at the timeout. That is the
   positive signal that an issue went out; the alarms are the negative one.

Before the first real issue, one test issue has been read in Jordan's inbox
with the DKIM signature shown as passing. The domain's reputation is the one
thing in this plan that cannot be rebuilt with a Terraform apply.

### Getting out of the sandbox

A new SES account sends only to verified addresses, two hundred a day. Leaving
the sandbox is a form in the SES console: mail type "Marketing", the site's
URL, and an acknowledgement that only people who asked will be mailed and that
bounces and complaints are handled. Only Jordan can file it, and AWS answers
within a day. It goes in as soon as the identity shows as verified, so the
wait overlaps the build. Should it be refused, the form, the table and the
functions stay, and `worker`'s send call becomes a hosted provider's API. That
swap is one function.

### Requests from readers

There is no admin screen. A deletion request is served by a documented CLI
invocation that removes the `SUB#` row and its `ISSUE#` markers, recorded in
the runbook beside the send procedure. An unsubscribed row is kept, with only
its status and timestamps, so the address is not re-added by accident; that is
the one purpose it serves and the privacy page says so.

## Analytics

GoatCounter runs on the box as a systemd service, a single binary with a SQLite
file under `/var/lib/goatcounter/`, listening on loopback. Caddy proxies
`stats.jordanscamp.site` to it and obtains the certificate as it does for
`www`; Route53 gets the A record. The dashboard is public: it shows what is
read, which is not a secret, and the page can later carry status panels for the
rest of the platform.

The site loads `count.js` from that subdomain with automatic counting off, and
counts a view on the first scroll, click or keypress. Scrapers that fetch a
page and leave are not counted, and neither is a reader who does the same; that
undercount is accepted in exchange for numbers that mean people.

GoatCounter stores no IP address, no full user agent and no cookie, and keeps
the mapping from a visitor to a session in memory for hours, never on disk.
The privacy page still names it.

Installing it follows the Caddyfile's two-path rule: the install script is
baked into user-data for a rebuilt instance and run once over SSM for the live
one, so the two never disagree. A nightly timer backs the database up to the
deploy bucket under `_backup/goatcounter/`, and user-data restores the latest
copy on a rebuild. Releases never touch the disk it lives on; only a deliberate
rebuild does, and the backup is what makes that safe.

## Delivery, as a stack of small PRs

Each lands on its own and is verifiable before the next.

1. **Domain and permissions.** The SES identity, DKIM CNAMEs, MAIL FROM records,
   DMARC record, the `alerts` topic, and both CI roles widened. Verified when
   the identity shows as verified in SES and the topic's subscription is
   confirmed. Jordan files the production-access request here.
2. **List and endpoints.** The table, queue, `api` and `events` functions,
   alarms, the Caddy route, the form on the blog with its consent sentence, the
   subscribed and unsubscribed pages, and `/privacy`. Verified by subscribing
   Jordan's own address end to end in the sandbox.
3. **Issues and the workflow.** The issue format, the email renderer, `send`
   and `worker`, the `newsletter` environment, and the `Newsletter` workflow.
   Verified by a test send to Jordan's inbox, then, once out of the sandbox,
   a real send to a list of one.
4. **Archive and preview.** The `/newsletter/<slug>` pages and the MouseMail
   preview at the end of each post.
5. **GoatCounter.** The service, the subdomain, the backup timer, the counting
   script, and the privacy page's paragraph on it.

## Operating it

The runbook lives in `infra/newsletter/README.md` and covers: sending an issue,
what each alarm means and the first thing to check, filing the production
access request, serving a deletion request, restoring the GoatCounter backup,
and upgrading the GoatCounter binary.
