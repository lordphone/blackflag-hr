# Database Credentials Secret
resource "aws_secretsmanager_secret" "db_credentials" {
  name_prefix             = "${local.resource_prefix}-db-credentials-"
  description             = "Database credentials for ${local.resource_prefix}"
  recovery_window_in_days = var.enable_deletion_protection ? 30 : 0

  tags = {
    Name = "${local.resource_prefix}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = var.db_name
  })
}

# Application Secrets (for future use)
resource "aws_secretsmanager_secret" "app_secrets" {
  name_prefix             = "${local.resource_prefix}-app-secrets-"
  description             = "Application secrets for ${local.resource_prefix}"
  recovery_window_in_days = var.enable_deletion_protection ? 30 : 0

  tags = {
    Name = "${local.resource_prefix}-app-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    jwt_secret = random_password.jwt_secret.result
    api_key    = random_password.api_key.result
  })
}

# Random secrets for application
resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_password" "api_key" {
  length  = 32
  special = false
}



