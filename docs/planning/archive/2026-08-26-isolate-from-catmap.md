# Plan — Isolate jordanscamp from CatMap

> **ARCHIVED — completed 26 Aug 2026.** This is the plan as written, kept for
> the reasoning, with an outcome record below and `> **Outcome:**` notes inline
> where reality differed from what was expected. Do not work from it again; the
> policy it describes is now in `infra/iam.tf`, whose comments are the live
> reference.

## Outcome

All of §3, §5 and §6 landed, in five PRs stacked on the plan itself, each
applied from the laptop and verified with the §4 simulator before the next was
started:

| PR      | Scope                                                  | Result                                            |
| ------- | ------------------------------------------------------ | ------------------------------------------------- |
| §5 + §6 | AMI pin, `prevent_destroy` on EIP and hosted zone      | No AWS calls — `lifecycle` is Terraform-side only |
| §3.1    | Route53 writes → this zone; `CreateHostedZone` dropped | Applied, verified                                 |
| §3.2    | Logs → `jordanscamp-prod/*` prefix                     | Applied, verified                                 |
| §3.3    | S3 → `jordanscamp-*` prefix                            | Applied, verified                                 |
| §3.4    | EC2/VPC → one statement became seven                   | Applied, verified                                 |

§7's definition of done, checked at the end: `plan` reports `No changes`, every
negative simulator check returns `implicitDeny` with its positive control
`allowed`, `https://jordanscamp.site` returns 200, `aws_instance.app` no longer
appears in an unrelated plan, and every remaining mention of `catmap` under
`infra/*.tf` is inside a comment.

### What the plan got wrong, or could not have known

- **CatMap's infrastructure went live during the work.** The plan describes it
  as "about to add" resources. By the time §3.4 was written they existed:
  `vpc-0a814667fb5f091ae`, `subnet-0b9789ac400ecb0a2`, `sg-0e47f26a28d19bc34`,
  `igw-040c6fb9c92414de2`, `rtb-0ce1cac69606ef287`, tagged `Project=catmap`.
  The hole was live, not hypothetical.

- **`ec2:CreateTags` was the most serious grant, and §3.4 treated it as a
  detail.** Tags are the boundary in every other statement, so authority to tag
  arbitrary resources _is_ authority to move the boundary: tag CatMap's instance
  `Project=jordanscamp` and every tag-conditioned statement then permits
  terminating it. It needed the `ec2:CreateAction` gate more than any `Delete*`
  needed its tag condition.

- **The network interface carries no tags at all.** §3.4 predicted
  `default_tags` would miss something; this is what. `eni-0a9713ee64a568cd2`,
  behind the live instance, has an empty tag set — the provider requests
  `TagSpecifications` for `instance` and `volume` on `RunInstances` but not for
  `network-interface`. A `Project` condition there would have denied this
  project's own instance rebuild. Resolved with an `ec2:Vpc` condition instead,
  which is equally tight for the actual threat and does not depend on tagging
  behaviour. The plan's suggested fallback — grant the create unconditionally,
  keep the tag condition on the delete — was not needed.

- **§3.4's advice to grant `subnet/*` unconditionally was unnecessary.** Only
  `image/*` genuinely cannot be conditioned (an AL2023 AMI is Amazon-owned and
  carries none of our tags). The subnet and security group are ours and tagged,
  and `ec2:Vpc` covers them at `RunInstances` time.

- **§3.2's ARN-suffix warning was right, and here is the concrete form.** AWS's
  canonical ARN for the log group is
  `arn:aws:logs:eu-west-2:477395207022:log-group:jordanscamp-prod/ec2:*`, while
  Terraform state stores the bare form. Both are granted.

- **§3.1's literal zone id was replaced with `aws_route53_zone.main.zone_id`.**
  Known at plan time, no dependency cycle, one fewer copy of an identifier whose
  source of truth is in `route53.tf`. It resolved to `Z094957516GTOTOWK1PS3` —
  the live zone, not the orphan.

- **The AMI had not drifted when §5 was applied.** The instance was rebuilt the
  same morning, so the pin landed before the next republish rather than after
  one. `plan` was clean before and after; the effect is entirely on future
  plans.

### Two traps in §4's own commands

Both produce a false `implicitDeny` — a denial that looks exactly like a working
boundary, which is the worst possible failure mode for an acceptance test.

