# -----------------------------------------------------------------------------
# EC2 — runs web server, Redis, and Caddy
# -----------------------------------------------------------------------------

# Latest Amazon Linux 2023 ARM64
data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-arm64"
}

resource "aws_eip" "app" {
  domain = "vpc"

  tags = { Name = "${local.name_prefix}-eip" }
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
    aws_region          = var.aws_region
    ecr_web_repo        = aws_ecr_repository.web.repository_url
    secret_arn          = aws_secretsmanager_secret.app.arn
    s3_bucket           = aws_s3_bucket.deploy.id
    api_domain          = local.api_domain
    workout_domain      = local.workout_domain
    digitaltwins_domain = local.digitaltwins_domain
    redis_url           = "redis://redis:6379/0"
    domain_name         = var.domain_name
    allowed_hosts       = "${local.api_domain},localhost"
    cors_origins        = "https://${local.api_domain},https://${var.domain_name},https://${local.workout_domain},https://${local.digitaltwins_domain}"
  }))

  tags = {
    Name = "${local.name_prefix}-app"
  }
}
