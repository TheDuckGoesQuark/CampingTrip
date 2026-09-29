# The public endpoint: subscribe, confirm, unsubscribe. Same shape as the
# contact function in ../contact.tf, whose comments cover the Function URL's
# two grants, the concurrency ceiling and the log group's retention.

resource "aws_iam_role" "api" {
  name = "${var.name_prefix}-newsletter-api-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Rows and the two token indexes, and sending as this one identity through
# this one configuration set. `SendEmail` is checked against both ARNs.
resource "aws_iam_role_policy" "api" {
  name = "list-and-send"
  role = aws_iam_role.api.id

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
        Effect = "Allow"
        Action = "ses:SendEmail"
        Resource = [
          aws_sesv2_email_identity.domain.arn,
          aws_sesv2_configuration_set.newsletter.arn,
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_logs" {
  role       = aws_iam_role.api.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${var.name_prefix}-newsletter-api"
  retention_in_days = 14
}

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/newsletter-api"
  excludes    = ["accept.test.mjs"]
  output_path = "${path.module}/../.terraform/newsletter-api.zip"
}

resource "aws_lambda_function" "api" {
  function_name = "${var.name_prefix}-newsletter-api"
  role          = aws_iam_role.api.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 10

  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256

  reserved_concurrent_executions = 2

  environment {
    variables = {
      TABLE_NAME          = aws_dynamodb_table.list.name
      FROM                = var.from_address
      REPLY_TO            = var.reply_to
      CONFIGURATION_SET   = aws_sesv2_configuration_set.newsletter.configuration_set_name
      SITE_ORIGIN         = var.site_origin
      CONSENT_VERSION     = var.consent_version
      CONFIRM_CAP_PER_DAY = tostring(var.confirm_cap_per_day)
    }
  }

  depends_on = [aws_cloudwatch_log_group.api]
}

resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "api_public_invoke" {
  statement_id  = "AllowPublicInvokeViaUrl"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "*"
}
