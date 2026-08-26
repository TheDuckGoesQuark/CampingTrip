# -----------------------------------------------------------------------------
# IAM — EC2 instance role, GitHub Actions OIDC
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

# --- EC2 instance role ---

resource "aws_iam_role" "ec2" {
  name = "${local.name_prefix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# S3 deploy bucket read
resource "aws_iam_role_policy" "ec2_s3" {
  name = "s3-deploy-read"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:ListBucket",
      ]
      Resource = [
        aws_s3_bucket.deploy.arn,
        "${aws_s3_bucket.deploy.arn}/*",
      ]
    }]
  })
}

# SSM for remote command execution (used by CI/CD deploy)
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch agent
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# --- GitHub Actions OIDC ---

# Read, not declared. This fixes a real outage, so it is worth the paragraph.
#
# `aws_iam_openid_connect_provider` for token.actions.githubusercontent.com is
# an **account-level singleton**. This configuration declared it as a resource,
# and so did a sibling project sharing the account (CatMap). Two configurations,
# one AWS resource, and whichever applied last owned it. On 18 Aug 2026 CatMap's
# `terraform destroy` deleted it, and with it this repo's ability to assume any
# deploy role. The site never noticed — Caddy was already serving static files
# from disk — but every workflow here failed at "configure AWS credentials" from
# that day on.
#
# It exists again, recreated 26 Aug 2026 under `catmap/infra/shared/`: a state
# holding nothing else, precisely so that a destroy aimed at an application
# cannot reach it. That makes this repo's claim stale but *accidentally true*,
# which is the worst kind of stale — everything works, and the next teardown in
# either project repeats the outage.
#
# It was still actively fighting. Today's plan wanted to retag the provider
# `Project=jordanscamp`, over the `Project=shared` that `catmap/infra/shared/`
# sets: two owners flipping one resource's tags on every apply.
#
# So: exactly one owner, and it is neither project's application config. The
# accompanying `terraform state rm` dropped the claim without touching the live
# resource, and was run *before* this change reached main. The reverse order is
# a config that omits a resource still present in state, which plans as a
# destroy — reproducing the original incident precisely.
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_role" "github_actions" {
  name = "${local.name_prefix}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        # Only these two contexts may assume the role. Notably this EXCLUDES
        # `:pull_request`, so a PR (including from a fork) can never assume it.
        #   - ref:refs/heads/main   → pushes to main (terraform apply) + main-dispatched infra-control
        #   - environment:production → the deploy workflow's production environment
        StringLike = {
          "token.actions.githubusercontent.com:sub" = [
            "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main",
            "repo:${var.github_org}/${var.github_repo}:environment:production",
          ]
        }
      }
    }]
  })
}

# --- GitHub Actions: read-only role for PR plan previews ---
# Assumable ONLY from the pull_request context, and the terraform.yml plan job
# further gates itself to same-repo PRs. This role is read-only regardless, so
# the worst a PR's plan can do is read (state included) — never mutate.
resource "aws_iam_role" "github_actions_plan" {
  name = "${local.name_prefix}-github-actions-plan"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:pull_request"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_plan_readonly" {
  name = "terraform-plan-readonly"
  role = aws_iam_role.github_actions_plan.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadResources"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "route53:GetHostedZone",
          "route53:ListHostedZones",
          "route53:ListResourceRecordSets",
          "route53:GetChange",
          "route53:ListTagsForResource",
          "iam:GetRole",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRolePolicy",
          "iam:GetInstanceProfile",
          "iam:GetOpenIDConnectProvider",
          # Required by the `data "aws_iam_openid_connect_provider"` lookup,
          # which resolves by URL and therefore *lists* before it gets. Without
          # it the data source fails with AccessDenied on
          # `iam:ListOpenIDConnectProviders` and no plan can be produced at all.
          # It takes no resource scope — the error names `oidc-provider/*` even
          # when one ARN is requested — and it returns nothing but a list of
          # provider ARNs.
          "iam:ListOpenIDConnectProviders",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:ListInstanceProfilesForRole",
          "s3:GetBucket*",
          "s3:GetAccelerateConfiguration",
          "s3:GetEncryptionConfiguration",
          "s3:GetLifecycleConfiguration",
          "s3:GetReplicationConfiguration",
          "s3:ListBucket",
          "logs:DescribeLogGroups",
          "logs:ListTagsForResource",
          "logs:ListTagsLogGroup",
          "ssm:GetParameter",
          "ssm:GetParameters",
        ]
        Resource = "*"
      },
      {
        Sid    = "ReadTerraformState"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
        ]
        Resource = [
          "arn:aws:s3:::jordanscamp-terraform-state",
          "arn:aws:s3:::jordanscamp-terraform-state/*",
        ]
      }
    ]
  })
}

