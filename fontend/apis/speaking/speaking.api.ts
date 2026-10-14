import type { AuthUser } from '@/apis/auth/auth.type';
import type { ApiResponse } from '@/types/api';
import type { PageResponse } from '@/types/pagination';
import authorizeAxiosInstance from '@/lib/authorize-axios';
import speakingAxios, { requireSpeakingApiUrl } from '@/lib/speaking-axios';
import {
  createRoomSchema,
  joinRoomSchema,
  endRoomSchema,
  type SpeakingTopic,
  type JoinRoomRequest,
  type EndRoomRequest,
  type SpeakingConnection,
} from './speaking.type';

export function serializeSpeakingIdentity(
  user: AuthUser,
  topic: SpeakingTopic,
  roomName: string,
): JoinRoomRequest {
  // Participant metadata is not proof of authorization. The server must authorize independently.
  return {
    room_name: roomName,
    user_id: String(user.id),
    user_name: user.name,
    topic: { id: String(topic.id), title: topic.title, description: topic.description },
  };
}
function protocolError() {
  return new Error('Dịch vụ hội thoại trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
}
function connectionUrl(returned?: string) {
  const value = returned?.trim() || process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim();
  if (!value)
    throw new Error('Không có địa chỉ LiveKit. Cần serverUrl từ API hoặc NEXT_PUBLIC_LIVEKIT_URL.');
  try {
    const url = new URL(value);
    if (['ws:', 'wss:'].includes(url.protocol) && !url.username && !url.password) return value;
  } catch {
    /* Invalid URLs receive the same actionable error below. */
  }
  throw new Error('Địa chỉ LiveKit phải dùng giao thức WS hoặc WSS.');
}
async function createRoom() {
  const response = await speakingAxios.post<unknown>(`${requireSpeakingApiUrl()}/create-room`);
  const data = createRoomSchema.safeParse(response.data);
  if (!data.success) throw protocolError();
  return data.data;
}
async function joinRoom(request: JoinRoomRequest) {
  const response = await speakingAxios.post<unknown>(
    `${requireSpeakingApiUrl()}/join-room`,
    request,
  );
  const parsed = joinRoomSchema.safeParse(response.data);
  if (!parsed.success) throw protocolError();
  const data = parsed.data;
  const participantToken = data.participantToken;
  if (!participantToken) throw protocolError();
  return {
    serverUrl: connectionUrl(data.serverUrl),
    participantToken,
  } satisfies SpeakingConnection;
}
async function endRoom(request: EndRoomRequest) {
  const response = await speakingAxios.post<unknown>(
    `${requireSpeakingApiUrl()}/end-room`,
    request,
  );
  const parsed = endRoomSchema.safeParse(response.data);
  if (!parsed.success) throw protocolError();
  if (!parsed.data.success)
    throw new Error('Chưa thể kết thúc phiên và lấy đánh giá. Vui lòng thử lại.');
  return parsed.data;
}
async function getTopics(page: number, signal?: AbortSignal) {
  const response = await authorizeAxiosInstance.get<ApiResponse<PageResponse<SpeakingTopic>>>(
    '/speaking/topics',
    {
      params: { page, size: 12 },
      signal,
      localErrorHandling: true,
    },
  );
  return response.data.data;
}
export const speakingQueryKeys = {
  topics: (userId: number, page: number) => ['speaking', userId, 'topics', page] as const,
};
export const speakingAPI = { createRoom, joinRoom, endRoom, getTopics };
