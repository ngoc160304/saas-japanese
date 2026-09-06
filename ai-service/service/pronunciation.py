import httpx
from pathlib import Path

ONSEI_API_URL = "http://localhost:8010" 

async def score_pronunciation(
    teacher_wav_path: str | Path,
    student_wav_path: str | Path,
    sentence: str,
) -> dict:
    """Gọi onsei-api, trả về {'score': int|None, 'mean_distance': float|None, 'error': str|None}"""
    async with httpx.AsyncClient(timeout=30) as client:
        with open(teacher_wav_path, "rb") as tf, open(student_wav_path, "rb") as sf:
            resp = await client.post(
                f"{ONSEI_API_URL}/compare/score",
                data={"sentence": sentence, "alignment_method": "phonemes"},
                files={
                    "teacher_audio_file": ("teacher.wav", tf, "audio/wav"),
                    "student_audio_file": ("student.wav", sf, "audio/wav"),
                },
            )
        resp.raise_for_status()
        return resp.json()