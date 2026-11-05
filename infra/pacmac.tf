# -----------------------------------------------------------------------------
# MacMan's leaderboard: a table, a Lambda, a Function URL
#
# The same shape as contact.tf, whose comments cover the Function URL's two
# grants, the concurrency ceiling, the log group and the permissions race the
# `depends_on` lines answer. The game keeps its own scores in the browser and
# falls back to them whenever this is unreachable, so nothing here is critical.
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "pacmac_scores" {
  name         = "${local.name_prefix}-pacmac-scores"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  # Only the day's write counters carry `ttl`; board entries are kept.
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = { Name = "${local.name_prefix}-pacmac-scores" }

  depends_on = [aws_iam_role_policy.github_terraform_resources]
}

resource "aws_iam_role" "pacmac_scores" {
  name = "${local.name_prefix}-pacmac-scores-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# This one table, and only the calls `table.mjs` makes: no scan, no delete.
resource "aws_iam_role_policy" "pacmac_scores_table" {
  name = "scores-table"
  role = aws_iam_role.pacmac_scores.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:Query", "dynamodb:PutItem", "dynamodb:UpdateItem"]
      Resource = aws_dynamodb_table.pacmac_scores.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "pacmac_scores_logs" {
  role       = aws_iam_role.pacmac_scores.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "pacmac_scores" {
  name              = "/aws/lambda/${local.name_prefix}-pacmac-scores"
  retention_in_days = 14

  depends_on = [aws_iam_role_policy.github_terraform_resources]
}

data "archive_file" "pacmac_scores" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/pacmac-scores"
  excludes    = ["accept.test.mjs", "keys.test.mjs", "scores.test.mjs"]
  output_path = "${path.module}/.terraform/pacmac-scores.zip"
}

resource "aws_lambda_function" "pacmac_scores" {
  function_name = "${local.name_prefix}-pacmac-scores"
  role          = aws_iam_role.pacmac_scores.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  architectures = ["arm64"]
  timeout       = 10

  filename         = data.archive_file.pacmac_scores.output_path
  source_code_hash = data.archive_file.pacmac_scores.output_base64sha256

  reserved_concurrent_executions = 2

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.pacmac_scores.name
      WRITE_CAP_PER_DAY = tostring(var.pacmac_write_cap_per_day)
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.pacmac_scores,
    aws_iam_role_policy.github_terraform_resources,
  ]
}

resource "aws_lambda_function_url" "pacmac_scores" {
  function_name      = aws_lambda_function.pacmac_scores.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "pacmac_scores_public_invoke" {
  statement_id  = "AllowPublicInvokeViaUrl"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pacmac_scores.function_name
  principal     = "*"
}
