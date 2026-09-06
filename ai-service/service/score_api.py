"""
Endpoint chấm điểm JSON, tận dụng lại app + code gốc của onsei.api
mà không sửa file onsei/api.py.
"""
import logging
import os
import traceback
from tempfile import TemporaryDirectory
from typing import Optional

from fastapi import File, UploadFile, Form, HTTPException, status
from pydantic import BaseModel

# Import app gốc đã có sẵn 2 endpoint /compare/graph.png và /graph.png -> gắn thêm route vào chính app này
from onsei.api import app, SUPPORTED_FILE_EXTENSIONS
from onsei.speech_record import SpeechRecord, AlignmentError, NoPhonemeSegmentationError, AlignmentMethod
from onsei.utils import convert_audio


class ScoreResponse(BaseModel):
    score: Optional[int]
    mean_distance: Optional[float]
    error: Optional[str] = None


@app.post("/compare/score", response_model=ScoreResponse)
def post_compare_score(
    sentence: str = Form(...),
    alignment_method: AlignmentMethod = Form(AlignmentMethod.phonemes),
    teacher_audio_file: UploadFile = File(...),
    student_audio_file: UploadFile = File(...),
):
    for file, label in [(teacher_audio_file, "teacher"), (student_audio_file, "student")]:
        extension = file.filename.split('.')[-1]
        if extension not in SUPPORTED_FILE_EXTENSIONS:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                 detail=f"{label} audio: unsupported extension {extension}")

    with TemporaryDirectory() as td:
        teacher_path = os.path.join(td, teacher_audio_file.filename)
        with open(teacher_path, "wb") as f:
            f.write(teacher_audio_file.file.read())
        student_path = os.path.join(td, student_audio_file.filename)
        with open(student_path, "wb") as f:
            f.write(student_audio_file.file.read())

        teacher_wav = os.path.join(td, "teacher.wav")
        convert_audio(teacher_path, teacher_wav)
        student_wav = os.path.join(td, "student.wav")
        convert_audio(student_path, student_wav)

        try:
            teacher_rec = SpeechRecord(teacher_wav, sentence, name="Teacher")
            student_rec = SpeechRecord(student_wav, sentence, name="Student")
            student_rec.align_with(teacher_rec, method=alignment_method)
            mean_distance = student_rec.compare_pitch()
        except (AlignmentError, NoPhonemeSegmentationError) as exc:
            return ScoreResponse(score=None, mean_distance=None, error=str(exc))
        except Exception:
            logging.error(traceback.format_exc())
            return ScoreResponse(score=None, mean_distance=None, error="internal_error")

    if mean_distance is None:
        return ScoreResponse(score=None, mean_distance=None, error="no_overlap")

    score = int(1.0 / (mean_distance + 1.0) * 100)
    return ScoreResponse(score=score, mean_distance=float(mean_distance))