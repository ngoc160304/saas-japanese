'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Room, RoomEvent, createLocalAudioTrack } from 'livekit-client';
import type { AuthUser } from '@/apis/auth/auth.type';
import { speakingAPI, serializeSpeakingIdentity } from '@/apis/speaking/speaking.api';
import type { SessionResult, SpeakingTopic } from '@/apis/speaking/speaking.type';
import { useAppStore } from '@/store/hooks';
import { requireSpeakingApiUrl } from '@/lib/speaking-axios';
import type { SpeakingPhase, TranscriptMessage } from '../types';
import { appendTranscript, readTranscriptEvent } from '../utils/session-events';
import { endServerSession, releaseSessionMedia, type SessionResources } from './session-resources';

function sessionError(error: unknown) {
  if (error instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(error.name))
    return 'Chưa được phép dùng micro. Hãy cấp quyền micro trong trình duyệt rồi thử lại.';
  if (error instanceof DOMException && error.name === 'NotFoundError')
    return 'Không tìm thấy micro. Hãy kết nối thiết bị rồi thử lại.';
  if (axios.isAxiosError(error))
    return error.response?.status === 401 || error.response?.status === 403
      ? 'Dịch vụ hội thoại từ chối phiên. Cần kiểm tra xác thực của dịch vụ.'
      : 'Không kết nối được dịch vụ hội thoại. Hãy kiểm tra kết nối rồi thử lại.';
  return error instanceof Error
    ? error.message
    : 'Chưa thể xử lý phiên hội thoại. Vui lòng thử lại.';
}

