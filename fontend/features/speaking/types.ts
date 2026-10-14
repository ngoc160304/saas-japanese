export interface TranscriptMessage {
  id: string;
  role: 'user' | 'ai';
  message: string;
}
export type SpeakingPhase = 'idle' | 'starting' | 'active' | 'ending' | 'result' | 'error';
