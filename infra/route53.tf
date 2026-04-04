# -----------------------------------------------------------------------------
# Route53 DNS
# -----------------------------------------------------------------------------

resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = { Name = "${local.name_prefix}-zone" }
}

# DNS A records are managed dynamically by the EC2 instance on boot
# via a systemd service that updates Route53 with the current public IP.
# This avoids paying for an Elastic IP ($3.65/month).
