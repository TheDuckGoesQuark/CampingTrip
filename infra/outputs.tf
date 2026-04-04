# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "ecr_web_repo" {
  description = "ECR repository URL for the web image"
  value       = aws_ecr_repository.web.repository_url
}

output "route53_nameservers" {
  description = "Route53 nameservers — set these at your domain registrar"
  value       = aws_route53_zone.main.name_servers
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID for dynamic DNS updates"
  value       = aws_route53_zone.main.zone_id
}

output "api_url" {
  description = "API URL"
  value       = "https://${local.api_domain}"
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC"
  value       = aws_iam_role.github_actions.arn
}

output "ssm_parameter_name" {
  description = "SSM parameter name for app secrets"
  value       = aws_ssm_parameter.app_secrets.name
}

output "deploy_bucket" {
  description = "S3 bucket for deploy artifacts"
  value       = aws_s3_bucket.deploy.id
}
