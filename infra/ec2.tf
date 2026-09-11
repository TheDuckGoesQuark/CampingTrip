# -----------------------------------------------------------------------------
# EC2 — runs Caddy serving the static frontends
# -----------------------------------------------------------------------------

# Latest Amazon Linux 2023 ARM64
data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-arm64"
}

resource "aws_eip" "app" {
  domain = "vpc"

  tags = { Name = "${local.name_prefix}-eip" }

  # Losing this address is not recoverable by re-running Terraform. The A record
  # in route53.tf reads `aws_eip.app.public_ip`, so a destroy-and-recreate hands
  # out a *different* address and every resolver holding the old one keeps
  # sending traffic nowhere until its TTL expires. AWS also does not let you ask
  # for a specific address back.
  #
  # The instance is deliberately NOT protected the same way — it is disposable
  # (user_data.sh rebuilds it from S3), and the EIP being a separate resource is
  # exactly what makes it disposable.
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}

resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023_arm64.value
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  # `file`, not `templatefile` — the Caddyfile is injected verbatim, which is
  # what lets deploy.yml ship that same file to S3 unrendered. Caddy's own
  # placeholders are single-brace (`{path}`, `{uri}`), so nothing in it collides
  # with Terraform's `${...}` anyway.
  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh", {
    aws_region = var.aws_region
    s3_bucket  = aws_s3_bucket.deploy.id
    caddyfile  = file("${path.module}/Caddyfile")
  }))

  tags = {
    Name = "${local.name_prefix}-app"
  }

  # `ami` is read from an SSM parameter that resolves *latest* AL2023, and AWS
  # republishes that parameter regularly. `ami` forces replacement, and
  # terraform.yml runs `apply -auto-approve` on every push to main touching
  # `infra/**`. Composed, those three facts mean an unrelated infra change —
  # an IAM policy edit, a tag — destroys and recreates the web server, because
  # AWS happened to ship a new AMI since the last apply.
  #
  # It self-heals (templates/user_data.sh refetches webapp.tar.gz and the
  # Caddyfile from s3://jordanscamp-prod-deploy/_deploy/, the EIP is a separate
  # resource so the address survives, and Caddy re-obtains its certificate over
  # HTTP-01), so this was never an outage anyone noticed. It is still minutes of
  # avoidable downtime per merge, and it makes every plan you read look alarming
  # — which is the real cost, because it trains you to skim the plan that
  # *should* have been one line.
  #
  # The trade is that the box stops being upgraded by replacement. That is fine:
  # AL2023 patches in place via `dnf`, and `terraform taint aws_instance.app`
  # still forces a deliberate rebuild onto the current AMI when you want one.
  lifecycle {
    # `user_data`, because the Caddyfile is injected into it: the provider
    # answers a change to this field with a stop/start of the instance, and
    # cloud-init has already run and will not run again, so that outage buys
    # nothing. Ignoring it substitutes the prior state only where an object
    # already exists — a replacement still boots from the current config, which
    # is the one moment the baked Caddyfile is read.
    ignore_changes = [ami, user_data]

    # The injected Caddyfile is verbatim, so `var.domain_name` does not reach
    # the config Caddy actually serves — the site names itself. Changing the
    # variable without changing the Caddyfile would otherwise apply cleanly and
    # leave Caddy answering for the old name, and its certificate too.
    precondition {
      condition     = strcontains(file("${path.module}/Caddyfile"), var.domain_name)
      error_message = "infra/Caddyfile does not name ${var.domain_name}; the site block and var.domain_name have to agree."
    }
  }
}
