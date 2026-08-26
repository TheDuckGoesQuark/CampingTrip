terraform {
  # No `profile` here, deliberately — see the provider block below. The bucket
  # is the guard for this half: it lives in 477395207022, so credentials
  # resolving anywhere else get AccessDenied on `init` rather than quietly
  # reading or writing another account's state.
  backend "s3" {
    bucket         = "jordanscamp-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "jordanscamp-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  # The one line in this repository that stops a local run from being aimed at
  # the wrong estate.
  #
  # This configuration pinned no profile and no account, and on the laptop that
  # runs it the `default` AWS profile is an unrelated employer's account. A
  # `terraform destroy` here was therefore aimed at whatever `default` happened
  # to be. That is not hypothetical in this account's history: on 18 Aug 2026 a
  # sibling project's destroy took out the shared GitHub OIDC provider and with
  # it this repo's ability to deploy.
  #
  # `allowed_account_ids` rather than `profile = "..."`, for two reasons.
  #
  # It is a stronger assertion. It checks the account the credentials actually
  # resolved to, however they arrived — a named profile, environment variables,
  # or the OIDC role CI assumes. A profile pin only catches *forgetting* the
  # profile; it says nothing about a profile whose contents changed. The AWS
  # provider documents this argument for precisely this failure: "List of
  # allowed AWS account IDs to prevent you from mistakenly using an incorrect
  # one (and potentially end up destroying a live environment)."
  #
  # And a profile pin would break CI. terraform.yml runs a real `init`, `plan`
  # and `apply` against this state using credentials from an assumed role; a
  # GitHub runner has no `catmaps` profile in its shared config, so both the
  # provider and the backend would fail to initialise. This works unchanged in
  # both places.
  allowed_account_ids = ["477395207022"]

  default_tags {
    tags = {
      Project     = "jordanscamp"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name_prefix = "jordanscamp-${var.environment}"
}
