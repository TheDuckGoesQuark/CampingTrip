# -----------------------------------------------------------------------------
# Contact endpoint — SNS topic, Lambda, Function URL
#
# The static site cannot keep a secret, so the note a visitor types is posted to
# something server-side that hardcodes the recipient. Nothing in this file holds
# a credential: the Lambda's role authorises the publish, so unlike a mail
# provider's API there is no key to store or rotate.
# -----------------------------------------------------------------------------

# --- Where the note goes ---

resource "aws_sns_topic" "contact" {
  name = "${local.name_prefix}-contact"

  # CI applies this configuration as the role that policy belongs to, and the
  # SNS and Lambda grants it needs are added in the same commit as the resources
  # using them. Terraform sees no dependency between a policy document and the
  # API calls it authorises, so without this the first apply races its own
  # permissions. IAM is eventually consistent, so a re-run may still be needed.
  depends_on = [aws_iam_role_policy.github_terraform_resources]
}

# Confirmation is a link AWS emails to this address, and only the recipient can
# click it — so this resource stays `pending confirmation` in state until that
# happens, on the first apply and again if the subscription is ever recreated.
# Terraform reports that as created either way; the mail is what proves it.
resource "aws_sns_topic_subscription" "contact_email" {
  topic_arn = aws_sns_topic.contact.arn
  protocol  = "email"
  endpoint  = var.contact_email
}

# --- The function's identity ---

resource "aws_iam_role" "contact" {
  name = "${local.name_prefix}-contact-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Publish to this one topic and nothing else. Not `sns:*`, and not `Resource:
# "*"` — a public unauthenticated endpoint is the last place to hold a role that
# can publish anywhere in the account.
resource "aws_iam_role_policy" "contact_publish" {
  name = "sns-publish"
  role = aws_iam_role.contact.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "sns:Publish"
      Resource = aws_sns_topic.contact.arn
    }]
  })
}

resource "aws_iam_role_policy_attachment" "contact_logs" {
  role       = aws_iam_role.contact.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Declared rather than left to the first invocation, so the retention is ours to
# set: a log group Lambda creates on its own keeps everything forever.
resource "aws_cloudwatch_log_group" "contact" {
  name              = "/aws/lambda/${local.name_prefix}-contact"
  retention_in_days = 14

  # Same permissions race as the topic above: this name is outside the log-group
  # prefix CI could reach before that policy change.
  depends_on = [aws_iam_role_policy.github_terraform_resources]
}

# --- The function ---

data "archive_file" "contact" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/contact"
  output_path = "${path.module}/.terraform/contact.zip"
}

resource "aws_lambda_function" "contact" {
  function_name = "${local.name_prefix}-contact"
  role          = aws_iam_role.contact.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  # Matches the t4g the site is served from, and is the cheaper of the two.
  architectures = ["arm64"]
  timeout       = 10

  filename         = data.archive_file.contact.output_path
  source_code_hash = data.archive_file.contact.output_base64sha256

  # The cost ceiling, and the only real one. The Function URL below is public and
  # unauthenticated, so anyone who finds it can call it as often as they like;
  # what they cannot do is make it run more than this many at a time. Two is
  # ample for a personal site and bounds the bill whatever happens.
  reserved_concurrent_executions = 2

  environment {
    variables = {
      TOPIC_ARN = aws_sns_topic.contact.arn
    }
  }

  # Without the log group the function can race it and create one with no
  # retention, which then blocks the declared group above. The policy is the
  # permissions race described there.
  depends_on = [
    aws_cloudwatch_log_group.contact,
    aws_iam_role_policy.github_terraform_resources,
  ]
}

# `NONE`, because the caller is a stranger's browser and there is nothing to
# authenticate it with. Caddy proxies `/api/contact` here so the page only ever
# talks to its own origin — that removes CORS, not the need for the function to
# validate everything it is sent.
resource "aws_lambda_function_url" "contact" {
  function_name      = aws_lambda_function.contact.function_name
  authorization_type = "NONE"
}

# Admitting the public takes two grants, not one, since October 2025: with only
# the `lambda:InvokeFunctionUrl` the provider adds itself, the URL answers 403
# after an apply that reported success.
# https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html
#
# Not the provider's own `FunctionURLAllowInvokeAction` id — from 6.28 it writes
# that statement too, and a collision here is an error. Its version carries a
# `lambda:InvokedViaFunctionUrl` condition that 5.x cannot express, so this also
# permits a direct signed Invoke; such a call has no `requestContext`, which
# `index.mjs` answers 405 without publishing.
resource "aws_lambda_permission" "contact_public_invoke" {
  statement_id  = "AllowPublicInvokeViaUrl"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.contact.function_name
  principal     = "*"
}
