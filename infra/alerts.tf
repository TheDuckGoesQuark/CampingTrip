# Alerts: one SNS topic for every alarm and event rule, emailed to the owner.
# Not the contact topic: a visitor's note and an alarm must not drown each other.

resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = { Name = "${local.name_prefix}-alerts" }

  # IAM does not order a policy before the calls it authorises; see contact.tf.
  depends_on = [aws_iam_role_policy.github_terraform_resources]
}

# Alarms and rules publish as their service principal, not as this account, so
# they are admitted by name and pinned to this account: without the condition,
# any alarm anywhere could post here once it knew the ARN.
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "ServicesInThisAccountPublish"
        Effect    = "Allow"
        Principal = { Service = ["cloudwatch.amazonaws.com", "events.amazonaws.com"] }
        Action    = "SNS:Publish"
        Resource  = aws_sns_topic.alerts.arn
        Condition = {
          StringEquals = { "AWS:SourceAccount" = data.aws_caller_identity.current.account_id }
        }
      },
    ]
  })
}

# Stays `pending confirmation` until the emailed link is clicked, as contact.tf
# describes, and no alarm reaches anyone before that.
resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
