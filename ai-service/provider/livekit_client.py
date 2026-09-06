import asyncio
import logging
from os import name
import uuid
import time
import numpy as np
import torch
import json
from livekit import api, rtc
from livekit.api import CreateRoomRequest
from scipy.signal import resample_poly
from silero_vad import get_speech_timestamps, load_silero_vad

from config.enviroments import eviroment
from provider.azure_tts import generate_tts_stream, generate_tts_to_file
from util.generate_token_livekit import generate_token
from provider.groq_stt import transcribe
from provider.groq_llm import generate_response
from service.speaking_score import compute_session_score
import soundfile as sf
from pathlib import Path

DEBUG_AUDIO_DIR = Path("debug_audio")
DEBUG_AUDIO_DIR.mkdir(exist_ok=True)
MIN_RMS_ENERGY = 0.02

vad_model = load_silero_vad()
URL = eviroment.LIVEKIT_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SESSION STATE
class SessionState:
    """Trạng thái riêng cho mỗi room, thay vì dùng global module-level."""
    def __init__(self):
        self.is_bot_speaking = False
        self.bot_finished_at: float = 0.0
        self.utterances = []
        self.chat_history: list[dict] = []

# AZURE TTS
async def speak(text: str, audio_source: rtc.AudioSource, session: SessionState):
    session.is_bot_speaking = True

    SAMPLE_RATE = 24000
    FRAME_SIZE = 480
    BYTES_PER_FRAME = FRAME_SIZE * 2
    # lấy event loop hiện tại và tạo queue để nhận dữ liệu từ thread TTS
    loop = asyncio.get_running_loop()
    # Tạo một asyncio.Queue để nhận dữ liệu từ thread TTS
    async_queue: asyncio.Queue = asyncio.Queue()
    start_time = time.perf_counter()

    synth_task = asyncio.create_task(
        asyncio.to_thread(generate_tts_stream, text, loop, async_queue)
    )

    leftover = b"" #giữ audio chưa đủ 1frame
    frame_count = 0 #đếm số frame
    stream_start = None #lưu thời điểm bắt đầu stream, để tính sleep_time
    first_chunk_logged = False #đảm bảo chỉ nhận thời điểm chunk đầu tiên 1 lần
    was_cancelled = False   # <-- FIX 1: khởi tạo TRƯỚC try, luôn tồn tại dù rơi vào nhánh nào

    try:
        while True:
            chunk = await async_queue.get()
            if chunk is None:
                break
            #xác định thời điểm audio bắt đầu
            if not first_chunk_logged:
                stream_start = time.monotonic()
                first_chunk_logged = True

            data = leftover + chunk
            usable_len = (len(data) // BYTES_PER_FRAME) * BYTES_PER_FRAME #Lấy đủ 960byte
            leftover = data[usable_len:]
            pcm = np.frombuffer(data[:usable_len], dtype=np.int16)
            # Gửi từng frame 20ms (480 sample) đến audio_source
            for i in range(0, len(pcm), FRAME_SIZE):
                frame_chunk = pcm[i:i + FRAME_SIZE]
                frame = rtc.AudioFrame(
                    data=frame_chunk.tobytes(),
                    sample_rate=SAMPLE_RATE,
                    num_channels=1,
                    samples_per_channel=FRAME_SIZE,
                )
                await audio_source.capture_frame(frame) #đẩy frame vào livekit
                frame_count += 1

                expected_time = stream_start + frame_count * 0.02
                sleep_time = expected_time - time.monotonic()
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

        if leftover:
            pcm = np.frombuffer(leftover, dtype=np.int16)
            pad_len = FRAME_SIZE - len(pcm)
            if pad_len > 0:
                pcm = np.pad(pcm, (0, pad_len))
            frame = rtc.AudioFrame(
                data=pcm.tobytes(), sample_rate=SAMPLE_RATE,
                num_channels=1, samples_per_channel=FRAME_SIZE,
            )
            await audio_source.capture_frame(frame)

        # FIX 2: await synth_task nằm ở NHÁNH CHÍNH (sau khi while kết thúc bình thường),
        # không phải trong except CancelledError — để bắt lỗi Azure nếu nó raise giữa chừng
        await synth_task
        print(f"⚡ Total TTS time: {time.perf_counter() - start_time:.2f}s | frames: {frame_count}")

    except (asyncio.CancelledError, GeneratorExit):
        was_cancelled = True
        synth_task.cancel()
        raise  # PHẢI re-raise, tuyệt đối không nuốt

    except Exception:
        logger.exception("❌ Azure TTS streaming failed")

    finally:
        session.is_bot_speaking = False
        session.bot_finished_at = time.monotonic()
        print(f"🔓 is_bot_speaking = False (id={id(session)})")
        if not was_cancelled:   # FIX 3: giờ luôn tồn tại, không còn UnboundLocalError
            await asyncio.sleep(0.2)
        print("🔊 AZURE TTS STREAM FINISHED")

async def create_room():
    random_uuid = uuid.uuid4()
    room_name = str(random_uuid)
    async with api.LiveKitAPI(
        eviroment.LIVEKIT_URL, eviroment.LIVEKIT_API_KEY, eviroment.LIVEKIT_API_SECRET
    ) as lkapi:
        return await lkapi.room.create_room(
            CreateRoomRequest(
                name=room_name,
                empty_timeout=10 * 60,
                max_participants=20,
            )
        )


async def process_utterance(
    sentence_audio: np.ndarray,
    participant: rtc.RemoteParticipant,
    audio_source: rtc.AudioSource,
    session: SessionState,
    room: rtc.Room,
    topic: dict,
):  
    rms = np.sqrt(np.mean(sentence_audio ** 2))
    print(f"Utterance RMS energy: {rms:.5f}")

    if rms < MIN_RMS_ENERGY:
        print(f"RMS quá thấp ({rms:.5f} < {MIN_RMS_ENERGY}) — bỏ qua, không gọi STT (nghi echo/nhiễu)")
        return

    """STT -> LLM -> TTS cho một câu nói đã cắt xong, mỗi bước có try/except riêng
    để biết chính xác provider nào lỗi (Groq STT, Groq LLM hay Azure TTS)."""
    try:
        start = time.perf_counter()
        # Đưa hàm transcribe() sang một thread khác để không chặn asyncio event loop.
        user_audio = DEBUG_AUDIO_DIR / f"utt_{time.time():.0f}.wav"
        sf.write(user_audio, sentence_audio, samplerate=16000)

        text = await asyncio.to_thread(transcribe, sentence_audio)
        print(f"Groq STT: {time.perf_counter() - start:.2f}s")
    except Exception:
        logger.exception("Groq STT failed")
        return
    
    if not text:
        return
    
    print(f"[{participant.identity}] {text}")
    
    try:
        start = time.perf_counter()
        ai_reply = await asyncio.to_thread(generate_response, text, topic, session.chat_history)
        print(f"Groq LLM: {time.perf_counter() - start:.2f}s")
        print(f"AI: {ai_reply}")
    except Exception:
        logger.exception("Groq LLM failed")
        return
    session.chat_history.append({"role": "user", "content": text})
    session.chat_history.append({"role": "assistant", "content": ai_reply})
    session.utterances.append({"user_audio_path": str(user_audio), "text": text, "llm_text": ai_reply,})
    conversation_data = {"type": "conversation", "user": text, "ai": ai_reply}
    await room.local_participant.publish_data(json.dumps(conversation_data).encode("utf-8"), reliable=True)

    try:
        start = time.perf_counter()
        await speak(ai_reply, audio_source, session)
        print(f"TTS: {time.perf_counter() - start:.2f}s")
    except Exception:
        logger.exception("Azure TTS failed")


async def start_livekit(room_name: str, topic: dict):
    room = rtc.Room()
    session = SessionState()  # thay cho is_bot_speaking global
    background_tasks: set[asyncio.Task] = set()
    def _track_task(task: asyncio.Task, name: str):
        background_tasks.add(task)
        def _on_done(t: asyncio.Task):
            background_tasks.discard(t)
            if t.cancelled():
                logger.warning(f"Task '{name}' was cancelled")
                return
            exc = t.exception()
            if exc is not None:
                logger.error(f"Task '{name}' CRASHED", exc_info=exc)
            else:
                logger.warning(f"Task '{name}' finished normally (không nên xảy ra với vòng lặp vô hạn!)")
        task.add_done_callback(_on_done)

    @room.on("participant_connected")
    def on_participant_connected(participant: rtc.RemoteParticipant):
        print("user connectted", participant.identity)
        logger.info(f"User connected: {participant.identity} (SID: {participant.sid})")

    async def receive_audio_frames(
        stream: rtc.AudioStream,
        participant: rtc.RemoteParticipant,
        audio_source: rtc.AudioSource,
    ):
        logger.info(f"Receiving audio from {participant.identity}")
        # thong so vad
        TARGET_SAMPLE_RATE = 16000
        SILENCE_THRESHOLD_SEC = 0.45
        MIN_SPEECH_DURATION_SEC = 0.4
        VAD_CHECK_INTERVAL_SEC = 0.15  # chạy VAD định kỳ, không chạy mỗi frame

        raw_48k_buffer = np.array([], dtype=np.float32)  # giữ nguyên gốc, resample 1 lần
        is_speaking = False
        last_vad_check = 0.0

        async for event in stream:
            frame = event.frame
            GRACE_PERIOD_AFTER_TTS = 0.6
            if session.is_bot_speaking or (time.monotonic() - session.bot_finished_at) < GRACE_PERIOD_AFTER_TTS:
                raw_48k_buffer = np.array([], dtype=np.float32)
                is_speaking = False
                continue
            # chuyển chuỗi byte từ livekit sang mảng số nguyên
            pcm = np.frombuffer(frame.data, dtype=np.int16)
            # kiểm tra số kênh, nếu stereo thì convert sang mono bằng cách lấy trung bình
            if frame.num_channels == 2:
                pcm = pcm.reshape(-1, 2).mean(axis=1).astype(np.int16)
            # convert sang float32 và chuẩn hóa về [-1, 1] để dùng với silero VAD
            audio_chunk = pcm.astype(np.float32) / 32768.0
            raw_48k_buffer = np.append(raw_48k_buffer, audio_chunk)
            # chỉ chạy VAD khi buffer đủ dài
            buffer_duration = len(raw_48k_buffer) / 48000
            if buffer_duration < MIN_SPEECH_DURATION_SEC:
                continue
            
            now = time.monotonic()
            if now - last_vad_check < VAD_CHECK_INTERVAL_SEC:
                continue
            last_vad_check = now

            # resample từ 48kHz xuống 16kHz để dùng với silero VAD
            audio_16k = resample_poly(raw_48k_buffer, up=1, down=3)
            # chuyển sang tensor để dùng với silero VAD
            audio_tensor = torch.from_numpy(audio_16k.astype(np.float32))

            speech_timestamps = get_speech_timestamps(
                audio_tensor,
                vad_model,
                threshold=0.7,
                sampling_rate=TARGET_SAMPLE_RATE,
                return_seconds=False,
                min_speech_duration_ms=200,
                min_silence_duration_ms=50,
            )
            # Nếu có đoạn speech, đánh dấu is_speaking = True và lưu lại thời điểm kết thúc đoạn speech cuối cùng
            if speech_timestamps:
                is_speaking = True
                last_speech_end = speech_timestamps[-1]["end"]
                
                silence_duration = (
                    len(audio_16k) - last_speech_end
                ) / TARGET_SAMPLE_RATE
                # Kiểm tra độ dài khoản lặng giữa các đoạn nói, nếu vượt quá ngưỡng thì coi như kết thúc câu và xử lý
                if silence_duration >= SILENCE_THRESHOLD_SEC:
                    sentence_audio = audio_16k[:last_speech_end]

                    raw_48k_buffer = np.array([], dtype=np.float32)
                    is_speaking = False

                    if len(sentence_audio) / TARGET_SAMPLE_RATE < MIN_SPEECH_DURATION_SEC:
                        continue
                    # Xử lý câu nói đã cắt xong: STT -> LLM -> TTS
                    await process_utterance(sentence_audio, participant, audio_source, session, room, topic)
                    raw_48k_buffer = np.array([], dtype=np.float32)
                    # dừng hệ thống 
                    await asyncio.sleep(0.2)

            else:
                if not is_speaking and buffer_duration > 1.5:
                    keep_samples = int(0.5 * 48000)
                    raw_48k_buffer = raw_48k_buffer[-keep_samples:]
    # khi bật mic
    @room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.RemoteTrackPublication,
        participant: rtc.RemoteParticipant,
    ):
        print(
            f"track subscriber: {participant.sid} "
            f"from {participant.identity} "
            f"({participant.name})"
        )
        if track.kind != rtc.TrackKind.KIND_AUDIO:
            return
        audio_stream = rtc.AudioStream(track)
        task = asyncio.create_task(
            receive_audio_frames(audio_stream, participant, audio_source)
        )
        _track_task(task,f"receive_audio_frames-{participant.identity}")


    @room.on("disconnected")
    def on_disconnected():
        logger.info("Python Client disconnected from room")
    token = generate_token(room_name=room_name, identity="bot", username="Bot")
    logger.info("Connecting to room...")
    await room.connect(URL, token)
    audio_source = rtc.AudioSource(sample_rate=24000, num_channels=1)
    local_track = rtc.LocalAudioTrack.create_audio_track("tts", audio_source,)
    await room.local_participant.publish_track(local_track)
    logger.info(f"Connected to room: {room.name}")
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        for task in list(background_tasks):
            task.cancel()
        if background_tasks:
            await asyncio.gather(*background_tasks, return_exceptions=True)

        session_result = await compute_session_score(session)
        logger.info(f"Session score: {session_result}")
        await room.disconnect()

    return session_result

_room_tasks: dict[str, asyncio.Task] = {}

def launch_bot_for_room(room_name: str, topic: dict) -> asyncio.Task:
    """Tạo (hoặc tái sử dụng) task start_livekit cho 1 room, tránh bị GC và tránh trùng bot."""
    existing = _room_tasks.get(room_name)
    if existing and not existing.done():
        logger.info(f"Bot already running for room {room_name}, skip creating new one")
        return existing

    task = asyncio.create_task(start_livekit(room_name, topic))
    _room_tasks[room_name] = task
    print("selected topic", topic)
    def _on_done(t: asyncio.Task):
        # log lỗi thật nếu task chết bất thường, thay vì để nó âm thầm biến mất
        if not t.cancelled() and t.exception() is not None:
            logger.exception("Bot task crashed", exc_info=t.exception())
        _room_tasks.pop(room_name, None)

    task.add_done_callback(_on_done)
    return task