terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    # Zips the contact Lambda's source at plan time, so the function's code is
    # the file in `infra/lambda/` and there is no build step or artifact bucket.
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}
