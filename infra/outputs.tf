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

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
}

output "ecr_web_repo" {
  description = "ECR repository URL for the web image"
  value       = aws_ecr_repository.web.repository_url
}

output "route53_nameservers" {
  description = "Route53 nameservers — set these at your domain registrar"
  value       = aws_route53_zone.main.name_servers
}

output "api_url" {
  description = "API URL"
  value       = "https://${local.api_domain}"
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC"
  value       = aws_iam_role.github_actions.arn
}

output "secrets_arn" {
  description = "Secrets Manager ARN"
  value       = aws_secretsmanager_secret.app.arn
}

output "deploy_bucket" {
  description = "S3 bucket for deploy artifacts"
  value       = aws_s3_bucket.deploy.id
}
