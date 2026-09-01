import io
import os
import wave
from config.enviroments import eviroment
import numpy as np
from groq import Groq


client = Groq(
    api_key=eviroment.GROQ_API_KEY
)

MODEL = os.getenv(
    "GROQ_STT_MODEL",
    "whisper-large-v3-turbo"
)


def transcribe(audio: np.ndarray) -> str:
    """
    audio:
        numpy float32
        mono
        sample rate = 16000
        range [-1, 1]
    """

    # Float32 [-1, 1] -> PCM16
    pcm16 = (audio * 32767).clip(-32768, 32767).astype(np.int16)

    # Tạo WAV trong RAM
    wav_buffer = io.BytesIO()

    with wave.open(wav_buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        wav.writeframes(pcm16.tobytes())

    wav_buffer.seek(0)

    wav_buffer.name = "audio.wav"

    result = client.audio.transcriptions.create(
        file=wav_buffer,
        model=MODEL,
        language="ja",
        temperature=0,
    )

    return result.text.strip()