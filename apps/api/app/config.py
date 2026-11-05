from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    redis_url: str = 'redis://localhost:6379/0'
    cors_origins: str = 'http://localhost:3000'

    # 'proxy' (recomendado) ou 'redirect'
    stream_mode: str = 'proxy'
    ytdlp_max_concurrency: int = 3
    ytdlp_timeout_seconds: int = 20
    rate_limit_per_min: int = 120

    # TTLs em segundos
    ttl_home: int = 3600
    ttl_moods: int = 86400
    ttl_playlist: int = 21600
    ttl_search: int = 1800

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(',') if o.strip()]


settings = Settings()
