variable "name_prefix" {
  description = "Prefix every resource name carries, so IAM can scope on it"
  type        = string
}

variable "domain_name" {
  description = "The domain issues are sent from; the SES identity is this exact name"
  type        = string
}

variable "zone_id" {
  description = "The Route53 zone the domain's records live in"
  type        = string
}

variable "aws_region" {
  description = "Region SES is used in; it names the DKIM and feedback endpoints"
  type        = string
}

variable "account_id" {
  description = "This account, for pinning who may publish to the events topic"
  type        = string
}

variable "mail_from_subdomain" {
  description = "Label of the subdomain SES uses as the envelope sender. It does nothing else."
  type        = string
  default     = "mail"
}
