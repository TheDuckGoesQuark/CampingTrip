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

output "deploy_bucket" {
  description = "S3 bucket for deploy artifacts"
  value       = aws_s3_bucket.deploy.id
}
