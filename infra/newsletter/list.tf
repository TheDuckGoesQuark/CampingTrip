# The subscriber list: one table, keyed `pk` and `sk`. A subscriber is
# `SUB#<email>` / `META`; an issue's claim and per-recipient markers, and the
# day's confirmation counter, share the table under their own prefixes. The
# shape is documented in docs/planning/newsletter-and-analytics.md.
resource "aws_dynamodb_table" "list" {
  name         = "${var.name_prefix}-newsletter"
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

  attribute {
    name = "confirm_token"
    type = "S"
  }

  attribute {
    name = "unsubscribe_token"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  # A link carries a token and nothing else, so each token is a key lookup.
  # `KEYS_ONLY`: the query only needs the row's key to update it.
  global_secondary_index {
    name            = "confirm-token"
    hash_key        = "confirm_token"
    projection_type = "KEYS_ONLY"
  }

  global_secondary_index {
    name            = "unsubscribe-token"
    hash_key        = "unsubscribe_token"
    projection_type = "KEYS_ONLY"
  }

  # Who an issue goes to: every `active` row, with the two things the worker
  # needs and nothing else projected.
  global_secondary_index {
    name               = "status-index"
    hash_key           = "status"
    projection_type    = "INCLUDE"
    non_key_attributes = ["email", "unsubscribe_token"]
  }

  # A pending row that is never confirmed carries `ttl`; nothing else does.
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  # The list is the one thing here that cannot be recreated by an apply: the
  # people in it consented once. Both guards, since the provider's flag stops
  # the API call and Terraform's stops the plan.
  deletion_protection_enabled = true

  lifecycle {
    prevent_destroy = true
  }

  tags = { Name = "${var.name_prefix}-newsletter" }
}

locals {
  table_arns = [aws_dynamodb_table.list.arn, "${aws_dynamodb_table.list.arn}/index/*"]
}
