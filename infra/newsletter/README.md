# Newsletter: the runbook

The plan and the reasoning behind it are in
[`docs/planning/newsletter-and-analytics.md`](../../docs/planning/newsletter-and-analytics.md).
This file is what to do with it once it exists.

## What is here

| File         | Holds                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sending.tf` | The SES identity for the apex, its DKIM, MAIL FROM and DMARC records, the configuration set, and the topic SES publishes bounces and complaints to |
| `list.tf`    | The subscriber table, with a token index each for confirm and unsubscribe links                                                                    |
| `api.tf`     | The public endpoint behind `/api/newsletter/*`: subscribe, confirm, unsubscribe. Code in `../lambda/newsletter-api/`                               |
| `events.tf`  | The function that marks a subscriber bounced or complained from SES's events. Code in `../lambda/newsletter-events/`                               |
| `alarms.tf`  | What emails the owner: function errors, the confirmation cap, and the account's bounce and complaint rates                                         |

The module is wired in `infra/newsletter.tf`; the alerts topic every alarm
emails through is `infra/alerts.tf` at the root, since it is not the
newsletter's alone.

## After the first apply

Two things need a person, and Terraform reports success without either.

1. **Confirm the alerts subscription.** AWS emails `var.alert_email` a
   confirmation link. Until it is clicked the subscription is pending and no
   alarm reaches anyone.
2. **Watch DKIM verify.** `terraform output newsletter_dkim_status` reads
   `PENDING` until SES has resolved the three `_domainkey` CNAMEs, then
   `SUCCESS`. Route53 serves them within a minute; SES checks on its own
   schedule and can take longer. The custom MAIL FROM's MX is detected the same
   way and is allowed up to three days.

## Wiring the endpoint into the site

The endpoint's Function URL is generated when it is created, so it cannot be
in the Caddyfile before the first apply. `terraform output
newsletter_api_function_url` prints it; paste it into the `handle
/api/newsletter/*` block of `infra/Caddyfile`, as `contact_function_url` is in
its block, and merge. deploy.yml ships the Caddyfile.

Until the route exists the URL still answers directly, which is how the
endpoint is exercised in the sandbox. With your own address verified in SES
(the sandbox sends to verified addresses only):

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -X POST -H 'Content-Type: application/json' -d '{"email":"jmackie97@hotmail.com","trap":""}' "$(cd infra && terraform output -raw newsletter_api_function_url)subscribe"
```

A `202` means a pending row was written and the confirmation email sent.
Its link lands on `/blog/subscribe/confirmed.html` once followed; the
unsubscribe link in a later issue lands on a page with one button. A `303` is
the same outcome for a plain form post. Nothing about the address is logged,
so the table is the place to look: the row is `SUB#<address>` / `META`.

## Leaving the SES sandbox

A new SES account sends only to verified addresses and domains, at most two
hundred messages a day. That is enough to build and test against your own
inbox, and not enough to send an issue. Only the account owner can ask to
leave, and SES says verifying the domain first helps the request; so file it
once `newsletter_dkim_status` reads `SUCCESS`.

In the SES console, Account dashboard, "Request production access":

- Mail type: **Marketing**. Issues go to a list, not one-to-one.
- Website URL: `https://jordanscamp.site`.
- Additional contacts: the address you want SES's own notices at.
- Acknowledge that only people who explicitly asked will be mailed and that
  bounces and complaints are handled. Both are true: subscribers confirm by
  clicking a link, and the configuration set publishes bounces and complaints
  to a topic the marking function subscribes to.

Or from a shell with credentials for the account:

```bash
aws sesv2 put-account-details --production-access-enabled --mail-type MARKETING --website-url https://jordanscamp.site --additional-contact-email-addresses jmackie97@hotmail.com --contact-language EN --region eu-west-2
```

AWS gives an initial response within a day. While it is pending the account
details cannot be edited. If the request is refused, the identity, records and
topics stay as they are, and sending moves to a hosted provider's API inside
the sending function; nothing else changes.

## Testing what exists so far

With the identity verified, a message sent from the apex to an address you
have verified in SES proves the DNS end to end. Verify your own address in the
SES console first (sandbox rules), then:

```bash
aws sesv2 send-email --region eu-west-2 --from-email-address "hello@jordanscamp.site" --destination "ToAddresses=jmackie97@hotmail.com" --content '{"Simple":{"Subject":{"Data":"DKIM check"},"Body":{"Text":{"Data":"If the headers show dkim=pass for jordanscamp.site, the records are right."}}}}'
```

Open the message's headers in the receiving client. `dkim=pass` with
`header.d=jordanscamp.site` is the result the whole file above exists for;
`spf=pass` against `mail.jordanscamp.site` appears once SES has detected the
MX.
