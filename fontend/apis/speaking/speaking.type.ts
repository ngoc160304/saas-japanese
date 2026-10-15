import { z } from 'zod';

export interface SpeakingTopic {
  id: string;
  title: string;
  description: string;
}
export interface JoinRoomRequest {
  room_name: string;
  user_id: string;
  user_name: string;
  topic: { id: string; title: string; description: string };
}
export interface EndRoomRequest {
  room_name: string;
}
export const createRoomSchema = z.object({ name: z.string().min(1) });
export const joinRoomSchema = z
  .object({
    serverUrl: z.string().optional(),
    participantToken: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.participantToken));
const score = z
  .number()
  .finite()
  .nullable()
  .optional()
  .transform((value) => value ?? null);
export const sessionResultSchema = z.object({
  overall: score,
  pronunciation: score,
  grammar: score,
  vocabulary: score,
  relevance: score,
  utterances: z
    .array(
      z.object({
        sentence: z.string(),
        score,
        mean_distance: score,
        error: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});
export const endRoomSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  session_result: sessionResultSchema.nullable().optional(),
});
export type SessionResult = z.infer<typeof sessionResultSchema>;
export type EndRoomResponse = z.infer<typeof endRoomSchema>;
export const transcriptEventSchema = z.object({
  type: z.enum(['user_message', 'ai_message']),
  text: z.string().trim().min(1),
  id: z.string().optional(),
});
export type TranscriptEvent = z.infer<typeof transcriptEventSchema>;
export interface SpeakingConnection {
  serverUrl: string;
  participantToken: string;
}
