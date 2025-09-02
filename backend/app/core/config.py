import os
from dotenv import load_dotenv
from typing import List, Optional

# Load environment variables
load_dotenv()

class Settings:
    PROJECT_NAME: str = "OHIF Collaborative Imaging System"
    API_V1_STR: str = "/api/v1"

    # CORS settings
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3001"
    ).split(",")

    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-jwt-key-here")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./collaborative_imaging.db")

    # Debug and testing flags
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    TESTING: bool = os.getenv("TESTING", "false").lower() == "true"


settings = Settings()
