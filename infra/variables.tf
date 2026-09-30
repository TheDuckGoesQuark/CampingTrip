variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
  default     = "jordanscamp.site"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.micro"
}

variable "my_ip" {
  description = "Your IP address for SSH access (CIDR notation, e.g. 1.2.3.4/32)"
  type        = string
  default     = "0.0.0.0/0"
}

variable "github_org" {
  description = "GitHub organisation or username"
  type        = string
  default     = "TheDuckGoesQuark"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "CampingTrip"
}


variable "contact_email" {
  description = "Where MouseMail's notes are sent. Already public in the CV, so not a secret."
  type        = string
  default     = "jmackie97@hotmail.com"
}

variable "alert_email" {
  description = "Where alarms are sent. The same public address as contact_email, kept separate so one can move without the other."
  type        = string
  default     = "jmackie97@hotmail.com"
}

variable "newsletter_consent_version" {
  description = "Names the consent sentence and privacy page a subscriber saw. Bump it when either changes; every row records the value in force when it was written."
  type        = string
  default     = "2026-09-29"
}
