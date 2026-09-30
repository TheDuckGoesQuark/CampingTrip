---
name: publish-newsletter
description: Take a blog post from draft to published and tell the newsletter list about it, safely, one hand-dispatched workflow at a time. Trigger when asked to publish a post, write or prepare an issue, test-send or send the newsletter, or mark an issue as sent.
---

# Publish a post and send the newsletter

The blog is static and the newsletter is a set of AWS pieces this repo owns.
The reasoning is in `docs/planning/newsletter-and-analytics.md`; the operator's
runbook is `infra/newsletter/README.md`. This skill is the order of operations
from a new post to a sent issue, with the checks between each step.

Two rules hold throughout:

- **Never run `aws` with the machine's default profile.** It is an unrelated
  account. Commands against the site's account use `AWS_PROFILE=catmaps`, and
  only Jordan runs them. Hand him the command; do not run it.
- **Never log or paste a subscriber's address.** The functions do not, and
  nothing here should either.

## The pieces

| Thing        | Where                                               | Note                                                                        |
| ------------ | --------------------------------------------------- | --------------------------------------------------------------------------- |
| A post       | `apps/campsite/src/data/posts/<camelCase>.tsx`      | A `Post`; registered in the `authored` list in `posts/index.ts`             |
| An issue     | `apps/campsite/src/data/newsletters/<camelCase>.ts` | An `Issue`; registered in the `issues` list in `newsletters/index.ts`       |
| The renderer | `apps/campsite/src/newsletter/renderIssue.ts`       | Issue to email HTML and text; `{{unsubscribe_url}}` is filled per recipient |
| The workflow | `.github/workflows/newsletter.yml`                  | `workflow_dispatch` with `issue` (slug) and `mode` (`test` or `send`)       |
| The gate     | GitHub environment `newsletter`                     | `send` pauses there until a required reviewer approves it in the Actions UI |
| The archive  | `/blog/newsletter/`                                 | Lists issues with `sentOn` set; each also appears under the posts it named  |

An issue's slug is its subject through `slugify`, the same way a post's slug
comes from its title. The workflow is dispatched with that slug.

## 1. Draft the post

Create `apps/campsite/src/data/posts/<camelCase>.tsx` exporting a `Post`:
`title`, `date` (ISO), `standfirst`, `tags` (from `TAG_TREE` in
`src/types/tags.ts`), `body` (TSX), and `draft: true`. Add it to `authored` in
`posts/index.ts`; order there does not matter.

What a body must respect is in `apps/campsite/README.md` under the blog
section: it renders in Node (no `window` or `document` during render), anything
interactive goes through `Island` with a real-content fallback, and a form in
it must work as a plain POST. Run `pnpm -r build` before opening the PR; the
type check only runs there.

A draft post is visible in CatOS (open the blog in the tent) and nowhere else:
no prerendered file, no sitemap or feed entry. Merge it as a draft to read it in
place.

## 2. Publish the post

Remove `draft: true`, merge. The deploy prerenders the page, adds it to the
sitemap and the feed, and the subscribe form appears under it. Read it once on
the live site before going further: the issue will link to it.

## 3. Prepare the issue

Create `apps/campsite/src/data/newsletters/<camelCase>.ts` exporting an `Issue`:

```ts
export const nextIssue: Issue = {
  subject: "The subject line as it will arrive",
  date: "2026-10-01",
  draft: true,
  note: ["A short paragraph in Jordan's voice.", "Another, if it earns its place."],
  posts: [thePost],
};
```

Add it to `issues` in `newsletters/index.ts`. The rules the tests hold:

- Every post in `posts` is published. The renderer refuses an issue that
  points at a draft post, so both the local render and the workflow fail on
  one, because the email would link to a page that does not exist.
- `note` is plain text, no markup. The renderer escapes it.
- `draft: true` stays on until the issue has been test-sent and read. A
  `send` of a draft issue is refused by the send function.

Render it locally and read both forms:

