# Marks a subscriber when SES reports a hard bounce or a complaint, so the
# next issue skips them whatever the account-level suppression list does.

resource "aws_iam_role" "events" {
  name = "${var.name_prefix}-newsletter-events-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "events" {
  name = "mark-subscribers"
  role = aws_iam_role.events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "dynamodb:UpdateItem"
      Resource = aws_dynamodb_table.list.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "events_logs" {
  role       = aws_iam_role.events.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "events" {
  name              = "/aws/lambda/${var.name_prefix}-newsletter-events"
  retention_in_days = 14
}

data "archive_file" "events" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/newsletter-events"
  excludes    = ["markings.test.mjs"]
  output_path = "${path.module}/../.terraform/newsletter-events.zip"
}

resource "aws_lambda_function" "events" {
  function_name = "${var.name_prefix}-newsletter-events"
  role          = aws_iam_role.events.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 10

  filename         = data.archive_file.events.output_path
  source_code_hash = data.archive_file.events.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.list.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.events]
}

resource "aws_sns_topic_subscription" "events" {
  topic_arn = aws_sns_topic.events.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.events.arn
}

resource "aws_lambda_permission" "events_from_sns" {
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.events.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.events.arn
}
