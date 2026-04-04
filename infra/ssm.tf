# -----------------------------------------------------------------------------
# SSM Parameter Store — app secrets (replaces Secrets Manager)
# -----------------------------------------------------------------------------

resource "random_password" "django_secret_key" {
  length  = 50
  special = true
}

resource "aws_ssm_parameter" "app_secrets" {
  name = "/${local.name_prefix}/app-secrets"
  type = "SecureString"

  value = jsonencode({
    SECRET_KEY                 = var.django_secret_key != "" ? var.django_secret_key : random_password.django_secret_key.result
    GOOGLE_OAUTH_CLIENT_ID     = var.google_oauth_client_id
    GOOGLE_OAUTH_CLIENT_SECRET = var.google_oauth_client_secret
  })

  tags = { Name = "${local.name_prefix}-app-secrets" }
}
