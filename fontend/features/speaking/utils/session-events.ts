import { transcriptEventSchema, type TranscriptEvent } from '@/apis/speaking/speaking.type';
import type { TranscriptMessage } from '../types';

export function readTranscriptEvent(payload: Uint8Array): TranscriptEvent | null {
  const value: unknown = JSON.parse(new TextDecoder().decode(payload));
  if (typeof value !== 'object' || value === null || !('type' in value)) return null;
  if (value.type !== 'user_message' && value.type !== 'ai_message') return null;
  return transcriptEventSchema.parse(value);
}
export function appendTranscript(
  messages: TranscriptMessage[],
  event: TranscriptEvent,
  fallbackId: string,
) {
  const id = event.id ? `${event.type}:${event.id}` : fallbackId;
  if (messages.some((message) => message.id === id)) return messages;
  return [
    ...messages,
    {
      id,
      role: event.type === 'user_message' ? ('user' as const) : ('ai' as const),
      message: event.text,
    },
  ];
}
export function formatScore(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? String(Math.round(value))
    : 'Chưa có đánh giá';
}
