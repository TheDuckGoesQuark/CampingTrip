# The sending identity: what a receiving mail server checks before trusting a
# message from this domain, and where SES reports back.

# The apex rather than a subdomain: the From address is then the site's own
# name, at the price of tying the domain's reputation to the newsletter.
resource "aws_sesv2_email_identity" "domain" {
  email_identity         = var.domain_name
  configuration_set_name = aws_sesv2_configuration_set.newsletter.configuration_set_name

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

# The identity is verified only once SES resolves all three of these.
resource "aws_route53_record" "dkim" {
  count = 3

  zone_id = var.zone_id
  name    = "${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

# A MAIL FROM under the apex lets SPF align with the From domain, so DMARC can
# pass on either check. `USE_DEFAULT_VALUE`, not `REJECT_MESSAGE`: SES takes up
# to three days to notice the MX, and reject refuses every send until then,
# while DKIM alone already satisfies DMARC.
resource "aws_sesv2_email_identity_mail_from_attributes" "domain" {
  email_identity = aws_sesv2_email_identity.domain.email_identity

  mail_from_domain       = local.mail_from_domain
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}

locals {
  mail_from_domain = "${var.mail_from_subdomain}.${var.domain_name}"
}

# Exactly one MX: a second on this name fails the SES setup outright.
resource "aws_route53_record" "mail_from_mx" {
  zone_id = var.zone_id
  name    = local.mail_from_domain
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = var.zone_id
  name    = local.mail_from_domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com ~all"]
}

# `p=none` is where a domain that has never sent mail starts: alignment gets
# checked on real messages and a mistake above quarantines nothing. It becomes
# `quarantine` once a few issues have gone out clean. No report address: the
# reports are daily XML digests from every large receiver, and unread.
resource "aws_route53_record" "dmarc" {
  zone_id = var.zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 600
  records = ["v=DMARC1; p=none"]
}

resource "aws_sesv2_configuration_set" "newsletter" {
  configuration_set_name = "${var.name_prefix}-newsletter"

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }

  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }
}

# Bounces and complaints only. A delivery event per recipient is noise, and
# open and click tracking is a choice this site does not make about readers.
resource "aws_sesv2_configuration_set_event_destination" "bounces_and_complaints" {
  configuration_set_name = aws_sesv2_configuration_set.newsletter.configuration_set_name
  event_destination_name = "bounces-and-complaints"

  event_destination {
    enabled              = true
    matching_event_types = ["BOUNCE", "COMPLAINT"]

    sns_destination {
      topic_arn = aws_sns_topic.events.arn
    }
  }
}

# Not the alerts topic: an alarm is for a person and a bounce is for the
# function that marks the subscriber; shared, each would wake the other's reader.
resource "aws_sns_topic" "events" {
  name = "${var.name_prefix}-newsletter-events"

  tags = { Name = "${var.name_prefix}-newsletter-events" }
}

# SES publishes as its service principal; pinned to this account, as alerts.tf.
resource "aws_sns_topic_policy" "events" {
  arn = aws_sns_topic.events.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "SESInThisAccountPublishes"
        Effect    = "Allow"
        Principal = { Service = "ses.amazonaws.com" }
        Action    = "SNS:Publish"
        Resource  = aws_sns_topic.events.arn
        Condition = {
          StringEquals = { "AWS:SourceAccount" = var.account_id }
        }
      },
    ]
  })
}

# Account-wide on purpose: an address that bounced or complained is never mailed
# again by any sender here, whatever the sending code remembers.
resource "aws_sesv2_account_suppression_attributes" "account" {
  suppressed_reasons = ["BOUNCE", "COMPLAINT"]
}
