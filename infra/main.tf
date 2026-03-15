terraform {
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
  api_domain  = "api.${var.domain_name}"
}