1. **The simulator matches the action against the resource _type_.**
   `ec2:TerminateInstances` against a VPC ARN returns `implicitDeny` no matter
   what the policy says. Every action must be paired with an ARN of the type it
   actually operates on, which means a table of (action, resource) pairs rather
   than one ARN and a list of actions.

2. **zsh does not word-split unquoted parameters.** A helper doing
   `--action-names $1` with a space-joined string passes _one_ bogus action
   name, and the simulator denies it. Pass action names as separate arguments,
   and assert the returned row count equals the action count.

### Left undone, deliberately

- **The orphaned `jordanscamp.site` hosted zone `Z0321657TI5MQR8EEVXL` still
  exists** — 5 records against the live zone's 3, exactly the trap §2 describes.
  Since identified: it is the zone Route53 Registrar auto-created when the domain
  was registered, still holding the pre-Terraform GitHub Pages config. Its
  delegation set appears nowhere in the registrar's configuration, so §2's
  warning is real but the resolution is unambiguous — full detail in `TODO.md`.
  Deleting it is irreversible, it is not in Terraform state, and it is not
  something a `terraform apply` does, so it was left for a deliberate manual
  decision. Tracked in `TODO.md`. Re-read §2 before touching it.
- **§0's shared OIDC provider arrangement is untouched**, as instructed.

---

Make this estate incapable of affecting the other project in the same AWS
account, and vice versa. The two may keep sharing account `477395207022`; what
must go is any overlap in resources and any ability to destroy one from the
other.

**Read this first if you have no context.** This account hosts two unrelated
projects. `jordanscamp` (this repo, `~/Documents/campingtrip`) is a static
React site on one EC2 box behind Caddy. `CatMap` (`~/Documents/catmap`) is a
Rust API being deployed for the first time; it is about to add an EC2 instance,
an ECR repository and a Postgres container to the same account. They have
collided once already, and this plan exists so they cannot collide again.

---

## 0. The one exception, stated up front

`aws_iam_openid_connect_provider` for `token.actions.githubusercontent.com` is
an **account-level singleton** — AWS permits exactly one per issuer URL per
account. It therefore cannot be duplicated, and "no shared resources" cannot be
literally true while both repos deploy via GitHub OIDC from one account.

This is already handled and **is not your job**:

- CatMap's `infra/shared/` owns it. That state contains nothing else, and the
  resource carries `prevent_destroy`, so no application `destroy` in either
  project can reach it.