# GitHub Actions: SSM Run Command on EC2 for deploys
#
# This held `ssm:SendCommand` on `"*"`, which in a *shared* account is root
# shell on every managed node in it — not just this project's. That is fine
# right up to the moment a second project puts an instance here, which CatMap is
# about to do. Same finding, same fix as `catmap/infra/iam.tf`.
#
# SendCommand authorises the document and the target separately, so both need
# granting; the tag condition on the instance statement is what narrows the
# target. `ssm:resourceTag/`, not `aws:ResourceTag/`, because the SSM guide
# notes that a *global* condition key on SendCommand additionally requires an
# `aws:ViaAWSService` condition.
resource "aws_iam_role_policy" "github_ssm" {
  name = "ssm-deploy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # The only document deploy.yml sends. AWS-owned, so the ARN carries no
        # account id — the empty field is correct, not a missing interpolation.
        Sid      = "RunShellScriptDocumentOnly"
        Effect   = "Allow"
        Action   = "ssm:SendCommand"
        Resource = "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript"
      },
      {
        # `Project` comes from the provider's default_tags, so every instance
        # this configuration creates carries it and CatMap's do not.
        Sid      = "TargetOnlyThisProjectsInstances"
        Effect   = "Allow"
        Action   = "ssm:SendCommand"
        Resource = "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/*"
        Condition = {
          StringEquals = {
            "ssm:resourceTag/Project" = "jordanscamp"
          }
        }
      },
      {
        # Reads, to poll the command to completion. Neither supports
        # resource-level permissions, and the authorisation that matters already
        # happened on SendCommand above.
        Sid    = "PollTheResult"
        Effect = "Allow"
        Action = [
          "ssm:GetCommandInvocation",
          "ssm:DescribeInstanceInformation",
        ]
        Resource = "*"
      },
    ]
  })
}

# GitHub Actions: start/stop EC2 for cost management
resource "aws_iam_role_policy" "github_ec2_control" {
  name = "ec2-start-stop"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances",
      ]
      Resource = "*"
      Condition = {
        StringEquals = {
          "aws:ResourceTag/Project" = "jordanscamp"
        }
      }
      },
      {
        Effect   = "Allow"
        Action   = "ec2:DescribeInstances"
        Resource = "*"
    }]
  })
}

# GitHub Actions: upload webapp bundle to S3
resource "aws_iam_role_policy" "github_s3_deploy" {
  name = "s3-webapp-deploy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
      ]
      Resource = "${aws_s3_bucket.deploy.arn}/*"
    }]
  })
}

# GitHub Actions: Terraform state access (S3 backend + DynamoDB locks)
resource "aws_iam_role_policy" "github_terraform_state" {
  name = "terraform-state"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          "arn:aws:s3:::jordanscamp-terraform-state",
          "arn:aws:s3:::jordanscamp-terraform-state/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:*:table/jordanscamp-terraform-locks"
      }
    ]
  })
}

