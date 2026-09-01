from pydantic_settings import BaseSettings, SettingsConfigDict


class Enviroment(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    LIVEKIT_URL: str
    LIVEKIT_API_KEY: str
    LIVEKIT_API_SECRET: str
    GROQ_API_KEY: str
    SPEECH_KEY: str
    SPEECH_REGION: str

eviroment = Enviroment()
