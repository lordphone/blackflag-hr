"""
Configuration management using Pydantic settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    environment: str = "dev"
    app_name: str = "HR Cloud API"
    app_version: str = "1.0.0"
    
    # Database
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "hrdb"
    db_username: str
    db_password: str
    
    # API
    api_prefix: str = "/api/v1"
    
    # Logging
    log_level: str = "INFO"
    
    # CORS
    cors_origins: list[str] = ["*"]  # Restrict this in production
    
    # Security
    secret_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def database_url(self) -> str:
        """Construct database URL"""
        return f"postgresql+asyncpg://{self.db_username}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    @property
    def database_url_sync(self) -> str:
        """Construct synchronous database URL"""
        return f"postgresql://{self.db_username}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


# Global settings instance
settings = Settings()



