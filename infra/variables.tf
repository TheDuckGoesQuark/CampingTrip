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

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB"
  type        = number
  default     = 20
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

variable "django_secret_key" {
  description = "Django SECRET_KEY (auto-generated if empty)"
  type        = string
  sensitive   = true
  default     = ""
}
