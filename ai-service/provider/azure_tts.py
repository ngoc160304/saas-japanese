import asyncio
import azure.cognitiveservices.speech as speechsdk
from config.enviroments import eviroment

SPEECH_KEY = eviroment.SPEECH_KEY
SPEECH_REGION = eviroment.SPEECH_REGION


class _ChunkCallback(speechsdk.audio.PushAudioOutputStreamCallback):
    def __init__(self, loop: asyncio.AbstractEventLoop, async_queue: asyncio.Queue):
        super().__init__()
        self._loop = loop
        self._queue = async_queue

    def write(self, audio_buffer: memoryview) -> int:
        try:
            data = bytes(audio_buffer)
            self._loop.call_soon_threadsafe(self._queue.put_nowait, data)
            return len(audio_buffer)
        except Exception:
            import traceback
            traceback.print_exc()
            return 0  

    def close(self):
        try:
            self._loop.call_soon_threadsafe(self._queue.put_nowait, None)
        except Exception:
            import traceback
            traceback.print_exc()


def generate_tts_stream(text: str, loop: asyncio.AbstractEventLoop, async_queue: asyncio.Queue):
    speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
    speech_config.speech_synthesis_voice_name = "ja-JP-NanamiNeural"
    speech_config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Raw24Khz16BitMonoPcm
    )

    callback = _ChunkCallback(loop, async_queue)
    push_stream = speechsdk.audio.PushAudioOutputStream(callback)
    audio_config = speechsdk.audio.AudioOutputConfig(stream=push_stream)

    synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config,
        audio_config=audio_config,
    )

    try:
        result = synthesizer.speak_text_async(text).get()
        if result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            raise RuntimeError(
                f"Azure TTS canceled: {cancellation.reason}, {cancellation.error_details}"
            )
    finally:
        loop.call_soon_threadsafe(async_queue.put_nowait, None)