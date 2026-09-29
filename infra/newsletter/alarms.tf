# What emails the owner. Each alarm also sends its recovery, so an inbox
# thread reads as an incident with an end.

locals {
  # Five minutes: long enough that a single cold-start retry does not page,
  # short enough that a broken form is known before a reader gives up.
  alarm_period = 300
}

resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name          = "${var.name_prefix}-newsletter-api-errors"
  alarm_description   = "The subscribe, confirm or unsubscribe endpoint is failing."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.api.function_name }
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.alerts_topic_arn]
  ok_actions          = [var.alerts_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "events_errors" {
  alarm_name          = "${var.name_prefix}-newsletter-events-errors"
  alarm_description   = "A bounce or complaint from SES was not recorded against its subscriber."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.events.function_name }
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.alerts_topic_arn]
  ok_actions          = [var.alerts_topic_arn]
}

# The endpoint logs this one constant line when a day's confirmation emails
# hit the cap and it starts refusing sign-ups. No address is ever logged, so a
# filter on the line is the whole metric.
resource "aws_cloudwatch_log_metric_filter" "confirmation_cap" {
  name           = "${var.name_prefix}-newsletter-confirmation-cap"
  log_group_name = aws_cloudwatch_log_group.api.name
  pattern        = "\"confirmation cap reached\""

  metric_transformation {
    name      = "ConfirmationCapReached"
    namespace = "Jordanscamp/Newsletter"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "confirmation_cap" {
  alarm_name          = "${var.name_prefix}-newsletter-confirmation-cap"
  alarm_description   = "Sign-ups are paused for the day: the confirmation-email cap was reached, which usually means a bot is posting to the form."
  namespace           = aws_cloudwatch_log_metric_filter.confirmation_cap.metric_transformation[0].namespace
  metric_name         = aws_cloudwatch_log_metric_filter.confirmation_cap.metric_transformation[0].name
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.alerts_topic_arn]
}

# Account-wide rates as a fraction of sends. The thresholds are the ones SES's
# own guide recommends alarming at, under the levels that put an account
# under review.
resource "aws_cloudwatch_metric_alarm" "bounce_rate" {
  alarm_name          = "${var.name_prefix}-newsletter-bounce-rate"
  alarm_description   = "The account's hard-bounce rate is at the level SES reviews accounts for."
  namespace           = "AWS/SES"
  metric_name         = "Reputation.BounceRate"
  statistic           = "Average"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = 0.05
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.alerts_topic_arn]
  ok_actions          = [var.alerts_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "complaint_rate" {
  alarm_name          = "${var.name_prefix}-newsletter-complaint-rate"
  alarm_description   = "Readers are marking issues as spam at the rate SES reviews accounts for."
  namespace           = "AWS/SES"
  metric_name         = "Reputation.ComplaintRate"
  statistic           = "Average"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = 0.001
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.alerts_topic_arn]
  ok_actions          = [var.alerts_topic_arn]
}
