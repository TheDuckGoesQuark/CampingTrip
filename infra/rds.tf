# -----------------------------------------------------------------------------
# RDS PostgreSQL 16
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet"
  subnet_ids = [aws_subnet.data_a.id, aws_subnet.data_b.id]

  tags = { Name = "${local.name_prefix}-db-subnet" }
}

resource "random_password" "db_password" {
  length  = 32
  special = false # Avoid special chars that break DATABASE_URL parsing
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  max_allocated_storage = 50

  db_name  = "campsite"
  username = "campsite"
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az                  = false
  publicly_accessible       = false
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-db-final"

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection = true

  performance_insights_enabled = true

  tags = { Name = "${local.name_prefix}-db" }
}
