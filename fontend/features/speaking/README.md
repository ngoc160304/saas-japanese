# Speaking integration

The canonical page is /student/speaking under the existing authenticated student shell.
The old /speaking page redirects there.

## Contracts verified in ai-service

Read-only inspection of ai-service/main.py, provider/livekit_client.py and
service/speaking_score.py established these calls:

- POST /create-room, no body: LiveKit Room dictionary with name.
- POST /join-room: { room_name, user_id: string, user_name: string,
  topic: { id: string, title: string, description: string } }.
  Returns { serverUrl, participantToken }.
- POST /end-room: { room_name }. Returns { success, session_result } or
  { success: false, message: "No active bot" }.
- LiveKit DataReceived JSON events: { type: "user_message" | "ai_message", text }.
- session_result: overall, pronunciation, grammar, vocabulary, relevance (number or null);
  utterances: [{ sentence, score, mean_distance, error }].

Identity is serialized from the current auth user. FastAPI currently does not verify
Spring credentials or room ownership. The separate transport forwards neither Spring
Authorization nor cookies. Participant metadata is not proof of authorization.
Production server authorization requires a separate change to ai-service.

## Topic catalog

ai-service has no topic list endpoint or persisted topic catalog.
Spring provides GET /api/v1/speaking/topics?page=0&size=12 for authenticated users,
using its standard data/Page wrapper and numeric topic IDs.
POST /api/v1/admin/speaking/topics accepts { title, description } for ROLE_ADMIN,
returns 201 with the saved topic, and populates the persisted catalog.
The numeric topic ID is serialized to a string when sent to FastAPI.

Apply backend/database/20261014_speaking_topics.sql to the application database.
The migration is additive and starts empty. No frontend topic fallback is used.

## Configuration

- NEXT_PUBLIC_API_URL: existing Spring origin, without /api/v1.
- NEXT_PUBLIC_SPEAKING_API_URL: FastAPI base URL, without the Spring prefix.
- NEXT_PUBLIC_LIVEKIT_URL: optional WS/WSS fallback if join-room omits serverUrl.

Restart Next.js after changing public environment variables. No provider keys belong
in public environment variables. Existing ai-service/config/enviroments.py requires
server-side LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, GROQ_API_KEY, SPEECH_KEY,
and SPEECH_REGION. Its score_api provider may also require its existing Onsei service;
that submodule was not inspected or modified.

The session is created only by a user action. Feature hooks own microphone permission,
room connection, listeners, cleanup, and start/end guards. UI renders only actual
transcript messages; pending AI status is separate. Missing scores stay unavailable,
and a genuine zero remains zero. Local media is stopped before requesting scores.

The end endpoint removes the active bot task after completion, so it does not provide
a persisted result-recovery contract. A failed/lost scoring response may not be
recoverable by retry; the UI also allows returning to topics and starting a new session.
