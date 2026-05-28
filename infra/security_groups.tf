# -----------------------------------------------------------------------------
# Security Groups
# -----------------------------------------------------------------------------

# --- EC2 instance ---

resource "aws_security_group" "ec2" {
  name_prefix = "${local.name_prefix}-ec2-"
  description = "App server - HTTP, HTTPS, SSH"
  vpc_id      = aws_vpc.main.id

  # HTTP (Caddy redirect to HTTPS)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS (Caddy terminates SSL)
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # SSH (restricted to your IP)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
    description = "SSH"
  }

  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound"
  }

  tags = { Name = "${local.name_prefix}-ec2-sg" }

  lifecycle {
    create_before_destroy = true
  }
}
