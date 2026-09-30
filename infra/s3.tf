# -----------------------------------------------------------------------------
# S3 — Deploy artifacts bucket
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "deploy" {
  bucket = "${local.name_prefix}-deploy"

  tags = { Name = "${local.name_prefix}-deploy" }
}

resource "aws_s3_bucket_versioning" "deploy" {
  bucket = aws_s3_bucket.deploy.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "deploy" {
  bucket = aws_s3_bucket.deploy.id

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }

  # Dated GoatCounter backups; `latest.sqlite3` is rewritten nightly and so
  # never ages past a day.
  rule {
    id     = "expire-old-backups"
    status = "Enabled"

    filter {
      prefix = "_backup/"
    }

    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_public_access_block" "deploy" {
  bucket = aws_s3_bucket.deploy.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
