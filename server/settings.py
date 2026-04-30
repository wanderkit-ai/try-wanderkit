from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT = Path(__file__).resolve().parents[1]

load_dotenv(ROOT / ".env.local", override=True)
load_dotenv(ROOT / ".env", override=True)


class Settings(BaseSettings):
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-sonnet-4-6", alias="ANTHROPIC_MODEL")
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    amadeus_client_id: Optional[str] = Field(default=None, alias="AMADEUS_CLIENT_ID")
    amadeus_client_secret: Optional[str] = Field(default=None, alias="AMADEUS_CLIENT_SECRET")
    serpapi_key: Optional[str] = Field(default=None, alias="SERPAPI_KEY")
    resend_api_key: Optional[str] = Field(default=None, alias="RESEND_API_KEY")
    resend_from: Optional[str] = Field(default=None, alias="RESEND_FROM")
    telegram_bot_token: Optional[str] = Field(default=None, alias="TELEGRAM_BOT_TOKEN")
    firecrawl_api_key: Optional[str] = Field(default=None, alias="FIRECRAWL_API_KEY")
    slack_webhook_url: Optional[str] = Field(default=None, alias="SLACK_WEBHOOK_URL")
    google_service_account_json: Optional[str] = Field(default=None, alias="GOOGLE_SERVICE_ACCOUNT_JSON")
    gsheets_spreadsheet_id: Optional[str] = Field(default=None, alias="GSHEETS_SPREADSHEET_ID")
    tripadvisor_api_key: Optional[str] = Field(default=None, alias="TRIPADVISOR_API_KEY")
    whatsapp_access_token: Optional[str] = Field(default=None, alias="WHATSAPP_ACCESS_TOKEN")
    whatsapp_phone_number_id: Optional[str] = Field(default=None, alias="WHATSAPP_PHONE_NUMBER_ID")
    whatsapp_verify_token: Optional[str] = Field(default=None, alias="WHATSAPP_VERIFY_TOKEN")
    scrape_cron: Optional[str] = Field(default=None, alias="SCRAPE_CRON")
    scrape_target_url: Optional[str] = Field(default=None, alias="SCRAPE_TARGET_URL")
    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(extra="ignore", populate_by_name=True)

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
