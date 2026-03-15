# -----------------------------------------------------------------------------
# CloudWatch — Log groups
# -----------------------------------------------------------------------------

# EC2 bootstrap log (shipped by CloudWatch agent)
resource "aws_cloudwatch_log_group" "ec2" {
  name              = "${local.name_prefix}/ec2"
  retention_in_days = 14
  tags              = { Name = "${local.name_prefix}-ec2-logs" }
}

# Django/Gunicorn container logs
resource "aws_cloudwatch_log_group" "web" {
  name              = "${local.name_prefix}/web"
  retention_in_days = 14
  tags              = { Name = "${local.name_prefix}-web-logs" }
}
