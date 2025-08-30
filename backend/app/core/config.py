
import os


class Settings:
    """Simple settings loader using environment variables.

    This avoids depending on pydantic's BaseSettings (which moved to
    `pydantic-settings` in newer pydantic releases) so the app can run
    with the current requirements.
    """

    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/c_programming_platform")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production-12345")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DOCKER_HOST: str = os.getenv("DOCKER_HOST", "unix:///var/run/docker.sock")


settings = Settings()
