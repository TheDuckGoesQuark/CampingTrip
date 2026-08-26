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

  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh", {
    aws_region  = var.aws_region
    s3_bucket   = aws_s3_bucket.deploy.id
    domain_name = var.domain_name
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
    ignore_changes = [ami]
  }
}