export function useSpeakingSession(user: AuthUser) {
  const store = useAppStore();
  const mounted = useRef(false);
  const resources = useRef<SessionResources | null>(null);
  const busy = useRef(false);
  const sequence = useRef(0);
  const [phase, setPhase] = useState<SpeakingPhase>('idle');
  const [room, setRoom] = useState<Room | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [pendingAi, setPendingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventWarning, setEventWarning] = useState<string | null>(null);
  const [canRetryResult, setCanRetryResult] = useState(false);

  function current(resource: SessionResources) {
    const auth = store.getState().auth;
    return (
      mounted.current &&
      resources.current === resource &&
      auth.initialized &&
      auth.user?.id === user.id &&
      Boolean(auth.accessToken)
    );
  }
  function endServer(resource: SessionResources) {
    return endServerSession(resource, (roomName) => speakingAPI.endRoom({ room_name: roomName }));
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const resource = resources.current;
      resources.current = null;
      if (resource) {
        releaseSessionMedia(resource);
        // A late create/join response is also closed by the mutation's ownership check.
        void endServerSession(resource, (roomName) =>
          speakingAPI.endRoom({ room_name: roomName }),
        )?.catch(() => undefined);
      }
    };
  }, [user.id]);

  const startMutation = useMutation({
    mutationKey: ['speaking', user.id, 'start'],
    retry: false,
    mutationFn: async ({ topic }: { topic: SpeakingTopic }) => {
      const resource: SessionResources = {
        roomName: null,
        room: null,
        microphone: null,
        detach: () => {},
        endPromise: null,
      };
      resources.current = resource;
      const ensureCurrent = () => {
        if (!current(resource)) throw new Error('Phiên đăng nhập hoặc trang đã thay đổi.');
      };
      try {
        requireSpeakingApiUrl();
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error('Micro chỉ hoạt động trên HTTPS hoặc môi trường phát triển an toàn.');
        // User-triggered acquisition creates no room or listener during Strict Mode effects.
        const microphone = await createLocalAudioTrack();
        if (!current(resource)) {
          microphone.stop();
          ensureCurrent();
        }
        resource.microphone = microphone;
        resource.roomName = (await speakingAPI.createRoom()).name;
        ensureCurrent();
        const connection = await speakingAPI.joinRoom(
          serializeSpeakingIdentity(user, topic, resource.roomName),
        );
        ensureCurrent();
        const nextRoom = new Room({ adaptiveStream: true, dynacast: true });
        resource.room = nextRoom;
        const onData = (payload: Uint8Array) => {
          if (!current(resource)) return;
          try {
            const event = readTranscriptEvent(payload);
            if (!event) return;
            const id = `message-${++sequence.current}`;
            setMessages((previous) => appendTranscript(previous, event, id));
            setPendingAi(event.type === 'user_message');
          } catch {
            setEventWarning('Một bản tin hội thoại không hợp lệ đã được bỏ qua.');
          }
        };
        const onDisconnected = () => {
          if (!current(resource)) return;
          releaseSessionMedia(resource);
          setRoom(null);
          setPendingAi(false);
          setPhase('error');
          setError(
            'Kết nối hội thoại đã ngắt. Micro đã tắt. Bạn có thể lấy đánh giá hoặc bắt đầu lại.',
          );
          void endServer(resource)?.catch(() => undefined);
        };
        nextRoom.on(RoomEvent.DataReceived, onData);
        nextRoom.on(RoomEvent.Disconnected, onDisconnected);
        resource.detach = () => {
          nextRoom.off(RoomEvent.DataReceived, onData);
          nextRoom.off(RoomEvent.Disconnected, onDisconnected);
        };
        await nextRoom.connect(connection.serverUrl, connection.participantToken, {
          autoSubscribe: true,
        });
        if (!current(resource)) void nextRoom.disconnect(true).catch(() => undefined);
        ensureCurrent();
        await nextRoom.localParticipant.publishTrack(microphone);
        ensureCurrent();
        setRoom(nextRoom);
        setCanRetryResult(true);
        setPhase('active');
      } catch (failure) {
        releaseSessionMedia(resource);
        void endServer(resource)?.catch(() => undefined);
        if (current(resource)) {
          setRoom(null);
          setPhase('error');
          setError(sessionError(failure));
        }
        throw failure;
      }
    },
  });

  const endMutation = useMutation({
    mutationKey: ['speaking', user.id, 'end'],
    retry: false,
    mutationFn: async ({ retry }: { retry: boolean }) => {
      const resource = resources.current;
      if (!resource?.roomName) throw new Error('Không có phiên hội thoại để đánh giá.');
      // Release local media before scoring; a failed result request must never leave the mic active.
      releaseSessionMedia(resource);
      setRoom(null);
      setPendingAi(false);
      if (retry) resource.endPromise = null;
      try {
        const response = await endServer(resource);
        if (current(resource)) {
          setResult(response?.session_result ?? null);
          setPhase('result');
        }
      } catch (failure) {
        if (current(resource)) {
          setError(sessionError(failure));
          setPhase('error');
        }
        throw failure;
      }
    },
  });

  async function start(topic: SpeakingTopic) {
    const auth = store.getState().auth;
    if (
      busy.current ||
      phase === 'active' ||
      !mounted.current ||
      !auth.initialized ||
      auth.user?.id !== user.id ||
      !auth.accessToken
    )
      return;
    busy.current = true;
    const old = resources.current;
    if (old) {
      releaseSessionMedia(old);
      void endServer(old)?.catch(() => undefined);
    }
    setError(null);
    setEventWarning(null);
    setMessages([]);
    setPendingAi(false);
    setResult(null);
    setCanRetryResult(false);
    setPhase('starting');
    try {
      await startMutation.mutateAsync({ topic });
    } catch {
      /* State retains the actionable error. */
    } finally {
      busy.current = false;
    }
  }

  async function end(retry = false) {
    if (busy.current || !mounted.current) return;
    busy.current = true;
    setPhase('ending');
    setError(null);
    try {
      await endMutation.mutateAsync({ retry });
    } catch {
      /* Media is already released. */
    } finally {
      busy.current = false;
    }
  }

  function reset() {
    if (busy.current) return;
    const resource = resources.current;
    resources.current = null;
    if (resource) {
      releaseSessionMedia(resource);
      void endServer(resource)?.catch(() => undefined);
    }
    setRoom(null);
    setResult(null);
    setMessages([]);
    setPendingAi(false);
    setError(null);
    setEventWarning(null);
    setPhase('idle');
    setCanRetryResult(false);
    startMutation.reset();
    endMutation.reset();
  }

  return {
    phase,
    room,
    result,
    messages,
    pendingAi,
    error,
    eventWarning,
    start,
    end,
    reset,
    canRetryResult,
  };
}
