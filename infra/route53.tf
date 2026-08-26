# -----------------------------------------------------------------------------
# Route53 DNS
# -----------------------------------------------------------------------------

resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = { Name = "${local.name_prefix}-zone" }

  # Destroying a hosted zone reissues its nameservers. Recreating it does not
  # give you the old delegation set back, so recovery means logging into the
  # registrar, updating four NS records by hand, and then waiting out
  # propagation — during which the domain resolves to nothing. That is a
  # people-and-hours problem, not a `terraform apply`, which is the bar for
  # prevent_destroy.
  #
  # Related, and the reason this is worth being careful about: a SECOND
  # `jordanscamp.site` zone exists in this account, Z0321657TI5MQR8EEVXL, and
  # it holds MORE records than this one. It is an orphan. The live zone is
  # Z094957516GTOTOWK1PS3 — the one the registrar's delegation set points at
  # (ns-1111.awsdns-10.org, ns-2024.awsdns-61.co.uk, ns-325.awsdns-40.com,
  # ns-633.awsdns-15.net). Resolve zones by ID against that delegation set,
  # never by name and never by which looks more populated.
  lifecycle {
    prevent_destroy = true
  }
}

# jordanscamp.site (root) → EC2 Elastic IP (serves React app via Caddy)
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}
