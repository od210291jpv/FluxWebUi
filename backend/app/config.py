from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    models_dir: Path = Path("./models_cache")
    loras_dir: Path = Path("./loras")
    output_dir: Path = Path("./outputs")
    db_url: str = "sqlite+aiosqlite:///flux_webui.db"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    device: str = "cuda"
    dtype: str = "bfloat16"
    enable_cpu_offload: bool = True
    max_queue_size: int = 10

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
