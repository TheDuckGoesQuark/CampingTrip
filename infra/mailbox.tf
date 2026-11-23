# The site's public addresses. SES receives mail for them at the apex, writes
# each message to a bucket, and a function resends it to a private inbox, so
# the address a page shows can be retired without the inbox behind it moving.

locals {
  mailbox_aliases = [
    "jordan@${var.domain_name}",
    "hello@${var.domain_name}",
  ]
  mailbox_name = "${local.name_prefix}-mailbox"
  mailbox_rule = "forward"

  # Built rather than read from the rule, for the reason `inbox.tf` gives.
  mailbox_rule_arn = "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:receipt-rule-set/${module.newsletter.inbox_rule_set}:receipt-rule/${local.mailbox_rule}"
}

resource "aws_route53_record" "mailbox_mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 600
  records = ["10 inbound-smtp.${var.aws_region}.amazonaws.com"]
}

resource "aws_s3_bucket" "mailbox" {
  bucket = local.mailbox_name

  tags = { Name = local.mailbox_name }
}

resource "aws_s3_bucket_public_access_block" "mailbox" {
  bucket = aws_s3_bucket.mailbox.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Long enough to read a message by hand after the forwarding alarm fires.
resource "aws_s3_bucket_lifecycle_configuration" "mailbox" {
  bucket = aws_s3_bucket.mailbox.id

  rule {
    id     = "expire-received-mail"
    status = "Enabled"

    filter {}

    expiration {
      days = 14
    }
  }
}

resource "aws_s3_bucket_policy" "mailbox" {
  bucket = aws_s3_bucket.mailbox.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowSESPuts"
      Effect    = "Allow"
      Principal = { Service = "ses.amazonaws.com" }
      Action    = "s3:PutObject"
      Resource  = "${aws_s3_bucket.mailbox.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          "AWS:SourceArn"     = local.mailbox_rule_arn
        }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.mailbox]
}

resource "aws_iam_role" "mailbox" {
  name = "${local.mailbox_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "mailbox_forward" {
  name = "read-and-forward"
  role = aws_iam_role.mailbox.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.mailbox.arn}/*"
      },
      {
        # The configuration set is the identity's default, so SES authorises
        # the send against it as well as against the identity.
        Effect = "Allow"
        Action = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = [
          replace(module.newsletter.identity_arn, "/identity/.*$/", "identity/*"),
          "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:configuration-set/${module.newsletter.configuration_set_name}",
        ]
        Condition = {
          StringEquals = { "ses:FromAddress" = local.mailbox_aliases }
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "mailbox_logs" {
  role       = aws_iam_role.mailbox.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "mailbox" {
  name              = "/aws/lambda/${local.mailbox_name}"
  retention_in_days = 14

  depends_on = [aws_iam_role_policy.github_terraform_resources]
}

data "archive_file" "mailbox" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/mailbox"
  output_path = "${path.module}/.terraform/mailbox.zip"
}

resource "aws_lambda_function" "mailbox" {
  function_name = local.mailbox_name
  role          = aws_iam_role.mailbox.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 30
  # A message is held in memory twice while it is readdressed, and SES accepts
  # up to 40 MB.
  memory_size = 512

  filename         = data.archive_file.mailbox.output_path
  source_code_hash = data.archive_file.mailbox.output_base64sha256

  # Anyone can send mail here, so this is the ceiling on what a flood costs.
  reserved_concurrent_executions = 2

  environment {
    variables = {
      BUCKET     = aws_s3_bucket.mailbox.bucket
      KEY_PREFIX = "received/"
      ALIASES    = join(",", local.mailbox_aliases)
      FORWARD_TO = var.contact_email
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.mailbox,
    aws_iam_role_policy.github_terraform_resources,
  ]
}

resource "aws_lambda_permission" "mailbox_ses" {
  statement_id   = "AllowSESInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.mailbox.function_name
  principal      = "ses.amazonaws.com"
  source_account = data.aws_caller_identity.current.account_id
  source_arn     = local.mailbox_rule_arn
}

# In the newsletter's rule set because a region has one active set for the
# whole account.
resource "aws_ses_receipt_rule" "mailbox" {
  name          = local.mailbox_rule
  rule_set_name = module.newsletter.inbox_rule_set
  recipients    = local.mailbox_aliases
  enabled       = true
  scan_enabled  = true
  tls_policy    = "Optional"

  s3_action {
    bucket_name       = aws_s3_bucket.mailbox.bucket
    object_key_prefix = "received/"
    position          = 1
  }

  lambda_action {
    function_arn    = aws_lambda_function.mailbox.arn
    invocation_type = "Event"
    position        = 2
  }

  depends_on = [
    aws_s3_bucket_policy.mailbox,
    aws_lambda_permission.mailbox_ses,
  ]
}

resource "aws_cloudwatch_metric_alarm" "mailbox_errors" {
  alarm_name          = "${local.mailbox_name}-errors"
  alarm_description   = "Mail to a public address was received but not forwarded. It is in the mailbox bucket until it expires."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.mailbox.function_name }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
