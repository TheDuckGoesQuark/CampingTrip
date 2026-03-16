# -----------------------------------------------------------------------------
# Route53 DNS
# -----------------------------------------------------------------------------

resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = { Name = "${local.name_prefix}-zone" }
}

# jordanscamp.site (root) → EC2 Elastic IP (serves React app via Caddy)
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# api.jordanscamp.site → EC2 Elastic IP (Django via Caddy reverse proxy)
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.api_domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# workout.jordanscamp.site → EC2 Elastic IP (Workout PWA via Caddy)
resource "aws_route53_record" "workout" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.workout_domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}
