from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # App Config
    project_name: str = "UniGPT"
    environment: str = "development"
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    frontend_app_url: str = "http://localhost:5173"
    oauth_redirect_path: str = "/auth/callback"
    academic_email_domains: str = "krmu.edu.in"
    require_verified_academic_email_for_queries: bool = True

    # Supabase (Auth & Core Data)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_offline_mode: bool = False

    # Pinecone (Fast Vector Search)
    pinecone_api_key: str = ""
    pinecone_index_name: str = "unigpt-index"

    # LLM (Generation via OpenRouter)
    openrouter_api_key: str = ""
    openrouter_model: str = "meta-llama/llama-3.1-70b-instruct"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Embeddings (Local HuggingFace model)
    embedding_model_name: str = "all-MiniLM-L6-v2"

    # Dev flags
    mock_llm: bool = False

    # SMTP (Email)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "UniGPT Support"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
