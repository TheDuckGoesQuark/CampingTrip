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

variable "alerts_topic_arn" {
  description = "Where every alarm here publishes"
  type        = string
}

variable "from_address" {
  description = "The From header on every message, display name included; its domain must be the identity"
  type        = string
}

variable "reply_to" {
  description = "Where a reply to any message lands; the From address has no mailbox"
  type        = string
}

variable "site_origin" {
  description = "Origin the confirmation and unsubscribe links, and every redirect, are built on"
  type        = string
}

variable "consent_version" {
  description = "Names the consent sentence and privacy page in force; stored on every row so a change to either is dated"
  type        = string
}

variable "confirm_cap_per_day" {
  description = "Confirmation emails the endpoint will send in one UTC day before refusing sign-ups and raising an alarm"
  type        = number
  default     = 100
}