```bash
pnpm --filter campsite newsletter:render <slug>
```

That writes `apps/campsite/dist-newsletter/<slug>/email.html`, `email.txt` and
`meta.json`. Open the HTML in a browser. Post links must carry
`utm_source=newsletter` and `utm_campaign=<slug>`; the footer must carry the
unsubscribe placeholder and the privacy link.

Open the PR. The issue can be test-sent from its branch before it merges.

## 4. Test-send it

The workflow renders the issue on the ref it is given, uploads it, and asks the
send function to queue one `[TEST]` copy per test recipient (the contact
address in `infra/variables.tf`). Nothing is recorded: no claim, no per-recipient
mark, so a test can run as often as needed.

```bash
gh workflow run newsletter.yml --ref <branch> -f issue=<slug> -f mode=test
```

Then, in the inbox:

1. Subject reads `[TEST] <subject>` and the From is `Jordan Mackie <hello@jordanscamp.site>`.
2. Post links open the live pages and carry `utm_campaign=<slug>`.
3. The unsubscribe link lands on `/blog/subscribe/link-expired.html`, which is
   what a test copy's link does.
4. In the headers, `dkim=pass` with `header.d=jordanscamp.site`.

If nothing arrives, `infra/newsletter/README.md` has the diagnosis path. The
short version: a dead-letter alarm email means the worker refused the message
three times, and the reason is one log line, which Jordan reads with
`AWS_PROFILE=catmaps aws logs tail /aws/lambda/jordanscamp-prod-newsletter-worker --since 1h --region eu-west-2`.

While the account is in the SES sandbox, only verified addresses can receive
mail, which is fine for a test to the contact address and fatal for a real
send. The gate on a real send is therefore:

```bash
AWS_PROFILE=catmaps aws sesv2 get-account --region eu-west-2 --query ProductionAccessEnabled
```

`true` before step 5. Nothing else moves that flag; AWS grants it on request.

## 5. Send it

Preconditions, all of them:

- Production access is `true` (above).
- The issue's `draft: true` is removed, and that change is merged to `main`.
- The test copy was read and every link checked.

```bash
gh workflow run newsletter.yml --ref main -f issue=<slug> -f mode=send
```

The run pauses at the `newsletter` environment. Jordan approves it in the
Actions UI (the run page shows a "Review deployments" button). Then the send
function claims the issue, queues one message per active subscriber, and the
job polls until every recipient is marked sent, or fails after ten minutes
naming the alarm to look at.

A second `send` of the same slug is refused: the claim exists. That is the
guard against sending twice, and there is no override short of deleting the
issue's row by hand. Do not do that.

## 6. Mark it sent

Set `sentOn: "<ISO date it went out>"` on the issue file and merge. That single
line puts the issue in the public archive at `/blog/newsletter/`, gives it a
page, and shows it under each post it announced as "How this reached
subscribers". Until then the issue is viewable in CatOS only.

Do not set `sentOn` before the send: it is the record of a fact.

## What the copy lives in

For a pass over the words readers see, these are the files:

- `apps/campsite/src/components/blog/subscribe/SubscribeForm.tsx`: the form's
  invitation, its small print, and its replies.
- `apps/campsite/src/data/subscribeNotices.ts`: the pages the endpoint sends a
  reader to (check your inbox, confirmed, unsubscribed, link expired, not
  accepted). Their names
  are the endpoint's; a parity test holds them together.
- `apps/campsite/src/data/privacy.tsx`: the privacy page. Change
  `PRIVACY_UPDATED` when its newsletter wording changes, and the consent
  version in `infra/variables.tf` with it.
- `apps/campsite/src/newsletter/renderIssue.ts`: the email's frame, footer and
  plain-text form.
- `infra/lambda/newsletter-api/accept.mjs`: the confirmation email's words.
- `apps/campsite/src/components/blog/newsletter/IssuesPage.tsx` and
  `ArrivedAs.tsx`: the archive's introduction and the heading under a post.
