# Sending an issue: `send` claims the issue and enqueues one message per
# active subscriber; `worker` drains the queue into SES. CI invokes `send`;
# nothing else does.

# --- The queue ---

resource "aws_sqs_queue" "send_dlq" {
  name                      = "${var.name_prefix}-newsletter-send-dlq"
  message_retention_seconds = 14 * 24 * 60 * 60
}

resource "aws_sqs_queue" "send" {
  name = "${var.name_prefix}-newsletter-send"

  # Six times the worker's timeout, Lambda's own guidance for a queue trigger,
  # so a message is never handed to a second worker while the first still
  # holds it.
  visibility_timeout_seconds = 6 * local.worker_timeout_s
  message_retention_seconds  = 24 * 60 * 60

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.send_dlq.arn
    maxReceiveCount     = 3
  })
}

locals {
  worker_timeout_s = 30
}

# --- send ---

resource "aws_iam_role" "send" {
  name = "${var.name_prefix}-newsletter-send-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "send" {
  name = "claim-and-enqueue"
  role = aws_iam_role.send.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
        ]
        Resource = local.table_arns
      },
      {
        Effect   = "Allow"
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.send.arn
      },
      {
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${var.deploy_bucket_arn}/_newsletter/*"
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "send_logs" {
  role       = aws_iam_role.send.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "send" {
  name              = "/aws/lambda/${var.name_prefix}-newsletter-send"
  retention_in_days = 14
}

data "archive_file" "send" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/newsletter-send"
  excludes    = ["command.test.mjs"]
  output_path = "${path.module}/../.terraform/newsletter-send.zip"
}

resource "aws_lambda_function" "send" {
  function_name = "${var.name_prefix}-newsletter-send"
  role          = aws_iam_role.send.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 120

  filename         = data.archive_file.send.output_path
  source_code_hash = data.archive_file.send.output_base64sha256

  # One at a time: a second concurrent send of the same issue is what the
  # claim exists to refuse, and there is no reason to let it race the first.
  reserved_concurrent_executions = 1

  environment {
    variables = {
      TABLE_NAME      = aws_dynamodb_table.list.name
      QUEUE_URL       = aws_sqs_queue.send.url
      BUCKET          = var.deploy_bucket_name
      TEST_RECIPIENTS = join(",", var.test_recipients)
    }
  }

  depends_on = [aws_cloudwatch_log_group.send]
}

# --- worker ---

resource "aws_iam_role" "worker" {
  name = "${var.name_prefix}-newsletter-worker-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "worker" {
  name = "drain-and-send"
  role = aws_iam_role.worker.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility",
        ]
        Resource = aws_sqs_queue.send.arn
      },
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem"]
        Resource = aws_dynamodb_table.list.arn
      },
      {
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${var.deploy_bucket_arn}/_newsletter/*"
      },
      local.send_email_statement,
    ]
  })
}

resource "aws_iam_role_policy_attachment" "worker_logs" {
  role       = aws_iam_role.worker.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/lambda/${var.name_prefix}-newsletter-worker"
  retention_in_days = 14
}

data "archive_file" "worker" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/newsletter-worker"
  excludes    = ["message.test.mjs"]
  output_path = "${path.module}/../.terraform/newsletter-worker.zip"
}

resource "aws_lambda_function" "worker" {
  function_name = "${var.name_prefix}-newsletter-worker"
  role          = aws_iam_role.worker.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = local.worker_timeout_s

  filename         = data.archive_file.worker.output_path
  source_code_hash = data.archive_file.worker.output_base64sha256

  # Two workers, ten recipients each: well inside any SES rate the account
  # will be granted, and a ceiling on what a runaway queue can cost.
  reserved_concurrent_executions = 2

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.list.name
      BUCKET            = var.deploy_bucket_name
      FROM              = var.from_address
      REPLY_TO          = var.reply_to
      CONFIGURATION_SET = aws_sesv2_configuration_set.newsletter.configuration_set_name
      SITE_ORIGIN       = var.site_origin
    }
  }

  depends_on = [aws_cloudwatch_log_group.worker]
}

# A failed recipient fails alone: the worker reports which messages it could
# not send and the rest of the batch is deleted, so one bad address cannot
# hold nine good ones in the queue.
resource "aws_lambda_event_source_mapping" "worker" {
  event_source_arn        = aws_sqs_queue.send.arn
  function_name           = aws_lambda_function.worker.arn
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]

  scaling_config {
    maximum_concurrency = 2
  }
}

# --- Alarms ---

resource "aws_cloudwatch_metric_alarm" "send_errors" {
  alarm_name          = "${var.name_prefix}-newsletter-send-errors"
  alarm_description   = "Claiming or enqueuing an issue failed; nothing may have gone out."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.send.function_name }
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.alerts_topic_arn]
  ok_actions          = [var.alerts_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "worker_errors" {
  alarm_name          = "${var.name_prefix}-newsletter-worker-errors"
  alarm_description   = "A batch of issue emails failed outright; the messages return to the queue."
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.worker.function_name }
  statistic           = "Sum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.alerts_topic_arn]
  ok_actions          = [var.alerts_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "send_dlq" {
  alarm_name          = "${var.name_prefix}-newsletter-send-dlq"
  alarm_description   = "A recipient's issue email failed three times and is parked in the dead-letter queue."
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  dimensions          = { QueueName = aws_sqs_queue.send_dlq.name }
  statistic           = "Maximum"
  period              = local.alarm_period
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.alerts_topic_arn]
  ok_actions          = [var.alerts_topic_arn]
}