- This repo reads it via `data "aws_iam_openid_connect_provider"` and no longer
  declares it (PR #64).
- This repo's deploy role no longer holds `iam:DeleteOpenIDConnectProvider`
  (also #64).

Leave that arrangement alone. If you want it symmetrical rather than living in
CatMap's repo, the only real alternative is a third "account bootstrap" repo —
judged over-engineering for two hobby sites, but it is the option if asked.

---

## 1. What has already been done

PR #64 (`oidc-repair/single-owner`), applied 26 Aug 2026. Do not redo any of it:

| Change                                                                                           | Status |
| ------------------------------------------------------------------------------------------------ | ------ |
| OIDC provider → `data` source, `terraform state rm` run                                          | Done   |
| `iam:DeleteOpenIDConnectProvider` removed from the deploy role                                   | Done   |
| `iam:ListOpenIDConnectProviders` added to both roles (the data source lists before it gets)      | Done   |
| `ssm:SendCommand` scoped: `AWS-RunShellScript` document + instances tagged `Project=jordanscamp` | Done   |
| `allowed_account_ids = ["477395207022"]` on the provider                                         | Done   |

> **Check before you start:** #64 may still be open. If it is, the **live AWS
> state has it applied but `main` does not** — so an apply from `main` would try
> to _create_ the OIDC provider and fail with `EntityAlreadyExists`. Get #64
> merged before doing anything else, or branch from it.

Direction of the remaining problem: **CatMap's deploy role already cannot reach
anything here** — it is scoped to one ECR repository and to instances tagged
`Project=catmap`, and CatMap has no Terraform apply role at all because its
applies are manual. Everything below is about the other direction.

---

## 2. Inventory — this estate, verified 26 Aug 2026

33 resources. Every one is either named `jordanscamp-*` or lives inside this
project's own VPC, zone or bucket, so a name/tag-based boundary is achievable.

| Thing                     | Identifier                                                             |
| ------------------------- | ---------------------------------------------------------------------- |
| VPC                       | `vpc-0b9819e69a52ec085`                                                |
| Public subnet             | `subnet-00e1339ce33ba1bcb`                                             |
| Security group            | `sg-051f3b639e07db89e`                                                 |
| EC2 instance              | `i-04768a73967de4c04` (replaced 26 Aug; see §5)                        |
| Elastic IP                | `eipalloc-086c316c533d59e56` → `16.60.63.129`                          |
| Hosted zone               | `Z094957516GTOTOWK1PS3` (`jordanscamp.site`)                           |
| Deploy bucket             | `jordanscamp-prod-deploy`                                              |
| State bucket / lock table | `jordanscamp-terraform-state` / `jordanscamp-terraform-locks`          |
| Log group                 | `jordanscamp-prod/ec2`                                                 |
| Roles                     | `jordanscamp-prod-ec2-role`, `-github-actions`, `-github-actions-plan` |

Everything carries `Project=jordanscamp`, `Environment=prod`,
`ManagedBy=terraform` from the provider's `default_tags`. CatMap's carry
`Project=catmap`. That tag is the boundary.

> **Outcome:** identified 26 Aug 2026 — it is the Route53 Registrar's
> auto-created zone from domain registration, still pointing at the old GitHub
> Pages site. Nothing delegates to it. §2's instruction to resolve by ID against
> the delegation set is exactly right, and is what settled it.

> **There is a second, orphaned `jordanscamp.site` hosted zone**,
> `Z0321657TI5MQR8EEVXL`, and it has **more** records than the live one. Resolve
> zones by ID against the registrar's delegation set, never by name or by how
> populated they look. Live is `Z094957516GTOTOWK1PS3`
> (`ns-1111.awsdns-10.org`, `ns-2024.awsdns-61.co.uk`, `ns-325.awsdns-40.com`,
> `ns-633.awsdns-15.net`). Deleting the orphan is optional cleanup; deleting the
> wrong one takes the site off the internet.

---

## 3. The work

Four `Resource = "*"` statements remain in `infra/iam.tf`, all in
`aws_iam_role_policy.github_terraform_resources`. Two are easy, one is
moderate, one is genuinely fiddly. Do them in this order — easiest first, so
that when the hard one breaks you know the breakage is the hard one.

Leave these alone: `IAMRead`, `ReadResources` (in `github_plan_readonly`), and
every `ec2:Describe*` / `*:List*` / `*:Get*`. They are read-only, most do not
support resource-level permissions at all, and narrowing them buys nothing.

### 3.1 Route53 — scope to this zone

> **Outcome:** done as described, except the zone id is taken as
> `aws_route53_zone.main.zone_id` rather than written literally.

`ChangeResourceRecordSets` on `"*"` currently means this role can rewrite
`catmaps.me`. Route53 record changes _are_ scopable to a hosted zone ARN:

```
Resource = "arn:aws:route53:::hostedzone/Z094957516GTOTOWK1PS3"
```

Split the statement: mutating actions (`ChangeResourceRecordSets`,
`ChangeTagsForResource`) onto the zone ARN, read actions
(`ListHostedZones`, `GetChange`, `ListResourceRecordSets`, `GetHostedZone`,
`ListTagsForResource`) staying on `"*"` — `ListHostedZones` and `GetChange`
take no resource.

**Drop `route53:CreateHostedZone` entirely.** The zone already exists and is
managed here; the role has no legitimate need to create another, and
`CreateHostedZone` cannot be scoped because there is no resource yet.

**Validate:** `terraform plan` from the laptop → no changes beyond your edit.

### 3.2 CloudWatch Logs — scope by name prefix

> **Outcome:** done as described. Both ARN forms were needed — see the
> outcome record above for the exact pair.

```
Resource = "arn:aws:logs:eu-west-2:477395207022:log-group:jordanscamp-prod/*"
```

`logs:DescribeLogGroups` must stay on `"*"` — it does not support
resource-level permissions. Everything else (`CreateLogGroup`,
`DeleteLogGroup`, `PutRetentionPolicy`, `TagResource`) takes the prefix. Note
that some log-group actions want both the bare ARN and the `:*` suffixed form;
if an apply fails, add `.../jordanscamp-prod/*:*`.

**Validate:** as above.

### 3.3 S3 — scope by bucket name prefix

> **Outcome:** done as described. Note `${local.name_prefix}-*` would be
> wrong: the state bucket is `jordanscamp-terraform-state` and carries no
> environment segment, so the prefix local misses it and `init` breaks.

```
Resource = ["arn:aws:s3:::jordanscamp-*", "arn:aws:s3:::jordanscamp-*/*"]
```

This covers the deploy bucket and the state bucket, and excludes every CatMap
bucket, which will be named `catmap-*`. `s3:ListAllMyBuckets` is not granted
and should stay that way.

**Validate:** as above. Watch for `s3:CreateBucket` — it is authorised against
the bucket ARN, which the prefix covers.

### 3.4 EC2 and VPC — the fiddly one

> **Outcome:** done, as seven statements. The ENI tag prediction was
> correct and is the interesting part; `ec2:CreateTags` turned out to
> matter more than anything in the `Delete*` list. See above.

This is the statement that lets this role terminate CatMap's instance. It is
also the one where a wrong answer breaks the apply, so treat it as iterative
rather than a single rewrite.

Split it three ways:

**(a) Reads — leave on `"*"`.** `ec2:Describe*`. Harmless, and required.

**(b) Mutations on resources that already exist — condition on the tag.**

```hcl
Condition = {
  StringEquals = { "aws:ResourceTag/Project" = "jordanscamp" }
}
```

Covers `TerminateInstances`, `StopInstances`, `ModifyInstanceAttribute`,
`Delete*`, `Modify*`, `Detach*`, `Disassociate*`, `Revoke*`, `Release*`.
This is the statement that actually closes the hole.

**(c) Creations — condition on the requested tag.** A resource that does not
exist yet has no `aws:ResourceTag`, so use:

```hcl
Condition = {
  StringEquals = { "aws:RequestTag/Project" = "jordanscamp" }
}
```

and separately allow `ec2:CreateTags` only as part of a create:

```hcl
Condition = {
  StringEquals = { "ec2:CreateAction" = ["RunInstances", "CreateVpc", "CreateSubnet",
                                          "CreateSecurityGroup", "CreateInternetGateway",
                                          "CreateRouteTable", "AllocateAddress", "CreateVolume"] }
}
```

**Known traps, in the order you will hit them:**

- **`RunInstances` authorises every sub-resource separately.** It needs
  permission on `instance/*`, `volume/*`, `network-interface/*`, `subnet/*`,
  `security-group/*`, `image/*` and `key-pair/*`. The `image/*` and `subnet/*`
  entries cannot carry a `Project` tag condition — an AMI is AWS-owned. Grant
  those two unconditionally and tag-condition the rest.
- **`default_tags` does not always tag at create time.** The AWS provider uses
  inline `TagSpecifications` where the API supports it and a follow-up
  `CreateTags` where it does not. Where it does the latter, `aws:RequestTag` on
  the create call is _absent_ and the create is denied. When that happens, the
  fix is to allow that specific create action without the request-tag condition
  but keep the tag condition on its delete — asymmetric, but it is the boundary
  that matters (you care about _destroying_ CatMap, not about creating an
  untagged resource here).
- **Route table and IGW associations** attach two resources; both need to be
  authorised.

**Validate after each sub-step:** `terraform plan` from the laptop must be
clean, then `terraform apply` must succeed. Do **not** use CI as the feedback
loop for this — see §5.

---

## 4. The acceptance test

Narrowing policies is easy to _believe_ you have done. Prove it with the IAM
policy simulator, which answers "can this principal do X to Y" without needing
credentials for the role or touching anything:

```bash
export AWS_PROFILE=catmaps
ROLE=arn:aws:iam::477395207022:role/jordanscamp-prod-github-actions

# Must all come back implicitDeny. Substitute a real CatMap instance id once
# CatMap has one; until then any arn with a catmap tag context works.
aws iam simulate-principal-policy --policy-source-arn "$ROLE" \
  --action-names ec2:TerminateInstances \
  --resource-arns "arn:aws:ec2:eu-west-2:477395207022:instance/i-CATMAP" \
  --resource-policy-source-arn "$ROLE" \
  --query 'EvaluationResults[].EvalDecision'

aws iam simulate-principal-policy --policy-source-arn "$ROLE" \
  --action-names route53:ChangeResourceRecordSets \
  --resource-arns "arn:aws:route53:::hostedzone/Z07439302VMP2210CW0T0" \
  --query 'EvaluationResults[].EvalDecision'

aws iam simulate-principal-policy --policy-source-arn "$ROLE" \
  --action-names ssm:SendCommand \
  --resource-arns "arn:aws:ec2:eu-west-2:477395207022:instance/i-CATMAP" \
  --query 'EvaluationResults[].EvalDecision'
```

`Z07439302VMP2210CW0T0` is CatMap's `catmaps.me` zone. Tag-conditioned denials
need `--context-entries` to simulate the tag; the simulator will report
`implicitDeny` without them, which is the right answer but for a slightly
different reason — worth reading the output rather than just the decision.

Then the positive control, which must come back `allowed`, or you have broken
the deploy:

```bash
aws iam simulate-principal-policy --policy-source-arn "$ROLE" \
  --action-names ssm:SendCommand \
  --resource-arns "arn:aws:ec2:eu-west-2:477395207022:instance/i-04768a73967de4c04" \
  --context-entries 'ContextKeyName=ssm:resourceTag/Project,ContextKeyValues=jordanscamp,ContextKeyType=string' \
  --query 'EvaluationResults[].EvalDecision'
```

Finish by actually running the pipeline: merge, let `terraform.yml` apply, then
run `deploy.yml`, then confirm `https://jordanscamp.site` returns 200.

---

## 5. Hazards specific to this repo

**`terraform.yml` runs `apply -auto-approve` on every push to `main` touching
`infra/**`.\*\* There is no review gate between merge and production. Consequences:

- A broken policy is discovered _in production_, not in review. Apply from the
  laptop first (`AWS_PROFILE=catmaps`), confirm, then merge — do not use the
  merge as your test.
- There is a **bootstrap deadlock** whenever you _add_ a permission the deploy
  role itself needs: the apply that grants it needs it. Break it by applying
  once from the laptop, whose `terraform-user` credentials are not subject to
  the role's policies. This already bit once, with
  `iam:ListOpenIDConnectProviders`.
- Conversely, when you _remove_ a permission, apply from the laptop and then
  immediately verify CI can still plan — the PR plan job on the next PR is the
  check.

**Every infra PR replaces the web server, and it is not your change doing it.**
`aws_instance.app` takes its AMI from a `aws_ssm_parameter` data source
resolving _latest_ AL2023 ARM64. AWS publishes new ones regularly, so `ami`
drifts and `forces replacement`. Combined with auto-apply, every `infra/**`
merge destroys and recreates the box.

It self-heals — `templates/user_data.sh` refetches `webapp.tar.gz` and
`Caddyfile` from `s3://jordanscamp-prod-deploy/_deploy/`, the EIP is a separate
resource so `16.60.63.129` never moves, and Caddy re-obtains its certificate
over HTTP-01 — but it is minutes of avoidable downtime per PR and it makes
every plan you read look alarming.

**Fix this first, before anything in §3.** One line:

```hcl
resource "aws_instance" "app" {
  # ...
  lifecycle {
    ignore_changes = [ami]
  }
}
```

Trade: the instance stops being upgraded by replacement. That is fine — AL2023
patches in place via `dnf`, and a deliberate `terraform taint` still forces a
rebuild when you want one. Doing this first means every subsequent plan in this
plan shows only your IAM changes, which is worth a great deal when you are
iterating on policy conditions.

**The `default` AWS profile on this laptop is an unrelated employer's account.**
`allowed_account_ids` now makes a wrong-account apply fail fast, and the S3
backend is in this account so `init` gets AccessDenied — but always
`export AWS_PROFILE=catmaps` anyway.

---

## 6. Worth doing while you are in here

Not isolation, but adjacent and cheap:

- **`prevent_destroy` on the resources that are painful to lose.** The Elastic
  IP (`aws_eip.app`) — losing it means a new address and a DNS change; and the
  hosted zone (`aws_route53_zone.main`) — destroying it reissues nameservers,
  which means updating the registrar and waiting out propagation. Neither is
  protected today, and a `terraform destroy` here would take both.
- **Delete the orphaned `jordanscamp.site` zone** `Z0321657TI5MQR8EEVXL` — $0.50
  a month, and it is a live trap for anyone who resolves zones by name. Re-read
  the warning in §2 before you touch it.

---

## 7. Definition of done

1. `terraform plan` clean from the laptop and `No changes` from CI's plan job.
2. All three negative simulator checks in §4 return `implicitDeny`.
3. The positive control returns `allowed`.
4. `deploy.yml` runs green and `https://jordanscamp.site` returns 200.
5. `aws_instance.app` no longer appears in a plan when nothing about it changed.
6. Nothing in `infra/` references, reads, or can mutate a resource tagged
   `Project=catmap` — the sole exception being the shared OIDC provider, which
   is read-only and covered in §0.
