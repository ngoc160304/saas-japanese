import asyncio
from pathlib import Path

from provider.azure_tts import generate_tts_to_file
from service.pronunciation import score_pronunciation
from service.language import score_language


DEBUG_AUDIO_DIR = Path("debug_audio")


async def compute_session_score(session) -> dict:

    pronunciation_results = []

    # Pronunciation
    for i, utt in enumerate(session.utterances):
        sentence = utt["text"]
        student_wav = utt["user_audio_path"]
        teacher_wav = str(DEBUG_AUDIO_DIR / f"teacher_{i}.wav")
        await asyncio.to_thread(generate_tts_to_file,sentence,teacher_wav)
        result = await score_pronunciation(teacher_wav,student_wav,sentence)
        pronunciation_results.append({
            "sentence": sentence,
            "score": result.get("score"),
            "mean_distance": result.get("mean_distance"),
            "error": result.get("error"),
        })

    valid_scores = [item["score"] for item in pronunciation_results if item["score"] is not None]

    average_pronunciation = (sum(valid_scores) / len(valid_scores) if valid_scores else None)
    # Grammar / Vocabulary / Relevance
    conversation = [
        {
            "stt_text": utt["text"],
            "llm_text": utt["llm_text"],
        }
        for utt in session.utterances
    ]
    language_result = score_language(conversation)

    grammar = language_result.get("grammar")
    vocabulary = language_result.get("vocabulary")
    relevance = language_result.get("relevance")

    scores = [average_pronunciation, grammar, vocabulary, relevance]

    valid_scores = [score for score in scores if score is not None]

    overall = (
        round(sum(valid_scores) / len(valid_scores))
        if valid_scores
        else None
    )
    # Final result
    return {
        "overall": overall,
        "pronunciation": (
            round(average_pronunciation)
            if average_pronunciation is not None
            else None
        ),
        "grammar": language_result.get("grammar"),
        "vocabulary": language_result.get("vocabulary"),
        "relevance": language_result.get("relevance"),
        "utterances": pronunciation_results,
    }