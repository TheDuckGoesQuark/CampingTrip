# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "elastic_ip" {
  description = "Elastic IP address for the EC2 instance"
  value       = aws_eip.app.public_ip
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "route53_nameservers" {
  description = "Route53 nameservers — set these at your domain registrar"
  value       = aws_route53_zone.main.name_servers
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_plan_role_arn" {
  description = "Read-only IAM role ARN for PR plan previews — set this as the AWS_PLAN_ROLE_ARN repo variable"
  value       = aws_iam_role.github_actions_plan.arn
}

output "deploy_bucket" {
  description = "S3 bucket for deploy artifacts"
  value       = aws_s3_bucket.deploy.id
}

# Paste this into `infra/Caddyfile`'s `reverse_proxy`. It is only known after the
# function exists, and the Caddyfile ships as a static file from the repo, so the
# endpoint and the proxy in front of it cannot land in one change.
output "contact_function_url" {
  description = "The contact Lambda's Function URL"
  value       = aws_lambda_function_url.contact.function_url
}
