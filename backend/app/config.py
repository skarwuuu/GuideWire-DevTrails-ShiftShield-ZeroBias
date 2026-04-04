from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = ""
    db_name: str = "shiftshield"
    cors_origin: str = "*"
    port: int = 4000
    model_path: str = "app/engine/scoring_model.joblib"
    openweather_api_key: str = ""

    model_config = {
        "env_file": ".env",
        "protected_namespaces": ("settings_",),
    }

settings = Settings()