from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

base_path = Path(__file__).resolve().parent.parent.parent
env_file_path = str(base_path / ".env")


class DatabaseSettings(BaseSettings):
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_address: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "postgres"
    db_pool_size: int = 10

    model_config = SettingsConfigDict(
        env_file=env_file_path,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        env_prefix="BACKEND_",
    )

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_address}:{self.postgres_port}/{self.postgres_db}"


class JWTSettings(BaseSettings):
    secret_key: str = ""
    algorithm: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=env_file_path,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        env_prefix="USERS_JWT_",
    )


class APISettings(BaseSettings):
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = False

    model_config = SettingsConfigDict(
        env_file=env_file_path,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
        env_prefix="BACKEND_API_",
    )


class Settings(BaseSettings):
    database_settings: DatabaseSettings = DatabaseSettings()
    jwt_settings: JWTSettings = JWTSettings()
    api_settings: APISettings = APISettings()

    @property
    def database_url(self) -> str:
        return self.database_settings.database_url

    model_config = SettingsConfigDict(
        env_file=env_file_path,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()