# GitHub Actions: Terraform resource management
# Scoped to the services Terraform manages for this project
resource "aws_iam_role_policy" "github_terraform_resources" {
  name = "terraform-resources"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EC2andVPC"
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "ec2:CreateTags",
          "ec2:*SecurityGroup*",
          "ec2:*Subnet*",
          "ec2:*Vpc*",
          "ec2:*InternetGateway*",
          "ec2:*RouteTable*",
          "ec2:*Address*",
          "ec2:*Instance*",
          "ec2:*Volume*",
          "ec2:*NetworkInterface*",
          "ec2:ModifyInstanceAttribute",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
        ]
        Resource = "*"
      },
      {
        # Reads. `ListHostedZones` and `GetChange` take no resource at all, and
        # the rest buy nothing from being narrowed — knowing that catmaps.me
        # exists is not the capability anyone is worried about.
        Sid    = "Route53Read"
        Effect = "Allow"
        Action = [
          "route53:GetHostedZone",
          "route53:ListHostedZones",
          "route53:ListResourceRecordSets",
          "route53:GetChange",
          "route53:ListTagsForResource",
        ]
        Resource = "*"
      },
      {
        # The capability anyone *is* worried about. On `"*"` this granted the
        # deploy role authority to rewrite every hosted zone in a shared
        # account, catmaps.me included — a CI compromise here could have
        # repointed the sibling project's domain. Record changes are scopable to
        # a hosted zone ARN, so scope them.
        #
        # The zone id is taken as a reference rather than written literally
        # (the plan's §3.1 spells out Z094957516GTOTOWK1PS3). Both work, and the
        # reference is known at plan time with no dependency cycle — the zone
        # does not depend on IAM. It avoids a second copy of an identifier that
        # already has a source of truth twelve lines away in route53.tf, and if
        # the zone is ever legitimately rebuilt the policy follows it instead of
        # silently authorising a zone that no longer exists.
        Sid    = "Route53WriteThisZoneOnly"
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:ChangeTagsForResource",
        ]
        Resource = "arn:aws:route53:::hostedzone/${aws_route53_zone.main.zone_id}"
      },
      # `route53:CreateHostedZone` is deleted rather than narrowed. It cannot be
      # scoped — there is no resource yet to name — and there is no legitimate
      # caller: the one zone this project needs already exists, is managed here,
      # and now carries `prevent_destroy`. A CI job creating a second
      # `jordanscamp.site` zone is not a feature; this account already contains
      # one such orphan (Z0321657TI5MQR8EEVXL, see route53.tf) and it is a trap.
      #
      # If the zone ever genuinely needs rebuilding, that is a laptop apply with
      # terraform-user credentials followed by a registrar visit — deliberate,
      # not something a merge should be able to do.
      {
        # Read-only introspection — harmless, and some (GetPolicy on AWS-managed
        # policies) legitimately need account-wide scope.
        Sid    = "IAMRead"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRolePolicy",
          "iam:GetInstanceProfile",
          "iam:GetOpenIDConnectProvider",
          # Required by the `data "aws_iam_openid_connect_provider"` lookup,
          # which resolves by URL and therefore *lists* before it gets. Without
          # it the data source fails with AccessDenied on
          # `iam:ListOpenIDConnectProviders` and no plan can be produced at all.
          # It takes no resource scope — the error names `oidc-provider/*` even
          # when one ARN is requested — and it returns nothing but a list of
          # provider ARNs.
          "iam:ListOpenIDConnectProviders",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:ListInstanceProfilesForRole",
        ]
        Resource = "*"
      },
      {
        # Mutating role/instance-profile actions are scoped to this project's
        # resources only, so a compromise can't create/alter arbitrary roles.
        Sid    = "IAMManageProjectRoles"
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:UpdateRole",
          "iam:DeleteRole",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:TagRole",
          "iam:PassRole",
          "iam:CreateInstanceProfile",
          "iam:DeleteInstanceProfile",
          "iam:AddRoleToInstanceProfile",
          "iam:RemoveRoleFromInstanceProfile",
        ]
        Resource = [
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-*",
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:instance-profile/${local.name_prefix}-*",
        ]
      },
      # The `IAMManageOIDCProvider` statement that was here is deleted, not
      # narrowed. It granted `iam:DeleteOpenIDConnectProvider` on the shared
      # provider — which is the precise capability that caused the 18 Aug
      # outage, and nothing in this configuration manages that resource any
      # more: it is a `data` source now. Leaving the grant would mean CI could
      # still delete it while Terraform no longer even knows it is there, which
      # is a worse position than before, not a better one.
      #
      # `iam:GetOpenIDConnectProvider` stays, in `IAMRead` above — the data
      # source needs it.
      {
        Sid    = "S3"
        Effect = "Allow"
        Action = [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:GetBucketPolicy",
          "s3:PutBucketPolicy",
          "s3:GetBucketAcl",
          "s3:GetBucketVersioning",
          "s3:PutBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketTagging",
          "s3:PutBucketTagging",
          "s3:GetLifecycleConfiguration",
          "s3:PutLifecycleConfiguration",
          "s3:GetEncryptionConfiguration",
          "s3:PutEncryptionConfiguration",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketPublicAccessBlock",
          "s3:GetBucketObjectLockConfiguration",
          "s3:GetBucketCORS",
          "s3:GetBucketWebsite",
          "s3:GetBucketRequestPayment",
          "s3:GetAccelerateConfiguration",
          "s3:GetReplicationConfiguration",
          "s3:ListBucket",
        ]
        Resource = "*"
      },
      {
        # `logs:DescribeLogGroups` does not support resource-level permissions —
        # it is the *enumeration* call, so there is no single resource to
        # authorise against, and AWS rejects a policy that tries. It has to stay
        # on `"*"`, and it is the one that has to: without it no plan can
        # refresh the log group at all.
        Sid      = "CloudWatchLogsEnumerate"
        Effect   = "Allow"
        Action   = "logs:DescribeLogGroups"
        Resource = "*"
      },
      {
        # Everything that touches a specific log group, scoped by name prefix.
        # On `"*"` this included `logs:DeleteLogGroup`, i.e. authority to delete
        # CatMap's logs — quietly destructive in a way nobody would notice until
        # they went looking for them.
        #
        # Both ARN forms are listed deliberately. CloudWatch Logs is
        # inconsistent about it: some actions authorise against the bare
        # log-group ARN, others against the `:*` suffixed form that notionally
        # covers the log *streams* underneath. Granting one and not the other
        # produces an AccessDenied that names an ARN differing from the policy
        # only by two characters, which is a genuinely unpleasant hour. The
        # suffixed form adds no reach here — it is the same log groups.
        Sid    = "CloudWatchLogsThisProjectOnly"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:DeleteLogGroup",
          "logs:PutRetentionPolicy",
          "logs:TagResource",
          "logs:ListTagsForResource",
          "logs:ListTagsLogGroup",
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${local.name_prefix}/*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${local.name_prefix}/*:*",
        ]
      },
      {
        Sid    = "SSMParameters"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
        ]
        Resource = "arn:aws:ssm:${var.aws_region}::parameter/aws/service/ami-amazon-linux-latest/*"
      }
    ]
  })
}
