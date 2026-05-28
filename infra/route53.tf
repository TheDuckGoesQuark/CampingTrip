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

# digitaltwins.jordanscamp.site → EC2 Elastic IP (Digital Twins via Caddy)
resource "aws_route53_record" "digitaltwins" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.digitaltwins_domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# photobroom.jordanscamp.site → EC2 Elastic IP (PhotoBroom via Caddy)
resource "aws_route53_record" "photobroom" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.photobroom_domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}
