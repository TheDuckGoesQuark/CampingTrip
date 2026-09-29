# The newsletter module, wired to this zone and account. Its README is the runbook.

module "newsletter" {
  source = "./newsletter"

  name_prefix = local.name_prefix
  domain_name = var.domain_name
  zone_id     = aws_route53_zone.main.zone_id
  aws_region  = var.aws_region
  account_id  = data.aws_caller_identity.current.account_id

  # IAM does not order a policy before the calls it authorises; see contact.tf.
  depends_on = [aws_iam_role_policy.github_terraform_resources]
}

output "newsletter_dkim_status" {
  description = "`SUCCESS` once SES has resolved the three DKIM records; the production-access request waits on it"
  value       = module.newsletter.dkim_status
}
