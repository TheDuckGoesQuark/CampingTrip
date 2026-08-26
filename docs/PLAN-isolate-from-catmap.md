# Plan — Isolate jordanscamp from CatMap

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

```
Resource = ["arn:aws:s3:::jordanscamp-*", "arn:aws:s3:::jordanscamp-*/*"]
```

This covers the deploy bucket and the state bucket, and excludes every CatMap
bucket, which will be named `catmap-*`. `s3:ListAllMyBuckets` is not granted
and should stay that way.

**Validate:** as above. Watch for `s3:CreateBucket` — it is authorised against
the bucket ARN, which the prefix covers.

### 3.4 EC2 and VPC — the fiddly one

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
