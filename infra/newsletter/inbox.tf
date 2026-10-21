# The check's inbox: one subdomain SES receives mail for, each message written
# whole to a bucket for the newsletter check in CI. The apex keeps no MX.

locals {
  inbox_domain   = "${var.inbox_subdomain}.${var.domain_name}"
  inbox_rule_set = "${var.name_prefix}-newsletter-inbox"
  inbox_rule     = "store"

  # Built rather than read from the rule: SES checks it can write to the
  # bucket when the rule is created, so the policy must exist first, and a
  # policy that referenced the rule's ARN would wait on the rule.
  inbox_rule_arn = "arn:aws:ses:${var.aws_region}:${var.account_id}:receipt-rule-set/${local.inbox_rule_set}:receipt-rule/${local.inbox_rule}"
}

# The subdomain inherits the apex's verification, so it needs no identity.
resource "aws_route53_record" "inbox_mx" {
  zone_id = var.zone_id
  name    = local.inbox_domain
  type    = "MX"
  ttl     = 600
  records = ["10 inbound-smtp.${var.aws_region}.amazonaws.com"]
}

resource "aws_s3_bucket" "inbox" {
  bucket = "${var.name_prefix}-newsletter-inbox"

  tags = { Name = "${var.name_prefix}-newsletter-inbox" }
}

resource "aws_s3_bucket_public_access_block" "inbox" {
  bucket = aws_s3_bucket.inbox.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# The check deletes what it reads; this is for a run that failed before it could.
resource "aws_s3_bucket_lifecycle_configuration" "inbox" {
  bucket = aws_s3_bucket.inbox.id

  rule {
    id     = "expire-received-mail"
    status = "Enabled"

    filter {}

    expiration {
      days = 1
    }
  }
}

# Pinned to this account and this rule, so no other account's rule set can write here.
resource "aws_s3_bucket_policy" "inbox" {
  bucket = aws_s3_bucket.inbox.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowSESPuts"
      Effect    = "Allow"
      Principal = { Service = "ses.amazonaws.com" }
      Action    = "s3:PutObject"
      Resource  = "${aws_s3_bucket.inbox.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceAccount" = var.account_id
          "AWS:SourceArn"     = local.inbox_rule_arn
        }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.inbox]
}

resource "aws_ses_receipt_rule_set" "inbox" {
  rule_set_name = local.inbox_rule_set
}

# A region has one active rule set, for the whole account.
resource "aws_ses_active_receipt_rule_set" "inbox" {
  rule_set_name = aws_ses_receipt_rule_set.inbox.rule_set_name
}

resource "aws_ses_receipt_rule" "inbox" {
  name          = local.inbox_rule
  rule_set_name = aws_ses_receipt_rule_set.inbox.rule_set_name
  recipients    = [local.inbox_domain]
  enabled       = true
  scan_enabled  = true
  tls_policy    = "Optional"

  s3_action {
    bucket_name       = aws_s3_bucket.inbox.bucket
    object_key_prefix = "inbox/"
    position          = 1
  }

  depends_on = [aws_s3_bucket_policy.inbox]
}
