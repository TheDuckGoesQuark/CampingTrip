output "identity_arn" {
  description = "The domain identity; the sending functions' role is scoped to it"
  value       = aws_sesv2_email_identity.domain.arn
}

output "dkim_status" {
  description = "SES's view of the DKIM records; `SUCCESS` once it has resolved all three"
  value       = aws_sesv2_email_identity.domain.dkim_signing_attributes[0].status
}

output "configuration_set_name" {
  description = "The set every send names, so its events and suppression apply"
  value       = aws_sesv2_configuration_set.newsletter.configuration_set_name
}

output "events_topic_arn" {
  description = "Where SES publishes bounces and complaints; the marking function subscribes here"
  value       = aws_sns_topic.events.arn
}

output "api_function_url" {
  description = "The endpoint's Function URL, for the Caddyfile's reverse_proxy"
  value       = aws_lambda_function_url.api.function_url
}

output "table_name" {
  description = "The subscriber table, for the sending function and for a deletion request run by hand"
  value       = aws_dynamodb_table.list.name
}

output "send_function_name" {
  description = "Invoked by CI with { issue, mode }"
  value       = aws_lambda_function.send.function_name
}
